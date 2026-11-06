import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server/src/app.js';
import { createDb } from '../server/src/db.js';
import { migrate } from '../server/src/migrate.js';
import { seed } from '../server/src/seed.js';

let appPromise = null;

async function bootstrap() {
  const isPostgres = (process.env.DATABASE_URL || '').startsWith('postgres');
  
  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    const tmpDir = path.join(os.tmpdir(), 'portex-db');
    try { fs.mkdirSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
    databaseUrl = `pglite://${tmpDir}`;
  }

  const config = {
    NODE_ENV: isPostgres ? (process.env.NODE_ENV || 'production') : 'development',
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
    DATABASE_URL: databaseUrl,
    APP_SECRET: process.env.APP_SECRET || 'portex-serverless-secret-key-32-chars-long-minimum',
    PUBLIC_URL: process.env.PUBLIC_URL || 'https://portex-logistics.vercel.app',
    CORS_ORIGINS: process.env.CORS_ORIGINS || '',
    TRUST_PROXY: 1,
    COOKIE_SECURE: process.env.COOKIE_SECURE || 'true',
    BRAND_NAME: 'Portex',
    SMS_PROVIDER: process.env.SMS_PROVIDER || 'console',
    OTP_DEV_ECHO: process.env.OTP_DEV_ECHO === 'false' ? false : true,
    PAYMENTS_PROVIDER: process.env.PAYMENTS_PROVIDER || 'disabled',
    GEO_PROVIDER: process.env.GEO_PROVIDER || 'local',
    GST_PERCENT: 5,
    DRIVER_PAYOUT_PERCENT: 82,
    CANCEL_FEE_RUPEES: 0,
    SUPPLIER_NAME: 'Portex Freight Technologies Pvt. Ltd.',
    SUPPLIER_ADDRESS: '9, Guru Nanak Market, National Park, New Delhi, Delhi 110024',
    SUPPLIER_STATE: 'Delhi',
    gstRate: 0.05,
    cookieSecure: true,
    corsOrigins: [],
    RUN_DISPATCHER: false
  };

  const db = await createDb(config.DATABASE_URL);
  try {
    await migrate(db, console);
    await seed(db);
  } catch (err) {
    console.warn('Vercel bootstrap db migration/seed warning:', err.message);
  }

  const { app } = createApp({ config, db });
  return app;
}

export default async function handler(req, res) {
  if (!appPromise) {
    appPromise = bootstrap().catch((err) => {
      appPromise = null;
      console.error('Failed to initialize Portex API:', err);
      throw err;
    });
  }

  const app = await appPromise;

  // If Vercel rewrote req.url to the function path (/api/index.js or /api),
  // recover the original client URL from Vercel proxy headers.
  const forwardedUri = req.headers['x-forwarded-uri'] ||
                       req.headers['x-original-uri'] ||
                       req.headers['x-matched-path'];
  if (forwardedUri && (req.url === '/api' || req.url === '/api/' || req.url.startsWith('/api/index.js'))) {
    req.url = forwardedUri;
    req.originalUrl = forwardedUri;
  }

  return app(req, res);
}
