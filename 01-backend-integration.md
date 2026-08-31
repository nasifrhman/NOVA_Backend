# NOVA FASHION --- Backend Integration Guide

## Goal

Integrate this Express.js + MongoDB backend with:

-   NOVA Fashion Storefront: `http://localhost:3000`
-   NOVA Fashion Dashboard: `http://localhost:5173`
-   Backend API: `http://localhost:5000`

The backend must become the single source of truth for products,
categories, customers, orders, payments, coupons, reviews, store
settings, dashboard analytics, and admin operations.

## Existing Backend

-   Express.js
-   MongoDB + Mongoose
-   API prefix: `/api/v1`
-   Port: `5000`
-   Healthcheck: `GET /api/v1/health`

## Integration Rules

1.  Do not break existing backend architecture.
2.  Inspect the existing codebase before making changes.
3.  Reuse existing models, controllers, services, middleware, and
    utilities where possible.
4.  Do not duplicate business logic.
5.  Keep storefront and dashboard API contracts clearly separated where
    appropriate.
6.  Use environment variables for URLs, secrets, MongoDB credentials,
    payment configuration, and JWT settings.
7.  Never expose secrets, payment credentials, JWT secrets, or private
    admin data to the storefront.
8.  Enable CORS for the dashboard and storefront development origins.
9.  Use consistent API responses and centralized error handling.
10. Validate all request bodies, query parameters, route parameters, and
    admin inputs.
11. Add authentication and authorization for dashboard/admin APIs.
12. Keep customer-facing APIs safe from unauthorized mutation.
13. Maintain backward compatibility with working endpoints unless a
    migration is required.

## Target CORS Origins

Development:

-   `http://localhost:3000`
-   `http://localhost:5173`

Use environment variables rather than hard-coding these in production.

Example:

``` env
FRONTEND_URL=http://localhost:3000
DASHBOARD_URL=http://localhost:5173
```

## Data Ownership

The backend owns:

-   Products
-   Categories
-   Product variants
-   Inventory/stock
-   Customers
-   Addresses
-   Orders
-   Order items
-   Coupons
-   Reviews
-   Store settings
-   Shipping settings
-   Payment configuration
-   Admin users
-   Dashboard analytics

The storefront must stop treating `src/data/products.js`, categories,
coupons, reviews, and store configuration as authoritative once
integration is complete.

## Required API Areas

Create or verify APIs for:

### Storefront

-   `GET /api/v1/products`
-   `GET /api/v1/products/:slug`
-   `GET /api/v1/categories`
-   `GET /api/v1/categories/:slug`
-   `GET /api/v1/products/featured`
-   `GET /api/v1/products/bestsellers`
-   `GET /api/v1/products/search`
-   `GET /api/v1/reviews`
-   `POST /api/v1/reviews`
-   `POST /api/v1/coupons/validate`
-   `GET /api/v1/store-config`
-   `POST /api/v1/orders`
-   `GET /api/v1/orders/:orderId`

Add customer authentication only if the existing product requires it.
Guest checkout should remain possible if supported by the storefront.

### Dashboard

Protect dashboard APIs with admin authentication.

Typical routes:

-   `POST /api/v1/admin/auth/login`
-   `GET /api/v1/admin/auth/me`
-   `POST /api/v1/admin/auth/logout`
-   `GET /api/v1/admin/dashboard/stats`
-   `GET /api/v1/admin/dashboard/sales`
-   `GET /api/v1/admin/orders`
-   `GET /api/v1/admin/orders/:id`
-   `PATCH /api/v1/admin/orders/:id/status`
-   `GET /api/v1/admin/products`
-   `POST /api/v1/admin/products`
-   `GET /api/v1/admin/products/:id`
-   `PATCH /api/v1/admin/products/:id`
-   `DELETE /api/v1/admin/products/:id`
-   `GET /api/v1/admin/categories`
-   `POST /api/v1/admin/categories`
-   `PATCH /api/v1/admin/categories/:id`
-   `DELETE /api/v1/admin/categories/:id`
-   `GET /api/v1/admin/customers`
-   `GET /api/v1/admin/customers/:id`
-   `GET /api/v1/admin/coupons`
-   `POST /api/v1/admin/coupons`
-   `PATCH /api/v1/admin/coupons/:id`
-   `DELETE /api/v1/admin/coupons/:id`
-   `GET /api/v1/admin/reviews`
-   `PATCH /api/v1/admin/reviews/:id`
-   `DELETE /api/v1/admin/reviews/:id`
-   `GET /api/v1/admin/settings`
-   `PATCH /api/v1/admin/settings`

Use the existing project's naming conventions if they differ.

## Orders

The order system must support:

-   Customer information
-   Phone number
-   Delivery address
-   District/area
-   Delivery zone
-   Shipping fee
-   Products and selected variants
-   Quantity
-   Subtotal
-   Discount
-   Total
-   Payment method
-   Payment status
-   Order status
-   Order number
-   Customer notes
-   Created/updated timestamps

Suggested order statuses:

`pending`, `confirmed`, `processing`, `shipped`, `delivered`,
`cancelled`, `returned`

Suggested payment statuses:

`pending`, `paid`, `failed`, `refunded`, `cod_pending`

Do not trust prices, discounts, stock counts, or totals sent by the
client. Recalculate them on the server using database data.

## bKash and Nagad

Support the storefront's bKash and Nagad payment flow.

Keep payment credentials and merchant configuration server-side.

The backend should have a payment abstraction so the project can
support:

-   COD
-   bKash
-   Nagad

Do not mark an online payment as successful merely because the frontend
says it succeeded. Verify the payment through the appropriate provider
flow before changing payment status to `paid`.

## Inventory

Prevent overselling.

When an order is successfully created:

1.  Validate product/variant availability.
2.  Calculate the final price on the server.
3.  Reserve or decrement stock safely.
4.  Prevent race conditions where possible.
5.  Restore stock when an order is cancelled according to the business
    rules.

## Dashboard Analytics

Provide backend calculations for:

-   Total sales
-   Today's sales
-   Monthly sales
-   Total orders
-   Pending orders
-   Delivered orders
-   Cancelled orders
-   Total customers
-   Total products
-   Low-stock products
-   Recent orders
-   Top-selling products
-   Sales over time
-   Order status distribution

The dashboard should consume these values from the API rather than
calculating business totals from a partial client-side dataset.

## API Response Standard

Use one consistent response structure.

Example:

``` json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Errors should be consistent as well.

## Security

Implement:

-   Password hashing
-   JWT or the project's existing auth mechanism
-   Admin role authorization
-   Request validation
-   Rate limiting where appropriate
-   Helmet/security headers
-   CORS
-   Centralized error handling
-   Safe MongoDB queries
-   Input sanitization where appropriate
-   No sensitive data in API responses
-   No secrets committed to Git

## Integration Workflow

Before coding:

1.  Inspect the complete backend structure.
2.  Identify existing models and routes.
3.  Identify existing authentication.
4.  Identify existing order/payment logic.
5.  Identify missing APIs required by storefront and dashboard.
6.  Create a clear API contract.
7.  Implement missing endpoints.
8.  Update CORS.
9.  Add seed/sample data only if necessary.
10. Test every endpoint.
11. Run the backend.
12. Confirm:

`GET http://localhost:5000/api/v1/health`

## Final Requirement

After implementation, the backend must work as the central API for both
applications without requiring mock product/order/category data in the
frontend or dashboard.

Do not modify the frontend or dashboard repositories from this task.
This document is specifically for the backend project.
