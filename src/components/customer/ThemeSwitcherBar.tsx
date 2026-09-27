import React from 'react';
import { Palette, Leaf, Flame } from 'lucide-react';
import { useTheme } from '../../themes/ThemeProvider.js';
import { ThemePreset } from '../../types/index.js';

export const ThemeSwitcherBar: React.FC = () => {
  const { theme, setThemePreset } = useTheme();

  return (
    <div className="bg-slate-900 text-white text-xs px-3 py-2 border-b border-slate-800 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Palette className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-mono text-[11px] text-slate-300">
          Theme Preset:
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setThemePreset('VEG_THEME')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
            theme.preset === 'VEG_THEME'
              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
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
        >
          <Flame className="w-3 h-3 text-orange-300" />
          <span>NON_VEG_THEME (Smokehouse)</span>
        </button>
      </div>
    </div>
  );
};
