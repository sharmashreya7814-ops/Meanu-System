import React from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Layers,
  ChefHat,
  Users,
  CreditCard,
  TrendingUp,
  Settings,
  QrCode,
  DollarSign,
  Wallet,
  FileSpreadsheet,
  Boxes,
  Shield,
  ShieldCheck,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { CurrentUserResponse, Restaurant, StaffPermission, StaffRole, StaffUser } from '../../types/index.js';
import { ROLE_LABELS, hasAnyPermission } from '../../utils/rbac.js';

export type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'billing'
  | 'inventory'
  | 'bi'
  | 'analytics'
  | 'expenses'
  | 'reports'
  | 'tables'
  | 'menu'
  | 'categories'
  | 'staff'
  | 'customers'
  | 'payments'
  | 'settings';

interface AdminLayoutProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  restaurant: Restaurant | null;
  restaurants: Restaurant[];
  onSelectRestaurant: (r: Restaurant) => void;
  currentStaff: CurrentUserResponse | null;
  staffList?: StaffUser[];
  onSwitchStaff?: (staffId: string) => void;
  onLogout?: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onSelectTab,
  restaurant,
  restaurants,
  onSelectRestaurant,
  currentStaff,
  staffList = [],
  onSwitchStaff,
  onLogout,
  children,
}) => {
  const currentRole = currentStaff?.role || 'OWNER';

  // Navigation items with required permissions
  const allNavItems: Array<{
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    requiredPermissions: StaffPermission[];
    group: 'operations' | 'finance' | 'management';
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      requiredPermissions: ['ORDER_VIEW', 'FINANCIAL_VIEW', 'STAFF_VIEW', 'KDS_VIEW'],
      group: 'operations',
    },
    {
      id: 'orders',
      label: 'Live Orders & Kitchen',
      icon: ChefHat,
      requiredPermissions: ['ORDER_VIEW', 'KDS_VIEW'],
      group: 'operations',
    },
    {
      id: 'billing',
      label: 'Billing & Payments',
      icon: CreditCard,
      requiredPermissions: ['BILLING_VIEW', 'PAYMENT_VIEW'],
      group: 'operations',
    },
    {
      id: 'tables',
      label: 'Tables & QR Codes',
      icon: QrCode,
      requiredPermissions: ['TABLE_VIEW', 'TABLE_MANAGE'],
      group: 'operations',
    },
    {
      id: 'inventory',
      label: 'Inventory & Recipes',
      icon: Boxes,
      requiredPermissions: ['INVENTORY_VIEW', 'RECIPE_VIEW', 'INVENTORY_MANAGE'],
      group: 'finance',
    },
    {
      id: 'bi',
      label: 'Business Intelligence',
      icon: TrendingUp,
      requiredPermissions: ['FINANCIAL_VIEW'],
      group: 'finance',
    },
    {
      id: 'analytics',
      label: 'Financial Analytics & P&L',
      icon: DollarSign,
      requiredPermissions: ['FINANCIAL_VIEW'],
      group: 'finance',
    },
    {
      id: 'expenses',
      label: 'Operating Expenses',
      icon: Wallet,
      requiredPermissions: ['EXPENSE_VIEW', 'EXPENSE_MANAGE'],
      group: 'finance',
    },
    {
      id: 'reports',
      label: 'Formal Monthly Reports',
      icon: FileSpreadsheet,
      requiredPermissions: ['REPORT_VIEW'],
      group: 'finance',
    },
    {
      id: 'menu',
      label: 'Menu Items',
      icon: UtensilsCrossed,
      requiredPermissions: ['MENU_VIEW', 'MENU_MANAGE'],
      group: 'management',
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: Layers,
      requiredPermissions: ['CATEGORY_MANAGE', 'MENU_MANAGE'],
      group: 'management',
    },
    {
      id: 'staff',
      label: 'Staff & RBAC Roles',
      icon: Users,
      requiredPermissions: ['STAFF_VIEW', 'STAFF_MANAGE'],
      group: 'management',
    },
  ];

  // Filter nav items based on current role's permissions
  const visibleNavItems = allNavItems.filter((item) =>
    hasAnyPermission(currentRole, item.requiredPermissions),
  );

  const futureNavItems: Array<{
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    { id: 'customers', label: 'Customers', icon: Users, badge: 'Phase 2' },
    { id: 'settings', label: 'Restaurant Settings', icon: Settings, badge: 'Phase 2' },
  ];

  const roleMeta = ROLE_LABELS[currentRole];

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

          {/* Logged-in Staff Profile & Live Role Switcher */}
          <div className="p-3 bg-slate-900/60 border-b border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] border ${roleMeta.badgeColor}`}>
                  {currentStaff?.name ? currentStaff.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="text-xs font-bold text-white truncate max-w-[130px]">
                    {currentStaff?.name || 'Staff User'}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold border ${roleMeta.badgeColor}`}>
                      {currentRole}
                    </span>
                  </div>
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Staff / Role Switcher for Test & Demo */}
            {staffList.length > 0 && onSwitchStaff && (
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">
                  RBAC Role Switcher:
                </label>
                <select
                  value={currentStaff?.id || ''}
                  onChange={(e) => onSwitchStaff(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.role}: {s.name} {!s.isActive ? '(Inactive)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Active Navigation based on Permissions */}
          <nav className="p-3 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1 tracking-wider">
              Accessible Operations ({visibleNavItems.length})
            </div>
            {visibleNavItems.map((item) => {
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

            {/* Future Architecture Modules (Visible to Owner only) */}
            {currentRole === 'OWNER' && (
              <>
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
              </>
            )}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>RBAC Protected</span>
          </div>
          <span className="font-mono text-emerald-400 text-[10px]">Module 9A</span>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 overflow-y-auto min-h-screen bg-slate-900">
        {children}
      </main>
    </div>
  );
};
