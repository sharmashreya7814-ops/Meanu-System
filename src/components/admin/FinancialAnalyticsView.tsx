import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  DollarSign,
  PieChart,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Leaf,
  Flame,
  FileSpreadsheet,
  Wallet,
  Receipt,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { FinancialAnalyticsResponse, Restaurant } from '../../types/index.js';
import { api } from '../../services/api.js';
import { formatCurrency, formatPercentage } from '../../utils/formatters.js';

interface FinancialAnalyticsViewProps {
  restaurant: Restaurant;
}

type DatePreset = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'lastMonth' | 'custom';

export const FinancialAnalyticsView: React.FC<FinancialAnalyticsViewProps> = ({ restaurant }) => {
  const [datePreset, setDatePreset] = useState<DatePreset>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [analytics, setAnalytics] = useState<FinancialAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'overview' | 'breakdown' | 'products' | 'statement'>('overview');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      // Base anchor date (September 27, 2026 in production context)
      const now = new Date();

      if (datePreset === 'today') {
        const todayStr = '2026-09-27';
        startDate = todayStr;
        endDate = todayStr;
      } else if (datePreset === 'yesterday') {
        const yestStr = '2026-09-26';
        startDate = yestStr;
        endDate = yestStr;
      } else if (datePreset === 'last7') {
        startDate = '2026-09-21';
        endDate = '2026-09-27';
      } else if (datePreset === 'thisMonth') {
        startDate = '2026-09-01';
        endDate = '2026-09-30';
      } else if (datePreset === 'lastMonth') {
        startDate = '2026-08-01';
        endDate = '2026-08-31';
      } else if (datePreset === 'custom') {
        if (customStartDate && customEndDate) {
          startDate = customStartDate;
          endDate = customEndDate;
        }
      }

      const data = await api.getFinancialAnalytics(
        restaurant.id,
        startDate,
        endDate,
        'Asia/Kolkata',
      );
      setAnalytics(data);
    } catch (err: any) {
      console.error('Failed to load financial analytics:', err);
      setError(err.message || 'Failed to calculate financial analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [restaurant.id, datePreset, customStartDate, customEndDate]);

  const currencyCode = restaurant.currency || 'INR';
  const currencySymbol = restaurant.currencySymbol || '₹';

  const fmt = (val: number | undefined | null) =>
    formatCurrency(val, currencyCode, currencySymbol);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Finance & Ledger</span>
            <span aria-hidden="true">·</span>
            <span>Deterministic P&L</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-mono">Asia/Kolkata (IST)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Financial Analytics & Profit/Loss</span>
          </h1>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last7', label: 'Last 7 Days' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'lastMonth', label: 'Last Month' },
              { id: 'custom', label: 'Custom' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id as DatePreset)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  datePreset === p.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom Date Pickers */}
      {datePreset === 'custom' && (
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
      {loading && !analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl animate-pulse h-28 flex flex-col justify-between"
            >
              <div className="h-3 w-20 bg-slate-800 rounded-sm" />
              <div className="h-6 w-28 bg-slate-800 rounded-sm" />
              <div className="h-2.5 w-16 bg-slate-800/60 rounded-sm" />
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
              <p className="font-semibold text-sm">Failed to retrieve financial metrics</p>
              <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-3 py-1.5 bg-rose-800 hover:bg-rose-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Populated Analytics Data */}
      {analytics && (
        <>
          {/* Primary Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* 1. Gross Sales */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Gross Sales</span>
                <Receipt className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
                {fmt(analytics.sales.grossSales)}
              </div>
              <div className="text-[11px] text-slate-500 mt-2 truncate">
                Discounts: -{fmt(analytics.sales.discountAmount)}
              </div>
            </div>

            {/* 2. Net Sales */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Net Sales</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
                {fmt(analytics.sales.netSales)}
              </div>
              <div className="text-[11px] text-emerald-400/90 font-mono mt-2 flex items-center gap-1">
                <span>{analytics.sales.orderCount} completed sales</span>
              </div>
            </div>

            {/* 3. Food Cost / COGS */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Food Cost (COGS)</span>
                <Tag className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-300 tabular-nums">
                {fmt(analytics.costs.foodCost)}
              </div>
              <div className="text-[11px] text-amber-400/90 font-mono mt-2">
                Food Cost: {formatPercentage(analytics.costs.foodCostPercentage)}
              </div>
            </div>

            {/* 4. Gross Profit */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Gross Profit</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-400 tabular-nums">
                {fmt(analytics.profit.grossProfit)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-2">
                Gross Margin: {formatPercentage(analytics.profit.grossMarginPercentage)}
              </div>
            </div>

            {/* 5. Operating Expenses */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Op. Expenses</span>
                <Wallet className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-rose-300 tabular-nums">
                {fmt(analytics.costs.operatingExpenses)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-2 truncate">
                Rent, payroll, utilities
              </div>
            </div>

            {/* 6. Estimated Net Profit */}
            <div
              className={`p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden border ${
                analytics.profit.estimatedNetProfit >= 0
                  ? 'bg-emerald-950/30 border-emerald-800/70 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-800/70 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs opacity-80 mb-1">
                <span>Net Profit / Loss</span>
                {analytics.profit.estimatedNetProfit >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <div
                className={`text-xl sm:text-2xl font-bold font-mono tracking-tight tabular-nums ${
                  analytics.profit.estimatedNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {fmt(analytics.profit.estimatedNetProfit)}
              </div>
              <div className="text-[11px] font-mono mt-2 font-semibold">
                Net Margin: {formatPercentage(analytics.profit.netMarginPercentage)}
              </div>
            </div>
          </div>

          {/* Secondary Ribbon: Financial Balance & Collections */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">Average Order Value (AOV)</span>
              <span className="font-bold text-white font-mono text-sm tabular-nums">
                {fmt(analytics.sales.averageOrderValue)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Tax (GST) Collected</span>
              <span className="font-bold text-slate-300 font-mono text-sm tabular-nums">
                {fmt(analytics.sales.taxAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Paid Collected Revenue</span>
              <span className="font-bold text-emerald-400 font-mono text-sm tabular-nums">
                {fmt(analytics.payments.paidAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Pending / Unpaid Orders</span>
              <span
                className={`font-bold font-mono text-sm tabular-nums ${
                  analytics.payments.unpaidAmount > 0 ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                {fmt(analytics.payments.unpaidAmount)}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-4 lg:col-span-1 border-t lg:border-t-0 lg:border-l border-slate-800 pt-2 lg:pt-0 lg:pl-3">
              <span className="text-slate-500 block mb-0.5">Payment Method Split</span>
              <span className="text-slate-300 font-mono text-[11px]">
                Online {fmt(analytics.payments.online)} · UPI {fmt(analytics.payments.upiQr)}
              </span>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            {[
              { id: 'overview', label: 'Visual Overview & Trends' },
              { id: 'products', label: 'Item & Category Performance' },
              { id: 'breakdown', label: 'Cost & Operational Breakdowns' },
              { id: 'statement', label: 'Formal Financial Statement' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveViewTab(t.id as any)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeViewTab === t.id
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Visual Overview & Trends */}
          {activeViewTab === 'overview' && (
            <div className="space-y-6">
              {/* Daily Sales & Gross Profit Chart */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Daily Sales & Gross Profit Trend</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Net Sales vs Gross Profit across active trading days
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                      Net Sales
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                      Gross Profit
                    </span>
                  </div>
                </div>

                {analytics.salesTrend.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No completed sales for this period.
                  </div>
                ) : (
                  <div className="h-64 flex items-end gap-1 sm:gap-2 pt-6 pb-2 px-2 overflow-x-auto">
                    {(() => {
                      const maxSale = Math.max(...analytics.salesTrend.map((t) => t.sales), 100);
                      return analytics.salesTrend.map((point) => {
                        const salesHeightPct = Math.max(8, (point.sales / maxSale) * 100);
                        const profitHeightPct = Math.max(4, (point.grossProfit / maxSale) * 100);

                        return (
                          <div
                            key={point.date}
                            className="flex-1 min-w-[28px] max-w-[48px] h-full flex flex-col justify-end items-center group relative cursor-pointer"
                          >
                            {/* Hover tooltip */}
                            <div className="absolute -top-14 bg-slate-900 border border-slate-700 text-white text-[10px] p-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                              <p className="font-bold text-slate-200">{point.label} ({point.orders} orders)</p>
                              <p className="text-emerald-400">Sales: {fmt(point.sales)}</p>
                              <p className="text-blue-400">Profit: {fmt(point.grossProfit)}</p>
                              <p className="text-amber-400">Food Cost: {fmt(point.foodCost)}</p>
                            </div>

                            <div className="w-full flex items-end justify-center gap-0.5 h-full">
                              {/* Sales Bar */}
                              <div
                                style={{ height: `${salesHeightPct}%` }}
                                className="w-2.5 sm:w-3.5 bg-emerald-500/80 rounded-t-sm group-hover:bg-emerald-400 transition-colors"
                              />
                              {/* Profit Bar */}
                              <div
                                style={{ height: `${profitHeightPct}%` }}
                                className="w-2.5 sm:w-3.5 bg-blue-500/80 rounded-t-sm group-hover:bg-blue-400 transition-colors"
                              />
                            </div>
                            <span className="text-[9px] text-slate-400 mt-2 truncate w-full text-center font-mono">
                              {point.label.split(' ')[1] || point.label}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

              {/* Grid of Peak Hours & Peak Days */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Peak Trading Hours */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <span>Peak Trading Hours (Local IST)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Order distribution throughout the day</p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4 max-h-72 overflow-y-auto pr-1">
                    {analytics.peakHours
                      .filter((h) => h.orders > 0 || [12, 13, 14, 19, 20, 21].includes(h.hour))
                      .map((hour) => {
                        const maxHourOrders = Math.max(...analytics.peakHours.map((h) => h.orders), 1);
                        const pct = (hour.orders / maxHourOrders) * 100;
                        return (
                          <div key={hour.hour} className="flex items-center gap-3 text-xs">
                            <span className="w-16 text-slate-400 font-mono text-[11px]">{hour.label}</span>
                            <div className="flex-1 bg-slate-900 rounded-full h-3 overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              />
                            </div>
                            <span className="w-20 text-right font-mono font-medium text-white tabular-nums">
                              {hour.orders} orders
                            </span>
                            <span className="w-20 text-right font-mono text-slate-400 tabular-nums">
                              {fmt(hour.sales)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Peak Days of Week */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span>Day of Week Trading Volume</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Revenue & customer volume by weekday</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 mt-4">
                    {analytics.peakDays.map((day) => {
                      const maxDaySales = Math.max(...analytics.peakDays.map((d) => d.sales), 1);
                      const pct = (day.sales / maxDaySales) * 100;
                      return (
                        <div key={day.dayOfWeek} className="flex items-center gap-3 text-xs">
                          <span className="w-20 text-slate-300 font-medium">{day.dayName}</span>
                          <div className="flex-1 bg-slate-900 rounded-full h-3 overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className="bg-blue-500 h-full rounded-full transition-all duration-300"
                            />
                          </div>
                          <span className="w-16 text-right font-mono text-slate-400 tabular-nums">
                            {day.orders} ord
                          </span>
                          <span className="w-24 text-right font-mono font-semibold text-white tabular-nums">
                            {fmt(day.sales)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Item & Category Performance */}
          {activeViewTab === 'products' && (
            <div className="space-y-6">
              {/* Veg vs Non-Veg Split */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold mb-2">
                    <Leaf className="w-4 h-4" />
                    <span>Vegetarian Items Contribution</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs mt-3">
                    <div>
                      <span className="text-slate-500 block">Total Qty Sold</span>
                      <span className="text-lg font-bold text-white font-mono tabular-nums">
                        {analytics.vegNonVeg.veg.quantity} units
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Total Revenue</span>
                      <span className="text-lg font-bold text-emerald-400 font-mono tabular-nums">
                        {fmt(analytics.vegNonVeg.veg.sales)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Food Cost (COGS)</span>
                      <span className="text-sm font-semibold text-amber-300 font-mono tabular-nums">
                        {fmt(analytics.vegNonVeg.veg.foodCost)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Gross Profit</span>
                      <span className="text-sm font-semibold text-white font-mono tabular-nums">
                        {fmt(analytics.vegNonVeg.veg.grossProfit)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-2 text-orange-400 text-sm font-bold mb-2">
                    <Flame className="w-4 h-4" />
                    <span>Non-Vegetarian / Prime Items</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs mt-3">
                    <div>
                      <span className="text-slate-500 block">Total Qty Sold</span>
                      <span className="text-lg font-bold text-white font-mono tabular-nums">
                        {analytics.vegNonVeg.nonVeg.quantity} units
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Total Revenue</span>
                      <span className="text-lg font-bold text-orange-400 font-mono tabular-nums">
                        {fmt(analytics.vegNonVeg.nonVeg.sales)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Food Cost (COGS)</span>
                      <span className="text-sm font-semibold text-amber-300 font-mono tabular-nums">
                        {fmt(analytics.vegNonVeg.nonVeg.foodCost)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Gross Profit</span>
                      <span className="text-sm font-semibold text-white font-mono tabular-nums">
                        {fmt(analytics.vegNonVeg.nonVeg.grossProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Best Sellers vs Low Performers Table */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Best Sellers */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span>Best Selling Menu Items</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Ranked authoritatively by total units sold</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2">Item Name</th>
                          <th className="py-2 text-right">Sold</th>
                          <th className="py-2 text-right">Revenue</th>
                          <th className="py-2 text-right">Margin %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 font-mono">
                        {analytics.productPerformance.bestSellers.map((item, idx) => (
                          <tr key={item.menuItemId} className="hover:bg-slate-900/50">
                            <td className="py-2.5 font-sans flex items-center gap-1.5">
                              <span className="text-slate-500 text-[10px] w-3">{idx + 1}.</span>
                              <span className={item.isVeg ? 'text-emerald-300' : 'text-orange-300'}>
                                {item.name}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-bold text-white tabular-nums">
                              {item.quantitySold}
                            </td>
                            <td className="py-2.5 text-right text-emerald-400 tabular-nums">
                              {fmt(item.sales)}
                            </td>
                            <td className="py-2.5 text-right text-slate-300 tabular-nums">
                              {formatPercentage(item.marginPercentage)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Low Performers */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-amber-400" />
                        <span>Low-Performing Items</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Lowest volume sold during the selected period</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2">Item Name</th>
                          <th className="py-2 text-right">Sold</th>
                          <th className="py-2 text-right">Revenue</th>
                          <th className="py-2 text-right">Margin %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 font-mono">
                        {analytics.productPerformance.lowPerformers.map((item, idx) => (
                          <tr key={item.menuItemId} className="hover:bg-slate-900/50">
                            <td className="py-2.5 font-sans flex items-center gap-1.5">
                              <span className="text-slate-500 text-[10px] w-3">{idx + 1}.</span>
                              <span className="text-slate-300">{item.name}</span>
                            </td>
                            <td className="py-2.5 text-right font-bold text-slate-400 tabular-nums">
                              {item.quantitySold}
                            </td>
                            <td className="py-2.5 text-right text-slate-300 tabular-nums">
                              {fmt(item.sales)}
                            </td>
                            <td className="py-2.5 text-right text-slate-400 tabular-nums">
                              {formatPercentage(item.marginPercentage)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Category Performance Breakdown */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                <h3 className="text-sm font-bold text-white mb-3">Category Financial Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] uppercase text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5">Category</th>
                        <th className="py-2.5 text-right">Units Sold</th>
                        <th className="py-2.5 text-right">Gross Sales</th>
                        <th className="py-2.5 text-right">Food Cost (COGS)</th>
                        <th className="py-2.5 text-right">Gross Profit</th>
                        <th className="py-2.5 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 font-mono">
                      {analytics.categoryPerformance.map((cat) => (
                        <tr key={cat.categoryId} className="hover:bg-slate-900/40">
                          <td className="py-3 font-sans font-medium text-white">{cat.name}</td>
                          <td className="py-3 text-right text-slate-300 tabular-nums">{cat.quantitySold}</td>
                          <td className="py-3 text-right text-emerald-400 tabular-nums">{fmt(cat.sales)}</td>
                          <td className="py-3 text-right text-amber-300 tabular-nums">{fmt(cat.foodCost)}</td>
                          <td className="py-3 text-right text-white font-bold tabular-nums">
                            {fmt(cat.grossContribution)}
                          </td>
                          <td className="py-3 text-right text-slate-300 tabular-nums">
                            {formatPercentage(cat.marginPercentage)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Cost & Operational Breakdowns */}
          {activeViewTab === 'breakdown' && (
            <div className="space-y-6">
              {/* Operating Expenses Breakdown by Category */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-rose-400" />
                      <span>Operating Expenses Breakdown by Category</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Total operating overhead recorded for this period: {fmt(analytics.costs.operatingExpenses)}
                    </p>
                  </div>
                </div>

                {analytics.expenseBreakdown.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No operating expenses recorded for this period.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analytics.expenseBreakdown.map((exp) => (
                      <div key={exp.category} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between font-medium">
                          <span className="text-white flex items-center gap-2">
                            <span>{exp.categoryLabel}</span>
                            <span className="text-[10px] font-mono text-slate-500">({exp.count} vouchers)</span>
                          </span>
                          <span className="font-mono text-rose-300 tabular-nums">
                            {fmt(exp.amount)} · {formatPercentage(exp.percentage)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${exp.percentage}%` }}
                            className="bg-rose-500 h-full rounded-full transition-all duration-300"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Formal Financial Statement / P&L Audit Ledger */}
          {activeViewTab === 'statement' && (
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-6 font-sans">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    <span>Profit & Loss Statement (Authoritative Ledger)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Restaurant: {restaurant.name} · Range: {analytics.period.startDate.slice(0, 10)} to{' '}
                    {analytics.period.endDate.slice(0, 10)}
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
                >
                  Print / Export PDF
                </button>
              </div>

              <div className="space-y-6 text-xs">
                {/* 1. REVENUE */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-2">
                    1. Revenue & Sales
                  </div>
                  <table className="w-full text-left divide-y divide-slate-900">
                    <tbody>
                      <tr className="py-2">
                        <td className="py-2 text-slate-300">Gross Sales (Authoritative Order Subtotal)</td>
                        <td className="py-2 text-right font-mono text-white tabular-nums">{fmt(analytics.sales.grossSales)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-400 pl-4">Less: Promotional Discounts</td>
                        <td className="py-2 text-right font-mono text-rose-400 tabular-nums">-{fmt(analytics.sales.discountAmount)}</td>
                      </tr>
                      <tr className="border-t border-slate-800 font-semibold bg-slate-900/30">
                        <td className="py-2.5 text-white">Net Sales</td>
                        <td className="py-2.5 text-right font-mono text-emerald-400 text-sm tabular-nums">
                          {fmt(analytics.sales.netSales)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. COST OF GOODS SOLD */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2">
                    2. Cost of Goods Sold (COGS)
                  </div>
                  <table className="w-full text-left divide-y divide-slate-900">
                    <tbody>
                      <tr>
                        <td className="py-2 text-slate-300">Food Cost (Historical OrderItem cost snapshots)</td>
                        <td className="py-2 text-right font-mono text-amber-300 tabular-nums">{fmt(analytics.costs.foodCost)}</td>
                      </tr>
                      <tr className="border-t border-slate-800 font-semibold bg-slate-900/30">
                        <td className="py-2.5 text-white">Gross Profit</td>
                        <td className="py-2.5 text-right font-mono text-emerald-400 text-sm tabular-nums">
                          {fmt(analytics.profit.grossProfit)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3. OPERATING EXPENSES */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400 mb-2">
                    3. Operating Expenses
                  </div>
                  <table className="w-full text-left divide-y divide-slate-900">
                    <tbody>
                      {analytics.expenseBreakdown.map((exp) => (
                        <tr key={exp.category}>
                          <td className="py-1.5 text-slate-400 pl-4">{exp.categoryLabel}</td>
                          <td className="py-1.5 text-right font-mono text-slate-300 tabular-nums">{fmt(exp.amount)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-slate-800 font-semibold bg-slate-900/30">
                        <td className="py-2.5 text-white">Total Operating Expenses</td>
                        <td className="py-2.5 text-right font-mono text-rose-400 text-sm tabular-nums">
                          {fmt(analytics.costs.operatingExpenses)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 4. NET PROFIT */}
                <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl">
                  <div className="flex items-center justify-between font-bold text-sm">
                    <span className="text-white">Estimated Net Operating Profit / Loss</span>
                    <span
                      className={`font-mono text-base tabular-nums ${
                        analytics.profit.estimatedNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {fmt(analytics.profit.estimatedNetProfit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono mt-1">
                    <span>Net Margin Rate: {formatPercentage(analytics.profit.netMarginPercentage)}</span>
                    <span>Food Cost Rate: {formatPercentage(analytics.costs.foodCostPercentage)}</span>
                  </div>
                </div>

                {/* 5. SEPARATE STATUTORY TAX & CASH SETTLEMENTS */}
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>Tax (GST) Collected (Statutory Liability):</span>
                    <span className="text-white font-bold">{fmt(analytics.sales.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Authoritative Paid Collections (Online Gateway, UPI, Cash, POS):</span>
                    <span className="text-emerald-400 font-bold">{fmt(analytics.payments.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Receivables / Unsettled Orders:</span>
                    <span className="text-amber-400 font-bold">{fmt(analytics.payments.unpaidAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
