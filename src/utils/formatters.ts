export function formatCurrency(
  amount: number | undefined | null,
  currencyCode: string = 'INR',
  currencySymbol: string = '₹',
): string {
  const val = amount ?? 0;
  try {
    if (currencyCode === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      }).format(val);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(val);
  } catch {
    return `${currencySymbol}${val.toFixed(2)}`;
  }
}

export function formatPercentage(pct: number | undefined | null): string {
  const val = pct ?? 0;
  return `${val.toFixed(1)}%`;
}
