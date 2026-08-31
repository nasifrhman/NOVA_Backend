import { Types } from 'mongoose';
import { Product } from '../models/Product.model.js';
import { Coupon } from '../models/Coupon.model.js';
import { Setting } from '../models/Setting.model.js';
import { Order, IOrder, IOrderItem, ICustomerInfo, PaymentMethod } from '../models/Order.model.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';

export interface CreateOrderInput {
  customer: ICustomerInfo;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  shippingZone?: 'insideDhaka' | 'outsideDhaka';
  couponCode?: string;
  paymentMethod: PaymentMethod;
  customerNotes?: string;
  user?: Types.ObjectId;
}

export class OrderService {
  /**
   * Validates products, stock, recalculates pricing, calculates shipping & discounts,
   * creates the order and decrements inventory safely.
   */
  static async createOrder(input: CreateOrderInput): Promise<IOrder> {
    if (!input.items || input.items.length === 0) {
      throw new BadRequestError('Order must contain at least one item');
    }

    // 1. Fetch store settings for shipping configuration
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({});
    }

    // 2. Fetch all products and validate inventory & calculate prices
    const orderItems: IOrderItem[] = [];
    let calculatedSubtotal = 0;

    for (const itemInput of input.items) {
      if (!Types.ObjectId.isValid(itemInput.productId)) {
        throw new BadRequestError(`Invalid product ID format: ${itemInput.productId}`);
      }

      const product = await Product.findById(itemInput.productId);
      if (!product || !product.isActive) {
        throw new NotFoundError(`Product not found or unavailable: ${itemInput.productId}`);
      }

      if (itemInput.quantity <= 0) {
        throw new BadRequestError(`Quantity for product "${product.title}" must be at least 1`);
      }

      let variantFound = undefined;
      let availableStock = product.stock;
      let effectivePrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;

      if (itemInput.variantId) {
        variantFound = product.variants.find(
          (v) => v._id?.toString() === itemInput.variantId
        );
        if (!variantFound) {
          throw new BadRequestError(`Variant not found for product "${product.title}"`);
        }
        availableStock = variantFound.stock;
        if (variantFound.price && variantFound.price > 0) {
          effectivePrice = variantFound.price;
        }
      }

      if (availableStock < itemInput.quantity) {
        throw new BadRequestError(
          `Insufficient stock for "${product.title}"${
            variantFound ? ` (${variantFound.size || ''} ${variantFound.color || ''})` : ''
          }. Available: ${availableStock}, Requested: ${itemInput.quantity}`
        );
      }

      const lineSubtotal = effectivePrice * itemInput.quantity;
      calculatedSubtotal += lineSubtotal;

      orderItems.push({
        product: product._id as Types.ObjectId,
        variantId: variantFound ? (variantFound._id as Types.ObjectId) : undefined,
        title: product.title,
        sku: variantFound?.sku || product.sku,
        size: variantFound?.size,
        color: variantFound?.color,
        price: effectivePrice,
        quantity: itemInput.quantity,
        subtotal: lineSubtotal,
        image: variantFound?.image || product.images[0] || '',
      });
    }

    // 3. Calculate shipping fee
    let shippingFee = setting.shipping.insideDhaka;
    const isOutsideDhaka =
      input.shippingZone === 'outsideDhaka' ||
      (input.customer.district &&
        input.customer.district.toLowerCase() !== 'dhaka');

    if (isOutsideDhaka) {
      shippingFee = setting.shipping.outsideDhaka;
    }

    // Free shipping threshold check
    if (
      setting.shipping.freeShippingThreshold > 0 &&
      calculatedSubtotal >= setting.shipping.freeShippingThreshold
    ) {
      shippingFee = 0;
    }

    // 4. Validate and apply coupon if provided
    let discountAmount = 0;
    let validCoupon = null;

    if (input.couponCode) {
      const coupon = await Coupon.findOne({
        code: input.couponCode.trim().toUpperCase(),
        isActive: true,
      });

      if (coupon) {
        const validation = coupon.isValid(calculatedSubtotal);
        if (!validation.valid) {
          throw new BadRequestError(validation.reason || 'Invalid coupon code');
        }
        discountAmount = validation.discountAmount;
        validCoupon = coupon;
      } else {
        throw new BadRequestError('Invalid or expired coupon code');
      }
    }

    const calculatedTotal = Math.max(0, calculatedSubtotal + shippingFee - discountAmount);

    // 5. Decrement inventory safely & increase sales count
    for (const item of orderItems) {
      if (item.variantId) {
        await Product.findOneAndUpdate(
          { _id: item.product, 'variants._id': item.variantId },
          {
            $inc: {
              'variants.$.stock': -item.quantity,
              stock: -item.quantity,
              salesCount: item.quantity,
            },
          }
        );
      } else {
        await Product.findByIdAndUpdate(item.product, {
          $inc: {
            stock: -item.quantity,
            salesCount: item.quantity,
          },
        });
      }
    }

    // 6. If coupon was applied, increment usage count
    if (validCoupon) {
      await Coupon.findByIdAndUpdate(validCoupon._id, {
        $inc: { usedCount: 1 },
      });
    }

    // 7. Create and persist Order
    const orderNumber = generateOrderNumber();
    const order = await Order.create({
      orderNumber,
      customer: input.customer,
      user: input.user,
      items: orderItems,
      subtotal: Math.round(calculatedSubtotal * 100) / 100,
      shippingFee: Math.round(shippingFee * 100) / 100,
      discount: Math.round(discountAmount * 100) / 100,
      couponCode: input.couponCode ? input.couponCode.trim().toUpperCase() : undefined,
      total: Math.round(calculatedTotal * 100) / 100,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentMethod === 'cod' ? 'cod_pending' : 'pending',
      orderStatus: 'pending',
      customerNotes: input.customerNotes,
      statusHistory: [
        {
          status: 'pending',
          changedAt: new Date(),
          note: 'Order placed successfully',
        },
      ],
    });

    return order;
  }

  /**
   * Restores product stock when an order is cancelled or returned
   */
  static async restoreStock(order: IOrder): Promise<void> {
    for (const item of order.items) {
      if (item.variantId) {
        await Product.findOneAndUpdate(
          { _id: item.product, 'variants._id': item.variantId },
          {
            $inc: {
              'variants.$.stock': item.quantity,
              stock: item.quantity,
              salesCount: -item.quantity,
            },
          }
        );
      } else {
        await Product.findByIdAndUpdate(item.product, {
          $inc: {
            stock: item.quantity,
            salesCount: -item.quantity,
          },
        });
      }
    }
  }
}
