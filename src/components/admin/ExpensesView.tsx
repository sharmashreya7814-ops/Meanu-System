import React, { useEffect, useState } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  DollarSign,
  FileText,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Building,
} from 'lucide-react';
import { CreateExpenseDTO, Expense, ExpenseCategory, ExpensePaymentMethod, Restaurant, UpdateExpenseDTO } from '../../types/index.js';
import { api } from '../../services/api.js';
import { formatCurrency } from '../../utils/formatters.js';

interface ExpensesViewProps {
  restaurant: Restaurant;
}

const CATEGORIES: Array<{ id: ExpenseCategory; label: string }> = [
  { id: 'RENT', label: 'Rent & Lease' },
  { id: 'SALARY', label: 'Payroll & Salaries' },
  { id: 'ELECTRICITY', label: 'Electricity Power' },
  { id: 'GAS', label: 'Commercial Gas & Fuel' },
  { id: 'WATER', label: 'Water & Utilities' },
  { id: 'INTERNET', label: 'Internet & POS Telecom' },
  { id: 'PACKAGING', label: 'Takeaway Packaging' },
  { id: 'DELIVERY', label: 'Delivery & Logistics' },
  { id: 'MARKETING', label: 'Marketing & Ads' },
  { id: 'MAINTENANCE', label: 'Repairs & Maintenance' },
  { id: 'SUPPLIES', label: 'Kitchen & Cleaning Supplies' },
  { id: 'OTHER', label: 'Other Operational Expenses' },
];

const PAYMENT_METHODS: Array<{ id: ExpensePaymentMethod; label: string }> = [
  { id: 'BANK_TRANSFER', label: 'Bank Transfer / NEFT / RTGS' },
  { id: 'UPI', label: 'UPI Direct / QR' },
  { id: 'CASH', label: 'Petty Cash' },
  { id: 'CARD', label: 'Credit / Debit Card' },
  { id: 'OTHER', label: 'Other Method' },
];

export const ExpensesView: React.FC<ExpensesViewProps> = ({ restaurant }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>('2026-09-30');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<{
    category: ExpenseCategory;
    description: string;
    amount: string;
    expenseDate: string;
    paymentMethod: ExpensePaymentMethod;
    notes: string;
  }>({
    category: 'SUPPLIES',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'CASH',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminExpenses(
        restaurant.id,
        startDate || undefined,
        endDate || undefined,
        selectedCategory !== 'ALL' ? (selectedCategory as ExpenseCategory) : undefined,
      );
      setExpenses(data);
    } catch (err: any) {
      console.error('Failed to load expenses:', err);
      setError(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [restaurant.id, selectedCategory, startDate, endDate]);

  const handleOpenCreateModal = () => {
    setEditingExpense(null);
    setFormData({
      category: 'SUPPLIES',
      description: '',
      amount: '',
      expenseDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'CASH',
      notes: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setFormData({
      category: exp.category,
      description: exp.description,
      amount: exp.amount.toString(),
      expenseDate: exp.expenseDate.slice(0, 10),
      paymentMethod: exp.paymentMethod,
      notes: exp.notes || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Amount must be a positive number greater than 0');
      return;
    }

    if (!formData.description.trim()) {
      setFormError('Description is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingExpense) {
        const updateDTO: UpdateExpenseDTO = {
          category: formData.category,
          description: formData.description.trim(),
          amount: numAmount,
          expenseDate: new Date(formData.expenseDate).toISOString(),
          paymentMethod: formData.paymentMethod,
          notes: formData.notes.trim() || undefined,
        };
        await api.updateAdminExpense(editingExpense.id, restaurant.id, updateDTO);
      } else {
        const createDTO: CreateExpenseDTO = {
          restaurantId: restaurant.id,
          category: formData.category,
          description: formData.description.trim(),
          amount: numAmount,
          expenseDate: new Date(formData.expenseDate).toISOString(),
          paymentMethod: formData.paymentMethod,
          notes: formData.notes.trim() || undefined,
        };
        await api.createAdminExpense(createDTO);
      }
      setIsModalOpen(false);
      fetchExpenses();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, desc: string) => {
    if (!window.confirm(`Are you sure you want to delete expense "${desc}"?`)) return;
    try {
      await api.deleteAdminExpense(id, restaurant.id);
      fetchExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = e.description.toLowerCase().includes(q);
      const matchNotes = e.notes?.toLowerCase().includes(q);
      const matchCat = e.category.toLowerCase().includes(q);
      if (!matchDesc && !matchNotes && !matchCat) return false;
    }
    return true;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Tenant: {restaurant.name}</span>
            <span aria-hidden="true">·</span>
            <span>Operating Overhead</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-rose-400" />
            <span>Operating Expense Management</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchExpenses}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
            title="Refresh Expenses"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Total Operating Expenses (In View)</span>
          <span className="text-2xl font-bold text-rose-400 font-mono tracking-tight tabular-nums">
            {formatCurrency(totalExpenseAmount, restaurant.currency, restaurant.currencySymbol)}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">{filteredExpenses.length} expense vouchers</span>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Active Date Filter</span>
          <span className="text-sm font-semibold text-white font-mono block truncate">
            {startDate} to {endDate}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">Tenant isolation active</span>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Accounting Rule</span>
          <span className="text-xs text-slate-300 block">
            Operating expenses are deducted from Gross Profit to calculate Net Profit.
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search description, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-white placeholder-slate-500 focus:outline-none w-full text-xs"
          />
        </div>

        {/* Category & Date filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 focus:outline-none text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 focus:outline-none text-xs"
            />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading expenses...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No expenses found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/60 text-[11px] uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description & Notes</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredExpenses.map((exp) => {
                  const catObj = CATEGORIES.find((c) => c.id === exp.category);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">
                        {exp.expenseDate.slice(0, 10)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-white font-medium block">
                          {catObj?.label || exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs sm:max-w-md">
                        <span className="text-slate-200 font-medium block">{exp.description}</span>
                        {exp.notes && (
                          <span className="text-slate-400 text-[11px] block mt-0.5 truncate">
                            {exp.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {exp.paymentMethod.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-300 text-sm tabular-nums whitespace-nowrap">
                        {formatCurrency(exp.amount, restaurant.currency, restaurant.currencySymbol)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(exp)}
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                            title="Edit Expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(exp.id, exp.description)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 bg-slate-900 hover:bg-rose-950/60 rounded-lg cursor-pointer transition-colors"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>{editingExpense ? 'Edit Operating Expense' : 'Record Operating Expense'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Expense Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as ExpenseCategory })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Amount ({restaurant.currencySymbol || '₹'}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 15000.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly high-street commercial store lease"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethod: e.target.value as ExpensePaymentMethod,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Audit Notes / Reference (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Paid via RTGS #RTGS88291 to landlord"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  {submitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingExpense ? 'Update Expense' : 'Save Expense'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
