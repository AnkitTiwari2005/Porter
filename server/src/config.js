import { z } from 'zod';

const bool = (def = 'false') => z.enum(['true', 'false']).default(def).transform((v) => v === 'true');
const optStr = z.string().optional().transform((v) => (v ? v : undefined));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  APP_SECRET: z.string().min(32, 'APP_SECRET must be at least 32 characters'),
  PUBLIC_URL: z.string().url().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().default(''),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  COOKIE_SECURE: optStr,
  BRAND_NAME: z.string().default('Portex'),

  SMS_PROVIDER: z.enum(['console', 'twilio']).default('console'),
  TWILIO_ACCOUNT_SID: optStr,
  TWILIO_AUTH_TOKEN: optStr,
  TWILIO_FROM: optStr,
  OTP_DEV_ECHO: bool(),

  PAYMENTS_PROVIDER: z.enum(['razorpay', 'disabled']).default('disabled'),
  RAZORPAY_KEY_ID: optStr,
  RAZORPAY_KEY_SECRET: optStr,
  RAZORPAY_WEBHOOK_SECRET: optStr,

  GEO_PROVIDER: z.enum(['local', 'mapbox']).default('local'),
  MAPBOX_TOKEN: optStr,

  GST_PERCENT: z.coerce.number().min(0).max(28).default(5),
  DRIVER_PAYOUT_PERCENT: z.coerce.number().min(0).max(100).default(82),
  CANCEL_FEE_RUPEES: z.coerce.number().int().min(0).default(0),

  SUPPLIER_NAME: z.string().default('Portex Logistics (set SUPPLIER_NAME)'),
  SUPPLIER_ADDRESS: z.string().default('Set SUPPLIER_ADDRESS'),
  SUPPLIER_STATE: z.string().default('Maharashtra'),
  SUPPLIER_GSTIN: optStr,
  SUPPLIER_SAC: z.string().default('996511'),

  LEADS_WEBHOOK_URL: optStr,

  DISPATCH_INTERVAL_MS: z.coerce.number().int().min(500).default(5000),
  OFFER_TTL_SECONDS: z.coerce.number().int().min(5).default(30),
  DISPATCH_TIMEOUT_MINUTES: z.coerce.number().int().min(1).default(10),
  DISPATCH_RADIUS_KM: z.coerce.number().min(1).default(15),
  RUN_DISPATCHER: bool('true')
});

export function loadConfig(env = process.env) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid configuration: ${msg}`);
  }
  const c = parsed.data;
  const isProd = c.NODE_ENV === 'production';
  const problems = [];

  if (c.SMS_PROVIDER === 'twilio' && !(c.TWILIO_ACCOUNT_SID && c.TWILIO_AUTH_TOKEN && c.TWILIO_FROM)) {
    problems.push('SMS_PROVIDER=twilio needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM');
  }
  if (c.PAYMENTS_PROVIDER === 'razorpay' && !(c.RAZORPAY_KEY_ID && c.RAZORPAY_KEY_SECRET && c.RAZORPAY_WEBHOOK_SECRET)) {
    problems.push('PAYMENTS_PROVIDER=razorpay needs RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET');
  }
  if (c.GEO_PROVIDER === 'mapbox' && !c.MAPBOX_TOKEN) problems.push('GEO_PROVIDER=mapbox needs MAPBOX_TOKEN');

  if (isProd) {
    if (c.DATABASE_URL.startsWith('pglite://')) problems.push('DATABASE_URL must be a real Postgres URL in production');
    if (/change|example|secret_here|dev/i.test(c.APP_SECRET)) problems.push('APP_SECRET looks like a placeholder');
    if (c.OTP_DEV_ECHO) problems.push('OTP_DEV_ECHO must be false in production');
    if (c.SMS_PROVIDER === 'console') problems.push('SMS_PROVIDER=console cannot be used in production');
    if (!c.CORS_ORIGINS) problems.push('CORS_ORIGINS must list your web origin(s)');
    if (c.COOKIE_SECURE === 'false') problems.push('COOKIE_SECURE=false is not allowed in production');
    if (c.PAYMENTS_PROVIDER === 'disabled') problems.push('PAYMENTS_PROVIDER=disabled: online payments would be unavailable (COD only)');
    if (/set SUPPLIER|Set SUPPLIER/.test(c.SUPPLIER_NAME + c.SUPPLIER_ADDRESS)) problems.push('SUPPLIER_NAME and SUPPLIER_ADDRESS must be set (they print on invoices)');
  }
  if (problems.length) throw new Error(`Unsafe configuration: ${problems.join('; ')}`);

  return Object.freeze({
    ...c,
    isProd,
    cookieSecure: c.COOKIE_SECURE ? c.COOKIE_SECURE === 'true' : isProd,
    corsOrigins: c.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
    gstRate: c.GST_PERCENT / 100
  });
}
