import { Router } from 'express';
import { upload } from '../../middlewares/upload.middleware.js';
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../controllers/admin/category.controller.js';

export const adminCategoryRouter = Router();

adminCategoryRouter.get('/categories', getAdminCategories);
adminCategoryRouter.post('/categories', upload.any(), createCategory);
adminCategoryRouter.patch('/categories/:id', upload.any(), updateCategory);
adminCategoryRouter.put('/categories/:id', upload.any(), updateCategory);
adminCategoryRouter.delete('/categories/:id', deleteCategory);
