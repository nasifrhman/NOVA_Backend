import { Router } from 'express';
import {
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
} from '../../controllers/admin/order.controller.js';

export const adminOrderRouter = Router();

adminOrderRouter.get('/orders', getAdminOrders);
adminOrderRouter.get('/orders/:id', getAdminOrderById);
adminOrderRouter.patch('/orders/:id/status', updateOrderStatus);
