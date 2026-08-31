import { Router } from 'express';
import {
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../../controllers/admin/coupon.controller.js';

export const adminCouponRouter = Router();

adminCouponRouter.get('/coupons', getAdminCoupons);
adminCouponRouter.post('/coupons', createCoupon);
adminCouponRouter.patch('/coupons/:id', updateCoupon);
adminCouponRouter.delete('/coupons/:id', deleteCoupon);
