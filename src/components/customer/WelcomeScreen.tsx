import React from 'react';
import { motion } from 'motion/react';
import { UtensilsCrossed, ChevronRight, Sparkles, MapPin, Coffee } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext.js';
import { useTheme } from '../../themes/ThemeProvider.js';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  const { restaurant, table, customer } = useRestaurant();
  const { theme, getButtonClasses, getCardClasses, isDark } = useTheme();

  if (!restaurant || !table) return null;

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 md:p-8 max-w-lg mx-auto">
      {/* Top Bar Branding */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between pt-2 pb-4"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-3xl">{restaurant.logoUrl || '🌿'}</span>
          <div>
            <span className="font-bold text-base tracking-tight block" style={{ color: theme.colors.textPrimary, fontFamily: theme.typography.headingFont }}>
              {restaurant.name}
            </span>
            <span className="text-[11px] block" style={{ color: theme.colors.textMuted }}>
              Contactless Dining Experience
            </span>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border shadow-xs"
          style={{
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.bgCard,
            color: theme.colors.primary,
          }}
        >
          Table {table.tableNumber}
        </div>
      </motion.div>

      {/* Hero Welcome Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={`p-6 md:p-8 my-auto text-center relative overflow-hidden ${getCardClasses()}`}
      >
        {/* Subtle decorative background pulse */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.03, 0.08, 0.03],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
          style={{ backgroundColor: theme.colors.primary }}
        />

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-sm mb-4 border"
          style={{
            backgroundColor: isDark ? '#1e293b' : theme.colors.bgSecondary,
            borderColor: theme.colors.border,
            color: theme.colors.primary,
          }}
        >
          <UtensilsCrossed className="w-8 h-8" />
        </motion.div>

        <motion.h1
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-bold tracking-tight mb-2"
          style={{
            fontFamily: theme.typography.headingFont,
            color: theme.colors.textPrimary,
          }}
        >
          Welcome to {restaurant.name}
        </motion.h1>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-sm mb-6 max-w-xs mx-auto"
          style={{ color: theme.colors.textSecondary }}
        >
          {restaurant.tagline || 'Experience handcrafted dining at your table. Explore our fresh chef creations and place orders directly.'}
        </motion.p>

        {/* Table & Session Info Box */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl border text-xs text-left mb-6 space-y-2"
          style={{
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            borderColor: theme.colors.border,
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ color: theme.colors.textMuted }}>Your Table</span>
            <span className="font-bold font-mono text-sm" style={{ color: theme.colors.textPrimary }}>
              Table {table.tableNumber}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span style={{ color: theme.colors.textMuted }}>Dining Area</span>
            <span style={{ color: theme.colors.textSecondary }}>{table.tableName || 'Main Dining Hall'}</span>
          </div>

          {customer && (
            <div className="flex items-center justify-between pt-1.5 border-t" style={{ borderColor: theme.colors.border }}>
              <span style={{ color: theme.colors.textMuted }}>Guest</span>
              <span className="font-semibold" style={{ color: theme.colors.primary }}>
                {customer.name} ({customer.mobileNumber})
              </span>
            </div>
          )}
        </motion.div>

        {/* Action Button: "View Menu" */}
        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          whileTap={{ scale: 0.98 }}
          onClick={onContinue}
          className={`w-full py-3.5 px-6 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg ${getButtonClasses(
            'primary',
          )}`}
        >
          <span>View Menu</span>
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center py-3 text-xs flex items-center justify-center gap-2"
        style={{ color: theme.colors.textMuted }}
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Instant table service · Live kitchen tracking</span>
      </motion.div>
    </div>
  );
};
