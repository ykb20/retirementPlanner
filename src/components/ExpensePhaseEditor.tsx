import { useState } from 'react';
import type { ExpensePhase } from '../types';
import styles from './ExpensePhaseEditor.module.css';

interface Props {
  phases: ExpensePhase[];
  onChange: (phases: ExpensePhase[]) => void;
}

let nextId = 100;

export default function ExpensePhaseEditor({ phases, onChange }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [focusedCurrency, setFocusedCurrency] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...phases];
    const [dragged] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, dragged);
    onChange(updated);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

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
            <th></th>
            <th>Label</th>
            <th>Annual Post-Tax</th>
            <th>Start Year</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {phases.map((phase, i) => (
            <tr
              key={phase.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className={[
                dragIndex === i ? styles.dragging : '',
                dragOverIndex === i && dragIndex !== i ? styles.dragOver : '',
              ].join(' ')}
            >
              <td>
                <span className={styles.dragHandle} title="Drag to reorder">≡</span>
              </td>
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
                    type="text"
                    inputMode="numeric"
                    value={focusedCurrency === i ? String(phase.annualPostTax) : phase.annualPostTax.toLocaleString('en-US')}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/,/g, '');
                      if (cleaned === '' || cleaned === '-') return;
                      const n = Number(cleaned);
                      if (!isNaN(n)) updatePhase(i, 'annualPostTax', n);
                    }}
                    onFocus={() => setFocusedCurrency(i)}
                    onBlur={() => setFocusedCurrency(null)}
                  />
                </span>
              </td>
              <td>
                <input
                  type="number"
                  value={phase.startYear}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!isNaN(n)) updatePhase(i, 'startYear', Math.min(2049, Math.max(2026, n)));
                  }}
                  min={2026}
                  max={2049}
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
