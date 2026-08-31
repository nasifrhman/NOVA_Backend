import { Request, Response, NextFunction } from 'express';
import { Category } from '../../models/Category.model.js';
import { Product } from '../../models/Product.model.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { NotFoundError } from '../../utils/errors.js';

export const getCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });

    // Populate active product count per category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({
          category: cat._id,
          isActive: true,
        });
        return {
          ...cat.toObject(),
          productCount: count,
        };
      })
    );

    sendResponse({
      res,
      message: 'Categories fetched successfully',
      data: categoriesWithCount,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({
      $or: [{ slug }, { _id: slug.match(/^[0-9a-fA-F]{24}$/) ? slug : undefined }],
      isActive: true,
    });

    if (!category) {
      throw new NotFoundError(`Category not found: ${slug}`);
    }

    const productCount = await Product.countDocuments({
      category: category._id,
      isActive: true,
    });

    sendResponse({
      res,
      message: 'Category fetched successfully',
      data: {
        ...category.toObject(),
        productCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
