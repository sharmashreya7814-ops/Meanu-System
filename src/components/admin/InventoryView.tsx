import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ChefHat,
  Clock,
  DollarSign,
  Edit2,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Package,
  PackageCheck,
  PackagePlus,
  PackageX,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  TrendingDown,
  Truck,
  Users,
  UtensilsCrossed,
  X,
  Zap,
} from 'lucide-react';
import {
  CreateIngredientDTO,
  CreatePurchaseDTO,
  CreateRecipeDTO,
  CreateStockAdjustmentDTO,
  CreateStockCountDTO,
  CreateSupplierDTO,
  CreateWastageDTO,
  Ingredient,
  IngredientCategory,
  IngredientUnit,
  InventoryDashboardResponse,
  MenuItem,
  Purchase,
  Recipe,
  Restaurant,
  StockMovement,
  StockMovementType,
  StockStatus,
  Supplier,
  UpdateIngredientDTO,
  UpdateRecipeDTO,
  UpdateSupplierDTO,
  WastageReason,
  WastageRecord,
} from '../../types/index.js';
import { api } from '../../services/api.js';
import { formatCurrency } from '../../utils/formatters.js';

interface InventoryViewProps {
  restaurant: Restaurant;
}

type SubTab =
  | 'overview'
  | 'ingredients'
  | 'recipes'
  | 'purchases'
  | 'movements'
  | 'wastage'
  | 'suppliers';

const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  'VEGETABLE',
  'FRUIT',
  'GRAIN',
  'DAIRY',
  'MEAT',
  'SEAFOOD',
  'SPICE',
  'OIL',
  'BEVERAGE',
  'PACKAGING',
  'OTHER',
];

const INGREDIENT_UNITS: IngredientUnit[] = [
  'KILOGRAM',
  'GRAM',
  'LITER',
  'MILLILITER',
  'PIECE',
  'PACK',
  'BOTTLE',
  'BOX',
  'OTHER',
];

const WASTAGE_REASONS: WastageReason[] = [
  'SPOILAGE',
  'KITCHEN_ERROR',
  'DAMAGED',
  'EXPIRED',
  'OVERPRODUCTION',
  'OTHER',
];

export const InventoryView: React.FC<InventoryViewProps> = ({ restaurant }) => {
  const [activeTab, setActiveTab] = useState<SubTab>('overview');
  const [dashboard, setDashboard] = useState<InventoryDashboardResponse | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [wastageRecords, setWastageRecords] = useState<WastageRecord[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filters
  const [ingredientCategoryFilter, setIngredientCategoryFilter] = useState('ALL');
  const [ingredientStatusFilter, setIngredientStatusFilter] = useState('ALL');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');
  const [wastageReasonFilter, setWastageReasonFilter] = useState<string>('ALL');

  // Modals state
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [showStockAuditModal, setShowStockAuditModal] = useState<Ingredient | null>(null);
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showAddPurchaseModal, setShowAddPurchaseModal] = useState(false);
  const [showAddWastageModal, setShowAddWastageModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [ingredientForm, setIngredientForm] = useState<CreateIngredientDTO>({
    restaurantId: restaurant.id,
    name: '',
    sku: '',
    unit: 'KILOGRAM',
    category: 'VEGETABLE',
    currentStock: 0,
    minimumStock: 2,
    reorderLevel: 5,
    costPerUnit: 0,
  });

  const [stockAuditForm, setStockAuditForm] = useState<{ physicalStock: number; notes: string }>({
    physicalStock: 0,
    notes: '',
  });

  const [recipeForm, setRecipeForm] = useState<{
    menuItemId: string;
    name: string;
    yieldQuantity: number;
    yieldUnit: string;
    instructions: string;
    ingredients: Array<{ ingredientId: string; quantity: number; unit: IngredientUnit }>;
  }>({
    menuItemId: '',
    name: '',
    yieldQuantity: 1,
    yieldUnit: 'PORTION',
    instructions: '',
    ingredients: [{ ingredientId: '', quantity: 0.1, unit: 'KILOGRAM' }],
  });

  const [purchaseForm, setPurchaseForm] = useState<{
    supplierId: string;
    invoiceNumber: string;
    purchaseDate: string;
    notes: string;
    items: Array<{ ingredientId: string; quantity: number; unit: IngredientUnit; unitCost: number }>;
  }>({
    supplierId: '',
    invoiceNumber: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
    notes: '',
    items: [{ ingredientId: '', quantity: 1, unit: 'KILOGRAM', unitCost: 100 }],
  });

  const [wastageForm, setWastageForm] = useState<CreateWastageDTO>({
    restaurantId: restaurant.id,
    ingredientId: '',
    quantity: 1,
    reason: 'SPOILAGE',
    notes: '',
  });

  const [supplierForm, setSupplierForm] = useState<CreateSupplierDTO>({
    restaurantId: restaurant.id,
    name: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    notes: '',
  });

  const notifySuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const notifyError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 5000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dashData, ingData, recData, purData, movData, wstData, supData, menuData] =
        await Promise.all([
          api.getInventoryDashboard(restaurant.id),
          api.getAdminIngredients(restaurant.id),
          api.getAdminRecipes(restaurant.id),
          api.getAdminPurchases(restaurant.id),
          api.getAdminStockMovements(restaurant.id),
          api.getAdminWastage(restaurant.id),
          api.getAdminSuppliers(restaurant.id),
          api.getMenuItems(restaurant.slug),
        ]);

      setDashboard(dashData);
      setIngredients(ingData);
      setRecipes(recData);
      setPurchases(purData);
      setMovements(movData);
      setWastageRecords(wstData);
      setSuppliers(supData);
      setMenuItems(menuData);
    } catch (err: any) {
      notifyError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [restaurant.id]);

  // Handlers for Ingredients
  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingIngredient) {
        await api.updateAdminIngredient(editingIngredient.id, restaurant.id, {
          name: ingredientForm.name,
          sku: ingredientForm.sku,
          unit: ingredientForm.unit,
          category: ingredientForm.category,
          costPerUnit: ingredientForm.costPerUnit,
          minimumStock: ingredientForm.minimumStock,
          reorderLevel: ingredientForm.reorderLevel,
          currentStock: ingredientForm.currentStock,
        });
        notifySuccess(`Ingredient "${ingredientForm.name}" updated successfully.`);
      } else {
        await api.createAdminIngredient({
          ...ingredientForm,
          restaurantId: restaurant.id,
        });
        notifySuccess(`New ingredient "${ingredientForm.name}" created.`);
      }
      setShowAddIngredientModal(false);
      setEditingIngredient(null);
      loadAllData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to save ingredient');
    }
  };

  const handleDeleteIngredient = async (ing: Ingredient) => {
    if (!confirm(`Are you sure you want to deactivate "${ing.name}"?`)) return;
    try {
      await api.deleteAdminIngredient(ing.id, restaurant.id);
      notifySuccess(`Ingredient "${ing.name}" deactivated.`);
      loadAllData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to delete ingredient');
    }
  };

  const handleStockReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showStockAuditModal) return;
    try {
      await api.reconcileAdminStockCount({
        restaurantId: restaurant.id,
        ingredientId: showStockAuditModal.id,
        physicalStock: stockAuditForm.physicalStock,
        notes: stockAuditForm.notes,
      });
      notifySuccess(`Stock count reconciled for "${showStockAuditModal.name}".`);
      setShowStockAuditModal(null);
      loadAllData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to reconcile stock count');
    }
  };

  // Handlers for Recipes
  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validIngredients = recipeForm.ingredients.filter(
        (i) => i.ingredientId && i.quantity > 0,
      );
      if (validIngredients.length === 0) {
        notifyError('Please add at least one valid ingredient to the recipe.');
        return;
      }

      if (editingRecipe) {
        await api.updateAdminRecipe(editingRecipe.id, restaurant.id, {
          name: recipeForm.name,
          yieldQuantity: recipeForm.yieldQuantity,
          yieldUnit: recipeForm.yieldUnit,
          instructions: recipeForm.instructions,
          ingredients: validIngredients,
        });
        notifySuccess(`Recipe updated successfully.`);
      } else {
        await api.createAdminRecipe({
          restaurantId: restaurant.id,
          menuItemId: recipeForm.menuItemId,
          name: recipeForm.name,
          yieldQuantity: recipeForm.yieldQuantity,
          yieldUnit: recipeForm.yieldUnit,
          instructions: recipeForm.instructions,
          ingredients: validIngredients,
        });
        notifySuccess(`New recipe created and linked.`);
      }
      setShowAddRecipeModal(false);
      setEditingRecipe(null);
      loadAllData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to save recipe');
    }
  };

  const handleSyncRecipeCost = async (rec: Recipe) => {
    try {
      await api.syncAdminRecipeCost(rec.id, restaurant.id);
      notifySuccess(
        `Cost Price synchronized: Updated menu item cost to ₹${rec.estimatedCost.toFixed(2)} for future sales.`,
      );
      loadAllData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to sync recipe cost');
    }
  };

  const handleDeleteRecipe = async (rec: Recipe) => {
    if (!confirm(`Are you sure you want to remove recipe for "${rec.name}"?`)) return;
    try {
      await api.deleteAdminRecipe(rec.id, restaurant.id);
      notifySuccess('Recipe removed.');
      loadAllData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to delete recipe');
    }
  };

  // Handlers for Purchases
  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validItems = purchaseForm.items.filter(
        (it) => it.ingredientId && it.quantity > 0 && it.unitCost >= 0,
      );
      if (validItems.length === 0) {
        notifyError('Please add at least one line item with positive quantity.');
        return;
      }

      await api.createAdminPurchase({
        restaurantId: restaurant.id,
        supplierId: purchaseForm.supplierId || undefined,
        invoiceNumber: purchaseForm.invoiceNumber || undefined,
        purchaseDate: purchaseForm.purchaseDate ? new Date(purchaseForm.purchaseDate).toISOString() : undefined,
        notes: purchaseForm.notes,
        items: validItems,
      });

      notifySuccess('Stock-In & Purchase recorded! Ingredient stock updated automatically.');
      setShowAddPurchaseModal(false);
      loadAllData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to record purchase');
    }
  };

  // Handlers for Wastage
  const handleSaveWastage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!wastageForm.ingredientId || wastageForm.quantity <= 0) {
        notifyError('Please select an ingredient and valid wastage quantity.');
        return;
      }

      await api.createAdminWastage({
        ...wastageForm,
        restaurantId: restaurant.id,
      });

      notifySuccess('Wastage logged and stock deducted.');
      setShowAddWastageModal(false);
      loadAllData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to record wastage');
    }
  };

  // Handlers for Suppliers
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.updateAdminSupplier(editingSupplier.id, restaurant.id, supplierForm);
        notifySuccess(`Supplier "${supplierForm.name}" updated.`);
      } else {
        await api.createAdminSupplier(supplierForm);
        notifySuccess(`Supplier "${supplierForm.name}" created.`);
      }
      setShowAddSupplierModal(false);
      setEditingSupplier(null);
      loadAllData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to save supplier');
    }
  };

  const handleDeleteSupplier = async (sup: Supplier) => {
    if (!confirm(`Are you sure you want to deactivate "${sup.name}"?`)) return;
    try {
      await api.deleteAdminSupplier(sup.id, restaurant.id);
      notifySuccess(`Supplier "${sup.name}" deactivated.`);
      loadAllData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to delete supplier');
    }
  };

  // Filtered ingredients
  const filteredIngredients = ingredients.filter((ing) => {
    if (ingredientCategoryFilter !== 'ALL' && ing.category !== ingredientCategoryFilter) return false;
    if (ingredientStatusFilter !== 'ALL' && ing.stockStatus !== ingredientStatusFilter) return false;
    if (ingredientSearch.trim()) {
      const q = ingredientSearch.toLowerCase();
      if (!ing.name.toLowerCase().includes(q) && !(ing.sku && ing.sku.toLowerCase().includes(q))) {
        return false;
      }
    }
    return true;
  });

  // Filtered movements
  const filteredMovements = movements.filter((m) => {
    if (movementTypeFilter !== 'ALL' && m.movementType !== movementTypeFilter) return false;
    return true;
  });

  // Filtered wastage
  const filteredWastage = wastageRecords.filter((w) => {
    if (wastageReasonFilter !== 'ALL' && w.reason !== wastageReasonFilter) return false;
    return true;
  });

  const getStatusBadge = (status: StockStatus) => {
    switch (status) {
      case 'IN_STOCK':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-md">
            <PackageCheck className="w-3 h-3" /> In Stock
          </span>
        );
      case 'LOW_STOCK':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-md animate-pulse">
            <AlertTriangle className="w-3 h-3" /> Low Stock
          </span>
        );
      case 'OUT_OF_STOCK':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2 py-0.5 rounded-md">
            <PackageX className="w-3 h-3" /> Out of Stock
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Notifications */}
      {actionSuccess && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900/90 text-emerald-100 border border-emerald-600 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-md text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="fixed top-5 right-5 z-50 bg-rose-900/90 text-rose-100 border border-rose-600 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-md text-sm">
          <AlertTriangle className="w-4 h-4 text-rose-300" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
              <Boxes className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Inventory, Recipes & Stock Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time stock tracking, recipe-driven consumption, low stock alerts, and automated COGS support for{' '}
            <span className="text-slate-200 font-semibold">{restaurant.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setPurchaseForm({
                supplierId: suppliers[0]?.id || '',
                invoiceNumber: '',
                purchaseDate: new Date().toISOString().slice(0, 10),
                notes: '',
                items: [
                  {
                    ingredientId: ingredients[0]?.id || '',
                    quantity: 10,
                    unit: ingredients[0]?.unit || 'KILOGRAM',
                    unitCost: ingredients[0]?.costPerUnit || 100,
                  },
                ],
              });
              setShowAddPurchaseModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-xs"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Stock-In / Purchase</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-800 scrollbar-none">
        {[
          { id: 'overview', label: 'Dashboard & Alerts', icon: Layers, count: dashboard?.lowStockCount ? `${dashboard.lowStockCount + dashboard.outOfStockCount} Alerts` : undefined },
          { id: 'ingredients', label: 'Ingredients & Stock Levels', icon: Boxes, count: ingredients.length },
          { id: 'recipes', label: 'Recipe Engineering', icon: ChefHat, count: recipes.length },
          { id: 'purchases', label: 'Purchases & Invoices', icon: ShoppingCart, count: purchases.length },
          { id: 'movements', label: 'Stock Movement Ledger', icon: FileText, count: movements.length },
          { id: 'wastage', label: 'Wastage Logs', icon: Trash2, count: wastageRecords.length },
          { id: 'suppliers', label: 'Suppliers Directory', icon: Truck, count: suppliers.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SubTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-sm ${
                    tab.id === 'overview' && dashboard && (dashboard.lowStockCount > 0 || dashboard.outOfStockCount > 0)
                      ? 'bg-amber-950 text-amber-300 border border-amber-800/80 font-bold'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================
          TAB 1: DASHBOARD & ALERTS
         ======================================================== */}
      {activeTab === 'overview' && dashboard && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Inventory Value</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-2 font-mono">
                {formatCurrency(dashboard.totalInventoryValue)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Current asset valuation on-hand
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Tracked Ingredients</span>
                <Boxes className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-2 font-mono">
                {dashboard.totalIngredients}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Active stock items</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Low / Out of Stock</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl sm:text-2xl font-bold text-amber-400 font-mono">
                  {dashboard.lowStockCount}
                </span>
                <span className="text-xs text-slate-500">Low</span>
                <span className="text-xl sm:text-2xl font-bold text-rose-400 font-mono ml-2">
                  {dashboard.outOfStockCount}
                </span>
                <span className="text-xs text-slate-500">Empty</span>
              </div>
              <span className="text-[11px] text-amber-500/80 mt-1 block">Requires supplier reorder</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Purchases Recorded</span>
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-2 font-mono">
                {formatCurrency(dashboard.purchasesThisPeriod)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Stock replenishments</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Wastage & Loss</span>
                <Trash2 className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-rose-300 mt-2 font-mono">
                {formatCurrency(dashboard.wastageThisPeriod)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Spoilage & kitchen errors</span>
            </div>
          </div>

          {/* Low Stock Alerts Attention Banner */}
          {dashboard.lowStockAlerts.length > 0 && (
            <div className="bg-amber-950/30 border border-amber-800/60 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-bold text-sm sm:text-base">
                    Critical Stock Reorder Alerts ({dashboard.lowStockAlerts.length} items)
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('purchases')}
                  className="text-xs text-amber-300 underline hover:text-amber-200 cursor-pointer"
                >
                  Create Purchase Order →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {dashboard.lowStockAlerts.map((ing) => (
                  <div
                    key={ing.id}
                    className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-xs text-white">{ing.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Stock: <span className="font-bold text-amber-400">{ing.currentStock} {ing.unit}</span> (Min: {ing.minimumStock})
                      </div>
                    </div>
                    {getStatusBadge(ing.stockStatus)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Purchased & Top Wasted Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Purchased */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4 text-white font-bold text-sm">
                <PackageCheck className="w-4 h-4 text-emerald-400" />
                <span>Top Purchased Ingredients by Cost</span>
              </div>
              <div className="space-y-2">
                {dashboard.topPurchased.length === 0 ? (
                  <div className="text-xs text-slate-500 py-4 text-center">No purchases recorded yet</div>
                ) : (
                  dashboard.topPurchased.map((item, idx) => (
                    <div
                      key={item.ingredientId}
                      className="flex items-center justify-between text-xs py-2 px-3 bg-slate-900/60 rounded-xl border border-slate-800/80"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500">#{idx + 1}</span>
                        <span className="font-medium text-slate-200">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white font-mono">{formatCurrency(item.totalCost)}</span>
                        <span className="text-[10px] text-slate-400 block">{item.quantity} {item.unit}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Wasted */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4 text-white font-bold text-sm">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Top Wastage Losses</span>
              </div>
              <div className="space-y-2">
                {dashboard.topWasted.length === 0 ? (
                  <div className="text-xs text-slate-500 py-4 text-center">No wastage recorded (0.00 loss)</div>
                ) : (
                  dashboard.topWasted.map((item, idx) => (
                    <div
                      key={item.ingredientId}
                      className="flex items-center justify-between text-xs py-2 px-3 bg-slate-900/60 rounded-xl border border-slate-800/80"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500">#{idx + 1}</span>
                        <span className="font-medium text-slate-200">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-rose-300 font-mono">{formatCurrency(item.totalCost)}</span>
                        <span className="text-[10px] text-slate-400 block">{item.quantity} {item.unit}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent Movement Feed */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Recent Stock Activity Audit Trail</span>
              </div>
              <button
                onClick={() => setActiveTab('movements')}
                className="text-xs text-emerald-400 hover:underline cursor-pointer"
              >
                View Full Movement Ledger →
              </button>
            </div>

            <div className="divide-y divide-slate-800/80">
              {dashboard.recentMovements.slice(0, 6).map((m) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className={`p-1.5 rounded-lg ${
                        m.quantity > 0
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {m.quantity > 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-200">
                        {m.ingredientName}
                        <span className="text-[10px] text-slate-400 font-normal ml-2">
                          ({m.movementType})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">{m.notes}</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className={m.quantity > 0 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(m.movementDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: INGREDIENTS & STOCK LEVELS
         ======================================================== */}
      {activeTab === 'ingredients' && (
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search ingredient or SKU..."
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={ingredientCategoryFilter}
                onChange={(e) => setIngredientCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {INGREDIENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Stock Status Filter */}
              <select
                value={ingredientStatusFilter}
                onChange={(e) => setIngredientStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Stock Statuses</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingIngredient(null);
                setIngredientForm({
                  restaurantId: restaurant.id,
                  name: '',
                  sku: '',
                  unit: 'KILOGRAM',
                  category: 'VEGETABLE',
                  currentStock: 10,
                  minimumStock: 2,
                  reorderLevel: 5,
                  costPerUnit: 50,
                });
                setShowAddIngredientModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer self-end md:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Ingredient</span>
            </button>
          </div>

          {/* Ingredients Table */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <th className="py-3 px-4">Ingredient & SKU</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Current Stock</th>
                    <th className="py-3 px-3 text-right">Reorder Level</th>
                    <th className="py-3 px-3 text-right">Unit Cost</th>
                    <th className="py-3 px-3 text-right">Total Value</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredIngredients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        No ingredients found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredIngredients.map((ing) => (
                      <tr key={ing.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{ing.name}</div>
                          <div className="text-[10px] font-mono text-slate-500">{ing.sku || 'N/A'}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md text-slate-400">
                            {ing.category}
                          </span>
                        </td>
                        <td className="py-3 px-3">{getStatusBadge(ing.stockStatus)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          {ing.currentStock} <span className="text-[10px] font-normal text-slate-400">{ing.unit}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {ing.reorderLevel} {ing.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          {formatCurrency(ing.costPerUnit)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(ing.stockValue)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setShowStockAuditModal(ing);
                                setStockAuditForm({ physicalStock: ing.currentStock, notes: '' });
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 cursor-pointer"
                              title="Audit physical stock count"
                            >
                              Audit / Reconcile
                            </button>
                            <button
                              onClick={() => {
                                setEditingIngredient(ing);
                                setIngredientForm({
                                  restaurantId: restaurant.id,
                                  name: ing.name,
                                  sku: ing.sku || '',
                                  unit: ing.unit,
                                  category: ing.category,
                                  currentStock: ing.currentStock,
                                  minimumStock: ing.minimumStock,
                                  reorderLevel: ing.reorderLevel,
                                  costPerUnit: ing.costPerUnit,
                                });
                                setShowAddIngredientModal(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                              title="Edit Ingredient"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteIngredient(ing)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-rose-400 hover:text-rose-300 cursor-pointer"
                              title="Delete Ingredient"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: RECIPE ENGINEERING
         ======================================================== */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Menu Item Recipes & Cost Calculation</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Formulate ingredient quantities per portion, auto-calculate real-time recipe food costs, and synchronize cost prices.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingRecipe(null);
                setRecipeForm({
                  menuItemId: menuItems[0]?.id || '',
                  name: menuItems[0] ? `Recipe: ${menuItems[0].name}` : '',
                  yieldQuantity: 1,
                  yieldUnit: 'PORTION',
                  instructions: '',
                  ingredients: [
                    {
                      ingredientId: ingredients[0]?.id || '',
                      quantity: 0.2,
                      unit: ingredients[0]?.unit || 'KILOGRAM',
                    },
                  ],
                });
                setShowAddRecipeModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Recipe</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipes.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                No recipes formulated yet. Click "Create Recipe" to start linking menu items to ingredients.
              </div>
            ) : (
              recipes.map((rec) => {
                const menuItem = menuItems.find((m) => m.id === rec.menuItemId);
                const sellingPrice = menuItem?.price || 0;
                const margin = sellingPrice > 0 ? ((sellingPrice - rec.estimatedCost) / sellingPrice) * 100 : 0;
                const isCostInSync = menuItem?.costPrice === rec.estimatedCost;

                return (
                  <div
                    key={rec.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <div className="text-xs font-mono text-emerald-400 uppercase font-semibold">
                            {rec.yieldQuantity} {rec.yieldUnit}
                          </div>
                          <h4 className="font-bold text-sm text-white mt-0.5">{rec.name}</h4>
                          <span className="text-[11px] text-slate-400">
                            Linked: <span className="text-slate-200 font-medium">{rec.menuItemName}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingRecipe(rec);
                              setRecipeForm({
                                menuItemId: rec.menuItemId,
                                name: rec.name,
                                yieldQuantity: rec.yieldQuantity,
                                yieldUnit: rec.yieldUnit,
                                instructions: rec.instructions || '',
                                ingredients: rec.ingredients.map((i) => ({
                                  ingredientId: i.ingredientId,
                                  quantity: i.quantity,
                                  unit: i.unit,
                                })),
                              });
                              setShowAddRecipeModal(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                            title="Edit Recipe"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecipe(rec)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-rose-400 hover:text-rose-300 cursor-pointer"
                            title="Delete Recipe"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Ingredient list */}
                      <div className="py-3 space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-slate-500">
                          Ingredient Components ({rec.ingredients.length})
                        </div>
                        <div className="space-y-1">
                          {rec.ingredients.map((ri) => (
                            <div
                              key={ri.id}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/60"
                            >
                              <span className="text-slate-300 font-medium">{ri.ingredientName}</span>
                              <div className="text-right font-mono">
                                <span className="text-slate-400 text-[11px]">
                                  {ri.quantity} {ri.unit}
                                </span>
                                <span className="text-slate-200 font-semibold ml-2">
                                  {formatCurrency(ri.totalCost || 0)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Cost Analysis */}
                    <div className="pt-3 border-t border-slate-800 mt-2 bg-slate-900/40 p-3 rounded-xl">
                      <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-medium">
                            Recipe Food Cost
                          </span>
                          <span className="font-bold text-white font-mono text-sm">
                            {formatCurrency(rec.estimatedCost)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-medium">
                            Selling Price
                          </span>
                          <span className="font-bold text-white font-mono text-sm">
                            {formatCurrency(sellingPrice)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-medium">
                            Gross Margin
                          </span>
                          <span
                            className={`font-bold font-mono text-sm ${
                              margin >= 65
                                ? 'text-emerald-400'
                                : margin >= 45
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {margin.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Sync to Menu Item Cost Price Button */}
                      <button
                        onClick={() => handleSyncRecipeCost(rec)}
                        className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          isCostInSync
                            ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>
                          {isCostInSync
                            ? 'Synced to Menu Cost Price'
                            : `Sync Recipe Cost (${formatCurrency(rec.estimatedCost)}) to Menu Price`}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: PURCHASES & INVOICES
         ======================================================== */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Stock-In & Purchase Invoices</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every purchase automatically adds stock to ingredients, recalculates weighted average unit cost, and logs ledger movements.
              </p>
            </div>
            <button
              onClick={() => {
                setPurchaseForm({
                  supplierId: suppliers[0]?.id || '',
                  invoiceNumber: '',
                  purchaseDate: new Date().toISOString().slice(0, 10),
                  notes: '',
                  items: [
                    {
                      ingredientId: ingredients[0]?.id || '',
                      quantity: 10,
                      unit: ingredients[0]?.unit || 'KILOGRAM',
                      unitCost: ingredients[0]?.costPerUnit || 100,
                    },
                  ],
                });
                setShowAddPurchaseModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>Record Purchase Order</span>
            </button>
          </div>

          <div className="space-y-3">
            {purchases.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                No purchase records found. Click "Record Purchase Order" to stock in ingredients.
              </div>
            ) : (
              purchases.map((pur) => (
                <div
                  key={pur.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">
                        {pur.invoiceNumber || 'INV-PURCHASE'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        • {new Date(pur.purchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-medium">
                      Supplier: <span className="text-emerald-400">{pur.supplierName || 'Direct Cash Market'}</span>
                    </div>
                    {pur.notes && <div className="text-[11px] text-slate-500">{pur.notes}</div>}
                  </div>

                  {/* Line items summary */}
                  <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                    {pur.items.map((it) => (
                      <span
                        key={it.id}
                        className="text-[11px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md text-slate-300"
                      >
                        {it.ingredientName}: <span className="font-mono text-white">{it.quantity} {it.unit}</span>
                      </span>
                    ))}
                  </div>

                  {/* Total amount */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      Total Invoice
                    </span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">
                      {formatCurrency(pur.totalAmount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: STOCK MOVEMENTS LEDGER
         ======================================================== */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Stock Movements & Audit Ledger</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete immutable transaction ledger of purchases, order consumption deductions, wastage, and manual count audits.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Movement Types</option>
                <option value="PURCHASE">PURCHASE (+)</option>
                <option value="ORDER_CONSUMPTION">ORDER_CONSUMPTION (-)</option>
                <option value="WASTAGE">WASTAGE (-)</option>
                <option value="ADJUSTMENT_IN">ADJUSTMENT_IN (+)</option>
                <option value="ADJUSTMENT_OUT">ADJUSTMENT_OUT (-)</option>
                <option value="INITIAL_STOCK">INITIAL_STOCK</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-3">Ingredient</th>
                    <th className="py-3 px-3">Movement Type</th>
                    <th className="py-3 px-3 text-right">Quantity Delta</th>
                    <th className="py-3 px-3 text-right">Unit Cost</th>
                    <th className="py-3 px-3 text-right">Total Impact</th>
                    <th className="py-3 px-4">Audit Reference & Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 text-xs font-sans">
                        No stock movement records found.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {new Date(m.movementDate).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-3 font-sans font-semibold text-white">
                          {m.ingredientName}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] uppercase px-2 py-0.5 rounded-md font-bold ${
                              m.movementType === 'PURCHASE'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : m.movementType === 'ORDER_CONSUMPTION'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : m.movementType === 'WASTAGE'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-slate-900 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {m.movementType}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-bold ${
                            m.quantity > 0 ? 'text-emerald-400' : 'text-slate-300'
                          }`}
                        >
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400 font-sans">
                          {formatCurrency(m.unitCost)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-white font-sans">
                          {formatCurrency(m.totalCost)}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px] font-sans">
                          {m.notes}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 6: WASTAGE TRACKING
         ======================================================== */}
      {activeTab === 'wastage' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Kitchen Wastage & Spoilage Log</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Track lost inventory by reason (spoilage, kitchen errors, damaged goods) to monitor cost leakage.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={wastageReasonFilter}
                onChange={(e) => setWastageReasonFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Reasons</option>
                {WASTAGE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  setWastageForm({
                    restaurantId: restaurant.id,
                    ingredientId: ingredients[0]?.id || '',
                    quantity: 1,
                    reason: 'SPOILAGE',
                    notes: '',
                  });
                  setShowAddWastageModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Log Wastage</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Ingredient</th>
                    <th className="py-3 px-3">Wastage Reason</th>
                    <th className="py-3 px-3 text-right">Quantity</th>
                    <th className="py-3 px-3 text-right">Unit Cost</th>
                    <th className="py-3 px-3 text-right">Financial Loss</th>
                    <th className="py-3 px-4">Reason & Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredWastage.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                        No wastage records found.
                      </td>
                    </tr>
                  ) : (
                    filteredWastage.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                          {new Date(w.wastageDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-3 font-semibold text-white">{w.ingredientName}</td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-800/80">
                            {w.reason}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-300">
                          {w.quantity} {w.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {formatCurrency(w.costPerUnit)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-400">
                          {formatCurrency(w.totalCost)}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">{w.notes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 7: SUPPLIERS DIRECTORY
         ======================================================== */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Vendor & Supplier Directory</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage commercial suppliers, delivery schedules, contact details, and GST billing identities.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingSupplier(null);
                setSupplierForm({
                  restaurantId: restaurant.id,
                  name: '',
                  phone: '',
                  email: '',
                  address: '',
                  gstNumber: '',
                  notes: '',
                });
                setShowAddSupplierModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Supplier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                No suppliers registered yet.
              </div>
            ) : (
              suppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
                          <Truck className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-white">{sup.name}</h4>
                          {sup.gstNumber && (
                            <span className="text-[10px] font-mono text-slate-500">
                              GST: {sup.gstNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingSupplier(sup);
                            setSupplierForm({
                              restaurantId: restaurant.id,
                              name: sup.name,
                              phone: sup.phone || '',
                              email: sup.email || '',
                              address: sup.address || '',
                              gstNumber: sup.gstNumber || '',
                              notes: sup.notes || '',
                            });
                            setShowAddSupplierModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                          title="Edit Supplier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(sup)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-rose-400 hover:text-rose-300 cursor-pointer"
                          title="Delete Supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1 pt-2">
                      {sup.phone && <div>📞 {sup.phone}</div>}
                      {sup.email && <div>✉️ {sup.email}</div>}
                      {sup.address && <div className="text-slate-400">📍 {sup.address}</div>}
                    </div>

                    {sup.notes && (
                      <div className="p-2.5 bg-slate-900/60 rounded-xl text-[11px] text-slate-400 border border-slate-800/80 mt-2">
                        {sup.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODALS
         ======================================================== */}

      {/* 1. Add / Edit Ingredient Modal */}
      {showAddIngredientModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">
                {editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
              </h3>
              <button
                onClick={() => setShowAddIngredientModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="p-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">Ingredient Name *</label>
                  <input
                    type="text"
                    required
                    value={ingredientForm.name}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                    placeholder="e.g. Fresh Farm Malai Paneer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">SKU / Code (Optional)</label>
                  <input
                    type="text"
                    value={ingredientForm.sku}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, sku: e.target.value })}
                    placeholder="e.g. ING-PAN-01"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Category *</label>
                  <select
                    value={ingredientForm.category}
                    onChange={(e) =>
                      setIngredientForm({
                        ...ingredientForm,
                        category: e.target.value as IngredientCategory,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {INGREDIENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Stock Unit *</label>
                  <select
                    value={ingredientForm.unit}
                    onChange={(e) =>
                      setIngredientForm({
                        ...ingredientForm,
                        unit: e.target.value as IngredientUnit,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {INGREDIENT_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Unit Cost (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={ingredientForm.costPerUnit}
                    onChange={(e) =>
                      setIngredientForm({
                        ...ingredientForm,
                        costPerUnit: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Current Stock *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={ingredientForm.currentStock}
                    onChange={(e) =>
                      setIngredientForm({
                        ...ingredientForm,
                        currentStock: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Reorder Alert Level *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={ingredientForm.reorderLevel}
                    onChange={(e) =>
                      setIngredientForm({
                        ...ingredientForm,
                        reorderLevel: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddIngredientModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                >
                  {editingIngredient ? 'Update Ingredient' : 'Create Ingredient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Stock Count Audit Modal */}
      {showStockAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">
                Audit Physical Stock: {showStockAuditModal.name}
              </h3>
              <button
                onClick={() => setShowStockAuditModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStockReconcile} className="p-4 space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>Current System Stock:</span>
                  <span className="font-bold text-white font-mono">
                    {showStockAuditModal.currentStock} {showStockAuditModal.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Unit Cost:</span>
                  <span className="font-mono text-emerald-400">
                    {formatCurrency(showStockAuditModal.costPerUnit)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Verified Physical Stock ({showStockAuditModal.unit}) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={stockAuditForm.physicalStock}
                  onChange={(e) =>
                    setStockAuditForm({
                      ...stockAuditForm,
                      physicalStock: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-base focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Audit Notes / Reason for Variance</label>
                <input
                  type="text"
                  value={stockAuditForm.notes}
                  onChange={(e) => setStockAuditForm({ ...stockAuditForm, notes: e.target.value })}
                  placeholder="e.g. End of shift physical scale verification"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStockAuditModal(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                >
                  Reconcile Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add / Edit Recipe Modal */}
      {showAddRecipeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h3 className="font-bold text-sm text-white">
                {editingRecipe ? 'Edit Recipe Formulation' : 'Create New Menu Item Recipe'}
              </h3>
              <button
                onClick={() => setShowAddRecipeModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="p-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">Link to Menu Item *</label>
                  <select
                    disabled={!!editingRecipe}
                    value={recipeForm.menuItemId}
                    onChange={(e) => {
                      const sel = menuItems.find((m) => m.id === e.target.value);
                      setRecipeForm({
                        ...recipeForm,
                        menuItemId: e.target.value,
                        name: sel ? `Recipe: ${sel.name}` : recipeForm.name,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {menuItems.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Selling Price: ₹{m.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">Recipe Name *</label>
                  <input
                    type="text"
                    required
                    value={recipeForm.name}
                    onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Yield Quantity *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={recipeForm.yieldQuantity}
                    onChange={(e) =>
                      setRecipeForm({ ...recipeForm, yieldQuantity: parseInt(e.target.value) || 1 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Yield Unit *</label>
                  <input
                    type="text"
                    required
                    value={recipeForm.yieldUnit}
                    onChange={(e) => setRecipeForm({ ...recipeForm, yieldUnit: e.target.value })}
                    placeholder="PORTION"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Dynamic Ingredient Line Items */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">Recipe Ingredients</span>
                  <button
                    type="button"
                    onClick={() =>
                      setRecipeForm({
                        ...recipeForm,
                        ingredients: [
                          ...recipeForm.ingredients,
                          {
                            ingredientId: ingredients[0]?.id || '',
                            quantity: 0.1,
                            unit: ingredients[0]?.unit || 'KILOGRAM',
                          },
                        ],
                      })
                    }
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Ingredient Line
                  </button>
                </div>

                {recipeForm.ingredients.map((ri, idx) => {
                  const selectedIng = ingredients.find((i) => i.id === ri.ingredientId);
                  const lineCost = selectedIng ? selectedIng.costPerUnit * ri.quantity : 0;

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 items-center"
                    >
                      <div className="col-span-5">
                        <select
                          value={ri.ingredientId}
                          onChange={(e) => {
                            const newIng = ingredients.find((i) => i.id === e.target.value);
                            const updated = [...recipeForm.ingredients];
                            updated[idx].ingredientId = e.target.value;
                            if (newIng) updated[idx].unit = newIng.unit;
                            setRecipeForm({ ...recipeForm, ingredients: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-xs"
                        >
                          {ingredients.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name} ({formatCurrency(i.costPerUnit)}/{i.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={ri.quantity}
                          onChange={(e) => {
                            const updated = [...recipeForm.ingredients];
                            updated[idx].quantity = parseFloat(e.target.value) || 0;
                            setRecipeForm({ ...recipeForm, ingredients: updated });
                          }}
                          placeholder="Qty"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-xs font-mono"
                        />
                      </div>

                      <div className="col-span-3 text-right font-mono text-emerald-400 font-bold">
                        {formatCurrency(lineCost)}
                      </div>

                      <div className="col-span-1 text-right">
                        {recipeForm.ingredients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = recipeForm.ingredients.filter((_, i) => i !== idx);
                              setRecipeForm({ ...recipeForm, ingredients: updated });
                            }}
                            className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Preparation Instructions</label>
                <textarea
                  rows={2}
                  value={recipeForm.instructions}
                  onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
                  placeholder="Optional kitchen line prep steps..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRecipeModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                >
                  {editingRecipe ? 'Update Recipe' : 'Save Recipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Purchase / Stock-In Modal */}
      {showAddPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h3 className="font-bold text-sm text-white">Record Stock-In / Purchase Invoice</h3>
              <button
                onClick={() => setShowAddPurchaseModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Supplier</label>
                  <select
                    value={purchaseForm.supplierId}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Direct / Cash Purchase</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Invoice / Bill Number</label>
                  <input
                    type="text"
                    value={purchaseForm.invoiceNumber}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })}
                    placeholder="e.g. INV-202609-001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Purchase Line Items */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">Purchased Items</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPurchaseForm({
                        ...purchaseForm,
                        items: [
                          ...purchaseForm.items,
                          {
                            ingredientId: ingredients[0]?.id || '',
                            quantity: 5,
                            unit: ingredients[0]?.unit || 'KILOGRAM',
                            unitCost: ingredients[0]?.costPerUnit || 100,
                          },
                        ],
                      })
                    }
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line Item
                  </button>
                </div>

                {purchaseForm.items.map((it, idx) => {
                  const lineTotal = it.quantity * it.unitCost;
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 items-center"
                    >
                      <div className="col-span-5">
                        <select
                          value={it.ingredientId}
                          onChange={(e) => {
                            const newIng = ingredients.find((i) => i.id === e.target.value);
                            const updated = [...purchaseForm.items];
                            updated[idx].ingredientId = e.target.value;
                            if (newIng) {
                              updated[idx].unit = newIng.unit;
                              updated[idx].unitCost = newIng.costPerUnit;
                            }
                            setPurchaseForm({ ...purchaseForm, items: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-xs"
                        >
                          {ingredients.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name} ({i.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          value={it.quantity}
                          onChange={(e) => {
                            const updated = [...purchaseForm.items];
                            updated[idx].quantity = parseFloat(e.target.value) || 0;
                            setPurchaseForm({ ...purchaseForm, items: updated });
                          }}
                          placeholder="Qty"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-xs font-mono"
                        />
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          value={it.unitCost}
                          onChange={(e) => {
                            const updated = [...purchaseForm.items];
                            updated[idx].unitCost = parseFloat(e.target.value) || 0;
                            setPurchaseForm({ ...purchaseForm, items: updated });
                          }}
                          placeholder="₹/Unit"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-xs font-mono"
                        />
                      </div>

                      <div className="col-span-1 text-right">
                        {purchaseForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = purchaseForm.items.filter((_, i) => i !== idx);
                              setPurchaseForm({ ...purchaseForm, items: updated });
                            }}
                            className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-xs">
                  <span className="text-slate-400 font-sans">Total Purchase Order:</span>
                  <span className="font-bold text-base text-emerald-400">
                    {formatCurrency(
                      purchaseForm.items.reduce((s, it) => s + it.quantity * it.unitCost, 0),
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes / Delivery Details</label>
                <input
                  type="text"
                  value={purchaseForm.notes}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                  placeholder="e.g. Delivered by 07:00 AM morning batch"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddPurchaseModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                >
                  Confirm & Stock-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Add Wastage Modal */}
      {showAddWastageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Log Inventory Wastage / Spoilage</h3>
              <button
                onClick={() => setShowAddWastageModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWastage} className="p-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Wasted Ingredient *</label>
                <select
                  value={wastageForm.ingredientId}
                  onChange={(e) => setWastageForm({ ...wastageForm, ingredientId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Stock: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Wasted Quantity *</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    required
                    value={wastageForm.quantity}
                    onChange={(e) =>
                      setWastageForm({ ...wastageForm, quantity: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Wastage Reason *</label>
                  <select
                    value={wastageForm.reason}
                    onChange={(e) =>
                      setWastageForm({ ...wastageForm, reason: e.target.value as WastageReason })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {WASTAGE_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Incident Notes / Explanation</label>
                <input
                  type="text"
                  value={wastageForm.notes}
                  onChange={(e) => setWastageForm({ ...wastageForm, notes: e.target.value })}
                  placeholder="e.g. Overheated grill burnt batch"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddWastageModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer"
                >
                  Log Wastage & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Add / Edit Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">
                {editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}
              </h3>
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="e.g. Metro Organic Dairy & Produce"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    placeholder="+91 98..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">GST Number (Optional)</label>
                  <input
                    type="text"
                    value={supplierForm.gstNumber}
                    onChange={(e) => setSupplierForm({ ...supplierForm, gstNumber: e.target.value })}
                    placeholder="29AAAAA0000A1Z5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  placeholder="orders@supplier.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Address</label>
                <input
                  type="text"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  placeholder="APMC Market Shed #4..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes & Terms</label>
                <input
                  type="text"
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                  placeholder="e.g. Daily delivery 06:30 AM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                >
                  {editingSupplier ? 'Update Supplier' : 'Register Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
