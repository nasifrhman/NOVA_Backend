import { Request, Response, NextFunction } from 'express';
import { Product } from '../../models/Product.model.js';
import { Category } from '../../models/Category.model.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { NotFoundError } from '../../utils/errors.js';

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const {
      category,
      minPrice,
      maxPrice,
      sort,
      inStock,
      isFeatured,
      isBestseller,
      search,
      tag,
    } = req.query;

    const queryFilter: Record<string, unknown> = { isActive: true };

    // Category filter by slug or ID
    if (category) {
      const categoryDoc = await Category.findOne({
        $or: [{ slug: category }, { _id: category }],
        isActive: true,
      });
      if (categoryDoc) {
        queryFilter.category = categoryDoc._id;
      }
    }

    // Price range
    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      queryFilter.price = priceFilter;
    }

    // Stock availability
    if (inStock === 'true' || inStock === '1') {
      queryFilter.stock = { $gt: 0 };
    }

    // Featured & Bestsellers
    if (isFeatured === 'true' || isFeatured === '1') {
      queryFilter.isFeatured = true;
    }
    if (isBestseller === 'true' || isBestseller === '1') {
      queryFilter.isBestseller = true;
    }

    // Tag filter
    if (tag) {
      queryFilter.tags = tag;
    }

    // Search query
    if (search) {
      queryFilter.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { description: { $regex: String(search), $options: 'i' } },
        { tags: { $regex: String(search), $options: 'i' } },
        { sku: { $regex: String(search), $options: 'i' } },
      ];
    }

    // Sort order
    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'price-low') {
      sortOptions = { price: 1 };
    } else if (sort === 'price-high') {
      sortOptions = { price: -1 };
    } else if (sort === 'popular') {
      sortOptions = { salesCount: -1, rating: -1 };
    } else if (sort === 'rating') {
      sortOptions = { rating: -1 };
    }

    const [products, total] = await Promise.all([
      Product.find(queryFilter)
        .populate('category', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(queryFilter),
    ]);

    sendResponse({
      res,
      message: 'Products fetched successfully',
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

export const getProductBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({
      $or: [{ slug }, { _id: slug.match(/^[0-9a-fA-F]{24}$/) ? slug : undefined }],
      isActive: true,
    }).populate('category', 'name slug description');

    if (!product) {
      throw new NotFoundError(`Product not found: ${slug}`);
    }

    sendResponse({
      res,
      message: 'Product details fetched successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 8;

    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit);

    sendResponse({
      res,
      message: 'Featured products fetched successfully',
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const getBestsellerProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 8;

    const products = await Product.find({
      isActive: true,
      $or: [{ isBestseller: true }, { salesCount: { $gt: 0 } }],
    })
      .populate('category', 'name slug')
      .sort({ salesCount: -1, rating: -1 })
      .limit(limit);

    sendResponse({
      res,
      message: 'Bestseller products fetched successfully',
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const searchProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = (req.query.q as string) || '';
    const limit = parseInt(req.query.limit as string, 10) || 10;

    if (!query.trim()) {
      sendResponse({
        res,
        message: 'Search query empty',
        data: [],
      });
      return;
    }

    const products = await Product.find({
      isActive: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ],
    })
      .populate('category', 'name slug')
      .limit(limit)
      .select('title slug price discountPrice images stock rating category');

    sendResponse({
      res,
      message: 'Search completed successfully',
      data: products,
    });
  } catch (error) {
    next(error);
  }
};
