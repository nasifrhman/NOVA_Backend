import { Router } from 'express';
import { verifyPayment } from '../../controllers/storefront/payment.controller.js';

export const paymentRouter = Router();

paymentRouter.post('/payments/verify', verifyPayment);
