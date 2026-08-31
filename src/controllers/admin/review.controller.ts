import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Review } from '../../models/Review.model.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { NotFoundError } from '../../utils/errors.js';

export const getAdminReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const { isApproved, search } = req.query;
    const filter: Record<string, unknown> = {};

    if (isApproved !== undefined) {
      filter.isApproved = isApproved === 'true';
    }

    if (search) {
      filter.$or = [
        { customerName: { $regex: String(search), $options: 'i' } },
        { comment: { $regex: String(search), $options: 'i' } },
      ];
    }

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('product', 'title slug images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    sendResponse({
      res,
      message: 'Admin reviews fetched successfully',
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateReviewStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const review = await Review.findByIdAndUpdate(
      id,
      { isApproved: Boolean(isApproved) },
      { new: true }
    );

    if (!review) {
      throw new NotFoundError(`Review not found with ID: ${id}`);
    }

    // Recalculate average rating on product
    await Review.calculateAverageRating(review.product as Types.ObjectId);

    sendResponse({
      res,
      message: `Review ${isApproved ? 'approved' : 'hidden'} successfully`,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      throw new NotFoundError(`Review not found with ID: ${id}`);
    }

    await Review.calculateAverageRating(review.product as Types.ObjectId);

    sendResponse({
      res,
      message: 'Review deleted successfully',
      data: { id: review._id },
    });
  } catch (error) {
    next(error);
  }
};
