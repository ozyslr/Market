/**
 * Mercora Core Types
 */

export type UserRole = 'buyer' | 'seller' | 'admin' | 'moderator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  country: string;
  currency: string;
}

export interface Review {
  id: string;
  productId?: string;
  sellerId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  verified: boolean;
}

export interface Seller {
  id: string;
  userId: string;
  storeName: string;
  slug: string;
  rating: number;
  reviewsCount: number;
  followersCount: number;
  origin: string;
  joinedDate: string;
  isVerified: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected';
  commissionRate: number;
  bannerUrl?: string;
  logoUrl?: string;
  description?: string;
  fulfillmentHealth?: {
    shipSpeed: string;
    compliance: string;
  };
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
  preferences: {
    newsletter: boolean;
    personalizedDeals: boolean;
    pushNotifications: boolean;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  icon?: string;
  description?: string;
  image?: string;
  subCategories?: Category[];
  subGroups?: {
    name: string;
    items: { name: string; query: string }[];
  }[];
  brands?: { name: string; logo: string }[];
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
  hsCode?: string;
  images: string[];
  attributes?: Record<string, string>;
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  isFlashDeal?: boolean;
  discountPercentage?: number;
  promoBadge?: string;
  promotionStatus?: 'none' | 'pending' | 'active' | 'rejected';
  estimatedDeliveryDays?: number;
  deliveryTerms?: string;
  returnPolicy?: string;
  relatedProductIds?: string[];
  frequentlyBoughtTogetherIds?: string[];
  reviews?: Review[];
  createdAt?: string;
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
