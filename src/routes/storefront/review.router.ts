import { Router } from 'express';
import {
  getReviews,
  createReview,
} from '../../controllers/storefront/review.controller.js';

export const reviewRouter = Router();

reviewRouter.get('/reviews', getReviews);
reviewRouter.post('/reviews', createReview);
