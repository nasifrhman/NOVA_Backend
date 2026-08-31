import { Router } from 'express';
import {
  getStoreConfig,
  getBanners,
} from '../../controllers/storefront/setting.controller.js';

export const settingRouter = Router();

// Storefront settings & banner endpoints
settingRouter.get('/store-config', getStoreConfig);
settingRouter.get('/store-settings', getStoreConfig);
settingRouter.get('/settings', getStoreConfig);
settingRouter.get('/banners', getBanners);
