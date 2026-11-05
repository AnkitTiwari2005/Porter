import express from 'express';
import { z } from 'zod';
import { wrap, validate } from '../lib/http.js';
import { createOrderSchema } from '../lib/schemas.js';
import { requireUser, limiter } from '../middleware.js';
import { notFound, forbidden } from '../lib/errors.js';

export function orderRoutes({ config, db, orders, invoices, hub }) {
  const r = express.Router();

  r.post('/orders', requireUser, limiter(config, { windowMs: 60_000, max: 20 }), validate(createOrderSchema), wrap(async (req, res) => {
    if (req.user.role !== 'customer') throw forbidden('Only customer accounts can book.');
    const key = String(req.headers['idempotency-key'] || '').slice(0, 100) || null;
    const out = await orders.createOrder(req.user, req.body, key);
    res.status(out.replayed ? 200 : 201).json({ order: out.order, payment: out.payment });
  }));

  r.get('/orders', requireUser, wrap(async (req, res) => {
    res.json({ orders: await orders.listForCustomer(req.user.id, { limit: 50 }) });
  }));

  r.get('/orders/:id', requireUser, wrap(async (req, res) => {
    res.json({ order: await orders.getForUser(req.user, req.params.id) });
  }));

  r.post('/orders/:id/cancel', requireUser, validate(z.object({ reason: z.string().trim().max(200).optional() })), wrap(async (req, res) => {
    res.json({ order: await orders.cancel(req.user, req.params.id, req.body.reason) });
  }));

  r.post('/orders/:id/payment/confirm', requireUser, validate(z.object({
    razorpay_order_id: z.string().max(100), razorpay_payment_id: z.string().max(100), razorpay_signature: z.string().max(200)
  })), wrap(async (req, res) => {
    res.json({ order: await orders.confirmCheckout(req.user, req.params.id, req.body) });
  }));

  r.get('/orders/:id/payment', requireUser, wrap(async (req, res) => {
    res.json({ payment: await orders.paymentInfo(req.user, req.params.id) });
  }));

  r.get('/orders/:id/invoice.pdf', requireUser, wrap(async (req, res) => {
    const o = await orders.getForUser(req.user, req.params.id); // authorises
    if (o.status !== 'delivered') throw notFound('Invoice is available after delivery.');
    const inv = await invoices.getForOrder(o.id);
    const pdf = await invoices.renderPdf(inv);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${inv.number.replace(/\//g, '-')}.pdf"`);
    res.send(pdf);
  }));

  // Live updates for the customer (and admin): status changes and the driver's position.
  r.get('/orders/:id/stream', requireUser, wrap(async (req, res) => {
    const first = await orders.getForUser(req.user, req.params.id); // 404 if not theirs
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    send('order', first);
    const unsub = hub.subscribe(`order:${req.params.id}`, async (ev) => {
      if (ev.type === 'driver_location') return send('driver_location', ev);
      try { send('order', await orders.getForUser(req.user, req.params.id)); } catch { /* order vanished */ }
    });
    const hb = setInterval(() => res.write(':hb\n\n'), 25_000);
    req.on('close', () => { clearInterval(hb); unsub(); });
  }));

  // Public, unguessable share link for the receiver. No phone numbers, no OTP.
  r.get('/track/:token', limiter(config, { windowMs: 60_000, max: 60 }), wrap(async (req, res) => {
    const o = await orders.getByToken(req.params.token);
    if (!o) throw notFound('Tracking link not found.');
    res.setHeader('Cache-Control', 'no-store');
    res.json({ order: o });
  }));

  void db;
  return r;
}

export function webhookRoute({ orders }) {
  const r = express.Router();
  // Mounted with express.raw() so the HMAC is computed over the exact bytes Razorpay sent.
  r.post('/', wrap(async (req, res) => {
    const out = await orders.handleWebhook(req.body.toString('utf8'), req.headers['x-razorpay-signature'], req.headers['x-razorpay-event-id']);
    res.json(out);
  }));
  return r;
}
