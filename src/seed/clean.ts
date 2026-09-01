import dns from 'node:dns';
import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import { User } from '../models/User.model.js';
import { Category } from '../models/Category.model.js';
import { Product } from '../models/Product.model.js';
import { Coupon } from '../models/Coupon.model.js';
import { Setting } from '../models/Setting.model.js';
import { Review } from '../models/Review.model.js';
import { Order } from '../models/Order.model.js';

// Resolve DNS issues in Node.js on Windows / local ISP DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore in restricted environments
}

const cleanDatabase = async (): Promise<void> => {
  try {
    console.log('=============================================');
    console.log('🧹 NOVA Fashion Database Cleaner');
    console.log('=============================================');
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log(' Connected to MongoDB.');

    console.log('🗑️  Wiping collections...');
    const [orders, reviews, coupons, products, categories, settings, users] = await Promise.all([
      Order.deleteMany({}),
      Review.deleteMany({}),
      Coupon.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Setting.deleteMany({}),
      User.deleteMany({}),
    ]);

    console.log(`   • Orders deleted:     ${orders.deletedCount}`);
    console.log(`   • Reviews deleted:    ${reviews.deletedCount}`);
    console.log(`   • Coupons deleted:    ${coupons.deletedCount}`);
    console.log(`   • Products deleted:   ${products.deletedCount}`);
    console.log(`   • Categories deleted: ${categories.deletedCount}`);
    console.log(`   • Settings deleted:   ${settings.deletedCount}`);
    console.log(`   • Users deleted:      ${users.deletedCount}`);

    // Re-create default Superadmin user & default Setting so dashboard & storefront can operate immediately
    console.log('👤 Provisioning default admin account...');
    const adminUser = await User.create({
      name: 'NOVA Admin',
      email: 'admin@novafashion.com.bd',
      password: 'admin123',
      role: 'superadmin',
      phone: '+8801700000000',
      isActive: true,
    });
    console.log(`    Superadmin created: ${adminUser.email} (Password: admin123)`);

    console.log('⚙️  Provisioning default store settings...');
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
    console.log('    Default store settings initialized.');

    console.log('=============================================');
    console.log('✨ Database successfully cleaned and ready!');
    console.log('💡 Tip: Run `npm run db:seed` whenever you want to load demo products & sample orders.');
    console.log('=============================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Clean database failed:', error);
    process.exit(1);
  }
};

cleanDatabase();
