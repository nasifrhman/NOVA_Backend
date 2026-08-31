import { Router } from 'express';
import { upload } from '../../middlewares/upload.middleware.js';
import {
  getAdminSettings,
  updateAdminSettings,
  getAdminBanners,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
} from '../../controllers/admin/setting.controller.js';

export const adminSettingRouter = Router();

// Store Settings (supports GET, POST, PUT, PATCH with /settings, /store-settings, /store-config)
adminSettingRouter.get('/settings', getAdminSettings);
adminSettingRouter.get('/store-settings', getAdminSettings);
adminSettingRouter.get('/store-config', getAdminSettings);

adminSettingRouter.post('/settings', upload.any(), updateAdminSettings);
adminSettingRouter.post('/store-settings', upload.any(), updateAdminSettings);
adminSettingRouter.post('/store-config', upload.any(), updateAdminSettings);

adminSettingRouter.patch('/settings', upload.any(), updateAdminSettings);
adminSettingRouter.patch('/store-settings', upload.any(), updateAdminSettings);
adminSettingRouter.patch('/store-config', upload.any(), updateAdminSettings);

adminSettingRouter.put('/settings', upload.any(), updateAdminSettings);
adminSettingRouter.put('/store-settings', upload.any(), updateAdminSettings);
adminSettingRouter.put('/store-config', upload.any(), updateAdminSettings);

// Banner Management
adminSettingRouter.get('/banners', getAdminBanners);
adminSettingRouter.post('/banners', upload.any(), createAdminBanner);
adminSettingRouter.put('/banners/:id', upload.any(), updateAdminBanner);
adminSettingRouter.patch('/banners/:id', upload.any(), updateAdminBanner);
adminSettingRouter.delete('/banners/:id', deleteAdminBanner);
