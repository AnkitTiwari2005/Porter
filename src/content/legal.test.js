import { describe, it, expect } from 'vitest';
import { legalPages } from './legal';

const base = { brand: 'Portex', email: 'help@x.in', phone: '1800', cancelFee: 0, gstPercent: 5 };

describe('legal pages', () => {
  const pages = legalPages(base);
  it('defines every policy linked from the footer', () => {
    expect(Object.keys(pages).sort()).toEqual(['privacy', 'refunds', 'safety', 'terms']);
    for (const p of Object.values(pages)) { expect(p.title).toBeTruthy(); expect(p.sections.length).toBeGreaterThan(3); }
  });
  it('never renders template leftovers', () => {
    const text = JSON.stringify(pages);
    expect(text).not.toMatch(/undefined|\[object|NaN|\$\{/);
  });
  it('states the cancellation fee that the API will actually charge', () => {
    expect(JSON.stringify(legalPages(base).refunds)).toContain('no cancellation fee applies');
    expect(JSON.stringify(legalPages({ ...base, cancelFee: 30 }).refunds)).toContain('₹30');
  });
  it('uses the configured GST rate and does not promise insurance', () => {
    expect(JSON.stringify(legalPages({ ...base, gstPercent: 18 }).terms)).toContain('GST at 18%');
    expect(JSON.stringify(pages.terms)).toContain('do not currently offer transit insurance');
  });
  it('flags every business decision with [CONFIRM] so none is mistaken for settled policy', () => {
    expect(JSON.stringify(pages.terms).match(/\[CONFIRM/g).length).toBeGreaterThanOrEqual(4);
  });
});
