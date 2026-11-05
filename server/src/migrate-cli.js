import { loadConfig } from './config.js';
import { createDb } from './db.js';
import { migrate } from './migrate.js';
import { seed } from './seed.js';

const config = loadConfig();
const db = await createDb(config.DATABASE_URL);
const n = await migrate(db, console);
await seed(db);
console.log(`done (${n} migration(s) applied)`);
await db.close();
