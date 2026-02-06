import type { ChangeEvent } from 'react';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
}

export default function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
}: NumberInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || raw === '-') return;
    const n = parseFloat(raw);
    if (!isNaN(n)) onChange(n);
  };

  return (
    <label className="number-input">
      <span className="number-input__label">{label}</span>
      <span className="number-input__wrapper">
        {prefix && <span className="number-input__affix">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
        />
        {suffix && <span className="number-input__affix">{suffix}</span>}
      </span>
    </label>
  );
}
