import cookie from 'cookie';
import rateLimit from 'express-rate-limit';
import { HttpError, forbidden, unauthorized } from './lib/errors.js';
import { PgRateStore } from './lib/pgRateStore.js';

export const COOKIE = 'ptx_sid';

export const readToken = (req) => {
  const h = req.headers.authorization;
  if (h && /^Bearer\s+/i.test(h)) return h.replace(/^Bearer\s+/i, '').trim();
  const c = req.headers.cookie;
  return c ? cookie.parse(c)[COOKIE] : undefined;
};

export const setSessionCookie = (res, config, token, expiresAt) => {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE, token, {
    httpOnly: true, secure: config.cookieSecure, sameSite: 'lax', path: '/', expires: expiresAt
  }));
};
export const clearSessionCookie = (res, config) => {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE, '', {
    httpOnly: true, secure: config.cookieSecure, sameSite: 'lax', path: '/', expires: new Date(0)
  }));
};

export const attachUser = (auth) => async (req, _res, next) => {
  try { req.token = readToken(req); req.user = (await auth.authenticate(req.token)) || null; next(); } catch (e) { next(e); }
};
export const requireSession = (req, _res, next) => (req.user ? next() : next(unauthorized()));
export const requireUser = (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (req.user.mfa) return next(new HttpError(401, 'mfa_required', 'Complete two-factor verification first.'));
  return next();
};
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (req.user.mfa) return next(new HttpError(401, 'mfa_required', 'Complete two-factor verification first.'));
  return roles.includes(req.user.role) ? next() : next(forbidden());
};

export const originGuard = (config) => {
  const allowed = new Set([config.PUBLIC_URL, ...config.corsOrigins]);
  return (req, _res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (req.originalUrl.startsWith('/api/payments/webhook')) return next(); // authenticated by HMAC signature instead
    const origin = req.headers.origin;
    const isSameHost = origin && req.headers.host && (origin === `https://${req.headers.host}` || origin === `http://${req.headers.host}`);
    if (origin && !isSameHost && !allowed.has(origin)) return next(new HttpError(403, 'bad_origin', 'Cross-site request blocked.'));
    const site = req.headers['sec-fetch-site'];
    if (site && !['same-origin', 'none'].includes(site)) return next(new HttpError(403, 'bad_origin', 'Cross-site request blocked.'));
    return next();
  };
};

// `name` must be stable and unique per limiter: it is the shared key prefix that all instances agree on.
// With config.RATE_LIMIT_STORE === 'postgres' (default in production) counters live in the database and are shared
// across all instances; otherwise they are in-memory per process.
export const limiter = (config, { name, windowMs, max, message }, db) => rateLimit({
  windowMs, max, standardHeaders: true, legacyHeaders: false,
  skip: () => config.NODE_ENV === 'test' && !config.rateLimitInTests,
  store: config.rateLimitStore === 'postgres' && db ? new PgRateStore({ db, prefix: `rl:${name}` }) : undefined,
  handler: (_req, res) => res.status(429).json({ error: { code: 'rate_limited', message: message || 'Too many requests. Please slow down.' } })
});
