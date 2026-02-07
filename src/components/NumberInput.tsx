import { useState, useEffect, type ChangeEvent } from 'react';

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

function formatWithCommas(n: number): string {
  return n.toLocaleString('en-US');
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
  const isCurrency = prefix === '$';
  const [display, setDisplay] = useState(isCurrency ? formatWithCommas(value) : '');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused && isCurrency) {
      setDisplay(formatWithCommas(value));
    }
  }, [value, focused, isCurrency]);

  const clamp = (n: number) => {
    if (min !== undefined && n < min) return min;
    if (max !== undefined && n > max) return max;
    return n;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (isCurrency) {
      setDisplay(raw);
      const cleaned = raw.replace(/,/g, '');
      if (cleaned === '' || cleaned === '-') return;
      const n = parseFloat(cleaned);
      if (!isNaN(n)) onChange(n);
    } else {
      if (raw === '' || raw === '-') return;
      const n = parseFloat(raw);
      if (!isNaN(n)) onChange(n);
    }
  };

  const handleFocus = () => {
    setFocused(true);
    if (isCurrency) setDisplay(String(value));
  };

  const handleBlur = () => {
    setFocused(false);
    onChange(clamp(value));
    if (isCurrency) setDisplay(formatWithCommas(clamp(value)));
  };

  return (
    <label className="number-input">
      <span className="number-input__label">{label}</span>
      <span className="number-input__wrapper">
        {prefix && <span className="number-input__affix">{prefix}</span>}
        {isCurrency ? (
          <input
            type="text"
            inputMode="numeric"
            value={display}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        ) : (
          <input
            type="number"
            value={value}
            onChange={handleChange}
            min={min}
            max={max}
            step={step}
          />
        )}
        {suffix && <span className="number-input__affix">{suffix}</span>}
      </span>
    </label>
  );
}
