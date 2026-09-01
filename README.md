# NOVA FASHION — Backend Server

A production-ready, single-source-of-truth REST API backend built with Express.js, MongoDB (Mongoose), and TypeScript for NOVA Fashion Storefront and Admin Dashboard.

---

## 🏗️ Architecture & Features

- **TypeScript & ESM**: Strict type checking with clean modular structure.
- **MongoDB & Mongoose**: Schemas for Products (with variants), Categories, Orders, Customers, Coupons, Reviews, Settings, and Users.
- **Storefront & Admin Isolation**: Dedicated public storefront endpoints and protected `/api/v1/admin/*` routes.
- **Role-Based Auth & JWT**: Secure authentication with bcrypt password hashing and token-based admin authorization.
- **Safe Inventory & Order Management**: Server-side price recalculation, atomic stock deduction, and automatic stock restoration upon order cancellation.
- **Payment Abstraction**: Support for Cash on Delivery (COD), bKash, and Nagad verification.
- **Analytics Aggregations**: Real-time sales calculations, daily/monthly revenue trends, status distribution, and low-stock alerts.
- **Security**: Configured with Helmet, CORS for `http://localhost:3000` & `http://localhost:5173`, rate limiting, and centralized error handling.

---

## 📁 Directory Layout

```
ecommerce-server/
├── src/
│   ├── config/
│   │   ├── db.ts                 # MongoDB connection & reconnect logic
│   │   └── env.ts                # Validated environment configurations
│   ├── models/
│   │   ├── User.model.ts         # Admin & Customer accounts
│   │   ├── Category.model.ts     # Category management
│   │   ├── Product.model.ts      # Products with multi-attribute variants
│   │   ├── Order.model.ts        # Comprehensive order lifecycle
│   │   ├── Coupon.model.ts       # Percentage & fixed discount coupons
│   │   ├── Review.model.ts       # Customer reviews & average rating updater
│   │   └── Setting.model.ts      # Store info, shipping zones & fees
│   ├── middlewares/
│   │   ├── auth.middleware.ts    # JWT verification & admin guard
│   │   ├── error.middleware.ts   # Centralized error handler
│   │   ├── notFound.middleware.ts# 404 handler
│   │   └── validate.middleware.ts# Zod request validator
│   ├── controllers/
│   │   ├── storefront/           # Public customer controllers
│   │   └── admin/                # Protected admin controllers
│   ├── routes/
│   │   ├── api.router.ts         # Main API router (/api/v1)
│   │   ├── health.router.ts      # /api/v1/health
│   │   ├── storefront/           # Storefront sub-routers
│   │   └── admin/                # Admin sub-routers
│   ├── services/
│   │   ├── order.service.ts      # Order calculations & stock management
│   │   ├── payment.service.ts    # COD, bKash & Nagad payments
│   │   └── analytics.service.ts  # Sales & inventory aggregations
│   ├── utils/
│   │   ├── apiResponse.ts        # Standardized API response format
│   │   ├── errors.ts             # Operational error classes
│   │   └── generateOrderNumber.ts# Unique readable order number generator
│   ├── seed/
│   │   └── seeder.ts             # Database population script
│   ├── app.ts                    # Express application stack
│   └── server.ts                 # Server bootstrap & graceful shutdown
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure your MongoDB instance is running, or set `MONGODB_URI` to your MongoDB Atlas connection string.

### 3. Database Management Commands

- **Clean Database** (Wipes all orders, reviews, coupons, products, categories and keeps fresh default admin & settings):
  ```bash
  npm run db:clean
  # or
  npm run clean
  ```

- **Seed Demo Data** (Populates categories, 12+ products with variants & images, active coupons, store settings, customer reviews, sample orders):
  ```bash
  npm run db:seed
  # or
  npm run seed
  ```

- **Reset Database** (Cleans everything and re-seeds in one step):
  ```bash
  npm run db:reset
  ```

> **Default Seeded Credentials**:
> - **Superadmin**: `admin@novafashion.com.bd` / `admin123`
> - **Customer**: `tanvir@novafashion.com.bd` / `customer123`

### 4. Run in Development Mode
```bash
npm run dev
```

### 5. Build and Start Production Server
```bash
npm run build
npm start
```

---

## 📡 API Contract Overview

### 🛍️ Storefront APIs (`/api/v1`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server & database health check |
| `GET` | `/products` | List active products (supports `category`, `search`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`) |
| `GET` | `/products/:slug` | Get single product details by slug or ID |
| `GET` | `/products/featured` | Get featured products |
| `GET` | `/products/bestsellers`| Get best-selling products |
| `GET` | `/products/search?q=` | Search products by keyword |
| `GET` | `/categories` | List active categories with product counts |
| `GET` | `/categories/:slug` | Get category details |
| `POST` | `/coupons/validate` | Validate coupon code & calculate discount |
| `GET` | `/store-config` | Public store settings & shipping rates |
| `POST` | `/orders` | Place new order (calculates prices & decrements stock) |
| `GET` | `/orders/:orderId` | Track order by orderId or orderNumber |
| `GET` | `/reviews` | Get approved product reviews |
| `POST` | `/reviews` | Submit a customer product review |
| `POST` | `/payments/verify` | Verify bKash / Nagad transaction |

---

### 📊 Dashboard (Admin) APIs (`/api/v1/admin`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Admin login & JWT retrieval | Public |
| `GET` | `/auth/me` | Current authenticated admin profile | Protected |
| `POST` | `/auth/logout` | Admin logout | Public |
| `GET` | `/dashboard/stats` | High-level sales, orders & stock metrics | Admin |
| `GET` | `/dashboard/sales` | Sales time series, top products, status charts | Admin |
| `GET` | `/orders` | List all orders with filters & pagination | Admin |
| `GET` | `/orders/:id` | Get order details | Admin |
| `PATCH` | `/orders/:id/status` | Update order/payment status (restocks if cancelled) | Admin |
| `GET` | `/products` | Admin product listing | Admin |
| `POST` | `/products` | Create new product with variants | Admin |
| `GET` | `/products/:id` | Get product by ID | Admin |
| `PATCH` | `/products/:id` | Update product details | Admin |
| `DELETE`| `/products/:id` | Delete product | Admin |
| `GET` | `/categories` | List all categories | Admin |
| `POST` | `/categories` | Create category | Admin |
| `PATCH` | `/categories/:id` | Update category | Admin |
| `DELETE`| `/categories/:id` | Delete category | Admin |
| `GET` | `/customers` | Aggregated customer accounts & order metrics | Admin |
| `GET` | `/customers/:id` | Customer profile & full order history | Admin |
| `GET` | `/coupons` | List all discount coupons | Admin |
| `POST` | `/coupons` | Create new coupon | Admin |
| `PATCH` | `/coupons/:id` | Update coupon | Admin |
| `DELETE`| `/coupons/:id` | Delete coupon | Admin |
| `GET` | `/reviews` | List all reviews | Admin |
| `PATCH` | `/reviews/:id` | Approve or hide review | Admin |
| `DELETE`| `/reviews/:id` | Delete review | Admin |
| `GET` | `/settings` | Get full store settings | Admin |
| `PATCH` | `/settings` | Update store settings | Admin |
