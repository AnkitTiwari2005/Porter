import { describe, it, expect } from 'vitest';
import { computeFare, computePackers, computeParcel, promoApplies, PARCEL_MAX_KG } from './pricing.js';
import { VEHICLES } from './vehicles.js';

const bike = VEHICLES.find((v) => v.id === 'two-wheeler');
const ace = VEHICLES.find((v) => v.id === 'tata-ace');
const FIRSTTRUCK = { code: 'FIRSTTRUCK', discountPercent: 15, maxDiscount: 150, minFare: 250, categories: ['truck'] };
const FREEDEL = { code: 'FREEDEL', discountPercent: 50, maxDiscount: 40, minFare: 60, categories: ['bike'] };

describe('computeFare', () => {
  it('never bills loading helpers on a bike, and bills them on a truck', () => {
    expect(computeFare({ vehicle: bike, distanceKm: 5, helperCount: 2 }).helperCharge).toBe(0);
    expect(computeFare({ vehicle: ace, distanceKm: 5, helperCount: 2 }).helperCharge).toBe(300);
  });
  it('total = taxable + gst, and taxable = subtotal - discount', () => {
    const f = computeFare({ vehicle: ace, distanceKm: 13.5, helperCount: 1, hasStop: true, promo: FIRSTTRUCK });
    expect(f.taxable).toBe(f.subtotal - f.discount);
    expect(f.total).toBe(f.taxable + f.gst);
    expect(f.discount).toBeGreaterThan(0);
  });
  it('charges only for distance beyond the included kilometres', () => {
    expect(computeFare({ vehicle: ace, distanceKm: ace.baseKm }).distanceCharge).toBe(0);
    expect(computeFare({ vehicle: ace, distanceKm: ace.baseKm + 10 }).distanceCharge).toBe(Math.round(10 * ace.ratePerKm));
  });
  it('drops a discount when the fare is below the coupon minimum', () => {
    expect(computeFare({ vehicle: bike, distanceKm: 1, promo: { ...FREEDEL, minFare: 999 } }).discount).toBe(0);
  });
  it('uses the configured GST rate', () => {
    expect(computeFare({ vehicle: ace, distanceKm: 5, gstRate: 0.18 }).gst).toBe(Math.round(computeFare({ vehicle: ace, distanceKm: 5, gstRate: 0 }).total * 0.18));
  });
});

describe('promoApplies', () => {
  it('enforces category rules', () => {
    expect(promoApplies(FREEDEL, ace, 500).ok).toBe(false);
    expect(promoApplies(FREEDEL, bike, 100).ok).toBe(true);
    expect(promoApplies(FIRSTTRUCK, bike, 500).ok).toBe(false);
  });
});

describe('computePackers', () => {
  it('treats the package price as GST-inclusive and never changes the total', () => {
    const p = computePackers({ planId: '2bhk', hasLiftPickup: false, needDismantling: true });
    expect(p.total).toBe(7800 + 400 + 600);
    expect(p.taxable + p.gst).toBe(p.total);
  });
  it('rejects unknown plans', () => { expect(computePackers({ planId: 'castle' })).toBeNull(); });
});

describe('computeParcel', () => {
  it('prices by mode and weight', () => {
    expect(computeParcel({ mode: 'air', weightKg: 2.5 }).subtotal).toBe(180 + Math.round(2.5 * 65));
    expect(computeParcel({ mode: 'surface', weightKg: 10 }).subtotal).toBe(90 + 350);
  });
  it('rejects invalid weights and modes', () => {
    expect(computeParcel({ mode: 'air', weightKg: 0 })).toBeNull();
    expect(computeParcel({ mode: 'air', weightKg: PARCEL_MAX_KG + 1 })).toBeNull();
    expect(computeParcel({ mode: 'sea', weightKg: 1 })).toBeNull();
  });
});
