/**
 * Gross up a post-tax amount to pre-tax, given taxable portion and tax rate.
 * preTax = postTax / (1 - taxablePortion * taxRate)
 */
export function grossUp(
  postTax: number,
  taxablePortion: number,
  taxRate: number
): number {
  return postTax / (1 - taxablePortion * taxRate);
}

/**
 * Compute real (inflation-adjusted) return from nominal rate and inflation rate.
 */
export function realReturn(nominal: number, inflation: number): number {
  return nominal - inflation;
}
