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

// ---------------------------------------------------------------------------
// runProjection – nominal mode
// ---------------------------------------------------------------------------
describe('runProjection (nominal mode)', () => {
  const currentYear = new Date().getFullYear();

  function makeInputs(overrides: Partial<Inputs> = {}): Inputs {
    return { ...defaultInputs, ...overrides };
  }

  it('uses full nominal growth rate instead of real rate', () => {
    const inputs = makeInputs({
      taxDeferredBalance: 100000,
      taxableBalance: 0,
      preRetNominalGrowth: 0.06,
      inflationRate: 0.025,
      expensePhases: [],
      person1: { ...defaultInputs.person1, annual401k: 0, annualTaxableSavings: 0 },
      person2: { ...defaultInputs.person2, annual401k: 0, annualTaxableSavings: 0 },
    });

    const nominalResult = runProjection(inputs, 'nominal');
    const realResult = runProjection(inputs, 'real');

    // Nominal balances grow faster since they use 6% instead of ~3.5%
    expect(nominalResult.rows[0].taxDeferred).toBeGreaterThan(realResult.rows[0].taxDeferred);
    // Verify exact nominal growth: 100000 * 1.06
    expect(nominalResult.rows[0].taxDeferred).toBeCloseTo(106000, 0);
  });

  it('inflates contributions in nominal mode', () => {
    const annual401k = 20000;
    const inputs = makeInputs({
      taxDeferredBalance: 0,
      taxableBalance: 0,
      preRetNominalGrowth: 0,
      inflationRate: 0.03,
      person1: {
        ...defaultInputs.person1,
        retirementYear: currentYear + 3,
        annual401k,
        annualTaxableSavings: 0,
      },
      filingStatus: 'single' as const,
      expensePhases: [],
    });

    const nominalResult = runProjection(inputs, 'nominal');
    const realResult = runProjection(inputs, 'real');

    // With 0% growth, real mode contributes 20000 each year (constant dollars)
    // Nominal mode inflates: year0 = 20000, year1 = 20000*1.03, year2 = 20000*1.03^2
    // After 3 years of contributions (years 0,1,2), nominal total should exceed real
    const nominalRow2 = nominalResult.rows[2];
    const realRow2 = realResult.rows[2];
    expect(nominalRow2.taxDeferred).toBeGreaterThan(realRow2.taxDeferred);
  });

  it('inflates expenses in nominal mode', () => {
    const inputs = makeInputs({
      taxDeferredBalance: 1000000,
      taxableBalance: 0,
      preRetNominalGrowth: 0,
      postRetNominalGrowth: 0,
      inflationRate: 0.03,
      filingStatus: 'single' as const,
      person1: {
        ...defaultInputs.person1,
        retirementYear: currentYear,
        ssAmount: 0,
        pensionAmount: 0,
        annual401k: 0,
        annualTaxableSavings: 0,
      },
      expensePhases: [
        { id: '1', label: 'Retired', annualPostTax: 50000, startYear: currentYear },
      ],
    });

    const nominalResult = runProjection(inputs, 'nominal');
    const realResult = runProjection(inputs, 'real');

    // In year 0, inflation factor = 1, so expenses should match
    expect(nominalResult.rows[0].grossExpense).toBeCloseTo(realResult.rows[0].grossExpense, 2);

    // In year 1+, nominal expenses should be larger due to inflation
    expect(nominalResult.rows[1].grossExpense).toBeGreaterThan(realResult.rows[1].grossExpense);
  });

  it('inflates income streams in nominal mode', () => {
    const inputs = makeInputs({
      taxDeferredBalance: 0,
      taxableBalance: 0,
      preRetNominalGrowth: 0,
      postRetNominalGrowth: 0,
      inflationRate: 0.03,
      filingStatus: 'single' as const,
      person1: {
        ...defaultInputs.person1,
        retirementYear: currentYear,
        pensionAmount: 24000,
        pensionStartYear: currentYear,
        ssAmount: 0,
        annual401k: 0,
        annualTaxableSavings: 0,
      },
      expensePhases: [],
    });

    const nominalResult = runProjection(inputs, 'nominal');

    // Year 0: inflation factor = 1, pension = 24000
    expect(nominalResult.rows[0].person1Pension).toBe(24000);
    // Year 1: inflation factor = 1.03, pension = 24000 * 1.03 = 24720
    expect(nominalResult.rows[1].person1Pension).toBeCloseTo(24720, 0);
  });

  it('defaults to real mode when mode is not specified', () => {
    const inputs = makeInputs({
      taxDeferredBalance: 100000,
      taxableBalance: 0,
      preRetNominalGrowth: 0.06,
      inflationRate: 0.025,
      expensePhases: [],
      person1: { ...defaultInputs.person1, annual401k: 0, annualTaxableSavings: 0 },
      person2: { ...defaultInputs.person2, annual401k: 0, annualTaxableSavings: 0 },
    });

    const defaultResult = runProjection(inputs);
    const realResult = runProjection(inputs, 'real');

    expect(defaultResult.rows[0].taxDeferred).toBe(realResult.rows[0].taxDeferred);
  });

  it('produces identical results to real mode when inflation is zero', () => {
    const inputs = makeInputs({
      inflationRate: 0,
      preRetNominalGrowth: 0.06,
      postRetNominalGrowth: 0.05,
    });

    const nominalResult = runProjection(inputs, 'nominal');
    const realResult = runProjection(inputs, 'real');

    expect(nominalResult.rows.length).toBe(realResult.rows.length);
    for (let i = 0; i < realResult.rows.length; i++) {
      expect(nominalResult.rows[i].totalPortfolio).toBeCloseTo(realResult.rows[i].totalPortfolio, 2);
      expect(nominalResult.rows[i].grossExpense).toBeCloseTo(realResult.rows[i].grossExpense, 2);
      expect(nominalResult.rows[i].totalIncome).toBeCloseTo(realResult.rows[i].totalIncome, 2);
      expect(nominalResult.rows[i].withdrawal).toBeCloseTo(realResult.rows[i].withdrawal, 2);
    }
  });

  it('both modes detect depletion with high expenses', () => {
    const inputs = makeInputs({
      taxDeferredBalance: 50000,
      taxableBalance: 10000,
      preRetNominalGrowth: 0.04,
      postRetNominalGrowth: 0.03,
      inflationRate: 0.025,
      filingStatus: 'single' as const,
      person1: {
        ...defaultInputs.person1,
        retirementYear: currentYear,
        ssAmount: 0,
        pensionAmount: 0,
        annual401k: 0,
        annualTaxableSavings: 0,
      },
      expensePhases: [
        { id: '1', label: 'Expensive', annualPostTax: 200000, startYear: currentYear },
      ],
    });

    const nominalResult = runProjection(inputs, 'nominal');
    const realResult = runProjection(inputs, 'real');

    expect(realResult.depletionYear).not.toBeNull();
    expect(nominalResult.depletionYear).not.toBeNull();
  });

  it('grossUp produces correct withdrawal amounts in nominal mode', () => {
    const postTaxExpense = 50000;
    const taxablePortion = 0.75;
    const taxRate = 0.25;
    const inputs = makeInputs({
      taxDeferredBalance: 1000000,
      taxableBalance: 0,
      preRetNominalGrowth: 0,
      postRetNominalGrowth: 0,
      inflationRate: 0.03,
      effectiveTaxRate: taxRate,
      taxablePortionOfWithdrawals: taxablePortion,
      filingStatus: 'single' as const,
      person1: {
        ...defaultInputs.person1,
        retirementYear: currentYear,
        ssAmount: 0,
        pensionAmount: 0,
        annual401k: 0,
        annualTaxableSavings: 0,
      },
      expensePhases: [
        { id: '1', label: 'Retired', annualPostTax: postTaxExpense, startYear: currentYear },
      ],
    });

    const result = runProjection(inputs, 'nominal');
    // Year 0: inflationFactor=1, postTaxExpense=50000
    // grossUp(50000, 0.75, 0.25) = 50000 / (1 - 0.75*0.25) = 50000 / 0.8125 = 61538.46
    expect(result.rows[0].grossExpense).toBeCloseTo(61538.46, 0);

    // Year 1: inflationFactor=1.03, postTaxExpense=50000*1.03=51500
    // grossUp(51500, 0.75, 0.25) = 51500 / 0.8125 = 63384.62
    expect(result.rows[1].grossExpense).toBeCloseTo(63384.62, 0);
  });

  it('inflates expenses from year 0 when phases change mid-projection', () => {
    const inputs = makeInputs({
      taxDeferredBalance: 2000000,
      taxableBalance: 0,
      preRetNominalGrowth: 0,
      postRetNominalGrowth: 0,
      inflationRate: 0.03,
      effectiveTaxRate: 0,
      taxablePortionOfWithdrawals: 0,
      filingStatus: 'single' as const,
      person1: {
        ...defaultInputs.person1,
        retirementYear: currentYear,
        ssAmount: 0,
        pensionAmount: 0,
        annual401k: 0,
        annualTaxableSavings: 0,
      },
      expensePhases: [
        { id: '1', label: 'Phase A', annualPostTax: 80000, startYear: currentYear },
        { id: '2', label: 'Phase B', annualPostTax: 60000, startYear: currentYear + 5 },
      ],
    });

    const result = runProjection(inputs, 'nominal');

    // Year 0: Phase A, inflationFactor=1, expense=80000
    expect(result.rows[0].grossExpense).toBeCloseTo(80000, 0);

    // Year 5: Phase B kicks in, inflationFactor=1.03^5≈1.15927
    // Expense = 60000 * 1.03^5 ≈ 69556.45 (inflated from year 0, not from phase start)
    const year5Row = result.rows[5];
    expect(year5Row.phase).toBe('Phase B');
    expect(year5Row.grossExpense).toBeCloseTo(60000 * Math.pow(1.03, 5), 0);
  });
});
