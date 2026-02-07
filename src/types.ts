export interface PersonInputs {
  name: string;
  currentAge: number;
  retirementYear: number;
  annual401k: number;
  annualTaxableSavings: number;
  pensionAmount: number;
  pensionStartYear: number;
  ssAmount: number;
  ssStartAge: number;
}

export interface ExpensePhase {
  id: string;
  label: string;
  annualPostTax: number;
  startYear: number;
}

export interface Inputs {
  person1: PersonInputs;
  person2: PersonInputs;
  taxDeferredBalance: number;
  taxableBalance: number;
  preRetNominalGrowth: number;
  postRetNominalGrowth: number;
  inflationRate: number;
  effectiveTaxRate: number;
  taxablePortionOfWithdrawals: number;
  expensePhases: ExpensePhase[];
}

export interface ProjectionRow {
  year: number;
  person1Age: number;
  person2Age: number;
  phase: string;
  grossExpense: number;
  person1Pension: number;
  person2Pension: number;
  person1SS: number;
  person2SS: number;
  totalIncome: number;
  withdrawal: number;
  taxDeferred: number;
  taxable: number;
  totalPortfolio: number;
  depleted: boolean;
}

export interface ProjectionResult {
  rows: ProjectionRow[];
  depletionYear: number | null;
  finalBalance: number;
}
