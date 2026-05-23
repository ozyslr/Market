/**
 * Mercora Core Types — Next.js Edition
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
  uid?: string;
  name: string;
  email: string;
  role: UserRole;
  country: string;
  currency: string;
  photoURL?: string;
  status?: 'active' | 'suspended' | 'banned';
}

export interface UserProfile extends User {
  spentTotal: number;
  lastLogin: string;
  orders: { id: string; total: number; status: string; createdAt: string }[];
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
  photos?: string[];
  helpfulCount?: number;
  helpfulVoters?: string[];
  categoryRatings?: { quality?: number; shipping?: number; description?: number };
  sellerResponse?: { text: string; createdAt: string; sellerName: string };
}

export interface ReviewStats {
  total: number;
  distribution: Record<number, number>;
  avgCategoryRatings: { quality: number; shipping: number; description: number };
}

export interface ProductQuestion {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  text: string;
  category?: 'size' | 'shipping' | 'stock' | 'other';
  createdAt: string;
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  helpfulCount?: number;
  helpfulVoters?: string[];
}

export interface Seller {
  id: string;
  userId: string;
  storeName: string;
  slug: string;
  email?: string;
  rating: number;
  reviewsCount: number;
  followersCount: number;
  origin: string;
  joinedDate: string;
  isVerified: boolean;
  status?: 'active' | 'suspended' | 'banned';
  bannerUrl?: string;
  logoUrl?: string;
  description?: string;
  returnPolicy?: string;
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
  subCategories?: Category[];
  brands?: { name: string; logo: string }[];
}

export type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type ProductVisibility = 'public' | 'hidden' | 'unlisted';

export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
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
  weight: number;
  originCountry: string;
  images: string[];
  attributes?: Record<string, string>;
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  isFlashDeal?: boolean;
  isTrending?: boolean;
  isAiPick?: boolean;
  discountPercentage?: number;
  discountStart?: string;
  discountEnd?: string;
  promoBadge?: string;
  sku?: string;
  status?: ProductStatus;
  visibility?: ProductVisibility;
  isActive?: boolean;
  promotionStatus?: 'none' | 'pending' | 'active' | 'rejected';
  createdAt?: string;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  image: string;
  category: string;
  color: string;
  ctaUrl?: string;
  enabled: boolean;
}

export interface HomepageSection {
  id: string;
  type: 'hero' | 'flash_deals' | 'product_row' | 'banner_grid' | 'promo_cards' | 'brand_strip';
  title?: string;
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
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  sellerId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  items: { productId: string; quantity: number; title: string }[];
}

export interface Campaign {
  id: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  targetType: 'all_products' | 'category' | 'brand' | 'specific_products';
  isActive: boolean;
  startDate: string;
  endDate: string;
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

export interface Notification {
  id: string;
  userId: string;
  type: 'order_status' | 'price_drop' | 'promotion' | 'system' | 'follow';
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: string;
}

// === CPC Advertising Engine Types ===

export type AdCampaignStatus = 'pending' | 'active' | 'paused' | 'rejected' | 'ended' | 'exhausted';

export interface AdCampaign {
  id: string;
  sellerId: string;
  productId: string;
  campaignName: string;
  cpcBid: number;
  dailyBudget: number;
  totalBudget: number;
  status: AdCampaignStatus;
  isActive: boolean;
  startDate: string;
  endDate: string;
  adminNote?: string;
  floorPrice?: number;
  impressions: number;
  clicks: number;
  spend: number;
  dailySpend: number;
  dailySpendDate: string;
  createdAt: string;
  updatedAt: string;
}

export type AdEventType = 'impression' | 'click';

export interface AdEvent {
  id: string;
  adCampaignId: string;
  sellerId: string;
  productId: string;
  type: AdEventType;
  sessionId: string;
  userId?: string;
  cost: number;
  ts: string;
  searchQuery?: string;
}

export interface AdConfig {
  floorCpc: number;
  maxSponsoredSlots: number;
  minBid: number;
  platformFeeRate: number;
}

export interface SponsoredSlot {
  productId: string;
  position: number;
  adCampaignId: string;
}

export interface AdDailyBreakdown {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
}

export interface AdPerformance {
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  avgCpc: number;
  dailyBreakdown: AdDailyBreakdown[];
}

export interface SellerAdAnalytics {
  totalImpressions: number;
  totalClicks: number;
  totalSpend: number;
  averageCtr: number;
  activeCampaigns: number;
  campaigns: (AdCampaign & { ctr: number; avgCpc: number })[];
}

// === Seller Subscription Model (STREAM D) ===

export type SellerSubscriptionTier = 'standard' | 'pro' | 'enterprise';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired' | 'trial';

export type BillingCycle = 'monthly' | 'yearly';

export interface SellerSubscriptionTierBenefits {
  maxProducts: number;
  inventorySyncApi: boolean;
  advancedAnalytics: boolean;
  featuredListings: boolean;
  featuredBadge: boolean;
  prioritySupport: 'email' | 'phone' | 'whatsapp' | 'none';
  dedicatedAccountManager: boolean;
  whiteLabelOptions: boolean;
  customIntegrations: boolean;
  commissionRate: number;
  monthlyPrice: number;
  yearlyPrice: number;
}

export interface SellerSubscription {
  id: string;
  sellerId: string;
  tier: SellerSubscriptionTier;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  trialEndDate?: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SellerBillingInvoice {
  id: string;
  sellerId: string;
  subscriptionId: string;
  stripeInvoiceId?: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  paidAt?: string;
  dueAt: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  pdfUrl?: string;
}

export interface SellerOnboardingData {
  storeName: string;
  email: string;
  phone: string;
  bankAccount?: {
    accountNumber: string;
    accountHolder: string;
    bankName: string;
    swiftCode?: string;
  };
  taxId?: string;
  businessAddress: Address;
  businessType: 'individual' | 'company' | 'partnership';
}
