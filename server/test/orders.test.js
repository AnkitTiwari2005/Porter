import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { makeCtx, cityQuote, orderBody } from './helpers.js';

let c;
beforeEach(async () => { c = await makeCtx(); });
afterEach(async () => { await c.close(); });

const bin = (res, cb) => { const ch = []; res.on('data', (d) => ch.push(d)); res.on('end', () => cb(null, Buffer.concat(ch))); };

describe('COD delivery lifecycle (end to end)', () => {
  it('books, dispatches, picks up, delivers with OTP, pays the driver and issues an invoice', async () => {
    const cust = await c.login('9333333333', 'Cust');
    const admin = await c.makeAdmin();
    const drv = await c.makeDriver(admin, { phone: '9444444444' });

    const create = await cust.post('/api/orders').set('Idempotency-Key', 'k-1').send(orderBody());
    expect(create.status).toBe(201);
    const id = create.body.order.id;
    expect(create.body.order.status).toBe('searching');
    expect(create.body.order.paymentStatus).toBe('cod_due');

    const replay = await cust.post('/api/orders').set('Idempotency-Key', 'k-1').send(orderBody());
    expect(replay.status).toBe(200);
    expect(replay.body.order.id).toBe(id);
    expect((await cust.get('/api/orders')).body.orders).toHaveLength(1);

    await c.ctx.dispatcher.tick();
    const me = (await drv.agent.get('/api/driver/me')).body;
    expect(me.offers).toHaveLength(1);
    expect(me.offers[0].earn).toBe(Math.round(create.body.order.total * 0.82));

    const acc = await drv.agent.post(`/api/driver/offers/${me.offers[0].id}/accept`);
    expect(acc.status).toBe(200);
    expect(acc.body.order.deliveryOtp).toBeUndefined();            // the driver must never see the OTP
    expect(acc.body.order.collectCash).toBe(create.body.order.total);

    const seen = (await cust.get(`/api/orders/${id}`)).body.order;
    expect(seen.status).toBe('assigned');
    expect(seen.driver.name).toMatch(/Driver/);
    expect(seen.deliveryOtp).toMatch(/^\d{4}$/);

    expect((await drv.agent.post(`/api/driver/orders/${id}/pickup`)).status).toBe(200);
    const otp = c.lastOtp('9222222222');
    expect(otp).toBe(seen.deliveryOtp);                              // SMS went to the receiver

    const wrong = await drv.agent.post(`/api/driver/orders/${id}/deliver`).send({ otp: otp === '0000' ? '1111' : '0000' });
    expect(wrong.status).toBe(400);
    const done = await drv.agent.post(`/api/driver/orders/${id}/deliver`).send({ otp });
    expect(done.status).toBe(200);
    expect(done.body.order.status).toBe('delivered');

    const final = (await cust.get(`/api/orders/${id}`)).body.order;
    expect(final.paymentStatus).toBe('cod_collected');
    expect(final.events.map((e) => e.type)).toEqual(expect.arrayContaining(['created', 'driver_assigned', 'picked_up', 'delivered']));

    expect((await drv.agent.get('/api/driver/me')).body.earnings.total).toBe(Math.round(create.body.order.total * 0.82));

    const inv = (await c.db.query('SELECT number, data FROM invoices')).rows[0];
    expect(inv.number).toBe('PTX/2030-31/000001');
    expect(inv.data.cgst + inv.data.sgst + inv.data.igst).toBe(final.pricing.gst);
    expect(inv.data.lines.reduce((s, l) => s + l.amount, 0)).toBe(final.pricing.taxable);
    const pdf = await cust.get(`/api/orders/${id}/invoice.pdf`).buffer(true).parse(bin);
    expect(pdf.status).toBe(200);
    expect(pdf.body.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('locks delivery after 5 wrong OTPs until an admin resets it', async () => {
    const cust = await c.login('9333333334');
    const admin = await c.makeAdmin();
    const drv = await c.makeDriver(admin, { phone: '9444444445' });
    const id = (await cust.post('/api/orders').send(orderBody())).body.order.id;
    await c.ctx.dispatcher.tick();
    const offer = (await drv.agent.get('/api/driver/me')).body.offers[0];
    await drv.agent.post(`/api/driver/offers/${offer.id}/accept`);
    await drv.agent.post(`/api/driver/orders/${id}/pickup`);
    const otp = c.lastOtp('9222222222');
    const bad = otp === '9999' ? '1234' : '9999';
    for (let i = 0; i < 5; i += 1) expect((await drv.agent.post(`/api/driver/orders/${id}/deliver`).send({ otp: bad })).status).toBe(400);
    expect((await drv.agent.post(`/api/driver/orders/${id}/deliver`).send({ otp })).status).toBe(429);
    await admin.post(`/api/admin/orders/${id}/reset-otp`);
    expect((await drv.agent.post(`/api/driver/orders/${id}/deliver`).send({ otp })).status).toBe(200);
  });

  it('keeps orders private between customers and hides driver-only data', async () => {
    const a = await c.login('9333333335');
    const b = await c.login('9333333336');
    const id = (await a.post('/api/orders').send(orderBody())).body.order.id;
    expect((await b.get(`/api/orders/${id}`)).status).toBe(404);
    expect((await b.post(`/api/orders/${id}/cancel`).send({})).status).toBe(404);
    expect((await b.get('/api/orders')).body.orders).toHaveLength(0);
  });

  it('exposes a public tracking link without phone numbers or the OTP', async () => {
    const a = await c.login('9333333337');
    const admin = await c.makeAdmin();
    const drv = await c.makeDriver(admin, { phone: '9444444446' });
    const o = (await a.post('/api/orders').send(orderBody())).body.order;
    await c.ctx.dispatcher.tick();
    const offer = (await drv.agent.get('/api/driver/me')).body.offers[0];
    await drv.agent.post(`/api/driver/offers/${offer.id}/accept`);
    const pub = await c.http.get(`/api/track/${o.trackToken}`);
    expect(pub.status).toBe(200);
    const text = JSON.stringify(pub.body);
    expect(text).not.toMatch(/9111111111|9222222222|deliveryOtp|9444444446/);
    expect(pub.body.order.driver.name).toBe('Driver');            // first name only
    expect((await c.http.get('/api/track/not-a-token')).status).toBe(404);
  });

  it('rejects cash on delivery for parcels when online payments are available', async () => {
    const a = await c.login('9333333338');
    const parcel = { serviceType: 'parcel', cityId: 'mumbai', mode: 'surface', weightKg: 3, pickupPincode: '400001', dropPincode: '560001' };
    const r = await a.post('/api/orders').send(orderBody({ quote: parcel, paymentMethod: 'cod' }));
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('cod_not_allowed');
  });
});

describe('cancellation and promos', () => {
  it('lets a customer cancel before pickup but not once in transit; admin can still cancel', async () => {
    const a = await c.login('9333333339');
    const admin = await c.makeAdmin();
    const drv = await c.makeDriver(admin, { phone: '9444444447' });
    const id = (await a.post('/api/orders').send(orderBody())).body.order.id;
    await c.ctx.dispatcher.tick();
    const offer = (await drv.agent.get('/api/driver/me')).body.offers[0];
    await drv.agent.post(`/api/driver/offers/${offer.id}/accept`);
    await drv.agent.post(`/api/driver/orders/${id}/pickup`);
    const no = await a.post(`/api/orders/${id}/cancel`).send({});
    expect(no.status).toBe(409);
    expect(no.body.error.code).toBe('cannot_cancel');
    const yes = await admin.post(`/api/admin/orders/${id}/cancel`).send({ reason: 'goods damaged at pickup' });
    expect(yes.body.order.status).toBe('cancelled');
    expect((await drv.agent.get('/api/driver/me')).body.activeOrder).toBeNull();
  });

  it('enforces per-user coupon limits and frees the coupon when the order is cancelled', async () => {
    const a = await c.login('9333333340');
    const withPromo = (over = {}) => orderBody({ quote: cityQuote({ promoCode: 'FIRSTTRUCK', ...over }) });
    const first = await a.post('/api/orders').send(withPromo());
    expect(first.body.order.pricing.discount).toBeGreaterThan(0);
    const q2 = await c.http.post('/api/quotes').set('Cookie', first.request.header.Cookie || '').send(cityQuote({ promoCode: 'FIRSTTRUCK' }));
    void q2;
    const again = await a.post('/api/quotes').send(cityQuote({ promoCode: 'FIRSTTRUCK' }));
    expect(again.body.promo.valid).toBe(false);
    await a.post(`/api/orders/${first.body.order.id}/cancel`).send({});
    const freed = await a.post('/api/quotes').send(cityQuote({ promoCode: 'FIRSTTRUCK' }));
    expect(freed.body.promo.valid).toBe(true);
  });

  it('applies promo category rules (FREEDEL is 2-wheeler only)', async () => {
    const truck = await c.http.post('/api/quotes').send(cityQuote({ promoCode: 'FREEDEL' }));
    expect(truck.body.promo.valid).toBe(false);
    expect(truck.body.pricing.discount).toBe(0);
    const bike = await c.http.post('/api/quotes').send(cityQuote({ vehicleId: 'two-wheeler', promoCode: 'FREEDEL' }));
    expect(bike.body.promo.valid).toBe(true);
  });
});

describe('live tracking stream', () => {
  it('pushes the order snapshot and the driver location over Server-Sent Events', async () => {
    const a = await c.login('9333333341');
    const admin = await c.makeAdmin();
    const drv = await c.makeDriver(admin, { phone: '9444444448' });
    const id = (await a.post('/api/orders').send(orderBody())).body.order.id;
    await c.ctx.dispatcher.tick();
    const offer = (await drv.agent.get('/api/driver/me')).body.offers[0];
    await drv.agent.post(`/api/driver/offers/${offer.id}/accept`);

    const r1 = await c.http.post('/api/auth/otp/request').send({ phone: '9333333341' });
    const r2 = await c.http.post('/api/auth/otp/verify').send({ phone: '9333333341', code: r1.body.devOtp });
    const cookie = r2.headers['set-cookie'][0].split(';')[0];

    const server = c.ctx.app.listen(0);
    const port = server.address().port;
    const events = await new Promise((resolve, reject) => {
      let buf = '';
      const req = http.get({ port, path: `/api/orders/${id}/stream`, headers: { Cookie: cookie } }, (res) => {
        res.on('data', async (d) => {
          buf += d.toString();
          if (buf.includes('event: order') && !buf.includes('event: driver_location')) {
            await drv.agent.post('/api/driver/location').send({ lat: 19.12, lng: 72.85 });
          }
          if (buf.includes('event: driver_location')) { req.destroy(); resolve(buf); }
        });
      });
      req.on('error', (e) => (e.code === 'ECONNRESET' ? null : reject(e)));
      setTimeout(() => { req.destroy(); reject(new Error(`timeout; got: ${buf}`)); }, 8000);
    });
    server.close();
    expect(events).toContain('"status":"assigned"');
    expect(events).toContain('"lat":19.12');
    const other = await c.login('9333333342');
    expect((await other.get(`/api/orders/${id}/stream`).buffer(false).ok(() => true)).status).toBe(404);
  });
});
