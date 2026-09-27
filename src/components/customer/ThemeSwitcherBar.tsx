import React from 'react';
import { Palette, Leaf, Flame, RotateCcw } from 'lucide-react';
import { useTheme } from '../../themes/ThemeProvider.js';
import { useRestaurant } from '../../context/RestaurantContext.js';

export const ThemeSwitcherBar: React.FC = () => {
  const { theme, setThemePreset, isManualOverride, resetToRestaurantTheme } = useTheme();
  const { restaurant } = useRestaurant();

  const configuredPreset = restaurant?.themePreset || 'VEG_THEME';

  return (
    <div className="bg-slate-900 text-white text-xs px-3 py-1.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Palette className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-mono text-[11px] text-slate-300">
          Restaurant Config: <strong className="text-amber-300 font-semibold">{configuredPreset}</strong>
        </span>
        {isManualOverride && (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Preview Mode
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setThemePreset('VEG_THEME')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
            theme.preset === 'VEG_THEME'
              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Preview VEG_THEME"
        >
          <Leaf className="w-3 h-3 text-emerald-300" />
          <span>VEG_THEME (Botanica)</span>
        </button>

        <button
          onClick={() => setThemePreset('NON_VEG_THEME')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
            theme.preset === 'NON_VEG_THEME'
              ? 'bg-orange-600 text-white shadow-xs font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Preview NON_VEG_THEME"
        >
          <Flame className="w-3 h-3 text-orange-300" />
          <span>NON_VEG_THEME (Smokehouse)</span>
        </button>

        {isManualOverride && (
          <button
            onClick={resetToRestaurantTheme}
            className="px-2 py-1 rounded-md text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
            title="Reset to Restaurant Configured Theme"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
