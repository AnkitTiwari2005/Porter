import { describe, it, expect } from 'vitest';
import { computeFare, promoApplies } from './pricing';
import { VEHICLES, PROMO_CODES } from '../data/mockData';

const bike = VEHICLES.find((v) => v.id === 'two-wheeler');
const ace = VEHICLES.find((v) => v.id === 'tata-ace');
const promo = (code) => PROMO_CODES.find((p) => p.code === code);

describe('computeFare', () => {
  it('never bills loading helpers on a bike', () => {
    expect(computeFare({ vehicle: bike, distanceKm: 5, helperCount: 2 }).helperCharge).toBe(0);
  });

  it('bills helpers on a truck', () => {
    expect(computeFare({ vehicle: ace, distanceKm: 5, helperCount: 2 }).helperCharge).toBe(300);
  });

  it('total = subtotal - discount + gst', () => {
    const f = computeFare({ vehicle: ace, distanceKm: 13.5, helperCount: 1, hasStop: true, promo: promo('FIRSTTRUCK') });
    expect(f.total).toBe(f.subtotal - f.discount + f.gst);
  });

  it('drops a stale discount when the fare falls below the coupon minimum', () => {
    const f = computeFare({ vehicle: bike, distanceKm: 1, promo: { ...promo('PORTER50'), minFare: 999 } });
    expect(f.discount).toBe(0);
  });
});

describe('promoApplies', () => {
  it('FREEDEL is 2-wheeler only', () => {
    expect(promoApplies(promo('FREEDEL'), ace, 500).ok).toBe(false);
    expect(promoApplies(promo('FREEDEL'), bike, 100).ok).toBe(true);
  });
  it('FIRSTTRUCK is truck only', () => {
    expect(promoApplies(promo('FIRSTTRUCK'), bike, 500).ok).toBe(false);
  });
});
