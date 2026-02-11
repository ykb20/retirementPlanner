import type { Inputs, PersonInputs, ProjectionMode } from '../types';
import NumberInput from './NumberInput';
import styles from './InputPanel.module.css';

interface Props {
  inputs: Inputs;
  onChange: (inputs: Inputs) => void;
  onReset: () => void;
  projectionMode: ProjectionMode;
  onModeChange: (mode: ProjectionMode) => void;
}

export default function InputPanel({ inputs, onChange, onReset, projectionMode, onModeChange }: Props) {
  const updatePerson = (key: 'person1' | 'person2', field: keyof PersonInputs, value: string | number) => {
    onChange({
      ...inputs,
      [key]: { ...inputs[key], [field]: value },
    });
  };

  const updateField = <K extends keyof Inputs>(field: K, value: Inputs[K]) => {
    onChange({ ...inputs, [field]: value });
  };

  const renderPersonSection = (key: 'person1' | 'person2', person: PersonInputs) => (
    <fieldset className={styles.fieldset}>
      <legend>
        <input
          type="text"
          className={styles.nameInput}
          value={person.name}
          onChange={(e) => updatePerson(key, 'name', e.target.value)}
        />
      </legend>
      <NumberInput
        label="Current age"
        value={person.currentAge}
        onChange={(v) => updatePerson(key, 'currentAge', v)}
        min={18}
        max={99}
      />
      <NumberInput
        label="Retirement year"
        value={person.retirementYear}
        onChange={(v) => updatePerson(key, 'retirementYear', v)}
        min={2026}
        max={2049}
      />
      <NumberInput
        label="Annual 401k contribution"
        value={person.annual401k}
        onChange={(v) => updatePerson(key, 'annual401k', v)}
        prefix="$"
        min={0}
      />
      <NumberInput
        label="Annual taxable savings"
        value={person.annualTaxableSavings}
        onChange={(v) => updatePerson(key, 'annualTaxableSavings', v)}
        prefix="$"
        min={0}
      />
      <NumberInput
        label="Pension (annual)"
        value={person.pensionAmount}
        onChange={(v) => updatePerson(key, 'pensionAmount', v)}
        prefix="$"
        min={0}
      />
      <NumberInput
        label="Pension start year"
        value={person.pensionStartYear}
        onChange={(v) => updatePerson(key, 'pensionStartYear', v)}
        min={2026}
        max={2049}
      />
      <NumberInput
        label="Social Security (annual)"
        value={person.ssAmount}
        onChange={(v) => updatePerson(key, 'ssAmount', v)}
        prefix="$"
        min={0}
      />
      <NumberInput
        label="SS start age"
        value={person.ssStartAge}
        onChange={(v) => updatePerson(key, 'ssStartAge', v)}
        min={62}
        max={99}
      />
    </fieldset>
  );

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2>Inputs</h2>
        <button className={styles.resetBtn} onClick={onReset}>
          Reset to Defaults
        </button>
      </div>

      <div className={styles.statusToggle}>
        <label>
          <input
            type="radio"
            name="filingStatus"
            value="single"
            checked={inputs.filingStatus === 'single'}
            onChange={() => updateField('filingStatus', 'single')}
          />
          Single
        </label>
        <label>
          <input
            type="radio"
            name="filingStatus"
            value="married"
            checked={inputs.filingStatus === 'married'}
            onChange={() => updateField('filingStatus', 'married')}
          />
          Married
        </label>
      </div>

      <div className={styles.statusToggle}>
        <label>
          <input
            type="radio"
            name="projectionMode"
            value="real"
            checked={projectionMode === 'real'}
            onChange={() => onModeChange('real')}
          />
          Inflation-Adjusted
        </label>
        <label>
          <input
            type="radio"
            name="projectionMode"
            value="nominal"
            checked={projectionMode === 'nominal'}
            onChange={() => onModeChange('nominal')}
          />
          Nominal
        </label>
      </div>

      <div className={styles.people}>
        {renderPersonSection('person1', inputs.person1)}
        {inputs.filingStatus === 'married' && renderPersonSection('person2', inputs.person2)}
      </div>

      <fieldset className={styles.fieldset}>
        <legend>Account Balances</legend>
        <NumberInput
          label="Tax-deferred (401k/IRA)"
          value={inputs.taxDeferredBalance}
          onChange={(v) => updateField('taxDeferredBalance', v)}
          prefix="$"
          min={0}
        />
        <NumberInput
          label="Taxable savings"
          value={inputs.taxableBalance}
          onChange={(v) => updateField('taxableBalance', v)}
          prefix="$"
          min={0}
        />
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Growth & Rates</legend>
        <NumberInput
          label="Pre-retirement growth"
          value={+(inputs.preRetNominalGrowth * 100).toFixed(2)}
          onChange={(v) => updateField('preRetNominalGrowth', v / 100)}
          suffix="%"
          step={0.25}
        />
        <NumberInput
          label="Post-retirement growth"
          value={+(inputs.postRetNominalGrowth * 100).toFixed(2)}
          onChange={(v) => updateField('postRetNominalGrowth', v / 100)}
          suffix="%"
          step={0.25}
        />
        <NumberInput
          label="Inflation rate"
          value={+(inputs.inflationRate * 100).toFixed(2)}
          onChange={(v) => updateField('inflationRate', v / 100)}
          suffix="%"
          step={0.25}
        />
        <NumberInput
          label="Effective tax rate"
          value={+(inputs.effectiveTaxRate * 100).toFixed(2)}
          onChange={(v) => updateField('effectiveTaxRate', v / 100)}
          suffix="%"
          step={1}
        />
        <NumberInput
          label="Taxable portion of withdrawals"
          value={+(inputs.taxablePortionOfWithdrawals * 100).toFixed(2)}
          onChange={(v) => updateField('taxablePortionOfWithdrawals', v / 100)}
          suffix="%"
          step={5}
        />
      </fieldset>
    </div>
  );
}
