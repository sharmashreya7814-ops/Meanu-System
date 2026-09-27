import { StaffPermission, StaffRole } from '../types/index.js';

export const ROLE_PERMISSIONS: Record<StaffRole, StaffPermission[]> = {
  OWNER: [
    'STAFF_VIEW',
    'STAFF_MANAGE',
    'ROLE_MANAGE',
    'RESTAURANT_MANAGE',
    'MENU_VIEW',
    'MENU_MANAGE',
    'CATEGORY_MANAGE',
    'TABLE_VIEW',
    'TABLE_MANAGE',
    'ORDER_VIEW',
    'ORDER_MANAGE',
    'BILLING_VIEW',
    'BILLING_MANAGE',
    'PAYMENT_VIEW',
    'PAYMENT_VERIFY',
    'EXPENSE_VIEW',
    'EXPENSE_MANAGE',
    'FINANCIAL_VIEW',
    'REPORT_VIEW',
    'INVENTORY_VIEW',
    'INVENTORY_MANAGE',
    'RECIPE_VIEW',
    'RECIPE_MANAGE',
    'KDS_VIEW',
    'KDS_UPDATE',
  ],
  MANAGER: [
    'STAFF_VIEW',
    'MENU_VIEW',
    'MENU_MANAGE',
    'CATEGORY_MANAGE',
    'TABLE_VIEW',
    'TABLE_MANAGE',
    'ORDER_VIEW',
    'ORDER_MANAGE',
    'BILLING_VIEW',
    'BILLING_MANAGE',
    'PAYMENT_VIEW',
    'PAYMENT_VERIFY',
    'EXPENSE_VIEW',
    'EXPENSE_MANAGE',
    'FINANCIAL_VIEW',
    'REPORT_VIEW',
    'INVENTORY_VIEW',
    'INVENTORY_MANAGE',
    'RECIPE_VIEW',
    'RECIPE_MANAGE',
    'KDS_VIEW',
    'KDS_UPDATE',
  ],
  CASHIER: [
    'TABLE_VIEW',
    'TABLE_MANAGE',
    'ORDER_VIEW',
    'ORDER_MANAGE',
    'BILLING_VIEW',
    'BILLING_MANAGE',
    'PAYMENT_VIEW',
    'PAYMENT_VERIFY',
    'MENU_VIEW',
  ],
  KITCHEN: [
    'ORDER_VIEW',
    'KDS_VIEW',
    'KDS_UPDATE',
  ],
  WAITER: [
    'TABLE_VIEW',
    'TABLE_MANAGE',
    'ORDER_VIEW',
    'ORDER_MANAGE',
    'KDS_VIEW',
    'MENU_VIEW',
  ],
};

export const ROLE_LABELS: Record<StaffRole, { title: string; badgeColor: string; description: string }> = {
  OWNER: {
    title: 'Restaurant Owner',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Full administrative access to staff, roles, settings, financials, menu, and inventory.',
  },
  MANAGER: {
    title: 'General Manager',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Operational lead for kitchen, dining room, billing, expenses, reports, and inventory.',
  },
  CASHIER: {
    title: 'Cashier & Billing',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    description: 'Point of sale, digital bills, payment verification, table status, and orders.',
  },
  KITCHEN: {
    title: 'Kitchen Staff / Chef',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    description: 'Kitchen display system (KDS), preparation times, and live order queue dispatch.',
  },
  WAITER: {
    title: 'Floor Staff / Waiter',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    description: 'Table status, customer seating, floor ordering assistance, and order tracking.',
  },
};

export function hasPermission(role: StaffRole | undefined, permission: StaffPermission): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}

export function hasAnyPermission(role: StaffRole | undefined, permissions: StaffPermission[]): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role] || [];
  return permissions.some((p) => perms.includes(p));
}

export function hasAllPermissions(role: StaffRole | undefined, permissions: StaffPermission[]): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role] || [];
  return permissions.every((p) => perms.includes(p));
}

export function getPermissionsForRole(role: StaffRole): StaffPermission[] {
  return ROLE_PERMISSIONS[role] || [];
}
