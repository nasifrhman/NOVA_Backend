import { Router } from 'express';
import { upload } from '../../middlewares/upload.middleware.js';
import {
  getAdminProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../controllers/admin/product.controller.js';

export const adminProductRouter = Router();

adminProductRouter.get('/products', getAdminProducts);
adminProductRouter.post('/products', upload.any(), createProduct);
adminProductRouter.get('/products/:id', getProductById);
adminProductRouter.patch('/products/:id', upload.any(), updateProduct);
adminProductRouter.put('/products/:id', upload.any(), updateProduct);
adminProductRouter.delete('/products/:id', deleteProduct);
