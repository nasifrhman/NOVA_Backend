import { Router } from 'express';
import {
  getCategories,
  getCategoryBySlug,
} from '../../controllers/storefront/category.controller.js';

export const categoryRouter = Router();

categoryRouter.get('/categories', getCategories);
categoryRouter.get('/categories/:slug', getCategoryBySlug);
