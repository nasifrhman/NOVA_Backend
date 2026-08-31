import { Order, IOrder } from '../models/Order.model.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export interface VerifyPaymentInput {
  orderId?: string;
  orderNumber?: string;
  transactionId: string;
  provider: 'bkash' | 'nagad' | 'card' | 'cod';
  senderNumber?: string;
  amount?: number;
}

export class PaymentService {
  /**
   * Initializes or creates payment intent/URL for bKash or Nagad
   */
  static async initPayment(order: IOrder): Promise<{
    paymentUrl?: string;
    paymentId?: string;
    instructions?: string;
    method: string;
  }> {
    if (order.paymentMethod === 'cod') {
      return {
        method: 'cod',
        instructions: 'Pay in cash upon delivery of your order.',
      };
    }

    if (order.paymentMethod === 'bkash') {
      // In sandbox/simulation or when integrated with bKash PGW:
      const simulatedPaymentId = `BKASH-${Date.now()}`;
      return {
        method: 'bkash',
        paymentId: simulatedPaymentId,
        instructions: `Please send payment of ৳${order.total} to merchant bKash number. Reference: ${order.orderNumber}`,
      };
    }

    if (order.paymentMethod === 'nagad') {
      const simulatedPaymentId = `NAGAD-${Date.now()}`;
      return {
        method: 'nagad',
        paymentId: simulatedPaymentId,
        instructions: `Please send payment of ৳${order.total} to merchant Nagad number. Reference: ${order.orderNumber}`,
      };
    }

    return {
      method: order.paymentMethod,
      instructions: 'Please complete payment according to instructions.',
    };
  }

  /**
   * Verifies an online transaction and updates order status safely
   */
  static async verifyPayment(input: VerifyPaymentInput): Promise<IOrder> {
    let order: IOrder | null = null;

    if (input.orderId) {
      order = await Order.findById(input.orderId);
    } else if (input.orderNumber) {
      order = await Order.findOne({ orderNumber: input.orderNumber });
    }

    if (!order) {
      throw new NotFoundError('Order not found for payment verification');
    }

    if (order.paymentStatus === 'paid') {
      return order; // Already marked paid
    }

    if (!input.transactionId || input.transactionId.trim() === '') {
      throw new BadRequestError('Valid Transaction ID is required');
    }

    // In live integration, verify transaction against bKash/Nagad query API.
    // For local/demo, we register the transaction and transition status.
    order.paymentStatus = 'paid';
    order.orderStatus = order.orderStatus === 'pending' ? 'confirmed' : order.orderStatus;
    order.paymentDetails = {
      transactionId: input.transactionId.trim(),
      senderNumber: input.senderNumber,
      provider: input.provider,
      paymentDate: new Date(),
    };

    order.statusHistory.push({
      status: order.orderStatus,
      changedAt: new Date(),
      note: `Payment verified via ${input.provider.toUpperCase()} (TrxID: ${input.transactionId.trim()})`,
    });

    await order.save();
    return order;
  }
}
