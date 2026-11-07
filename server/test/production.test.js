import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { makeCtx, cityQuote, orderBody } from './helpers.js';
import { PgRateStore } from '../src/lib/pgRateStore.js';
import { totpAt } from '../src/lib/totp.js';
import { decrypt } from '../src/lib/crypto.js';

let c;
beforeEach(async () => { c = await makeCtx(); });
afterEach(async () => { await c.close(); });

const online = (over = {}) => orderBody({ paymentMethod: 'online', ...over });

async function deliver(cust, drv, body = orderBody()) {
  const { order } = (await cust.post('/api/orders').send(body)).body;
  await c.ctx.dispatcher.tick();
  const offer = (await drv.agent.get('/api/driver/me')).body.offers[0];
  await drv.agent.post(`/api/driver/offers/${offer.id}/accept`);
  await drv.agent.post(`/api/driver/orders/${order.id}/pickup`);
  const otp = (await c.db.query('SELECT delivery_otp FROM orders WHERE id = $1', [order.id])).rows[0].delivery_otp;
  await drv.agent.post(`/api/driver/orders/${order.id}/deliver`).send({ otp });
  return order.id;
}

describe('payment reconciliation (lost webhooks)', () => {
  it('recovers a paid order whose webhook never arrived', async () => {
    const a = await c.login('9300000001');
    const { order, payment } = (await a.post('/api/orders').send(online())).body;
    c.rzpPayments[payment.providerOrderId] = [{ id: 'pay_lost', status: 'captured', amount: payment.amountPaise }];
    expect((await c.ctx.services.orders.reconcilePayments()).recovered).toBe(0); // too early: not older than 3 minutes
    c.clock.advance(4 * 60_000);
    const r = await c.ctx.services.orders.reconcilePayments();
    expect(r.recovered).toBe(1);
    const o = (await a.get(`/api/orders/${order.id}`)).body.order;
    expect(o.paymentStatus).toBe('paid');
    expect(o.status).toBe('searching');
  });

  it('cancels checkouts abandoned past the timeout, and tolerates provider errors', async () => {
    const a = await c.login('9300000002');
    const { order, payment } = (await a.post('/api/orders').send(online())).body;
    c.rzpPayments[payment.providerOrderId] = 'ERROR';
    c.clock.advance(40 * 60_000);
    expect((await c.ctx.services.orders.reconcilePayments()).expired).toBe(0);      // provider down: do not guess
    c.rzpPayments[payment.providerOrderId] = [];
    expect((await c.ctx.services.orders.reconcilePayments()).expired).toBe(1);
    const o = (await a.get(`/api/orders/${order.id}`)).body.order;
    expect(o.status).toBe('cancelled');
    expect(o.cancelReason).toBe('payment_timeout');
  });
});

describe('multi-instance safety', () => {
  it('lets exactly one instance lead the background jobs, and fails over when the lease expires', async () => {
    const other = c.secondInstance();
    expect(await c.ctx.dispatcher.tryLead()).toBe(true);
    expect(await other.dispatcher.tryLead()).toBe(false);
    expect(await c.ctx.dispatcher.tryLead()).toBe(true);        // the leader renews its own lease
    c.clock.advance(60_000);                                       // leader stopped renewing
    expect(await other.dispatcher.tryLead()).toBe(true);
    expect(await c.ctx.dispatcher.tryLead()).toBe(false);
    other.close();
  });

  it('shares rate-limit counters through the database', async () => {
    const store = new PgRateStore({ db: c.db, prefix: 't', clock: c.clock });
    store.init({ windowMs: 60_000 });
    expect((await store.increment('ip1')).totalHits).toBe(1);
    expect((await store.increment('ip1')).totalHits).toBe(2);
    expect((await store.increment('ip2')).totalHits).toBe(1);
    c.clock.advance(61_000);
    expect((await store.increment('ip1')).totalHits).toBe(1);   // window rolled over
    await store.resetKey('ip1');
    expect((await store.increment('ip1')).totalHits).toBe(1);
  });

  it('enforces one limit across two API instances', async () => {
    const lim = await makeCtx({ RATE_LIMIT_IN_TESTS: 'true', RATE_LIMIT_STORE: 'postgres' });
    const other = lim.secondInstance();
    const { default: request } = await import('supertest');
    const second = request(other.app);
    const codes = [];
    for (let i = 0; i < 24; i += 1) codes.push((await (i % 2 ? lim.http : second).post('/api/auth/otp/request').send({ phone: 'bad' })).status);
    expect(codes.slice(0, 20).every((s) => s === 400)).toBe(true);
    expect(codes.slice(20).every((s) => s === 429)).toBe(true);
    other.close();
    await lim.close();
  });

  it.runIf(!!process.env.TEST_DATABASE_URL)('delivers live events across instances (Postgres LISTEN/NOTIFY)', async () => {
    const other = c.secondInstance();
    await c.ctx.hub.start();
    await other.hub.start();
    await new Promise((r) => setTimeout(r, 300));
    const got = new Promise((resolve) => other.hub.subscribe('order:X', resolve));
    c.ctx.hub.publish('order:X', { type: 'driver_location', lat: 1, lng: 2 });
    expect(await Promise.race([got, new Promise((r) => setTimeout(() => r('timeout'), 3000))])).toEqual({ type: 'driver_location', lat: 1, lng: 2 });
    c.ctx.hub.stop(); other.close();
  });

  it('housekeeping suspends drivers with expired documents and purges stale rows', async () => {
    const admin = await c.makeAdmin();
    const d = await c.makeDriver(admin, { phone: '9300000003' });
    await c.db.query("UPDATE drivers SET insurance_expiry = '2020-01-01' WHERE user_id = $1", [d.id]);
    await c.db.query("INSERT INTO otp_challenges (phone, code_hash, expires_at, created_at) VALUES ('9000000000','x', now(), now() - interval '3 days')");
    const out = await c.ctx.dispatcher.housekeeping();
    expect(out.suspendedForExpiredDocs).toBe(1);
    const row = (await c.db.query('SELECT status, online FROM drivers WHERE user_id = $1', [d.id])).rows[0];
    expect(row).toEqual({ status: 'suspended', online: false });
    expect((await c.db.query("SELECT count(*)::int AS n FROM otp_challenges WHERE phone = '9000000000'")).rows[0].n).toBe(0);
  });
});

describe('driver verification', () => {
  const docs = { licenseNo: 'MH0220200012345', licenseExpiry: '2040-01-01', rcExpiry: '2040-01-01', insuranceExpiry: '2040-01-01' };
  const create = (admin, phone, documents) => admin.post('/api/admin/drivers').send({ phone, name: 'New Driver', cityId: 'mumbai', vehicleId: 'tata-ace', vehicleNo: 'MH02AB1234', ...(documents ? { documents } : {}) });

  it('blocks approval until valid, unexpired documents are on file', async () => {
    const admin = await c.makeAdmin();
    const id = (await create(admin, '9300000004')).body.id;
    const blocked = await admin.patch(`/api/admin/drivers/${id}`).send({ status: 'approved' });
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.code).toBe('documents_invalid');
    expect(blocked.body.error.details.length).toBeGreaterThanOrEqual(4);

    await admin.patch(`/api/admin/drivers/${id}/documents`).send({ ...docs, insuranceExpiry: '2020-05-05' });
    expect((await admin.patch(`/api/admin/drivers/${id}`).send({ status: 'approved' })).body.error.details[0]).toMatch(/insurance expired on 2020-05-05/i);

    await admin.patch(`/api/admin/drivers/${id}/documents`).send(docs);
    expect((await admin.patch(`/api/admin/drivers/${id}`).send({ status: 'approved' })).status).toBe(200);
    const listed = (await admin.get('/api/admin/drivers')).body.drivers.find((x) => x.id === id);
    expect(listed.status).toBe('approved');
    expect(listed.license_expiry).toBe('2040-01-01');
    expect(listed.verified_at).toBeTruthy();
  });

  it('keeps unverified drivers offline and reports document problems to them', async () => {
    const admin = await c.makeAdmin();
    await create(admin, '9300000005', { ...docs, rcExpiry: '2020-01-01' });
    const a = await c.login('9300000005');
    const me = (await a.get('/api/driver/me')).body;
    expect(me.driver.status).toBe('pending');
    expect(me.driver.documentIssues[0]).toMatch(/registration/i);
    expect((await a.post('/api/driver/online').send({ online: true })).status).toBe(403);
  });

  it('rejects malformed document dates', async () => {
    const admin = await c.makeAdmin();
    expect((await create(admin, '9300000006', { ...docs, licenseExpiry: '31/12/2030' })).status).toBe(400);
    expect((await create(admin, '9300000006', { ...docs, rcExpiry: '2030-13-45' })).status).toBe(400);
  });
});

describe('driver ratings', () => {
  it('averages ratings, and only allows one rating per delivered order by its customer', async () => {
    const admin = await c.makeAdmin();
    const drv = await c.makeDriver(admin, { phone: '9300000007' });
    const cust = await c.login('9300000008');
    const other = await c.login('9300000009');
    const pending = (await cust.post('/api/orders').send(orderBody())).body.order.id;
    expect((await cust.post(`/api/orders/${pending}/rating`).send({ stars: 5 })).status).toBe(409);   // not delivered yet
    await cust.post(`/api/orders/${pending}/cancel`).send({});

    const o1 = await deliver(cust, drv);
    expect((await other.post(`/api/orders/${o1}/rating`).send({ stars: 5 })).status).toBe(404);
    expect((await cust.post(`/api/orders/${o1}/rating`).send({ stars: 6 })).status).toBe(400);
    const r1 = await cust.post(`/api/orders/${o1}/rating`).send({ stars: 4, comment: 'Careful driver' });
    expect(r1.body.order.rating).toEqual({ stars: 4, comment: 'Careful driver' });
    expect((await cust.post(`/api/orders/${o1}/rating`).send({ stars: 1 })).body.error.code).toBe('already_rated');
    expect(Number((await c.db.query('SELECT rating FROM drivers WHERE user_id = $1', [drv.id])).rows[0].rating)).toBe(4);

    const o2 = await deliver(cust, drv);
    await cust.post(`/api/orders/${o2}/rating`).send({ stars: 2 });
    const row = (await c.db.query('SELECT rating, rating_count FROM drivers WHERE user_id = $1', [drv.id])).rows[0];
    expect(Number(row.rating)).toBe(3);
    expect(row.rating_count).toBe(2);
  });
});

describe('multi-stop trips', () => {
  it('prices and routes pickup -> stop -> drop, and stores the stop', async () => {
    const direct = (await c.http.post('/api/quotes').send(cityQuote())).body;
    const stop = { address: 'Bandra West, Mumbai', lat: 19.0596, lng: 72.8295 };
    const viaStop = (await c.http.post('/api/quotes').send(cityQuote({ stop }))).body;
    expect(viaStop.distanceKm).toBeGreaterThan(direct.distanceKm);
    expect(viaStop.pricing.stopCharge).toBe(50);
    expect(direct.pricing.stopCharge).toBe(0);
    expect(viaStop.route.line.length).toBeGreaterThan(direct.route.line.length);
    expect(viaStop.stop.address).toBe('Bandra West, Mumbai');

    const a = await c.login('9300000010');
    const { order } = (await a.post('/api/orders').send(orderBody({ quote: cityQuote({ stop }), expectedTotal: viaStop.pricing.total }))).body;
    expect(order.stop.address).toBe('Bandra West, Mumbai');
    expect(order.pricing.stopCharge).toBe(50);
  });
  it('rejects a stop outside the city', async () => {
    const r = await c.http.post('/api/quotes').send(cityQuote({ stop: { address: 'Connaught Place', lat: 28.6315, lng: 77.2167 } }));
    expect(r.body.error.code).toBe('outside_city');
  });
});

describe('admin two-factor authentication', () => {
  let m;
  beforeEach(async () => { m = await makeCtx({ ADMIN_REQUIRE_TOTP: 'true' }); });
  afterEach(async () => { await m.close(); });
  const phone = '9000000001';
  const codeNow = async () => {
    const enc = (await m.db.query('SELECT totp_secret FROM users WHERE phone = $1', [phone])).rows[0].totp_secret;
    return totpAt(decrypt(m.config.APP_SECRET, enc), m.clock.now().getTime());
  };

  it('forces setup on first login, then a code on every login, and blocks everything until then', async () => {
    const admin = await m.makeAdmin(phone);
    expect((await admin.get('/api/me')).body.user.mfa).toBe('setup');
    expect((await admin.get('/api/admin/stats')).body.error.code).toBe('mfa_required');
    expect((await admin.get('/api/orders')).status).toBe(401);

    const setup = await admin.post('/api/auth/totp/setup');
    expect(setup.body.secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(setup.body.otpauthUrl).toMatch(/^otpauth:\/\/totp\//);
    const stored = (await m.db.query('SELECT totp_secret FROM users WHERE phone = $1', [phone])).rows[0].totp_secret;
    expect(stored).not.toContain(setup.body.secret);                       // encrypted at rest

    expect((await admin.post('/api/auth/totp/enable').send({ code: '000000' })).status).toBe(400);
    expect((await admin.post('/api/auth/totp/enable').send({ code: await codeNow() })).status).toBe(200);
    expect((await admin.get('/api/admin/stats')).status).toBe(200);

    // a fresh login now needs the code
    const again = await m.makeAdmin(phone);
    expect((await again.get('/api/me')).body.user.mfa).toBe('verify');
    expect((await again.get('/api/admin/stats')).status).toBe(401);
    expect((await again.post('/api/auth/totp/verify').send({ code: await codeNow() })).status).toBe(400); // replay of the code used at enrolment
    m.clock.advance(31_000);
    expect((await again.post('/api/auth/totp/verify').send({ code: await codeNow() })).status).toBe(200);
    expect((await again.get('/api/admin/stats')).status).toBe(200);
    expect((await again.get('/api/me')).body.user.mfa).toBeNull();
  });

  it('destroys the session after 5 wrong codes', async () => {
    const admin = await m.makeAdmin(phone);
    await admin.post('/api/auth/totp/setup');
    await admin.post('/api/auth/totp/enable').send({ code: await codeNow() });
    const again = await m.makeAdmin(phone);
    for (let i = 0; i < 5; i += 1) expect((await again.post('/api/auth/totp/verify').send({ code: '111111' })).status).toBe(400);
    expect((await again.post('/api/auth/totp/verify').send({ code: '111111' })).status).toBe(429);
    expect((await again.get('/api/me')).body.user).toBeNull();
  });

  it('is only for administrators, and does not affect customers', async () => {
    const cust = await m.login('9300000011');
    expect((await cust.get('/api/me')).body.user.mfa).toBeNull();
    expect((await cust.post('/api/auth/totp/setup')).status).toBe(403);
    expect((await cust.get('/api/orders')).status).toBe(200);
  });
});

describe('operations endpoints', () => {
  it('serves metrics only with the configured token', async () => {
    expect((await c.http.get('/internal/metrics')).status).toBe(404);                   // not configured
    const m = await makeCtx({ METRICS_TOKEN: 'metrics-token-123' });
    expect((await m.http.get('/internal/metrics')).status).toBe(401);
    expect((await m.http.get('/internal/metrics').set('Authorization', 'Bearer nope')).status).toBe(401);
    const a = await m.login('9300000012');
    await a.post('/api/orders').send(orderBody());
    const r = await m.http.get('/internal/metrics').set('Authorization', 'Bearer metrics-token-123');
    expect(r.status).toBe(200);
    expect(r.text).toContain('portex_up 1');
    expect(r.text).toContain('portex_orders{status="searching"} 1');
    expect(r.text).toContain('portex_dispatch_backlog 1');
    await m.close();
  });

  it('voids the login code and reports a clear error when the SMS provider fails', async () => {
    c.sms.send = async () => { throw new Error('provider exploded: secret-account-id'); };
    const r = await c.http.post('/api/auth/otp/request').send({ phone: '9300000013' });
    expect(r.status).toBe(502);
    expect(r.body.error.code).toBe('sms_unavailable');
    expect(JSON.stringify(r.body)).not.toContain('secret-account-id');
    expect((await c.db.query("SELECT consumed FROM otp_challenges WHERE phone = '9300000013'")).rows[0].consumed).toBe(true);
  });
});
