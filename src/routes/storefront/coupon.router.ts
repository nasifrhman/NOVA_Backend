import { Router } from 'express';
import { validateCoupon } from '../../controllers/storefront/coupon.controller.js';

export const couponRouter = Router();

couponRouter.post('/coupons/validate', validateCoupon);
