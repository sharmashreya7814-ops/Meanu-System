import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeConfig, ThemePreset } from '../types/index.js';
import { NON_VEG_THEME, THEME_PRESETS, VEG_THEME } from './themeConfig.js';

interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  setThemePreset: (preset: ThemePreset) => void;
  isDark: boolean;
  getCardClasses: (extra?: string) => string;
  getButtonClasses: (variant?: 'primary' | 'secondary' | 'outline' | 'ghost') => string;
  getInputClasses: () => string;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{
  initialTheme?: ThemeConfig;
  children: React.ReactNode;
}> = ({ initialTheme = VEG_THEME, children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme);

  // Sync with initialTheme prop if changed externally
  useEffect(() => {
    if (initialTheme) {
      setTheme(initialTheme);
    }
  }, [initialTheme]);

  const setThemePreset = (preset: ThemePreset) => {
    if (THEME_PRESETS[preset]) {
      setTheme(THEME_PRESETS[preset]);
    }
  };

  const isDark = theme.preset === 'NON_VEG_THEME';

  // Inject CSS custom properties for seamless styling
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-primary-light', theme.colors.primaryLight);
    root.style.setProperty('--color-primary-dark', theme.colors.primaryDark);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-bg-primary', theme.colors.bgPrimary);
    root.style.setProperty('--color-bg-secondary', theme.colors.bgSecondary);
    root.style.setProperty('--color-bg-card', theme.colors.bgCard);
    root.style.setProperty('--color-text-primary', theme.colors.textPrimary);
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--color-text-muted', theme.colors.textMuted);
    root.style.setProperty('--color-border', theme.colors.border);
  }, [theme]);

  const getCardClasses = (extra = '') => {
    if (theme.cardStyle === 'glassmorphism') {
      return `backdrop-blur-md bg-slate-900/80 border border-slate-700/60 shadow-xl rounded-2xl ${extra}`;
    }
    if (theme.cardStyle === 'elevated') {
      return `bg-white border border-slate-100 shadow-lg shadow-slate-200/50 rounded-2xl ${extra}`;
    }
    if (theme.cardStyle === 'bordered') {
      return `bg-white border border-slate-200/80 shadow-xs rounded-2xl ${extra}`;
    }
    return `bg-white rounded-xl ${extra}`;
  };

  const getButtonClasses = (variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary') => {
    const base = 'transition-all duration-200 font-medium active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer inline-flex items-center justify-center gap-2';
    
    let radius = 'rounded-xl';
    if (theme.buttonStyle === 'rounded-pill') radius = 'rounded-full';
    if (theme.buttonStyle === 'sharp') radius = 'rounded-none';

    if (variant === 'primary') {
      if (theme.preset === 'VEG_THEME') {
        return `${base} ${radius} bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-700/20`;
      }
      return `${base} ${radius} bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-950/40`;
    }

    if (variant === 'secondary') {
      if (theme.preset === 'VEG_THEME') {
        return `${base} ${radius} bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60`;
      }
      return `${base} ${radius} bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700`;
    }

    if (variant === 'outline') {
      if (theme.preset === 'VEG_THEME') {
        return `${base} ${radius} bg-transparent hover:bg-emerald-50 text-emerald-700 border border-emerald-300`;
      }
      return `${base} ${radius} bg-transparent hover:bg-slate-800 text-orange-400 border border-orange-500/40`;
    }

    return `${base} ${radius} bg-transparent hover:bg-black/5 text-slate-600`;
  };

  const getInputClasses = () => {
    if (isDark) {
      return 'w-full px-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors';
    }
    return 'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors';
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      setThemePreset,
      isDark,
      getCardClasses,
      getButtonClasses,
      getInputClasses,
    }),
    [theme, isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
