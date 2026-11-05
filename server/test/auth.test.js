import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { makeCtx, cityQuote, orderBody } from './helpers.js';
import { loadConfig } from '../src/config.js';

let c;
beforeEach(async () => { c = await makeCtx(); });
afterEach(async () => { await c.close(); });

describe('OTP authentication', () => {
  it('logs in with a valid code and sets an httpOnly, SameSite cookie', async () => {
    const a = c.agent();
    const r1 = await a.post('/api/auth/otp/request').send({ phone: '9876543210' });
    expect(r1.status).toBe(200);
    const r2 = await a.post('/api/auth/otp/verify').send({ phone: '9876543210', code: r1.body.devOtp, name: 'Asha' });
    expect(r2.status).toBe(200);
    const cookie = r2.headers['set-cookie'][0];
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect((await a.get('/api/me')).body.user.name).toBe('Asha');
  });

  it('never stores the code in plain text and never returns it when dev echo is off', async () => {
    const c2 = await makeCtx({ OTP_DEV_ECHO: 'false' });
    const r = await c2.http.post('/api/auth/otp/request').send({ phone: '9876543211' });
    expect(r.body.devOtp).toBeUndefined();
    const row = (await c2.db.query('SELECT code_hash FROM otp_challenges')).rows[0];
    const sent = c2.sms.sent[0].body.match(/^(\d{6})/)[1];
    expect(row.code_hash).not.toContain(sent);
    await c2.close();
  });

  it('locks the challenge after 5 wrong guesses, even for the right code', async () => {
    const r1 = await c.http.post('/api/auth/otp/request').send({ phone: '9876543212' });
    for (let i = 0; i < 5; i += 1) {
      const bad = await c.http.post('/api/auth/otp/verify').send({ phone: '9876543212', code: '000000' });
      expect(bad.status).toBe(400);
    }
    const good = await c.http.post('/api/auth/otp/verify').send({ phone: '9876543212', code: r1.body.devOtp });
    expect(good.status).toBe(429);
  });

  it('rejects expired and reused codes', async () => {
    const r1 = await c.http.post('/api/auth/otp/request').send({ phone: '9876543213' });
    c.clock.advance(6 * 60_000);
    expect((await c.http.post('/api/auth/otp/verify').send({ phone: '9876543213', code: r1.body.devOtp })).body.error.code).toBe('otp_expired');
    const r2 = await c.http.post('/api/auth/otp/request').send({ phone: '9876543213' });
    expect((await c.http.post('/api/auth/otp/verify').send({ phone: '9876543213', code: r2.body.devOtp })).status).toBe(200);
    expect((await c.http.post('/api/auth/otp/verify').send({ phone: '9876543213', code: r2.body.devOtp })).status).toBe(400);
  });

  it('rate-limits OTP requests per phone', async () => {
    for (let i = 0; i < 3; i += 1) expect((await c.http.post('/api/auth/otp/request').send({ phone: '9876543214' })).status).toBe(200);
    expect((await c.http.post('/api/auth/otp/request').send({ phone: '9876543214' })).status).toBe(429);
  });

  it('returns a clear 502 (and burns the challenge) when the SMS provider fails', async () => {
    const c3 = await makeCtx();
    c3.sms.send = async () => { throw new Error('provider down'); };
    const r = await c3.http.post('/api/auth/otp/request').send({ phone: '9876543299' });
    expect(r.status).toBe(502);
    expect(r.body.error.code).toBe('sms_unavailable');
    expect((await c3.db.query('SELECT consumed FROM otp_challenges')).rows[0].consumed).toBe(true);
    await c3.close();
  });

  it('rejects invalid phone numbers', async () => {
    expect((await c.http.post('/api/auth/otp/request').send({ phone: '12345' })).status).toBe(400);
    expect((await c.http.post('/api/auth/otp/request').send({ phone: '5876543210' })).status).toBe(400);
  });

  it('logout revokes the session server-side', async () => {
    const r1 = await c.http.post('/api/auth/otp/request').send({ phone: '9876543215' });
    const r2 = await c.http.post('/api/auth/otp/verify').send({ phone: '9876543215', code: r1.body.devOtp });
    const cookie = r2.headers['set-cookie'][0].split(';')[0];
    expect((await c.http.get('/api/me').set('Cookie', cookie)).body.user.phone).toBe('9876543215');
    await c.http.post('/api/auth/logout').set('Cookie', cookie);
    expect((await c.http.get('/api/me').set('Cookie', cookie)).body.user).toBeNull();
  });

  it('blocks suspended accounts from logging in', async () => {
    await c.login('9876543216');
    await c.db.query("UPDATE users SET status = 'suspended' WHERE phone = '9876543216'");
    const r1 = await c.http.post('/api/auth/otp/request').send({ phone: '9876543216' });
    const r2 = await c.http.post('/api/auth/otp/verify').send({ phone: '9876543216', code: r1.body.devOtp });
    expect(r2.status).toBe(403);
  });
});

describe('request security', () => {
  it('blocks state-changing requests from a foreign origin', async () => {
    const r = await c.http.post('/api/auth/otp/request').set('Origin', 'https://evil.example').send({ phone: '9876543217' });
    expect(r.status).toBe(403);
  });
  it('requires login to book, and customers cannot reach admin or driver APIs', async () => {
    expect((await c.http.post('/api/orders').send(orderBody())).status).toBe(401);
    const cust = await c.login('9876543218');
    expect((await cust.get('/api/admin/stats')).status).toBe(403);
    expect((await cust.get('/api/driver/me')).status).toBe(403);
  });
  it('rejects malformed JSON cleanly', async () => {
    const r = await c.http.post('/api/quotes').set('Content-Type', 'application/json').send('{bad');
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('invalid_json');
  });
  it('does not leak internals on server errors', async () => {
    const r = await c.http.get('/api/does-not-exist');
    expect(r.status).toBe(404);
    expect(JSON.stringify(r.body)).not.toMatch(/stack|node_modules/);
  });
});

describe('production configuration guards', () => {
  const base = { NODE_ENV: 'production', DATABASE_URL: 'postgres://u:p@db/x', APP_SECRET: 'a'.repeat(40), CORS_ORIGINS: 'https://app.example.com', SMS_PROVIDER: 'twilio', TWILIO_ACCOUNT_SID: 'AC1', TWILIO_AUTH_TOKEN: 't', TWILIO_FROM: '+1555', PAYMENTS_PROVIDER: 'razorpay', RAZORPAY_KEY_ID: 'k', RAZORPAY_KEY_SECRET: 's', RAZORPAY_WEBHOOK_SECRET: 'w', SUPPLIER_NAME: 'X Pvt Ltd', SUPPLIER_ADDRESS: 'Somewhere' };
  it('accepts a complete production config', () => { expect(() => loadConfig(base)).not.toThrow(); });
  it.each([
    ['console SMS', { SMS_PROVIDER: 'console' }],
    ['dev OTP echo', { OTP_DEV_ECHO: 'true' }],
    ['placeholder secret', { APP_SECRET: 'change-me-'.padEnd(40, 'x') }],
    ['no CORS origin', { CORS_ORIGINS: '' }],
    ['pglite database', { DATABASE_URL: 'pglite://memory' }],
    ['insecure cookies', { COOKIE_SECURE: 'false' }],
    ['unset invoice details', { SUPPLIER_NAME: 'Portex Logistics (set SUPPLIER_NAME)' }],
    ['razorpay without webhook secret', { RAZORPAY_WEBHOOK_SECRET: '' }]
  ])('refuses to start with %s', (_n, over) => { expect(() => loadConfig({ ...base, ...over })).toThrow(/configuration/i); });
});

describe('server-side pricing is authoritative', () => {
  it('matches the shared pricing rules and ignores client-supplied prices', async () => {
    const q = await c.http.post('/api/quotes').send({ ...cityQuote(), pricing: { total: 1 }, total: 1 });
    expect(q.status).toBe(200);
    expect(q.body.pricing.total).toBeGreaterThan(100);
    expect(q.body.pricing.total).toBe(q.body.pricing.taxable + q.body.pricing.gst);
  });
  it('does not charge helpers on a bike', async () => {
    const q = await c.http.post('/api/quotes').send(cityQuote({ vehicleId: 'two-wheeler', helperCount: 2 }));
    expect(q.body.pricing.helperCharge).toBe(0);
  });
  it('rejects an order whose expected total is stale (409 price_changed)', async () => {
    const cust = await c.login('9876543219');
    const r = await cust.post('/api/orders').send(orderBody({ expectedTotal: 1 }));
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('price_changed');
    expect(r.body.error.details.total).toBeGreaterThan(1);
  });
  it('picks up admin tariff changes immediately', async () => {
    const admin = await c.makeAdmin();
    const before = (await c.http.post('/api/quotes').send(cityQuote())).body.pricing.total;
    const v = (await admin.get('/api/admin/vehicles')).body.vehicles.find((x) => x.id === 'tata-ace');
    const put = await admin.put('/api/admin/vehicles/tata-ace').send({ basePrice: v.base_price + 100, ratePerKm: v.rate_per_km });
    expect(put.status).toBe(200);
    const after = (await c.http.post('/api/quotes').send(cityQuote())).body.pricing.total;
    expect(after).toBeGreaterThan(before);
    expect((await admin.get('/api/admin/audit')).body.entries[0].action).toBe('vehicle.update');
    const cust = await c.login('9876543220');
    expect((await cust.post('/api/orders').send(orderBody({ expectedTotal: before }))).status).toBe(409);
  });
  it('rejects locations outside the city, identical points and over-long city trips', async () => {
    const out = await c.http.post('/api/quotes').send(cityQuote({ drop: { address: 'Connaught Place, Delhi', lat: 28.6315, lng: 77.2167 } }));
    expect(out.body.error.code).toBe('outside_city');
    const same = await c.http.post('/api/quotes').send(cityQuote({ drop: cityQuote().pickup }));
    expect(same.body.error.code).toBe('same_location');
    const far = await c.http.post('/api/quotes').send(cityQuote({ pickup: { address: 'Virar', lat: 19.455, lng: 72.811 }, drop: { address: 'Panvel', lat: 18.99, lng: 73.11 } }));
    expect(far.body.error.code).toBe('too_far');
  });
  it('geocodes an address when no coordinates are sent, and refuses unknown ones', async () => {
    const ok = await c.http.post('/api/quotes').send(cityQuote({ pickup: { address: 'Andheri West, Mumbai' }, drop: { address: 'Powai' } }));
    expect(ok.status).toBe(200);
    const bad = await c.http.post('/api/quotes').send(cityQuote({ pickup: { address: 'zzzz nowhere lane' }, drop: { address: 'Powai' } }));
    expect(bad.body.error.code).toBe('address_not_found');
  });
});
