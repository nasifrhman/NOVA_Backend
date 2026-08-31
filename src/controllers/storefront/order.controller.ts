import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { Order } from '../../models/Order.model.js';
import { OrderService } from '../../services/order.service.js';
import { PaymentService } from '../../services/payment.service.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { NotFoundError } from '../../utils/errors.js';

export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      customer,
      items,
      shippingZone,
      couponCode,
      paymentMethod,
      customerNotes,
    } = req.body;

    const order = await OrderService.createOrder({
      customer,
      items,
      shippingZone,
      couponCode,
      paymentMethod,
      customerNotes,
      user: req.user?._id,
    });

    const paymentInfo = await PaymentService.initPayment(order);

    sendResponse({
      res,
      statusCode: 201,
      message: 'Order created successfully',
      data: {
        order,
        payment: paymentInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      $or: [
        { orderNumber: orderId },
        { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : undefined },
      ],
    }).populate('items.product', 'title slug images');

    if (!order) {
      throw new NotFoundError(`Order not found: ${orderId}`);
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
