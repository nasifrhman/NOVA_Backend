import { Request, Response, NextFunction } from 'express';
import { Setting } from '../../models/Setting.model.js';
import { sendResponse } from '../../utils/apiResponse.js';

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

export const updateAdminSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create(req.body);
    } else {
      settings = await Setting.findByIdAndUpdate(settings._id, req.body, {
        new: true,
        runValidators: true,
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
