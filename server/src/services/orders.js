import { randomDigits, randomToken, safeEqual, newOrderId } from '../lib/crypto.js';
import { badRequest, conflict, forbidden, notFound, tooMany } from '../lib/errors.js';
import { audit } from './audit.js';

const SCHEDULE_LEAD_MS = 60 * 60_000;     // scheduled orders start searching 60 minutes before the slot
const MAX_SCHEDULE_DAYS = 60;
const MAX_OTP_ATTEMPTS = 5;

export const FLOW = {
  pending_payment: ['searching', 'scheduled', 'confirmed', 'cancelled'],
  scheduled: ['searching', 'cancelled'],
  confirmed: ['assigned', 'cancelled'],
  searching: ['assigned', 'cancelled'],
  assigned: ['in_transit', 'searching', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};
const CUSTOMER_CANCELLABLE = ['pending_payment', 'scheduled', 'confirmed', 'searching', 'assigned'];

const SELECT_ORDER = `
  SELECT o.*, du.name AS driver_name, du.phone AS driver_phone, d.vehicle_no, d.rating AS driver_rating,
         d.lat AS driver_lat, d.lng AS driver_lng, d.location_at AS driver_location_at
  FROM orders o
  LEFT JOIN drivers d ON d.user_id = o.driver_id
  LEFT JOIN users du ON du.id = d.user_id`;

const iso = (d) => (d ? new Date(d).toISOString() : null);

// viewer: 'customer' | 'admin' | 'driver' | 'public'. Controls which fields leave the server.
export function present(o, viewer) {
  const base = {
    id: o.id,
    status: o.status,
    serviceType: o.service_type,
    cityId: o.city_id,
    vehicleId: o.vehicle_id,
    vehicleName: o.vehicle_name,
    pickup: { address: o.pickup_address, lat: o.pickup_lat, lng: o.pickup_lng },
    drop: { address: o.drop_address, lat: o.drop_lat, lng: o.drop_lng },
    distanceKm: o.distance_km,
    createdAt: iso(o.created_at),
    scheduledFor: iso(o.scheduled_for),
    deliveredAt: iso(o.delivered_at),
    cancelledAt: iso(o.cancelled_at)
  };
  const driverBase = o.driver_id ? {
    name: viewer === 'public' ? String(o.driver_name || '').split(' ')[0] : o.driver_name,
    vehicleNo: o.vehicle_no,
    rating: o.driver_rating,
    lat: o.driver_lat,
    lng: o.driver_lng,
    locationAt: iso(o.driver_location_at)
  } : null;

  if (viewer === 'public') {
    return { ...base, pickup: { address: o.pickup_address }, drop: { address: o.drop_address }, driver: driverBase, route: o.route_polyline };
  }
  if (viewer === 'driver') {
    return {
      ...base, total: o.total, paymentMethod: o.payment_method,
      collectCash: o.payment_method === 'cod' && o.payment_status !== 'cod_collected' ? o.total : 0,
      sender: { name: o.sender_name, phone: o.sender_phone }, receiver: { name: o.receiver_name, phone: o.receiver_phone },
      goodsType: o.goods_type, notes: o.notes, route: o.route_polyline
    };
  }
  return {
    ...base,
    pricing: o.pricing, total: o.total, promoCode: o.promo_code,
    paymentMethod: o.payment_method, paymentStatus: o.payment_status,
    sender: { name: o.sender_name, phone: o.sender_phone }, receiver: { name: o.receiver_name, phone: o.receiver_phone },
    goodsType: o.goods_type, notes: o.notes,
    deliveryOtp: ['assigned', 'in_transit', 'searching', 'scheduled', 'confirmed', 'pending_payment'].includes(o.status) ? o.delivery_otp : null,
    trackToken: o.track_token,
    route: o.route_polyline,
    cancelReason: o.cancel_reason, cancelledBy: o.cancelled_by, cancelFee: o.cancel_fee,
    assignedAt: iso(o.assigned_at), pickedUpAt: iso(o.picked_up_at),
    driver: driverBase && { ...driverBase, phone: o.driver_phone },
    customerId: viewer === 'admin' ? o.customer_id : undefined,
    otpAttempts: viewer === 'admin' ? o.otp_attempts : undefined
  };
}

export function createOrders({ db, config, quotes, payments, hub, notify, invoices, clock, onChange = () => {} }) {
  const publish = (orderId, extra = {}) => hub.publish(`order:${orderId}`, { type: 'updated', ...extra });

  async function addEvent(q, orderId, type, actorId, data = {}) {
    await q.query('INSERT INTO order_events (order_id, type, actor_id, data, created_at) VALUES ($1,$2,$3,$4,$5)', [orderId, type, actorId || null, JSON.stringify(data), clock.now()]);
  }

  async function lock(q, id) {
    const r = await q.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
    if (!r.rows[0]) throw notFound('Order not found.');
    return r.rows[0];
  }

  // Compare-and-set status change. Throws if the order moved on in the meantime.
  async function changeStatus(q, order, to, patch = {}, { actorId, event, data } = {}) {
    if (!FLOW[order.status]?.includes(to)) throw conflict('invalid_transition', `Order cannot move from ${order.status} to ${to}.`);
    const cols = { status: to, updated_at: clock.now(), ...patch };
    const keys = Object.keys(cols);
    const sets = keys.map((k, i) => `${k} = $${i + 3}`).join(', ');
    const r = await q.query(`UPDATE orders SET ${sets} WHERE id = $1 AND status = $2`, [order.id, order.status, ...keys.map((k) => cols[k])]);
    if (!r.rowCount) throw conflict('stale_order', 'This order was just updated. Please refresh.');
    await addEvent(q, order.id, event || `status_${to}`, actorId, { from: order.status, to, ...(data || {}) });
  }

  const dispatchStatus = (serviceType, scheduledFor) => {
    if (serviceType === 'parcel') return 'confirmed';
    if (scheduledFor && new Date(scheduledFor).getTime() - clock.now().getTime() > SCHEDULE_LEAD_MS) return 'scheduled';
    return 'searching';
  };

  async function fetchFull(id, q = db) {
    const r = await q.query(`${SELECT_ORDER} WHERE o.id = $1`, [id]);
    return r.rows[0] || null;
  }

  // ---------------------------------------------------------------- create
  async function paymentInfoFor(orderId) {
    const p = (await db.query("SELECT provider_order_id, amount_paise FROM payments WHERE order_id = $1 AND status = 'created' ORDER BY created_at DESC LIMIT 1", [orderId])).rows[0];
    return p ? { provider: payments.name, keyId: payments.keyId, providerOrderId: p.provider_order_id, amountPaise: p.amount_paise, currency: 'INR' } : null;
  }

  async function createOrder(user, input, idempotencyKey) {
    if (idempotencyKey) {
      const ex = (await db.query('SELECT id FROM orders WHERE customer_id = $1 AND idempotency_key = $2', [user.id, idempotencyKey])).rows[0];
      if (ex) return { order: present(await fetchFull(ex.id), 'customer'), payment: await paymentInfoFor(ex.id), replayed: true };
    }

    const q = await quotes.quote(input.quote, user.id);
    if (input.expectedTotal != null && input.expectedTotal !== q.pricing.total) {
      throw conflict('price_changed', 'The fare changed. Please review the new price.', { total: q.pricing.total, pricing: q.pricing });
    }

    const method = input.paymentMethod;
    const codAllowed = q.serviceType === 'city' || (!payments.enabled && !config.isProd);
    if (method === 'cod' && !codAllowed) throw badRequest('cod_not_allowed', 'Cash on Delivery is not available for this service. Please pay online.');
    if (method === 'online' && !payments.enabled) throw badRequest('payments_unavailable', 'Online payments are not available right now. Choose Cash on Delivery.');

    let scheduledFor = null;
    if (input.scheduledFor) {
      scheduledFor = new Date(input.scheduledFor);
      const now = clock.now();
      if (Number.isNaN(scheduledFor.getTime()) || scheduledFor <= now) throw badRequest('invalid_schedule', 'Choose a future date and time.');
      if (scheduledFor.getTime() - now.getTime() > MAX_SCHEDULE_DAYS * 86_400_000) throw badRequest('invalid_schedule', `Bookings can be scheduled up to ${MAX_SCHEDULE_DAYS} days ahead.`);
    }

    const initial = method === 'online' ? 'pending_payment' : dispatchStatus(q.serviceType, scheduledFor);
    const redeem = q.pricing.discount > 0 && q.promoRow;
    let orderId;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      orderId = newOrderId();
      try {
        await db.tx(async (t) => {
          if (redeem) {
            await t.query('SELECT code FROM promo_codes WHERE code = $1 FOR UPDATE', [q.promoRow.code]);
            const recheck = await quotes.loadPromo(q.promoRow.code, user.id, t);
            if (recheck.error) throw conflict('price_changed', recheck.error, { total: q.pricing.total + q.pricing.discount });
          }
          await t.query(
            `INSERT INTO orders (id, track_token, customer_id, service_type, city_id, vehicle_id, vehicle_name,
               pickup_address, pickup_lat, pickup_lng, drop_address, drop_lat, drop_lng, distance_km, route_polyline,
               pricing, total, promo_code, status, payment_method, payment_status,
               sender_name, sender_phone, receiver_name, receiver_phone, goods_type, notes, scheduled_for,
               delivery_otp, idempotency_key, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$31)`,
            [orderId, randomToken(18), user.id, q.serviceType, q.cityId, q.vehicle?.id || null,
              q.serviceType === 'packers' ? `Packers & Movers (${q.pricing.planLabel})` : q.serviceType === 'parcel' ? `All-India Parcel (${q.pricing.mode === 'air' ? 'Air' : 'Surface'}, ${q.pricing.weightKg} kg)` : q.vehicle.name,
              q.pickup.address, q.pickup.lat, q.pickup.lng, q.drop.address, q.drop.lat, q.drop.lng, q.distanceKm,
              q.route ? JSON.stringify(q.route.line) : null, JSON.stringify(q.pricing), q.pricing.total, redeem ? q.promoRow.code : null,
              initial, method, method === 'cod' ? 'cod_due' : 'pending',
              input.sender.name, input.sender.phone, input.receiver.name, input.receiver.phone, input.goodsType || null, input.notes || null,
              scheduledFor, randomDigits(4), idempotencyKey || null, clock.now()]
          );
          if (redeem) await t.query('INSERT INTO promo_redemptions (code, user_id, order_id) VALUES ($1,$2,$3)', [q.promoRow.code, user.id, orderId]);
          await addEvent(t, orderId, 'created', user.id, { method, total: q.pricing.total });
        });
        break;
      } catch (e) {
        if (e.code === '23505') {
          if (idempotencyKey) {
            const ex = (await db.query('SELECT id FROM orders WHERE customer_id = $1 AND idempotency_key = $2', [user.id, idempotencyKey])).rows[0];
            if (ex) return { order: present(await fetchFull(ex.id), 'customer'), payment: await paymentInfoFor(ex.id), replayed: true };
          }
          if (attempt < 4) continue; // id/token collision: retry with fresh ids
        }
        throw e;
      }
    }

    let paymentInit = null;
    if (method === 'online') {
      try {
        const ro = await payments.createOrder({ amountPaise: q.pricing.total * 100, receipt: orderId, notes: { orderId } });
        await db.query('INSERT INTO payments (order_id, provider, provider_order_id, amount_paise) VALUES ($1,$2,$3,$4)', [orderId, payments.name, ro.id, q.pricing.total * 100]);
        paymentInit = { provider: payments.name, keyId: payments.keyId, providerOrderId: ro.id, amountPaise: q.pricing.total * 100, currency: 'INR' };
      } catch (e) {
        await cancel({ role: 'system' }, orderId, 'payment_init_failed').catch(() => {});
        throw e;
      }
    }
    publish(orderId);
    onChange();
    return { order: present(await fetchFull(orderId), 'customer'), payment: paymentInit };
  }

  // ---------------------------------------------------------------- payments
  // Lets a customer resume paying for an order whose checkout window was closed or failed.
  async function paymentInfo(user, id) {
    const o = (await db.query('SELECT customer_id, status, total FROM orders WHERE id = $1', [id])).rows[0];
    if (!o || o.customer_id !== user.id) throw notFound('Order not found.');
    if (o.status !== 'pending_payment') throw conflict('not_payable', 'This order does not need payment.');
    let info = await paymentInfoFor(id);
    if (!info) {
      const ro = await payments.createOrder({ amountPaise: o.total * 100, receipt: id, notes: { orderId: id } });
      await db.query('INSERT INTO payments (order_id, provider, provider_order_id, amount_paise) VALUES ($1,$2,$3,$4)', [id, payments.name, ro.id, o.total * 100]);
      info = await paymentInfoFor(id);
    }
    return info;
  }

  async function refund(orderId, amountRupees, reason) {
    const pay = (await db.query("SELECT * FROM payments WHERE order_id = $1 AND status = 'paid' LIMIT 1", [orderId])).rows[0];
    if (!pay || amountRupees <= 0) return null;
    const amountPaise = Math.min(pay.amount_paise, amountRupees * 100);
    const row = (await db.query("INSERT INTO refunds (payment_id, amount_paise, reason) VALUES ($1,$2,$3) RETURNING id", [pay.id, amountPaise, reason])).rows[0];
    try {
      const r = await payments.refund({ providerPaymentId: pay.provider_payment_id, amountPaise, notes: { orderId, reason } });
      const processed = r.status === 'processed';
      await db.query('UPDATE refunds SET provider_refund_id = $2, status = $3 WHERE id = $1', [row.id, r.id, processed ? 'processed' : 'pending']);
      if (processed) {
        await db.query("UPDATE orders SET payment_status = 'refunded', updated_at = $2 WHERE id = $1", [orderId, clock.now()]);
        await db.query("UPDATE payments SET status = 'refunded', updated_at = $2 WHERE id = $1", [pay.id, clock.now()]);
      }
      return r;
    } catch (e) {
      await db.query("UPDATE refunds SET status = 'failed' WHERE id = $1", [row.id]);
      await db.query("UPDATE orders SET payment_status = 'refund_pending' WHERE id = $1", [orderId]);
      throw e;
    }
  }

  // Idempotent: called from both the checkout callback and the webhook.
  async function markPaid({ providerOrderId, providerPaymentId, amountPaise }) {
    let refundAfter = null;
    let orderId = null;
    const changed = await db.tx(async (t) => {
      const pay = (await t.query('SELECT * FROM payments WHERE provider_order_id = $1 FOR UPDATE', [providerOrderId])).rows[0];
      if (!pay) return false;
      orderId = pay.order_id;
      if (amountPaise != null && amountPaise !== pay.amount_paise) throw badRequest('amount_mismatch', 'Paid amount does not match the order.');
      if (pay.status === 'paid' || pay.status === 'refunded') return false;
      await t.query("UPDATE payments SET status = 'paid', provider_payment_id = $2, updated_at = $3 WHERE id = $1", [pay.id, providerPaymentId, clock.now()]);
      const order = await lock(t, pay.order_id);
      await t.query("UPDATE orders SET payment_status = 'paid', updated_at = $2 WHERE id = $1", [order.id, clock.now()]);
      await addEvent(t, order.id, 'payment_paid', null, { providerPaymentId });
      if (order.status === 'pending_payment') {
        await changeStatus(t, { ...order }, dispatchStatus(order.service_type, order.scheduled_for), {}, { event: 'dispatch_started' });
      } else if (order.status === 'cancelled') {
        refundAfter = order.total - order.cancel_fee; // customer cancelled while the payment was in flight
      }
      return true;
    });
    if (refundAfter != null) await refund(orderId, refundAfter, 'paid_after_cancel').catch(() => {});
    if (changed) { publish(orderId); onChange(); }
    return orderId;
  }

  async function confirmCheckout(user, orderId, { razorpay_order_id: rzpOrder, razorpay_payment_id: rzpPay, razorpay_signature: sig }) {
    const o = (await db.query('SELECT customer_id FROM orders WHERE id = $1', [orderId])).rows[0];
    if (!o || o.customer_id !== user.id) throw notFound('Order not found.');
    const pay = (await db.query('SELECT * FROM payments WHERE order_id = $1 AND provider_order_id = $2', [orderId, rzpOrder])).rows[0];
    if (!pay) throw badRequest('unknown_payment', 'No matching payment for this order.');
    if (!payments.verifyCheckoutSignature({ orderId: rzpOrder, paymentId: rzpPay, signature: sig })) throw badRequest('invalid_signature', 'Payment verification failed.');
    await markPaid({ providerOrderId: rzpOrder, providerPaymentId: rzpPay, amountPaise: pay.amount_paise });
    return present(await fetchFull(orderId), 'customer');
  }

  async function handleWebhook(rawBody, signature, eventId) {
    if (!payments.verifyWebhookSignature(rawBody, signature)) throw badRequest('invalid_signature', 'Bad webhook signature.');
    const event = JSON.parse(rawBody);
    if (eventId) {
      const ins = await db.query('INSERT INTO webhook_events (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [eventId]);
      if (!ins.rowCount) return { duplicate: true };
    }
    const pay = event.payload?.payment?.entity;
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      // Both events carry the payment entity; the amount is checked against the stored order inside markPaid.
      if (pay?.order_id) await markPaid({ providerOrderId: pay.order_id, providerPaymentId: pay.id, amountPaise: pay.amount });
    } else if (event.event === 'payment.failed' && pay?.order_id) {
      await db.query(
        `UPDATE orders SET payment_status = 'failed', updated_at = $2
         WHERE payment_status = 'pending' AND id IN (SELECT order_id FROM payments WHERE provider_order_id = $1 AND status = 'created')`, [pay.order_id, clock.now()]);
    } else if (event.event === 'refund.processed') {
      const rf = event.payload?.refund?.entity;
      if (rf) {
        const r = (await db.query("UPDATE refunds SET status = 'processed', provider_refund_id = COALESCE(provider_refund_id, $1) WHERE provider_refund_id = $1 OR payment_id IN (SELECT id FROM payments WHERE provider_payment_id = $2) RETURNING payment_id", [rf.id, rf.payment_id])).rows[0];
        if (r) {
          const pr = (await db.query("UPDATE payments SET status = 'refunded', updated_at = $2 WHERE id = $1 RETURNING order_id", [r.payment_id, clock.now()])).rows[0];
          if (pr) await db.query("UPDATE orders SET payment_status = 'refunded', updated_at = $2 WHERE id = $1", [pr.order_id, clock.now()]);
        }
      }
    }
    return { ok: true };
  }

  // ---------------------------------------------------------------- cancel
  async function cancel(actor, orderId, reason) {
    let refundAmount = 0;
    let driverId = null;
    let order;
    await db.tx(async (t) => {
      order = await lock(t, orderId);
      if (actor.role === 'customer' && order.customer_id !== actor.id) throw notFound('Order not found.');
      const allowed = actor.role === 'customer' ? CUSTOMER_CANCELLABLE : [...CUSTOMER_CANCELLABLE, 'in_transit'];
      if (!allowed.includes(order.status)) {
        throw conflict('cannot_cancel', order.status === 'in_transit' ? 'The order is already on its way. Contact support to cancel.' : `This order is already ${order.status}.`);
      }
      const fee = actor.role === 'customer' && order.status === 'assigned' ? Math.min(config.CANCEL_FEE_RUPEES, order.total) : 0;
      const paid = order.payment_method === 'online' && order.payment_status === 'paid';
      if (paid) refundAmount = order.total - fee;
      driverId = order.driver_id;
      await changeStatus(t, order, 'cancelled', {
        cancelled_at: clock.now(), cancel_reason: String(reason || '').slice(0, 200) || null, cancelled_by: actor.role, cancel_fee: fee,
        payment_status: paid ? 'refund_pending' : (order.payment_method === 'cod' ? 'pending' : order.payment_status)
      }, { actorId: actor.id, event: 'cancelled', data: { by: actor.role, reason, fee } });
      await t.query("UPDATE order_offers SET status = 'cancelled' WHERE order_id = $1 AND status = 'pending'", [orderId]);
      await t.query('DELETE FROM promo_redemptions WHERE order_id = $1', [orderId]);
    });
    if (refundAmount > 0) await refund(orderId, refundAmount, 'order_cancelled').catch(() => {});
    publish(orderId);
    if (driverId) hub.publish(`driver:${driverId}`, { type: 'order_cancelled', orderId });
    const full = await fetchFull(orderId);
    notify.notify(full.sender_phone, 'cancelled', full).catch(() => {});
    return present(full, actor.role === 'admin' ? 'admin' : 'customer');
  }

  // ---------------------------------------------------------------- reads
  async function listForCustomer(userId, { limit = 50, offset = 0 } = {}) {
    const r = await db.query(`${SELECT_ORDER} WHERE o.customer_id = $1 ORDER BY o.created_at DESC LIMIT $2 OFFSET $3`, [userId, limit, offset]);
    return r.rows.map((o) => present(o, 'customer'));
  }

  async function getForUser(user, id) {
    const o = await fetchFull(id);
    if (!o) throw notFound('Order not found.');
    let viewer;
    if (user.role === 'admin') viewer = 'admin';
    else if (o.customer_id === user.id) viewer = 'customer';
    else if (user.role === 'driver' && o.driver_id === user.id) viewer = 'driver';
    else throw notFound('Order not found.');
    const out = present(o, viewer);
    if (viewer !== 'driver') {
      out.events = (await db.query('SELECT type, data, created_at FROM order_events WHERE order_id = $1 ORDER BY id', [id])).rows
        .map((e) => ({ type: e.type, at: iso(e.created_at), data: e.data }));
    }
    return out;
  }

  async function getByToken(token) {
    const r = await db.query(`${SELECT_ORDER} WHERE o.track_token = $1`, [token]);
    return r.rows[0] ? present(r.rows[0], 'public') : null;
  }

  // ---------------------------------------------------------------- driver actions
  async function assignDriver(q, order, driverId, actorId, event = 'driver_assigned') {
    await changeStatus(q, order, 'assigned', { driver_id: driverId, assigned_at: clock.now() }, { actorId, event, data: { driverId } });
  }

  async function driverPickup(driverId, orderId) {
    await db.tx(async (t) => {
      const order = await lock(t, orderId);
      if (order.driver_id !== driverId) throw notFound('Order not found.');
      if (order.status !== 'assigned') throw conflict('invalid_transition', 'This order cannot be picked up right now.');
      await changeStatus(t, order, 'in_transit', { picked_up_at: clock.now() }, { actorId: driverId, event: 'picked_up' });
    });
    publish(orderId);
    const o = await fetchFull(orderId);
    notify.notify(o.receiver_phone, 'pickup_otp', o).catch(() => {});
    return present(o, 'driver');
  }

  async function driverDeliver(driverId, orderId, otp) {
    // Count the attempt atomically before comparing, so parallel guesses cannot beat the cap.
    const att = await db.query(
      "UPDATE orders SET otp_attempts = otp_attempts + 1 WHERE id = $1 AND driver_id = $2 AND status = 'in_transit' AND otp_attempts < $3 RETURNING delivery_otp",
      [orderId, driverId, MAX_OTP_ATTEMPTS]);
    if (!att.rowCount) {
      const o = (await db.query('SELECT driver_id, status, otp_attempts FROM orders WHERE id = $1', [orderId])).rows[0];
      if (!o || o.driver_id !== driverId) throw notFound('Order not found.');
      if (o.status !== 'in_transit') throw conflict('invalid_transition', 'This order is not out for delivery.');
      throw tooMany('Too many wrong OTP attempts. Contact support to complete this delivery.');
    }
    if (!safeEqual(String(otp), att.rows[0].delivery_otp)) throw badRequest('invalid_otp', 'Incorrect OTP. Ask the receiver for the 4-digit code.');

    const payout = config.DRIVER_PAYOUT_PERCENT;
    await db.tx(async (t) => {
      const order = await lock(t, orderId);
      await changeStatus(t, order, 'delivered', {
        delivered_at: clock.now(),
        payment_status: order.payment_method === 'cod' ? 'cod_collected' : order.payment_status
      }, { actorId: driverId, event: 'delivered' });
      await t.query('INSERT INTO driver_earnings (order_id, driver_id, amount) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [orderId, driverId, Math.round((order.total * payout) / 100)]);
      await invoices.issue(t, { ...order, status: 'delivered', delivered_at: clock.now() });
    });
    publish(orderId);
    const o = await fetchFull(orderId);
    notify.notify(o.sender_phone, 'delivered', o).catch(() => {});
    return present(o, 'driver');
  }

  // ---------------------------------------------------------------- admin
  async function adminAssign(adminId, orderId, driverId) {
    await db.tx(async (t) => {
      const order = await lock(t, orderId);
      const d = (await t.query("SELECT user_id, city_id FROM drivers WHERE user_id = $1 AND status = 'approved'", [driverId])).rows[0];
      if (!d) throw badRequest('invalid_driver', 'That driver is not available.');
      if (order.status === 'assigned') {
        await changeStatus(t, order, 'searching', { driver_id: null, assigned_at: null }, { actorId: adminId, event: 'driver_removed' });
        order.status = 'searching';
      }
      await assignDriver(t, order, driverId, adminId, 'admin_assigned');
      await t.query("UPDATE order_offers SET status = 'cancelled' WHERE order_id = $1 AND status = 'pending'", [orderId]);
      await audit(t, { actorId: adminId, action: 'order.assign', entity: 'order', entityId: orderId, after: { driverId } });
    });
    publish(orderId);
    hub.publish(`driver:${driverId}`, { type: 'assigned', orderId });
    const o = await fetchFull(orderId);
    const d = { name: o.driver_name, vehicleNo: o.vehicle_no };
    notify.notify(o.sender_phone, 'driver_assigned', o, d).catch(() => {});
    return present(o, 'admin');
  }

  async function adminResetOtp(adminId, orderId) {
    const r = await db.query('UPDATE orders SET otp_attempts = 0 WHERE id = $1 RETURNING id', [orderId]);
    if (!r.rowCount) throw notFound('Order not found.');
    await audit(db, { actorId: adminId, action: 'order.reset_otp', entity: 'order', entityId: orderId });
  }

  return {
    createOrder, paymentInfo, confirmCheckout, handleWebhook, markPaid, refund, cancel,
    listForCustomer, getForUser, getByToken, fetchFull,
    driverPickup, driverDeliver, adminAssign, adminResetOtp,
    // used by the dispatcher
    lock, changeStatus, assignDriver, addEvent, publish, present, forbidden
  };
}
