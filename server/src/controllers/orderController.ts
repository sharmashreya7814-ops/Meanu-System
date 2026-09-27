import { Request, Response, NextFunction } from 'express';
import { repository } from '../db/repository.js';
import { OrderStatus } from '../types/index.js';

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const { tableId, customerId, items, specialInstructions } = req.body;

    const restaurant = await repository.getRestaurantBySlug(slug);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found',
      });
    }

    const order = await repository.createOrder(restaurant.id, {
      tableId,
      customerId,
      items,
      specialInstructions,
    });

    res.status(201).json({
      success: true,
      data: order,
      message: `Order #${order.orderNumber} placed successfully!`,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to place order',
    });
  }
}

export async function getOrderByNumber(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug, orderNumber } = req.params;
    const restaurant = await repository.getRestaurantBySlug(slug);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found',
      });
    }

    const order = await repository.getOrderByNumber(restaurant.id, orderNumber);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: `Order #${orderNumber} not found`,
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId } = req.params;
    const { status, reason } = req.body;

    const validStatuses: OrderStatus[] = [
      'NEW',
      'ACCEPTED',
      'PREPARING',
      'READY',
      'SERVED',
      'COMPLETED',
      'CANCELLED',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updated = await repository.updateOrderStatus(orderId, status, reason);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: updated,
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
}
