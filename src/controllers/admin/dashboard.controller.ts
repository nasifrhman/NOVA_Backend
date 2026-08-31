import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../../services/analytics.service.js';
import { sendResponse } from '../../utils/apiResponse.js';

export const getDashboardStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await AnalyticsService.getDashboardStats();

    sendResponse({
      res,
      message: 'Dashboard statistics fetched successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string, 10) || 30;
    const analytics = await AnalyticsService.getSalesAnalytics(days);

    sendResponse({
      res,
      message: 'Sales analytics fetched successfully',
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};
