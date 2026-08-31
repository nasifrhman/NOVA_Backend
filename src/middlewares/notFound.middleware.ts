import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env.js';

export const notFoundMiddleware = (req: Request, res: Response, _next: NextFunction): void => {
  if (!ENV.IS_PRODUCTION) {
    console.warn(`🔍 [404 NOT FOUND] ${req.method} ${req.originalUrl}`);
  }
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
