import { Request, Response, NextFunction } from 'express';
import { repository } from '../db/repository.js';

export async function getRestaurantBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const restaurant = await repository.getRestaurantBySlug(slug);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant or table not found.',
      });
    }

    res.json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllRestaurants(_req: Request, res: Response, next: NextFunction) {
  try {
    const restaurants = await repository.getAllRestaurants();
    res.json({
      success: true,
      data: restaurants,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTableInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug, tableId } = req.params;
    const restaurant = await repository.getRestaurantBySlug(slug);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant or table not found.',
      });
    }

    const table = await repository.getTableByIdOrNumber(restaurant.id, tableId);
    if (!table || table.restaurantId !== restaurant.id) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant or table not found.',
      });
    }

    res.json({
      success: true,
      data: {
        restaurant,
        table,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createCustomerSession(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const { name, mobileNumber, tableId } = req.body;

    const restaurant = await repository.getRestaurantBySlug(slug);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant or table not found.',
      });
    }

    const table = await repository.getTableByIdOrNumber(restaurant.id, tableId);
    if (!table || table.restaurantId !== restaurant.id) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant or table not found.',
      });
    }

    const customer = await repository.createOrUpdateCustomer({
      restaurantId: restaurant.id,
      name,
      mobileNumber,
      tableId: table.id,
    });

    res.status(201).json({
      success: true,
      data: {
        customer,
        table,
        restaurant,
      },
      message: `Welcome, ${customer.name}!`,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRestaurantTables(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const restaurant = await repository.getRestaurantBySlug(slug);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found.',
      });
    }

    const tables = await repository.getTablesByRestaurant(restaurant.id);
    res.json({
      success: true,
      data: tables,
    });
  } catch (error) {
    next(error);
  }
}
