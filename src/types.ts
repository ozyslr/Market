/**
 * Mercora Core Types
 */

export type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  country: string;
  currency: string;
}

export interface Seller {
  id: string;
  userId: string;
  storeName: string;
  slug: string;
  rating: number;
  kycStatus: 'pending' | 'verified' | 'rejected';
  commissionRate: number;
  bannerUrl?: string;
  logoUrl?: string;
  description?: string;
  followersCount?: number;
}

export interface Order {
  id: string;
  buyerId: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  market: string;
}

export interface UserProfile extends User {
  spentTotal: number;
  lastLogin: string;
  orders: Order[];
  savedItems: string[];
  preferences: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  icon?: string;
  description?: string;
  subCategories?: Category[];
}

export interface Product {
  id: string;
  sellerId: string;
  title: string;
  slug: string;
  description: string;
  longDescription?: string;
  specifications?: Record<string, string>;
  brand: string;
  categoryId: string;
  tags?: string[];
  price: number;
  oldPrice?: number;
  currency: string;
  stock: number;
  weight: number;
  originCountry: string;
  hsCode: string;
  images: string[];
  attributes: Record<string, string>;
  rating: number;
  reviewsCount: number;
  estimatedDeliveryDays?: number;
  deliveryTerms?: string;
  returnPolicy?: string;
  relatedProductIds?: string[];
  frequentlyBoughtTogetherIds?: string[];
}

export interface MarketContext {
  country: string;
  currency: string;
  language: string;
  vatRate: number;
  importTaxThreshold: number;
}

export interface TaxCalculation {
  subtotal: number;
  shipping: number;
  vat: number;
  customs: number;
  handlingFee: number;
  total: number;
}
