import path from 'node:path';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env.js';
import { apiRouter } from './routes/api.router.js';
import { notFoundMiddleware } from './middlewares/notFound.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

export const createApp = (): Application => {
  const app = express();

  // 1. Security HTTP Headers (Allow cross-origin media for images/videos)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // 2. Serve Static Uploaded Files (Images, Videos, Documents)
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // 2. CORS configuration (Storefront: 3000, Dashboard: 5173/5175, + env origins)
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5175',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5175',
  ];

  const envOrigins = ENV.CORS_ORIGIN
    ? ENV.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  const allowedOrigins = Array.from(
    new Set([
      ...defaultOrigins,
      ...envOrigins,
      ENV.FRONTEND_URL,
      ENV.DASHBOARD_URL,
    ].filter(Boolean))
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or Postman)
        if (!origin) return callback(null, true);

        if (
          ENV.CORS_ORIGIN === '*' ||
          allowedOrigins.includes(origin) ||
          allowedOrigins.includes('*')
        ) {
          return callback(null, true);
        }

        return callback(new Error(`CORS origin not allowed: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // 3. Body parsers (50MB limit to handle high-resolution image uploads & base64)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 4. Request logging
  app.use(morgan(ENV.IS_PRODUCTION ? 'combined' : 'dev'));

  // 5. Rate limiting for general API requests
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    },
  });
  app.use('/api', apiLimiter);

  // 6. Welcome Root Endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      name: 'NOVA Fashion API Server',
      version: '1.0.0',
      status: 'active',
      endpoints: {
        health: '/api/v1/health',
        storefront: {
          products: '/api/v1/products',
          categories: '/api/v1/categories',
          orders: '/api/v1/orders',
          storeConfig: '/api/v1/store-config',
        },
        dashboard: {
          auth: '/api/v1/admin/auth/login',
          stats: '/api/v1/admin/dashboard/stats',
          products: '/api/v1/admin/products',
          orders: '/api/v1/admin/orders',
        },
      },
    });
  });

  // 7. Mount Primary API Router
  app.use('/api/v1', apiRouter);

  // 8. 404 & Centralized Error Handlers
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};
