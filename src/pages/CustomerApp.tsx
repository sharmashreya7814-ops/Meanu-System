import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  Clock,
  Search,
  User,
  UtensilsCrossed,
  Layers,
  ArrowRight,
  Sparkles,
  Phone,
  RefreshCw,
  SlidersHorizontal,
  AlertTriangle,
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext.js';
import { useCart } from '../context/CartContext.js';
import { useTheme } from '../themes/ThemeProvider.js';
import { Category, MenuItem, Order } from '../types/index.js';
import { api } from '../services/api.js';

import { ThemeSwitcherBar } from '../components/customer/ThemeSwitcherBar.js';
import { WelcomeScreen } from '../components/customer/WelcomeScreen.js';
import { CustomerForm } from '../components/customer/CustomerForm.js';
import { CategoryNav } from '../components/customer/CategoryNav.js';
import { MenuItemCard } from '../components/customer/MenuItemCard.js';
import { FoodDetailModal } from '../components/customer/FoodDetailModal.js';
import { CartDrawer } from '../components/customer/CartDrawer.js';
import { OrderConfirmation } from '../components/customer/OrderConfirmation.js';
import { OrderStatusView } from '../components/customer/OrderStatusView.js';
import { DigitalBillView } from '../components/customer/DigitalBillView.js';

type CustomerStep =
  | 'customer_form'
  | 'welcome'
  | 'menu'
  | 'order_confirmation'
  | 'order_status'
  | 'bill';

interface CustomerAppProps {
  restaurantSlug: string;
  tableId: string;
  initialBillNumber?: string;
  onSwitchToAdmin?: () => void;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({
  restaurantSlug,
  tableId,
  initialBillNumber,
  onSwitchToAdmin,
}) => {
  const {
    restaurant,
    table,
    customer,
    loading,
    error,
    loadTableSession,
    activeOrderNumber,
    setActiveOrderNumber,
  } = useRestaurant();

  const { theme, isDark, getCardClasses, getButtonClasses } = useTheme();
  const {
    totalItemCount,
    totalAmount,
    setIsCartOpen,
    selectedFoodDetail,
    setSelectedFoodDetail,
  } = useCart();

  const [step, setStep] = useState<CustomerStep>(initialBillNumber ? 'bill' : 'customer_form');
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegFilter, setVegFilter] = useState<boolean | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [currentBillNumber, setCurrentBillNumber] = useState<string | undefined>(initialBillNumber);

  // Load table session on mount or slug change
  useEffect(() => {
    loadTableSession(restaurantSlug, tableId);
  }, [restaurantSlug, tableId]);

  // Adjust step based on session state once loaded
  useEffect(() => {
    if (initialBillNumber) {
      setStep('bill');
    } else if (activeOrderNumber) {
      setStep('order_status');
    } else if (customer) {
      setStep('welcome');
    } else {
      setStep('customer_form');
    }
  }, [customer?.id, activeOrderNumber, initialBillNumber]);

  // Load menu items & categories when restaurant is loaded
  useEffect(() => {
    if (restaurant) {
      api.getCategories(restaurant.slug).then(setCategories).catch(console.error);
      api.getMenuItems(restaurant.slug).then(setMenuItems).catch(console.error);
    }
  }, [restaurant?.slug]);

  if (loading && !restaurant) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <RefreshCw
            className="w-8 h-8 animate-spin mx-auto"
            style={{ color: theme.colors.primary }}
          />
          <p className="text-xs font-mono text-slate-400">
            Identifying table QR session...
          </p>
        </div>
      </div>
    );
  }

  // Proper customer-facing error page when restaurant or table not found
  if (error || !restaurant || !table) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Restaurant or table not found.</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The scanned QR code or table link is invalid or inactive. Please scan the QR code located on your dining table or request assistance from the restaurant host.
          </p>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Filter items by category, search text, and veg filter
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategoryId === 'ALL' || item.categoryId === selectedCategoryId;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVeg =
      vegFilter === null || item.isVeg === vegFilter;
    return matchesCategory && matchesSearch && matchesVeg;
  });

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-300"
      style={{
        backgroundColor: theme.colors.bgPrimary,
        color: theme.colors.textPrimary,
      }}
    >
      {/* Top Dynamic Theme Switcher Bar for reviewer demonstration */}
      <ThemeSwitcherBar />

      {/* Screen Renderings: Step Sequence */}
      {step === 'customer_form' && (
        <CustomerForm
          onSuccess={() => setStep('welcome')}
          onBack={customer ? () => setStep('welcome') : undefined}
        />
      )}

      {step === 'welcome' && (
        <WelcomeScreen
          onContinue={() => setStep('menu')}
        />
      )}

      {step === 'order_confirmation' && placedOrder && (
        <OrderConfirmation
          order={placedOrder}
          onTrackOrder={() => {
            setActiveOrderNumber(placedOrder.orderNumber);
            setStep('order_status');
          }}
          onOrderMore={() => setStep('menu')}
        />
      )}

      {step === 'order_status' && (
        <OrderStatusView
          orderNumber={activeOrderNumber || placedOrder?.orderNumber || 'ORD-20260927-1000'}
          onBackToMenu={() => setStep('menu')}
          onViewDigitalBill={(ordNum) => {
            // Push browser history for seamless sharing / bookmarking
            api.generateBill(restaurantSlug, ordNum)
              .then((generatedBill) => {
                setCurrentBillNumber(generatedBill.billNumber);
                setStep('bill');
                window.history.pushState({}, '', `/restaurant/${restaurantSlug}/bill/${generatedBill.billNumber}`);
              })
              .catch((err) => {
                alert(err.message || 'Could not generate digital bill');
              });
          }}
        />
      )}

      {step === 'bill' && (
        <DigitalBillView
          restaurantSlug={restaurantSlug}
          billNumber={currentBillNumber}
          orderNumber={activeOrderNumber || placedOrder?.orderNumber}
          onBackToOrderStatus={() => setStep('order_status')}
          onBackToMenu={() => setStep('menu')}
        />
      )}

      {step === 'menu' && (
        <div className="flex-1 flex flex-col pb-24 max-w-4xl mx-auto w-full">
          {/* Header Bar */}
          <header
            className="px-4 py-3 border-b flex items-center justify-between"
            style={{ borderColor: theme.colors.border }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{restaurant.logoUrl || '🍽️'}</span>
              <div>
                <h1
                  className="font-bold text-base leading-tight"
                  style={{
                    fontFamily: theme.typography.headingFont,
                    color: theme.colors.textPrimary,
                  }}
                >
                  {restaurant.name}
                </h1>
                <div className="flex items-center gap-1.5 text-[11px]" style={{ color: theme.colors.textMuted }}>
                  <span className="font-mono font-semibold">Table {table.tableNumber}</span>
                  {customer && (
                    <>
                      <span aria-hidden="true">·</span>
                      <button
                        onClick={() => setStep('customer_form')}
                        className="hover:underline text-left cursor-pointer"
                        title="Click to edit guest info"
                      >
                        {customer.name}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeOrderNumber && (
                <button
                  onClick={() => setStep('order_status')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs border ${
                    isDark
                      ? 'bg-orange-950/60 text-orange-300 border-orange-800/80 hover:bg-orange-950'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                  }`}
                >
                  <Clock
                    className={`w-3.5 h-3.5 animate-pulse ${
                      isDark ? 'text-orange-400' : 'text-emerald-600'
                    }`}
                  />
                  <span>Track Order</span>
                </button>
              )}
            </div>
          </header>

          {/* Dynamic Category Navigation & Filters */}
          <CategoryNav
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            vegOnlyFilter={vegFilter}
            onVegFilterChange={setVegFilter}
          />

          {/* Menu Items Grid */}
          <main className="p-4 flex-1">
            {filteredMenuItems.length === 0 ? (
              <div className="p-12 text-center text-xs" style={{ color: theme.colors.textMuted }}>
                No food items match your criteria. Try clearing search or dietary filters.
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4"
              >
                <AnimatePresence>
                  {filteredMenuItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      currencySymbol={restaurant.currencySymbol}
                      onOpenDetails={(it) => setSelectedFoodDetail(it)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </main>

          {/* Sticky Bottom Cart Bar (if items in cart) */}
          {totalItemCount > 0 && (
            <div className="fixed bottom-0 inset-x-0 p-3 z-40 max-w-lg mx-auto">
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onClick={() => setIsCartOpen(true)}
                className={`w-full py-3.5 px-5 text-xs font-semibold flex items-center justify-between shadow-2xl rounded-2xl cursor-pointer ${
                  isDark
                    ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-950/50'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                    {totalItemCount}
                  </span>
                  <span>View Table Cart</span>
                </div>

                <div className="flex items-center gap-2 font-mono font-bold text-sm">
                  <span>
                    {restaurant.currencySymbol}
                    {totalAmount.toFixed(2)}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* Food Details Modal */}
      <FoodDetailModal
        item={selectedFoodDetail}
        currencySymbol={restaurant.currencySymbol}
        onClose={() => setSelectedFoodDetail(null)}
      />

      {/* Cart Slide-Over Drawer */}
      <CartDrawer
        onOrderPlaced={(newOrder) => {
          setPlacedOrder(newOrder);
          setActiveOrderNumber(newOrder.orderNumber);
          setStep('order_confirmation');
        }}
      />
    </div>
  );
};
