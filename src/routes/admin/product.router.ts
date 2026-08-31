import { Router } from 'express';
import {
  getAdminProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../controllers/admin/product.controller.js';

export const adminProductRouter = Router();

adminProductRouter.get('/products', getAdminProducts);
adminProductRouter.post('/products', createProduct);
adminProductRouter.get('/products/:id', getProductById);
adminProductRouter.patch('/products/:id', updateProduct);
adminProductRouter.delete('/products/:id', deleteProduct);
