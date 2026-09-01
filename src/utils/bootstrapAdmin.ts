import { User } from '../models/User.model.js';
import { Setting } from '../models/Setting.model.js';

/**
 * Ensures a mandatory Superadmin account and default store settings
 * always exist in MongoDB upon server startup, database connection, or clean resets,
 * without requiring any manual seed command.
 */
export const ensureDefaultAdmin = async (): Promise<void> => {
  try {
    const adminCount = await User.countDocuments({
      role: { $in: ['admin', 'superadmin'] },
    });

    if (adminCount === 0) {
      const admin = await User.create({
        name: 'NOVA Admin',
        email: 'admin@novafashion.com.bd',
        password: 'admin123',
        role: 'superadmin',
        phone: '+8801700000000',
        isActive: true,
      });
      console.log(`👤 [MANDATORY SEED] Default Superadmin auto-created: ${admin.email} (Password: admin123)`);
    }

    const setting = await Setting.findOne();
    if (!setting) {
      await Setting.create({
        storeName: 'NOVA Fashion',
        tagline: 'Elevate Your Everyday Style',
        logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&auto=format&fit=crop&q=80',
        email: 'support@novafashion.com',
        phone: '+880 1700 000000',
        address: 'House #42, Road #11, Block D, Banani, Dhaka-1213, Bangladesh',
        currency: 'BDT',
        currencySymbol: '৳',
        shipping: {
          insideDhaka: 60,
          outsideDhaka: 120,
          freeShippingThreshold: 2500,
          estimatedDeliveryInsideDhaka: '24-48 Hours',
          estimatedDeliveryOutsideDhaka: '2-4 Business Days',
        },
        paymentMethods: {
          cod: { enabled: true },
          bkash: { enabled: true, merchantNumber: '01700000000' },
          nagad: { enabled: true, merchantNumber: '01800000000' },
        },
        socialLinks: {
          facebook: 'https://facebook.com/novafashion',
          instagram: 'https://instagram.com/novafashion',
        },
        notice: '🎉 Free delivery across Bangladesh on all orders above ৳2,500!',
        banners: [],
      });
      console.log('⚙️  [MANDATORY SEED] Default store settings auto-created.');
    }
  } catch (error) {
    console.error('⚠️  Failed to ensure default admin account:', error);
  }
};
