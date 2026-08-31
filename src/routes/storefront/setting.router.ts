import { Router } from 'express';
import { getStoreConfig } from '../../controllers/storefront/setting.controller.js';

export const settingRouter = Router();

settingRouter.get('/store-config', getStoreConfig);
