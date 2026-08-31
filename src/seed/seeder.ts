import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import { User } from '../models/User.model.js';
import { Category } from '../models/Category.model.js';
import { Product } from '../models/Product.model.js';
import { Coupon } from '../models/Coupon.model.js';
import { Setting } from '../models/Setting.model.js';
import { Review } from '../models/Review.model.js';

const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🔄 Connecting to MongoDB for seeding...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log(' Connected to MongoDB.');

    // 1. Clear existing collections
    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Coupon.deleteMany({}),
      Setting.deleteMany({}),
      Review.deleteMany({}),
    ]);

    // 2. Seed Admin User
    console.log('👤 Seeding default admin user...');
    const adminUser = await User.create({
      name: 'NOVA Admin',
      email: 'admin@novafashion.com',
      password: 'admin123',
      role: 'superadmin',
      phone: '+8801700000000',
      isActive: true,
    });
    console.log(` Created Admin: ${adminUser.email} (Password: admin123)`);

    // 3. Seed Categories
    console.log('📂 Seeding categories...');
    const categoriesData = [
      {
        name: "Women's Collection",
        slug: 'women',
        description: 'Trendy dresses, tops, kurtis, and everyday essentials for women.',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80',
        order: 1,
      },
      {
        name: "Men's Collection",
        slug: 'men',
        description: 'Premium shirts, polos, panjabis, trousers, and streetwear for men.',
        image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=600&auto=format&fit=crop&q=80',
        order: 2,
      },
      {
        name: 'Kids & Teens',
        slug: 'kids',
        description: 'Vibrant, comfortable, and durable apparel for boys and girls.',
        image: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=600&auto=format&fit=crop&q=80',
        order: 3,
      },
      {
        name: 'Shoes & Footwear',
        slug: 'shoes',
        description: 'Leather boots, casual sneakers, loafers, and formal footwear.',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80',
        order: 4,
      },
      {
        name: 'Bags & Accessories',
        slug: 'accessories',
        description: 'Luxury watches, leather belts, sunglasses, and bags.',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        order: 5,
      },
    ];

    const seededCategories = await Category.insertMany(categoriesData);
    const catMap = new Map(seededCategories.map((c) => [c.slug, c._id]));

    // 4. Seed Products
    console.log('👗 Seeding products with variants...');
    const productsData = [
      {
        title: 'Classic Oxford Cotton Shirt',
        slug: 'classic-oxford-cotton-shirt',
        sku: 'NF-MEN-OXF-01',
        description: 'Crafted from 100% premium Egyptian cotton with a breathable weave, button-down collar, and regular fit.',
        shortDescription: '100% Breathable Cotton Oxford Shirt for Men',
        price: 1850,
        discountPrice: 1550,
        costPrice: 900,
        stock: 65,
        category: catMap.get('men'),
        images: [
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=700&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'M', color: 'Sky Blue', sku: 'NF-MEN-OXF-01-M-BLU', price: 1550, stock: 25 },
          { size: 'L', color: 'Sky Blue', sku: 'NF-MEN-OXF-01-L-BLU', price: 1550, stock: 20 },
          { size: 'XL', color: 'White', sku: 'NF-MEN-OXF-01-XL-WHT', price: 1550, stock: 20 },
        ],
        tags: ['shirt', 'formal', 'cotton', 'men'],
        isFeatured: true,
        isBestseller: true,
        salesCount: 42,
        rating: 4.8,
        reviewCount: 14,
      },
      {
        title: 'Floral Summer Maxi Dress',
        slug: 'floral-summer-maxi-dress',
        sku: 'NF-WMN-DRS-02',
        description: 'Flowing lightweight georgette fabric featuring a delicate floral print, tiered hemline, and adjustable waist tie.',
        shortDescription: 'Elegant floral print georgette maxi dress',
        price: 2650,
        discountPrice: 2290,
        costPrice: 1200,
        stock: 45,
        category: catMap.get('women'),
        images: [
          'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=700&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=700&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'S', color: 'Floral Pastel', sku: 'NF-WMN-DRS-02-S-PST', price: 2290, stock: 15 },
          { size: 'M', color: 'Floral Pastel', sku: 'NF-WMN-DRS-02-M-PST', price: 2290, stock: 20 },
          { size: 'L', color: 'Navy Floral', sku: 'NF-WMN-DRS-02-L-NVY', price: 2290, stock: 10 },
        ],
        tags: ['dress', 'summer', 'floral', 'women'],
        isFeatured: true,
        isBestseller: true,
        salesCount: 68,
        rating: 4.9,
        reviewCount: 22,
      },
      {
        title: 'Slim Fit Denim Jeans',
        slug: 'slim-fit-denim-jeans',
        sku: 'NF-MEN-DNM-03',
        description: 'Durable stretch denim offering exceptional flexibility and all-day comfort with a modern tapered finish.',
        shortDescription: 'Premium stretch denim with 5-pocket styling',
        price: 2450,
        discountPrice: 2150,
        costPrice: 1100,
        stock: 50,
        category: catMap.get('men'),
        images: [
          'https://images.unsplash.com/photo-1542272604-780c96856592?w=700&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '30', color: 'Dark Indigo', sku: 'NF-MEN-DNM-03-30-IND', price: 2150, stock: 15 },
          { size: '32', color: 'Dark Indigo', sku: 'NF-MEN-DNM-03-32-IND', price: 2150, stock: 20 },
          { size: '34', color: 'Faded Black', sku: 'NF-MEN-DNM-03-34-BLK', price: 2150, stock: 15 },
        ],
        tags: ['jeans', 'denim', 'casual', 'men'],
        isFeatured: false,
        isBestseller: true,
        salesCount: 35,
        rating: 4.7,
        reviewCount: 9,
      },
      {
        title: 'Minimalist Leather Crossbody Bag',
        slug: 'minimalist-leather-crossbody-bag',
        sku: 'NF-ACC-BAG-04',
        description: 'Genuine top-grain leather with gold-tone hardware, magnetic clasp, and interior zip compartments.',
        shortDescription: 'Genuine top-grain leather crossbody bag',
        price: 3200,
        discountPrice: 2850,
        costPrice: 1500,
        stock: 25,
        category: catMap.get('accessories'),
        images: [
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&auto=format&fit=crop&q=80',
        ],
        variants: [
          { color: 'Tan Brown', sku: 'NF-ACC-BAG-04-TAN', price: 2850, stock: 15 },
          { color: 'Midnight Black', sku: 'NF-ACC-BAG-04-BLK', price: 2850, stock: 10 },
        ],
        tags: ['leather', 'bag', 'accessories'],
        isFeatured: true,
        isBestseller: false,
        salesCount: 19,
        rating: 4.9,
        reviewCount: 8,
      },
      {
        title: 'Urban Retro Low-Top Sneakers',
        slug: 'urban-retro-low-top-sneakers',
        sku: 'NF-SHS-SNK-05',
        description: 'Cushioned EVA midsole with breathable canvas upper and vulcanized non-slip rubber outsole.',
        shortDescription: 'Lightweight urban street sneakers',
        price: 3500,
        discountPrice: 2990,
        costPrice: 1600,
        stock: 30,
        category: catMap.get('shoes'),
        images: [
          'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=700&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '40', color: 'White/Navy', sku: 'NF-SHS-SNK-05-40-WNV', price: 2990, stock: 10 },
          { size: '41', color: 'White/Navy', sku: 'NF-SHS-SNK-05-41-WNV', price: 2990, stock: 10 },
          { size: '42', color: 'Triple White', sku: 'NF-SHS-SNK-05-42-WHT', price: 2990, stock: 10 },
        ],
        tags: ['shoes', 'sneakers', 'footwear', 'unisex'],
        isFeatured: true,
        isBestseller: true,
        salesCount: 54,
        rating: 4.8,
        reviewCount: 16,
      },
    ];

    const seededProducts = await Product.insertMany(productsData);

    // 5. Seed Coupons
    console.log('🏷️ Seeding discount coupons...');
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 6);

    await Coupon.insertMany([
      {
        code: 'NOVA10',
        description: '10% discount on orders over ৳1,000',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 1000,
        maxDiscountAmount: 500,
        expiryDate: nextMonth,
        isActive: true,
      },
      {
        code: 'WELCOME20',
        description: '20% off for first-time shoppers (max ৳600)',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 1500,
        maxDiscountAmount: 600,
        expiryDate: nextMonth,
        isActive: true,
      },
      {
        code: 'FLAT150',
        description: 'Flat ৳150 off on orders over ৳2,000',
        discountType: 'fixed',
        discountValue: 150,
        minOrderAmount: 2000,
        expiryDate: nextMonth,
        isActive: true,
      },
    ]);

    // 6. Seed Store Settings
    console.log('⚙️ Seeding store settings...');
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
      banners: [
        {
          title: 'Spring / Summer 2026 Collection',
          subtitle: 'Up to 30% off on all premium essentials',
          image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
          link: '/category/women',
          order: 1,
        },
      ],
    });

    // 7. Seed Reviews
    console.log('💬 Seeding sample customer reviews...');
    if (seededProducts.length > 0) {
      await Review.create({
        product: seededProducts[0]._id,
        customerName: 'Tanvir Ahmed',
        customerEmail: 'tanvir@example.com',
        rating: 5,
        title: 'Outstanding fabric quality!',
        comment: 'The Oxford shirt fit perfectly and the cotton fabric feels ultra premium. Highly recommended!',
        isApproved: true,
        verifiedPurchase: true,
      });

      await Review.create({
        product: seededProducts[1]._id,
        customerName: 'Samira Khan',
        customerEmail: 'samira@example.com',
        rating: 5,
        title: 'Love the floral print!',
        comment: 'Beautiful dress, breathable georgette material. Delivered to Uttara within 24 hours!',
        isApproved: true,
        verifiedPurchase: true,
      });
    }

    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
