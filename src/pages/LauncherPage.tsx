import React, { useEffect, useState } from 'react';
import {
  QrCode,
  ChefHat,
  Leaf,
  Flame,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Layers,
  Sparkles,
  UtensilsCrossed,
  Users,
} from 'lucide-react';
import { Restaurant, Table } from '../types/index.js';
import { api } from '../services/api.js';

interface LauncherPageProps {
  onSelectCustomerFlow: (restaurantSlug: string, tableId: string) => void;
  onSelectAdminFlow: () => void;
}

export const LauncherPage: React.FC<LauncherPageProps> = ({
  onSelectCustomerFlow,
  onSelectAdminFlow,
}) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [tablesMap, setTablesMap] = useState<Record<string, Table[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const rests = await api.getAllRestaurants();
        setRestaurants(rests);

        const tblMap: Record<string, Table[]> = {};
        for (const r of rests) {
          const tList = await api.getAdminTables(r.id);
          tblMap[r.id] = tList;
        }
        setTablesMap(tblMap);
      } catch (e) {
        console.error('Failed to load launcher data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="text-center space-y-3 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-mono font-semibold">
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Digital Ordering Platform · MVP Foundation</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Scan & Dine Architecture
          </h1>

          <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Multi-tenant, theme-configurable contactless dining web application with instant QR table dispatch, live kitchen display, and server-side verified pricing.
          </p>
        </div>

        {/* Quick Launch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Restaurant 1: Verde Botanica (VEG_THEME) */}
          <div className="bg-slate-900 border border-emerald-800/60 rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Leaf className="w-32 h-32 text-emerald-400" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">🌿</span>
                  <div>
                    <h2 className="text-lg font-bold text-white">Verde Botanica</h2>
                    <span className="text-[11px] font-mono text-emerald-400">
                      Preset: VEG_THEME (Fresh & Elegant)
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Organic / Veg
                </span>
              </div>

              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Light emerald color palette, classic Fraunces serif typography, crisp card geometry, and pure plant-based menu items.
              </p>

              {/* Table Buttons */}
              <div className="space-y-2 mb-6">
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                  Simulate QR Table Scan:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(tablesMap['rest-verde-01'] || []).slice(0, 4).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onSelectCustomerFlow('verde-botanica', t.id)}
                      className="p-3 bg-slate-950 hover:bg-emerald-900/40 border border-slate-800 hover:border-emerald-600 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-white">
                          Table {t.tableNumber}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {t.tableName || 'Seating'}
                        </div>
                      </div>
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectCustomerFlow('verde-botanica', 'tbl-verde-01')}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-950/50"
            >
              <span>Launch Customer Menu (Table 1)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Restaurant 2: The Ember & Smokehouse (NON_VEG_THEME) */}
          <div className="bg-slate-900 border border-orange-800/60 rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Flame className="w-32 h-32 text-orange-400" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">🔥</span>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      The Ember & Smokehouse
                    </h2>
                    <span className="text-[11px] font-mono text-orange-400">
                      Preset: NON_VEG_THEME (Warm & Dark)
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-950 text-orange-300 border border-orange-800">
                  Artisan Grill
                </span>
              </div>

              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Deep charcoal theme, warm amber glows, modern Syne typography, glassmorphism cards, and wood-fired BBQ showcase items.
              </p>

              {/* Table Buttons */}
              <div className="space-y-2 mb-6">
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                  Simulate QR Table Scan:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(tablesMap['rest-ember-02'] || []).slice(0, 4).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onSelectCustomerFlow('ember-smokehouse', t.id)}
                      className="p-3 bg-slate-950 hover:bg-orange-900/40 border border-slate-800 hover:border-orange-600 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-white">
                          Table {t.tableNumber}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {t.tableName || 'Seating'}
                        </div>
                      </div>
                      <Smartphone className="w-4 h-4 text-orange-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectCustomerFlow('ember-smokehouse', 'tbl-ember-01')}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-orange-950/50"
            >
              <span>Launch Customer Menu (Table 1)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Admin & Kitchen Portal Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-800/60">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Admin Dashboard & Kitchen KDS Display
              </h3>
              <p className="text-xs text-slate-400">
                Manage live kitchen tickets, manage table seating, generate & print printable QR flyers, and edit menus.
              </p>
            </div>
          </div>

          <button
            onClick={onSelectAdminFlow}
            className="w-full md:w-auto py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-lg shadow-indigo-950/50"
          >
            <span>Open Restaurant Admin</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Technical Architecture Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Server-Side Verified Prices
            </div>
            <p className="text-[11px] leading-relaxed">
              Order calculations strictly resolve menu item prices on the backend, preventing client-side price tampering.
            </p>
          </div>

          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-400" /> Multi-Tenant Top Level
            </div>
            <p className="text-[11px] leading-relaxed">
              Restaurant acts as the top-level tenant in Prisma models, allowing multi-location operations.
            </p>
          </div>

          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Decoupled Theming
            </div>
            <p className="text-[11px] leading-relaxed">
              Zero hardcoded component styles; theme tokens dynamically configure cards, buttons, fonts, and animation physics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
