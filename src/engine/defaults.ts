import type { Inputs } from '../types';

const currentYear = new Date().getFullYear();

export const defaultInputs: Inputs = {
  filingStatus: 'married',
  person1: {
    name: 'Person 1',
    currentAge: 50,
    retirementYear: currentYear + 10,
    annual401k: 23000,
    annualTaxableSavings: 10000,
    pensionAmount: 0,
    pensionStartYear: currentYear + 10,
    ssAmount: 30000,
    ssStartAge: 67,
  },
  person2: {
    name: 'Person 2',
    currentAge: 48,
    retirementYear: currentYear + 12,
    annual401k: 23000,
    annualTaxableSavings: 5000,
    pensionAmount: 0,
    pensionStartYear: currentYear + 12,
    ssAmount: 24000,
    ssStartAge: 67,
  },
  taxDeferredBalance: 800000,
  taxableBalance: 200000,
  preRetNominalGrowth: 0.06,
  postRetNominalGrowth: 0.0525,
  inflationRate: 0.025,
  effectiveTaxRate: 0.25,
  taxablePortionOfWithdrawals: 0.75,
  expensePhases: [
    {
      id: '1',
      label: 'Early retirement',
      annualPostTax: 90000,
      startYear: currentYear + 10,
    },
    {
      id: '2',
      label: 'Both retired, no mortgage',
      annualPostTax: 75000,
      startYear: currentYear + 15,
    },
    {
      id: '3',
      label: 'Later years',
      annualPostTax: 60000,
      startYear: currentYear + 25,
    },
  ],
};
