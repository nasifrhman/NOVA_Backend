import { Schema, model, Document, Model, Types } from 'mongoose';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'cod_pending';

export type PaymentMethod = 'cod' | 'bkash' | 'nagad';

export interface IOrderItem {
  product: Types.ObjectId;
  variantId?: Types.ObjectId;
  title: string;
  sku?: string;
  size?: string;
  color?: string;
  price: number;
  quantity: number;
  subtotal: number;
  image?: string;
}

export interface ICustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address: string;
  district?: string;
  zone?: string;
  city?: string;
  postalCode?: string;
}

export interface IPaymentDetails {
  transactionId?: string;
  paymentId?: string;
  senderNumber?: string;
  paymentDate?: Date;
  provider?: string;
  metadata?: Record<string, unknown>;
}

export interface IOrder extends Document {
  orderNumber: string;
  customer: ICustomerInfo;
  user?: Types.ObjectId; // Optional authenticated user ref
  items: IOrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  couponCode?: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  customerNotes?: string;
  adminNotes?: string;
  paymentDetails?: IPaymentDetails;
  statusHistory: Array<{
    status: OrderStatus;
    changedAt: Date;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantId: {
      type: Schema.Types.ObjectId,
    },
    title: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
    },
    size: {
      type: String,
    },
    color: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
    },
  },
  { _id: false }
);

const CustomerInfoSchema = new Schema<ICustomerInfo>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
    district: { type: String, trim: true },
    zone: { type: String, trim: true },
    city: { type: String, trim: true },
    postalCode: { type: String, trim: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customer: {
      type: CustomerInfoSchema,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items && items.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'bkash', 'nagad'],
      required: true,
      default: 'cod',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'cod_pending'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'returned',
      ],
      default: 'pending',
      index: true,
    },
    customerNotes: {
      type: String,
      trim: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    paymentDetails: {
      transactionId: { type: String, trim: true },
      paymentId: { type: String, trim: true },
      senderNumber: { type: String, trim: true },
      paymentDate: { type: Date },
      provider: { type: String, trim: true },
      metadata: { type: Schema.Types.Mixed },
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ 'customer.phone': 1 });
OrderSchema.index({ 'customer.email': 1 });
OrderSchema.index({ createdAt: -1 });

export const Order: Model<IOrder> = model<IOrder>('Order', OrderSchema);
