// Usage: node src/cli/create-user.js --phone 9876543210 --role admin --name "Asha"
import { loadConfig } from '../config.js';
import { createDb } from '../db.js';
import { migrate } from '../migrate.js';
import { PHONE_RE } from '../services/auth.js';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith('--') ? [...a, [v.slice(2), all[i + 1]]] : a), []));
if (!PHONE_RE.test(args.phone || '') || !['admin', 'customer'].includes(args.role || '')) {
  console.error('Usage: create-user --phone <10 digits> --role <admin|customer> [--name <name>]   (create drivers from the admin panel)');
  process.exit(1);
}
const config = loadConfig();
const db = await createDb(config.DATABASE_URL);
await migrate(db, console);
const r = await db.query(
  `INSERT INTO users (phone, name, role) VALUES ($1,$2,$3)
   ON CONFLICT (phone) DO UPDATE SET role = EXCLUDED.role, name = COALESCE(EXCLUDED.name, users.name) RETURNING id, phone, role`,
  [args.phone, args.name || null, args.role]);
console.log('ok', r.rows[0]);
await db.close();
