/**
 * Safe CSV Serializer and Downloader
 * Properly escapes commas, quotes, and newlines.
 * Does not expose sensitive customer information.
 */

function escapeCsvCell(cell: any): string {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell);
  // If string contains comma, quote, or newline, escape quotes and wrap in quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function downloadCsv(filename: string, rows: (string | number | undefined | null)[][]) {
  const csvContent = rows
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportSalesReportCsv(
  restaurantName: string,
  periodLabel: string,
  currency: string,
  trendData: Array<{ date: string; label: string; sales: number; grossProfit: number; foodCost: number; orders: number }>,
) {
  const headers = ['Date', 'Period Label', `Gross/Net Sales (${currency})`, `Food Cost (${currency})`, `Gross Profit (${currency})`, 'Completed Orders'];
  const rows = trendData.map((d) => [
    d.date,
    d.label,
    d.sales.toFixed(2),
    d.foodCost.toFixed(2),
    d.grossProfit.toFixed(2),
    d.orders,
  ]);

  downloadCsv(`${restaurantName.toLowerCase().replace(/\s+/g, '_')}_sales_trend_${periodLabel}`, [
    [`Sales & Revenue Trend Report - ${restaurantName}`],
    [`Reporting Period: ${periodLabel}`],
    [`Generated: ${new Date().toISOString()}`],
    [],
    headers,
    ...rows,
  ]);
}

export function exportProductPerformanceCsv(
  restaurantName: string,
  periodLabel: string,
  currency: string,
  products: Array<{
    name: string;
    categoryName: string;
    isVeg: boolean;
    quantitySold: number;
    sales: number;
    foodCost: number;
    grossContribution: number;
    marginPercentage: number;
  }>,
) {
  const headers = [
    'Item Name',
    'Category',
    'Dietary Type',
    'Units Sold',
    `Gross Sales (${currency})`,
    `Food Cost (${currency})`,
    `Gross Contribution (${currency})`,
    'Margin %',
  ];

  const rows = products.map((p) => [
    p.name,
    p.categoryName,
    p.isVeg ? 'Vegetarian' : 'Non-Vegetarian',
    p.quantitySold,
    p.sales.toFixed(2),
    p.foodCost.toFixed(2),
    p.grossContribution.toFixed(2),
    `${p.marginPercentage.toFixed(1)}%`,
  ]);

  downloadCsv(`${restaurantName.toLowerCase().replace(/\s+/g, '_')}_product_performance_${periodLabel}`, [
    [`Product Performance & Profitability Ledger - ${restaurantName}`],
    [`Reporting Period: ${periodLabel}`],
    [`Generated: ${new Date().toISOString()}`],
    [],
    headers,
    ...rows,
  ]);
}

export function exportCategoryPerformanceCsv(
  restaurantName: string,
  periodLabel: string,
  currency: string,
  categories: Array<{
    name: string;
    quantitySold: number;
    sales: number;
    foodCost: number;
    grossContribution: number;
    marginPercentage: number;
  }>,
) {
  const headers = [
    'Category Name',
    'Units Sold',
    `Gross Sales (${currency})`,
    `Food Cost (${currency})`,
    `Gross Contribution (${currency})`,
    'Margin %',
  ];

  const rows = categories.map((c) => [
    c.name,
    c.quantitySold,
    c.sales.toFixed(2),
    c.foodCost.toFixed(2),
    c.grossContribution.toFixed(2),
    `${c.marginPercentage.toFixed(1)}%`,
  ]);

  downloadCsv(`${restaurantName.toLowerCase().replace(/\s+/g, '_')}_category_performance_${periodLabel}`, [
    [`Category Performance Report - ${restaurantName}`],
    [`Reporting Period: ${periodLabel}`],
    [`Generated: ${new Date().toISOString()}`],
    [],
    headers,
    ...rows,
  ]);
}

export function exportExpensesCsv(
  restaurantName: string,
  periodLabel: string,
  currency: string,
  expenses: Array<{
    expenseDate: string;
    category: string;
    description: string;
    paymentMethod: string;
    amount: number;
    notes?: string;
  }>,
) {
  const headers = [
    'Date',
    'Category',
    'Description',
    'Payment Method',
    `Amount (${currency})`,
    'Audit Reference / Notes',
  ];

  const rows = expenses.map((e) => [
    e.expenseDate.slice(0, 10),
    e.category,
    e.description,
    e.paymentMethod.replace(/_/g, ' '),
    e.amount.toFixed(2),
    e.notes || '',
  ]);

  downloadCsv(`${restaurantName.toLowerCase().replace(/\s+/g, '_')}_expenses_report_${periodLabel}`, [
    [`Operating Expenses Audit Report - ${restaurantName}`],
    [`Reporting Period: ${periodLabel}`],
    [`Generated: ${new Date().toISOString()}`],
    [],
    headers,
    ...rows,
  ]);
}

export function exportPaymentsCsv(
  restaurantName: string,
  periodLabel: string,
  currency: string,
  payments: Array<{
    method: string;
    label: string;
    amount: number;
    count: number;
    percentageOfSettled: number;
  }>,
  totalSettled: number,
  unpaidAmount: number,
) {
  const headers = [
    'Payment Channel',
    'Transaction Method',
    'Est. Transactions',
    `Settled Amount (${currency})`,
    'Share of Settled Collections %',
  ];

  const rows = payments.map((p) => [
    p.label,
    p.method,
    p.count,
    p.amount.toFixed(2),
    `${p.percentageOfSettled.toFixed(1)}%`,
  ]);

  downloadCsv(`${restaurantName.toLowerCase().replace(/\s+/g, '_')}_payments_settlement_${periodLabel}`, [
    [`Payment Settlement & Collections Report - ${restaurantName}`],
    [`Reporting Period: ${periodLabel}`],
    [`Total Settled Collections: ${currency} ${totalSettled.toFixed(2)}`],
    [`Total Pending / Unpaid Receivables: ${currency} ${unpaidAmount.toFixed(2)}`],
    [`Generated: ${new Date().toISOString()}`],
    [],
    headers,
    ...rows,
  ]);
}
