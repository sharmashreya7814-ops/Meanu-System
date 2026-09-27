import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Phone, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext.js';
import { useTheme } from '../../themes/ThemeProvider.js';

interface CustomerFormProps {
  onSuccess: () => void;
  onBack?: () => void;
}

export function isValidIndianMobileNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleanDigits = phone.replace(/[\s\-\(\)]/g, '');
  const indianPhoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  return indianPhoneRegex.test(cleanDigits);
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ onSuccess, onBack }) => {
  const { restaurant, table, customer, startCustomerSession } = useRestaurant();
  const { theme, getButtonClasses, getCardClasses, isDark } = useTheme();

  const [name, setName] = useState(customer?.name || '');
  const [mobileNumber, setMobileNumber] = useState(customer?.mobileNumber || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your name (at least 2 letters)');
      return;
    }
    if (!mobileNumber.trim() || !isValidIndianMobileNumber(mobileNumber)) {
      setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210 or +91 98765 43210)');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await startCustomerSession(name.trim(), mobileNumber.trim());
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize table session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center p-4 md:p-8 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`p-6 md:p-8 ${getCardClasses()}`}
      >
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-3 border shadow-sm"
            style={{
              borderColor: theme.colors.border,
              backgroundColor: isDark ? '#0f172a' : theme.colors.bgSecondary,
              color: theme.colors.primary,
            }}
          >
            <span>{restaurant?.logoUrl || '🍽️'}</span>
          </div>

          <h2
            className="text-xl md:text-2xl font-bold tracking-tight mb-1"
            style={{
              fontFamily: theme.typography.headingFont,
              color: theme.colors.textPrimary,
            }}
          >
            {restaurant?.name || 'Restaurant Ordering'}
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold my-1 border"
            style={{
              borderColor: theme.colors.border,
              backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
              color: theme.colors.primary,
            }}
          >
            <span>Table {table?.tableNumber}</span>
          </div>
          <p className="text-xs mt-2" style={{ color: theme.colors.textSecondary }}>
            Enter your name and mobile number to explore our menu and receive real-time order updates.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-2 text-xs text-red-700 dark:text-red-300"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.colors.textSecondary }}>
              Your Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none"
                style={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary,
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.colors.textSecondary }}>
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="tel"
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="e.g. 9876543210 or +91 98765 43210"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none"
                style={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary,
                }}
              />
            </div>
            <span className="block mt-1 text-[11px]" style={{ color: theme.colors.textMuted }}>
              10-digit Indian mobile number for kitchen & status alerts.
            </span>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer ${getButtonClasses(
                'primary',
              )}`}
            >
              {loading ? (
                <span>Starting Session...</span>
              ) : (
                <>
                  <span>Continue to Menu</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                Back
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 pt-4 border-t flex items-center justify-center gap-1.5 text-[11px]"
          style={{
            borderColor: theme.colors.border,
            color: theme.colors.textMuted,
          }}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>No passwords or account registration required</span>
        </div>
      </motion.div>
    </div>
  );
};
