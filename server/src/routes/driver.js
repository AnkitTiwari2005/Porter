import express from 'express';
import { z } from 'zod';
import { wrap, validate } from '../lib/http.js';
import { requireRole } from '../middleware.js';
import { conflict, forbidden } from '../lib/errors.js';
import { DOC_COLUMNS, docIssues } from '../services/drivers.js';

export function driverRoutes({ config, db, orders, dispatcher, hub, clock }) {
  const r = express.Router();
  r.use('/driver', requireRole('driver'));

  const loadDriver = async (userId) => {
    const d = (await db.query(`SELECT d.*, ${DOC_COLUMNS} FROM drivers d WHERE d.user_id = $1`, [userId])).rows[0];
    if (!d) throw forbidden('Driver profile not found.');
    return d;
  };
  const requireApproved = (d) => { if (d.status !== 'approved') throw forbidden('Your driver account is not active.'); };

  r.get('/driver/me', wrap(async (req, res) => {
    const d = await loadDriver(req.user.id);
    const active = (await db.query("SELECT id FROM orders WHERE driver_id = $1 AND status IN ('assigned','in_transit') ORDER BY assigned_at DESC LIMIT 1", [req.user.id])).rows[0];
    const offers = (await db.query(
      `SELECT f.id, f.expires_at, o.id AS order_id, o.pickup_address, o.drop_address, o.distance_km, o.vehicle_name, o.total, o.payment_method
       FROM order_offers f JOIN orders o ON o.id = f.order_id
       WHERE f.driver_id = $1 AND f.status = 'pending' AND f.expires_at > $2 AND o.status = 'searching'`, [req.user.id, clock.now()])).rows;
    const earn = (await db.query('SELECT COALESCE(sum(amount),0)::int AS total, count(*)::int AS trips, COALESCE(sum(amount) FILTER (WHERE created_at >= $2),0)::int AS today FROM driver_earnings WHERE driver_id = $1',
      [req.user.id, new Date(new Date(clock.now()).setHours(0, 0, 0, 0))])).rows[0];
    res.json({
      driver: { name: req.user.name, phone: req.user.phone, cityId: d.city_id, vehicleId: d.vehicle_id, vehicleNo: d.vehicle_no, status: d.status, online: d.online, rating: d.rating, ratingCount: d.rating_count, lat: d.lat, lng: d.lng,
        documents: { licenseNo: d.license_no, licenseExpiry: d.license_expiry, rcExpiry: d.rc_expiry, insuranceExpiry: d.insurance_expiry },
        documentIssues: docIssues(d, clock.now().toISOString().slice(0, 10)) },
      activeOrder: active ? await orders.getForUser(req.user, active.id) : null,
      offers: offers.map((o) => ({ id: o.id, orderId: o.order_id, pickup: o.pickup_address, drop: o.drop_address, distanceKm: o.distance_km, vehicleName: o.vehicle_name,
        earn: Math.round((o.total * config.DRIVER_PAYOUT_PERCENT) / 100), collectCash: o.payment_method === 'cod' ? o.total : 0, expiresAt: o.expires_at })),
      earnings: earn
    });
  }));

  r.post('/driver/online', validate(z.object({ online: z.boolean() })), wrap(async (req, res) => {
    const d = await loadDriver(req.user.id);
    requireApproved(d);
    await db.query('UPDATE drivers SET online = $2 WHERE user_id = $1', [req.user.id, req.body.online]);
    if (req.body.online) dispatcher.kick();
    res.json({ online: req.body.online });
  }));

  r.post('/driver/location', validate(z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })), wrap(async (req, res) => {
    const d = await loadDriver(req.user.id);
    requireApproved(d);
    const now = clock.now();
    await db.query('UPDATE drivers SET lat = $2, lng = $3, location_at = $4 WHERE user_id = $1', [req.user.id, req.body.lat, req.body.lng, now]);
    const active = (await db.query("SELECT id FROM orders WHERE driver_id = $1 AND status IN ('assigned','in_transit')", [req.user.id])).rows;
    for (const o of active) hub.publish(`order:${o.id}`, { type: 'driver_location', lat: req.body.lat, lng: req.body.lng, at: now.toISOString() });
    res.json({ ok: true });
  }));

  r.post('/driver/offers/:id/accept', wrap(async (req, res) => {
    const d = await loadDriver(req.user.id);
    requireApproved(d);
    if (!d.online) throw conflict('offline', 'Go online to accept trips.');
    res.json({ order: await dispatcher.acceptOffer(req.user.id, req.params.id) });
  }));
  r.post('/driver/offers/:id/reject', wrap(async (req, res) => { res.json(await dispatcher.rejectOffer(req.user.id, req.params.id)); }));

  r.post('/driver/orders/:id/pickup', wrap(async (req, res) => { res.json({ order: await orders.driverPickup(req.user.id, req.params.id) }); }));
  r.post('/driver/orders/:id/deliver', validate(z.object({ otp: z.string().regex(/^[0-9]{4}$/, 'Enter the 4-digit OTP') })), wrap(async (req, res) => {
    res.json({ order: await orders.driverDeliver(req.user.id, req.params.id, req.body.otp) });
  }));

  r.get('/driver/stream', wrap(async (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const send = (ev) => res.write(`event: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`);
    send({ type: 'hello' });
    const unsub = hub.subscribe(`driver:${req.user.id}`, send);
    const hb = setInterval(() => res.write(':hb\n\n'), 25_000);
    req.on('close', () => { clearInterval(hb); unsub(); });
  }));

  return r;
}
