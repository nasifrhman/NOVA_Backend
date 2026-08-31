import { Router } from 'express';
import {
  getAdminSettings,
  updateAdminSettings,
} from '../../controllers/admin/setting.controller.js';

export const adminSettingRouter = Router();

adminSettingRouter.get('/settings', getAdminSettings);
adminSettingRouter.patch('/settings', updateAdminSettings);
