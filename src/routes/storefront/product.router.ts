import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  getFeaturedProducts,
  getBestsellerProducts,
  searchProducts,
} from '../../controllers/storefront/product.controller.js';

export const productRouter = Router();

productRouter.get('/products/featured', getFeaturedProducts);
productRouter.get('/products/bestsellers', getBestsellerProducts);
productRouter.get('/products/search', searchProducts);
productRouter.get('/products', getProducts);
productRouter.get('/products/:slug', getProductBySlug);
