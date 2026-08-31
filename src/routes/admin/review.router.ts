import { Router } from 'express';
import {
  getAdminReviews,
  updateReviewStatus,
  deleteReview,
} from '../../controllers/admin/review.controller.js';

export const adminReviewRouter = Router();

adminReviewRouter.get('/reviews', getAdminReviews);
adminReviewRouter.patch('/reviews/:id', updateReviewStatus);
adminReviewRouter.delete('/reviews/:id', deleteReview);
