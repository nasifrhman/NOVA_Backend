import { Request, Response, NextFunction } from 'express';
import { Coupon } from '../../models/Coupon.model.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

export const getAdminCoupons = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    sendResponse({
      res,
      message: 'Admin coupons fetched successfully',
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      startDate,
      expiryDate,
      usageLimit,
      isActive,
    } = req.body;

    if (!code || !discountValue || !expiryDate) {
      throw new BadRequestError('Coupon code, discount value, and expiry date are required');
    }

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      description,
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      startDate: startDate ? new Date(startDate) : new Date(),
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    sendResponse({
      res,
      statusCode: 201,
      message: 'Coupon created successfully',
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.body.code) {
      req.body.code = req.body.code.trim().toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      throw new NotFoundError(`Coupon not found with ID: ${id}`);
    }

    sendResponse({
      res,
      message: 'Coupon updated successfully',
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      throw new NotFoundError(`Coupon not found with ID: ${id}`);
    }

    sendResponse({
      res,
      message: 'Coupon deleted successfully',
      data: { id: coupon._id },
    });
  } catch (error) {
    next(error);
  }
};
