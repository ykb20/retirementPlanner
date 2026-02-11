import { describe, it, expect } from 'vitest';
import { grossUp, realReturn } from './helpers';

describe('grossUp', () => {
  it('returns the same amount when tax rate is zero', () => {
    expect(grossUp(1000, 0.75, 0)).toBe(1000);
  });

  it('returns the same amount when taxable portion is zero', () => {
    expect(grossUp(1000, 0, 0.25)).toBe(1000);
  });

  it('grosses up a typical case correctly', () => {
    // postTax=1000, taxablePortion=0.75, taxRate=0.25
    // preTax = 1000 / (1 - 0.75 * 0.25) = 1000 / 0.8125 ≈ 1230.77
    const result = grossUp(1000, 0.75, 0.25);
    expect(result).toBeCloseTo(1230.77, 2);
  });

  it('grosses up a fully taxable withdrawal', () => {
    // postTax=1000, taxablePortion=1.0, taxRate=0.30
    // preTax = 1000 / (1 - 0.30) = 1000 / 0.70 ≈ 1428.57
    const result = grossUp(1000, 1.0, 0.30);
    expect(result).toBeCloseTo(1428.57, 2);
  });
});

describe('realReturn', () => {
  it('computes real return from nominal and inflation', () => {
    expect(realReturn(0.06, 0.025)).toBeCloseTo(0.035, 6);
  });

  it('returns zero when nominal equals inflation', () => {
    expect(realReturn(0.03, 0.03)).toBe(0);
  });

  it('returns negative when inflation exceeds nominal', () => {
    expect(realReturn(0.02, 0.04)).toBeCloseTo(-0.02, 6);
  });
});
