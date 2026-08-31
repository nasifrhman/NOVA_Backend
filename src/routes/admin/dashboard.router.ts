import { Router } from 'express';
import {
  getDashboardStats,
  getSalesAnalytics,
} from '../../controllers/admin/dashboard.controller.js';

export const adminDashboardRouter = Router();

adminDashboardRouter.get('/dashboard/stats', getDashboardStats);
adminDashboardRouter.get('/dashboard/sales', getSalesAnalytics);
