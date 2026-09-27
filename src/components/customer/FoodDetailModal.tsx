import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Plus, Minus, Flame, Info, Check } from 'lucide-react';
import { MenuItem } from '../../types/index.js';
import { useTheme } from '../../themes/ThemeProvider.js';
import { useCart } from '../../context/CartContext.js';
import { VegBadge } from '../common/Badge.js';

interface FoodDetailModalProps {
  item: MenuItem | null;
  currencySymbol?: string;
  onClose: () => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  item,
  currencySymbol = '$',
  onClose,
}) => {
  const { theme, getButtonClasses, isDark } = useTheme();
  const { addItem, items } = useCart();

  const existingInCart = item ? items.find((i) => i.menuItem.id === item.id) : null;
  const [quantity, setQuantity] = useState(existingInCart ? existingInCart.quantity : 1);
  const [instructions, setInstructions] = useState(existingInCart?.specialInstructions || '');
  const [addedAnimation, setAddedAnimation] = useState(false);

  if (!item) return null;

  const handleAddToCart = () => {
    addItem(item, quantity, instructions);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 400);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
        {/* Backdrop click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden z-10 max-h-[90vh] flex flex-col shadow-2xl"
          style={{
            backgroundColor: isDark ? '#151f33' : '#ffffff',
            color: theme.colors.textPrimary,
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Hero Food Image */}
          <div className="relative h-56 sm:h-64 w-full bg-slate-900 shrink-0 overflow-hidden">
            <img
              src={item.image}
              alt={item.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
              <div className="flex items-center gap-2">
                <VegBadge isVeg={item.isVeg} size="lg" />
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  {item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                </span>
              </div>
              <div className="text-white font-mono text-xl font-bold">
                {currencySymbol}
                {item.price.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Scrollable Details Body */}
          <div className="p-5 overflow-y-auto space-y-4">
            <div>
              <h2
                className="text-xl font-bold tracking-tight mb-1"
                style={{ fontFamily: theme.typography.headingFont }}
              >
                {item.name}
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                {item.description}
              </p>
            </div>

            {/* Quick badges & metadata */}
            <div
              className="p-3 rounded-xl border flex items-center justify-around text-xs"
              style={{
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                borderColor: theme.colors.border,
              }}
            >
              <div className="flex items-center gap-1.5" style={{ color: theme.colors.textSecondary }}>
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{item.preparationTimeMin} min prep</span>
              </div>
              {item.calories && (
                <div className="flex items-center gap-1.5" style={{ color: theme.colors.textSecondary }}>
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>{item.calories} Calories</span>
                </div>
              )}
              {item.isFeatured && (
                <div className="flex items-center gap-1.5 text-amber-500 font-medium">
                  <span>★ Chef Special</span>
                </div>
              )}
            </div>

            {/* Allergens info */}
            {item.allergens && item.allergens.length > 0 && (
              <div
                className="p-3 rounded-xl border flex items-start gap-2 text-xs"
                style={{
                  backgroundColor: isDark ? '#0f172a' : '#fffbeb',
                  borderColor: isDark ? theme.colors.border : '#fef3c7',
                  color: isDark ? '#fef08a' : '#92400e',
                }}
              >
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Allergen Notice: </span>
                  <span>Contains {item.allergens.join(', ')}. Please advise if you have severe allergies.</span>
                </div>
              </div>
            )}

            {/* Special Instructions Input */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: theme.colors.textSecondary }}
              >
                Kitchen & Preparation Note
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                maxLength={200}
                placeholder="e.g. Less salt, extra spicy, gluten allergy, dressing on the side..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs transition-all focus:outline-none resize-none"
                style={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary,
                }}
              />
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div
            className="p-4 border-t flex items-center justify-between gap-3 bg-opacity-95 backdrop-blur-xs"
            style={{
              borderColor: theme.colors.border,
              backgroundColor: isDark ? '#151f33' : '#ffffff',
            }}
          >
            {/* Quantity Selector */}
            <div
              className="flex items-center rounded-xl p-1 border"
              style={{
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                borderColor: theme.colors.border,
              }}
            >
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-sm font-bold font-mono tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Cart CTA */}
            <button
              onClick={handleAddToCart}
              disabled={!item.isAvailable}
              className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-between ${getButtonClasses(
                'primary',
              )}`}
            >
              {addedAnimation ? (
                <span className="flex items-center gap-2 mx-auto">
                  <Check className="w-4 h-4" /> Added to Cart!
                </span>
              ) : (
                <>
                  <span>Add {quantity > 1 ? `(${quantity})` : ''} to Cart</span>
                  <span className="font-mono font-bold">
                    {currencySymbol}
                    {(item.price * quantity).toFixed(2)}
                  </span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
