import { Router } from 'express';
import {
  createOrder,
  getOrderById,
} from '../../controllers/storefront/order.controller.js';

export const orderRouter = Router();

orderRouter.post('/orders', createOrder);
orderRouter.get('/orders/:orderId', getOrderById);
