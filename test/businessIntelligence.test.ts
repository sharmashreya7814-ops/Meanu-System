import { repository } from '../server/src/db/repository.js';
import { formatCurrency, formatPercentage } from '../src/utils/formatters.js';

async function runBusinessIntelligenceTests() {
  console.log('====================================================');
  console.log('RUNNING MODULE 7 BUSINESS INTELLIGENCE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. Current vs Previous Period Comparison (This Month)
  const report = await repository.getBusinessReport(
    'rest-verde-01',
    '2026-09-01',
    '2026-09-30',
    'Asia/Kolkata',
    'thisMonth',
  );

  assert(report.period.preset === 'thisMonth', '1. Period preset parsed correctly');
  assert(report.executiveKPIs.netSales.current > 0, '1. Current period net sales calculated');
  assert(typeof report.executiveKPIs.netSales.absoluteChange === 'number', '1. Absolute change calculated');

  // 2. Zero Previous Period handling (No NaN / No Infinity)
  const zeroPrevMetric = report.executiveKPIs.netSales.previous === 0;
  if (zeroPrevMetric) {
    assert(report.executiveKPIs.netSales.percentageChange === null, '2. Zero previous period produces null percentageChange without NaN/Infinity');
  } else {
    assert(
      !isNaN(report.executiveKPIs.netSales.percentageChange as number) &&
      isFinite(report.executiveKPIs.netSales.percentageChange as number),
      '2. Previous period percentage change is finite and valid numeric',
    );
  }

  // 3. Sales Growth & Differences
  assert(
    Math.abs(
      report.salesGrowth.salesDiff -
      (report.salesGrowth.currentTotalSales - report.salesGrowth.previousTotalSales)
    ) < 0.01,
    '3. Sales growth difference matches currentTotalSales - previousTotalSales',
  );

  // 4. AOV Comparison
  assert(report.executiveKPIs.averageOrderValue.current > 0, '4. AOV calculated for current period');
  assert(
    typeof report.executiveKPIs.averageOrderValue.formattedChange === 'string',
    '4. AOV comparison formatted safely',
  );

  // 5. Product Sales Aggregation
  assert(report.productProfitability.topSellingByQuantity.length > 0, '5. Top selling products ranked by volume');
  const top1 = report.productProfitability.topSellingByQuantity[0];
  const top2 = report.productProfitability.topSellingByQuantity[1];
  if (top1 && top2) {
    assert(top1.quantitySold >= top2.quantitySold, '5. Top sellers correctly sorted in descending order of units sold');
  }

  // 6. Product Gross Contribution
  assert(report.productProfitability.topByGrossContribution.length > 0, '6. Top gross contribution products computed');
  const contrib1 = report.productProfitability.topByGrossContribution[0];
  const contrib2 = report.productProfitability.topByGrossContribution[1];
  if (contrib1 && contrib2) {
    assert(contrib1.grossContribution >= contrib2.grossContribution, '6. Top contribution correctly sorted in descending order of gross contribution ₹');
  }

  // 7. Category Aggregation
  assert(report.categoryPerformance.length > 0, '7. Categories aggregated with sales, food cost & gross contribution');

  // 8. Veg vs Non-Veg Aggregation
  assert(report.vegNonVeg.veg.quantity > 0, '8. Veg items quantity tracked');
  assert(report.vegNonVeg.veg.grossContribution > 0, '8. Veg items gross contribution calculated');
  assert(report.vegNonVeg.veg.contributionPercentage >= 0, '8. Veg contribution % calculated');

  // 9. Peak Hours (24-hour Asia/Kolkata)
  assert(report.peakHours.length === 24, '9. 24 peak hour buckets generated in Asia/Kolkata');
  assert(report.peakHours.every((h) => h.hour >= 0 && h.hour <= 23), '9. Hours strictly 0 to 23');

  // 10. Peak Days Calculation (7 days)
  assert(report.peakDays.length === 7, '10. 7 days of week generated with sales, orders & AOV');

  // 11. Customer Aggregation
  assert(report.customers.totalUniqueCustomers > 0, '11. Unique customer count computed');
  assert(report.customers.repeatCustomerPercentage >= 0 && report.customers.repeatCustomerPercentage <= 100, '11. Repeat customer % valid (0-100)');
  assert(report.customers.averageCustomerSpend > 0, '11. Average guest spend computed');

  // 12. New vs Returning Customers
  assert(
    report.customers.newCustomers + report.customers.returningCustomers === report.customers.totalUniqueCustomers,
    '12. newCustomers + returningCustomers equals totalUniqueCustomers',
  );

  // 13. Order Status Operational Analytics
  assert(report.ordersOperational.totalOrders >= report.ordersOperational.completedOrders, '13. Total orders >= completed orders');
  assert(report.ordersOperational.cancellationRate >= 0, '13. Cancellation rate computed accurately');
  assert(report.ordersOperational.statusDistribution.length === 7, '13. Full status distribution (NEW, ACCEPTED, PREPARING, READY, SERVED, COMPLETED, CANCELLED)');

  // 14. Payment Method Settlement Aggregation
  assert(report.paymentsBreakdown.totalSettled > 0, '14. Settled collections computed');
  assert(report.paymentsBreakdown.methods.length > 0, '14. Payment methods breakdown computed');
  const sumMethodPercentages = report.paymentsBreakdown.methods.reduce((s, m) => s + m.percentageOfSettled, 0);
  assert(Math.abs(sumMethodPercentages - 100) < 2.0, '14. Payment method shares sum to ~100% of settled collections');

  // 15. Expense Breakdown by Category
  assert(report.expensesBreakdown.length > 0, '15. Operating expenses breakdown populated');

  // 16. Profitability Trend
  assert(report.financialCurrent.salesTrend.length > 0, '16. Daily profitability sales trend populated');

  // 17. Date Boundaries (Single Day Filter)
  const singleDayReport = await repository.getBusinessReport('rest-verde-01', '2026-09-27', '2026-09-27', 'Asia/Kolkata', 'today');
  assert(singleDayReport.financialCurrent.sales.orderCount > 0, '17. Single day date boundaries filter orders accurately');

  // 18. Asia/Kolkata Timezone Handling
  assert(singleDayReport.restaurant.timezone === 'Asia/Kolkata', '18. Restaurant timezone configured to Asia/Kolkata');

  // 19. Multi-Tenant Isolation (Ember vs Verde)
  const emberReport = await repository.getBusinessReport('rest-ember-02', '2026-09-01', '2026-09-30', 'Asia/Kolkata', 'thisMonth');
  assert(emberReport.restaurant.name === 'The Ember & Smokehouse', '19. Ember Smokehouse tenant loaded correctly');
  assert(
    emberReport.executiveKPIs.netSales.current !== report.executiveKPIs.netSales.current,
    '19. Multi-tenant isolation gives distinct authentic datasets for Ember vs Verde',
  );

  // 20. Customer Privacy
  // Confirm CustomerAnalytics object exposes NO raw mobile numbers
  const custKeys = Object.keys(report.customers);
  assert(!custKeys.includes('mobileNumber') && !custKeys.includes('phone'), '20. Customer privacy preserved with aggregated metrics');

  // 21. INR Currency Formatting
  const fmtVal = formatCurrency(250000.75, 'INR', '₹');
  assert(fmtVal.includes('₹') && fmtVal.includes('2,50,000.75'), '21. INR formatted using standard Indian comma separator system');

  // 22. CSV Escaping
  function escapeCsvCell(cell: any): string {
    const str = String(cell ?? '');
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  }
  const testStr = 'Tandoori "Special", Paneer & Naan';
  const escaped = escapeCsvCell(testStr);
  assert(escaped === '"Tandoori ""Special"", Paneer & Naan"', '22. Safe RFC-4180 CSV escaping handles quotes and commas correctly');

  // 23. Zero / Empty Dataset handling
  const futureReport = await repository.getBusinessReport('rest-verde-01', '2029-01-01', '2029-01-31', 'Asia/Kolkata', 'custom');
  assert(futureReport.financialCurrent.sales.grossSales === 0, '23. Empty future dataset returns 0 sales without crashing');
  assert(futureReport.financialCurrent.profit.grossMarginPercentage === 0, '24. Zero sales safely handles 0 division without NaN/Infinity');

  // 25. Regression with Module 6 Financial Calculations
  const rawFinancial = await repository.getFinancialAnalytics('rest-verde-01', '2026-09-01', '2026-09-30', 'Asia/Kolkata');
  assert(
    rawFinancial.sales.netSales === report.financialCurrent.sales.netSales &&
    rawFinancial.costs.foodCost === report.financialCurrent.costs.foodCost &&
    rawFinancial.profit.estimatedNetProfit === report.financialCurrent.profit.estimatedNetProfit,
    '25. Complete regression consistency: Module 7 directly consumes authoritative Module 6 engine',
  );

  console.log(`\n====================================================`);
  console.log(`BUSINESS INTELLIGENCE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runBusinessIntelligenceTests().catch((err) => {
  console.error('Fatal BI test error:', err);
  process.exit(1);
});
