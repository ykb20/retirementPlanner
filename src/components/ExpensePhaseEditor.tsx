import type { ExpensePhase } from '../types';
import styles from './ExpensePhaseEditor.module.css';

interface Props {
  phases: ExpensePhase[];
  onChange: (phases: ExpensePhase[]) => void;
}

let nextId = 100;

export default function ExpensePhaseEditor({ phases, onChange }: Props) {
  const updatePhase = (index: number, field: keyof ExpensePhase, value: string | number) => {
    const updated = phases.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    onChange(updated);
  };

  const addPhase = () => {
    const lastYear = phases.length > 0
      ? Math.max(...phases.map((p) => p.startYear)) + 5
      : new Date().getFullYear() + 10;
    onChange([
      ...phases,
      {
        id: String(nextId++),
        label: 'New phase',
        annualPostTax: 60000,
        startYear: lastYear,
      },
    ]);
  };

  const removePhase = (index: number) => {
    onChange(phases.filter((_, i) => i !== index));
  };

  return (
    <fieldset className={styles.fieldset}>
      <legend>Expense Phases</legend>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Label</th>
            <th>Annual Post-Tax</th>
            <th>Start Year</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {phases.map((phase, i) => (
            <tr key={phase.id}>
              <td>
                <input
                  type="text"
                  value={phase.label}
                  onChange={(e) => updatePhase(i, 'label', e.target.value)}
                  className={styles.textInput}
                />
              </td>
              <td>
                <span className={styles.currencyWrap}>
                  <span className={styles.prefix}>$</span>
                  <input
                    type="number"
                    value={phase.annualPostTax}
                    onChange={(e) => updatePhase(i, 'annualPostTax', Number(e.target.value))}
                    min={0}
                  />
                </span>
              </td>
              <td>
                <input
                  type="number"
                  value={phase.startYear}
                  onChange={(e) => updatePhase(i, 'startYear', Number(e.target.value))}
                />
              </td>
              <td>
                <button
                  className={styles.removeBtn}
                  onClick={() => removePhase(i)}
                  title="Remove phase"
                >
                  &times;
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className={styles.addBtn} onClick={addPhase}>
        + Add Phase
      </button>
    </fieldset>
  );
}
