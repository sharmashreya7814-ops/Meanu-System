import { Request, Response, NextFunction } from 'express';
import { repository } from '../db/repository.js';

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const restaurant = await repository.getRestaurantBySlug(slug);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found',
      });
    }

    const categories = await repository.getCategoriesByRestaurant(restaurant.id);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMenuItems(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const restaurant = await repository.getRestaurantBySlug(slug);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found',
      });
    }

    const menuItems = await repository.getMenuItemsByRestaurant(restaurant.id);

    res.json({
      success: true,
      data: menuItems,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMenuItemDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug, itemId } = req.params;
    const restaurant = await repository.getRestaurantBySlug(slug);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found',
      });
    }

    const item = await repository.getMenuItemById(itemId);
    if (!item || item.restaurantId !== restaurant.id) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found',
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
}
