import { Router } from 'express';
import {
  createCustomerSession,
  getAllRestaurants,
  getRestaurantBySlug,
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
  validateCustomerSession,
  validateOrderCreation,
} from '../middleware/validator.js';

export const apiRouter = Router();

// === SYSTEM / RESTAURANTS ===
apiRouter.get('/restaurants', getAllRestaurants);
apiRouter.get('/restaurants/:slug', getRestaurantBySlug);
apiRouter.get('/restaurants/:slug/tables/:tableId', getTableInfo);

// === CUSTOMER SESSION ===
apiRouter.post(
  '/restaurants/:slug/customers/session',
  validateCustomerSession,
  createCustomerSession,
);

// === MENU & CATEGORIES ===
apiRouter.get('/restaurants/:slug/categories', getCategories);
apiRouter.get('/restaurants/:slug/menu', getMenuItems);
apiRouter.get('/restaurants/:slug/menu/:itemId', getMenuItemDetails);

// === ORDERS ===
apiRouter.post(
  '/restaurants/:slug/orders',
  validateOrderCreation,
  createOrder,
);
apiRouter.get('/restaurants/:slug/orders/:orderNumber', getOrderByNumber);
apiRouter.patch('/restaurants/:slug/orders/:orderId/status', updateOrderStatus);
apiRouter.patch('/orders/:orderId/status', updateOrderStatus);

// === ADMIN & KITCHEN MANAGEMENT ===
apiRouter.get('/admin/overview', getAdminOverview);
apiRouter.get('/admin/orders', getAdminOrders);
apiRouter.get('/admin/tables', getAdminTables);
apiRouter.post('/admin/tables', createAdminTable);
apiRouter.post('/admin/menu-items', createAdminMenuItem);
apiRouter.patch('/admin/menu-items/:id', updateAdminMenuItem);
apiRouter.post('/admin/categories', createAdminCategory);
apiRouter.patch('/admin/theme', updateThemeSettings);
