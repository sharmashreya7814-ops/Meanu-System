import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  PieChart,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Leaf,
  Flame,
  FileSpreadsheet,
  Wallet,
  Receipt,
  Tag,
  ShieldCheck,
  Download,
  Printer,
  Users,
  UtensilsCrossed,
  Layers,
  ChevronRight,
  SlidersHorizontal,
  Search,
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

interface BusinessIntelligenceViewProps {
  restaurant: Restaurant;
}

type PeriodPreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'thisYear'
  | 'custom';

export const BusinessIntelligenceView: React.FC<BusinessIntelligenceViewProps> = ({
  restaurant,
}) => {
  const [preset, setPreset] = useState<PeriodPreset>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [report, setReport] = useState<BusinessReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'growth' | 'products' | 'categories' | 'patterns' | 'customers' | 'print'
  >('growth');

  // Product table search & filter
  const [productSearch, setProductSearch] = useState<string>('');
  const [categorySortMetric, setCategorySortMetric] = useState<'sales' | 'quantity' | 'grossContribution'>('sales');

  const fetchReport = async () => {
    setLoading(true);
    setError(null);

    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (preset === 'custom' && customStartDate && customEndDate) {
        startDate = customStartDate;
        endDate = customEndDate;
      }

      const data = await api.getBusinessReport(
        restaurant.id,
        startDate,
        endDate,
        'Asia/Kolkata',
        preset,
      );
      setReport(data);
    } catch (err: any) {
      console.error('Failed to load business intelligence report:', err);
      setError(err.message || 'Failed to load business intelligence report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [restaurant.id, preset, customStartDate, customEndDate]);

  const currencyCode = restaurant.currency || 'INR';
  const currencySymbol = restaurant.currencySymbol || '₹';
  const fmt = (val: number | undefined | null) =>
    formatCurrency(val, currencyCode, currencySymbol);

  const renderComparisonBadge = (
    metric: { current: number; previous: number; absoluteChange: number; percentageChange: number | null },
    isCurrency: boolean = true,
  ) => {
    if (metric.percentageChange === null) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
          New / No previous data
        </span>
      );
    }

    const isPositive = metric.absoluteChange >= 0;
    const absChangeFormatted = isCurrency
      ? fmt(Math.abs(metric.absoluteChange))
      : Math.abs(metric.absoluteChange).toLocaleString();

    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
          isPositive
            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
            : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
        }`}
      >
        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        <span>{isPositive ? '+' : '-'}{absChangeFormatted}</span>
        <span className="opacity-75">({isPositive ? '+' : ''}{metric.percentageChange.toFixed(1)}%)</span>
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Executive Suite</span>
            <span aria-hidden="true">·</span>
            <span>Deterministic Business Intelligence</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-mono">Asia/Kolkata</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <span>Restaurant Business Intelligence & Growth</span>
          </h1>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last7', label: 'Last 7D' },
              { id: 'last30', label: 'Last 30D' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'lastMonth', label: 'Last Month' },
              { id: 'thisQuarter', label: 'This Quarter' },
              { id: 'thisYear', label: 'This Year' },
              { id: 'custom', label: 'Custom' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id as PeriodPreset)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  preset === p.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchReport}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
            title="Refresh Report"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom Date Pickers */}
      {preset === 'custom' && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Start Date:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-hidden"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">End Date:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-hidden"
            />
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, idx) => (
            <div
              key={idx}
              className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl animate-pulse h-32 flex flex-col justify-between"
            >
              <div className="h-3 w-24 bg-slate-800 rounded-sm" />
              <div className="h-6 w-32 bg-slate-800 rounded-sm" />
              <div className="h-4 w-28 bg-slate-800/60 rounded-sm" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 bg-rose-950/40 border border-rose-800/80 rounded-2xl flex items-center justify-between text-rose-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Failed to generate Business Intelligence report</p>
              <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchReport}
            className="px-3 py-1.5 bg-rose-800 hover:bg-rose-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Populated Report Content */}
      {report && (
        <>
          {/* Top Period Comparison Banner */}
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-mono">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>
                Current Period: <strong className="text-white">{report.period.startDate.slice(0, 10)}</strong> to{' '}
                <strong className="text-white">{report.period.endDate.slice(0, 10)}</strong>
              </span>
              <span className="text-slate-500">vs</span>
              <span>
                Prior Baseline: <span className="text-slate-400">{report.period.previousStartDate.slice(0, 10)}</span> to{' '}
                <span className="text-slate-400">{report.period.previousEndDate.slice(0, 10)}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Strictly deterministic & tenant-isolated</span>
            </div>
          </div>

          {/* Executive KPI Grid with Period Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Net Sales */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Net Sales (Revenue)</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
                {fmt(report.executiveKPIs.netSales.current)}
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  Prev: {fmt(report.executiveKPIs.netSales.previous)}
                </span>
                {renderComparisonBadge(report.executiveKPIs.netSales)}
              </div>
            </div>

            {/* 2. Gross Profit */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Gross Profit</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono tracking-tight text-emerald-400 tabular-nums">
                {fmt(report.executiveKPIs.grossProfit.current)}
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  Margin: {formatPercentage(report.executiveKPIs.grossMarginPercentage.current)}
                </span>
                {renderComparisonBadge(report.executiveKPIs.grossProfit)}
              </div>
            </div>

            {/* 3. Food Cost / COGS */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Food Cost (COGS)</span>
                <Tag className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono tracking-tight text-amber-300 tabular-nums">
                {fmt(report.executiveKPIs.foodCost.current)}
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  Rate: {formatPercentage(report.executiveKPIs.foodCostPercentage.current)}
                </span>
                {renderComparisonBadge(report.executiveKPIs.foodCost)}
              </div>
            </div>

            {/* 4. Estimated Net Profit */}
            <div
              className={`p-4 rounded-2xl flex flex-col justify-between border ${
                report.executiveKPIs.estimatedNetProfit.current >= 0
                  ? 'bg-emerald-950/25 border-emerald-800/60'
                  : 'bg-rose-950/25 border-rose-800/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Estimated Net Profit</span>
                <Wallet className="w-4 h-4 text-rose-400" />
              </div>
              <div
                className={`text-2xl font-bold font-mono tracking-tight tabular-nums ${
                  report.executiveKPIs.estimatedNetProfit.current >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {fmt(report.executiveKPIs.estimatedNetProfit.current)}
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Net Margin: {formatPercentage(report.executiveKPIs.netMarginPercentage.current)}
                </span>
                {renderComparisonBadge(report.executiveKPIs.estimatedNetProfit)}
              </div>
            </div>

            {/* 5. Completed Orders */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Completed Orders</span>
                <UtensilsCrossed className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
                {report.executiveKPIs.ordersCount.current}
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  Prev: {report.executiveKPIs.ordersCount.previous}
                </span>
                {renderComparisonBadge(report.executiveKPIs.ordersCount, false)}
              </div>
            </div>

            {/* 6. Average Order Value */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Average Order Value (AOV)</span>
                <PieChart className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
                {fmt(report.executiveKPIs.averageOrderValue.current)}
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  Prev: {fmt(report.executiveKPIs.averageOrderValue.previous)}
                </span>
                {renderComparisonBadge(report.executiveKPIs.averageOrderValue)}
              </div>
            </div>

            {/* 7. Operating Overhead */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Operating Expenses</span>
                <Wallet className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold font-mono tracking-tight text-rose-300 tabular-nums">
                {fmt(report.executiveKPIs.operatingExpenses.current)}
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  Prev: {fmt(report.executiveKPIs.operatingExpenses.previous)}
                </span>
                {renderComparisonBadge(report.executiveKPIs.operatingExpenses)}
              </div>
            </div>

            {/* 8. Paid Collections vs Unpaid */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Settled Collections</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono tracking-tight text-emerald-400 tabular-nums">
                {fmt(report.executiveKPIs.paidCollections.current)}
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[11px] text-amber-400 font-mono">
                  Unpaid: {fmt(report.executiveKPIs.unpaidAmount.current)}
                </span>
                {renderComparisonBadge(report.executiveKPIs.paidCollections)}
              </div>
            </div>
          </div>

          {/* Navigation Section Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
            {[
              { id: 'growth', label: 'Sales Growth & P&L Analysis' },
              { id: 'products', label: 'Item Profitability & Volume' },
              { id: 'categories', label: 'Categories & Veg Distribution' },
              { id: 'patterns', label: 'Peak Times & Operations' },
              { id: 'customers', label: 'Customers & Payments' },
              { id: 'print', label: 'Export Data & Executive Reports' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: Sales Growth & P&L Analysis */}
          {activeTab === 'growth' && (
            <div className="space-y-6">
              {/* Daily Sales Comparison Trend */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Daily Sales Period-over-Period Growth</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Aligned daily sales volume: Current Period vs Immediately Preceding Baseline
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                      Current Period
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-sm bg-slate-700" />
                      Prior Baseline
                    </span>
                  </div>
                </div>

                {report.salesGrowth.trendComparison.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No sales data available for this period.
                  </div>
                ) : (
                  <div className="h-64 flex items-end gap-1 sm:gap-2 pt-6 pb-2 px-2 overflow-x-auto">
                    {(() => {
                      const maxVal = Math.max(
                        ...report.salesGrowth.trendComparison.flatMap((t) => [
                          t.salesCurrent,
                          t.salesPrevious,
                        ]),
                        100,
                      );

                      return report.salesGrowth.trendComparison.map((point) => {
                        const curHeight = Math.max(6, (point.salesCurrent / maxVal) * 100);
                        const prevHeight = Math.max(6, (point.salesPrevious / maxVal) * 100);

                        return (
                          <div
                            key={point.index}
                            className="flex-1 min-w-[28px] max-w-[48px] h-full flex flex-col justify-end items-center group relative cursor-pointer"
                          >
                            {/* Hover tooltip */}
                            <div className="absolute -top-14 bg-slate-900 border border-slate-700 text-white text-[10px] p-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                              <p className="font-bold text-slate-200">{point.labelCurrent}</p>
                              <p className="text-emerald-400">Current: {fmt(point.salesCurrent)} ({point.ordersCurrent} ord)</p>
                              <p className="text-slate-400">Prior: {fmt(point.salesPrevious)} ({point.ordersPrevious} ord)</p>
                            </div>

                            <div className="w-full flex items-end justify-center gap-0.5 h-full">
                              <div
                                style={{ height: `${prevHeight}%` }}
                                className="w-2 sm:w-3 bg-slate-700/80 rounded-t-sm group-hover:bg-slate-600 transition-colors"
                              />
                              <div
                                style={{ height: `${curHeight}%` }}
                                className="w-2.5 sm:w-3.5 bg-emerald-500 rounded-t-sm group-hover:bg-emerald-400 transition-colors"
                              />
                            </div>
                            <span className="text-[9px] text-slate-400 mt-2 truncate w-full text-center font-mono">
                              {point.labelCurrent.split(' ')[1] || point.index}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

              {/* Revenue vs Costs vs Profit Summary Table */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                  <h3 className="text-sm font-bold text-white mb-3">Profitability Variance Ledger</h3>
                  <table className="w-full text-xs text-left divide-y divide-slate-900 font-mono">
                    <thead className="text-[11px] text-slate-400 uppercase">
                      <tr>
                        <th className="py-2 font-sans">Accounting Component</th>
                        <th className="py-2 text-right">Current</th>
                        <th className="py-2 text-right">Prior</th>
                        <th className="py-2 text-right">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      <tr>
                        <td className="py-2.5 font-sans text-slate-200">Gross Sales</td>
                        <td className="py-2.5 text-right text-white tabular-nums">{fmt(report.executiveKPIs.grossSales.current)}</td>
                        <td className="py-2.5 text-right text-slate-400 tabular-nums">{fmt(report.executiveKPIs.grossSales.previous)}</td>
                        <td className="py-2.5 text-right">{renderComparisonBadge(report.executiveKPIs.grossSales)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-sans text-slate-200">Discounts</td>
                        <td className="py-2.5 text-right text-rose-300 tabular-nums">-{fmt(report.executiveKPIs.discountAmount.current)}</td>
                        <td className="py-2.5 text-right text-slate-400 tabular-nums">-{fmt(report.executiveKPIs.discountAmount.previous)}</td>
                        <td className="py-2.5 text-right">{renderComparisonBadge(report.executiveKPIs.discountAmount)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-sans font-bold text-emerald-400">Net Sales</td>
                        <td className="py-2.5 text-right font-bold text-emerald-400 tabular-nums">{fmt(report.executiveKPIs.netSales.current)}</td>
                        <td className="py-2.5 text-right text-slate-400 tabular-nums">{fmt(report.executiveKPIs.netSales.previous)}</td>
                        <td className="py-2.5 text-right">{renderComparisonBadge(report.executiveKPIs.netSales)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-sans text-amber-300">Food Cost (COGS)</td>
                        <td className="py-2.5 text-right text-amber-300 tabular-nums">-{fmt(report.executiveKPIs.foodCost.current)}</td>
                        <td className="py-2.5 text-right text-slate-400 tabular-nums">-{fmt(report.executiveKPIs.foodCost.previous)}</td>
                        <td className="py-2.5 text-right">{renderComparisonBadge(report.executiveKPIs.foodCost)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-sans font-bold text-white">Gross Profit</td>
                        <td className="py-2.5 text-right font-bold text-white tabular-nums">{fmt(report.executiveKPIs.grossProfit.current)}</td>
                        <td className="py-2.5 text-right text-slate-400 tabular-nums">{fmt(report.executiveKPIs.grossProfit.previous)}</td>
                        <td className="py-2.5 text-right">{renderComparisonBadge(report.executiveKPIs.grossProfit)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-sans text-rose-400">Operating Expenses</td>
                        <td className="py-2.5 text-right text-rose-400 tabular-nums">-{fmt(report.executiveKPIs.operatingExpenses.current)}</td>
                        <td className="py-2.5 text-right text-slate-400 tabular-nums">-{fmt(report.executiveKPIs.operatingExpenses.previous)}</td>
                        <td className="py-2.5 text-right">{renderComparisonBadge(report.executiveKPIs.operatingExpenses)}</td>
                      </tr>
                      <tr className="bg-slate-900/50 font-bold">
                        <td className="py-3 font-sans text-emerald-400">Estimated Net Profit</td>
                        <td className="py-3 text-right text-emerald-400 tabular-nums">{fmt(report.executiveKPIs.estimatedNetProfit.current)}</td>
                        <td className="py-3 text-right text-slate-400 tabular-nums">{fmt(report.executiveKPIs.estimatedNetProfit.previous)}</td>
                        <td className="py-3 text-right">{renderComparisonBadge(report.executiveKPIs.estimatedNetProfit)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">Financial Ratios & Margin Rates</h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Authoritative margin percentages calculated on Net Sales
                    </p>

                    <div className="space-y-4 text-xs">
                      <div>
                        <div className="flex justify-between text-slate-300 font-medium mb-1">
                          <span>Food Cost (COGS) Rate</span>
                          <span className="font-mono text-amber-300">{formatPercentage(report.executiveKPIs.foodCostPercentage.current)}</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, report.executiveKPIs.foodCostPercentage.current)}%` }}
                            className="bg-amber-500 h-full rounded-full"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 font-medium mb-1">
                          <span>Gross Profit Margin</span>
                          <span className="font-mono text-emerald-400">{formatPercentage(report.executiveKPIs.grossMarginPercentage.current)}</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, report.executiveKPIs.grossMarginPercentage.current)}%` }}
                            className="bg-emerald-500 h-full rounded-full"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 font-medium mb-1">
                          <span>Net Profit Margin Rate</span>
                          <span className="font-mono text-emerald-400">{formatPercentage(report.executiveKPIs.netMarginPercentage.current)}</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.max(0, Math.min(100, report.executiveKPIs.netMarginPercentage.current))}%` }}
                            className="bg-blue-500 h-full rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 mt-4">
                    Statutory GST tax collected in this period:{' '}
                    <strong className="text-white font-mono">{fmt(report.executiveKPIs.taxCollected.current)}</strong>{' '}
                    (excluded from restaurant revenues).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Item Profitability & Volume */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Product Profitability Matrix: Top Selling vs Top Gross Contribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Top Selling by Quantity */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        <span>Top Selling Items (By Volume)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Ranked by total quantity sold</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2">Item</th>
                          <th className="py-2 text-right">Units</th>
                          <th className="py-2 text-right">Gross Sales</th>
                          <th className="py-2 text-right">Contribution</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 font-mono">
                        {report.productProfitability.topSellingByQuantity.map((p, idx) => (
                          <tr key={p.menuItemId} className="hover:bg-slate-900/40">
                            <td className="py-2.5 font-sans flex items-center gap-1.5">
                              <span className="text-slate-500 text-[10px] w-3">{idx + 1}.</span>
                              <span className={p.isVeg ? 'text-emerald-300' : 'text-orange-300'}>
                                {p.name}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-bold text-white tabular-nums">{p.quantitySold}</td>
                            <td className="py-2.5 text-right text-slate-300 tabular-nums">{fmt(p.sales)}</td>
                            <td className="py-2.5 text-right text-emerald-400 tabular-nums">{fmt(p.grossContribution)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Top Gross Contribution */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span>Top Gross Contribution (By ₹ Profit)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Ranked by (Sales - Food Cost)</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2">Item</th>
                          <th className="py-2 text-right">Contribution</th>
                          <th className="py-2 text-right">Food Cost</th>
                          <th className="py-2 text-right">Margin %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 font-mono">
                        {report.productProfitability.topByGrossContribution.map((p, idx) => (
                          <tr key={p.menuItemId} className="hover:bg-slate-900/40">
                            <td className="py-2.5 font-sans flex items-center gap-1.5">
                              <span className="text-slate-500 text-[10px] w-3">{idx + 1}.</span>
                              <span className={p.isVeg ? 'text-emerald-300' : 'text-orange-300'}>
                                {p.name}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-bold text-emerald-400 tabular-nums">{fmt(p.grossContribution)}</td>
                            <td className="py-2.5 text-right text-amber-300 tabular-nums">{fmt(p.foodCost)}</td>
                            <td className="py-2.5 text-right text-slate-300 tabular-nums">{formatPercentage(p.marginPercentage)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Complete Searchable Product Ledger */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Full Menu Item Performance Matrix</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Immutable historical cost snapshots used for all food cost calculations
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search menu item..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="bg-transparent text-white placeholder-slate-500 focus:outline-none w-full text-xs"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900/60 text-[11px] uppercase text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Item Name</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3 text-right">Units Sold</th>
                        <th className="py-2.5 px-3 text-right">Gross Sales</th>
                        <th className="py-2.5 px-3 text-right">Food Cost (COGS)</th>
                        <th className="py-2.5 px-3 text-right">Gross Contribution</th>
                        <th className="py-2.5 px-3 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {report.productProfitability.allProducts
                        .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                        .map((p) => (
                          <tr key={p.menuItemId} className="hover:bg-slate-900/40">
                            <td className="py-2.5 px-3 font-sans font-medium text-white">{p.name}</td>
                            <td className="py-2.5 px-3 font-sans text-slate-400">{p.categoryName}</td>
                            <td className="py-2.5 px-3 font-sans">
                              {p.isVeg ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                                  <Leaf className="w-3 h-3" /> Veg
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-orange-400">
                                  <Flame className="w-3 h-3" /> Non-Veg
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right text-white font-bold tabular-nums">{p.quantitySold}</td>
                            <td className="py-2.5 px-3 text-right text-slate-200 tabular-nums">{fmt(p.sales)}</td>
                            <td className="py-2.5 px-3 text-right text-amber-300 tabular-nums">{fmt(p.foodCost)}</td>
                            <td className="py-2.5 px-3 text-right text-emerald-400 font-bold tabular-nums">{fmt(p.grossContribution)}</td>
                            <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">{formatPercentage(p.marginPercentage)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Categories & Veg Distribution */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Veg vs Non-Veg Contribution Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                      <Leaf className="w-4 h-4" />
                      <span>Vegetarian Items</span>
                    </span>
                    <span className="font-mono text-xs text-emerald-400 font-semibold">
                      {report.vegNonVeg.veg.contributionPercentage}% of Gross Profit
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                    <div>
                      <span className="text-slate-500 block">Units Sold</span>
                      <span className="text-base font-bold text-white font-mono">{report.vegNonVeg.veg.quantity} units</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Gross Sales</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">{fmt(report.vegNonVeg.veg.sales)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Food Cost (COGS)</span>
                      <span className="text-sm font-semibold text-amber-300 font-mono">{fmt(report.vegNonVeg.veg.foodCost)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Gross Profit</span>
                      <span className="text-sm font-semibold text-white font-mono">{fmt(report.vegNonVeg.veg.grossContribution)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 text-orange-400 text-sm font-bold">
                      <Flame className="w-4 h-4" />
                      <span>Non-Vegetarian Items</span>
                    </span>
                    <span className="font-mono text-xs text-orange-400 font-semibold">
                      {report.vegNonVeg.nonVeg.contributionPercentage}% of Gross Profit
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                    <div>
                      <span className="text-slate-500 block">Units Sold</span>
                      <span className="text-base font-bold text-white font-mono">{report.vegNonVeg.nonVeg.quantity} units</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Gross Sales</span>
                      <span className="text-base font-bold text-orange-400 font-mono">{fmt(report.vegNonVeg.nonVeg.sales)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Food Cost (COGS)</span>
                      <span className="text-sm font-semibold text-amber-300 font-mono">{fmt(report.vegNonVeg.nonVeg.foodCost)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Gross Profit</span>
                      <span className="text-sm font-semibold text-white font-mono">{fmt(report.vegNonVeg.nonVeg.grossContribution)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Category Performance Table */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Category Financial Performance</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Sortable by Sales, Volume, or Gross Contribution</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Sort By:</span>
                    <select
                      value={categorySortMetric}
                      onChange={(e) => setCategorySortMetric(e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    >
                      <option value="sales">Gross Sales (₹)</option>
                      <option value="quantity">Units Sold</option>
                      <option value="grossContribution">Gross Contribution (₹)</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900/60 text-[11px] uppercase text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Category Name</th>
                        <th className="py-2.5 px-3 text-right">Units Sold</th>
                        <th className="py-2.5 px-3 text-right">Gross Sales</th>
                        <th className="py-2.5 px-3 text-right">Food Cost</th>
                        <th className="py-2.5 px-3 text-right">Gross Contribution</th>
                        <th className="py-2.5 px-3 text-right">Contribution Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {[...report.categoryPerformance]
                        .sort((a, b) => (b as any)[categorySortMetric] - (a as any)[categorySortMetric])
                        .map((cat) => (
                          <tr key={cat.categoryId} className="hover:bg-slate-900/40">
                            <td className="py-3 px-3 font-sans font-medium text-white">{cat.name}</td>
                            <td className="py-3 px-3 text-right text-white font-bold tabular-nums">{cat.quantitySold}</td>
                            <td className="py-3 px-3 text-right text-emerald-400 tabular-nums">{fmt(cat.sales)}</td>
                            <td className="py-3 px-3 text-right text-amber-300 tabular-nums">{fmt(cat.foodCost)}</td>
                            <td className="py-3 px-3 text-right text-white font-bold tabular-nums">{fmt(cat.grossContribution)}</td>
                            <td className="py-3 px-3 text-right text-slate-300 tabular-nums">{formatPercentage(cat.marginPercentage)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Peak Times & Operations */}
          {activeTab === 'patterns' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 24-Hour Trading Volume (Asia/Kolkata) */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>24-Hour Trading Volume (IST)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">Orders, Sales, and Average Order Value by hour</p>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {report.peakHours
                      .filter((h) => h.orders > 0 || [12, 13, 14, 19, 20, 21].includes(h.hour))
                      .map((hour) => {
                        const maxH = Math.max(...report.peakHours.map((h) => h.orders), 1);
                        const pct = (hour.orders / maxH) * 100;
                        return (
                          <div key={hour.hour} className="flex items-center gap-2.5 text-xs">
                            <span className="w-16 font-mono text-[11px] text-slate-400">{hour.label}</span>
                            <div className="flex-1 bg-slate-900 rounded-full h-3 overflow-hidden">
                              <div style={{ width: `${pct}%` }} className="bg-emerald-500 h-full rounded-full" />
                            </div>
                            <span className="w-16 text-right font-mono font-medium text-white">{hour.orders} ord</span>
                            <span className="w-20 text-right font-mono text-slate-300">{fmt(hour.sales)}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Day of Week Volume */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span>Day of Week Trading Volume</span>
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">Orders and Gross Profit Contribution by day</p>

                  <div className="space-y-2.5">
                    {report.peakDays.map((day) => {
                      const maxD = Math.max(...report.peakDays.map((d) => d.sales), 1);
                      const pct = (day.sales / maxD) * 100;
                      return (
                        <div key={day.dayOfWeek} className="flex items-center gap-3 text-xs">
                          <span className="w-20 text-slate-300 font-medium">{day.dayName}</span>
                          <div className="flex-1 bg-slate-900 rounded-full h-3 overflow-hidden">
                            <div style={{ width: `${pct}%` }} className="bg-blue-500 h-full rounded-full" />
                          </div>
                          <span className="w-16 text-right font-mono text-slate-400">{day.orders} ord</span>
                          <span className="w-24 text-right font-mono font-semibold text-white">{fmt(day.sales)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Order Operational Metrics & Cancellation Rate */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                <h3 className="text-sm font-bold text-white mb-1">Order Lifecycle & Operational Quality</h3>
                <p className="text-xs text-slate-400 mb-4">Comprehensive operational counts across order states</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 bg-slate-900/60 rounded-xl">
                    <span className="text-slate-400 text-xs block">Total Orders Created</span>
                    <span className="text-xl font-bold text-white font-mono">{report.ordersOperational.totalOrders}</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl">
                    <span className="text-slate-400 text-xs block">Completed & Fulfilled</span>
                    <span className="text-xl font-bold text-emerald-400 font-mono">{report.ordersOperational.completedOrders}</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl">
                    <span className="text-slate-400 text-xs block">Cancellation Rate</span>
                    <span className="text-xl font-bold text-rose-400 font-mono">{report.ordersOperational.cancellationRate}%</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl">
                    <span className="text-slate-400 text-xs block">Avg Items per Order</span>
                    <span className="text-xl font-bold text-blue-400 font-mono">{report.ordersOperational.averageItemsPerOrder}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
                  {report.ordersOperational.statusDistribution.map((st) => (
                    <span key={st.status} className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
                      {st.status}: <strong>{st.count}</strong> ({st.percentage}%)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Customers & Payments */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              {/* Customer Behavior & Retention */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Customer Retention & Spending Behavior</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Aggregated customer metrics with privacy protection (phone numbers hidden)
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <span className="text-slate-400 text-xs block mb-1">Unique Dining Guests</span>
                    <span className="text-2xl font-bold text-white font-mono">{report.customers.totalUniqueCustomers}</span>
                  </div>
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <span className="text-slate-400 text-xs block mb-1">Repeat Customer Rate</span>
                    <span className="text-2xl font-bold text-emerald-400 font-mono">{report.customers.repeatCustomerPercentage}%</span>
                  </div>
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <span className="text-slate-400 text-xs block mb-1">Orders per Guest</span>
                    <span className="text-2xl font-bold text-blue-400 font-mono">{report.customers.ordersPerCustomer}</span>
                  </div>
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <span className="text-slate-400 text-xs block mb-1">Average Guest Spend</span>
                    <span className="text-2xl font-bold text-white font-mono">{fmt(report.customers.averageCustomerSpend)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Settlement Breakdown */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                <h3 className="text-sm font-bold text-white mb-1">Payment Method Settlement & Collections</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Actual settled collections vs Pending / Unpaid amounts
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-emerald-950/20 border border-emerald-800/60 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-0.5">Total Settled Collections</span>
                    <span className="text-2xl font-bold text-emerald-400 font-mono">{fmt(report.paymentsBreakdown.totalSettled)}</span>
                  </div>
                  <div className="p-4 bg-amber-950/20 border border-amber-800/60 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-0.5">Pending / Unpaid Receivables</span>
                    <span className="text-2xl font-bold text-amber-400 font-mono">{fmt(report.paymentsBreakdown.unpaidAmount)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {report.paymentsBreakdown.methods.map((pm) => (
                    <div key={pm.method} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-white flex items-center gap-2">
                          <span>{pm.label}</span>
                          <span className="text-slate-500 font-mono text-[11px]">({pm.count} settlements)</span>
                        </span>
                        <span className="font-mono text-emerald-400">{fmt(pm.amount)} · {pm.percentageOfSettled}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div style={{ width: `${pm.percentageOfSettled}%` }} className="bg-emerald-500 h-full rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Export Data & Executive Reports */}
          {activeTab === 'print' && (
            <div className="space-y-6">
              {/* CSV Exports Grid */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Download Machine-Readable CSV Data</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Safe RFC-4180 compliant CSV exports with proper comma and quote escaping
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button
                    onClick={() =>
                      exportSalesReportCsv(
                        restaurant.name,
                        preset,
                        restaurant.currency || 'INR',
                        report.financialCurrent.salesTrend,
                      )
                    }
                    className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-white text-xs block">1. Sales Trend Report</span>
                      <span className="text-[11px] text-slate-400">Daily sales, food cost & profit</span>
                    </div>
                    <Download className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() =>
                      exportProductPerformanceCsv(
                        restaurant.name,
                        preset,
                        restaurant.currency || 'INR',
                        report.productProfitability.allProducts,
                      )
                    }
                    className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-white text-xs block">2. Product Profitability</span>
                      <span className="text-[11px] text-slate-400">Item sales, cost & contribution</span>
                    </div>
                    <Download className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() =>
                      exportCategoryPerformanceCsv(
                        restaurant.name,
                        preset,
                        restaurant.currency || 'INR',
                        report.categoryPerformance,
                      )
                    }
                    className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-white text-xs block">3. Category Report</span>
                      <span className="text-[11px] text-slate-400">Category sales & margins</span>
                    </div>
                    <Download className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={async () => {
                      const expenses = await api.getAdminExpenses(restaurant.id, report.period.startDate, report.period.endDate);
                      exportExpensesCsv(restaurant.name, preset, restaurant.currency || 'INR', expenses);
                    }}
                    className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-white text-xs block">4. Operating Expenses</span>
                      <span className="text-[11px] text-slate-400">Itemized expense vouchers</span>
                    </div>
                    <Download className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() =>
                      exportPaymentsCsv(
                        restaurant.name,
                        preset,
                        restaurant.currency || 'INR',
                        report.paymentsBreakdown.methods,
                        report.paymentsBreakdown.totalSettled,
                        report.paymentsBreakdown.unpaidAmount,
                      )
                    }
                    className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-white text-xs block">5. Payments & Settlements</span>
                      <span className="text-[11px] text-slate-400">Gateway, UPI QR & cash split</span>
                    </div>
                    <Download className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Printable Executive Report */}
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-6 font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Printer className="w-5 h-5 text-emerald-400" />
                      <span>Formal Executive Business Intelligence Report</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Restaurant: {restaurant.name} · Period: {report.period.startDate.slice(0, 10)} to {report.period.endDate.slice(0, 10)}
                    </p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Report (A4)</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="p-3 bg-slate-900/60 rounded-xl">
                    <span className="text-slate-400 text-[11px] block">Net Sales</span>
                    <span className="text-lg font-bold text-white">{fmt(report.executiveKPIs.netSales.current)}</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl">
                    <span className="text-slate-400 text-[11px] block">Food Cost (COGS)</span>
                    <span className="text-lg font-bold text-amber-300">{fmt(report.executiveKPIs.foodCost.current)}</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl">
                    <span className="text-slate-400 text-[11px] block">Gross Profit</span>
                    <span className="text-lg font-bold text-emerald-400">{fmt(report.executiveKPIs.grossProfit.current)}</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl">
                    <span className="text-slate-400 text-[11px] block">Estimated Net Profit</span>
                    <span className="text-lg font-bold text-emerald-400">{fmt(report.executiveKPIs.estimatedNetProfit.current)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <p>• Generated at: {report.period.generatedAt}</p>
                  <p>• Authoritative accounting calculations generated directly from database orders & cost snapshots.</p>
                  <p>• Multi-tenant restaurant isolation enforced for restaurant ID: {restaurant.id}.</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
