import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { makeCtx, orderBody, cityQuote } from './helpers.js';

let c;
beforeEach(async () => { c = await makeCtx(); });
afterEach(async () => { await c.close(); });

const online = (over = {}) => orderBody({ paymentMethod: 'online', ...over });
const captured = (providerOrderId, paymentId, amount) => ({ event: 'payment.captured', payload: { payment: { entity: { id: paymentId, order_id: providerOrderId, amount, status: 'captured' } } } });

describe('Razorpay checkout', () => {
  it('creates a provider order for the server-computed amount and holds dispatch until paid', async () => {
    const a = await c.login('9555555551');
    const r = await a.post('/api/orders').send(online());
    expect(r.status).toBe(201);
    expect(r.body.order.status).toBe('pending_payment');
    expect(r.body.payment.keyId).toBe('rzp_test_key');
    expect(r.body.payment.amountPaise).toBe(r.body.order.total * 100);
    expect(c.rzpCalls[0].body).toMatchObject({ amount: r.body.order.total * 100, currency: 'INR', receipt: r.body.order.id });
    await c.ctx.dispatcher.tick();                       // nothing should be offered for an unpaid order
    expect((await c.db.query('SELECT count(*)::int AS n FROM order_offers')).rows[0].n).toBe(0);
  });

  it('rejects a forged signature and accepts the genuine one (idempotently)', async () => {
    const a = await c.login('9555555552');
    const { order, payment } = (await a.post('/api/orders').send(online())).body;
    const bad = await a.post(`/api/orders/${order.id}/payment/confirm`).send({ razorpay_order_id: payment.providerOrderId, razorpay_payment_id: 'pay_1', razorpay_signature: 'deadbeef' });
    expect(bad.status).toBe(400);
    expect((await a.get(`/api/orders/${order.id}`)).body.order.status).toBe('pending_payment');

    const body = { razorpay_order_id: payment.providerOrderId, razorpay_payment_id: 'pay_1', razorpay_signature: c.sign(payment.providerOrderId, 'pay_1') };
    const ok = await a.post(`/api/orders/${order.id}/payment/confirm`).send(body);
    expect(ok.status).toBe(200);
    expect(ok.body.order.paymentStatus).toBe('paid');
    expect(ok.body.order.status).toBe('searching');
    expect((await a.post(`/api/orders/${order.id}/payment/confirm`).send(body)).status).toBe(200);
    expect((await c.db.query("SELECT count(*)::int AS n FROM payments WHERE status = 'paid'")).rows[0].n).toBe(1);
  });

  it('lets a customer resume payment for an unpaid order, but only that customer', async () => {
    const a = await c.login('9555555570');
    const b = await c.login('9555555571');
    const { order, payment } = (await a.post('/api/orders').send(online())).body;
    const again = await a.get(`/api/orders/${order.id}/payment`);
    expect(again.body.payment.providerOrderId).toBe(payment.providerOrderId);
    expect((await b.get(`/api/orders/${order.id}/payment`)).status).toBe(404);
    await c.webhook(captured(payment.providerOrderId, 'pay_resume', payment.amountPaise), 'evt_resume');
    expect((await a.get(`/api/orders/${order.id}/payment`)).status).toBe(409);
  });

  it("will not confirm another customer's order or a signature for a different order", async () => {
    const a = await c.login('9555555553');
    const b = await c.login('9555555554');
    const o1 = (await a.post('/api/orders').send(online())).body;
    const o2 = (await b.post('/api/orders').send(online())).body;
    const sig = c.sign(o2.payment.providerOrderId, 'pay_x');
    expect((await a.post(`/api/orders/${o1.order.id}/payment/confirm`).send({ razorpay_order_id: o2.payment.providerOrderId, razorpay_payment_id: 'pay_x', razorpay_signature: sig })).status).toBe(400);
    expect((await a.post(`/api/orders/${o2.order.id}/payment/confirm`).send({ razorpay_order_id: o2.payment.providerOrderId, razorpay_payment_id: 'pay_x', razorpay_signature: sig })).status).toBe(404);
  });

  it('fails the booking cleanly if the provider is down', async () => {
    const down = await makeCtx();
    const failing = down.ctx.payments;
    failing.createOrder = async () => { throw Object.assign(new Error('boom'), { status: 502 }); };
    const a = await down.login('9555555555');
    const r = await a.post('/api/orders').send(online());
    expect(r.status).toBeGreaterThanOrEqual(500);
    expect((await a.get('/api/orders')).body.orders[0].status).toBe('cancelled');
    await down.close();
  });
});

describe('Razorpay webhooks', () => {
  it('rejects a bad signature, and a tampered body', async () => {
    const a = await c.login('9555555556');
    const { payment } = (await a.post('/api/orders').send(online())).body;
    const ev = captured(payment.providerOrderId, 'pay_w1', payment.amountPaise);
    expect((await c.webhook(ev, 'evt_1', 'wrong-secret')).status).toBe(400);
    expect((await c.http.post('/api/payments/webhook').set('Content-Type', 'application/json').set('x-razorpay-signature', 'abc').send(JSON.stringify(ev))).status).toBe(400);
  });

  it('marks the order paid once, even when Razorpay retries the same event', async () => {
    const a = await c.login('9555555557');
    const { order, payment } = (await a.post('/api/orders').send(online())).body;
    const ev = captured(payment.providerOrderId, 'pay_w2', payment.amountPaise);
    expect((await c.webhook(ev, 'evt_same')).body.ok).toBe(true);
    expect((await c.webhook(ev, 'evt_same')).body.duplicate).toBe(true);
    expect((await c.webhook(ev, 'evt_other')).status).toBe(200);          // different event id, already paid: still a no-op
    const o = (await a.get(`/api/orders/${order.id}`)).body.order;
    expect(o.paymentStatus).toBe('paid');
    expect(o.status).toBe('searching');
    expect(o.events.filter((e) => e.type === 'payment_paid')).toHaveLength(1);
  });

  it('refuses a captured amount that does not match the order', async () => {
    const a = await c.login('9555555558');
    const { order, payment } = (await a.post('/api/orders').send(online())).body;
    const r = await c.webhook(captured(payment.providerOrderId, 'pay_w3', 100), 'evt_amt');
    expect(r.status).toBe(400);
    expect((await a.get(`/api/orders/${order.id}`)).body.order.paymentStatus).toBe('pending');
  });

  it('records payment failures without cancelling the order', async () => {
    const a = await c.login('9555555559');
    const { order, payment } = (await a.post('/api/orders').send(online())).body;
    await c.webhook({ event: 'payment.failed', payload: { payment: { entity: { id: 'pay_f', order_id: payment.providerOrderId } } } }, 'evt_fail');
    const o = (await a.get(`/api/orders/${order.id}`)).body.order;
    expect(o.paymentStatus).toBe('failed');
    expect(o.status).toBe('pending_payment');
  });
});

describe('refunds', () => {
  it('refunds the full amount when a paid order is cancelled', async () => {
    const a = await c.login('9555555560');
    const { order, payment } = (await a.post('/api/orders').send(online())).body;
    await c.webhook(captured(payment.providerOrderId, 'pay_r1', payment.amountPaise), 'evt_r1');
    const r = await a.post(`/api/orders/${order.id}/cancel`).send({ reason: 'changed my mind' });
    expect(r.body.order.status).toBe('cancelled');
    const call = c.rzpCalls.find((x) => x.url.includes('/refund'));
    expect(call.url).toContain('/payments/pay_r1/refund');
    expect(call.body.amount).toBe(order.total * 100);
    expect((await a.get(`/api/orders/${order.id}`)).body.order.paymentStatus).toBe('refunded');
    expect(c.sms.sent.some((m) => /cancelled/.test(m.body))).toBe(true);
  });

  it('refunds money that arrives after the customer already cancelled', async () => {
    const a = await c.login('9555555561');
    const { order, payment } = (await a.post('/api/orders').send(online())).body;
    expect((await a.post(`/api/orders/${order.id}/cancel`).send({})).status).toBe(200);
    await c.webhook(captured(payment.providerOrderId, 'pay_late', payment.amountPaise), 'evt_late');
    const o = (await a.get(`/api/orders/${order.id}`)).body.order;
    expect(o.status).toBe('cancelled');
    expect(o.paymentStatus).toBe('refunded');
    expect(c.rzpCalls.some((x) => x.url.includes('/payments/pay_late/refund'))).toBe(true);
  });

  it('keeps a cancellation fee when configured and the driver was already assigned', async () => {
    const fee = await makeCtx({ CANCEL_FEE_RUPEES: '30' });
    const a = await fee.login('9555555562');
    const admin = await fee.makeAdmin();
    const drv = await fee.makeDriver(admin, { phone: '9666666662' });
    const { order, payment } = (await a.post('/api/orders').send(online())).body;
    await fee.webhook(captured(payment.providerOrderId, 'pay_fee', payment.amountPaise), 'evt_fee');
    await fee.ctx.dispatcher.tick();
    const offer = (await drv.agent.get('/api/driver/me')).body.offers[0];
    await drv.agent.post(`/api/driver/offers/${offer.id}/accept`);
    const r = await a.post(`/api/orders/${order.id}/cancel`).send({});
    expect(r.body.order.cancelFee).toBe(30);
    expect(fee.rzpCalls.find((x) => x.url.includes('/refund')).body.amount).toBe((order.total - 30) * 100);
    await fee.close();
  });
});

describe('packers and parcel', () => {
  it('holds a future packers booking as scheduled, then starts dispatch an hour before the slot', async () => {
    const a = await c.login('9555555563');
    const admin = await c.makeAdmin();
    await c.makeDriver(admin, { phone: '9666666663', vehicleId: 'pickup-8ft' });
    const slot = new Date(c.clock.now().getTime() + 3 * 86_400_000);
    const quote = { serviceType: 'packers', cityId: 'mumbai', planId: '2bhk', pickup: cityQuote().pickup, drop: cityQuote().drop, hasLiftPickup: false };
    const { order, payment } = (await a.post('/api/orders').send(orderBody({ quote, paymentMethod: 'online', scheduledFor: slot.toISOString() }))).body;
    expect(order.pricing.total).toBe(7800 + 400);
    await c.webhook(captured(payment.providerOrderId, 'pay_pk', payment.amountPaise), 'evt_pk');
    expect((await a.get(`/api/orders/${order.id}`)).body.order.status).toBe('scheduled');
    c.clock.advance(3 * 86_400_000 - 30 * 60_000);
    await c.ctx.dispatcher.tick();
    expect((await a.get(`/api/orders/${order.id}`)).body.order.status).toBe('searching');
  });

  it('confirms a paid parcel for manual assignment by an admin', async () => {
    const a = await c.login('9555555564');
    const admin = await c.makeAdmin();
    const drv = await c.makeDriver(admin, { phone: '9666666664' });
    const quote = { serviceType: 'parcel', cityId: 'mumbai', mode: 'air', weightKg: 2.5, pickupPincode: '400001', dropPincode: '560001' };
    const { order, payment } = (await a.post('/api/orders').send(orderBody({ quote, paymentMethod: 'online' }))).body;
    expect(order.pricing.subtotal).toBe(180 + Math.round(2.5 * 65));
    await c.webhook(captured(payment.providerOrderId, 'pay_pc', payment.amountPaise), 'evt_pc');
    expect((await a.get(`/api/orders/${order.id}`)).body.order.status).toBe('confirmed');
    await c.ctx.dispatcher.tick();
    expect((await a.get(`/api/orders/${order.id}`)).body.order.status).toBe('confirmed');   // never auto-dispatched
    const asg = await admin.post(`/api/admin/orders/${order.id}/assign`).send({ driverId: drv.id });
    expect(asg.body.order.status).toBe('assigned');
  });
});
