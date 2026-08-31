import { Router } from 'express';
import {
  adminLogin,
  getAdminProfile,
  adminLogout,
} from '../../controllers/admin/auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

export const adminAuthRouter = Router();

adminAuthRouter.post('/auth/login', adminLogin);
adminAuthRouter.get('/auth/me', authenticate, getAdminProfile);
adminAuthRouter.post('/auth/logout', adminLogout);
