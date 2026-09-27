import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './themes/ThemeProvider.js';
import { RestaurantProvider } from './context/RestaurantContext.js';
import { CartProvider } from './context/CartContext.js';
import { CustomerApp } from './pages/CustomerApp.js';
import { AdminApp } from './pages/AdminApp.js';
import { LauncherPage } from './pages/LauncherPage.js';
import { Home, ChefHat, Smartphone } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'launcher' | 'customer' | 'admin'>('launcher');
  const [targetSlug, setTargetSlug] = useState('verde-botanica');
  const [targetTableId, setTargetTableId] = useState('tbl-verde-01');

  // Parse path on initial load if user navigated with QR deep link
  useEffect(() => {
    const pathname = window.location.pathname;
    const match = pathname.match(/\/restaurant\/([^/]+)\/table\/([^/]+)/);
    if (match) {
      setTargetSlug(match[1]);
      setTargetTableId(match[2]);
      setCurrentView('customer');
    }
  }, []);

  const handleLaunchCustomer = (slug: string, tableId: string) => {
    setTargetSlug(slug);
    setTargetTableId(tableId);
    setCurrentView('customer');
    // Update browser URL without reloading
    window.history.pushState({}, '', `/restaurant/${slug}/table/${tableId}`);
  };

  const handleLaunchAdmin = () => {
    setCurrentView('admin');
    window.history.pushState({}, '', '/admin');
  };

  const handleLaunchHome = () => {
    setCurrentView('launcher');
    window.history.pushState({}, '', '/');
  };

  return (
    <RestaurantProvider>
      <CartProvider restaurantSlug={targetSlug}>
        <ThemeProvider>
          <div className="relative min-h-screen">
            {/* Global Quick Navigation Switcher Floating Pill */}
            <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 p-1.5 bg-slate-950/90 text-white rounded-full border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs">
              <button
                onClick={handleLaunchHome}
                className={`p-2 rounded-full transition-all cursor-pointer ${
                  currentView === 'launcher'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Simulation Launcher & QR Directory"
              >
                <Home className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleLaunchCustomer(targetSlug, targetTableId)}
                className={`px-3 py-1.5 rounded-full font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'customer'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Customer Table View"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Customer App</span>
              </button>

              <button
                onClick={handleLaunchAdmin}
                className={`px-3 py-1.5 rounded-full font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Admin & Kitchen KDS"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin KDS</span>
              </button>
            </div>

            {/* View Router */}
            {currentView === 'launcher' && (
              <LauncherPage
                onSelectCustomerFlow={handleLaunchCustomer}
                onSelectAdminFlow={handleLaunchAdmin}
              />
            )}

            {currentView === 'customer' && (
              <CustomerApp
                restaurantSlug={targetSlug}
                tableId={targetTableId}
                onSwitchToAdmin={handleLaunchAdmin}
              />
            )}

            {currentView === 'admin' && (
              <AdminApp
                onOpenCustomerView={(slug, tableId) => handleLaunchCustomer(slug, tableId)}
              />
            )}
          </div>
        </ThemeProvider>
      </CartProvider>
    </RestaurantProvider>
  );
}
