import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Printer,
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Receipt,
  X,
  Sparkles,
  Info,
  MapPin,
  Phone,
  RefreshCw,
  Lock,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Smartphone,
  Send,
} from 'lucide-react';
import { Bill, Payment } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useTheme } from '../../themes/ThemeProvider.js';
import { useRestaurant } from '../../context/RestaurantContext.js';

interface DigitalBillViewProps {
  restaurantSlug: string;
  billNumber?: string;
  orderNumber?: string;
  onBackToMenu?: () => void;
  onBackToOrderStatus?: () => void;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

type PaymentOption = 'NONE' | 'CHOOSE' | 'ONLINE_GATEWAY' | 'UPI_QR';

export const DigitalBillView: React.FC<DigitalBillViewProps> = ({
  restaurantSlug,
  billNumber,
  orderNumber,
  onBackToMenu,
  onBackToOrderStatus,
}) => {
  const { restaurant } = useRestaurant();
  const { theme, getButtonClasses, getCardClasses, isDark } = useTheme();

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configMessage, setConfigMessage] = useState<string>('');
  const [paidPayment, setPaidPayment] = useState<Payment | null>(null);

  // Dual Payment System States
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<PaymentOption>('NONE');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [upiSubmitted, setUpiSubmitted] = useState(false);
  const [upiMessage, setUpiMessage] = useState<string | null>(null);

  const pollingRef = useRef<any>(null);

  const fetchOrGenerateBill = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    setError(null);
    try {
      if (billNumber) {
        // Direct bill lookup
        const billData = await api.getBill(restaurantSlug, billNumber);
        setBill(billData);
        if (billData.paymentStatus === 'PAID') {
          // Find settled payment info if available
          const payments = billData.payments || [];
          const settled = payments.find((p) => p.status === 'PAID') || payments[0];
          if (settled) setPaidPayment(settled);
        }
      } else if (orderNumber) {
        // Generate or retrieve bill from completed order
        const billData = await api.generateBill(restaurantSlug, orderNumber);
        setBill(billData);
        if (billData.paymentStatus === 'PAID') {
          const payments = billData.payments || [];
          const settled = payments.find((p) => p.status === 'PAID') || payments[0];
          if (settled) setPaidPayment(settled);
        }
      } else {
        setError('No bill number or order number provided.');
      }
    } catch (err: any) {
      if (!isPoll) {
        setError(err.message || 'Something went wrong while generating your digital bill.');
      }
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrGenerateBill();
  }, [restaurantSlug, billNumber, orderNumber]);

  // Set up live polling when bill is UNPAID or waiting for UPI confirmation
  useEffect(() => {
    if (!bill || bill.paymentStatus === 'PAID') {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    pollingRef.current = setInterval(() => {
      fetchOrGenerateBill(true);
    }, 3500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [bill?.billNumber, bill?.paymentStatus]);

  // Dynamically load Razorpay SDK
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleInitiateOnlineGatewayPayment = async () => {
    if (!bill) return;

    setProcessingPayment(true);
    setPaymentError(null);

    try {
      // 1. Backend creates payment order (authoritative DB amount)
      const paymentOrder = await api.createPaymentOrder(restaurantSlug, bill.billNumber);

      // 2. If online gateway credentials are not configured on server
      if (!paymentOrder.isConfigured) {
        setConfigMessage(
          paymentOrder.message ||
            'Online payment integration is active. Live gateway credentials (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET) are pending configuration on the server.',
        );
        setShowConfigModal(true);
        setProcessingPayment(false);
        return;
      }

      // 3. Load Razorpay script & open genuine checkout
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway SDK. Please check your network connection.');
      }

      const options = {
        key: paymentOrder.keyId,
        amount: Math.round(paymentOrder.amount * 100),
        currency: paymentOrder.currency || 'INR',
        name: paymentOrder.restaurantName || restaurant?.name || 'Restaurant Dining',
        description: paymentOrder.description || `Bill #${bill.billNumber}`,
        order_id: paymentOrder.providerOrderId,
        prefill: paymentOrder.prefill,
        theme: {
          color: theme.colors.primary,
        },
        handler: async (response: any) => {
          try {
            setProcessingPayment(true);
            // 4. Server-Side Cryptographic Signature Verification
            const verifyResult = await api.verifyPayment(restaurantSlug, bill.billNumber, {
              paymentOrderId: response.razorpay_order_id || paymentOrder.providerOrderId || '',
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            // 5. Update local state with genuinely settled bill
            setBill(verifyResult.bill);
            setPaidPayment(verifyResult.payment);
            setSelectedPaymentOption('NONE');
          } catch (err: any) {
            setPaymentError(err.message || 'Payment signature verification failed.');
          } finally {
            setProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', (resp: any) => {
        setPaymentError(
          resp.error?.description || 'Payment was not completed. You can retry paying anytime.',
        );
        setProcessingPayment(false);
      });
      razorpayInstance.open();
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to initiate payment.');
      setProcessingPayment(false);
    }
  };

  const handleCopyUpiId = (upiId: string) => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleRegisterUpiPayment = async () => {
    if (!bill) return;
    setSubmittingUtr(true);
    setPaymentError(null);
    try {
      const res = await api.recordUpiPayment(restaurantSlug, bill.billNumber, {
        utrNumber: utrNumber.trim() || undefined,
        customerNotes: `Table ${bill.table?.tableNumber || ''} guest UPI submission`,
      });
      setUpiSubmitted(true);
      setUpiMessage(res.message);
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to record UPI payment notification');
    } finally {
      setSubmittingUtr(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currencySymbol = restaurant?.currencySymbol || bill?.restaurant?.currencySymbol || '₹';
  const upiId = restaurant?.upiId || bill?.restaurant?.upiId || 'verdebotanica@icici';
  const upiMerchantName =
    restaurant?.upiMerchantName ||
    bill?.restaurant?.upiMerchantName ||
    restaurant?.name ||
    bill?.restaurant?.name ||
    'Restaurant Dining';

  // Construct standard UPI Intent URI
  const upiIntentUri = bill
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
        upiMerchantName,
      )}&am=${bill.totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
        `Bill ${bill.billNumber}`,
      )}`
    : '';

  // Construct dynamic QR code URL
  const qrCodeImageUrl = upiIntentUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
        upiIntentUri,
      )}`
    : '';

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: theme.colors.bgPrimary }}
      >
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto" style={{ color: theme.colors.primary }} />
          <p className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>
            Generating digital bill receipt...
          </p>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: theme.colors.bgPrimary }}
      >
        <div className={`max-w-md w-full p-8 text-center space-y-4 rounded-3xl ${getCardClasses()}`}>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold tracking-tight" style={{ fontFamily: theme.typography.headingFont }}>
            Digital Bill Unavailable
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: theme.colors.textMuted }}>
            {error || 'Bill not found. Please verify your order status with your server.'}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            {onBackToOrderStatus && (
              <button
                onClick={onBackToOrderStatus}
                className={`w-full py-2.5 px-4 text-xs font-semibold cursor-pointer ${getButtonClasses('primary')}`}
              >
                Back to Order Status
              </button>
            )}
            {onBackToMenu && (
              <button
                onClick={onBackToMenu}
                className={`w-full py-2.5 px-4 text-xs font-semibold cursor-pointer ${getButtonClasses('outline')}`}
              >
                Back to Menu
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isPaid = bill.paymentStatus === 'PAID';
  const formattedDate = new Date(bill.generatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="min-h-screen p-4 md:p-8 max-w-lg mx-auto pb-24 font-sans print:p-0 print:max-w-full print:bg-white print:text-black"
      style={{
        backgroundColor: theme.colors.bgPrimary,
        color: theme.colors.textPrimary,
      }}
    >
      {/* Top Navigation (hidden in print) */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <button
          onClick={onBackToOrderStatus || onBackToMenu}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{onBackToOrderStatus ? 'Order Tracker' : 'Menu'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="p-2 text-xs rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ borderColor: theme.colors.border }}
            title="Print Receipt"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="text-xs hidden sm:inline">Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Payment Error Alert (if any) */}
      {paymentError && (
        <div className="p-3.5 mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex items-start gap-2.5 text-xs text-red-600 dark:text-red-300 print:hidden">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Payment Notice</span>
            <span>{paymentError}</span>
          </div>
        </div>
      )}

      {/* Genuine Settled Celebration Card */}
      {isPaid && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-5 mb-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-2 shadow-lg print:hidden"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
            ✓ Payment Successful & Verified
          </h2>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            Your payment of{' '}
            <strong className="font-mono">
              {currencySymbol}
              {bill.totalAmount.toFixed(2)}
            </strong>{' '}
            has been settled. Your official digital receipt is ready below.
          </p>
          {(paidPayment?.providerPaymentId || bill.paidAt) && (
            <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 pt-1">
              Method: {paidPayment?.provider || 'VERIFIED'} · Ref:{' '}
              {paidPayment?.providerPaymentId || 'PAID'} · Settled:{' '}
              {new Date(bill.paidAt || Date.now()).toLocaleTimeString()}
            </div>
          )}
        </motion.div>
      )}

      {/* Main Digital Bill Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 md:p-8 relative rounded-3xl overflow-hidden shadow-2xl print:shadow-none print:border-none ${getCardClasses()}`}
      >
        {/* Receipt Header */}
        <div className="text-center pb-6 border-b border-dashed" style={{ borderColor: theme.colors.border }}>
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl bg-slate-100 dark:bg-slate-800/80 shadow-xs border"
            style={{ borderColor: theme.colors.border }}
          >
            {bill.restaurant?.logoUrl || restaurant?.logoUrl || '🍽️'}
          </div>

          <h1
            className="text-xl font-bold tracking-tight mb-1"
            style={{ fontFamily: theme.typography.headingFont, color: theme.colors.textPrimary }}
          >
            {bill.restaurant?.name || restaurant?.name}
          </h1>

          <p className="text-xs max-w-xs mx-auto mb-2" style={{ color: theme.colors.textMuted }}>
            {bill.restaurant?.tagline || restaurant?.tagline || 'Fine Dining & Craft Hospitality'}
          </p>

          {(bill.restaurant?.address || restaurant?.address) && (
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-1">
              <MapPin className="w-3 h-3 shrink-0" />
              <span>{bill.restaurant?.address || restaurant?.address}</span>
            </div>
          )}

          {(bill.restaurant?.phone || restaurant?.phone) && (
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
              <Phone className="w-3 h-3 shrink-0" />
              <span>{bill.restaurant?.phone || restaurant?.phone}</span>
            </div>
          )}
        </div>

        {/* Bill Metadata Grid */}
        <div
          className="py-4 border-b border-dashed grid grid-cols-2 gap-3 text-xs"
          style={{ borderColor: theme.colors.border }}
        >
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              Bill Number
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {bill.billNumber}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              Order Ref
            </span>
            <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">
              {bill.order?.orderNumber || orderNumber || 'ORD-COMPLETED'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              Table
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Table {bill.table?.tableNumber || 'Assigned'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              Guest
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {bill.customer?.name || 'Table Guest'}
            </span>
          </div>

          <div className="col-span-2 pt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formattedDate}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider font-mono uppercase ${
                isPaid
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
              }`}
            >
              Status: {bill.paymentStatus}
            </span>
          </div>
        </div>

        {/* Itemized Order Items Snapshot */}
        <div className="py-5 border-b border-dashed" style={{ borderColor: theme.colors.border }}>
          <div className="flex justify-between text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-3">
            <span>Item Description</span>
            <span className="text-right">Amount</span>
          </div>

          <div className="space-y-3">
            {(bill.items || []).map((item) => (
              <div key={item.id} className="flex justify-between items-start text-xs">
                <div className="flex-1 pr-4">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {item.quantity} × {currencySymbol}
                    {item.price.toFixed(2)}
                    {item.specialInstructions && (
                      <span className="italic ml-2 text-slate-500 font-sans">
                        ({item.specialInstructions})
                      </span>
                    )}
                  </div>
                </div>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {currencySymbol}
                  {item.itemTotal.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Calculation Breakdown */}
        <div
          className="py-4 space-y-2 text-xs border-b border-dashed"
          style={{ borderColor: theme.colors.border }}
        >
          <div className="flex justify-between" style={{ color: theme.colors.textSecondary }}>
            <span>Subtotal</span>
            <span className="font-mono tabular-nums font-medium">
              {currencySymbol}
              {bill.subtotal.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between" style={{ color: theme.colors.textSecondary }}>
            <span>
              Tax ({((bill.restaurant?.taxRate || restaurant?.taxRate || 0.05) * 100).toFixed(0)}% GST)
            </span>
            <span className="font-mono tabular-nums font-medium">
              {currencySymbol}
              {bill.taxAmount.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between" style={{ color: theme.colors.textSecondary }}>
            <span>Service Charge</span>
            <span className="font-mono tabular-nums font-medium">
              {currencySymbol}
              {bill.serviceCharge.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between" style={{ color: theme.colors.textSecondary }}>
            <span>Discount</span>
            <span className="font-mono tabular-nums font-medium text-emerald-500">
              -{currencySymbol}
              {bill.discountAmount.toFixed(2)}
            </span>
          </div>

          <div
            className="flex justify-between items-baseline pt-3 text-base font-bold"
            style={{ color: theme.colors.textPrimary }}
          >
            <span className="text-sm">Grand Total</span>
            <span className="font-mono text-lg tabular-nums" style={{ color: theme.colors.primary }}>
              {currencySymbol}
              {bill.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Security / Immutability badge */}
        <div className="py-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Immutable Authoritative Digital Bill · Ref #{bill.billNumber}</span>
        </div>

        {/* Payment CTA Section (hidden when printing) */}
        <div className="pt-3 print:hidden">
          {isPaid ? (
            <div className="space-y-2">
              <button
                onClick={handlePrint}
                className={`w-full py-3.5 px-4 text-xs font-bold flex items-center justify-center gap-2 rounded-2xl cursor-pointer ${getButtonClasses(
                  'outline',
                )}`}
              >
                <Printer className="w-4 h-4" />
                <span>View & Print Official Receipt</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <button
                onClick={() => setSelectedPaymentOption('CHOOSE')}
                disabled={processingPayment}
                className={`w-full py-4 px-6 text-sm font-bold flex items-center justify-center gap-2 rounded-2xl cursor-pointer shadow-xl transition-all ${getButtonClasses(
                  'primary',
                )}`}
              >
                <CreditCard className="w-5 h-5" />
                <span>
                  Pay Now · {currencySymbol}
                  {bill.totalAmount.toFixed(2)}
                </span>
              </button>

              <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <QrCode className="w-3 h-3 text-emerald-500" /> UPI QR
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-blue-500" /> Cards / NetBanking
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-purple-500" /> Wallets
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* DUAL PAYMENT METHOD SELECTOR & MODAL */}
      <AnimatePresence>
        {selectedPaymentOption !== 'NONE' && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`max-w-md w-full p-6 rounded-t-3xl sm:rounded-3xl space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto ${getCardClasses()}`}
            >
              {/* Modal Close Header */}
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: theme.colors.border }}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}
                  >
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ fontFamily: theme.typography.headingFont }}>
                      Choose Payment Method
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Bill #{bill.billNumber} · Total: {currencySymbol}
                      {bill.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPaymentOption('NONE')}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* PAYMENT SELECTION SCREEN */}
              {selectedPaymentOption === 'CHOOSE' && (
                <div className="space-y-3 py-2">
                  {/* OPTION 1: Pay Online (Payment Gateway) */}
                  <div
                    onClick={() => {
                      setSelectedPaymentOption('NONE');
                      handleInitiateOnlineGatewayPayment();
                    }}
                    className="p-4 rounded-2xl border transition-all cursor-pointer hover:border-emerald-500 hover:shadow-md group flex items-start gap-3.5"
                    style={{
                      borderColor: theme.colors.border,
                      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                    }}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <CreditCard className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          OPTION 1: Pay Online
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Credit / Debit Cards, NetBanking, International cards & Wallets
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-slate-500">
                        <span className="px-1.5 py-0.5 bg-slate-800/40 rounded border border-slate-700">Visa/Mastercard</span>
                        <span className="px-1.5 py-0.5 bg-slate-800/40 rounded border border-slate-700">NetBanking</span>
                        <span className="px-1.5 py-0.5 bg-slate-800/40 rounded border border-slate-700">Razorpay</span>
                      </div>
                    </div>
                  </div>

                  {/* OPTION 2: Scan Restaurant UPI QR */}
                  <div
                    onClick={() => setSelectedPaymentOption('UPI_QR')}
                    className="p-4 rounded-2xl border transition-all cursor-pointer hover:border-emerald-500 hover:shadow-md group flex items-start gap-3.5"
                    style={{
                      borderColor: theme.colors.border,
                      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                    }}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <QrCode className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          OPTION 2: Scan Restaurant UPI QR
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Direct 0% fee payment via Google Pay, PhonePe, Paytm, BHIM, Cred
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-slate-500">
                        <span className="px-1.5 py-0.5 bg-emerald-950/40 text-emerald-400 rounded border border-emerald-800">GPay</span>
                        <span className="px-1.5 py-0.5 bg-purple-950/40 text-purple-400 rounded border border-purple-800">PhonePe</span>
                        <span className="px-1.5 py-0.5 bg-blue-950/40 text-blue-400 rounded border border-blue-800">Paytm</span>
                        <span className="px-1.5 py-0.5 bg-slate-800/40 rounded border border-slate-700">Any UPI</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* UPI QR DIRECT SCAN SCREEN */}
              {selectedPaymentOption === 'UPI_QR' && (
                <div className="space-y-4 py-1">
                  {/* Back button */}
                  <button
                    onClick={() => setSelectedPaymentOption('CHOOSE')}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Payment Options</span>
                  </button>

                  {/* QR Code Container */}
                  <div className="p-5 rounded-2xl bg-white text-slate-900 text-center shadow-lg border border-slate-200">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-2">
                      Scan to Pay via Any UPI App
                    </div>

                    <div className="relative inline-block p-2 bg-white rounded-xl shadow-inner border border-slate-200">
                      <img
                        src={qrCodeImageUrl}
                        alt="Restaurant UPI QR Code"
                        className="w-48 h-48 mx-auto rounded-lg"
                      />
                    </div>

                    <div className="mt-3">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">
                        Exact Bill Amount
                      </span>
                      <div className="text-xl font-bold font-mono text-emerald-600">
                        {currencySymbol}
                        {bill.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-[11px] font-medium text-slate-600 mt-0.5">
                        {upiMerchantName}
                      </div>
                    </div>
                  </div>

                  {/* Copy UPI VPA Box */}
                  <div
                    className="p-3 rounded-xl border flex items-center justify-between text-xs"
                    style={{ borderColor: theme.colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}
                  >
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">
                        Restaurant UPI ID / VPA
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {upiId}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyUpiId(upiId)}
                      className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors hover:bg-slate-800"
                      style={{ borderColor: theme.colors.border }}
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Deep Link Button for Mobile Users */}
                  <a
                    href={upiIntentUri}
                    className={`w-full py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer ${getButtonClasses(
                      'primary',
                    )}`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Open in UPI App (GPay / PhonePe / Paytm)</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                  </a>

                  {/* UTR Reference Submission Form */}
                  <div
                    className="p-3.5 rounded-2xl border space-y-2.5"
                    style={{ borderColor: theme.colors.border, backgroundColor: isDark ? '#0b1120' : '#f1f5f9' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        After Paying, Confirm Here
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">12-Digit UTR</span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Enter the 12-digit UTR/UPI Transaction Reference number from your payment app, or click notify:
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="e.g. 426819284712 (Optional)"
                        className="flex-1 px-3 py-2 rounded-xl text-xs font-mono bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={handleRegisterUpiPayment}
                        disabled={submittingUtr}
                        className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer ${getButtonClasses(
                          'primary',
                        )}`}
                      >
                        {submittingUtr ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>{upiSubmitted ? 'Update' : 'I Have Paid'}</span>
                      </button>
                    </div>

                    {upiSubmitted && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-[11px] text-emerald-300 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400 shrink-0" />
                        <span>
                          {upiMessage || 'UPI payment logged! Staff is verifying and settling your bill.'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gateway Configuration Notice Modal (when live credentials are not set in .env) */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className={`max-w-md w-full p-6 rounded-3xl space-y-4 shadow-2xl relative ${getCardClasses()}`}
            >
              <button
                onClick={() => setShowConfigModal(false)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                style={{
                  backgroundColor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#ecfdf5',
                  color: theme.colors.primary,
                }}
              >
                <Lock className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold" style={{ fontFamily: theme.typography.headingFont }}>
                  Online Payment Gateway
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: theme.colors.textMuted }}>
                  {configMessage}
                </p>
              </div>

              <div
                className="p-3 rounded-xl border text-xs space-y-1"
                style={{
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  borderColor: theme.colors.border,
                }}
              >
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Bill Reference:</span>
                  <span className="font-mono text-slate-200">{bill.billNumber}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Status:</span>
                  <span className="font-mono font-bold text-amber-500">UNPAID</span>
                </div>
                <div
                  className="flex justify-between font-bold pt-1 border-t"
                  style={{ borderColor: theme.colors.border }}
                >
                  <span>Authoritative Amount:</span>
                  <span className="font-mono" style={{ color: theme.colors.primary }}>
                    {currencySymbol}
                    {bill.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                  <QrCode className="w-4 h-4" />
                  <span>Tip: Scan Restaurant UPI QR is Ready!</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  You can use <strong>Option 2: Scan Restaurant UPI QR</strong> to complete your payment directly via Google Pay, PhonePe, Paytm, or BHIM.
                </p>
                <button
                  onClick={() => {
                    setShowConfigModal(false);
                    setSelectedPaymentOption('UPI_QR');
                  }}
                  className={`w-full py-2 px-3 text-xs font-bold rounded-xl cursor-pointer ${getButtonClasses(
                    'primary',
                  )}`}
                >
                  Switch to Scan UPI QR
                </button>
              </div>

              <button
                onClick={() => setShowConfigModal(false)}
                className={`w-full py-2.5 px-4 text-xs font-semibold cursor-pointer ${getButtonClasses('outline')}`}
              >
                Close Notice
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
