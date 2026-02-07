import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import type { ProjectionRow, Inputs } from '../types';
import { formatCurrency } from '../utils/format';
import styles from './BalanceChart.module.css';

interface Props {
  rows: ProjectionRow[];
  inputs: Inputs;
}

export default function BalanceChart({ rows, inputs }: Props) {
  const isSingle = inputs.filingStatus === 'single';
  const bothRetiredYear = isSingle
    ? inputs.person1.retirementYear
    : Math.max(inputs.person1.retirementYear, inputs.person2.retirementYear);

  const data = rows.map((r) => ({
    year: r.year,
    'Tax-Deferred': Math.round(r.taxDeferred),
    Taxable: Math.round(r.taxable),
    Total: Math.round(r.totalPortfolio),
  }));

  return (
    <div className={styles.wrapper}>
      <h2>Portfolio Balance Over Time</h2>
      <p className={styles.subtitle}>All values in today's dollars</p>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
            width={70}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(label) => `Year ${label}`}
          />
          <Legend />
          <ReferenceLine
            x={bothRetiredYear}
            stroke="#e74c3c"
            strokeDasharray="5 5"
            label={{ value: isSingle ? 'Retirement' : 'Both Retired', position: 'top', fontSize: 11 }}
          />
          <Area
            type="monotone"
            dataKey="Tax-Deferred"
            stackId="1"
            stroke="#3498db"
            fill="#3498db"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="Taxable"
            stackId="1"
            stroke="#2ecc71"
            fill="#2ecc71"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
