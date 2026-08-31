import { Schema, model, Document, Model } from 'mongoose';

export interface IBanner {
  _id?: any;
  title?: string;
  subtitle?: string;
  type?: string;
  image: string;
  desktopImage?: string;
  mobileImage?: string;
  buttonText?: string;
  buttonUrl?: string;
  link?: string;
  status?: string;
  isActive?: boolean;
  order?: number;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISetting extends Document {
  storeName: string;
  tagline?: string;
  logo?: string;
  favicon?: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  currencySymbol: string;
  shipping: {
    insideDhaka: number;
    outsideDhaka: number;
    freeShippingThreshold: number;
    estimatedDeliveryInsideDhaka: string;
    estimatedDeliveryOutsideDhaka: string;
  };
  paymentMethods: {
    cod: { enabled: boolean };
    bkash: { enabled: boolean; merchantNumber?: string };
    nagad: { enabled: boolean; merchantNumber?: string };
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  notice?: string;
  banners?: IBanner[];
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    storeName: {
      type: String,
      required: true,
      default: 'NOVA Fashion',
    },
    tagline: {
      type: String,
      default: 'Premium Clothing & Fashion Apparel',
    },
    logo: {
      type: String,
      default: '',
    },
    favicon: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      required: true,
      default: 'support@novafashion.com',
    },
    phone: {
      type: String,
      required: true,
      default: '+880 1700 000000',
    },
    address: {
      type: String,
      required: true,
      default: 'Gulshan-2, Dhaka, Bangladesh',
    },
    currency: {
      type: String,
      default: 'BDT',
    },
    currencySymbol: {
      type: String,
      default: '৳',
    },
    shipping: {
      insideDhaka: { type: Number, default: 60 },
      outsideDhaka: { type: Number, default: 120 },
      freeShippingThreshold: { type: Number, default: 2500 },
      estimatedDeliveryInsideDhaka: { type: String, default: '2-3 Business Days' },
      estimatedDeliveryOutsideDhaka: { type: String, default: '3-5 Business Days' },
    },
    paymentMethods: {
      cod: { enabled: { type: Boolean, default: true } },
      bkash: { enabled: { type: Boolean, default: true }, merchantNumber: { type: String, default: '01700000000' } },
      nagad: { enabled: { type: Boolean, default: true }, merchantNumber: { type: String, default: '01800000000' } },
    },
    socialLinks: {
      facebook: { type: String, default: 'https://facebook.com' },
      instagram: { type: String, default: 'https://instagram.com' },
      twitter: { type: String, default: 'https://twitter.com' },
      youtube: { type: String, default: '' },
    },
    notice: {
      type: String,
      default: 'Free shipping on all orders over ৳2,500 across Bangladesh!',
    },
    banners: [
      {
        title: { type: String, default: '' },
        subtitle: { type: String, default: '' },
        type: { type: String, default: 'Hero' },
        image: { type: String, default: '' },
        desktopImage: { type: String, default: '' },
        mobileImage: { type: String, default: '' },
        buttonText: { type: String, default: '' },
        buttonUrl: { type: String, default: '' },
        link: { type: String, default: '' },
        status: { type: String, default: 'Active' },
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
        sortOrder: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
    strict: false,
  }
);

export const Setting: Model<ISetting> = model<ISetting>('Setting', SettingSchema);
