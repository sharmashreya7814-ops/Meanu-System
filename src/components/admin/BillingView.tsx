import React, { useEffect, useState } from 'react';
import {
  Receipt,
  Search,
  RefreshCw,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Lock,
  QrCode,
  DollarSign,
  Check,
  X,
  Smartphone,
  Banknote,
} from 'lucide-react';
import { Bill, BillPaymentStatus, Payment, Restaurant } from '../../types/index.js';
import { api } from '../../services/api.js';

interface BillingViewProps {
  restaurant: Restaurant;
  onOpenCustomerBill?: (slug: string, billNumber: string) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  restaurant,
  onOpenCustomerBill,
}) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyingPaymentId, setVerifyingPaymentId] = useState<string | null>(null);
  const [settlingBill, setSettlingBill] = useState<Bill | null>(null);
  const [settlementMethod, setSettlementMethod] = useState<'UPI_QR' | 'CASH' | 'CARD'>('UPI_QR');
  const [settlementRef, setSettlementRef] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [billsData, paymentsData] = await Promise.all([
        api.getAdminBills(restaurant.id, statusFilter !== 'PENDING' ? statusFilter : undefined),
        api.getAdminPayments(restaurant.id),
      ]);
      setBills(billsData);
      setPayments(paymentsData);
    } catch (err) {
      console.error('Failed to load restaurant bills and payments', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [restaurant.id, statusFilter]);

  // Find all pending UPI payments awaiting staff confirmation
  const pendingUpiPayments = payments.filter(
    (p) => p.status === 'PENDING' && (p.provider === 'UPI_QR' || p.provider === 'UPI'),
  );

  const handleVerifyUpi = async (paymentId: string) => {
    setVerifyingPaymentId(paymentId);
    try {
      const res = await api.verifyPaymentAdmin(paymentId);
      setActionSuccess(`Payment verified! Bill #${res.data.bill.billNumber} marked as PAID.`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to verify UPI payment');
    } finally {
      setVerifyingPaymentId(null);
    }
  };

  const handleManualSettle = async () => {
    if (!settlingBill) return;
    try {
      const res = await api.settleBillAdmin(settlingBill.billNumber, {
        restaurantId: restaurant.id,
        method: settlementMethod,
        referenceId: settlementRef.trim() || undefined,
        notes: settlementNotes.trim() || undefined,
      });
      setActionSuccess(`Bill #${res.data.bill.billNumber} successfully settled via ${settlementMethod}!`);
      setTimeout(() => setActionSuccess(null), 4000);
      setSettlingBill(null);
      setSettlementRef('');
      setSettlementNotes('');
      loadData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to settle bill');
    }
  };

  // Match each bill with its latest payment attempt (if any)
  const billsWithPayments = bills.map((bill) => {
    const matchedPayment = payments.find((p) => p.billId === bill.id);
    return {
      bill,
      payment: matchedPayment,
    };
  });

  const filteredBills = billsWithPayments.filter(({ bill, payment }) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      bill.billNumber.toLowerCase().includes(q) ||
      (bill.order?.orderNumber || '').toLowerCase().includes(q) ||
      (bill.customer?.name || '').toLowerCase().includes(q) ||
      (bill.table?.tableNumber || '').toLowerCase().includes(q) ||
      (payment?.providerPaymentId || '').toLowerCase().includes(q);

    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'PENDING') {
      return matchesSearch && payment?.status === 'PENDING';
    }
    return matchesSearch && bill.paymentStatus === statusFilter;
  });

  const getStatusBadge = (status: BillPaymentStatus | string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-700';
      case 'UNPAID':
        return 'bg-amber-950/60 text-amber-300 border-amber-800 animate-pulse';
      case 'PENDING':
        return 'bg-blue-950/60 text-blue-300 border-blue-800 animate-pulse';
      case 'FAILED':
        return 'bg-red-950/60 text-red-300 border-red-800';
      case 'REFUNDED':
        return 'bg-purple-950/60 text-purple-300 border-purple-800';
      case 'CANCELLED':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const paidVolume = bills.filter((b) => b.paymentStatus === 'PAID').reduce((acc, b) => acc + b.totalAmount, 0);
  const unpaidCount = bills.filter((b) => b.paymentStatus === 'UNPAID').length;

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
            Dual Payment & Billing Engine
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-400" />
            Digital Billing & Online / UPI Payments
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(false)}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* PENDING UPI VERIFICATION REQUESTS (Top alert banner) */}
      {pendingUpiPayments.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <QrCode className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>
                {pendingUpiPayments.length} Pending Guest UPI Payment{pendingUpiPayments.length > 1 ? 's' : ''} Awaiting Confirmation
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-500 uppercase tracking-wider">
              1-Click Staff Verification
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingUpiPayments.map((p) => {
              const matchedBill = bills.find((b) => b.id === p.billId);
              return (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-900 border border-amber-900/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-1.5">
                      <span>Table {matchedBill?.table?.tableNumber || 'Assigned'}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-amber-400 font-mono">
                        {restaurant.currencySymbol}
                        {p.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Bill: {matchedBill?.billNumber || 'BILL'} · Guest: {matchedBill?.customer?.name || 'Guest'}
                    </div>
                    {p.providerPaymentId && (
                      <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                        UTR / Ref: <strong>{p.providerPaymentId}</strong>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleVerifyUpi(p.id)}
                    disabled={verifyingPaymentId === p.id}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs shrink-0"
                  >
                    {verifyingPaymentId === p.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Verify & Settle</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Total Digital Invoices</span>
          <div className="text-2xl font-bold text-white font-mono">{bills.length}</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Unsettled Invoices (UNPAID)</span>
          <div className="text-2xl font-bold text-amber-400 font-mono">{unpaidCount}</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Total Verified Settled Revenue</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {restaurant.currencySymbol}
            {paidVolume.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Security & Multi-channel Notice Banner */}
      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Supports Dual Payments: Online Gateway (Razorpay) + Direct Restaurant UPI QR ({restaurant.upiId || 'configured'}).
          </span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400">Tamper-Proof Ledger</span>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar p-1 bg-slate-950 border border-slate-800 rounded-xl">
          {[
            { key: 'ALL', label: 'All Records' },
            { key: 'UNPAID', label: 'Unpaid' },
            { key: 'PENDING', label: 'Pending UPI' },
            { key: 'PAID', label: 'Paid' },
            { key: 'FAILED', label: 'Failed' },
            { key: 'REFUNDED', label: 'Refunded' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bill, order, guest, payment ID..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Bills Ledger Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
        {filteredBills.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No billing records found matching filter &quot;{statusFilter}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] tracking-wider bg-slate-900/50">
                  <th className="py-3 px-4">Bill Number</th>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Table</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Payment / UTR ID</th>
                  <th className="py-3 px-4">Settled At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBills.map(({ bill, payment }) => (
                  <tr key={bill.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      {bill.billNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {bill.order?.orderNumber || 'ORD-COMPLETED'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      Table {bill.table?.tableNumber || 'Assigned'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {bill.customer?.name || 'Guest'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      {restaurant.currencySymbol}
                      {bill.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${getStatusBadge(
                          bill.paymentStatus,
                        )}`}
                      >
                        {bill.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {payment?.provider || (bill.paymentStatus === 'PAID' ? 'SETTLED' : 'PENDING')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {payment?.providerPaymentId ? (
                        <span className="text-emerald-400 font-bold">{payment.providerPaymentId}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {bill.paidAt ? (
                        new Date(bill.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      ) : (
                        <span className="text-slate-600">Unsettled</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {bill.paymentStatus === 'UNPAID' && (
                        <button
                          onClick={() => setSettlingBill(bill)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Settle Bill (Cash/Card/UPI)"
                        >
                          <Check className="w-3 h-3" />
                          <span>Settle</span>
                        </button>
                      )}

                      <button
                        onClick={() => onOpenCustomerBill && onOpenCustomerBill(restaurant.slug, bill.billNumber)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="View Customer Digital Receipt"
                      >
                        <span>Receipt</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MANUAL SETTLEMENT MODAL */}
      {settlingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setSettlingBill(null)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Manual Counter Settlement</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Bill #{settlingBill.billNumber} · Table {settlingBill.table?.tableNumber || 'Assigned'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Guest Name:</span>
                <span className="font-semibold text-slate-200">{settlingBill.customer?.name || 'Table Guest'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Order Reference:</span>
                <span className="font-mono text-slate-200">{settlingBill.order?.orderNumber}</span>
              </div>
              <div className="flex justify-between font-bold pt-1.5 border-t border-slate-800 text-sm">
                <span>Total Amount:</span>
                <span className="font-mono text-emerald-400">
                  {restaurant.currencySymbol}
                  {settlingBill.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Select Settlement Channel</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'UPI_QR', label: 'UPI QR', icon: QrCode },
                  { id: 'CASH', label: 'Cash', icon: Banknote },
                  { id: 'CARD', label: 'Card (POS)', icon: CreditCard },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSettlementMethod(m.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                      settlementMethod === m.id
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <m.icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Number / UTR */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Reference ID / UTR / Auth Code (Optional)
              </label>
              <input
                type="text"
                value={settlementRef}
                onChange={(e) => setSettlementRef(e.target.value)}
                placeholder="e.g. UPI UTR, Card Auth Slip #..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSettlingBill(null)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManualSettle}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Settlement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
