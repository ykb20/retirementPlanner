import type { ProjectionRow, Inputs, ProjectionMode } from '../types';
import { formatCurrency } from '../utils/format';
import styles from './ProjectionTable.module.css';

interface Props {
  rows: ProjectionRow[];
  inputs: Inputs;
  projectionMode: ProjectionMode;
}

export default function ProjectionTable({ rows, inputs, projectionMode }: Props) {
  const isSingle = inputs.filingStatus === 'single';
  const bothRetiredYear = isSingle
    ? inputs.person1.retirementYear
    : Math.max(inputs.person1.retirementYear, inputs.person2.retirementYear);

  return (
    <div className={styles.wrapper}>
      <h2>
        Year-by-Year Projection{' '}
        <span className={styles.modeLabel}>
          ({projectionMode === 'real' ? 'inflation-adjusted' : 'nominal dollars'})
        </span>
      </h2>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Year</th>
              <th>{inputs.person1.name} Age</th>
              {!isSingle && <th>{inputs.person2.name} Age</th>}
              <th>Phase</th>
              <th>Gross Expense</th>
              <th>Total Income</th>
              <th>Withdrawal</th>
              <th>Tax-Deferred</th>
              <th>Taxable</th>
              <th>Total Portfolio</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              let rowClass = '';
              if (row.depleted) rowClass = styles.depleted;
              else if (row.year === bothRetiredYear) rowClass = styles.retirementYear;
              else if (row.year < bothRetiredYear) rowClass = styles.preRetirement;

              return (
                <tr key={row.year} className={rowClass}>
                  <td>{row.year}</td>
                  <td>{row.person1Age}</td>
                  {!isSingle && <td>{row.person2Age}</td>}
                  <td className={styles.phaseCell}>{row.phase}</td>
                  <td>{formatCurrency(row.grossExpense)}</td>
                  <td>{formatCurrency(row.totalIncome)}</td>
                  <td>{formatCurrency(row.withdrawal)}</td>
                  <td>{formatCurrency(row.taxDeferred)}</td>
                  <td>{formatCurrency(row.taxable)}</td>
                  <td className={styles.totalCol}>{formatCurrency(row.totalPortfolio)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
