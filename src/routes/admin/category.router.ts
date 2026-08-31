import { Router } from 'express';
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../controllers/admin/category.controller.js';

export const adminCategoryRouter = Router();

adminCategoryRouter.get('/categories', getAdminCategories);
adminCategoryRouter.post('/categories', createCategory);
adminCategoryRouter.patch('/categories/:id', updateCategory);
adminCategoryRouter.delete('/categories/:id', deleteCategory);
