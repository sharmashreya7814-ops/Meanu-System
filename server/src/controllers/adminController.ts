import { Request, Response, NextFunction } from 'express';
import { repository } from '../db/repository.js';
import { OrderStatus } from '../types/index.js';

export async function getAdminOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const { restaurantId } = req.query;
    const targetRestaurantId = (restaurantId as string) || 'rest-verde-01';

    const restaurant = await repository.getRestaurantById(targetRestaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    const orders = await repository.getOrdersByRestaurant(targetRestaurantId);
    const tables = await repository.getTablesByRestaurant(targetRestaurantId);
    const menuItems = await repository.getMenuItemsByRestaurant(targetRestaurantId);
    const categories = await repository.getCategoriesByRestaurant(targetRestaurantId);

    // Calculate metrics
    const activeOrders = orders.filter((o) =>
      ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'].includes(o.status),
    );
    const pendingKitchenOrders = orders.filter((o) =>
      ['NEW', 'ACCEPTED', 'PREPARING'].includes(o.status),
    );
    const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED');

    const totalRevenue = orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      success: true,
      data: {
        restaurant,
        metrics: {
          totalOrders: orders.length,
          activeOrdersCount: activeOrders.length,
          pendingKitchenCount: pendingKitchenOrders.length,
          totalTables: tables.length,
          occupiedTablesCount: occupiedTables.length,
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalMenuItems: menuItems.length,
          totalCategories: categories.length,
        },
        recentOrders: orders.slice(0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const { restaurantId, status, tableId } = req.query;
    const targetRestaurantId = (restaurantId as string) || 'rest-verde-01';

    const orders = await repository.getOrdersByRestaurant(targetRestaurantId, {
      status: status as OrderStatus,
      tableId: tableId as string,
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminTables(req: Request, res: Response, next: NextFunction) {
  try {
    const { restaurantId } = req.query;
    const targetRestaurantId = (restaurantId as string) || 'rest-verde-01';

    const tables = await repository.getTablesByRestaurant(targetRestaurantId);
    res.json({
      success: true,
      data: tables,
    });
  } catch (error) {
    next(error);
  }
}

export async function createAdminTable(req: Request, res: Response, next: NextFunction) {
  try {
    const { restaurantId, tableNumber, tableName, capacity } = req.body;
    const restaurant = await repository.getRestaurantById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    const qrCodeUrl = `/restaurant/${restaurant.slug}/table/tbl-${Date.now()}`;
    const table = await repository.createTable({
      restaurantId,
      tableNumber,
      tableName: tableName || `Table ${tableNumber}`,
      capacity: Number(capacity) || 4,
      qrCodeUrl,
      status: 'AVAILABLE',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: table,
      message: `Table ${table.tableNumber} added successfully`,
    });
  } catch (error) {
    next(error);
  }
}

export async function createAdminMenuItem(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      restaurantId,
      categoryId,
      name,
      description,
      image,
      price,
      costPrice,
      isVeg,
      isAvailable,
      preparationTimeMin,
      allergens,
    } = req.body;

    const item = await repository.createMenuItem({
      restaurantId,
      categoryId,
      name,
      description,
      image: image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      price: Number(price),
      costPrice: costPrice ? Number(costPrice) : undefined,
      isVeg: Boolean(isVeg),
      isAvailable: isAvailable !== false,
      spicyLevel: 0,
      preparationTimeMin: Number(preparationTimeMin) || 15,
      allergens: Array.isArray(allergens) ? allergens : [],
      sortOrder: 10,
    });

    res.status(201).json({
      success: true,
      data: item,
      message: `Menu item "${item.name}" created`,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminMenuItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await repository.updateMenuItem(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }

    res.json({
      success: true,
      data: updated,
      message: 'Menu item updated',
    });
  } catch (error) {
    next(error);
  }
}

export async function createAdminCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { restaurantId, name, slug, description, icon } = req.body;

    const category = await repository.createCategory({
      restaurantId,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      icon: icon || '🍴',
      sortOrder: 10,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: category,
      message: `Category "${category.name}" created`,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateThemeSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { restaurantId, themeConfig, themePreset } = req.body;
    const updated = await repository.updateRestaurantTheme(restaurantId, themeConfig, themePreset);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    res.json({
      success: true,
      data: updated,
      message: 'Restaurant theme updated successfully',
    });
  } catch (error) {
    next(error);
  }
}
