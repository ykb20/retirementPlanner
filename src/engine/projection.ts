import type { Inputs, ProjectionRow, ProjectionResult, ExpensePhase, ProjectionMode } from '../types';
import { grossUp, realReturn } from './helpers';

export function getActivePhase(phases: ExpensePhase[], year: number): ExpensePhase | null {
  // Find the phase with the largest startYear that is <= year
  let active: ExpensePhase | null = null;
  for (const phase of phases) {
    if (year >= phase.startYear) {
      if (!active || phase.startYear > active.startYear) {
        active = phase;
      }
    }
  }
  return active;
}

/**
 * Run a year-by-year retirement projection.
 *
 * When mode is 'real' (default), all values are in today's (inflation-adjusted)
 * dollars — growth rates are reduced by inflation and dollar streams are constant.
 *
 * When mode is 'nominal', growth rates are used as-is and all dollar-denominated
 * inputs (contributions, pension, SS, expenses) are inflated by a cumulative
 * factor each year. Starting balances are already in current nominal dollars and
 * are not inflated. This produces correct nominal projections where depletion
 * timing and withdrawal ordering may differ from the real-dollar projection.
 */
export function runProjection(inputs: Inputs, mode: ProjectionMode = 'real'): ProjectionResult {
  const currentYear = new Date().getFullYear();
  const {
    filingStatus,
    person1,
    person2,
    taxDeferredBalance,
    taxableBalance,
    preRetNominalGrowth,
    postRetNominalGrowth,
    inflationRate,
    effectiveTaxRate,
    taxablePortionOfWithdrawals,
    expensePhases,
  } = inputs;

  const isNominal = mode === 'nominal';
  const isSingle = filingStatus === 'single';

  // In real mode, reduce growth by inflation; in nominal mode, use rates as-is
  const preRetGrowth = isNominal ? preRetNominalGrowth : realReturn(preRetNominalGrowth, inflationRate);
  const postRetGrowth = isNominal ? postRetNominalGrowth : realReturn(postRetNominalGrowth, inflationRate);

  const person1BirthYear = currentYear - person1.currentAge;
  const person2BirthYear = currentYear - person2.currentAge;

  const maxEndYear = 2076;

  const bothRetiredYear = isSingle
    ? person1.retirementYear
    : Math.max(person1.retirementYear, person2.retirementYear);

  let taxDeferred = taxDeferredBalance;
  let taxable = taxableBalance;
  let depletionYear: number | null = null;

  // Cumulative inflation factor for nominal mode.
  // Starts at 1.0 (current year = today's dollars), compounds each subsequent year.
  let inflationFactor = 1;

  const rows: ProjectionRow[] = [];

  for (let year = currentYear; year <= maxEndYear; year++) {
    const person1Age = year - person1BirthYear;
    const person2Age = year - person2BirthYear;

    const isPreRetirement = year < bothRetiredYear;
    const growthRate = isPreRetirement ? preRetGrowth : postRetGrowth;

    // In nominal mode, compound the inflation factor each year after the first
    if (isNominal && year > currentYear) {
      inflationFactor *= 1 + inflationRate;
    }

    // Helper: inflate a today's-dollar amount for nominal mode
    const inflate = (amount: number) => isNominal ? amount * inflationFactor : amount;

    // Apply growth
    taxDeferred = taxDeferred * (1 + growthRate);
    taxable = taxable * (1 + growthRate);

    // Pre-retirement contributions (inflated in nominal mode)
    if (year < person1.retirementYear) {
      taxDeferred += inflate(person1.annual401k);
      taxable += inflate(person1.annualTaxableSavings);
    }
    if (!isSingle && year < person2.retirementYear) {
      taxDeferred += inflate(person2.annual401k);
      taxable += inflate(person2.annualTaxableSavings);
    }

    // Income streams (inflated in nominal mode)
    const p1Pension = year >= person1.pensionStartYear ? inflate(person1.pensionAmount) : 0;
    const p2Pension = isSingle ? 0 : (year >= person2.pensionStartYear ? inflate(person2.pensionAmount) : 0);
    const p1SS = person1Age >= person1.ssStartAge ? inflate(person1.ssAmount) : 0;
    const p2SS = isSingle ? 0 : (person2Age >= person2.ssStartAge ? inflate(person2.ssAmount) : 0);
    const totalIncome = p1Pension + p2Pension + p1SS + p2SS;

    // Expenses (only after at least one person retires, inflated in nominal mode)
    const earliestRetirement = isSingle
      ? person1.retirementYear
      : Math.min(person1.retirementYear, person2.retirementYear);
    const activePhase = year >= earliestRetirement ? getActivePhase(expensePhases, year) : null;
    const postTaxExpense = activePhase ? inflate(activePhase.annualPostTax) : 0;
    const grossExpense = postTaxExpense > 0
      ? grossUp(postTaxExpense, taxablePortionOfWithdrawals, effectiveTaxRate)
      : 0;

    // Net withdrawal needed
    const withdrawalNeeded = Math.max(0, grossExpense - totalIncome);
    let actualWithdrawal = 0;

    if (withdrawalNeeded > 0 && (taxDeferred > 0 || taxable > 0)) {
      // Withdraw from taxable first, then tax-deferred
      const fromTaxable = Math.min(taxable, withdrawalNeeded);
      taxable -= fromTaxable;
      const remaining = withdrawalNeeded - fromTaxable;
      const fromTaxDeferred = Math.min(taxDeferred, remaining);
      taxDeferred -= fromTaxDeferred;
      actualWithdrawal = fromTaxable + fromTaxDeferred;
    }

    const depleted = taxDeferred <= 0 && taxable <= 0 && withdrawalNeeded > 0;
    if (depleted && depletionYear === null) {
      depletionYear = year;
    }

    // Prevent small negative values from floating point
    if (taxDeferred < 0) taxDeferred = 0;
    if (taxable < 0) taxable = 0;

    rows.push({
      year,
      person1Age,
      person2Age: isSingle ? 0 : person2Age,
      phase: activePhase?.label ?? (isPreRetirement ? 'Accumulation' : ''),
      grossExpense,
      person1Pension: p1Pension,
      person2Pension: p2Pension,
      person1SS: p1SS,
      person2SS: p2SS,
      totalIncome,
      withdrawal: actualWithdrawal,
      taxDeferred,
      taxable,
      totalPortfolio: taxDeferred + taxable,
      depleted,
    });

    if (depleted) break;
  }

  return {
    rows,
    depletionYear,
    finalBalance: taxDeferred + taxable,
  };
}
