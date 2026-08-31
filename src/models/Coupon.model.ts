import { Schema, model, Document, Model } from 'mongoose';

export type DiscountType = 'percentage' | 'fixed';

export interface ICoupon extends Document {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startDate: Date;
  expiryDate: Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  isValid(orderAmount: number): { valid: boolean; reason?: string; discountAmount: number };
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    usageLimit: {
      type: Number,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

CouponSchema.methods.isValid = function (
  orderAmount: number
): { valid: boolean; reason?: string; discountAmount: number } {
  const now = new Date();

  if (!this.isActive) {
    return { valid: false, reason: 'This coupon is no longer active.', discountAmount: 0 };
  }

  if (now < this.startDate) {
    return { valid: false, reason: 'This coupon is not yet valid.', discountAmount: 0 };
  }

  if (now > this.expiryDate) {
    return { valid: false, reason: 'This coupon has expired.', discountAmount: 0 };
  }

  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, reason: 'Coupon usage limit reached.', discountAmount: 0 };
  }

  if (orderAmount < this.minOrderAmount) {
    return {
      valid: false,
      reason: `Minimum order amount of ${this.minOrderAmount} required to use this coupon.`,
      discountAmount: 0,
    };
  }

  let calculatedDiscount = 0;
  if (this.discountType === 'percentage') {
    calculatedDiscount = (orderAmount * this.discountValue) / 100;
    if (this.maxDiscountAmount && calculatedDiscount > this.maxDiscountAmount) {
      calculatedDiscount = this.maxDiscountAmount;
    }
  } else {
    calculatedDiscount = Math.min(this.discountValue, orderAmount);
  }

  return {
    valid: true,
    discountAmount: Math.round(calculatedDiscount * 100) / 100,
  };
};

export const Coupon: Model<ICoupon> = model<ICoupon>('Coupon', CouponSchema);
