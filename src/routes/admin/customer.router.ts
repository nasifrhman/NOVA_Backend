import { Router } from 'express';
import {
  getAdminCustomers,
  getAdminCustomerById,
} from '../../controllers/admin/customer.controller.js';

export const adminCustomerRouter = Router();

adminCustomerRouter.get('/customers', getAdminCustomers);
adminCustomerRouter.get('/customers/:id', getAdminCustomerById);
