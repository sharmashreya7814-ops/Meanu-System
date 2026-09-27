import { Request, Response } from 'express';
import { repository } from '../db/repository.js';
import { ApiResponse, BusinessReportResponse } from '../types/index.js';

export const getAdminBusinessReport = async (
  req: Request,
  res: Response<ApiResponse<BusinessReportResponse>>,
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
    const preset = (req.query.preset as string) || 'thisMonth';

    const report = await repository.getBusinessReport(
      restaurantId,
      startDate,
      endDate,
      timezone,
      preset,
    );

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('Error generating business report:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to generate business report',
    });
  }
};
