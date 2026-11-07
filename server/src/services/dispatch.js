import crypto from 'node:crypto';
import { haversineKm } from '../../../shared/cities.js';
import { conflict, notFound } from '../lib/errors.js';

const LOCATION_FRESH_MS = 10 * 60_000;

export function createDispatcher({ db, config, orders, hub, clock, log = console }) {
  const ttlMs = config.OFFER_TTL_SECONDS * 1000;

  async function expireOffers() {
    const r = await db.query("UPDATE order_offers SET status = 'expired' WHERE status = 'pending' AND expires_at <= $1 RETURNING driver_id, order_id", [clock.now()]);
    for (const o of r.rows) hub.publish(`driver:${o.driver_id}`, { type: 'offer_expired', orderId: o.order_id });
  }

  async function releaseScheduled() {
    const due = new Date(clock.now().getTime() + 60 * 60_000);
    const r = await db.query("SELECT id FROM orders WHERE status = 'scheduled' AND scheduled_for <= $1 LIMIT 100", [due]);
    for (const { id } of r.rows) {
      try {
        await db.tx(async (t) => { const o = await orders.lock(t, id); if (o.status === 'scheduled') await orders.changeStatus(t, o, 'searching', {}, { event: 'dispatch_started' }); });
        orders.publish(id);
      } catch (e) { log.warn?.({ err: e.message, id }, 'release scheduled failed'); }
    }
  }

  async function offerTo(order) {
    const now = clock.now();
    const fresh = new Date(now.getTime() - LOCATION_FRESH_MS);
    const cands = (await db.query(
      `SELECT d.user_id, d.lat, d.lng FROM drivers d
       WHERE d.online AND d.status = 'approved' AND d.city_id = $1 AND d.vehicle_id = $2
         AND d.lat IS NOT NULL AND d.location_at >= $3
         AND NOT EXISTS (SELECT 1 FROM orders a WHERE a.driver_id = d.user_id AND a.status IN ('assigned','in_transit'))
         AND NOT EXISTS (SELECT 1 FROM order_offers f WHERE f.driver_id = d.user_id AND f.status = 'pending')
         AND NOT EXISTS (SELECT 1 FROM order_offers p WHERE p.driver_id = d.user_id AND p.order_id = $4)`,
      [order.city_id, order.vehicle_id, fresh, order.id])).rows;
    const near = cands
      .map((c) => ({ id: c.user_id, km: haversineKm([c.lat, c.lng], [order.pickup_lat, order.pickup_lng]) }))
      .filter((c) => c.km <= config.DISPATCH_RADIUS_KM)
      .sort((a, b) => a.km - b.km)[0];
    if (!near) return false;
    const ins = await db.query(
      'INSERT INTO order_offers (order_id, driver_id, expires_at, created_at) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
      [order.id, near.id, new Date(now.getTime() + ttlMs), now]);
    if (!ins.rowCount) return false;
    await orders.addEvent(db, order.id, 'offer_sent', null, { driverId: near.id, km: Number(near.km.toFixed(1)) });
    hub.publish(`driver:${near.id}`, { type: 'offer', orderId: order.id });
    return true;
  }

  async function matchSearching() {
    const cutoff = new Date(clock.now().getTime() - config.DISPATCH_TIMEOUT_MINUTES * 60_000);
    const searching = (await db.query(
      `SELECT o.* FROM orders o WHERE o.status = 'searching' AND o.driver_id IS NULL
         AND NOT EXISTS (SELECT 1 FROM order_offers f WHERE f.order_id = o.id AND f.status = 'pending')
       ORDER BY o.created_at LIMIT 50`)).rows;
    for (const o of searching) {
      const since = (await db.query("SELECT created_at FROM order_events WHERE order_id = $1 AND type IN ('created','dispatch_started','payment_paid') ORDER BY id DESC LIMIT 1", [o.id])).rows[0]?.created_at || o.created_at;
      if (new Date(since) <= cutoff) {
        await orders.cancel({ role: 'system' }, o.id, 'no_driver_available').catch((e) => log.warn?.({ err: e.message }, 'timeout cancel failed'));
        continue;
      }
      await offerTo(o).catch((e) => log.warn?.({ err: e.message, id: o.id }, 'offer failed'));
    }
  }

  async function tick() {
    await expireOffers();
    await releaseScheduled();
    await matchSearching();
  }

  async function acceptOffer(driverId, offerId) {
    let orderId;
    await db.tx(async (t) => {
      const offer = (await t.query('SELECT * FROM order_offers WHERE id = $1 FOR UPDATE', [offerId])).rows[0];
      if (!offer || offer.driver_id !== driverId) throw notFound('Offer not found.');
      if (offer.status !== 'pending' || new Date(offer.expires_at) <= clock.now()) throw conflict('offer_expired', 'This offer is no longer available.');
      const order = await orders.lock(t, offer.order_id);
      if (order.status !== 'searching') throw conflict('order_taken', 'This order is no longer available.');
      const busy = (await t.query("SELECT 1 FROM orders WHERE driver_id = $1 AND status IN ('assigned','in_transit') LIMIT 1", [driverId])).rowCount;
      if (busy) throw conflict('driver_busy', 'Finish your current trip first.');
      await orders.assignDriver(t, order, driverId, driverId);
      await t.query("UPDATE order_offers SET status = 'accepted' WHERE id = $1", [offerId]);
      await t.query("UPDATE order_offers SET status = 'cancelled' WHERE order_id = $1 AND id <> $2 AND status = 'pending'", [order.id, offerId]);
      orderId = order.id;
    });
    orders.publish(orderId);
    return orders.present(await orders.fetchFull(orderId), 'driver');
  }

  async function rejectOffer(driverId, offerId) {
    const r = await db.query("UPDATE order_offers SET status = 'rejected' WHERE id = $1 AND driver_id = $2 AND status = 'pending' RETURNING order_id", [offerId, driverId]);
    if (!r.rowCount) throw notFound('Offer not found.');
    return { ok: true };
  }

  // ---- leader election: with several API instances only the lease holder runs background jobs
  const holder = crypto.randomUUID();
  const leaseMs = Math.max(15_000, config.DISPATCH_INTERVAL_MS * 3);
  async function tryLead() {
    const now = clock.now();
    const r = await db.query(
      `INSERT INTO job_lease (name, holder, expires_at) VALUES ('background', $1, $2)
       ON CONFLICT (name) DO UPDATE SET holder = $1, expires_at = $2
       WHERE job_lease.expires_at <= $3 OR job_lease.holder = $1
       RETURNING holder`, [holder, new Date(now.getTime() + leaseMs), now]);
    return r.rowCount > 0;
  }

  // Slow clean-up and consistency jobs (about once a minute).
  async function housekeeping() {
    const now = clock.now();
    const out = { reconcile: await orders.reconcilePayments() };
    await db.query('DELETE FROM otp_challenges WHERE created_at < $1', [new Date(now.getTime() - 86_400_000)]);
    await db.query('DELETE FROM sessions WHERE expires_at < $1', [new Date(now.getTime() - 7 * 86_400_000)]);
    await db.query('DELETE FROM webhook_events WHERE received_at < $1', [new Date(now.getTime() - 30 * 86_400_000)]);
    await db.query('DELETE FROM rate_limits WHERE reset_at < $1', [now]);
    const today = now.toISOString().slice(0, 10);
    const sus = await db.query(
      `UPDATE drivers SET status = 'suspended', online = false
       WHERE status = 'approved' AND (license_expiry < $1::date OR rc_expiry < $1::date OR insurance_expiry < $1::date) RETURNING user_id`, [today]);
    out.suspendedForExpiredDocs = sus.rowCount;
    return out;
  }

  let timer = null;
  let running = false;
  let queued = false;
  let lastHousekeeping = 0;
  const run = async () => {
    if (running) { queued = true; return; }
    running = true;
    try {
      if (await tryLead()) {
        await tick();
        if (Date.now() - lastHousekeeping > 60_000) { lastHousekeeping = Date.now(); await housekeeping(); }
      }
    } catch (e) { log.error?.({ err: e.message }, 'background job failed'); }
    running = false;
    if (queued) { queued = false; setImmediate(run); }
  };
  return {
    tick, housekeeping, tryLead, acceptOffer, rejectOffer,
    // Only an instance that runs the dispatcher reacts to kicks; with RUN_DISPATCHER=false the API never dispatches.
    kick: () => { if (timer) setImmediate(run); },
    start() { if (!timer) { timer = setInterval(run, config.DISPATCH_INTERVAL_MS); timer.unref?.(); } },
    stop() { if (timer) clearInterval(timer); timer = null; }
  };
}
