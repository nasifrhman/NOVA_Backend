import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nova_fashion',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkey_novafashion_secure_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173,http://localhost:5175',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  DASHBOARD_URL: process.env.DASHBOARD_URL || 'http://localhost:5175',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',

  // bKash credentials
  BKASH: {
    BASE_URL: process.env.BKASH_BASE_URL || '',
    APP_KEY: process.env.BKASH_APP_KEY || '',
    APP_SECRET: process.env.BKASH_APP_SECRET || '',
    USERNAME: process.env.BKASH_USERNAME || '',
    PASSWORD: process.env.BKASH_PASSWORD || '',
  },

  // Nagad credentials
  NAGAD: {
    BASE_URL: process.env.NAGAD_BASE_URL || '',
    MERCHANT_ID: process.env.NAGAD_MERCHANT_ID || '',
    PUBLIC_KEY: process.env.NAGAD_PUBLIC_KEY || '',
    PRIVATE_KEY: process.env.NAGAD_PRIVATE_KEY || '',
  },
} as const;
