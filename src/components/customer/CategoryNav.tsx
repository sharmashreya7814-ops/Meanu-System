import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Category } from '../../types/index.js';
import { useTheme } from '../../themes/ThemeProvider.js';
import { VegBadge } from '../common/Badge.js';

interface CategoryNavProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  vegOnlyFilter: boolean | null; // null = all, true = veg only, false = non-veg only
  onVegFilterChange: (val: boolean | null) => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  vegOnlyFilter,
  onVegFilterChange,
}) => {
  const { theme, isDark } = useTheme();

  return (
    <div
      className="sticky top-10 z-30 pt-2 pb-3 px-4 border-b backdrop-blur-md transition-colors"
      style={{
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        borderColor: theme.colors.border,
      }}
    >
      {/* Search & Dietary Filter Row */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search appetizers, mains, beverages..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs border transition-colors focus:outline-none"
            style={{
              backgroundColor: isDark ? '#1e293b' : '#f8fafc',
              borderColor: theme.colors.border,
              color: theme.colors.textPrimary,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dietary Filters */}
        <div
          className="flex items-center p-1 rounded-xl border shrink-0"
          style={{
            backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
            borderColor: theme.colors.border,
          }}
        >
          <button
            onClick={() => onVegFilterChange(null)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              vegOnlyFilter === null
                ? isDark
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onVegFilterChange(true)}
            className={`px-2 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              vegOnlyFilter === true
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-emerald-600'
            }`}
          >
            <VegBadge isVeg={true} size="sm" />
            <span>Veg</span>
          </button>
          <button
            onClick={() => onVegFilterChange(false)}
            className={`px-2 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              vegOnlyFilter === false
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-slate-500 hover:text-red-700'
            }`}
          >
            <VegBadge isVeg={false} size="sm" />
            <span>Non-Veg</span>
          </button>
        </div>
      </div>

      {/* Dynamic Categories Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => onSelectCategory('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
            selectedCategoryId === 'ALL'
              ? isDark
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-emerald-600 text-white shadow-xs'
              : isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All Items
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? isDark
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-emerald-600 text-white shadow-xs'
                  : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{cat.icon || '🍽️'}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
