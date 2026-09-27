import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Search,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  Clock,
  Edit2,
  Lock,
  UserCheck,
  UserX,
  ChefHat,
  CreditCard,
  DollarSign,
  Boxes,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  CreateStaffDTO,
  Restaurant,
  StaffPermission,
  StaffRole,
  StaffUser,
  UpdateStaffDTO,
} from '../../types/index.js';
import { api } from '../../services/api.js';
import { ROLE_LABELS, ROLE_PERMISSIONS, hasPermission } from '../../utils/rbac.js';

interface StaffManagementViewProps {
  restaurant: Restaurant;
  currentUser?: {
    id: string;
    name: string;
    role: StaffRole;
  } | null;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  restaurant,
  currentUser,
}) => {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);

  // Notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add form state
  const [formData, setFormData] = useState<CreateStaffDTO>({
    restaurantId: restaurant.id,
    name: '',
    email: '',
    mobileNumber: '',
    password: '',
    role: 'WAITER',
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState<UpdateStaffDTO>({
    name: '',
    email: '',
    mobileNumber: '',
    role: 'WAITER',
    isActive: true,
  });

  // Password reset state
  const [newPassword, setNewPassword] = useState('');

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminStaff(restaurant.id);
      setStaffList(data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load staff list' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [restaurant.id]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // Filtered staff
  const filteredStaff = staffList.filter((staff) => {
    if (roleFilter !== 'ALL' && staff.role !== roleFilter) return false;
    if (statusFilter === 'ACTIVE' && !staff.isActive) return false;
    if (statusFilter === 'INACTIVE' && staff.isActive) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        staff.name.toLowerCase().includes(q) ||
        staff.email.toLowerCase().includes(q) ||
        staff.mobileNumber.toLowerCase().includes(q) ||
        staff.role.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Role counts
  const countByRole = staffList.reduce(
    (acc, s) => {
      acc[s.role] = (acc[s.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const activeCount = staffList.filter((s) => s.isActive).length;

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.email || !formData.password) {
        showNotification('error', 'Please fill in all required fields.');
        return;
      }
      await api.createAdminStaff({
        ...formData,
        restaurantId: restaurant.id,
      });
      showNotification('success', `Staff member "${formData.name}" added successfully.`);
      setShowAddModal(false);
      setFormData({
        restaurantId: restaurant.id,
        name: '',
        email: '',
        mobileNumber: '',
        password: '',
        role: 'WAITER',
      });
      loadStaff();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create staff member');
    }
  };

  const handleOpenEdit = (staff: StaffUser) => {
    setSelectedStaff(staff);
    setEditFormData({
      name: staff.name,
      email: staff.email,
      mobileNumber: staff.mobileNumber,
      role: staff.role,
      isActive: staff.isActive,
    });
    setShowEditModal(true);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    try {
      await api.updateAdminStaff(selectedStaff.id, editFormData, restaurant.id);
      showNotification('success', `Staff member "${editFormData.name}" updated successfully.`);
      setShowEditModal(false);
      setSelectedStaff(null);
      loadStaff();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update staff member');
    }
  };

  const handleToggleStatus = async (staff: StaffUser) => {
    try {
      const newStatus = !staff.isActive;
      await api.updateAdminStaff(staff.id, { isActive: newStatus }, restaurant.id);
      showNotification(
        'success',
        `Staff member "${staff.name}" is now ${newStatus ? 'ACTIVE' : 'DEACTIVATED'}.`,
      );
      loadStaff();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update status');
    }
  };

  const handleOpenPasswordModal = (staff: StaffUser) => {
    setSelectedStaff(staff);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    if (newPassword.length < 6) {
      showNotification('error', 'Password must be at least 6 characters long.');
      return;
    }
    try {
      await api.updateAdminStaffPassword(selectedStaff.id, { newPassword });
      showNotification('success', `Password updated for "${selectedStaff.name}".`);
      setShowPasswordModal(false);
      setSelectedStaff(null);
      setNewPassword('');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update password');
    }
  };

  const allRoles: StaffRole[] = ['OWNER', 'MANAGER', 'CASHIER', 'KITCHEN', 'WAITER'];

  const permissionCategories: Array<{
    category: string;
    icon: React.ComponentType<{ className?: string }>;
    permissions: Array<{ id: StaffPermission; name: string; desc: string }>;
  }> = [
    {
      category: 'Staff & Roles',
      icon: Shield,
      permissions: [
        { id: 'STAFF_MANAGE', name: 'Manage Staff', desc: 'Create, update, deactivate staff & assign roles' },
        { id: 'STAFF_VIEW', name: 'View Staff List', desc: 'View staff directory and contact profiles' },
        { id: 'RESTAURANT_MANAGE', name: 'Restaurant Settings', desc: 'Branding, themes, and configuration' },
      ],
    },
    {
      category: 'Orders & KDS',
      icon: ChefHat,
      permissions: [
        { id: 'ORDER_VIEW', name: 'View Orders', desc: 'Browse live order tickets and history' },
        { id: 'ORDER_MANAGE', name: 'Manage Orders', desc: 'Accept, cancel, or modify table orders' },
        { id: 'KDS_VIEW', name: 'KDS Kitchen View', desc: 'Real-time kitchen order preparation board' },
        { id: 'KDS_UPDATE', name: 'Update Cooking Status', desc: 'Mark food items PREPARING, READY, SERVED' },
      ],
    },
    {
      category: 'Billing & Payments',
      icon: CreditCard,
      permissions: [
        { id: 'BILLING_VIEW', name: 'View Bills', desc: 'View digital bills, GST invoices, and totals' },
        { id: 'BILLING_MANAGE', name: 'Generate & Settle Bills', desc: 'Create bills and mark cash/UPI settlements' },
        { id: 'PAYMENT_VIEW', name: 'Payment Transactions', desc: 'View online & UPI QR payment attempts' },
        { id: 'PAYMENT_VERIFY', name: 'Verify Payments', desc: 'Confirm manual UPI QR reference IDs' },
      ],
    },
    {
      category: 'Financials & Reports',
      icon: DollarSign,
      permissions: [
        { id: 'FINANCIAL_VIEW', name: 'Financial Analytics & BI', desc: 'Gross margin, food cost, profit & loss' },
        { id: 'EXPENSE_MANAGE', name: 'Expense Tracking', desc: 'Add, edit, and categorize operating expenses' },
        { id: 'REPORT_VIEW', name: 'Executive Reports', desc: 'Monthly business intelligence and KPI digests' },
      ],
    },
    {
      category: 'Inventory & Menu',
      icon: Boxes,
      permissions: [
        { id: 'INVENTORY_VIEW', name: 'Stock & Wastage View', desc: 'View current ingredient levels and alerts' },
        { id: 'INVENTORY_MANAGE', name: 'Stock Movements & Purchases', desc: 'Purchase orders, counts, adjustments' },
        { id: 'RECIPE_MANAGE', name: 'Recipe Engineering', desc: 'Standard recipes, yields, and portion costs' },
        { id: 'MENU_MANAGE', name: 'Menu & Category Editing', desc: 'Add dishes, update prices, manage catalog' },
      ],
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              Staff Management & Role Access Control
            </h1>
            <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Module 9A
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Control restaurant access levels for owners, managers, cashiers, chefs, and waiters for{' '}
            <span className="text-slate-200 font-semibold">{restaurant.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMatrix(!showMatrix)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>{showMatrix ? 'Hide Role Matrix' : 'Role Permissions Matrix'}</span>
            {showMatrix ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-200 ml-2"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Collapsible Permission Matrix */}
      {showMatrix && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                Restaurant Role-Based Access Control (RBAC) Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Backend-enforced permission rules governing staff capabilities.
              </p>
            </div>
            <span className="text-[10px] uppercase font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
              Strict Enforcement
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Permission Area</th>
                  {allRoles.map((r) => (
                    <th key={r} className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${ROLE_LABELS[r].badgeColor}`}>
                        {r}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {permissionCategories.map((cat) => (
                  <React.Fragment key={cat.category}>
                    <tr className="bg-slate-900/80">
                      <td colSpan={6} className="py-1.5 px-3 font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
                        {cat.category}
                      </td>
                    </tr>
                    {cat.permissions.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-2 px-3">
                          <div className="font-medium text-slate-200">{p.name}</div>
                          <div className="text-[10px] text-slate-500">{p.desc}</div>
                        </td>
                        {allRoles.map((role) => {
                          const allowed = hasPermission(role, p.id);
                          return (
                            <td key={role} className="py-2 px-3 text-center">
                              {allowed ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                                  ✓
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-slate-600 text-xs">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
          <div className="text-[10px] uppercase font-bold text-slate-500">Total Staff</div>
          <div className="text-xl font-extrabold text-white mt-1">{staffList.length}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">{activeCount} active</div>
        </div>

        {allRoles.map((role) => (
          <div
            key={role}
            onClick={() => setRoleFilter(roleFilter === role ? 'ALL' : role)}
            className={`bg-slate-950 border rounded-xl p-3 cursor-pointer transition ${
              roleFilter === role ? 'border-emerald-500 bg-slate-900' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">{role}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded border ${ROLE_LABELS[role].badgeColor}`}>
                {ROLE_LABELS[role].title.split(' ')[0]}
              </span>
            </div>
            <div className="text-xl font-extrabold text-white mt-1">
              {countByRole[role] || 0}
            </div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">
              {ROLE_LABELS[role].title}
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, mobile, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Roles ({staffList.length})</option>
            <option value="OWNER">Owner ({countByRole['OWNER'] || 0})</option>
            <option value="MANAGER">Manager ({countByRole['MANAGER'] || 0})</option>
            <option value="CASHIER">Cashier ({countByRole['CASHIER'] || 0})</option>
            <option value="KITCHEN">Kitchen ({countByRole['KITCHEN'] || 0})</option>
            <option value="WAITER">Waiter ({countByRole['WAITER'] || 0})</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="INACTIVE">Deactivated</option>
          </select>

          {(roleFilter !== 'ALL' || searchQuery || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setRoleFilter('ALL');
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading staff accounts...</div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-400">No staff members found</div>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              No staff members matched your current filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role & Permissions</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStaff.map((staff) => {
                  const roleMeta = ROLE_LABELS[staff.role];
                  const initials = staff.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr
                      key={staff.id}
                      className={`hover:bg-slate-900/40 transition ${!staff.isActive ? 'opacity-60 bg-slate-950/40' : ''}`}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${roleMeta.badgeColor}`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                              <span>{staff.name}</span>
                              {currentUser?.id === staff.id && (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">ID: {staff.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge & Scope */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleMeta.badgeColor}`}
                        >
                          <Shield className="w-3 h-3" />
                          {staff.role}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {roleMeta.title}
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="font-mono text-[11px]">{staff.email}</span>
                        </div>
                        {staff.mobileNumber && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{staff.mobileNumber}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {staff.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            DEACTIVATED
                          </span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 text-slate-400">
                        {staff.lastLoginAt ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{new Date(staff.lastLoginAt).toLocaleDateString()}</span>
                            <span className="text-slate-500">
                              {new Date(staff.lastLoginAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[11px]">Never logged in</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(staff)}
                            title="Edit Staff Member"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenPasswordModal(staff)}
                            title="Reset Password"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(staff)}
                            title={staff.isActive ? 'Deactivate Staff Account' : 'Activate Staff Account'}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              staff.isActive
                                ? 'bg-slate-800 hover:bg-rose-900/30 text-slate-400 hover:text-rose-300'
                                : 'bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-400'
                            }`}
                          >
                            {staff.isActive ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD STAFF MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                Add New Staff Member
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ramesh@verde.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Role & Access Level <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffRole })}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="WAITER">WAITER (Tables & Orders)</option>
                    <option value="KITCHEN">KITCHEN (Chef & KDS)</option>
                    <option value="CASHIER">CASHIER (Billing & Payments)</option>
                    <option value="MANAGER">MANAGER (Operations & Inventory)</option>
                    <option value="OWNER">OWNER (Full Restaurant Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">
                  Role: {ROLE_LABELS[formData.role].title}
                </div>
                <div>{ROLE_LABELS[formData.role].description}</div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL */}
      {showEditModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-400" />
                Edit Staff: {selectedStaff.name}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.mobileNumber}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, mobileNumber: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={editFormData.role}
                    disabled={currentUser?.id === selectedStaff.id}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, role: e.target.value as StaffRole })
                    }
                    className={`w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none ${
                      currentUser?.id === selectedStaff.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="WAITER">WAITER (Floor Staff)</option>
                    <option value="KITCHEN">KITCHEN (Chef & KDS)</option>
                    <option value="CASHIER">CASHIER (Billing & POS)</option>
                    <option value="MANAGER">MANAGER (Ops & Inventory)</option>
                    <option value="OWNER">OWNER (Full Admin)</option>
                  </select>
                  {currentUser?.id === selectedStaff.id && (
                    <span className="text-[10px] text-amber-400 mt-1 block">
                      You cannot change your own role.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Account Status
                  </label>
                  <select
                    value={editFormData.isActive ? 'ACTIVE' : 'INACTIVE'}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        isActive: e.target.value === 'ACTIVE',
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">DEACTIVATED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showPasswordModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                Reset Password: {selectedStaff.name}
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="text-[11px] text-slate-400">
                The password will be securely salted and hashed using PBKDF2/SHA-512 before storage.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
