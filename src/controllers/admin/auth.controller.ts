import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../../models/User.model.js';
import { ENV } from '../../config/env.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { BadRequestError, UnauthorizedError } from '../../utils/errors.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { ensureDefaultAdmin } from '../../utils/bootstrapAdmin.js';

export const adminLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }

    const cleanEmail = email.toLowerCase().trim();
    const queryEmails: string[] = [cleanEmail];
    if (cleanEmail === 'admin@novafashion.com') queryEmails.push('admin@novafashion.com.bd');
    if (cleanEmail === 'admin@novafashion.com.bd') queryEmails.push('admin@novafashion.com');

    let user: any = await User.findOne({ email: { $in: queryEmails } }).select('+password +role +isActive');

    // If no user found, check if database has no admin and bootstrap automatically
    if (!user) {
      const adminCount = await User.countDocuments({ role: { $in: ['admin', 'superadmin'] } });
      if (adminCount === 0) {
        await ensureDefaultAdmin();
        user = await User.findOne({ email: { $in: queryEmails } }).select('+password +role +isActive');
      }
    }

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is disabled. Please contact administrator.');
    }

    if (user.role !== 'admin' && user.role !== 'superadmin') {
      throw new UnauthorizedError('Access restricted to administrators only.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN as any }
    );

    sendResponse({
      res,
      message: 'Admin login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    sendResponse({
      res,
      message: 'Admin profile retrieved',
      data: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        phone: req.user.phone,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const adminLogout = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendResponse({
      res,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};
