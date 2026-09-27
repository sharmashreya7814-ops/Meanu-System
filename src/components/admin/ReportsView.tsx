import React, { useEffect, useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  Wallet,
  Receipt,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { BusinessReportResponse, Restaurant } from '../../types/index.js';
import { api } from '../../services/api.js';
import { formatCurrency, formatPercentage } from '../../utils/formatters.js';
import {
  exportCategoryPerformanceCsv,
  exportExpensesCsv,
  exportPaymentsCsv,
  exportProductPerformanceCsv,
  exportSalesReportCsv,
} from '../../utils/csvExport.js';

interface ReportsViewProps {
  restaurant: Restaurant;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ restaurant }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [report, setReport] = useState<BusinessReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonthReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const [year, month] = selectedMonth.split('-');
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      const lastDay = new Date(y, m, 0).getDate();

      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;

      const data = await api.getBusinessReport(
        restaurant.id,
        startDate,
        endDate,
        'Asia/Kolkata',
        'thisMonth',
      );
      setReport(data);
    } catch (err: any) {
      console.error('Failed to generate monthly report:', err);
      setError(err.message || 'Failed to generate monthly report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthReport();
  }, [restaurant.id, selectedMonth]);

  const currencyCode = restaurant.currency || 'INR';
  const currencySymbol = restaurant.currencySymbol || '₹';
  const fmt = (val: number | undefined | null) =>
    formatCurrency(val, currencyCode, currencySymbol);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Executive Reporting</span>
            <span aria-hidden="true">·</span>
            <span>Monthly Statement Ledger</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>Formal Monthly Business Report</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Select Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-mono focus:outline-none text-xs"
            />
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-slate-500 text-xs animate-pulse">
          Generating formal monthly statement...
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchMonthReport} className="underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {report && !loading && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-8 font-sans">
          {/* Printable Report Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-6 gap-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-400 block mb-1">
                Executive Management Report
              </span>
              <h2 className="text-2xl font-bold text-white">{restaurant.name}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Reporting Period: {report.period.startDate.slice(0, 10)} to {report.period.endDate.slice(0, 10)}
              </p>
            </div>
            <div className="text-left sm:text-right text-xs text-slate-400 font-mono">
              <p>Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p>Currency: {restaurant.currency} ({restaurant.currencySymbol})</p>
              <p>Timezone: Asia/Kolkata (IST)</p>
            </div>
          </div>

          {/* 1. EXECUTIVE & BUSINESS SUMMARY */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-1">
              1. Business Revenue & Trading Volume
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl">
                <span className="text-slate-400 text-[11px] block font-sans">Gross Sales</span>
                <span className="text-lg font-bold text-white tabular-nums">{fmt(report.financialCurrent.sales.grossSales)}</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl">
                <span className="text-slate-400 text-[11px] block font-sans">Promotional Discounts</span>
                <span className="text-lg font-bold text-rose-300 tabular-nums">-{fmt(report.financialCurrent.sales.discountAmount)}</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl">
                <span className="text-slate-400 text-[11px] block font-sans">Net Sales</span>
                <span className="text-lg font-bold text-emerald-400 tabular-nums">{fmt(report.financialCurrent.sales.netSales)}</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl">
                <span className="text-slate-400 text-[11px] block font-sans">Completed Orders</span>
                <span className="text-lg font-bold text-white tabular-nums">{report.financialCurrent.sales.orderCount}</span>
              </div>
            </div>
          </div>

          {/* 2. COST SUMMARY & COGS */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1">
              2. Cost Structure & Operational Overhead
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl">
                <span className="text-slate-400 text-[11px] block font-sans">Food Cost / COGS</span>
                <span className="text-lg font-bold text-amber-300 tabular-nums">{fmt(report.financialCurrent.costs.foodCost)}</span>
                <span className="text-[10px] text-slate-500 block mt-1">Rate: {formatPercentage(report.financialCurrent.costs.foodCostPercentage)}</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl">
                <span className="text-slate-400 text-[11px] block font-sans">Operating Overhead</span>
                <span className="text-lg font-bold text-rose-300 tabular-nums">{fmt(report.financialCurrent.costs.operatingExpenses)}</span>
                <span className="text-[10px] text-slate-500 block mt-1">Rent, payroll, utilities</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl">
                <span className="text-slate-400 text-[11px] block font-sans">Statutory Tax (GST)</span>
                <span className="text-lg font-bold text-slate-300 tabular-nums">{fmt(report.financialCurrent.sales.taxAmount)}</span>
                <span className="text-[10px] text-slate-500 block mt-1">Direct pass-through liability</span>
              </div>
            </div>
          </div>

          {/* 3. PROFITABILITY STATEMENT */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800 pb-1">
              3. Profitability & Margin Health
            </h3>
            <table className="w-full text-xs text-left divide-y divide-slate-800 font-mono">
              <tbody>
                <tr className="py-2">
                  <td className="py-2 text-slate-300 font-sans">Net Sales</td>
                  <td className="py-2 text-right text-emerald-400 font-bold tabular-nums">{fmt(report.financialCurrent.sales.netSales)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-400 pl-4 font-sans">Less: Food Cost (COGS)</td>
                  <td className="py-2 text-right text-amber-300 tabular-nums">-{fmt(report.financialCurrent.costs.foodCost)}</td>
                </tr>
                <tr className="border-t border-slate-800 bg-slate-900/40">
                  <td className="py-2.5 font-sans font-bold text-white">Gross Profit</td>
                  <td className="py-2.5 text-right font-bold text-white tabular-nums">
                    {fmt(report.financialCurrent.profit.grossProfit)} ({formatPercentage(report.financialCurrent.profit.grossMarginPercentage)})
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-400 pl-4 font-sans">Less: Operating Expenses</td>
                  <td className="py-2 text-right text-rose-300 tabular-nums">-{fmt(report.financialCurrent.costs.operatingExpenses)}</td>
                </tr>
                <tr className="border-t border-slate-700 bg-slate-900/80 font-bold text-sm">
                  <td className="py-3 font-sans text-emerald-400">Estimated Net Profit / Loss</td>
                  <td className="py-3 text-right text-emerald-400 tabular-nums">
                    {fmt(report.financialCurrent.profit.estimatedNetProfit)} ({formatPercentage(report.financialCurrent.profit.netMarginPercentage)})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. TOP PRODUCTS & CATEGORY PERFORMANCE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Top 5 Selling Items</h3>
              <table className="w-full text-xs text-left font-mono divide-y divide-slate-900">
                <thead className="text-[11px] text-slate-400 uppercase">
                  <tr>
                    <th className="py-2 font-sans">Item</th>
                    <th className="py-2 text-right">Sold</th>
                    <th className="py-2 text-right">Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {report.productProfitability.topSellingByQuantity.slice(0, 5).map((p) => (
                    <tr key={p.menuItemId}>
                      <td className="py-2 font-sans text-slate-200">{p.name}</td>
                      <td className="py-2 text-right text-white font-bold">{p.quantitySold}</td>
                      <td className="py-2 text-right text-emerald-400">{fmt(p.grossContribution)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Category Performance</h3>
              <table className="w-full text-xs text-left font-mono divide-y divide-slate-900">
                <thead className="text-[11px] text-slate-400 uppercase">
                  <tr>
                    <th className="py-2 font-sans">Category</th>
                    <th className="py-2 text-right">Sales</th>
                    <th className="py-2 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {report.categoryPerformance.slice(0, 5).map((c) => (
                    <tr key={c.categoryId}>
                      <td className="py-2 font-sans text-slate-200">{c.name}</td>
                      <td className="py-2 text-right text-white font-bold">{fmt(c.sales)}</td>
                      <td className="py-2 text-right text-slate-300">{formatPercentage(c.marginPercentage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. SETTLEMENT & CUSTOMER RETENTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs font-mono">
            <div className="p-4 bg-slate-900/60 rounded-xl space-y-1">
              <span className="text-slate-400 font-sans font-bold block mb-1">Collections & Receivables</span>
              <div className="flex justify-between text-emerald-400">
                <span className="font-sans">Settled Payments:</span>
                <span className="font-bold">{fmt(report.paymentsBreakdown.totalSettled)}</span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span className="font-sans">Pending / Unpaid:</span>
                <span className="font-bold">{fmt(report.paymentsBreakdown.unpaidAmount)}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl space-y-1">
              <span className="text-slate-400 font-sans font-bold block mb-1">Dining Guests & Retention</span>
              <div className="flex justify-between text-white">
                <span className="font-sans">Unique Guests:</span>
                <span>{report.customers.totalUniqueCustomers}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span className="font-sans">Repeat Guest Rate:</span>
                <span>{report.customers.repeatCustomerPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
