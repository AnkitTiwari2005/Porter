import { loadConfig } from './config.js';
import { createDb } from './db.js';
import { migrate } from './migrate.js';
import { seed } from './seed.js';
import { createApp } from './app.js';

const config = loadConfig();
const db = await createDb(config.DATABASE_URL);
const { app, dispatcher, hub, close, log } = createApp({ config, db });

if (config.NODE_ENV !== 'production' || process.env.AUTO_MIGRATE === 'true') {
  await migrate(db, log);
  await seed(db);
}
if (!config.SUPPLIER_GSTIN && config.GST_PERCENT > 0) log.warn('SUPPLIER_GSTIN is not set but GST is being charged: invoices will not show a GSTIN. Confirm your tax registration.');

const server = app.listen(config.PORT, () => log.info(`API listening on :${config.PORT} (${config.NODE_ENV})`));
await hub.start();
if (config.RUN_DISPATCHER) dispatcher.start();

let closing = false;
async function shutdown(signal) {
  if (closing) return;
  closing = true;
  log.info(`${signal} received, shutting down`);
  close();
  server.close(async () => { await db.close().catch(() => {}); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (e) => log.error({ err: e }, 'unhandledRejection'));
