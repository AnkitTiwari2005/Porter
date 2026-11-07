import { CITIES, CITY_COORDINATES, haversineKm, cityById } from '../../../shared/cities.js';
import { computeFare, computePackers, computeParcel, PACKERS_PLANS, PARCEL_RATES, PARCEL_MAX_KG, promoApplies } from '../../../shared/pricing.js';
import { badRequest, notFound } from '../lib/errors.js';

const MAX_CITY_RADIUS_KM = 80;   // a point further than this from the city centre is not in that city
const MAX_CITY_TRIP_KM = 60;     // longer hauls belong to the all-India parcel product
const MIN_TRIP_KM = 0.1;

const vehicleFromRow = (r) => ({ id: r.id, name: r.name, category: r.category, basePrice: r.base_price, baseKm: r.base_km, ratePerKm: r.rate_per_km, etaMinutes: r.eta_minutes, active: r.active });
const promoFromRow = (r) => r && ({
  code: r.code, description: r.description, discountPercent: r.discount_percent, maxDiscount: r.max_discount, minFare: r.min_fare,
  categories: r.categories, maxUsesPerUser: r.max_uses_per_user, maxTotalUses: r.max_total_uses, startsAt: r.starts_at, endsAt: r.ends_at, active: r.active
});

export function createQuotes({ db, config, geo, clock }) {
  async function getCatalog() {
    const v = await db.query('SELECT * FROM vehicles WHERE active = true ORDER BY base_price');
    return {
      cities: CITIES,
      vehicles: v.rows.map(vehicleFromRow),
      packersPlans: PACKERS_PLANS,
      parcel: { rates: PARCEL_RATES, maxKg: PARCEL_MAX_KG },
      gstRate: config.gstRate,
      brand: config.BRAND_NAME,
      codAllowedFor: ['city'],
      paymentsEnabled: config.PAYMENTS_PROVIDER === 'razorpay',
      cancelFeeRupees: config.CANCEL_FEE_RUPEES
    };
  }

  async function getVehicle(id, q = db) {
    const r = await q.query('SELECT * FROM vehicles WHERE id = $1', [id]);
    if (!r.rows[0] || !r.rows[0].active) throw badRequest('vehicle_unavailable', 'That vehicle is not available.');
    return vehicleFromRow(r.rows[0]);
  }

  async function resolvePoint(p, cityId, label) {
    const city = CITY_COORDINATES[cityId];
    let lat = p.lat;
    let lng = p.lng;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      const hit = await geo.geocode(p.address, cityId);
      if (!hit) throw badRequest('address_not_found', `We could not locate the ${label} address. Pick a suggestion from the list.`);
      ({ lat, lng } = hit);
    }
    if (lat < 6 || lat > 38 || lng < 68 || lng > 98) throw badRequest('outside_india', `The ${label} location is outside India.`);
    if (haversineKm(city.center, [lat, lng]) > MAX_CITY_RADIUS_KM) {
      throw badRequest('outside_city', `The ${label} location is outside the selected city. Change the city or the address.`);
    }
    return { address: String(p.address).trim(), lat, lng };
  }

  // Returns { promo, error }. A promo that cannot be used yields an error string but never throws.
  async function loadPromo(code, userId, q = db) {
    if (!code) return { promo: null, error: null };
    const c = String(code).trim().toUpperCase();
    const row = promoFromRow((await q.query('SELECT * FROM promo_codes WHERE code = $1', [c])).rows[0]);
    const now = clock.now();
    if (!row || !row.active) return { promo: null, error: 'Invalid coupon code.' };
    if ((row.startsAt && row.startsAt > now) || (row.endsAt && row.endsAt < now)) return { promo: null, error: 'This coupon is not active right now.' };
    if (row.maxTotalUses != null) {
      const n = (await q.query('SELECT count(*)::int AS n FROM promo_redemptions WHERE code = $1', [c])).rows[0].n;
      if (n >= row.maxTotalUses) return { promo: null, error: 'This coupon has reached its usage limit.' };
    }
    if (row.maxUsesPerUser != null && userId) {
      const n = (await q.query('SELECT count(*)::int AS n FROM promo_redemptions WHERE code = $1 AND user_id = $2', [c, userId])).rows[0].n;
      if (n >= row.maxUsesPerUser) return { promo: null, error: 'You have already used this coupon the maximum number of times.' };
    }
    return { promo: row, error: null };
  }

  async function quoteCity(input, userId, q = db) {
    if (!cityById(input.cityId)) throw badRequest('unknown_city', 'We do not operate in that city yet.');
    const vehicle = await getVehicle(input.vehicleId, q);
    const pickup = await resolvePoint(input.pickup, input.cityId, 'pickup');
    const drop = await resolvePoint(input.drop, input.cityId, 'drop');
    if (haversineKm([pickup.lat, pickup.lng], [drop.lat, drop.lng]) < MIN_TRIP_KM) {
      throw badRequest('same_location', 'Pickup and drop cannot be the same place.');
    }
    const stop = input.stop ? await resolvePoint(input.stop, input.cityId, 'stop') : null;
    let route;
    if (stop) {
      // pickup -> stop -> drop: priced on the full distance, drawn as one continuous route
      const a = await geo.route([pickup.lat, pickup.lng], [stop.lat, stop.lng]);
      const b = await geo.route([stop.lat, stop.lng], [drop.lat, drop.lng]);
      route = { km: Number((a.km + b.km).toFixed(1)), minutes: a.minutes + b.minutes, line: [...a.line, ...b.line.slice(1)], approximate: !!(a.approximate || b.approximate) };
    } else {
      route = await geo.route([pickup.lat, pickup.lng], [drop.lat, drop.lng]);
    }
    if (route.km > MAX_CITY_TRIP_KM) throw badRequest('too_far', `City delivery is limited to ${MAX_CITY_TRIP_KM} km. For longer distances use All-India Parcel.`);

    const { promo, error: promoLoadError } = await loadPromo(input.promoCode, userId, q);
    const pricing = computeFare({ vehicle, distanceKm: route.km, helperCount: input.helperCount || 0, hasStop: !!stop, promo, gstRate: config.gstRate });
    let promoError = promoLoadError;
    if (promo && pricing.discount === 0) promoError = promoApplies(promo, vehicle, pricing.subtotal).reason || 'This coupon cannot be applied.';
    return {
      serviceType: 'city', cityId: input.cityId, vehicle, pickup, drop, stop, distanceKm: route.km, etaMinutes: vehicle.etaMinutes,
      route: { line: route.line, minutes: route.minutes, approximate: route.approximate }, pricing,
      promo: input.promoCode ? { code: String(input.promoCode).toUpperCase(), valid: !promoError && pricing.discount > 0, error: promoError } : null,
      promoRow: promoError ? null : promo
    };
  }

  async function quotePackers(input, q = db) {
    if (!cityById(input.cityId)) throw badRequest('unknown_city', 'We do not operate in that city yet.');
    const pricing = computePackers({ ...input, gstRate: config.gstRate });
    if (!pricing) throw badRequest('invalid_plan', 'Choose a valid home size.');
    const vehicle = await getVehicle(pricing.vehicleId, q);
    const pickup = await resolvePoint(input.pickup, input.cityId, 'current house');
    const drop = await resolvePoint(input.drop, input.cityId, 'new house');
    const route = await geo.route([pickup.lat, pickup.lng], [drop.lat, drop.lng]);
    return { serviceType: 'packers', cityId: input.cityId, vehicle, pickup, drop, distanceKm: route.km, route: { line: route.line, minutes: route.minutes, approximate: route.approximate }, pricing, promo: null, promoRow: null };
  }

  function quoteParcel(input) {
    const pricing = computeParcel({ mode: input.mode, weightKg: input.weightKg, gstRate: config.gstRate });
    if (!pricing) throw badRequest('invalid_parcel', `Weight must be between 0.1 and ${PARCEL_MAX_KG} kg.`);
    if (!cityById(input.cityId)) throw badRequest('unknown_city', 'We do not operate in that city yet.');
    return {
      serviceType: 'parcel', cityId: input.cityId, vehicle: null,
      pickup: { address: `Pincode ${input.pickupPincode}${input.pickupAddress ? `, ${input.pickupAddress}` : ''}`, lat: null, lng: null },
      drop: { address: `Pincode ${input.dropPincode}${input.dropAddress ? `, ${input.dropAddress}` : ''}`, lat: null, lng: null },
      distanceKm: null, route: null, pricing, promo: null, promoRow: null
    };
  }

  async function quote(input, userId, q = db) {
    if (input.serviceType === 'packers') return quotePackers(input, q);
    if (input.serviceType === 'parcel') return quoteParcel(input);
    return quoteCity(input, userId, q);
  }

  return { getCatalog, getVehicle, quote, loadPromo, resolvePoint, notFound };
}
