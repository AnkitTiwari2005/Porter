import express from 'express';
import { z } from 'zod';
import { wrap, validate } from '../lib/http.js';
import { phone, quoteSchema, leadSchema } from '../lib/schemas.js';
import { requireUser, setSessionCookie, clearSessionCookie, limiter } from '../middleware.js';
import { badRequest } from '../lib/errors.js';
import { cityById } from '../../../shared/cities.js';

const userOut = (u) => u && ({ id: u.id, phone: u.phone, name: u.name, role: u.role });

// Strip internals (promo row, full vehicle) before a quote leaves the server.
export const quoteOut = (q) => ({
  serviceType: q.serviceType, cityId: q.cityId, vehicleId: q.vehicle?.id || null, pickup: q.pickup, drop: q.drop,
  distanceKm: q.distanceKm, etaMinutes: q.etaMinutes ?? q.vehicle?.etaMinutes ?? null, route: q.route, pricing: q.pricing, promo: q.promo
});

export function publicRoutes({ config, db, auth, quotes, geo, hub }) {
  const r = express.Router();
  const authLimit = limiter(config, { windowMs: 60_000, max: 20 });

  r.post('/auth/otp/request', authLimit, validate(z.object({ phone })), wrap(async (req, res) => {
    res.json(await auth.requestOtp({ phone: req.body.phone, ip: req.ip }));
  }));

  r.post('/auth/otp/verify', authLimit, validate(z.object({ phone, code: z.string().regex(/^[0-9]{6}$/, 'Enter the 6-digit code'), name: z.string().trim().max(80).optional() })), wrap(async (req, res) => {
    const out = await auth.verifyOtp({ ...req.body, ip: req.ip, userAgent: req.headers['user-agent'] });
    setSessionCookie(res, config, out.token, out.expiresAt);
    res.json({ user: userOut(out.user) });
  }));

  r.post('/auth/logout', wrap(async (req, res) => {
    await auth.logout(req.token);
    clearSessionCookie(res, config);
    res.json({ ok: true });
  }));

  r.get('/me', (req, res) => res.json({ user: userOut(req.user) }));
  r.patch('/me', requireUser, validate(z.object({ name: z.string().trim().min(2).max(80) })), wrap(async (req, res) => {
    const u = (await db.query('UPDATE users SET name = $2, updated_at = now() WHERE id = $1 RETURNING id, phone, name, role', [req.user.id, req.body.name])).rows[0];
    res.json({ user: userOut(u) });
  }));

  r.get('/catalog', wrap(async (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=30');
    res.json(await quotes.getCatalog());
  }));

  r.post('/quotes', limiter(config, { windowMs: 60_000, max: 60 }), validate(quoteSchema), wrap(async (req, res) => {
    res.json(quoteOut(await quotes.quote(req.body, req.user?.id)));
  }));

  const geoLimit = limiter(config, { windowMs: 60_000, max: 90 });
  r.get('/geo/autocomplete', geoLimit, validate(z.object({ q: z.string().trim().min(3).max(120), cityId: z.string().max(40) }), 'query'), wrap(async (req, res) => {
    if (!cityById(req.query.cityId)) throw badRequest('unknown_city', 'Unknown city.');
    res.json({ results: await geo.autocomplete(req.query.q, req.query.cityId) });
  }));
  r.get('/geo/reverse', geoLimit, validate(z.object({ lat: z.coerce.number().min(-90).max(90), lng: z.coerce.number().min(-180).max(180), cityId: z.string().max(40) }), 'query'), wrap(async (req, res) => {
    res.json({ result: await geo.reverse(req.query.lat, req.query.lng, req.query.cityId) });
  }));

  r.post('/leads', limiter(config, { windowMs: 3_600_000, max: 10, message: 'Too many enquiries from this network. Please try later.' }), validate(leadSchema), wrap(async (req, res) => {
    const { website, companyName, contactName, phone: ph, email, details } = req.body;
    if (website) return res.json({ ok: true }); // honeypot tripped: pretend success
    await db.query('INSERT INTO leads (company, contact, phone, email, details, ip) VALUES ($1,$2,$3,$4,$5,$6)', [companyName, contactName, ph, email || null, JSON.stringify(details), req.ip]);
    if (config.LEADS_WEBHOOK_URL) {
      fetch(config.LEADS_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: `New enterprise lead: ${companyName} - ${contactName} (${ph})` }), signal: AbortSignal.timeout(5000) }).catch(() => {});
    }
    res.status(201).json({ ok: true });
  }));

  void hub;
  return r;
}
