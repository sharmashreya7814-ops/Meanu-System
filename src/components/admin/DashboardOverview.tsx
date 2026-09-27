import React from 'react';
import {
  ShoppingBag,
  Clock,
  DollarSign,
  Users,
  UtensilsCrossed,
  Layers,
  ArrowUpRight,
  ChefHat,
  CheckCircle2,
} from 'lucide-react';
import { Order, Restaurant, Table } from '../../types/index.js';

interface DashboardOverviewProps {
  restaurant: Restaurant;
  metrics: {
    totalOrders: number;
    activeOrdersCount: number;
    pendingKitchenCount: number;
    totalTables: number;
    occupiedTablesCount: number;
    totalRevenue: number;
    totalMenuItems: number;
    totalCategories: number;
  };
  recentOrders: Order[];
  onNavigateToOrders: () => void;
  onNavigateToTables: () => void;
  onUpdateOrderStatus: (orderId: string, status: any) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  restaurant,
  metrics,
  recentOrders,
  onNavigateToOrders,
  onNavigateToTables,
  onUpdateOrderStatus,
}) => {
  const statCards = [
    {
      title: 'Active Orders',
      value: metrics.activeOrdersCount,
      subtext: `${metrics.pendingKitchenCount} in kitchen preparation`,
      icon: ChefHat,
      color: 'text-amber-400',
      bg: 'bg-amber-950/30 border-amber-800/40',
    },
    {
      title: 'Table Occupancy',
      value: `${metrics.occupiedTablesCount} / ${metrics.totalTables}`,
      subtext: `${Math.round((metrics.occupiedTablesCount / (metrics.totalTables || 1)) * 100)}% active seating`,
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/30 border-emerald-800/40',
    },
    {
      title: 'Gross Revenue',
      value: `$${metrics.totalRevenue.toFixed(2)}`,
      subtext: `${metrics.totalOrders} total completed orders`,
      icon: DollarSign,
      color: 'text-blue-400',
      bg: 'bg-blue-950/30 border-blue-800/40',
    },
    {
      title: 'Catalog Size',
      value: metrics.totalMenuItems,
      subtext: `Across ${metrics.totalCategories} active categories`,
      icon: UtensilsCrossed,
      color: 'text-purple-400',
      bg: 'bg-purple-950/30 border-purple-800/40',
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
            Operational Dashboard
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {restaurant.name} Operations Hub
          </h1>
          <p className="text-xs text-slate-400">
            Real-time table orders, kitchen ticket pipeline & live revenue tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToOrders}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ChefHat className="w-4 h-4" />
            <span>Open Kitchen Display</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border backdrop-blur-xs transition-all ${stat.bg}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">{stat.title}</span>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold font-mono text-white tabular-nums mb-1">
                {stat.value}
              </div>
              <div className="text-[11px] text-slate-400">{stat.subtext}</div>
            </div>
          );
        })}
      </div>

      {/* Live Kitchen Feed & Table Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table / Feed */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Live Kitchen Order Stream</h2>
              <span className="text-[11px] text-slate-400">Real-time table requests</span>
            </div>
            <button
              onClick={onNavigateToOrders}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              View All Orders <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No orders placed yet. Customers can scan table QR codes to start ordering.
              </div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-xs text-white">
                        #{order.orderNumber}
                      </span>
                      <span className="text-slate-500 text-xs">·</span>
                      <span className="text-xs font-semibold text-emerald-400">
                        Table {order.table?.tableNumber || 'Assigned'}
                      </span>
                      <span className="text-slate-500 text-xs">·</span>
                      <span className="text-xs text-slate-300">
                        {order.customer?.name || 'Guest'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                        order.status === 'NEW'
                          ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                          : order.status === 'PREPARING'
                          ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                          : order.status === 'READY'
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {order.status}
                    </span>

                    {order.status === 'NEW' && (
                      <button
                        onClick={() => onUpdateOrderStatus(order.id, 'ACCEPTED')}
                        className="px-2.5 py-1 text-[11px] font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Accept
                      </button>
                    )}
                    {order.status === 'ACCEPTED' && (
                      <button
                        onClick={() => onUpdateOrderStatus(order.id, 'PREPARING')}
                        className="px-2.5 py-1 text-[11px] font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Start Cooking
                      </button>
                    )}
                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => onUpdateOrderStatus(order.id, 'READY')}
                        className="px-2.5 py-1 text-[11px] font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Mark Ready
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Architecture Info & QR Launcher */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white mb-1">System Architecture</h2>
            <p className="text-xs text-slate-400">
              PostgreSQL multi-tenant schema with isolated restaurant namespaces
            </p>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Active Tenant</span>
              <span className="font-semibold text-slate-200">{restaurant.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Theme</span>
              <span className="font-mono text-emerald-400">{restaurant.themePreset}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Security Model</span>
              <span className="text-slate-300">Server-Side Verified Prices</span>
            </div>
          </div>

          <button
            onClick={onNavigateToTables}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Manage & Print Table QR Codes</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
