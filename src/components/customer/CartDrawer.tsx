import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { useCart } from '../../context/CartContext.js';
import { useRestaurant } from '../../context/RestaurantContext.js';
import { useTheme } from '../../themes/ThemeProvider.js';
import { VegBadge } from '../common/Badge.js';
import { api } from '../../services/api.js';
import { Order } from '../../types/index.js';

interface CartDrawerProps {
  onOrderPlaced: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOrderPlaced }) => {
  const {
    items,
    updateQuantity,
    removeItem,
    orderInstructions,
    setOrderInstructions,
    clearCart,
    subtotal,
    taxAmount,
    totalAmount,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const { restaurant, table, customer } = useRestaurant();
  const { theme, getButtonClasses, isDark } = useTheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handlePlaceOrder = async () => {
    if (!restaurant || !table || !customer) {
      setError('Please provide customer details before placing an order.');
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty. Please add some items.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const orderPayload = {
        tableId: table.id,
        customerId: customer.id,
        specialInstructions: orderInstructions,
        items: items.map((i) => ({
          menuItemId: i.menuItem.id,
          quantity: i.quantity,
          specialInstructions: i.specialInstructions || '',
        })),
      };

      const newOrder = await api.createOrder(restaurant.slug, orderPayload);
      clearCart();
      setIsCartOpen(false);
      onOrderPlaced(newOrder);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch order to kitchen. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = restaurant?.currencySymbol || '$';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCartOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="w-screen max-w-md flex flex-col shadow-2xl"
            style={{
              backgroundColor: isDark ? '#151f33' : '#ffffff',
              color: theme.colors.textPrimary,
            }}
          >
            {/* Header */}
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: theme.colors.border }}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h2
                  className="text-base font-bold tracking-tight"
                  style={{ fontFamily: theme.typography.headingFont }}
                >
                  Your Table Order
                </h2>
                <span className="text-xs font-mono text-slate-400">
                  ({table?.tableNumber})
                </span>
              </div>

              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 mx-4 mt-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-2 text-xs text-red-600 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center border"
                    style={{
                      borderColor: theme.colors.border,
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      color: theme.colors.textMuted,
                    }}
                  >
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Your cart is empty</h3>
                    <p className="text-xs max-w-xs" style={{ color: theme.colors.textMuted }}>
                      Select items from the chef&apos;s menu to begin your dining experience.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className={`px-4 py-2 text-xs font-semibold ${getButtonClasses('secondary')}`}
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                items.map(({ menuItem, quantity, specialInstructions }) => (
                  <div key={menuItem.id} className="pt-3 first:pt-0 flex items-start gap-3">
                    <img
                      src={menuItem.image}
                      alt={menuItem.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200/60 dark:border-slate-700"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <VegBadge isVeg={menuItem.isVeg} size="sm" />
                        <h4 className="text-xs font-semibold truncate leading-tight">
                          {menuItem.name}
                        </h4>
                      </div>

                      <div className="text-xs font-mono font-bold" style={{ color: theme.colors.primary }}>
                        {currencySymbol}
                        {(menuItem.price * quantity).toFixed(2)}
                        <span className="text-[10px] font-normal text-slate-400 ml-1">
                          ({currencySymbol}{menuItem.price.toFixed(2)} each)
                        </span>
                      </div>

                      {specialInstructions && (
                        <div className="text-[11px] italic text-slate-400 mt-1 flex items-center gap-1 truncate">
                          <MessageSquare className="w-3 h-3 shrink-0" />
                          <span>&quot;{specialInstructions}&quot;</span>
                        </div>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div
                        className="flex items-center rounded-lg p-0.5 border"
                        style={{
                          backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                          borderColor: theme.colors.border,
                        }}
                      >
                        <button
                          onClick={() => updateQuantity(menuItem.id, -1)}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(menuItem.id, 1)}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(menuItem.id)}
                        className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Bill Summary & Checkout */}
            {items.length > 0 && (
              <div
                className="p-4 border-t space-y-3 bg-opacity-95"
                style={{
                  borderColor: theme.colors.border,
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                }}
              >
                {/* Overall Chef instructions */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Special Kitchen Request (Overall Table)
                  </label>
                  <input
                    type="text"
                    value={orderInstructions}
                    onChange={(e) => setOrderInstructions(e.target.value)}
                    placeholder="e.g. Serve appetizers first, extra napkins..."
                    className="w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none"
                    style={{
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary,
                    }}
                  />
                </div>

                {/* Price Breakdown */}
                <div className="space-y-1.5 text-xs pt-1 border-t" style={{ borderColor: theme.colors.border }}>
                  <div className="flex justify-between" style={{ color: theme.colors.textSecondary }}>
                    <span>Subtotal</span>
                    <span className="font-mono tabular-nums">
                      {currencySymbol}
                      {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between" style={{ color: theme.colors.textSecondary }}>
                    <span>Estimated Tax ({((restaurant?.taxRate || 0.08) * 100).toFixed(0)}%)</span>
                    <span className="font-mono tabular-nums">
                      {currencySymbol}
                      {taxAmount.toFixed(2)}
                    </span>
                  </div>
                  <div
                    className="flex justify-between text-sm font-bold pt-1.5 border-t"
                    style={{
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    <span>Order Total</span>
                    <span className="font-mono tabular-nums">
                      {currencySymbol}
                      {totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>Verified prices loaded authoritatively from restaurant menu</span>
                </div>

                {/* Place Order CTA */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className={`w-full py-3 px-4 text-xs font-semibold flex items-center justify-between ${getButtonClasses(
                    'primary',
                  )}`}
                >
                  {loading ? (
                    <span className="mx-auto">Sending to Kitchen...</span>
                  ) : (
                    <>
                      <span>Place Order Now</span>
                      <span className="flex items-center gap-1 font-mono font-bold">
                        {currencySymbol}
                        {totalAmount.toFixed(2)} <ArrowRight className="w-4 h-4" />
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
