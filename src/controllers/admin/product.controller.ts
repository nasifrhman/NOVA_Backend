import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Product } from '../../models/Product.model.js';
import { Category } from '../../models/Category.model.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import {
  formatUploadedFile,
  processImagesArray,
  processImageOrFile,
} from '../../middlewares/upload.middleware.js';

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
      name,
      slug,
      sku,
      description,
      shortDescription,
      price,
      originalPrice,
      discountPrice,
      costPrice,
      stock,
      lowStockThreshold,
      brand,
      subCategory,
      variants,
      images,
      category,
      categoryId,
      tags,
      isFeatured,
      isBestseller,
      isBestSeller,
      isNewArrival,
      isActive,
      status,
    } = req.body;

    const productTitle = (title || name)?.trim();
    if (!productTitle) {
      throw new BadRequestError('Product title/name is required');
    }

    // Determine category ID
    let finalCategoryId = categoryId || category;
    if (!finalCategoryId) {
      throw new BadRequestError('Product category is required');
    }

    // If category is not an ObjectId, find it in Category collection
    if (!mongoose.Types.ObjectId.isValid(String(finalCategoryId))) {
      const foundCategory = await Category.findOne({
        $or: [
          { slug: String(finalCategoryId).toLowerCase() },
          { name: new RegExp(`^${String(finalCategoryId)}$`, 'i') },
        ],
      });
      if (foundCategory) {
        finalCategoryId = foundCategory._id;
      } else {
        throw new BadRequestError(`Category '${finalCategoryId}' not found. Please provide a valid category ID or name.`);
      }
    }

    // Parse pricing
    const mainPrice = price !== undefined && price !== null ? Number(price) : (originalPrice !== undefined ? Number(originalPrice) : undefined);
    if (mainPrice === undefined || isNaN(mainPrice)) {
      throw new BadRequestError('Product price is required and must be a valid number');
    }

    const calculatedDiscountPrice =
      discountPrice !== undefined && discountPrice !== null && discountPrice !== ''
        ? Number(discountPrice)
        : (originalPrice !== undefined && price !== undefined && Number(originalPrice) > Number(price)
            ? Number(price)
            : undefined);

    const calculatedPrice =
      originalPrice !== undefined && price !== undefined && Number(originalPrice) > Number(price)
        ? Number(originalPrice)
        : mainPrice;

    // Auto-generate slug if not provided
    const generatedSlug =
      slug?.trim() ||
      productTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    // Auto-generate SKU if not provided
    const generatedSku =
      sku?.trim() ||
      `NF-${productTitle.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const resolvedIsActive =
      isActive !== undefined
        ? Boolean(isActive)
        : status !== undefined
        ? String(status).toLowerCase() === 'active'
        : true;

    const resolvedIsBestseller =
      isBestseller !== undefined
        ? Boolean(isBestseller)
        : isBestSeller !== undefined
        ? Boolean(isBestSeller)
        : false;

    // Collect uploaded image URLs if multipart files were attached or base64 data passed
    let finalImages: string[] = [];
    if (images) {
      finalImages = processImagesArray(req, images, 'product');
    }

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadedUrls = (req.files as Express.Multer.File[]).map((f) => formatUploadedFile(req, f).url);
      finalImages = [...finalImages, ...uploadedUrls];
    } else if (req.file) {
      finalImages.push(formatUploadedFile(req, req.file).url);
    }

    const product = await Product.create({
      title: productTitle,
      slug: generatedSlug,
      sku: generatedSku,
      description: description || shortDescription || productTitle,
      shortDescription: shortDescription || '',
      price: calculatedPrice,
      discountPrice: calculatedDiscountPrice,
      costPrice: costPrice !== undefined && costPrice !== null && costPrice !== '' ? Number(costPrice) : undefined,
      stock: Number(stock) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 5,
      brand: brand || 'NOVA Fashion',
      subCategory: subCategory || '',
      variants: Array.isArray(variants) ? variants : [],
      images: finalImages,
      category: finalCategoryId,
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      isFeatured: Boolean(isFeatured),
      isBestseller: resolvedIsBestseller,
      isNewArrival: isNewArrival !== undefined ? Boolean(isNewArrival) : true,
      isActive: resolvedIsActive,
    });

    const populatedProduct = await Product.findById(product._id).populate('category', 'name slug');

    sendResponse({
      res,
      statusCode: 201,
      message: 'Product created successfully',
      data: populatedProduct,
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
    const updateData: Record<string, any> = { ...req.body };

    if (updateData.name && !updateData.title) {
      updateData.title = updateData.name;
    }

    if (updateData.categoryId && !updateData.category) {
      updateData.category = updateData.categoryId;
    }

    if (updateData.status !== undefined && updateData.isActive === undefined) {
      updateData.isActive = String(updateData.status).toLowerCase() === 'active';
    }

    if (updateData.isBestSeller !== undefined && updateData.isBestseller === undefined) {
      updateData.isBestseller = Boolean(updateData.isBestSeller);
    }

    if (updateData.category && !mongoose.Types.ObjectId.isValid(String(updateData.category))) {
      const foundCategory = await Category.findOne({
        $or: [
          { slug: String(updateData.category).toLowerCase() },
          { name: new RegExp(`^${String(updateData.category)}$`, 'i') },
        ],
      });
      if (foundCategory) {
        updateData.category = foundCategory._id;
      }
    }

    // Handle newly uploaded images if files are attached or base64 images in body
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadedUrls = (req.files as Express.Multer.File[]).map((f) => formatUploadedFile(req, f).url);
      const existingImages = updateData.images ? processImagesArray(req, updateData.images, 'product') : [];
      updateData.images = [...existingImages, ...uploadedUrls];
    } else if (req.file) {
      const newUrl = formatUploadedFile(req, req.file).url;
      const existingImages = updateData.images ? processImagesArray(req, updateData.images, 'product') : [];
      updateData.images = [...existingImages, newUrl];
    } else if (updateData.images !== undefined) {
      updateData.images = processImagesArray(req, updateData.images, 'product');
    }

    const product = await Product.findByIdAndUpdate(id, updateData, {
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
