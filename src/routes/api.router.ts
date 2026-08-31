import { Router } from 'express';
import { healthRouter } from './health.router.js';
import { productRouter } from './storefront/product.router.js';
import { categoryRouter } from './storefront/category.router.js';
import { orderRouter } from './storefront/order.router.js';
import { couponRouter } from './storefront/coupon.router.js';
import { reviewRouter } from './storefront/review.router.js';
import { paymentRouter } from './storefront/payment.router.js';
import { settingRouter } from './storefront/setting.router.js';
import { uploadRouter } from './upload.router.js';
import { adminRouter } from './admin/admin.router.js';

export const apiRouter = Router();

// Health Check
apiRouter.use(healthRouter);

// File Upload Endpoints (Images, Videos, Files)
apiRouter.use(uploadRouter);

// Storefront Endpoints
apiRouter.use(productRouter);
apiRouter.use(categoryRouter);
apiRouter.use(orderRouter);
apiRouter.use(couponRouter);
apiRouter.use(reviewRouter);
apiRouter.use(paymentRouter);
apiRouter.use(settingRouter);

// Dashboard / Admin Endpoints
apiRouter.use('/admin', adminRouter);
