export const HELPER_FEE = { 0: 0, 1: 150, 2: 300 };
export const STOP_FEE = 50;
export const GST_RATE = 0.05;

export function promoApplies(promo, vehicle, subtotal) {
  if (!promo) return { ok: false, reason: '' };
  if (subtotal < promo.minFare) {
    return { ok: false, reason: `Minimum fare of ₹${promo.minFare} required for this coupon.` };
  }
  if (promo.categories && !promo.categories.includes(vehicle.category)) {
    const names = promo.categories.map((c) => (c === 'bike' ? '2-wheeler' : 'mini truck')).join(' / ');
    return { ok: false, reason: `This coupon is valid only on ${names} bookings.` };
  }
  return { ok: true, reason: '' };
}

export function computeFare({ vehicle, distanceKm, helperCount = 0, hasStop = false, promo = null }) {
  const base = Number(vehicle.basePrice) || 0;
  const rate = Number(vehicle.ratePerKm) || 0;
  const extraKm = Math.max(0, distanceKm - vehicle.baseKm);
  const distanceCharge = Math.round(extraKm * rate);
  // Helpers only exist for trucks; never bill them on a bike.
  const helperCharge = vehicle.category === 'truck' ? HELPER_FEE[helperCount] || 0 : 0;
  const stopCharge = hasStop ? STOP_FEE : 0;
  const subtotal = base + distanceCharge + helperCharge + stopCharge;

  // Re-validated on every calculation, so changing vehicle/distance can't keep a stale discount.
  const discount = promoApplies(promo, vehicle, subtotal).ok
    ? Math.min(Math.round((subtotal * promo.discountPercent) / 100), promo.maxDiscount)
    : 0;

  const taxable = Math.max(0, subtotal - discount);
  const gst = Math.round(taxable * GST_RATE);
  return {
    baseFare: base,
    baseKm: vehicle.baseKm,
    extraKm: Number(extraKm.toFixed(1)),
    ratePerKm: rate,
    distanceCharge,
    helperCharge,
    stopCharge,
    subtotal,
    discount,
    gst,
    total: taxable + gst
  };
}
