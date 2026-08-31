import { Schema, model, Document, Model, Types } from 'mongoose';
import { Product } from './Product.model.js';

export interface IReview extends Document {
  product: Types.ObjectId;
  customerName: string;
  customerEmail?: string;
  rating: number;
  title?: string;
  comment: string;
  isApproved: boolean;
  verifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5'],
    },
    title: {
      type: String,
      trim: true,
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to update product average rating
ReviewSchema.statics.calculateAverageRating = async function (productId: Types.ObjectId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId, isApproved: true },
    },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].reviewCount,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      reviewCount: 0,
    });
  }
};

ReviewSchema.post<IReview>('save', async function () {
  const ReviewModel = this.constructor as Model<IReview> & {
    calculateAverageRating(productId: Types.ObjectId): Promise<void>;
  };
  await ReviewModel.calculateAverageRating(this.product);
});

export const Review: Model<IReview> & {
  calculateAverageRating(productId: Types.ObjectId): Promise<void>;
} = model<
  IReview,
  Model<IReview> & { calculateAverageRating(productId: Types.ObjectId): Promise<void> }
>('Review', ReviewSchema);
