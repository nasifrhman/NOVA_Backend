import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ENV } from '../config/env.js';

export const getHealth = (_req: Request, res: Response): void => {
  const stateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbStatus = stateMap[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    success: true,
    message: 'Server is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)}s`,
    environment: ENV.NODE_ENV,
    database: {
      status: dbStatus,
      name: mongoose.connection.name || 'nova_fashion',
    },
  });
};
