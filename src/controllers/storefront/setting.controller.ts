import { Request, Response, NextFunction } from 'express';
import { Setting } from '../../models/Setting.model.js';
import { sendResponse } from '../../utils/apiResponse.js';

export const getStoreConfig = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }

    // Return safe public config (no credentials or private admin tokens)
    const publicConfig = {
      storeName: settings.storeName,
      tagline: settings.tagline,
      logo: settings.logo,
      favicon: settings.favicon,
      email: settings.email,
      phone: settings.phone,
      address: settings.address,
      currency: settings.currency,
      currencySymbol: settings.currencySymbol,
      shipping: settings.shipping,
      paymentMethods: {
        cod: settings.paymentMethods.cod,
        bkash: {
          enabled: settings.paymentMethods.bkash.enabled,
          merchantNumber: settings.paymentMethods.bkash.merchantNumber,
        },
        nagad: {
          enabled: settings.paymentMethods.nagad.enabled,
          merchantNumber: settings.paymentMethods.nagad.merchantNumber,
        },
      },
      socialLinks: settings.socialLinks,
      notice: settings.notice,
      banners: settings.banners,
    };

    sendResponse({
      res,
      message: 'Store configuration fetched successfully',
      data: publicConfig,
    });
  } catch (error) {
    next(error);
  }
};
