import { Request, Response, NextFunction } from 'express';
import { Order, OrderStatus, PaymentStatus } from '../../models/Order.model.js';
import { OrderService } from '../../services/order.service.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

export const getAdminOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const { status, paymentStatus, search, startDate, endDate } = req.query;
    const filter: Record<string, unknown> = {};

    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      filter.createdAt = dateFilter;
    }

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: String(search), $options: 'i' } },
        { 'customer.name': { $regex: String(search), $options: 'i' } },
        { 'customer.phone': { $regex: String(search), $options: 'i' } },
        { 'customer.email': { $regex: String(search), $options: 'i' } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    sendResponse({
      res,
      message: 'Admin orders fetched successfully',
      data: orders,
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

export const getAdminOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).populate('items.product', 'title slug images');
    if (!order) {
      throw new NotFoundError(`Order not found with ID: ${id}`);
    }

    sendResponse({
      res,
      message: 'Order retrieved successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus, adminNotes, statusNote } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      throw new NotFoundError(`Order not found with ID: ${id}`);
    }

    const previousStatus = order.orderStatus;

    if (orderStatus) {
      const validStatuses: OrderStatus[] = [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'returned',
      ];
      if (!validStatuses.includes(orderStatus)) {
        throw new BadRequestError(`Invalid order status: ${orderStatus}`);
      }

      // If transitioning to cancelled or returned from active status, restore stock
      if (
        (orderStatus === 'cancelled' || orderStatus === 'returned') &&
        previousStatus !== 'cancelled' &&
        previousStatus !== 'returned'
      ) {
        await OrderService.restoreStock(order);
      }

      order.orderStatus = orderStatus;
      order.statusHistory.push({
        status: orderStatus,
        changedAt: new Date(),
        note: statusNote || `Status updated to ${orderStatus} by Admin`,
      });
    }

    if (paymentStatus) {
      const validPaymentStatuses: PaymentStatus[] = [
        'pending',
        'paid',
        'failed',
        'refunded',
        'cod_pending',
      ];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        throw new BadRequestError(`Invalid payment status: ${paymentStatus}`);
      }
      order.paymentStatus = paymentStatus;
    }

    if (adminNotes !== undefined) {
      order.adminNotes = adminNotes;
    }

    await order.save();

    sendResponse({
      res,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
