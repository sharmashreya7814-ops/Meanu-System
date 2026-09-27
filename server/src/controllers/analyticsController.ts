import { Request, Response } from 'express';
import { repository } from '../db/repository.js';
import { ApiResponse, FinancialAnalyticsResponse } from '../types/index.js';

export const getAdminFinancialAnalytics = async (
  req: Request,
  res: Response<ApiResponse<FinancialAnalyticsResponse>>,
) => {
  try {
    const restaurantId =
      (req.query.restaurantId as string) ||
      (req.headers['x-restaurant-id'] as string);

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required restaurantId parameter',
      });
    }

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const timezone = (req.query.timezone as string) || 'Asia/Kolkata';

    const analytics = await repository.getFinancialAnalytics(
      restaurantId,
      startDate,
      endDate,
      timezone,
    );

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error('Error calculating financial analytics:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to calculate financial analytics',
    });
  }
};
