import { Request, Response, NextFunction } from 'express';
import { Coupon } from '../../models/Coupon.model.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { BadRequestError } from '../../utils/errors.js';

export const validateCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code, cartTotal } = req.body;

    if (!code || typeof code !== 'string') {
      throw new BadRequestError('Coupon code is required');
    }

    const orderAmount = Number(cartTotal) || 0;

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      throw new BadRequestError('Invalid or expired coupon code');
    }

    const validation = coupon.isValid(orderAmount);

    if (!validation.valid) {
      throw new BadRequestError(validation.reason || 'Coupon is not valid');
    }

    sendResponse({
      res,
      message: 'Coupon is valid and applied',
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: validation.discountAmount,
        minOrderAmount: coupon.minOrderAmount,
        newTotal: Math.max(0, orderAmount - validation.discountAmount),
      },
    });
  } catch (error) {
    next(error);
  }
};
