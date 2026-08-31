import { Router } from 'express';
import { adminAuthRouter } from './auth.router.js';
import { adminDashboardRouter } from './dashboard.router.js';
import { adminProductRouter } from './product.router.js';
import { adminCategoryRouter } from './category.router.js';
import { adminOrderRouter } from './order.router.js';
import { adminCustomerRouter } from './customer.router.js';
import { adminCouponRouter } from './coupon.router.js';
import { adminReviewRouter } from './review.router.js';
import { adminSettingRouter } from './setting.router.js';
import { uploadRouter } from '../upload.router.js';
import { authenticate, authorizeAdmin } from '../../middlewares/auth.middleware.js';

export const adminRouter = Router();

// Auth routes (login is public, /me requires token)
adminRouter.use(adminAuthRouter);

// Protected Admin Routes (require valid JWT and admin role)
adminRouter.use(authenticate, authorizeAdmin);
adminRouter.use(uploadRouter);
adminRouter.use(adminDashboardRouter);
adminRouter.use(adminProductRouter);
adminRouter.use(adminCategoryRouter);
adminRouter.use(adminOrderRouter);
adminRouter.use(adminCustomerRouter);
adminRouter.use(adminCouponRouter);
adminRouter.use(adminReviewRouter);
adminRouter.use(adminSettingRouter);
