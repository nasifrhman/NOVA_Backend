import mongoose from 'mongoose';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';

const startServer = async (): Promise<void> => {
  const app = createApp();

  const server = app.listen(ENV.PORT, () => {
    console.log(`=============================================`);
    console.log(`👗 NOVA Fashion Backend API Server`);
    console.log(`🚀 Port:         ${ENV.PORT}`);
    console.log(`🌍 Environment:  ${ENV.NODE_ENV}`);
    console.log(`🔗 API Base:     http://localhost:${ENV.PORT}/api/v1`);
    console.log(`🩺 Healthcheck:  http://localhost:${ENV.PORT}/api/v1/health`);
    console.log(`🌐 Allowed CORS: Storefront (${ENV.FRONTEND_URL})`);
    console.log(`                 Dashboard (${ENV.DASHBOARD_URL})`);
    console.log(`=============================================`);
  });

  // Connect to database
  connectDB().catch((err) => {
    console.error('Initial DB connection error:', err);
  });

  // Graceful shutdown
  const handleShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await mongoose.connection.close(false);
        console.log('MongoDB connection closed.');
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
      }
      process.exit(0);
    });

    setTimeout(() => {
      console.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
};

process.on('unhandledRejection', (reason: any) => {
  console.error('\n💥 [UNHANDLED PROMISE REJECTION]:', reason);
});

process.on('uncaughtException', (err: Error) => {
  console.error('\n💥 [UNCAUGHT EXCEPTION]:', err);
});

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
