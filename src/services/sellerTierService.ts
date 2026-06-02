/**
 * Satıcı Kademe Sistemi (Seller Tier System)
 *
 * Tier-based limits, commission rates, and feature unlocks.
 * Admin-configurable per tier. Performance level determines base tier.
 */

import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';

// ─── Types ──────────────────────────────────────────────────────────────────

export type SellerTier = 'starter' | 'bronze' | 'silver' | 'gold' | 'platinum';

export interface TierConfig {
  tier: SellerTier;
  label: string;
  /** Maximum active product listings */
  maxProducts: number;
  /** Maximum monthly revenue cap before forced upgrade */
  maxMonthlyRevenue?: number;
  /** Commission rate for this tier (e.g. 10 = 10%) */
  commissionRate: number;
  /** Monthly subscription fee */
  monthlyFee: number;
  /** Benefits unlocked at this tier */
  benefits: string[];
  /** Whether API access is granted */
  apiAccess: boolean;
  /** Whether bulk import is allowed */
  bulkImport: boolean;
  /** Whether seller can create coupons */
  couponCreation: boolean;
  /** Whether dynamic pricing is enabled */
  dynamicPricing: boolean;
  /** Whether seller gets featured placement */
  featuredPlacement: boolean;
  /** Minimum performance score to reach this tier */
  minPerformanceScore: number;
}

export interface SellerTierStatus {
  sellerId: string;
  currentTier: SellerTier;
  /** Products currently listed */
  productCount: number;
  /** Products remaining before hitting cap */
  remainingSlots: number;
  /** Current monthly revenue */
  monthlyRevenue: number;
  /** Performance score */
  performanceScore: number;
  /** Next tier target */
  nextTier: SellerTier | null;
  /** Score needed for next tier */
  scoreToNextTier: number | null;
  /** Products needed for next tier (if capped) */
  productsToNextTier: number | null;
  /** Whether the seller is at the cap */
  atCap: boolean;
  /** Tier configuration */
  tierConfig: TierConfig;
  /** Upgrade recommendation */
  recommendation: string;
  updatedAt: string;
}

// ─── Tier Definitions ───────────────────────────────────────────────────────

const DEFAULT_TIERS: Record<SellerTier, Omit<TierConfig, 'tier'>> = {
  starter: {
    label: 'Başlangıç',
    maxProducts: 50,
    maxMonthlyRevenue: 50000,
    commissionRate: 15,
    monthlyFee: 0,
    benefits: ['Temel mağaza sayfası', 'Manuel sipariş yönetimi', 'E-posta desteği'],
    apiAccess: false,
    bulkImport: false,
    couponCreation: false,
    dynamicPricing: false,
    featuredPlacement: false,
    minPerformanceScore: 0,
  },
  bronze: {
    label: 'Bronz',
    maxProducts: 200,
    maxMonthlyRevenue: 150000,
    commissionRate: 12,
    monthlyFee: 99,
    benefits: [
      'Gelişmiş mağaza sayfası',
      'Toplu CSV import',
      'Temel analitik',
      'Canlı sohbet desteği',
    ],
    apiAccess: false,
    bulkImport: true,
    couponCreation: false,
    dynamicPricing: false,
    featuredPlacement: false,
    minPerformanceScore: 40,
  },
  silver: {
    label: 'Gümüş',
    maxProducts: 500,
    maxMonthlyRevenue: 500000,
    commissionRate: 10,
    monthlyFee: 249,
    benefits: [
      'Özelleştirilebilir mağaza',
      'Kupon oluşturma',
      'Dinamik fiyatlandırma',
      'Gelişmiş analitik',
      'Öncelikli destek',
    ],
    apiAccess: false,
    bulkImport: true,
    couponCreation: true,
    dynamicPricing: true,
    featuredPlacement: false,
    minPerformanceScore: 60,
  },
  gold: {
    label: 'Altın',
    maxProducts: 2000,
    maxMonthlyRevenue: 2000000,
    commissionRate: 8,
    monthlyFee: 599,
    benefits: [
      'Premium mağaza',
      'API erişimi',
      'Öne çıkan yerleşim',
      'Kupon + kampanya',
      'Fiyatlandırma motoru',
      '7/24 öncelikli destek',
      'İade otomasyonu',
    ],
    apiAccess: true,
    bulkImport: true,
    couponCreation: true,
    dynamicPricing: true,
    featuredPlacement: true,
    minPerformanceScore: 75,
  },
  platinum: {
    label: 'Platin',
    maxProducts: 10000,
    maxMonthlyRevenue: undefined, // Unlimited
    commissionRate: 5,
    monthlyFee: 1499,
    benefits: [
      'Sınırsız ürün',
      'En düşük komisyon',
      'API + Webhook',
      'Öncelikli featured yerleşim',
      'Blockchain sertifikası',
      'Özel hesap yöneticisi',
      'Tüm özellikler sınırsız',
    ],
    apiAccess: true,
    bulkImport: true,
    couponCreation: true,
    dynamicPricing: true,
    featuredPlacement: true,
    minPerformanceScore: 90,
  },
};

const TIER_ORDER: SellerTier[] = ['starter', 'bronze', 'silver', 'gold', 'platinum'];

// ─── Public API ──────────────────────────────────────────────────────────────

const COL = 'sellerTiers';

/** Get tier configuration (admin-customized or default) */
export async function getTierConfig(tier: SellerTier): Promise<TierConfig> {
  try {
    const snap = await getDoc(doc(db, COL, tier));
    if (snap.exists()) return { tier, ...(snap.data() as Omit<TierConfig, 'tier'>) };
  } catch {
    /* empty */
  }
  return { tier, ...DEFAULT_TIERS[tier] };
}

/** Admin: update tier configuration */
export async function updateTierConfig(
  tier: SellerTier,
  updates: Partial<Omit<TierConfig, 'tier'>>,
): Promise<void> {
  try {
    await setDoc(doc(db, COL, tier), { ...DEFAULT_TIERS[tier], ...updates }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${tier}`);
    throw error;
  }
}

/** Admin: get all tier configs */
export async function getAllTierConfigs(): Promise<TierConfig[]> {
  try {
    const snap = await getDocs(collection(db, COL));
    const stored = new Map(snap.docs.map((d) => [d.id, d.data() as Omit<TierConfig, 'tier'>]));
    return TIER_ORDER.map((tier) => ({
      tier,
      ...(stored.get(tier) || DEFAULT_TIERS[tier]),
    }));
  } catch {
    return TIER_ORDER.map((tier) => ({ tier, ...DEFAULT_TIERS[tier] }));
  }
}

/** Determine tier from performance score */
export function getTierFromScore(score: number): SellerTier {
  for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
    const tier = TIER_ORDER[i];
    if (score >= DEFAULT_TIERS[tier].minPerformanceScore) return tier;
  }
  return 'starter';
}

/** Get the next tier up */
export function getNextTier(current: SellerTier): SellerTier | null {
  const idx = TIER_ORDER.indexOf(current);
  return idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;
}

/** Calculate seller tier status with all metrics */
export async function getSellerTierStatus(
  sellerId: string,
  productCount: number,
  monthlyRevenue: number,
  performanceScore: number,
): Promise<SellerTierStatus> {
  const currentTier = getTierFromScore(performanceScore);
  const config = await getTierConfig(currentTier);
  const remainingSlots = Math.max(0, config.maxProducts - productCount);
  const atCap = productCount >= config.maxProducts;
  const nextTier = getNextTier(currentTier);
  const nextConfig = nextTier ? DEFAULT_TIERS[nextTier] : null;
  const scoreToNextTier = nextConfig ? nextConfig.minPerformanceScore - performanceScore : null;
  const productsToNextTier = nextConfig ? nextConfig.maxProducts - productCount : null;

  let recommendation: string;
  if (atCap && nextTier) {
    recommendation = `Ürün limitine ulaştınız! ${nextConfig!.maxProducts} ürün için ${nextTier} seviyesine yükselin.`;
  } else if (remainingSlots < 10 && nextTier) {
    recommendation = `${remainingSlots} ürün hakkınız kaldı. ${nextTier} seviyesine yükselmeyi düşünün.`;
  } else if (scoreToNextTier && scoreToNextTier <= 5) {
    recommendation = `${nextTier} seviyesine sadece ${scoreToNextTier} puan kaldı! Performansınızı artırın.`;
  } else if (!nextTier) {
    recommendation = 'En üst seviyedesiniz! Tüm avantajlardan yararlanıyorsunuz.';
  } else {
    recommendation = `${nextTier} seviyesi için ${productsToNextTier} ürün ve ${scoreToNextTier} puan gerekiyor.`;
  }

  return {
    sellerId,
    currentTier,
    productCount,
    remainingSlots,
    monthlyRevenue,
    performanceScore,
    nextTier,
    scoreToNextTier,
    productsToNextTier,
    atCap,
    tierConfig: config,
    recommendation,
    updatedAt: new Date().toISOString(),
  };
}

/** Get all tier benefits for display */
export function getTierBenefits(): {
  tier: SellerTier;
  label: string;
  benefits: string[];
  commissionRate: number;
  maxProducts: number;
}[] {
  return TIER_ORDER.map((tier) => ({
    tier,
    label: DEFAULT_TIERS[tier].label,
    benefits: DEFAULT_TIERS[tier].benefits,
    commissionRate: DEFAULT_TIERS[tier].commissionRate,
    maxProducts: DEFAULT_TIERS[tier].maxProducts,
  }));
}
