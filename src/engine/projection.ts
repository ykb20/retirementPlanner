import type { Inputs, ProjectionRow, ProjectionResult, ExpensePhase } from '../types';
import { grossUp, realReturn } from './helpers';

function getActivePhase(phases: ExpensePhase[], year: number): ExpensePhase | null {
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

export function runProjection(inputs: Inputs): ProjectionResult {
  const currentYear = new Date().getFullYear();
  const {
    person1,
    person2,
    taxDeferredBalance,
    taxableBalance,
    projectionEndAge,
    preRetNominalGrowth,
    postRetNominalGrowth,
    inflationRate,
    effectiveTaxRate,
    taxablePortionOfWithdrawals,
    expensePhases,
  } = inputs;

  const realPreRetGrowth = realReturn(preRetNominalGrowth, inflationRate);
  const realPostRetGrowth = realReturn(postRetNominalGrowth, inflationRate);

  // Determine the projection end year based on the older person reaching projectionEndAge
  const person1BirthYear = currentYear - person1.currentAge;
  const person2BirthYear = currentYear - person2.currentAge;

  const person1EndYear = person1BirthYear + projectionEndAge;
  const person2EndYear = person2BirthYear + projectionEndAge;
  const endYear = Math.max(person1EndYear, person2EndYear);

  const bothRetiredYear = Math.max(person1.retirementYear, person2.retirementYear);

  let taxDeferred = taxDeferredBalance;
  let taxable = taxableBalance;
  let depletionYear: number | null = null;

  const rows: ProjectionRow[] = [];

  for (let year = currentYear; year <= endYear; year++) {
    const person1Age = year - person1BirthYear;
    const person2Age = year - person2BirthYear;

    const isPreRetirement = year < bothRetiredYear;
    const growthRate = isPreRetirement ? realPreRetGrowth : realPostRetGrowth;

    // Apply growth
    taxDeferred = taxDeferred * (1 + growthRate);
    taxable = taxable * (1 + growthRate);

    // Pre-retirement contributions
    if (year < person1.retirementYear) {
      taxDeferred += person1.annual401k;
      taxable += person1.annualTaxableSavings;
    }
    if (year < person2.retirementYear) {
      taxDeferred += person2.annual401k;
      taxable += person2.annualTaxableSavings;
    }

    // Income streams
    const p1Pension = year >= person1.pensionStartYear ? person1.pensionAmount : 0;
    const p2Pension = year >= person2.pensionStartYear ? person2.pensionAmount : 0;
    const p1SS = person1Age >= person1.ssStartAge ? person1.ssAmount : 0;
    const p2SS = person2Age >= person2.ssStartAge ? person2.ssAmount : 0;
    const totalIncome = p1Pension + p2Pension + p1SS + p2SS;

    // Expenses (only after at least one person retires)
    const earliestRetirement = Math.min(person1.retirementYear, person2.retirementYear);
    const activePhase = year >= earliestRetirement ? getActivePhase(expensePhases, year) : null;
    const postTaxExpense = activePhase ? activePhase.annualPostTax : 0;
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
      person2Age,
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
  }

  return {
    rows,
    depletionYear,
    finalBalance: taxDeferred + taxable,
  };
}
