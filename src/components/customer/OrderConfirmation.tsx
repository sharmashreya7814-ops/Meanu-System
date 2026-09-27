import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, ArrowRight, RotateCcw } from 'lucide-react';
import { Order } from '../../types/index.js';
import { useTheme } from '../../themes/ThemeProvider.js';
import { useRestaurant } from '../../context/RestaurantContext.js';

interface OrderConfirmationProps {
  order: Order;
  onTrackOrder: () => void;
  onOrderMore: () => void;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  order,
  onTrackOrder,
  onOrderMore,
}) => {
  const { restaurant } = useRestaurant();
  const { theme, getButtonClasses, getCardClasses, isDark } = useTheme();
  const currencySymbol = restaurant?.currencySymbol || '₹';

  return (
    <div className="min-h-screen flex flex-col justify-center p-4 md:p-8 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
        className={`p-6 md:p-8 text-center ${getCardClasses()}`}
      >
        {/* Animated Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1, stiffness: 300, damping: 18 }}
          className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 shadow-sm ${
            isDark
              ? 'bg-orange-950/70 border border-orange-500/40 text-orange-400'
              : 'bg-emerald-100 text-emerald-600'
          }`}
        >
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>

        <span
          className="text-xs font-mono font-bold tracking-wider uppercase"
          style={{ color: theme.colors.primary }}
        >
          Order Sent to Kitchen
        </span>

        <h2
          className="text-2xl font-bold tracking-tight mt-1 mb-2"
          style={{ fontFamily: theme.typography.headingFont, color: theme.colors.textPrimary }}
        >
          Order #{order.orderNumber}
        </h2>

        <p className="text-xs mb-6" style={{ color: theme.colors.textSecondary }}>
          Thank you, <strong className="font-semibold">{order.customer?.name || 'Guest'}</strong>! The kitchen has received your ticket and is preparing your meal.
        </p>

        {/* Order Details Card */}
        <div
          className="p-4 rounded-xl border text-xs text-left mb-6 space-y-2.5"
          style={{
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            borderColor: theme.colors.border,
          }}
        >
          <div className="flex justify-between items-center">
            <span style={{ color: theme.colors.textMuted }}>Table Number</span>
            <span className="font-semibold font-mono" style={{ color: theme.colors.textPrimary }}>
              Table {order.table?.tableNumber || 'Assigned'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span style={{ color: theme.colors.textMuted }}>Estimated Time</span>
            <span className="flex items-center gap-1 font-semibold text-amber-500">
              <Clock className="w-3.5 h-3.5" /> ~{order.estimatedMinutes} mins
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: theme.colors.border }}>
            <span style={{ color: theme.colors.textMuted }}>Total Items</span>
            <span style={{ color: theme.colors.textPrimary }}>
              {order.items.reduce((acc, i) => acc + i.quantity, 0)} items ({currencySymbol}{order.totalAmount.toFixed(2)})
            </span>
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-2">
          <button
            onClick={onTrackOrder}
            className={`w-full py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${getButtonClasses(
              'primary',
            )}`}
          >
            <span>Track Order Progress</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOrderMore}
            className="w-full py-2.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Order Additional Items</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
