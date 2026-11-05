import crypto from 'node:crypto';
import request from 'supertest';
import pg from 'pg';
import { loadConfig } from '../src/config.js';
import { createDb } from '../src/db.js';
import { migrate } from '../src/migrate.js';
import { seed } from '../src/seed.js';
import { createApp } from '../src/app.js';
import { createPayments } from '../src/providers/payments.js';
import { createSms } from '../src/providers/sms.js';

export const KEY_SECRET = 'rzp_test_secret_123';
export const WEBHOOK_SECRET = 'whsec_test_456';

// Set TEST_DATABASE_URL=postgres://user:pw@host:5432/postgres to run the whole suite against a REAL Postgres server
// (each test gets its own throwaway database). Without it, tests use in-process Postgres (PGlite).
const ADMIN_URL = process.env.TEST_DATABASE_URL;
async function provisionDatabase() {
  if (!ADMIN_URL) return { url: 'pglite://memory', drop: async () => {} };
  const name = `ptx_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${name}`);
  await admin.end();
  const u = new URL(ADMIN_URL);
  u.pathname = `/${name}`;
  return {
    url: u.toString(),
    drop: async () => {
      const a = new pg.Client({ connectionString: ADMIN_URL });
      await a.connect();
      await a.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
      await a.end();
    }
  };
}

export async function makeCtx(env = {}) {
  const database = await provisionDatabase();
  const config = loadConfig({
    NODE_ENV: 'test', DATABASE_URL: database.url, APP_SECRET: 'test-secret-'.padEnd(48, 'x'), OTP_DEV_ECHO: 'true',
    PAYMENTS_PROVIDER: 'razorpay', RAZORPAY_KEY_ID: 'rzp_test_key', RAZORPAY_KEY_SECRET: KEY_SECRET, RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET,
    SUPPLIER_NAME: 'Test Logistics Pvt Ltd', SUPPLIER_ADDRESS: '1 Test Road, Mumbai', SUPPLIER_STATE: 'Maharashtra', SUPPLIER_GSTIN: '27AAAAA0000A1Z5',
    OFFER_TTL_SECONDS: '30', DISPATCH_TIMEOUT_MINUTES: '10', RUN_DISPATCHER: 'false', ...env
  });
  const db = await createDb(config.DATABASE_URL);
  await migrate(db, { info() {} });
  await seed(db);

  // A fixed fake date well in the future: cookie jars compare cookie expiry against the REAL clock,
  // so a fake date in the past would make short-lived (admin) sessions look expired.
  const clock = { t: new Date('2030-11-04T10:00:00Z'), now() { return new Date(this.t); }, advance(ms) { this.t = new Date(this.t.getTime() + ms); } };
  const rzpCalls = [];
  let seq = 0;
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body);
    rzpCalls.push({ url, body });
    if (url.endsWith('/orders')) return { ok: true, json: async () => ({ id: `order_T${++seq}` }) };
    if (url.includes('/refund')) return { ok: true, json: async () => ({ id: `rfnd_T${++seq}`, status: 'processed' }) };
    return { ok: false, status: 404, json: async () => ({}) };
  };
  const sms = createSms(config);
  const payments = createPayments(config, { fetchImpl });
  const ctx = createApp({ config, db, deps: { clock, sms, payments } });
  const http = request(ctx.app);

  const agent = () => request.agent(ctx.app);
  async function login(phone, name = 'Test User') {
    const a = agent();
    const r1 = await a.post('/api/auth/otp/request').send({ phone });
    const r2 = await a.post('/api/auth/otp/verify').send({ phone, code: r1.body.devOtp, name });
    if (r2.status !== 200) throw new Error(`login failed ${r2.status} ${JSON.stringify(r2.body)}`);
    return a;
  }
  async function makeAdmin(phone = '9000000001') {
    await db.query("INSERT INTO users (phone, name, role) VALUES ($1,'Admin','admin') ON CONFLICT (phone) DO UPDATE SET role='admin'", [phone]);
    return login(phone, 'Admin');
  }
  async function makeDriver(admin, { phone, cityId = 'mumbai', vehicleId = 'tata-ace', vehicleNo = 'MH02AB1234', lat = 19.1197, lng = 72.8464, online = true }) {
    const r = await admin.post('/api/admin/drivers').send({ phone, name: `Driver ${phone.slice(-4)}`, cityId, vehicleId, vehicleNo });
    if (r.status !== 201) throw new Error(`driver create ${r.status} ${JSON.stringify(r.body)}`);
    const a = await login(phone, `Driver ${phone.slice(-4)}`);
    if (online) await a.post('/api/driver/online').send({ online: true });
    await a.post('/api/driver/location').send({ lat, lng });
    return { agent: a, id: r.body.id };
  }
  const sign = (orderId, paymentId) => crypto.createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  const webhook = (event, id = `evt_${Math.random()}`, secret = WEBHOOK_SECRET) => {
    const raw = JSON.stringify(event);
    return http.post('/api/payments/webhook').set('Content-Type', 'application/json')
      .set('x-razorpay-signature', crypto.createHmac('sha256', secret).update(raw).digest('hex')).set('x-razorpay-event-id', id).send(raw);
  };
  const lastOtp = (phone) => [...sms.sent].reverse().find((m) => m.phone === phone && /delivery OTP/.test(m.body))?.body.match(/OTP for order \S+ is (\d{4})/)?.[1];

  return { config, db, clock, ctx, http, agent, login, makeAdmin, makeDriver, sign, webhook, sms, rzpCalls, lastOtp, close: async () => { await db.close(); await database.drop(); } };
}

export const cityQuote = (over = {}) => ({
  serviceType: 'city', cityId: 'mumbai', vehicleId: 'tata-ace',
  pickup: { address: 'Andheri West, Mumbai', lat: 19.1197, lng: 72.8464 },
  drop: { address: 'Powai, Mumbai', lat: 19.1176, lng: 72.906 }, ...over
});
export const orderBody = (over = {}) => ({
  quote: cityQuote(), paymentMethod: 'cod',
  sender: { name: 'Sender One', phone: '9111111111' }, receiver: { name: 'Receiver Two', phone: '9222222222' }, ...over
});
