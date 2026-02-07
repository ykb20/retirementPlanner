import type { ProjectionResult, Inputs } from '../types';
import { formatCurrency, formatPercent } from '../utils/format';
import styles from './Summary.module.css';

interface Props {
  result: ProjectionResult;
  inputs: Inputs;
}

export default function Summary({ result, inputs }: Props) {
  const { rows, depletionYear, finalBalance } = result;

  if (rows.length === 0) {
    return (
      <div className={styles.summary}>
        <h2>Summary</h2>
        <p>Adjust inputs to see projection results.</p>
      </div>
    );
  }

  const isSingle = inputs.filingStatus === 'single';
  const bothRetiredYear = isSingle
    ? inputs.person1.retirementYear
    : Math.max(inputs.person1.retirementYear, inputs.person2.retirementYear);

  // Find portfolio value at retirement
  const retirementRow = rows.find((r) => r.year === bothRetiredYear);
  const retirementNestEgg = retirementRow?.totalPortfolio ?? 0;

  // Peak portfolio
  const peakRow = rows.reduce(
    (max, r) => (r.totalPortfolio > max.totalPortfolio ? r : max),
    rows[0]
  );

  const realPreRetGrowth = inputs.preRetNominalGrowth - inputs.inflationRate;
  const realPostRetGrowth = inputs.postRetNominalGrowth - inputs.inflationRate;

  return (
    <div className={styles.summary}>
      <h2>Summary</h2>
      <div className={styles.grid}>
        <div className={styles.card}>
          <span className={styles.label}>Retirement Nest Egg</span>
          <span className={styles.value}>{formatCurrency(retirementNestEgg)}</span>
          <span className={styles.detail}>at {isSingle ? 'retirement year' : 'both-retired year'} ({bothRetiredYear})</span>
        </div>

        <div className={styles.card}>
          <span className={styles.label}>Peak Portfolio</span>
          <span className={styles.value}>{formatCurrency(peakRow.totalPortfolio)}</span>
          <span className={styles.detail}>in {peakRow.year}</span>
        </div>

        <div className={`${styles.card} ${depletionYear ? styles.danger : styles.success}`}>
          <span className={styles.label}>
            {depletionYear ? 'Money Runs Out' : 'Final Balance'}
          </span>
          <span className={styles.value}>
            {depletionYear ? depletionYear : formatCurrency(finalBalance)}
          </span>
          <span className={styles.detail}>
            {depletionYear
              ? `Portfolio depleted at age ${depletionYear - (new Date().getFullYear() - (isSingle ? inputs.person1.currentAge : Math.max(inputs.person1.currentAge, inputs.person2.currentAge)))}`
              : `at end of projection`}
          </span>
        </div>

        <div className={styles.card}>
          <span className={styles.label}>Real Returns</span>
          <span className={styles.value}>
            {formatPercent(realPreRetGrowth)} / {formatPercent(realPostRetGrowth)}
          </span>
          <span className={styles.detail}>pre / post retirement</span>
        </div>
      </div>
    </div>
  );
}
