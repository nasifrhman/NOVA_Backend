import { Request, Response, NextFunction } from 'express';
import { Category } from '../../models/Category.model.js';
import { Product } from '../../models/Product.model.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import {
  formatUploadedFile,
  processImageOrFile,
} from '../../middlewares/upload.middleware.js';

export const getAdminCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 });

    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat._id });
        return {
          ...cat.toObject(),
          productCount: count,
        };
      })
    );

    sendResponse({
      res,
      message: 'Admin categories fetched successfully',
      data: categoriesWithCount,
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, slug, description, image, isActive, status, order } = req.body;

    if (!name) {
      throw new BadRequestError('Category name is required');
    }

    const generatedSlug =
      slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const resolvedIsActive =
      isActive !== undefined
        ? Boolean(isActive)
        : status !== undefined
        ? String(status).toLowerCase() === 'active'
        : true;

    let finalImage = image ? processImageOrFile(req, image, 'category') : '';
    if (req.file) {
      finalImage = formatUploadedFile(req, req.file).url;
    } else if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      finalImage = formatUploadedFile(req, req.files[0]).url;
    }

    const category = await Category.create({
      name,
      slug: generatedSlug,
      description,
      image: finalImage,
      isActive: resolvedIsActive,
      order: Number(order) || 0,
    });

    sendResponse({
      res,
      statusCode: 201,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: Record<string, any> = { ...req.body };

    if (updateData.status !== undefined && updateData.isActive === undefined) {
      updateData.isActive = String(updateData.status).toLowerCase() === 'active';
    }

    if (req.file) {
      updateData.image = formatUploadedFile(req, req.file).url;
    } else if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      updateData.image = formatUploadedFile(req, req.files[0]).url;
    } else if (updateData.image !== undefined) {
      updateData.image = processImageOrFile(req, updateData.image, 'category');
    }

    const category = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      throw new NotFoundError(`Category not found with ID: ${id}`);
    }

    sendResponse({
      res,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if any product is assigned to this category
    const linkedProducts = await Product.countDocuments({ category: id });
    if (linkedProducts > 0) {
      throw new BadRequestError(
        `Cannot delete category. ${linkedProducts} product(s) are currently assigned to it.`
      );
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      throw new NotFoundError(`Category not found with ID: ${id}`);
    }

    sendResponse({
      res,
      message: 'Category deleted successfully',
      data: { id: category._id },
    });
  } catch (error) {
    next(error);
  }
};
