import express from 'express';
import { z } from 'zod';
import { wrap, validate } from '../lib/http.js';
import { requireRole } from '../middleware.js';
import { phone, driverDocsSchema } from '../lib/schemas.js';
import { DOC_COLUMNS, docIssues } from '../services/drivers.js';
import { audit } from '../services/audit.js';
import { badRequest, notFound, conflict } from '../lib/errors.js';
import { cityById } from '../../../shared/cities.js';

const csvCell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};

export function adminRoutes({ db, orders, auth, clock }) {
  const r = express.Router();
  r.use('/admin', requireRole('admin'));

  r.get('/admin/stats', wrap(async (_req, res) => {
    const startOfDay = new Date(new Date(clock.now()).setHours(0, 0, 0, 0));
    const by = (await db.query('SELECT status, count(*)::int AS n FROM orders GROUP BY status')).rows;
    const rev = (await db.query("SELECT COALESCE(sum(total),0)::int AS gmv, count(*)::int AS n FROM orders WHERE status <> 'cancelled' AND status <> 'pending_payment' AND created_at >= $1", [startOfDay])).rows[0];
    const done = (await db.query("SELECT count(*) FILTER (WHERE status = 'delivered')::int AS delivered, count(*) FILTER (WHERE status = 'cancelled')::int AS cancelled FROM orders")).rows[0];
    const drivers = (await db.query("SELECT count(*) FILTER (WHERE online AND status = 'approved')::int AS online, count(*)::int AS total FROM drivers")).rows[0];
    res.json({ byStatus: Object.fromEntries(by.map((x) => [x.status, x.n])), today: { gmv: rev.gmv, orders: rev.n }, completionRate: done.delivered + done.cancelled ? Math.round((done.delivered / (done.delivered + done.cancelled)) * 100) : null, drivers });
  }));

  const listQuery = z.object({ status: z.string().optional(), q: z.string().trim().max(80).optional(), limit: z.coerce.number().int().min(1).max(200).default(50), offset: z.coerce.number().int().min(0).default(0) });
  async function queryOrders({ status, q, limit, offset }) {
    const where = [];
    const params = [];
    if (status && status !== 'all') { params.push(status); where.push(`o.status = $${params.length}`); }
    if (q) { params.push(`%${q.toLowerCase()}%`); where.push(`(lower(o.id) LIKE $${params.length} OR lower(o.pickup_address) LIKE $${params.length} OR lower(o.drop_address) LIKE $${params.length} OR o.sender_phone LIKE $${params.length})`); }
    const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = (await db.query(`SELECT count(*)::int AS n FROM orders o ${w}`, params)).rows[0].n;
    const rows = (await db.query(
      `SELECT o.*, du.name AS driver_name, du.phone AS driver_phone, d.vehicle_no, d.rating AS driver_rating, d.lat AS driver_lat, d.lng AS driver_lng, d.location_at AS driver_location_at
       FROM orders o LEFT JOIN drivers d ON d.user_id = o.driver_id LEFT JOIN users du ON du.id = d.user_id ${w}
       ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}`, params)).rows;
    return { rows, total };
  }

  r.get('/admin/orders', validate(listQuery, 'query'), wrap(async (req, res) => {
    const { rows, total } = await queryOrders(req.query);
    res.json({ total, orders: rows.map((o) => orders.present(o, 'admin')) });
  }));

  r.get('/admin/orders.csv', validate(listQuery.partial(), 'query'), wrap(async (req, res) => {
    const { rows } = await queryOrders({ ...req.query, limit: 5000, offset: 0 });
    const head = ['Order', 'Created', 'Status', 'Service', 'Pickup', 'Drop', 'Vehicle', 'Total (INR)', 'Payment', 'Payment status', 'Driver'];
    const lines = rows.map((o) => [o.id, new Date(o.created_at).toISOString(), o.status, o.service_type, o.pickup_address, o.drop_address, o.vehicle_name, o.total, o.payment_method, o.payment_status, o.driver_name || ''].map(csvCell).join(','));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send([head.map(csvCell).join(','), ...lines].join('\n'));
  }));

  r.get('/admin/orders/:id', wrap(async (req, res) => { res.json({ order: await orders.getForUser(req.user, req.params.id) }); }));
  r.post('/admin/orders/:id/assign', validate(z.object({ driverId: z.string().uuid() })), wrap(async (req, res) => { res.json({ order: await orders.adminAssign(req.user.id, req.params.id, req.body.driverId) }); }));
  r.post('/admin/orders/:id/cancel', validate(z.object({ reason: z.string().trim().min(3).max(200) })), wrap(async (req, res) => {
    await audit(db, { actorId: req.user.id, action: 'order.cancel', entity: 'order', entityId: req.params.id, after: { reason: req.body.reason } });
    res.json({ order: await orders.cancel(req.user, req.params.id, req.body.reason) });
  }));
  r.post('/admin/orders/:id/reset-otp', wrap(async (req, res) => { await orders.adminResetOtp(req.user.id, req.params.id); res.json({ ok: true }); }));
  r.post('/admin/orders/:id/refund', wrap(async (req, res) => {
    const o = await orders.fetchFull(req.params.id);
    if (!o) throw notFound('Order not found.');
    if (o.status !== 'cancelled' || o.payment_status !== 'refund_pending') throw conflict('not_refundable', 'Only cancelled orders with a pending refund can be retried.');
    await audit(db, { actorId: req.user.id, action: 'order.refund_retry', entity: 'order', entityId: o.id });
    await orders.refund(o.id, o.total - o.cancel_fee, 'admin_retry');
    res.json({ order: orders.present(await orders.fetchFull(o.id), 'admin') });
  }));

  // ------- pricing
  r.get('/admin/vehicles', wrap(async (_req, res) => { res.json({ vehicles: (await db.query('SELECT * FROM vehicles ORDER BY category, base_price')).rows }); }));
  r.put('/admin/vehicles/:id', validate(z.object({
    basePrice: z.number().int().min(0).max(100000), ratePerKm: z.number().min(0).max(1000), baseKm: z.number().min(0).max(100).optional(), active: z.boolean().optional()
  })), wrap(async (req, res) => {
    const before = (await db.query('SELECT * FROM vehicles WHERE id = $1', [req.params.id])).rows[0];
    if (!before) throw notFound('Vehicle not found.');
    const b = req.body;
    const after = (await db.query('UPDATE vehicles SET base_price = $2, rate_per_km = $3, base_km = COALESCE($4, base_km), active = COALESCE($5, active), updated_at = now() WHERE id = $1 RETURNING *', [req.params.id, b.basePrice, b.ratePerKm, b.baseKm ?? null, b.active ?? null])).rows[0];
    await audit(db, { actorId: req.user.id, action: 'vehicle.update', entity: 'vehicle', entityId: req.params.id, before, after });
    res.json({ vehicle: after });
  }));

  // ------- promos
  r.get('/admin/promos', wrap(async (_req, res) => {
    res.json({ promos: (await db.query('SELECT p.*, (SELECT count(*)::int FROM promo_redemptions x WHERE x.code = p.code) AS used FROM promo_codes p ORDER BY created_at DESC')).rows });
  }));
  const promoBody = z.object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,20}$/), description: z.string().trim().max(200).default(''),
    discountPercent: z.number().int().min(1).max(100), maxDiscount: z.number().int().min(0).max(100000), minFare: z.number().int().min(0).default(0),
    categories: z.array(z.enum(['bike', 'truck'])).optional(), maxUsesPerUser: z.number().int().min(1).optional(), maxTotalUses: z.number().int().min(1).optional(),
    endsAt: z.string().datetime({ offset: true }).optional()
  });
  r.post('/admin/promos', validate(promoBody), wrap(async (req, res) => {
    const b = req.body;
    try {
      const p = (await db.query(
        `INSERT INTO promo_codes (code, description, discount_percent, max_discount, min_fare, categories, max_uses_per_user, max_total_uses, ends_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [b.code, b.description, b.discountPercent, b.maxDiscount, b.minFare, b.categories || null, b.maxUsesPerUser || null, b.maxTotalUses || null, b.endsAt || null])).rows[0];
      await audit(db, { actorId: req.user.id, action: 'promo.create', entity: 'promo', entityId: b.code, after: p });
      res.status(201).json({ promo: p });
    } catch (e) { if (e.code === '23505') throw conflict('duplicate_code', 'That code already exists.'); throw e; }
  }));
  r.patch('/admin/promos/:code', validate(z.object({ active: z.boolean() })), wrap(async (req, res) => {
    const p = (await db.query('UPDATE promo_codes SET active = $2 WHERE code = $1 RETURNING *', [req.params.code.toUpperCase(), req.body.active])).rows[0];
    if (!p) throw notFound('Promo not found.');
    await audit(db, { actorId: req.user.id, action: 'promo.toggle', entity: 'promo', entityId: p.code, after: { active: p.active } });
    res.json({ promo: p });
  }));

  // ------- drivers
  r.get('/admin/drivers', wrap(async (_req, res) => {
    res.json({ drivers: (await db.query(
      `SELECT d.user_id AS id, u.name, u.phone, d.city_id, d.vehicle_id, d.vehicle_no, d.status, d.online, d.rating, d.rating_count, d.lat, d.lng, d.location_at, d.verified_at, ${DOC_COLUMNS},
              (SELECT count(*)::int FROM orders o WHERE o.driver_id = d.user_id AND o.status IN ('assigned','in_transit')) AS active_orders
       FROM drivers d JOIN users u ON u.id = d.user_id ORDER BY d.created_at DESC`)).rows });
  }));
  r.post('/admin/drivers', validate(z.object({ phone, name: z.string().trim().min(2).max(80), cityId: z.string(), vehicleId: z.string(), vehicleNo: z.string().trim().toUpperCase().min(6).max(15), documents: driverDocsSchema.optional() })), wrap(async (req, res) => {
    const b = req.body;
    if (!cityById(b.cityId)) throw badRequest('unknown_city', 'Unknown city.');
    const veh = (await db.query('SELECT 1 FROM vehicles WHERE id = $1', [b.vehicleId])).rowCount;
    if (!veh) throw badRequest('invalid_vehicle', 'Unknown vehicle.');
    const out = await db.tx(async (t) => {
      const existing = (await t.query('SELECT id, role FROM users WHERE phone = $1', [b.phone])).rows[0];
      if (existing && existing.role !== 'driver') throw conflict('phone_in_use', 'That phone number belongs to a non-driver account.');
      const u = existing || (await t.query("INSERT INTO users (phone, name, role) VALUES ($1,$2,'driver') RETURNING id", [b.phone, b.name])).rows[0];
      const dc = b.documents || {};
      // New drivers start as 'pending' and cannot go online until an admin verifies their documents.
      await t.query("INSERT INTO drivers (user_id, city_id, vehicle_id, vehicle_no, status, license_no, license_expiry, rc_expiry, insurance_expiry) VALUES ($1,$2,$3,$4,'pending',$5,$6,$7,$8)", [u.id, b.cityId, b.vehicleId, b.vehicleNo, dc.licenseNo || null, dc.licenseExpiry || null, dc.rcExpiry || null, dc.insuranceExpiry || null]);
      await audit(t, { actorId: req.user.id, action: 'driver.create', entity: 'driver', entityId: u.id, after: b });
      return u;
    }).catch((e) => { if (e.code === '23505') throw conflict('driver_exists', 'This driver already exists.'); throw e; });
    res.status(201).json({ id: out.id });
  }));
  r.patch('/admin/drivers/:id', validate(z.object({ status: z.enum(['approved', 'suspended']) })), wrap(async (req, res) => {
    const cur = (await db.query(`SELECT d.user_id, ${DOC_COLUMNS} FROM drivers d WHERE d.user_id = $1`, [req.params.id])).rows[0];
    if (!cur) throw notFound('Driver not found.');
    if (req.body.status === 'approved') {
      const issues = docIssues(cur, clock.now().toISOString().slice(0, 10));
      if (issues.length) throw conflict('documents_invalid', `Cannot approve: ${issues[0]}.`, issues);
    }
    await db.query(
      `UPDATE drivers SET status = $2, online = CASE WHEN $2 = 'approved' THEN online ELSE false END,
         verified_at = CASE WHEN $2 = 'approved' THEN $3 ELSE verified_at END, verified_by = CASE WHEN $2 = 'approved' THEN $4::uuid ELSE verified_by END
       WHERE user_id = $1`, [req.params.id, req.body.status, clock.now(), req.user.id]);
    if (req.body.status === 'suspended') await auth.revokeAllForUser(req.params.id);
    await audit(db, { actorId: req.user.id, action: `driver.${req.body.status}`, entity: 'driver', entityId: req.params.id });
    res.json({ ok: true });
  }));

  r.patch('/admin/drivers/:id/documents', validate(driverDocsSchema), wrap(async (req, res) => {
    const b = req.body;
    const u = await db.query('UPDATE drivers SET license_no = $2, license_expiry = $3, rc_expiry = $4, insurance_expiry = $5 WHERE user_id = $1 RETURNING user_id', [req.params.id, b.licenseNo, b.licenseExpiry, b.rcExpiry, b.insuranceExpiry]);
    if (!u.rowCount) throw notFound('Driver not found.');
    await audit(db, { actorId: req.user.id, action: 'driver.documents', entity: 'driver', entityId: req.params.id, after: b });
    res.json({ ok: true });
  }));

  // ------- leads and audit
  r.get('/admin/leads', wrap(async (_req, res) => { res.json({ leads: (await db.query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 200')).rows }); }));
  r.patch('/admin/leads/:id', validate(z.object({ status: z.enum(['new', 'contacted', 'won', 'lost']) })), wrap(async (req, res) => {
    const l = (await db.query('UPDATE leads SET status = $2 WHERE id = $1 RETURNING *', [Number(req.params.id), req.body.status])).rows[0];
    if (!l) throw notFound('Lead not found.');
    res.json({ lead: l });
  }));
  r.get('/admin/audit', wrap(async (_req, res) => { res.json({ entries: (await db.query('SELECT * FROM audit_log ORDER BY id DESC LIMIT 200')).rows }); }));

  return r;
}
