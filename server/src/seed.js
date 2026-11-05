import { VEHICLES } from '../../shared/vehicles.js';

// Idempotent: inserts defaults only when missing; never overwrites admin edits.
export async function seed(db) {
  for (const v of VEHICLES) {
    await db.query(
      `INSERT INTO vehicles (id, name, category, base_price, base_km, rate_per_km, eta_minutes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
      [v.id, v.name, v.category, v.basePrice, v.baseKm, v.ratePerKm, v.etaMinutes]
    );
  }
  const promos = [
    ['PORTEX20', 'Flat 20% off up to ₹50 on your first 3 rides', 20, 50, 99, null, 3],
    ['FIRSTTRUCK', '15% off up to ₹150 on your first mini truck booking', 15, 150, 250, ['truck'], 1],
    ['FREEDEL', '50% off up to ₹40 on 2-Wheeler delivery', 50, 40, 60, ['bike'], 5]
  ];
  for (const [code, description, pct, max, min, cats, perUser] of promos) {
    await db.query(
      `INSERT INTO promo_codes (code, description, discount_percent, max_discount, min_fare, categories, max_uses_per_user)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (code) DO NOTHING`,
      [code, description, pct, max, min, cats, perUser]
    );
  }
}
