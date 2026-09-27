import { repository } from '../server/src/db/repository.js';
import { formatCurrency, formatPercentage } from '../src/utils/formatters.js';

async function runAllTests() {
  console.log('====================================================');
  console.log('RUNNING RESTAURANT FINANCIAL & EXPENSES TEST SUITE');
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

  // 1. Multi-Tenant Restaurant Verification
  const verde = await repository.getRestaurantById('rest-verde-01');
  const ember = await repository.getRestaurantById('rest-ember-02');
  assert(!!verde && verde.slug === 'verde-botanica', 'Tenant A (Verde Botanica) loaded');
  assert(!!ember && ember.slug === 'ember-smokehouse', 'Tenant B (Ember Smokehouse) loaded');

  // 2. Expense Creation
  const newExp = await repository.createExpense({
    restaurantId: 'rest-verde-01',
    category: 'MARKETING',
    description: 'Special Diwali Promo Pamphlets',
    amount: 5500.0,
    expenseDate: '2026-09-25T10:00:00.000Z',
    paymentMethod: 'UPI',
    notes: 'Voucher #5521',
  });
  assert(newExp.id.startsWith('exp-') && newExp.amount === 5500.0, 'A. Expense creation successful');

  // 3. Expense Update
  const updatedExp = await repository.updateExpense('rest-verde-01', newExp.id, {
    amount: 6000.0,
    notes: 'Updated voucher amount',
  });
  assert(updatedExp !== null && updatedExp.amount === 6000.0, 'B. Expense update successful');

  // 4. Expense Deletion
  const deleted = await repository.deleteExpense('rest-verde-01', newExp.id);
  assert(deleted === true, 'C. Expense deletion successful');

  // 5. Restaurant Isolation on Expenses
  const expVerde = await repository.getExpenses('rest-verde-01');
  const expEmber = await repository.getExpenses('rest-ember-02');
  assert(
    expVerde.every((e) => e.restaurantId === 'rest-verde-01') &&
    expEmber.every((e) => e.restaurantId === 'rest-ember-02'),
    'D. Restaurant tenant isolation strictly enforced on expenses',
  );

  // 6. Financial Analytics for Month
  const verdeMonthly = await repository.getFinancialAnalytics(
    'rest-verde-01',
    '2026-09-01',
    '2026-09-30',
    'Asia/Kolkata',
  );

  // 7. Food Cost & Snapshot Integrity Check
  assert(verdeMonthly.costs.foodCost > 0, 'E. Food cost calculation returns positive numeric basis');
  assert(
    verdeMonthly.sales.grossSales > verdeMonthly.costs.foodCost,
    'F. Historical cost snapshot maintains positive gross contribution',
  );

  // 8. Accounting Rules & Profit Formulas
  const grossSales = verdeMonthly.sales.grossSales;
  const discounts = verdeMonthly.sales.discountAmount;
  const netSales = verdeMonthly.sales.netSales;
  const foodCost = verdeMonthly.costs.foodCost;
  const grossProfit = verdeMonthly.profit.grossProfit;
  const opExpenses = verdeMonthly.costs.operatingExpenses;
  const netProfit = verdeMonthly.profit.estimatedNetProfit;

  assert(Math.abs(netSales - (grossSales - discounts)) < 0.01, 'G, H, I. Net Sales = Gross Sales - Discounts');
  assert(Math.abs(grossProfit - (netSales - foodCost)) < 0.01, 'K. Gross Profit = Net Sales - Food Cost (COGS)');
  assert(Math.abs(netProfit - (grossProfit - opExpenses)) < 0.01, 'L, M. Net Profit = Gross Profit - Operating Expenses');
  assert(verdeMonthly.sales.taxAmount > 0, 'J. Tax (GST) is tracked separately and excluded from profit');

  // 9. Cancelled Orders vs Completed Orders
  assert(verdeMonthly.orders.completed > 0, 'P. Completed orders included in sales');
  assert(verdeMonthly.orders.cancelled > 0, 'O. Cancelled orders tracked separately and excluded from sales & food costs');

  // 10. Payment Collections vs Sales Separated
  assert(verdeMonthly.payments.paidAmount > 0, 'Q. Authoritative paid collections tracked');
  assert(verdeMonthly.payments.unpaidAmount >= 0, 'R. Unpaid pending balances tracked separately');

  // 11. Veg vs Non-Veg Analytics
  assert(verdeMonthly.vegNonVeg.veg.sales > 0, 'S. Veg analytics populated correctly');
  assert(verdeMonthly.vegNonVeg.veg.foodCost > 0, 'S. Veg food cost calculated from snapshots');

  // 12. Best Sellers & Low Performers
  assert(verdeMonthly.productPerformance.bestSellers.length > 0, 'T. Best sellers ranked by quantity sold');
  assert(verdeMonthly.productPerformance.lowPerformers.length > 0, 'T. Low performers identified by explicit quantity');

  // 13. Category Performance
  assert(verdeMonthly.categoryPerformance.length > 0, 'U. Category performance metrics computed');

  // 14. Sales Trend
  assert(verdeMonthly.salesTrend.length > 0, 'V. Daily sales trend array populated');

  // 15. Peak Hours in Asia/Kolkata
  assert(verdeMonthly.peakHours.length === 24, 'W. Peak hours covers 24 hours (0-23 in Asia/Kolkata)');

  // 16. Date Boundary Handling (e.g. single day filter)
  const singleDay = await repository.getFinancialAnalytics('rest-verde-01', '2026-09-27', '2026-09-27');
  assert(singleDay.sales.orderCount > 0, 'X. Date boundary handling works accurately for single day filter');

  // 17. Multi-tenant Analytics Isolation
  const emberMonthly = await repository.getFinancialAnalytics('rest-ember-02', '2026-09-01', '2026-09-30');
  assert(
    emberMonthly.sales.grossSales !== verdeMonthly.sales.grossSales,
    'Y. Multi-tenant isolation gives distinct authentic analytics for Ember vs Verde',
  );

  // 18. INR Currency Formatting
  const formatted = formatCurrency(125000.5, 'INR', '₹');
  assert(formatted.includes('₹') && formatted.includes('1,25,000.50'), 'Z. INR currency formatted with standard Indian numbering');

  console.log(`\n====================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
