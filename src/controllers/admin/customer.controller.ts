import { Request, Response, NextFunction } from 'express';
import { Order } from '../../models/Order.model.js';
import { User } from '../../models/User.model.js';
import { sendResponse } from '../../utils/apiResponse.js';
import { NotFoundError } from '../../utils/errors.js';

export const getAdminCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const matchStage: Record<string, unknown> = {};
    if (search) {
      matchStage.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
      ];
    }

    const [aggregatedCustomers, totalResult] = await Promise.all([
      Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$customer.phone',
            name: { $first: '$customer.name' },
            phone: { $first: '$customer.phone' },
            email: { $first: '$customer.email' },
            address: { $first: '$customer.address' },
            district: { $first: '$customer.district' },
            totalOrders: { $sum: 1 },
            totalSpent: {
              $sum: {
                $cond: [
                  { $in: ['$orderStatus', ['cancelled', 'returned']] },
                  0,
                  '$total',
                ],
              },
            },
            lastOrderDate: { $max: '$createdAt' },
          },
        },
        { $sort: { lastOrderDate: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]),

      Order.aggregate([
        { $match: matchStage },
        { $group: { _id: '$customer.phone' } },
        { $count: 'total' },
      ]),
    ]);

    const total = totalResult[0]?.total || 0;

    sendResponse({
      res,
      message: 'Admin customers fetched successfully',
      data: aggregatedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminCustomerById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params; // Can be phone or user ID

    // Try finding user first or search orders by phone
    const user = id.match(/^[0-9a-fA-F]{24}$/) ? await User.findById(id) : null;
    const phone = user ? user.phone : id;

    const orders = await Order.find({
      $or: [
        { user: user ? user._id : undefined },
        { 'customer.phone': phone },
      ],
    }).sort({ createdAt: -1 });

    if (!user && orders.length === 0) {
      throw new NotFoundError(`Customer not found for identifier: ${id}`);
    }

    const latestOrder = orders[0];
    const totalSpent = orders
      .filter((o) => o.orderStatus !== 'cancelled' && o.orderStatus !== 'returned')
      .reduce((sum, o) => sum + o.total, 0);

    const customerProfile = {
      name: user?.name || latestOrder?.customer.name,
      email: user?.email || latestOrder?.customer.email,
      phone: user?.phone || latestOrder?.customer.phone,
      address: latestOrder?.customer.address,
      district: latestOrder?.customer.district,
      totalOrders: orders.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
      orders,
    };

    sendResponse({
      res,
      message: 'Customer details fetched successfully',
      data: customerProfile,
    });
  } catch (error) {
    next(error);
  }
};
