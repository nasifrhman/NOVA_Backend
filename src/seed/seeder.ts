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
import { generateOrderNumber } from '../utils/generateOrderNumber.js';

// Resolve SRV DNS issues in Node.js on Windows / local ISP DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

const seedDatabase = async (): Promise<void> => {
  try {
    console.log('=============================================');
    console.log('🌱 NOVA Fashion Database Seeder');
    console.log('=============================================');
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
      Order.deleteMany({}),
    ]);
    console.log(' Cleared all existing data.');

    // 2. Seed Admin User & Test Customer
    console.log('👤 Seeding users...');
    const adminUser = await User.create({
      name: 'NOVA Admin',
      email: 'admin@novafashion.com.bd',
      password: 'admin123',
      role: 'superadmin',
      phone: '+8801700000000',
      isActive: true,
    });
    console.log(` Created Admin: ${adminUser.email} (Password: admin123)`);

    const customerUser = await User.create({
      name: 'Tanvir Ahmed',
      email: 'tanvir@novafashion.com.bd',
      password: 'customer123',
      role: 'customer',
      phone: '+8801711223344',
      isActive: true,
    });
    console.log(` Created Customer: ${customerUser.email} (Password: customer123)`);

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
      {
        title: 'Embroidered Semi-Formal Kurti',
        slug: 'embroidered-semi-formal-kurti',
        sku: 'NF-WMN-KRT-06',
        description: 'Handcrafted zari embroidery on fine viscose silk, mandarin collar with subtle side slits.',
        shortDescription: 'Handcrafted embroidered viscose silk kurti',
        price: 2150,
        discountPrice: 1850,
        costPrice: 950,
        stock: 40,
        category: catMap.get('women'),
        images: [
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=700&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'M', color: 'Emerald Green', sku: 'NF-WMN-KRT-06-M-GRN', price: 1850, stock: 20 },
          { size: 'L', color: 'Ruby Red', sku: 'NF-WMN-KRT-06-L-RED', price: 1850, stock: 20 },
        ],
        tags: ['kurti', 'traditional', 'women'],
        isFeatured: true,
        isBestseller: false,
        salesCount: 28,
        rating: 4.6,
        reviewCount: 7,
      },
      {
        title: 'Kids Dinosaur Graphic Tee',
        slug: 'kids-dinosaur-graphic-tee',
        sku: 'NF-KID-TEE-07',
        description: '100% combed cotton jersey with eco-friendly non-toxic print, tagless comfort neck.',
        shortDescription: 'Soft 100% cotton crewneck graphic tee for kids',
        price: 750,
        discountPrice: 650,
        costPrice: 300,
        stock: 60,
        category: catMap.get('kids'),
        images: [
          'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=700&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '4-5Y', color: 'Mustard Yellow', sku: 'NF-KID-TEE-07-4Y-YEL', price: 650, stock: 30 },
          { size: '6-7Y', color: 'Olive Green', sku: 'NF-KID-TEE-07-6Y-GRN', price: 650, stock: 30 },
        ],
        tags: ['kids', 't-shirt', 'boys', 'casual'],
        isFeatured: true,
        isBestseller: true,
        salesCount: 39,
        rating: 4.9,
        reviewCount: 11,
      },
      {
        title: 'Handmade Leather Formal Loafers',
        slug: 'handmade-leather-formal-loafers',
        sku: 'NF-SHS-LFR-08',
        description: 'Full-grain calfskin leather, leather lining and memory foam footbed for maximum formal comfort.',
        shortDescription: 'Full-grain calfskin leather loafers',
        price: 4200,
        discountPrice: 3800,
        costPrice: 2100,
        stock: 20,
        category: catMap.get('shoes'),
        images: [
          'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=700&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '41', color: 'Burnished Tan', sku: 'NF-SHS-LFR-08-41-TAN', price: 3800, stock: 10 },
          { size: '42', color: 'Burnished Tan', sku: 'NF-SHS-LFR-08-42-TAN', price: 3800, stock: 10 },
        ],
        tags: ['shoes', 'formal', 'leather', 'men'],
        isFeatured: true,
        isBestseller: false,
        salesCount: 14,
        rating: 5.0,
        reviewCount: 6,
      },
      {
        title: 'Premium Linen Panjabi',
        slug: 'premium-linen-panjabi',
        sku: 'NF-MEN-PNJ-09',
        description: 'Crafted from pure European linen with intricate neckline threadwork and engraved metal buttons.',
        shortDescription: 'Pure European linen festive panjabi for men',
        price: 3450,
        discountPrice: 2990,
        costPrice: 1600,
        stock: 35,
        category: catMap.get('men'),
        images: [
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=700&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '40', color: 'Ivory Cream', sku: 'NF-MEN-PNJ-09-40-CRM', price: 2990, stock: 15 },
          { size: '42', color: 'Navy Blue', sku: 'NF-MEN-PNJ-09-42-NVY', price: 2990, stock: 20 },
        ],
        tags: ['panjabi', 'festive', 'traditional', 'men'],
        isFeatured: true,
        isBestseller: true,
        salesCount: 47,
        rating: 4.8,
        reviewCount: 15,
      },
      {
        title: 'Polarized Aviator Sunglasses',
        slug: 'polarized-aviator-sunglasses',
        sku: 'NF-ACC-SNG-10',
        description: 'UV400 protection with lightweight metal frame, spring hinges, and anti-glare polarized lenses.',
        shortDescription: 'UV400 polarized aviator sunglasses',
        price: 1650,
        discountPrice: 1390,
        costPrice: 600,
        stock: 50,
        category: catMap.get('accessories'),
        images: [
          'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=700&auto=format&fit=crop&q=80',
        ],
        variants: [
          { color: 'Gold / Green Lens', sku: 'NF-ACC-SNG-10-GLD', price: 1390, stock: 25 },
          { color: 'Matte Black', sku: 'NF-ACC-SNG-10-BLK', price: 1390, stock: 25 },
        ],
        tags: ['sunglasses', 'accessories', 'unisex'],
        isFeatured: false,
        isBestseller: true,
        salesCount: 62,
        rating: 4.7,
        reviewCount: 19,
      },
      {
        title: 'NOVA Signature Hoodie',
        slug: 'prod-11',
        sku: 'PROD-11',
        description: 'Heavyweight 380 GSM fleece hoodie with ribbed cuffs, kangaroo pocket, and double-lined hood.',
        shortDescription: 'Heavyweight 380 GSM cotton fleece hoodie',
        price: 2200,
        discountPrice: 1850,
        costPrice: 900,
        stock: 80,
        category: catMap.get('men'),
        images: [
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=700&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'M', color: 'Charcoal Grey', sku: 'PROD-11-M-GRY', price: 1850, stock: 40 },
          { size: 'L', color: 'Charcoal Grey', sku: 'PROD-11-L-GRY', price: 1850, stock: 40 },
        ],
        tags: ['hoodie', 'winter', 'streetwear', 'unisex'],
        isFeatured: true,
        isBestseller: true,
        salesCount: 88,
        rating: 4.9,
        reviewCount: 31,
      },
      {
        title: 'Chiffon Layered Party Kurti',
        slug: 'prod-12',
        sku: 'PROD-12',
        description: 'Double-layered chiffon festive kurti with sequin detailing and gold piping.',
        shortDescription: 'Double-layered chiffon party kurti',
        price: 2800,
        discountPrice: 2450,
        costPrice: 1300,
        stock: 40,
        category: catMap.get('women'),
        images: [
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=700&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'M', color: 'Blush Pink', sku: 'PROD-12-M-PNK', price: 2450, stock: 20 },
          { size: 'L', color: 'Blush Pink', sku: 'PROD-12-L-PNK', price: 2450, stock: 20 },
        ],
        tags: ['kurti', 'party', 'women'],
        isFeatured: true,
        isBestseller: false,
        salesCount: 21,
        rating: 4.8,
        reviewCount: 9,
      },
    ];

    const seededProducts = await Product.insertMany(productsData);
    console.log(` Seeded ${seededProducts.length} products.`);

    // 5. Seed Coupons
    console.log('🏷️ Seeding discount coupons...');
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    await Coupon.insertMany([
      {
        code: 'NOVA10',
        description: '10% discount on orders over ৳1,000',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 1000,
        maxDiscountAmount: 500,
        expiryDate: nextYear,
        isActive: true,
      },
      {
        code: 'WELCOME20',
        description: '20% off for first-time shoppers (max ৳600)',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 1500,
        maxDiscountAmount: 600,
        expiryDate: nextYear,
        isActive: true,
      },
      {
        code: 'FLAT150',
        description: 'Flat ৳150 off on orders over ৳2,000',
        discountType: 'fixed',
        discountValue: 150,
        minOrderAmount: 2000,
        expiryDate: nextYear,
        isActive: true,
      },
      {
        code: 'EID30',
        description: 'Special 30% discount on festive collections',
        discountType: 'percentage',
        discountValue: 30,
        minOrderAmount: 3000,
        maxDiscountAmount: 1200,
        expiryDate: nextYear,
        isActive: true,
      },
    ]);
    console.log(' Seeded 4 coupons.');

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
          subtitle: 'Up to 30% off on all women\'s premium essentials',
          image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
          link: '/category/women',
          order: 1,
        },
        {
          title: 'Men\'s Urban Streetwear & Formals',
          subtitle: 'Elevate your wardrobe with Egyptian cotton shirts & denim',
          image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1600&auto=format&fit=crop&q=80',
          link: '/category/men',
          order: 2,
        },
        {
          title: 'Exclusive Footwear & Leather Goods',
          subtitle: 'Crafted with premium materials for unmatched durability',
          image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1600&auto=format&fit=crop&q=80',
          link: '/category/shoes',
          order: 3,
        },
      ],
    });
    console.log(' Seeded store settings.');

    // 7. Seed Reviews
    console.log('💬 Seeding customer reviews...');
    if (seededProducts.length >= 2) {
      await Review.create([
        {
          product: seededProducts[0]._id,
          customerName: 'Tanvir Ahmed',
          customerEmail: 'tanvir@example.com',
          rating: 5,
          title: 'Outstanding fabric quality!',
          comment: 'The Oxford shirt fit perfectly and the cotton fabric feels ultra premium. Highly recommended!',
          isApproved: true,
          verifiedPurchase: true,
        },
        {
          product: seededProducts[1]._id,
          customerName: 'Samira Khan',
          customerEmail: 'samira@example.com',
          rating: 5,
          title: 'Love the floral print!',
          comment: 'Beautiful dress, breathable georgette material. Delivered to Uttara within 24 hours!',
          isApproved: true,
          verifiedPurchase: true,
        },
        {
          product: seededProducts[2]._id,
          customerName: 'Mahmudul Hasan',
          customerEmail: 'mahmud@example.com',
          rating: 5,
          title: 'Super comfortable stretch jeans',
          comment: 'Great fitting and true to size. Will buy again!',
          isApproved: true,
          verifiedPurchase: true,
        },
      ]);
    }
    console.log(' Seeded reviews.');

    // 8. Seed Sample Orders for Analytics & Dashboard
    console.log('📦 Seeding sample orders for Dashboard & Analytics...');
    const p0 = seededProducts[0] as any;
    const p1 = seededProducts[1] as any;
    const p3 = seededProducts[3] as any;
    const p4 = seededProducts[4] as any;

    const sampleOrders = [
      {
        orderNumber: generateOrderNumber(),
        customer: {
          name: 'Nasif Rahman',
          phone: '01798552909',
          email: 'mdnasifurahman@gmail.com',
          address: 'Basundhara R/A, G Block, House #14',
          district: 'Dhaka',
          city: 'Dhaka',
        },
        items: [
          {
            product: p0._id,
            variantId: p0.variants?.[0]?._id,
            title: p0.title,
            sku: p0.variants?.[0]?.sku || p0.sku,
            size: p0.variants?.[0]?.size,
            color: p0.variants?.[0]?.color,
            price: 1550,
            quantity: 2,
            subtotal: 3100,
            image: p0.images[0],
          },
          {
            product: p3._id,
            variantId: p3.variants?.[0]?._id,
            title: p3.title,
            sku: p3.variants?.[0]?.sku || p3.sku,
            price: 2850,
            quantity: 1,
            subtotal: 2850,
            image: p3.images[0],
          },
        ],
        subtotal: 5950,
        shippingFee: 0,
        discount: 500,
        couponCode: 'NOVA10',
        total: 5450,
        paymentMethod: 'bkash',
        paymentStatus: 'paid',
        orderStatus: 'delivered',
        paymentDetails: {
          transactionId: 'BKASH9A82B71X',
          senderNumber: '01798552909',
          provider: 'bkash',
          paymentDate: new Date(),
        },
        statusHistory: [
          { status: 'pending', changedAt: new Date(Date.now() - 86400000 * 3), note: 'Order placed' },
          { status: 'confirmed', changedAt: new Date(Date.now() - 86400000 * 2), note: 'Payment verified' },
          { status: 'shipped', changedAt: new Date(Date.now() - 86400000), note: 'Handed to courier' },
          { status: 'delivered', changedAt: new Date(), note: 'Delivered to customer' },
        ],
      },
      {
        orderNumber: generateOrderNumber(),
        customer: {
          name: 'Nusrat Jahan',
          phone: '01819876543',
          email: 'nusrat@gmail.com',
          address: 'Road 7, Sector 4, Uttara',
          district: 'Dhaka',
          city: 'Dhaka',
        },
        items: [
          {
            product: p1._id,
            variantId: p1.variants?.[0]?._id,
            title: p1.title,
            sku: p1.variants?.[0]?.sku || p1.sku,
            size: p1.variants?.[0]?.size,
            color: p1.variants?.[0]?.color,
            price: 2290,
            quantity: 1,
            subtotal: 2290,
            image: p1.images[0],
          },
        ],
        subtotal: 2290,
        shippingFee: 60,
        discount: 0,
        total: 2350,
        paymentMethod: 'cod',
        paymentStatus: 'cod_pending',
        orderStatus: 'processing',
        statusHistory: [
          { status: 'pending', changedAt: new Date(Date.now() - 3600000 * 5), note: 'Order placed' },
          { status: 'processing', changedAt: new Date(), note: 'Packaging in progress' },
        ],
      },
      {
        orderNumber: generateOrderNumber(),
        customer: {
          name: 'Arif Chowdhury',
          phone: '01712349988',
          email: 'arif.chowdhury@yahoo.com',
          address: 'GEC Circle, Nasirabad',
          district: 'Chittagong',
          city: 'Chittagong',
        },
        items: [
          {
            product: p4._id,
            variantId: p4.variants?.[0]?._id,
            title: p4.title,
            sku: p4.variants?.[0]?.sku || p4.sku,
            size: '41',
            color: 'White/Navy',
            price: 2990,
            quantity: 1,
            subtotal: 2990,
            image: p4.images[0],
          },
        ],
        subtotal: 2990,
        shippingFee: 0,
        discount: 0,
        total: 2990,
        paymentMethod: 'nagad',
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        paymentDetails: {
          transactionId: 'NGD882319A',
          senderNumber: '01712349988',
          provider: 'nagad',
          paymentDate: new Date(),
        },
        statusHistory: [
          { status: 'pending', changedAt: new Date(), note: 'Order placed' },
          { status: 'confirmed', changedAt: new Date(), note: 'Payment verified via Nagad' },
        ],
      },
    ];

    await Order.insertMany(sampleOrders);
    console.log(` Seeded ${sampleOrders.length} sample orders.`);

    console.log('=============================================');
    console.log(' Database seeding completed successfully!');
    console.log(' Credentials:');
    console.log('   👤 Admin:    admin@novafashion.com.bd / admin123');
    console.log('   🛒 Customer: tanvir@novafashion.com.bd / customer123');
    console.log('=============================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
