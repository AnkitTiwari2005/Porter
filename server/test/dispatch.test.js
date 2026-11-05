import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { makeCtx, orderBody } from './helpers.js';

let c;
beforeEach(async () => { c = await makeCtx(); });
afterEach(async () => { await c.close(); });

const offersOf = async (d) => (await d.agent.get('/api/driver/me')).body.offers;

describe('dispatch', () => {
  it('offers to the nearest eligible driver, then the next one when the offer expires', async () => {
    const a = await c.login('9777777771');
    const admin = await c.makeAdmin();
    const near = await c.makeDriver(admin, { phone: '9888888881', lat: 19.1197, lng: 72.8464 });
    const mid = await c.makeDriver(admin, { phone: '9888888882', lat: 19.07, lng: 72.88 });
    await a.post('/api/orders').send(orderBody());
    await c.ctx.dispatcher.tick();
    expect(await offersOf(near)).toHaveLength(1);
    expect(await offersOf(mid)).toHaveLength(0);
    c.clock.advance(31_000);
    await near.agent.post('/api/driver/location').send({ lat: 19.1197, lng: 72.8464 });
    await mid.agent.post('/api/driver/location').send({ lat: 19.07, lng: 72.88 });
    await c.ctx.dispatcher.tick();
    expect(await offersOf(near)).toHaveLength(0);                 // expired and never re-offered
    expect(await offersOf(mid)).toHaveLength(1);
  });

  it('skips offline, wrong-vehicle, out-of-radius, stale-location and busy drivers', async () => {
    const a = await c.login('9777777772');
    const admin = await c.makeAdmin();
    const offline = await c.makeDriver(admin, { phone: '9888888883', online: false });
    const wrongVehicle = await c.makeDriver(admin, { phone: '9888888884', vehicleId: 'two-wheeler' });
    const far = await c.makeDriver(admin, { phone: '9888888885', lat: 19.3, lng: 73.1 });
    const stale = await c.makeDriver(admin, { phone: '9888888886' });
    c.clock.advance(11 * 60_000);                                  // stale's location is now 11 minutes old
    const ok = await c.makeDriver(admin, { phone: '9888888887' });
    await a.post('/api/orders').send(orderBody());
    await c.ctx.dispatcher.tick();
    for (const d of [offline, wrongVehicle, far, stale]) expect(await offersOf(d)).toHaveLength(0);
    expect(await offersOf(ok)).toHaveLength(1);
    await ok.agent.post(`/api/driver/offers/${(await offersOf(ok))[0].id}/accept`);
    await a.post('/api/orders').send(orderBody());                 // a second order: the only fresh driver is busy
    await c.ctx.dispatcher.tick();
    expect(await offersOf(ok)).toHaveLength(0);
  });

  it('lets only one of two simultaneous accepts win', async () => {
    const a = await c.login('9777777773');
    const admin = await c.makeAdmin();
    const d = await c.makeDriver(admin, { phone: '9888888888' });
    await a.post('/api/orders').send(orderBody());
    await c.ctx.dispatcher.tick();
    const [offer] = await offersOf(d);
    const rs = await Promise.all([1, 2].map(() => d.agent.post(`/api/driver/offers/${offer.id}/accept`)));
    expect(rs.map((r) => r.status).sort()).toEqual([200, 409]);
  });

  it('refuses to accept an expired offer', async () => {
    const a = await c.login('9777777774');
    const admin = await c.makeAdmin();
    const d = await c.makeDriver(admin, { phone: '9888888889' });
    await a.post('/api/orders').send(orderBody());
    await c.ctx.dispatcher.tick();
    const [offer] = await offersOf(d);
    c.clock.advance(31_000);
    const r = await d.agent.post(`/api/driver/offers/${offer.id}/accept`);
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('offer_expired');
  });

  it('cancels with a refund when nobody accepts within the timeout', async () => {
    const a = await c.login('9777777775');
    const { order } = (await a.post('/api/orders').send(orderBody())).body;
    c.clock.advance(11 * 60_000);
    await c.ctx.dispatcher.tick();
    const o = (await a.get(`/api/orders/${order.id}`)).body.order;
    expect(o.status).toBe('cancelled');
    expect(o.cancelledBy).toBe('system');
    expect(o.cancelReason).toBe('no_driver_available');
  });

  it('a driver can reject an offer, and a suspended driver is locked out', async () => {
    const a = await c.login('9777777776');
    const admin = await c.makeAdmin();
    const d = await c.makeDriver(admin, { phone: '9888888890' });
    await a.post('/api/orders').send(orderBody());
    await c.ctx.dispatcher.tick();
    const [offer] = await offersOf(d);
    expect((await d.agent.post(`/api/driver/offers/${offer.id}/reject`)).status).toBe(200);
    expect(await offersOf(d)).toHaveLength(0);
    await admin.patch(`/api/admin/drivers/${d.id}`).send({ status: 'suspended' });
    expect((await d.agent.get('/api/driver/me')).status).toBe(401);   // sessions revoked
  });
});

describe('admin tools', () => {
  it('reports stats, lists and searches orders, and exports a CSV safe from formula injection', async () => {
    const a = await c.login('9777777777');
    const admin = await c.makeAdmin();
    const quote = orderBody().quote;
    await a.post('/api/orders').send(orderBody({ quote: { ...quote, pickup: { ...quote.pickup, address: '=HYPERLINK("http://evil","x")' } } }));
    const stats = (await admin.get('/api/admin/stats')).body;
    expect(stats.byStatus.searching).toBe(1);
    expect(stats.today.orders).toBe(1);
    const list = (await admin.get('/api/admin/orders?q=hyperlink')).body;
    expect(list.total).toBe(1);
    expect((await admin.get('/api/admin/orders?status=delivered')).body.total).toBe(0);
    const csv = (await admin.get('/api/admin/orders.csv')).text;
    expect(csv).toContain(`"'=HYPERLINK(""http://evil"",""x"")"`);
  });

  it('creates drivers and promos with validation and an audit trail', async () => {
    const admin = await c.makeAdmin();
    expect((await admin.post('/api/admin/drivers').send({ phone: '123', name: 'X', cityId: 'mumbai', vehicleId: 'tata-ace', vehicleNo: 'MH02AB1234' })).status).toBe(400);
    const p = await admin.post('/api/admin/promos').send({ code: 'diwali25', discountPercent: 25, maxDiscount: 100, minFare: 200, maxUsesPerUser: 1 });
    expect(p.status).toBe(201);
    expect(p.body.promo.code).toBe('DIWALI25');
    expect((await admin.post('/api/admin/promos').send({ code: 'DIWALI25', discountPercent: 25, maxDiscount: 100 })).status).toBe(409);
    expect((await admin.get('/api/admin/audit')).body.entries.map((e) => e.action)).toContain('promo.create');
  });

  it('accepts enterprise leads, ignores honeypot bots, and validates input', async () => {
    const ok = await c.http.post('/api/leads').send({ companyName: 'Acme Foods', contactName: 'Ravi', phone: '+91 98765 43210', email: 'ravi@acme.test', details: { fleet: '10-50' } });
    expect(ok.status).toBe(201);
    const bot = await c.http.post('/api/leads').send({ companyName: 'Spam Co', contactName: 'Bot', phone: '9876543210', website: 'http://spam' });
    expect(bot.status).toBe(200);
    expect((await c.http.post('/api/leads').send({ companyName: 'X', contactName: 'Y', phone: '1' })).status).toBe(400);
    const admin = await c.makeAdmin();
    const leads = (await admin.get('/api/admin/leads')).body.leads;
    expect(leads).toHaveLength(1);
    expect(leads[0].phone).toBe('9876543210');
  });
});
