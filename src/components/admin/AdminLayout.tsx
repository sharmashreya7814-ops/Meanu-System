import React from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Layers,
  ChefHat,
  Users,
  CreditCard,
  TrendingUp,
  FileText,
  Settings,
  QrCode,
  Store,
} from 'lucide-react';
import { Restaurant } from '../../types/index.js';

export type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'tables'
  | 'menu'
  | 'categories'
  | 'customers'
  | 'billing'
  | 'payments'
  | 'analytics'
  | 'reports'
  | 'settings';

interface AdminLayoutProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  restaurant: Restaurant | null;
  restaurants: Restaurant[];
  onSelectRestaurant: (r: Restaurant) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onSelectTab,
  restaurant,
  restaurants,
  onSelectRestaurant,
  children,
}) => {
  const primaryNavItems: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Live Orders & Kitchen', icon: ChefHat },
    { id: 'tables', label: 'Tables & QR Codes', icon: QrCode },
    { id: 'menu', label: 'Menu Items', icon: UtensilsCrossed },
    { id: 'categories', label: 'Categories', icon: Layers },
  ];

  const futureNavItems: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }> = [
    { id: 'customers', label: 'Customers', icon: Users, badge: 'Phase 2' },
    { id: 'billing', label: 'Digital Billing', icon: FileText, badge: 'Phase 2' },
    { id: 'payments', label: 'Payments', icon: CreditCard, badge: 'Phase 2' },
    { id: 'analytics', label: 'Analytics & P&L', icon: TrendingUp, badge: 'Phase 2' },
    { id: 'reports', label: 'Reports', icon: FileText, badge: 'Phase 2' },
    { id: 'settings', label: 'Restaurant Settings', icon: Settings, badge: 'Phase 2' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar for Desktop */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Top Brand & Tenant Selector */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{restaurant?.logoUrl || '🍽️'}</span>
              <div>
                <h1 className="font-bold text-sm text-white tracking-tight">
                  {restaurant?.name || 'Restaurant Admin'}
                </h1>
                <span className="text-[11px] font-mono text-slate-400">
                  Tenant: {restaurant?.slug}
                </span>
              </div>
            </div>

            {/* Switch active restaurant tenant */}
            <div className="mt-2">
              <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                Multi-Tenant Switcher
              </label>
              <select
                value={restaurant?.id || ''}
                onChange={(e) => {
                  const target = restaurants.find((r) => r.id === e.target.value);
                  if (target) onSelectRestaurant(target);
                }}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.themePreset})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Navigation */}
          <nav className="p-3 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1 tracking-wider">
              Core Operations
            </div>
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Future Architecture Modules */}
            <div className="text-[10px] uppercase font-bold text-slate-500 px-3 pt-4 pb-1 tracking-wider">
              Planned Expansion
            </div>
            {futureNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-sm">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Prisma + PostgreSQL</span>
          <span className="font-mono text-emerald-400">v1.0 Ready</span>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 overflow-y-auto min-h-screen bg-slate-900">
        {children}
      </main>
    </div>
  );
};
