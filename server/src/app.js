import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import crypto from 'node:crypto';
import { createAuth } from './services/auth.js';
import { createQuotes } from './services/quote.js';
import { createOrders } from './services/orders.js';
import { createInvoices } from './services/invoices.js';
import { createNotify } from './services/notify.js';
import { createDispatcher } from './services/dispatch.js';
import { createHub } from './lib/pubsub.js';
import { createSms } from './providers/sms.js';
import { createPayments } from './providers/payments.js';
import { createGeo } from './providers/geo.js';
import { attachUser, originGuard, limiter } from './middleware.js';
import { HttpError } from './lib/errors.js';
import { publicRoutes } from './routes/public.js';
import { orderRoutes, webhookRoute } from './routes/orders.js';
import { driverRoutes } from './routes/driver.js';
import { adminRoutes } from './routes/admin.js';
import { opsRoutes } from './routes/ops.js';

// Dependencies can be injected (tests pass fakes for SMS, payments, geo and the clock).
export function createApp({ config, db, deps = {} }) {
  const log = deps.log || pino({ level: config.NODE_ENV === 'test' ? 'silent' : 'info', redact: ['req.headers.cookie', 'req.headers.authorization'] });
  const clock = deps.clock || { now: () => new Date() };
  const sms = deps.sms || createSms(config, { log });
  const payments = deps.payments || createPayments(config);
  const geo = deps.geo || createGeo(config, { log });
  const hub = createHub({ db });

  const auth = createAuth({ db, config, sms, clock, log });
  const quotes = createQuotes({ db, config, geo, clock });
  const notify = createNotify({ db, sms, config, log });
  const invoices = createInvoices({ db, config, clock });
  let dispatcher;
  const orders = createOrders({ db, config, quotes, payments, hub, notify, invoices, clock, onChange: () => dispatcher?.kick() });
  dispatcher = createDispatcher({ db, config, orders, hub, clock, log });

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.TRUST_PROXY);
  app.use((req, res, next) => { req.id = req.headers['x-request-id'] || crypto.randomUUID(); res.setHeader('X-Request-Id', req.id); next(); });
  app.use(pinoHttp({ logger: log, genReqId: (req) => req.id, autoLogging: { ignore: (req) => req.url === '/healthz' } }));
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(cors({ origin: config.corsOrigins.length ? config.corsOrigins : false, credentials: true }));
  app.use(limiter(config, { name: 'global', windowMs: 60_000, max: 600 }, db));

  // Razorpay needs the raw bytes for signature checks, so mount it before the JSON parser.
  app.use('/api/payments/webhook', express.raw({ type: () => true, limit: '512kb' }), webhookRoute({ orders }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/healthz', (_req, res) => res.json({ ok: true }));
  app.get('/readyz', async (_req, res) => {
    try { await db.query('SELECT 1'); res.json({ ok: true }); } catch { res.status(503).json({ ok: false }); }
  });

  app.use('/internal', opsRoutes({ config, db }));
  app.use('/api', originGuard(config), attachUser(auth));
  app.use('/api', publicRoutes({ config, db, auth, quotes, geo, hub }));
  app.use('/api', orderRoutes({ config, db, orders, invoices, hub }));
  app.use('/api', driverRoutes({ config, db, orders, dispatcher, hub, clock }));
  app.use('/api', adminRoutes({ db, orders, auth, clock }));

  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'not_found', 'Not found.')));
  app.use((err, req, res, _next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'invalid_json', message: 'Malformed JSON body.' } });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: { code: 'too_large', message: 'Request body too large.' } });
    req.log?.error({ err }, 'unhandled error');
    return res.status(500).json({ error: { code: 'internal', message: 'Something went wrong. Please try again.', requestId: req.id } });
  });

  const close = () => { dispatcher.stop(); hub.stop(); };
  return { app, hub, dispatcher, close, services: { auth, quotes, orders, invoices, notify }, sms, payments, geo, log };
}
