import React from 'react';
import { motion } from 'motion/react';
import { Clock, Plus, Minus } from 'lucide-react';
import { MenuItem } from '../../types/index.js';
import { useTheme } from '../../themes/ThemeProvider.js';
import { useCart } from '../../context/CartContext.js';
import { VegBadge } from '../common/Badge.js';

interface MenuItemCardProps {
  item: MenuItem;
  currencySymbol?: string;
  onOpenDetails: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  currencySymbol = '$',
  onOpenDetails,
}) => {
  const { theme, getCardClasses, isDark } = useTheme();
  const { items, addItem, updateQuantity } = useCart();

  const cartEntry = items.find((ci) => ci.menuItem.id === item.id);
  const quantityInCart = cartEntry ? cartEntry.quantity : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`relative overflow-hidden flex flex-col justify-between transition-all group ${getCardClasses(
        !item.isAvailable ? 'opacity-60 grayscale-[40%]' : '',
      )}`}
    >
      {/* Clickable body for details */}
      <div
        onClick={() => onOpenDetails(item)}
        className="p-3.5 pb-2 cursor-pointer flex-1 flex flex-col justify-between"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          {/* Info Side */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <VegBadge isVeg={item.isVeg} size="sm" />
              <span
                className="text-[11px] font-mono"
                style={{ color: item.isVeg ? '#059669' : '#b91c1c' }}
              >
                {item.isVeg ? 'VEG' : 'NON-VEG'}
              </span>
              {item.isFeatured && (
                <>
                  <span className="text-slate-400 text-[10px]" aria-hidden="true">·</span>
                  <span className="text-[11px] font-medium text-amber-500">Chef Special</span>
                </>
              )}
            </div>

            <h3
              className="text-sm font-semibold tracking-tight leading-snug line-clamp-2 mb-1"
              style={{
                fontFamily: theme.typography.headingFont,
                color: theme.colors.textPrimary,
              }}
            >
              {item.name}
            </h3>

            <p
              className="text-xs line-clamp-2 leading-relaxed"
              style={{ color: theme.colors.textSecondary }}
            >
              {item.description}
            </p>
          </div>

          {/* Image Thumbnail */}
          <div className="relative w-22 h-22 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
            <img
              src={item.image}
              alt={item.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Fallback styled visual container
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
              }}
            />
            {!item.isAvailable && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white px-1 py-0.5 bg-red-600 rounded-sm">
                  Sold Out
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Metadata row: Prep time + Allergens */}
        <div className="flex items-center gap-2 text-[11px] mt-1" style={{ color: theme.colors.textMuted }}>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{item.preparationTimeMin} min</span>
          </span>
          {item.calories && (
            <>
              <span aria-hidden="true">·</span>
              <span>{item.calories} kcal</span>
            </>
          )}
          {item.allergens && item.allergens.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate max-w-[120px]">{item.allergens.join(', ')}</span>
            </>
          )}
        </div>
      </div>

      {/* Footer Action & Price Row */}
      <div
        className="px-3.5 py-2.5 border-t flex items-center justify-between"
        style={{ borderColor: theme.colors.border }}
      >
        <div className="flex items-baseline gap-1">
          <span className="text-xs font-medium" style={{ color: theme.colors.textMuted }}>
            {currencySymbol}
          </span>
          <span
            className="text-base font-bold font-mono tabular-nums"
            style={{ color: theme.colors.textPrimary }}
          >
            {item.price.toFixed(2)}
          </span>
        </div>

        {/* Cart controls */}
        {item.isAvailable ? (
          quantityInCart > 0 ? (
            <div
              className="flex items-center rounded-lg p-0.5 border"
              style={{
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                borderColor: theme.colors.border,
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(item.id, -1);
                }}
                className="w-7 h-7 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span
                className="w-6 text-center text-xs font-bold font-mono tabular-nums"
                style={{ color: theme.colors.textPrimary }}
              >
                {quantityInCart}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(item.id, 1);
                }}
                className="w-7 h-7 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addItem(item, 1);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              style={{
                backgroundColor: isDark ? '#ea580c' : '#059669',
                color: '#ffffff',
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          )
        ) : (
          <span className="text-[11px] font-medium text-slate-400">Unavailable</span>
        )}
      </div>
    </motion.div>
  );
};
