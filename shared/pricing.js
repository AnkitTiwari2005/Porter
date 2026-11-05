// Pricing rules. Imported by BOTH the API (authoritative) and the web app (display only).
// All amounts are whole rupees. GST rate is passed in so it comes from server configuration.

export const DEFAULT_GST_RATE = 0.05;
export const HELPER_FEE = { 0: 0, 1: 150, 2: 300 };
export const STOP_FEE = 50;

export function promoApplies(promo, vehicle, subtotal) {
  if (!promo) return { ok: false, reason: '' };
  if (subtotal < promo.minFare) {
    return { ok: false, reason: `Minimum fare of ₹${promo.minFare} required for this coupon.` };
  }
  if (promo.categories && promo.categories.length && !promo.categories.includes(vehicle.category)) {
    const names = promo.categories.map((c) => (c === 'bike' ? '2-wheeler' : 'mini truck')).join(' / ');
    return { ok: false, reason: `This coupon is valid only on ${names} bookings.` };
  }
  return { ok: true, reason: '' };
}

// City delivery (bikes and mini trucks)
export function computeFare({ vehicle, distanceKm, helperCount = 0, hasStop = false, promo = null, gstRate = DEFAULT_GST_RATE }) {
  const base = Number(vehicle.basePrice) || 0;
  const rate = Number(vehicle.ratePerKm) || 0;
  const extraKm = Math.max(0, distanceKm - vehicle.baseKm);
  const distanceCharge = Math.round(extraKm * rate);
  const helperCharge = vehicle.category === 'truck' ? HELPER_FEE[helperCount] || 0 : 0;
  const stopCharge = hasStop ? STOP_FEE : 0;
  const subtotal = base + distanceCharge + helperCharge + stopCharge;

  const discount = promoApplies(promo, vehicle, subtotal).ok
    ? Math.min(Math.round((subtotal * promo.discountPercent) / 100), promo.maxDiscount)
    : 0;

  const taxable = Math.max(0, subtotal - discount);
  const gst = Math.round(taxable * gstRate);
  return {
    kind: 'city',
    baseFare: base,
    baseKm: vehicle.baseKm,
    extraKm: Number(extraKm.toFixed(1)),
    ratePerKm: rate,
    distanceCharge,
    helperCharge,
    stopCharge,
    subtotal,
    discount,
    taxable,
    gstRate,
    gst,
    total: taxable + gst
  };
}

// Home shifting. Package prices are GST-inclusive; GST is shown as the embedded component.
export const PACKERS_PLANS = [
  { id: '1rk', label: '1 RK / Studio', base: 3200, vehicleId: 'tata-ace' },
  { id: '1bhk', label: '1 BHK Apartment', base: 4900, vehicleId: 'tata-ace' },
  { id: '2bhk', label: '2 BHK Apartment', base: 7800, vehicleId: 'pickup-8ft' },
  { id: '3bhk', label: '3 BHK / Villa', base: 11900, vehicleId: 'truck-14ft' },
  { id: 'few', label: 'Few Items / Mini Shift', base: 1800, vehicleId: 'three-wheeler' }
];
export const PACKERS_EXTRAS = { noLiftPickup: 400, noLiftDrop: 400, dismantling: 600 };

export function computePackers({ planId, hasLiftPickup = true, hasLiftDrop = true, needDismantling = false, gstRate = DEFAULT_GST_RATE }) {
  const plan = PACKERS_PLANS.find((p) => p.id === planId);
  if (!plan) return null;
  const extras = (hasLiftPickup ? 0 : PACKERS_EXTRAS.noLiftPickup) + (hasLiftDrop ? 0 : PACKERS_EXTRAS.noLiftDrop) + (needDismantling ? PACKERS_EXTRAS.dismantling : 0);
  const total = plan.base + extras;
  const taxable = Math.round(total / (1 + gstRate));
  return { kind: 'packers', planId: plan.id, vehicleId: plan.vehicleId, planLabel: plan.label, baseFare: plan.base, extras, subtotal: total, discount: 0, taxable, gstRate, gst: total - taxable, total, gstInclusive: true };
}

// All-India parcel
export const PARCEL_RATES = {
  air: { base: 180, perKg: 65, eta: '24 - 48 Hours' },
  surface: { base: 90, perKg: 35, eta: '3 - 5 Days' }
};
export const PARCEL_MAX_KG = 50;

export function computeParcel({ mode, weightKg, gstRate = DEFAULT_GST_RATE }) {
  const r = PARCEL_RATES[mode];
  if (!r || !(weightKg > 0) || weightKg > PARCEL_MAX_KG) return null;
  const weightCharge = Math.round(weightKg * r.perKg);
  const subtotal = r.base + weightCharge;
  const gst = Math.round(subtotal * gstRate);
  return { kind: 'parcel', mode, weightKg, baseFare: r.base, weightCharge, subtotal, discount: 0, taxable: subtotal, gstRate, gst, total: subtotal + gst, eta: r.eta };
}
