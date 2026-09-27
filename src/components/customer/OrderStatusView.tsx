import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  CheckCircle,
  ChefHat,
  Bell,
  RefreshCw,
  ShoppingBag,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useTheme } from '../../themes/ThemeProvider.js';
import { useRestaurant } from '../../context/RestaurantContext.js';

interface OrderStatusViewProps {
  orderNumber: string;
  onBackToMenu: () => void;
}

const STATUS_STEPS: Array<{
  key: OrderStatus;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    key: 'NEW',
    label: 'Order Received',
    desc: 'Ticket sent directly to the kitchen display',
    icon: Bell,
  },
  {
    key: 'ACCEPTED',
    label: 'Order Accepted',
    desc: 'Chef acknowledged and assigned your order',
    icon: CheckCircle,
  },
  {
    key: 'PREPARING',
    label: 'Cooking in Progress',
    desc: 'Fresh ingredients being prepared and wood-fired',
    icon: ChefHat,
  },
  {
    key: 'READY',
    label: 'Ready for Service',
    desc: 'Plated and ready at the service pass',
    icon: Sparkles,
  },
  {
    key: 'SERVED',
    label: 'Served at Table',
    desc: 'Enjoy your meal!',
    icon: Utensils,
  },
];

export const OrderStatusView: React.FC<OrderStatusViewProps> = ({
  orderNumber,
  onBackToMenu,
}) => {
  const { restaurant } = useRestaurant();
  const { theme, getButtonClasses, getCardClasses, isDark } = useTheme();
  const currencySymbol = restaurant?.currencySymbol || '₹';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [callAssistanceSent, setCallAssistanceSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async (isManual = false) => {
    if (!restaurant) return;
    if (isManual) setRefreshing(true);
    try {
      const data = await api.getOrderByNumber(restaurant.slug, orderNumber);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load order status');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Live polling every 4 seconds for status updates
    const interval = setInterval(() => {
      fetchOrder();
    }, 4000);
    return () => clearInterval(interval);
  }, [restaurant?.slug, orderNumber]);

  const handleCallWaiter = () => {
    setCallAssistanceSent(true);
    setTimeout(() => setCallAssistanceSent(false), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <RefreshCw
            className="w-8 h-8 animate-spin mx-auto"
            style={{ color: theme.colors.primary }}
          />
          <p className="text-xs text-slate-500 font-mono">Loading live order status...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 max-w-md mx-auto">
        <div className={`p-6 text-center ${getCardClasses()}`}>
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="font-bold text-sm mb-1">Could not find order</h3>
          <p className="text-xs text-slate-500 mb-4">{error || 'Order was not found'}</p>
          <button
            onClick={onBackToMenu}
            className={`px-4 py-2 text-xs font-semibold cursor-pointer ${getButtonClasses('primary')}`}
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const getStepIndex = (status: OrderStatus): number => {
    const map: Record<OrderStatus, number> = {
      NEW: 0,
      ACCEPTED: 1,
      PREPARING: 2,
      READY: 3,
      SERVED: 4,
      COMPLETED: 5,
      CANCELLED: -1,
    };
    return map[status] ?? 0;
  };

  const currentStepIdx = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-lg mx-auto pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Menu</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchOrder(true)}
            disabled={refreshing}
            className="p-1.5 text-xs rounded-lg border flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            style={{ borderColor: theme.colors.border }}
            title="Refresh Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-[11px]">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Status Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-5 mb-4 ${getCardClasses()}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Live Table Tracker
            </span>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: theme.typography.headingFont, color: theme.colors.textPrimary }}
            >
              Order #{order.orderNumber}
            </h1>
          </div>

          <div
            className="px-3 py-1 rounded-full text-xs font-mono font-semibold border"
            style={{
              borderColor: theme.colors.border,
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              color: theme.colors.primary,
            }}
          >
            Table {order.table?.tableNumber || 'Assigned'}
          </div>
        </div>

        {/* Current status highlight banner */}
        {isCancelled ? (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-300">
            <strong>Order Cancelled: </strong>
            {order.cancellationReason || 'Contact staff for assistance'}
          </div>
        ) : (
          <div
            className="p-3 rounded-xl border flex items-center justify-between text-xs"
            style={{
              backgroundColor: isDark ? 'rgba(234, 88, 12, 0.12)' : '#ecfdf5',
              borderColor: isDark ? 'rgba(234, 88, 12, 0.35)' : '#a7f3d0',
              color: isDark ? '#fb923c' : '#047857',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: theme.colors.primaryLight }}
                ></span>
                <span
                  className="relative inline-flex rounded-full h-2.5 w-2.5"
                  style={{ backgroundColor: theme.colors.primary }}
                ></span>
              </span>
              <span className="font-semibold">
                Status: {order.status.replace(/_/g, ' ')}
              </span>
            </div>
            <span className="font-mono text-[11px] opacity-80">
              Est: ~{order.estimatedMinutes} min
            </span>
          </div>
        )}
      </motion.div>

      {/* Interactive Status Timeline */}
      {!isCancelled && (
        <div className={`p-5 mb-4 ${getCardClasses()}`}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Preparation Timeline
          </h3>

          <div className="space-y-4 relative">
            {/* Connecting vertical line */}
            <div
              className="absolute left-4 top-2 bottom-2 w-0.5 -ml-[1px]"
              style={{
                backgroundColor: isDark ? '#334155' : '#e2e8f0',
              }}
            />

            {STATUS_STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isPast = currentStepIdx > idx;
              const isCurrent = currentStepIdx === idx;

              return (
                <div key={step.key} className="flex items-start gap-3.5 relative z-10">
                  {/* Step Bubble */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                      isCurrent
                        ? isDark
                          ? 'bg-orange-600 border-orange-400 text-white shadow-md shadow-orange-950/50 scale-110'
                          : 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-950/20 scale-110'
                        : isPast
                        ? isDark
                          ? 'bg-orange-950/60 border-orange-600 text-orange-400'
                          : 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : isDark
                        ? 'bg-slate-900 border-slate-700 text-slate-500'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    <StepIcon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-xs font-semibold ${
                          isCurrent
                            ? isDark
                              ? 'text-orange-400 font-bold'
                              : 'text-emerald-600 dark:text-emerald-400 font-bold'
                            : isPast
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </h4>
                      {isCurrent && (
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider ${
                            isDark ? 'text-orange-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          Current Stage
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ordered Items Summary */}
      <div className={`p-5 mb-4 ${getCardClasses()}`}>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
          <span>Items Ordered ({order.items.reduce((acc, i) => acc + i.quantity, 0)})</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            Total: {currencySymbol}{order.totalAmount.toFixed(2)}
          </span>
        </h3>

        <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {order.items.map((item) => (
            <div key={item.id} className="pt-2 first:pt-0 flex justify-between items-start">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {item.quantity}x {item.name}
                </div>
                {item.specialInstructions && (
                  <div className="text-[11px] italic text-slate-400">
                    &quot;{item.specialInstructions}&quot;
                  </div>
                )}
              </div>
              <div className="font-mono font-medium text-slate-600 dark:text-slate-400">
                {currencySymbol}{item.itemTotal.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {order.specialInstructions && (
          <div className="mt-3 pt-3 border-t text-[11px] text-slate-500 italic">
            Table Note: &quot;{order.specialInstructions}&quot;
          </div>
        )}
      </div>

      {/* Table Service Call & Order More CTAs */}
      <div className="space-y-2">
        <button
          onClick={handleCallWaiter}
          className={`w-full py-2.5 px-4 text-xs font-semibold cursor-pointer ${getButtonClasses('secondary')}`}
        >
          {callAssistanceSent ? (
            <span
              className="font-semibold"
              style={{ color: isDark ? '#fb923c' : '#059669' }}
            >
              ✓ Table Service Notified
            </span>
          ) : (
            <span>🔔 Need Assistance / Call Staff</span>
          )}
        </button>

        <button
          onClick={onBackToMenu}
          className={`w-full py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${getButtonClasses(
            'outline',
          )}`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Add More Food / Drinks</span>
        </button>
      </div>
    </div>
  );
};
