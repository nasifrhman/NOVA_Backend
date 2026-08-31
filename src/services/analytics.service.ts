import { Order } from '../models/Order.model.js';
import { Product } from '../models/Product.model.js';
import { User } from '../models/User.model.js';

export class AnalyticsService {
  /**
   * Retrieves high-level dashboard metrics (sales, counts, inventory alerts)
   */
  static async getDashboardStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

    // Aggregate overall sales from paid / confirmed / completed orders
    const validSalesCondition = {
      orderStatus: { $nin: ['cancelled', 'returned'] },
    };

    const [
      totalSalesResult,
      todaySalesResult,
      monthlySalesResult,
      orderCounts,
      totalCustomers,
      totalProducts,
      lowStockProducts,
    ] = await Promise.all([
      // Total Sales
      Order.aggregate([
        { $match: validSalesCondition },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      // Today's Sales
      Order.aggregate([
        { $match: { ...validSalesCondition, createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      // Monthly Sales
      Order.aggregate([
        { $match: { ...validSalesCondition, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      // Order counts by status
      Order.aggregate([
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 },
          },
        },
      ]),

      // Total distinct customers (from User customer role + distinct order phone/email)
      User.countDocuments({ role: 'customer' }),

      // Total products
      Product.countDocuments({ isActive: true }),

      // Low stock products (total stock <= 5)
      Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
    ]);

    const totalSales = totalSalesResult[0]?.total || 0;
    const todaySales = todaySalesResult[0]?.total || 0;
    const monthlySales = monthlySalesResult[0]?.total || 0;

    let totalOrders = 0;
    let pendingOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;
    let processingOrders = 0;
    let shippedOrders = 0;

    for (const item of orderCounts) {
      totalOrders += item.count;
      if (item._id === 'pending') pendingOrders = item.count;
      if (item._id === 'delivered') deliveredOrders = item.count;
      if (item._id === 'cancelled') cancelledOrders = item.count;
      if (item._id === 'processing') processingOrders = item.count;
      if (item._id === 'shipped') shippedOrders = item.count;
    }

    return {
      totalSales: Math.round(totalSales * 100) / 100,
      todaySales: Math.round(todaySales * 100) / 100,
      monthlySales: Math.round(monthlySales * 100) / 100,
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalCustomers,
      totalProducts,
      lowStockProducts,
    };
  }

  /**
   * Retrieves sales charts over time, top selling products, and status distribution
   */
  static async getSalesAnalytics(days = 30) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    fromDate.setHours(0, 0, 0, 0);

    const [salesOverTime, orderStatusDistribution, topProducts, recentOrders] =
      await Promise.all([
        // Daily sales over time
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: fromDate },
              orderStatus: { $nin: ['cancelled', 'returned'] },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              sales: { $sum: '$total' },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          {
            $project: {
              _id: 0,
              date: '$_id',
              sales: { $round: ['$sales', 2] },
              orders: 1,
            },
          },
        ]),

        // Order status breakdown
        Order.aggregate([
          {
            $group: {
              _id: '$orderStatus',
              count: { $sum: 1 },
              totalAmount: { $sum: '$total' },
            },
          },
          {
            $project: {
              _id: 0,
              status: '$_id',
              count: 1,
              totalAmount: { $round: ['$totalAmount', 2] },
            },
          },
        ]),

        // Top selling products
        Product.find({ isActive: true })
          .sort({ salesCount: -1 })
          .limit(5)
          .select('title slug price discountPrice images stock salesCount rating'),

        // Recent 5 orders
        Order.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('orderNumber customer.name total paymentMethod paymentStatus orderStatus createdAt'),
      ]);

    return {
      salesOverTime,
      orderStatusDistribution,
      topProducts,
      recentOrders,
    };
  }
}
