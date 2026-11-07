import express from 'express';
import { safeEqual } from '../lib/crypto.js';
import { notFound, unauthorized } from '../lib/errors.js';
import { wrap } from '../lib/http.js';

// Prometheus-format operational metrics. Disabled (404) unless METRICS_TOKEN is set; requires "Authorization: Bearer <token>".
export function opsRoutes({ config, db }) {
  const r = express.Router();
  r.get('/metrics', wrap(async (req, res) => {
    if (!config.METRICS_TOKEN) throw notFound();
    const given = (req.headers.authorization || '').replace(/^Bearer /i, '');
    if (!safeEqual(given, config.METRICS_TOKEN)) throw unauthorized('Invalid metrics token.');

    const one = async (sql, params = []) => (await db.query(sql, params)).rows;
    const byStatus = await one('SELECT status, count(*)::int AS n FROM orders GROUP BY status');
    const [backlog] = await one("SELECT count(*)::int AS n FROM orders o WHERE o.status = 'searching' AND NOT EXISTS (SELECT 1 FROM order_offers f WHERE f.order_id = o.id AND f.status = 'pending')");
    const [oldestSearch] = await one("SELECT COALESCE(EXTRACT(EPOCH FROM (now() - min(created_at))), 0)::int AS s FROM orders WHERE status = 'searching'");
    const [pendingPay] = await one("SELECT count(*)::int AS n FROM orders WHERE status = 'pending_payment' AND created_at < now() - interval '10 minutes'");
    const [refundsBad] = await one("SELECT count(*)::int AS n FROM orders WHERE payment_status = 'refund_pending'");
    const [smsFailed] = await one("SELECT count(*)::int AS n FROM notifications WHERE status = 'failed' AND created_at > now() - interval '1 hour'");
    const [drivers] = await one("SELECT count(*) FILTER (WHERE online AND status = 'approved')::int AS online, count(*) FILTER (WHERE status = 'pending')::int AS pending FROM drivers");
    const [lease] = await one("SELECT holder FROM job_lease WHERE name = 'background' AND expires_at > now()");

    const lines = [
      '# TYPE portex_orders gauge', ...byStatus.map((s) => `portex_orders{status="${s.status}"} ${s.n}`),
      '# HELP portex_dispatch_backlog Orders searching for a driver with no live offer',
      `portex_dispatch_backlog ${backlog.n}`,
      `portex_oldest_searching_seconds ${oldestSearch.s}`,
      '# HELP portex_payments_stuck Unpaid online orders older than 10 minutes',
      `portex_payments_stuck ${pendingPay.n}`,
      '# HELP portex_refunds_pending Cancelled orders whose refund has not completed (alert if > 0 for long)',
      `portex_refunds_pending ${refundsBad.n}`,
      `portex_sms_failed_last_hour ${smsFailed.n}`,
      `portex_drivers_online ${drivers.online}`,
      `portex_drivers_pending_verification ${drivers.pending}`,
      `portex_background_leader_alive ${lease ? 1 : 0}`,
      `portex_up 1`
    ];
    res.type('text/plain').send(`${lines.join('\n')}\n`);
  }));
  return r;
}
