import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Review } from '../../models/Review.model.js';
import { Product } from '../../models/Product.model.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

export const getReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, page, limit } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = { isApproved: true };

    if (productId) {
      const isValidObjectId = typeof productId === 'string' && /^[0-9a-fA-F]{24}$/.test(productId);
      if (isValidObjectId) {
        filter.product = productId;
      } else {
        const product = await Product.findOne({
          $or: [{ slug: productId }, { sku: productId }],
        });
        filter.product = product ? product._id : null;
      }
    }

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('product', 'title slug images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments(filter),
    ]);

    sendResponse({
      res,
      message: 'Reviews fetched successfully',
      data: reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, customerName, customerEmail, rating, title, comment } = req.body;

    if (!productId || typeof productId !== 'string') {
      throw new BadRequestError('Valid product identifier is required');
    }

    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(productId);
    const product = await Product.findOne({
      $or: [
        ...(isValidObjectId ? [{ _id: productId }] : []),
        { slug: productId },
        { sku: productId },
      ],
      isActive: true,
    });

    if (!product) {
      throw new NotFoundError('Product not found or unavailable');
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      throw new BadRequestError('Rating must be between 1 and 5');
    }

    if (!customerName || !comment) {
      throw new BadRequestError('Customer name and comment are required');
    }

    const review = await Review.create({
      product: product._id,
      customerName: customerName.trim(),
      customerEmail: customerEmail ? customerEmail.trim() : undefined,
      rating: numericRating,
      title: title ? title.trim() : undefined,
      comment: comment.trim(),
      isApproved: true, // Default to approved or can be moderated by admin
    });

    sendResponse({
      res,
      statusCode: 201,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};
