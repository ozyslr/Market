/**
 * Mercora Core Types
 */

export type UserRole = 'buyer' | 'seller' | 'admin' | 'moderator';

export interface Address {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  country: string;
  currency: string;
  photoURL?: string;
  status?: 'active' | 'suspended' | 'banned';
  suspendedUntil?: string;
  adminNote?: string;
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
  status: 'pending' | 'approved' | 'rejected';
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
  status?: 'active' | 'suspended' | 'banned';
  suspendedUntil?: string;
  adminNote?: string;
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
  addresses?: Address[];
  defaultAddressId?: string;
  followedSellers?: string[];
  preferences: {
    newsletter: boolean;
    personalizedDeals: boolean;
    pushNotifications: boolean;
  };
}

export type FilterAttributeType = 'checkbox' | 'range' | 'select' | 'rating';

export interface FilterAttributeOption {
  value: string;
  label: string;
}

export interface FilterAttribute {
  key: string;
  label: string;
  type: FilterAttributeType;
  options?: FilterAttributeOption[];
  unit?: string;
  productField?: 'top-level' | 'attributes';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  level?: 1 | 2 | 3;
  menuOrder?: number;
  icon?: string;
  description?: string;
  image?: string;
  bannerUrl?: string;
  filterAttributes?: FilterAttribute[];
  subCategories?: Category[];
  subGroups?: {
    name: string;
    items: { name: string; query: string }[];
  }[];
  brands?: { name: string; logo: string }[];
  items?: { name: string; query: string }[];
}

export type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type ProductVisibility = 'public' | 'hidden' | 'unlisted';

export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
  barcode?: string;
  imageIndex?: number;
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
  variants?: ProductVariant[];
  variantAttributes?: string[];
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
  sku?: string;
  status?: ProductStatus;
  visibility?: ProductVisibility;
  isTrending?: boolean;
  isAiPick?: boolean;
  moderationNote?: string;
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

export interface HeroSlide {
  id: string;
  title: string;
  titleEn?: string;
  subtitle: string;
  subtitleEn?: string;
  desc: string;
  descEn?: string;
  image: string;
  category: string;
  color: string;
  ctaUrl?: string;
  enabled: boolean;
}

export type HomepageSectionType =
  | 'hero'
  | 'flash_deals'
  | 'product_row'
  | 'banner_grid'
  | 'promo_cards'
  | 'brand_strip';

export interface HomepageSection {
  id: string;
  type: HomepageSectionType;
  title?: string;
  titleEn?: string;
  enabled: boolean;
  order: number;
  config: {
    filter?: 'featured' | 'bestSeller' | 'isFlashDeal' | 'newArrival' | 'category';
    categoryId?: string;
    limit?: number;
    slides?: HeroSlide[];
    flashDealEndTime?: string;
    pinnedProductIds?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
}

export interface SiteSettings {
  id: 'global';
  siteName: string;
  logoUrl?: string;
  primaryColor?: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  contactEmail?: string;
  socialLinks?: { platform: string; url: string }[];
  updatedAt?: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  sellerId: string;
  reason: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt?: string;
  items: { productId: string; quantity: number; title: string }[];
}

export type CampaignTargetType = 'all_products' | 'category' | 'brand' | 'specific_products';
export type CampaignDiscountType = 'percentage' | 'fixed';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  discountType: CampaignDiscountType;
  discountValue: number;
  targetType: CampaignTargetType;
  targetValue?: string;
  minOrderAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductQuestion {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  text: string;
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  createdAt: string;
}
