import { Router } from 'express';
import {
  createCustomerSession,
  getAllRestaurants,
  getRestaurantBySlug,
  getRestaurantTables,
  getTableInfo,
} from '../controllers/restaurantController.js';
import {
  getCategories,
  getMenuItemDetails,
  getMenuItems,
} from '../controllers/menuController.js';
import {
  createOrder,
  getOrderByNumber,
  updateOrderStatus,
} from '../controllers/orderController.js';
import {
  createAdminCategory,
  createAdminMenuItem,
  createAdminTable,
  getAdminOrders,
  getAdminOverview,
  getAdminTables,
  updateAdminMenuItem,
  updateThemeSettings,
} from '../controllers/adminController.js';
import {
  generateOrGetBill,
  getAdminBills,
  getCustomerBill,
} from '../controllers/billController.js';
import {
  createPaymentOrder,
  getAdminPayments,
  handlePaymentWebhook,
  recordUpiPaymentAttempt,
  settleBillAdmin,
  verifyPayment,
  verifyPaymentAdmin,
} from '../controllers/paymentController.js';
import {
  createAdminExpense,
  deleteAdminExpense,
  getAdminExpenses,
  updateAdminExpense,
} from '../controllers/expenseController.js';
import { getAdminFinancialAnalytics } from '../controllers/analyticsController.js';
import { getAdminBusinessReport } from '../controllers/reportsController.js';
import {
  createAdminIngredient,
  createAdminPurchase,
  createAdminRecipe,
  createAdminStockAdjustment,
  createAdminSupplier,
  createAdminWastage,
  deleteAdminIngredient,
  deleteAdminRecipe,
  deleteAdminSupplier,
  getAdminIngredients,
  getAdminInventoryDashboard,
  getAdminPurchases,
  getAdminRecipeById,
  getAdminRecipes,
  getAdminStockMovements,
  getAdminSuppliers,
  getAdminWastage,
  reconcileAdminStockCount,
  syncAdminRecipeCost,
  updateAdminIngredient,
  updateAdminRecipe,
  updateAdminSupplier,
} from '../controllers/inventoryController.js';
import {
  getAdminMe,
  loginStaff,
  logoutStaff,
} from '../controllers/authController.js';
import {
  createAdminStaff,
  deactivateAdminStaff,
  getAdminStaffById,
  getAdminStaffList,
  updateAdminStaff,
  updateAdminStaffPassword,
} from '../controllers/staffController.js';
import {
  validateCustomerSession,
  validateOrderCreation,
} from '../middleware/validator.js';
import {
  authenticateStaff,
  requireAuth,
  requirePermission,
} from '../middleware/auth.js';

export const apiRouter = Router();

// Apply authenticateStaff globally so req.staff is populated whenever token/header is present
apiRouter.use(authenticateStaff);

// === AUTHENTICATION (MODULE 9A) ===
apiRouter.post('/auth/login', loginStaff);
apiRouter.post('/auth/logout', logoutStaff);
apiRouter.get('/admin/me', requireAuth, getAdminMe);

// === STAFF MANAGEMENT & RBAC (MODULE 9A) ===
apiRouter.get('/admin/staff', requirePermission(['STAFF_VIEW', 'STAFF_MANAGE']), getAdminStaffList);
apiRouter.post('/admin/staff', requirePermission('STAFF_MANAGE'), createAdminStaff);
apiRouter.get('/admin/staff/:id', requirePermission(['STAFF_VIEW', 'STAFF_MANAGE']), getAdminStaffById);
apiRouter.patch('/admin/staff/:id', requirePermission('STAFF_MANAGE'), updateAdminStaff);
apiRouter.patch('/admin/staff/:id/password', requirePermission('STAFF_MANAGE'), updateAdminStaffPassword);
apiRouter.delete('/admin/staff/:id', requirePermission('STAFF_MANAGE'), deactivateAdminStaff);
apiRouter.post('/admin/staff/:id/deactivate', requirePermission('STAFF_MANAGE'), deactivateAdminStaff);

// === SYSTEM / RESTAURANTS ===
apiRouter.get('/restaurants', getAllRestaurants);
apiRouter.get('/restaurants/:slug', getRestaurantBySlug);
apiRouter.get('/restaurants/:slug/tables', getRestaurantTables);
apiRouter.get('/restaurants/:slug/tables/:tableId', getTableInfo);

// === CUSTOMER SESSION ===
apiRouter.post(
  '/restaurants/:slug/customers/session',
  validateCustomerSession,
  createCustomerSession,
);

// === MENU & CATEGORIES (PUBLIC) ===
apiRouter.get('/restaurants/:slug/categories', getCategories);
apiRouter.get('/restaurants/:slug/menu', getMenuItems);
apiRouter.get('/restaurants/:slug/menu/:itemId', getMenuItemDetails);

// === ORDERS (PUBLIC + KITCHEN) ===
apiRouter.post(
  '/restaurants/:slug/orders',
  validateOrderCreation,
  createOrder,
);
apiRouter.get('/restaurants/:slug/orders/:orderNumber', getOrderByNumber);
apiRouter.patch('/restaurants/:slug/orders/:orderId/status', updateOrderStatus);
apiRouter.patch('/orders/:orderId/status', updateOrderStatus);

// === DIGITAL BILLING ===
apiRouter.post('/restaurants/:slug/orders/:orderNumber/bill', generateOrGetBill);
apiRouter.get('/restaurants/:slug/bills/:billNumber', getCustomerBill);
apiRouter.get('/admin/bills', requirePermission('BILLING_VIEW'), getAdminBills);

// === SECURE ONLINE PAYMENTS & DUAL UPI QR ===
apiRouter.post('/restaurants/:slug/bills/:billNumber/payment', createPaymentOrder);
apiRouter.post('/restaurants/:slug/bills/:billNumber/payment/verify', verifyPayment);
apiRouter.post('/restaurants/:slug/bills/:billNumber/upi-payment', recordUpiPaymentAttempt);
apiRouter.post('/payments/webhook', handlePaymentWebhook);
apiRouter.get('/admin/payments', requirePermission('PAYMENT_VIEW'), getAdminPayments);
apiRouter.post('/admin/bills/:billNumber/settle', requirePermission('BILLING_MANAGE'), settleBillAdmin);
apiRouter.post('/admin/payments/:paymentId/verify', requirePermission('PAYMENT_VERIFY'), verifyPaymentAdmin);

// === FINANCIAL ANALYTICS, BI & REPORTS ===
apiRouter.get('/admin/analytics/financial', requirePermission('FINANCIAL_VIEW'), getAdminFinancialAnalytics);
apiRouter.get('/admin/reports/business', requirePermission('REPORT_VIEW'), getAdminBusinessReport);

// === OPERATING EXPENSES ===
apiRouter.get('/admin/expenses', requirePermission('EXPENSE_VIEW'), getAdminExpenses);
apiRouter.post('/admin/expenses', requirePermission('EXPENSE_MANAGE'), createAdminExpense);
apiRouter.patch('/admin/expenses/:id', requirePermission('EXPENSE_MANAGE'), updateAdminExpense);
apiRouter.delete('/admin/expenses/:id', requirePermission('EXPENSE_MANAGE'), deleteAdminExpense);

// === INVENTORY, INGREDIENTS, RECIPES & STOCK (MODULE 8) ===
apiRouter.get('/admin/inventory/dashboard', requirePermission('INVENTORY_VIEW'), getAdminInventoryDashboard);
apiRouter.get('/admin/inventory/ingredients', requirePermission('INVENTORY_VIEW'), getAdminIngredients);
apiRouter.post('/admin/inventory/ingredients', requirePermission('INVENTORY_MANAGE'), createAdminIngredient);
apiRouter.patch('/admin/inventory/ingredients/:id', requirePermission('INVENTORY_MANAGE'), updateAdminIngredient);
apiRouter.delete('/admin/inventory/ingredients/:id', requirePermission('INVENTORY_MANAGE'), deleteAdminIngredient);

apiRouter.get('/admin/inventory/recipes', requirePermission('RECIPE_VIEW'), getAdminRecipes);
apiRouter.get('/admin/inventory/recipes/:id', requirePermission('RECIPE_VIEW'), getAdminRecipeById);
apiRouter.post('/admin/inventory/recipes', requirePermission('RECIPE_MANAGE'), createAdminRecipe);
apiRouter.patch('/admin/inventory/recipes/:id', requirePermission('RECIPE_MANAGE'), updateAdminRecipe);
apiRouter.delete('/admin/inventory/recipes/:id', requirePermission('RECIPE_MANAGE'), deleteAdminRecipe);
apiRouter.post('/admin/inventory/recipes/:id/sync-cost', requirePermission('RECIPE_MANAGE'), syncAdminRecipeCost);

apiRouter.get('/admin/inventory/suppliers', requirePermission('INVENTORY_VIEW'), getAdminSuppliers);
apiRouter.post('/admin/inventory/suppliers', requirePermission('INVENTORY_MANAGE'), createAdminSupplier);
apiRouter.patch('/admin/inventory/suppliers/:id', requirePermission('INVENTORY_MANAGE'), updateAdminSupplier);
apiRouter.delete('/admin/inventory/suppliers/:id', requirePermission('INVENTORY_MANAGE'), deleteAdminSupplier);

apiRouter.get('/admin/inventory/purchases', requirePermission('INVENTORY_VIEW'), getAdminPurchases);
apiRouter.post('/admin/inventory/purchases', requirePermission('INVENTORY_MANAGE'), createAdminPurchase);

apiRouter.get('/admin/inventory/movements', requirePermission('INVENTORY_VIEW'), getAdminStockMovements);
apiRouter.post('/admin/inventory/adjustments', requirePermission('INVENTORY_MANAGE'), createAdminStockAdjustment);
apiRouter.post('/admin/inventory/reconcile', requirePermission('INVENTORY_MANAGE'), reconcileAdminStockCount);

apiRouter.get('/admin/inventory/wastage', requirePermission('INVENTORY_VIEW'), getAdminWastage);
apiRouter.post('/admin/inventory/wastage', requirePermission('INVENTORY_MANAGE'), createAdminWastage);

// === ADMIN, TABLES, MENU & KITCHEN MANAGEMENT ===
apiRouter.get('/admin/overview', requirePermission(['ORDER_VIEW', 'FINANCIAL_VIEW', 'STAFF_VIEW', 'KDS_VIEW']), getAdminOverview);
apiRouter.get('/admin/orders', requirePermission(['ORDER_VIEW', 'KDS_VIEW']), getAdminOrders);
apiRouter.get('/admin/tables', requirePermission(['TABLE_VIEW', 'TABLE_MANAGE', 'ORDER_VIEW']), getAdminTables);
apiRouter.post('/admin/tables', requirePermission('TABLE_MANAGE'), createAdminTable);
apiRouter.post('/admin/menu-items', requirePermission('MENU_MANAGE'), createAdminMenuItem);
apiRouter.patch('/admin/menu-items/:id', requirePermission('MENU_MANAGE'), updateAdminMenuItem);
apiRouter.post('/admin/categories', requirePermission('CATEGORY_MANAGE'), createAdminCategory);
apiRouter.patch('/admin/theme', requirePermission('RESTAURANT_MANAGE'), updateThemeSettings);
