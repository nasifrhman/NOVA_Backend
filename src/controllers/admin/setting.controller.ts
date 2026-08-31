import { Request, Response, NextFunction } from 'express';
import { Setting } from '../../models/Setting.model.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import {
  formatUploadedFile,
  processImageOrFile,
} from '../../middlewares/upload.middleware.js';

export const getAdminSettings = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }

    sendResponse({
      res,
      message: 'Admin settings fetched successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// Helper to parse complex/nested request bodies from multipart or urlencoded
const parseNestedBody = (body: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};

  for (const key of Object.keys(body)) {
    let value = body[key];

    // If string is JSON or boolean string, parse it
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          value = JSON.parse(trimmed);
        } catch {
          // Keep as string if JSON.parse fails
        }
      } else if (trimmed === 'true') {
        value = true;
      } else if (trimmed === 'false') {
        value = false;
      }
    }

    // Handle keys with dot or bracket notation like "shipping[insideDhaka]" or "shipping.insideDhaka"
    const parts = key.replace(/\]/g, '').split(/[\.\[]/).filter(Boolean);
    if (parts.length > 1) {
      let current = result;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part] || typeof current[part] !== 'object' || Array.isArray(current[part])) {
          current[part] = {};
        }
        current = current[part];
      }
      current[parts[parts.length - 1]] = value;
    } else {
      result[key] = value;
    }
  }

  return result;
};

export const updateAdminSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawData = parseNestedBody(req.body || {});
    const updateData: Record<string, any> = { ...rawData };

    // Process base64 strings in body if sent
    if (updateData.logo) {
      updateData.logo = processImageOrFile(req, updateData.logo, 'logo');
    }
    if (updateData.favicon) {
      updateData.favicon = processImageOrFile(req, updateData.favicon, 'favicon');
    }

    // Handle logo / favicon file upload if attached via multipart form
    if (req.file) {
      const formatted = formatUploadedFile(req, req.file);
      if (req.file.fieldname === 'logo' || req.file.fieldname === 'storeLogo' || req.file.fieldname === 'image') {
        updateData.logo = formatted.url;
      } else if (req.file.fieldname === 'favicon' || req.file.fieldname === 'icon') {
        updateData.favicon = formatted.url;
      }
    } else if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.files.forEach((f) => {
        const formatted = formatUploadedFile(req, f);
        if (f.fieldname === 'logo' || f.fieldname === 'storeLogo' || f.fieldname === 'image') {
          updateData.logo = formatted.url;
        } else if (f.fieldname === 'favicon' || f.fieldname === 'icon') {
          updateData.favicon = formatted.url;
        }
      });
    }

    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create(updateData);
    } else {
      // Merge nested objects so partial updates don't wipe out other sub-properties
      if (updateData.shipping && typeof updateData.shipping === 'object') {
        const existingShipping = (settings.shipping as any) || {};
        updateData.shipping = {
          ...existingShipping,
          ...updateData.shipping,
        };
      }

      if (updateData.paymentMethods && typeof updateData.paymentMethods === 'object') {
        const existingPayment = (settings.paymentMethods as any) || {};
        updateData.paymentMethods = {
          ...existingPayment,
          ...updateData.paymentMethods,
          cod: {
            ...(existingPayment.cod || {}),
            ...(updateData.paymentMethods.cod || {}),
          },
          bkash: {
            ...(existingPayment.bkash || {}),
            ...(updateData.paymentMethods.bkash || {}),
          },
          nagad: {
            ...(existingPayment.nagad || {}),
            ...(updateData.paymentMethods.nagad || {}),
          },
        };
      }

      if (updateData.socialLinks && typeof updateData.socialLinks === 'object') {
        const existingSocial = (settings.socialLinks as any) || {};
        updateData.socialLinks = {
          ...existingSocial,
          ...updateData.socialLinks,
        };
      }

      // Do not overwrite banners unless explicitly provided
      if (updateData.banners === undefined && settings.banners) {
        delete updateData.banners;
      }

      settings = await Setting.findByIdAndUpdate(settings._id, updateData, {
        new: true,
        runValidators: false,
      });
    }

    sendResponse({
      res,
      message: 'Admin settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== Banner Management ====================

export const getAdminBanners = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }

    const banners = (settings.banners || []).sort((a, b) => {
      const orderA = a.sortOrder !== undefined ? a.sortOrder : a.order !== undefined ? a.order : 0;
      const orderB = b.sortOrder !== undefined ? b.sortOrder : b.order !== undefined ? b.order : 0;
      return orderA - orderB;
    });

    sendResponse({
      res,
      message: 'Admin banners fetched successfully',
      data: banners,
    });
  } catch (error) {
    next(error);
  }
};

export const createAdminBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      subtitle,
      type,
      link,
      buttonUrl,
      buttonText,
      image,
      desktopImage,
      mobileImage,
      status,
      isActive,
      order,
      sortOrder,
    } = req.body;

    let finalDesktopImage = desktopImage ? processImageOrFile(req, desktopImage, 'banner-desktop') : '';
    let finalMobileImage = mobileImage ? processImageOrFile(req, mobileImage, 'banner-mobile') : '';
    let finalImage = image ? processImageOrFile(req, image, 'banner') : '';

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.files.forEach((f) => {
        const formatted = formatUploadedFile(req, f);
        if (f.fieldname === 'desktopImage' || f.fieldname === 'desktop') {
          finalDesktopImage = formatted.url;
        } else if (f.fieldname === 'mobileImage' || f.fieldname === 'mobile') {
          finalMobileImage = formatted.url;
        } else if (f.fieldname === 'image' || f.fieldname === 'file' || f.fieldname === 'banner') {
          finalImage = formatted.url;
        } else if (!finalImage) {
          finalImage = formatted.url;
        }
      });
    } else if (req.file) {
      const formatted = formatUploadedFile(req, req.file);
      if (req.file.fieldname === 'desktopImage' || req.file.fieldname === 'desktop') {
        finalDesktopImage = formatted.url;
      } else if (req.file.fieldname === 'mobileImage' || req.file.fieldname === 'mobile') {
        finalMobileImage = formatted.url;
      } else {
        finalImage = formatted.url;
      }
    }

    if (!finalImage && finalDesktopImage) {
      finalImage = finalDesktopImage;
    }
    if (!finalDesktopImage && finalImage) {
      finalDesktopImage = finalImage;
    }
    if (!finalMobileImage && finalImage) {
      finalMobileImage = finalImage;
    }

    if (!finalImage && !finalDesktopImage && !finalMobileImage) {
      throw new BadRequestError('Banner image is required (either as uploaded file, base64 data, or image URL)');
    }

    const finalLink = (link || buttonUrl || '').trim();
    const finalButtonUrl = (buttonUrl || link || '').trim();
    const finalOrder = order !== undefined ? Number(order) : sortOrder !== undefined ? Number(sortOrder) : 0;
    const finalSortOrder = sortOrder !== undefined ? Number(sortOrder) : finalOrder;
    const resolvedIsActive =
      isActive !== undefined
        ? Boolean(isActive)
        : status !== undefined
        ? String(status).toLowerCase() === 'active'
        : true;
    const resolvedStatus = status || (resolvedIsActive ? 'Active' : 'Inactive');

    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }

    const newBanner = {
      title: title || '',
      subtitle: subtitle || '',
      type: type || 'Hero',
      image: finalImage,
      desktopImage: finalDesktopImage || finalImage,
      mobileImage: finalMobileImage || finalImage,
      buttonText: buttonText || '',
      buttonUrl: finalButtonUrl,
      link: finalLink,
      status: resolvedStatus,
      isActive: resolvedIsActive,
      order: finalOrder,
      sortOrder: finalSortOrder,
    };

    settings.banners = settings.banners || [];
    settings.banners.push(newBanner as any);
    await settings.save();

    const created = settings.banners[settings.banners.length - 1];

    sendResponse({
      res,
      statusCode: 201,
      message: 'Banner created successfully',
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    let settings = await Setting.findOne();
    if (!settings) {
      throw new NotFoundError('Settings not found');
    }

    const bannerIndex = (settings.banners || []).findIndex(
      (b: any) => String(b._id) === String(id)
    );

    if (bannerIndex === -1) {
      throw new NotFoundError(`Banner not found with ID: ${id}`);
    }

    const currentBanner: any = settings.banners![bannerIndex];
    if (req.body.title !== undefined) currentBanner.title = req.body.title;
    if (req.body.subtitle !== undefined) currentBanner.subtitle = req.body.subtitle;
    if (req.body.type !== undefined) currentBanner.type = req.body.type;
    if (req.body.buttonText !== undefined) currentBanner.buttonText = req.body.buttonText;
    if (req.body.buttonUrl !== undefined) {
      currentBanner.buttonUrl = req.body.buttonUrl;
      if (req.body.link === undefined) currentBanner.link = req.body.buttonUrl;
    }
    if (req.body.link !== undefined) {
      currentBanner.link = req.body.link;
      if (req.body.buttonUrl === undefined) currentBanner.buttonUrl = req.body.link;
    }
    if (req.body.status !== undefined) {
      currentBanner.status = req.body.status;
      if (req.body.isActive === undefined) {
        currentBanner.isActive = String(req.body.status).toLowerCase() === 'active';
      }
    }
    if (req.body.isActive !== undefined) {
      currentBanner.isActive = Boolean(req.body.isActive);
      if (req.body.status === undefined) {
        currentBanner.status = currentBanner.isActive ? 'Active' : 'Inactive';
      }
    }
    if (req.body.order !== undefined) currentBanner.order = Number(req.body.order);
    if (req.body.sortOrder !== undefined) {
      currentBanner.sortOrder = Number(req.body.sortOrder);
      if (req.body.order === undefined) currentBanner.order = Number(req.body.sortOrder);
    }

    // Process files and base64 strings
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.files.forEach((f) => {
        const formatted = formatUploadedFile(req, f);
        if (f.fieldname === 'desktopImage' || f.fieldname === 'desktop') {
          currentBanner.desktopImage = formatted.url;
          if (!req.body.image) currentBanner.image = formatted.url;
        } else if (f.fieldname === 'mobileImage' || f.fieldname === 'mobile') {
          currentBanner.mobileImage = formatted.url;
        } else if (f.fieldname === 'image' || f.fieldname === 'file' || f.fieldname === 'banner') {
          currentBanner.image = formatted.url;
          if (!currentBanner.desktopImage) currentBanner.desktopImage = formatted.url;
        } else {
          currentBanner.image = formatted.url;
        }
      });
    } else if (req.file) {
      const formatted = formatUploadedFile(req, req.file);
      if (req.file.fieldname === 'desktopImage' || req.file.fieldname === 'desktop') {
        currentBanner.desktopImage = formatted.url;
        currentBanner.image = formatted.url;
      } else if (req.file.fieldname === 'mobileImage' || req.file.fieldname === 'mobile') {
        currentBanner.mobileImage = formatted.url;
      } else {
        currentBanner.image = formatted.url;
      }
    } else {
      if (req.body.desktopImage !== undefined) {
        currentBanner.desktopImage = processImageOrFile(req, req.body.desktopImage, 'banner-desktop');
        if (req.body.image === undefined) currentBanner.image = currentBanner.desktopImage;
      }
      if (req.body.mobileImage !== undefined) {
        currentBanner.mobileImage = processImageOrFile(req, req.body.mobileImage, 'banner-mobile');
      }
      if (req.body.image !== undefined) {
        currentBanner.image = processImageOrFile(req, req.body.image, 'banner');
      }
    }

    settings.markModified('banners');
    await settings.save();

    sendResponse({
      res,
      message: 'Banner updated successfully',
      data: settings.banners![bannerIndex],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    let settings = await Setting.findOne();
    if (!settings) {
      throw new NotFoundError('Settings not found');
    }

    const initialLength = settings.banners?.length || 0;
    settings.banners = (settings.banners || []).filter(
      (b: any) => String(b._id) !== String(id)
    );

    if (settings.banners.length === initialLength) {
      throw new NotFoundError(`Banner not found with ID: ${id}`);
    }

    settings.markModified('banners');
    await settings.save();

    sendResponse({
      res,
      message: 'Banner deleted successfully',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};
