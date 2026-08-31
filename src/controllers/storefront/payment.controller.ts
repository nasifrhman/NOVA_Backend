import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../../services/payment.service.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { BadRequestError } from '../../utils/errors.js';

export const verifyPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId, orderNumber, transactionId, provider, senderNumber } = req.body;

    if (!transactionId) {
      throw new BadRequestError('Transaction ID is required');
    }

    if (!orderId && !orderNumber) {
      throw new BadRequestError('Either orderId or orderNumber is required');
    }

    const verifiedOrder = await PaymentService.verifyPayment({
      orderId,
      orderNumber,
      transactionId,
      provider: provider || 'bkash',
      senderNumber,
    });

    sendResponse({
      res,
      message: 'Payment verified and order updated successfully',
      data: verifiedOrder,
    });
  } catch (error) {
    next(error);
  }
};
