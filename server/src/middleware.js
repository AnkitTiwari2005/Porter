import cookie from 'cookie';
import rateLimit from 'express-rate-limit';
import { HttpError, forbidden, unauthorized } from './lib/errors.js';

export const COOKIE = 'ptx_sid';

export function readToken(req) {
  const h = req.headers.cookie;
  return h ? cookie.parse(h)[COOKIE] : undefined;
}

export const setSessionCookie = (res, config, token, expiresAt) => {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE, token, { httpOnly: true, secure: config.cookieSecure, sameSite: 'lax', path: '/', expires: expiresAt }));
};
export const clearSessionCookie = (res, config) => {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE, '', { httpOnly: true, secure: config.cookieSecure, sameSite: 'lax', path: '/', expires: new Date(0) }));
};

export const attachUser = (auth) => async (req, _res, next) => {
  try { req.token = readToken(req); req.user = (await auth.authenticate(req.token)) || null; next(); } catch (e) { next(e); }
};
export const requireUser = (req, _res, next) => (req.user ? next() : next(unauthorized()));
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  return roles.includes(req.user.role) ? next() : next(forbidden());
};

// Defence in depth on top of SameSite=Lax cookies: state-changing requests must come from our own origin.
export const originGuard = (config) => {
  const allowed = new Set([...config.corsOrigins, new URL(config.PUBLIC_URL).origin]);
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

export const limiter = (config, { windowMs, max, message }) => rateLimit({
  windowMs, max, standardHeaders: true, legacyHeaders: false,
  skip: () => config.NODE_ENV === 'test',
  handler: (_req, res) => res.status(429).json({ error: { code: 'rate_limited', message: message || 'Too many requests. Please slow down.' } })
});
