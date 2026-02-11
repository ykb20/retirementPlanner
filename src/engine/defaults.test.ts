import { describe, it, expect } from 'vitest';
import { defaultInputs } from './defaults';

describe('defaultInputs', () => {
  it('has a valid filing status', () => {
    expect(['single', 'married']).toContain(defaultInputs.filingStatus);
  });

  it('has expense phases with ascending start years', () => {
    const { expensePhases } = defaultInputs;
    expect(expensePhases.length).toBeGreaterThan(0);
    for (let i = 1; i < expensePhases.length; i++) {
      expect(expensePhases[i].startYear).toBeGreaterThan(
        expensePhases[i - 1].startYear
      );
    }
  });

  it('has non-negative balances', () => {
    expect(defaultInputs.taxDeferredBalance).toBeGreaterThanOrEqual(0);
    expect(defaultInputs.taxableBalance).toBeGreaterThanOrEqual(0);
  });

  it('stores rates as decimals (less than 1)', () => {
    expect(defaultInputs.preRetNominalGrowth).toBeGreaterThan(0);
    expect(defaultInputs.preRetNominalGrowth).toBeLessThan(1);
    expect(defaultInputs.postRetNominalGrowth).toBeGreaterThan(0);
    expect(defaultInputs.postRetNominalGrowth).toBeLessThan(1);
    expect(defaultInputs.inflationRate).toBeGreaterThan(0);
    expect(defaultInputs.inflationRate).toBeLessThan(1);
    expect(defaultInputs.effectiveTaxRate).toBeGreaterThan(0);
    expect(defaultInputs.effectiveTaxRate).toBeLessThan(1);
  });
});
