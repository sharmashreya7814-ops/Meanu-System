import { ThemeConfig } from '../types/index.js';

export const VEG_THEME: ThemeConfig = {
  preset: 'VEG_THEME',
  restaurantName: 'Verde Botanica',
  restaurantLogo: '🌿',
  tagline: 'Fresh • Organic • Pure Culinary Craft',
  colors: {
    primary: '#059669', // Emerald 600
    primaryLight: '#34d399', // Emerald 400
    primaryDark: '#065f46', // Emerald 800
    secondary: '#10b981', // Emerald 500
    accent: '#84cc16', // Lime 500
    bgPrimary: '#f8fafc', // Slate 50 (Crisp natural canvas)
    bgSecondary: '#ecfdf5', // Emerald 50
    bgCard: '#ffffff',
    textPrimary: '#0f172a', // Slate 900
    textSecondary: '#334155', // Slate 700
    textMuted: '#64748b', // Slate 500
    border: '#e2e8f0', // Slate 200
    surfaceElevated: '#ffffff',
  },
  typography: {
    headingFont: 'Fraunces, serif',
    bodyFont: 'Plus Jakarta Sans, sans-serif',
    style: 'classic',
  },
  cardStyle: 'bordered',
  buttonStyle: 'rounded-lg',
  animationStyle: 'smooth',
  foodPresentationStyle: 'grid-modern',
  heroBannerUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
};

export const NON_VEG_THEME: ThemeConfig = {
  preset: 'NON_VEG_THEME',
  restaurantName: 'The Ember & Smokehouse',
  restaurantLogo: '🔥',
  tagline: 'Artisan Wood-Fired & Prime Cut Specialists',
  colors: {
    primary: '#ea580c', // Orange 600
    primaryLight: '#fb923c', // Orange 400
    primaryDark: '#9a3412', // Orange 800
    secondary: '#b91c1c', // Red 700
    accent: '#f59e0b', // Amber 500
    bgPrimary: '#090d16', // Deep charcoal/obsidian
    bgSecondary: '#131b2e', // Rich slate navy
    bgCard: '#151f33',
    textPrimary: '#f8fafc', // Slate 50
    textSecondary: '#cbd5e1', // Slate 300
    textMuted: '#94a3b8', // Slate 400
    border: '#2a3754',
    surfaceElevated: '#1a2742',
  },
  typography: {
    headingFont: 'Syne, sans-serif',
    bodyFont: 'Plus Jakarta Sans, sans-serif',
    style: 'modern',
  },
  cardStyle: 'glassmorphism',
  buttonStyle: 'rounded-lg',
  animationStyle: 'energetic',
  foodPresentationStyle: 'showcase-cards',
  heroBannerUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
};

export const THEME_PRESETS: Record<string, ThemeConfig> = {
  VEG_THEME,
  NON_VEG_THEME,
};
