// Best-effort transactional SMS. Failures are recorded but never break the order flow.
// India: each template must be registered (DLT) with your SMS provider before it will deliver.
export function createNotify({ db, sms, config, log = console }) {
  const link = (token) => `${config.PUBLIC_URL}/t/${token}`;
  const templates = {
    driver_assigned: (o, d) => `${config.BRAND_NAME}: ${d.name} (${d.vehicleNo}) is on the way for order ${o.id}. Track: ${link(o.track_token)}`,
    pickup_otp: (o) => `${config.BRAND_NAME}: your delivery OTP for order ${o.id} is ${o.delivery_otp}. Share it only with the driver at delivery. Track: ${link(o.track_token)}`,
    delivered: (o) => `${config.BRAND_NAME}: order ${o.id} was delivered. Thank you for choosing us.`,
    cancelled: (o) => `${config.BRAND_NAME}: order ${o.id} was cancelled.${o.payment_status === 'refund_pending' ? ' Your refund has been initiated.' : ''}`
  };
  async function notify(phone, template, ...args) {
    const body = templates[template](...args);
    try {
      await sms.send(phone, body);
      await db.query("INSERT INTO notifications (phone, template, body, status) VALUES ($1,$2,$3,'sent')", [phone, template, body]);
    } catch (e) {
      log.error?.({ err: e.message, template }, 'notification failed');
      try { await db.query("INSERT INTO notifications (phone, template, body, status, error) VALUES ($1,$2,$3,'failed',$4)", [phone, template, body, e.message.slice(0, 300)]); } catch { /* ignore */ }
    }
  }
  return { notify };
}
