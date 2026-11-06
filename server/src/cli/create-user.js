// Usage: node src/cli/create-user.js --phone 9876543210 --role <admin|customer|driver> [--name "Asha"]
import { loadConfig } from '../config.js';
import { createDb } from '../db.js';
import { migrate } from '../migrate.js';
import { seed } from '../seed.js';
import { PHONE_RE } from '../services/auth.js';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith('--') ? [...a, [v.slice(2), all[i + 1]]] : a), []));
if (!PHONE_RE.test(args.phone || '') || !['admin', 'customer', 'driver'].includes(args.role || '')) {
  console.error('Usage: create-user --phone <10 digits> --role <admin|customer|driver> [--name <name>] [--city <cityId>] [--vehicle <vehicleId>] [--vehicleNo <plate>]');
  process.exit(1);
}

const config = loadConfig();
const db = await createDb(config.DATABASE_URL);
await migrate(db, console);
await seed(db);

const out = await db.tx(async (t) => {
  const r = await t.query(
    `INSERT INTO users (phone, name, role) VALUES ($1,$2,$3)
     ON CONFLICT (phone) DO UPDATE SET role = EXCLUDED.role, name = COALESCE(EXCLUDED.name, users.name) RETURNING id, phone, role`,
    [args.phone, args.name || null, args.role]
  );
  const u = r.rows[0];

  if (args.role === 'driver') {
    const cityId = args.city || 'mumbai';
    const vehicleId = args.vehicle || 'tata-ace';
    const vehicleNo = args.vehicleNo || 'MH 02 AT 8837';
    await t.query(
      `INSERT INTO drivers (user_id, city_id, vehicle_id, vehicle_no, status, online)
       VALUES ($1, $2, $3, $4, 'approved', true)
       ON CONFLICT (user_id) DO UPDATE SET city_id = EXCLUDED.city_id, vehicle_id = EXCLUDED.vehicle_id, vehicle_no = EXCLUDED.vehicle_no, status = 'approved', online = true`,
      [u.id, cityId, vehicleId, vehicleNo]
    );
  }
  return u;
});

console.log('User created successfully:', out);
await db.close();
