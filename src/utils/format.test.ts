import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatPercent,
  formatPercentInput,
  parsePercentInput,
} from './format';

describe('formatCurrency', () => {
  it('formats a positive number as USD with no decimals', () => {
    expect(formatCurrency(1234)).toBe('$1,234');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('formats a large number with commas', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000');
  });

  it('formats a negative number', () => {
    const result = formatCurrency(-500);
    expect(result).toContain('500');
    expect(result).toContain('-');
  });
});

describe('formatPercent', () => {
  it('converts a decimal to a percentage string', () => {
    expect(formatPercent(0.06)).toBe('6.00%');
  });

  it('handles zero', () => {
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('handles small decimals', () => {
    expect(formatPercent(0.025)).toBe('2.50%');
  });
});

describe('formatPercentInput', () => {
  it('converts a decimal to a display value without % sign', () => {
    expect(formatPercentInput(0.06)).toBe('6.00');
  });
});

describe('parsePercentInput', () => {
  it('converts a percentage string to a decimal', () => {
    expect(parsePercentInput('6')).toBeCloseTo(0.06, 6);
  });

  it('handles decimal input', () => {
    expect(parsePercentInput('2.5')).toBeCloseTo(0.025, 6);
  });

  it('returns 0 for non-numeric input', () => {
    expect(parsePercentInput('abc')).toBe(0);
  });
});
