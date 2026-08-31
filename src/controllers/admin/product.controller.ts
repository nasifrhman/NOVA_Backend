import { Request, Response, NextFunction } from 'express';
import { Product } from '../../models/Product.model.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

export const getAdminProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const { category, search, stockStatus, isActive } = req.query;
    const filter: Record<string, unknown> = {};

    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (stockStatus === 'low') {
      filter.stock = { $lte: 5, $gt: 0 };
    } else if (stockStatus === 'out') {
      filter.stock = { $lte: 0 };
    } else if (stockStatus === 'in') {
      filter.stock = { $gt: 5 };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { sku: { $regex: String(search), $options: 'i' } },
        { tags: { $regex: String(search), $options: 'i' } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    sendResponse({
      res,
      message: 'Admin products fetched successfully',
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate('category', 'name slug');
    if (!product) {
      throw new NotFoundError(`Product not found with ID: ${id}`);
    }

    sendResponse({
      res,
      message: 'Product retrieved successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      slug,
      sku,
      description,
      shortDescription,
      price,
      discountPrice,
      costPrice,
      stock,
      variants,
      images,
      category,
      tags,
      isFeatured,
      isBestseller,
      isActive,
    } = req.body;

    if (!title || price === undefined || !category) {
      throw new BadRequestError('Title, price, and category are required');
    }

    // Auto-generate slug if not provided
    const generatedSlug =
      slug?.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    // Auto-generate SKU if not provided
    const generatedSku =
      sku?.trim() ||
      `NF-${title.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const product = await Product.create({
      title,
      slug: generatedSlug,
      sku: generatedSku,
      description,
      shortDescription,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      costPrice: costPrice ? Number(costPrice) : undefined,
      stock: Number(stock) || 0,
      variants: variants || [],
      images: images || [],
      category,
      tags: tags || [],
      isFeatured: Boolean(isFeatured),
      isBestseller: Boolean(isBestseller),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    sendResponse({
      res,
      statusCode: 201,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug');

    if (!product) {
      throw new NotFoundError(`Product not found with ID: ${id}`);
    }

    sendResponse({
      res,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      throw new NotFoundError(`Product not found with ID: ${id}`);
    }

    sendResponse({
      res,
      message: 'Product deleted successfully',
      data: { id: product._id },
    });
  } catch (error) {
    next(error);
  }
};
