import { Request, Response, NextFunction } from 'express';
import { repository } from '../db/repository.js';
import { BillPaymentStatus } from '../types/index.js';

/**
 * POST /api/restaurants/:slug/orders/:orderNumber/bill
 * Generates an authoritative digital bill for a completed order, or returns the existing bill.
 */
export async function generateOrGetBill(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug, orderNumber } = req.params;

    const restaurant = await repository.getRestaurantBySlug(slug);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found',
      });
    }

    const bill = await repository.generateBill(restaurant.id, orderNumber);

    res.status(200).json({
      success: true,
      data: bill,
      message: `Digital bill #${bill.billNumber} generated successfully`,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Something went wrong while generating your digital bill.',
    });
  }
}

/**
 * GET /api/restaurants/:slug/bills/:billNumber
 * Retrieves customer-facing digital bill details strictly scoped to the restaurant.
 */
export async function getCustomerBill(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug, billNumber } = req.params;

    const restaurant = await repository.getRestaurantBySlug(slug);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found',
      });
    }

    const bill = await repository.getBillByNumber(restaurant.id, billNumber);
    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found.',
      });
    }

    res.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/bills?restaurantId=...&status=...
 * Retrieves bills for restaurant administration and financial management.
 */
export async function getAdminBills(req: Request, res: Response, next: NextFunction) {
  try {
    const { restaurantId, status } = req.query;

    if (!restaurantId || typeof restaurantId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'restaurantId is required',
      });
    }

    const bills = await repository.getBillsByRestaurant(
      restaurantId,
      status ? { paymentStatus: status as BillPaymentStatus } : undefined,
    );

    res.json({
      success: true,
      data: bills,
    });
  } catch (error) {
    next(error);
  }
}
