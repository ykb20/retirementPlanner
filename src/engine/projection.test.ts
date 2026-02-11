import { describe, it, expect } from 'vitest';
import { getActivePhase, runProjection } from './projection';
import { defaultInputs } from './defaults';
import type { Inputs, ExpensePhase } from '../types';

// ---------------------------------------------------------------------------
// getActivePhase
// ---------------------------------------------------------------------------
describe('getActivePhase', () => {
  const phases: ExpensePhase[] = [
    { id: '1', label: 'Phase A', annualPostTax: 90000, startYear: 2030 },
    { id: '2', label: 'Phase B', annualPostTax: 80000, startYear: 2035 },
    { id: '3', label: 'Phase C', annualPostTax: 70000, startYear: 2040 },
  ];

  it('returns null when year is before all phases', () => {
    expect(getActivePhase(phases, 2025)).toBeNull();
  });

  it('returns the first phase when year equals its start year', () => {
    expect(getActivePhase(phases, 2030)).toEqual(phases[0]);
  });

  it('returns the correct phase when year is between phases', () => {
    expect(getActivePhase(phases, 2037)).toEqual(phases[1]);
  });

  it('returns the last phase when year is after all start years', () => {
    expect(getActivePhase(phases, 2050)).toEqual(phases[2]);
  });

  it('returns null for an empty phases array', () => {
    expect(getActivePhase([], 2030)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// runProjection
// ---------------------------------------------------------------------------
describe('runProjection', () => {
  const currentYear = new Date().getFullYear();

  function makeInputs(overrides: Partial<Inputs> = {}): Inputs {
    return { ...defaultInputs, ...overrides };
  }

  it('starts with a row for the current year', () => {
    const result = runProjection(makeInputs());
    expect(result.rows[0].year).toBe(currentYear);
  });

  it('applies portfolio growth in the first year', () => {
    const inputs = makeInputs({
      taxDeferredBalance: 100000,
      taxableBalance: 0,
      expensePhases: [],
    });
    const result = runProjection(inputs);
    const firstRow = result.rows[0];
    // Growth + contributions should make balance > starting balance
    expect(firstRow.taxDeferred).toBeGreaterThan(100000);
  });

  it('does not deplete with default inputs', () => {
    const result = runProjection(makeInputs());
    expect(result.depletionYear).toBeNull();
    expect(result.finalBalance).toBeGreaterThan(0);
  });

  it('depletes when expenses are very high', () => {
    const inputs = makeInputs({
      taxDeferredBalance: 50000,
      taxableBalance: 10000,
      person1: {
        ...defaultInputs.person1,
        retirementYear: currentYear,
        ssAmount: 0,
        pensionAmount: 0,
        annual401k: 0,
        annualTaxableSavings: 0,
      },
      person2: {
        ...defaultInputs.person2,
        retirementYear: currentYear,
        ssAmount: 0,
        pensionAmount: 0,
        annual401k: 0,
        annualTaxableSavings: 0,
      },
      expensePhases: [
        { id: '1', label: 'Expensive', annualPostTax: 500000, startYear: currentYear },
      ],
    });
    const result = runProjection(inputs);
    expect(result.depletionYear).not.toBeNull();
    const lastRow = result.rows[result.rows.length - 1];
    expect(lastRow.depleted).toBe(true);
  });

  it('sets person2Age to 0 in single filing status', () => {
    const inputs = makeInputs({ filingStatus: 'single' });
    const result = runProjection(inputs);
    for (const row of result.rows) {
      expect(row.person2Age).toBe(0);
    }
  });

  it('withdraws from taxable before tax-deferred', () => {
    const inputs = makeInputs({
      taxDeferredBalance: 100000,
      taxableBalance: 100000,
      person1: {
        ...defaultInputs.person1,
        retirementYear: currentYear,
        ssAmount: 0,
        pensionAmount: 0,
        annual401k: 0,
        annualTaxableSavings: 0,
      },
      person2: {
        ...defaultInputs.person2,
        retirementYear: currentYear,
        ssAmount: 0,
        pensionAmount: 0,
        annual401k: 0,
        annualTaxableSavings: 0,
      },
      expensePhases: [
        { id: '1', label: 'Phase 1', annualPostTax: 50000, startYear: currentYear },
      ],
    });
    const result = runProjection(inputs);
    const firstRow = result.rows[0];
    // Taxable should be drawn down first, so taxDeferred should remain higher
    // relative to what it would be if withdrawn first
    expect(firstRow.withdrawal).toBeGreaterThan(0);
    // After growth, taxable should be less than tax-deferred because
    // withdrawals came from taxable first
    expect(firstRow.taxable).toBeLessThan(firstRow.taxDeferred);
  });

  it('labels pre-retirement rows as Accumulation when no phase is active', () => {
    const inputs = makeInputs({
      person1: {
        ...defaultInputs.person1,
        retirementYear: currentYear + 5,
      },
      person2: {
        ...defaultInputs.person2,
        retirementYear: currentYear + 5,
      },
      expensePhases: [
        { id: '1', label: 'Retired', annualPostTax: 80000, startYear: currentYear + 5 },
      ],
    });
    const result = runProjection(inputs);
    const preRetRows = result.rows.filter((r) => r.year < currentYear + 5);
    for (const row of preRetRows) {
      expect(row.phase).toBe('Accumulation');
    }
  });
});
