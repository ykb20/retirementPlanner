const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function formatPercentInput(value: number): string {
  return (value * 100).toFixed(2);
}

export function parsePercentInput(value: string): number {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n / 100;
}
