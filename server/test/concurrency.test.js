import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { makeCtx, cityQuote, orderBody } from './helpers.js';

let c;
beforeEach(async () => { c = await makeCtx(); });
afterEach(async () => { await c.close(); });

describe('concurrency safety', () => {
  it('creates exactly one order when the same request is submitted many times at once', async () => {
    const a = await c.login('9100000001');
    const rs = await Promise.all(Array.from({ length: 8 }, () => a.post('/api/orders').set('Idempotency-Key', 'dup-1').send(orderBody())));
    expect(rs.every((r) => [200, 201].includes(r.status))).toBe(true);
    expect(new Set(rs.map((r) => r.body.order.id)).size).toBe(1);
    expect((await c.db.query('SELECT count(*)::int AS n FROM orders')).rows[0].n).toBe(1);
  });

  it('never lets parallel orders exceed a per-user coupon limit', async () => {
    const a = await c.login('9100000002');
    const rs = await Promise.all(Array.from({ length: 6 }, (_, i) => a.post('/api/orders').set('Idempotency-Key', `promo-${i}`).send(orderBody({ quote: cityQuote({ promoCode: 'FIRSTTRUCK' }) }))));
    const created = rs.filter((r) => r.status === 201);
    expect(created.filter((r) => r.body.order.pricing.discount > 0)).toHaveLength(1);
    expect(rs.filter((r) => r.status === 409).every((r) => r.body.error.code === 'price_changed')).toBe(true);
    expect((await c.db.query('SELECT count(*)::int AS n FROM promo_redemptions')).rows[0].n).toBe(1);
  });

  it('issues unique, gap-free invoice numbers when deliveries complete simultaneously', async () => {
    const admin = await c.makeAdmin();
    const drivers = [await c.makeDriver(admin, { phone: '9200000001', lat: 19.1197, lng: 72.8464 }), await c.makeDriver(admin, { phone: '9200000002', lat: 19.1197, lng: 72.8464 })];
    const custs = [await c.login('9100000003'), await c.login('9100000004')];
    const ids = [];
    for (const cu of custs) ids.push((await cu.post('/api/orders').send(orderBody())).body.order.id);
    await c.ctx.dispatcher.tick();
    const work = [];
    for (const d of drivers) {
      const offer = (await d.agent.get('/api/driver/me')).body.offers[0];
      const order = (await d.agent.post(`/api/driver/offers/${offer.id}/accept`)).body.order;
      await d.agent.post(`/api/driver/orders/${order.id}/pickup`);
      work.push({ d, id: order.id });
    }
    const otps = Object.fromEntries((await c.db.query('SELECT id, delivery_otp FROM orders')).rows.map((r) => [r.id, r.delivery_otp]));
    const results = await Promise.all(work.map(({ d, id }) => d.agent.post(`/api/driver/orders/${id}/deliver`).send({ otp: otps[id] })));
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    const nums = (await c.db.query('SELECT number FROM invoices ORDER BY number')).rows.map((r) => r.number);
    expect(nums).toEqual(['PTX/2030-31/000001', 'PTX/2030-31/000002']);
    expect(ids).toHaveLength(2);
  });
});
