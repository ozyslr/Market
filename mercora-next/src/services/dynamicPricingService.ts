'use client';

import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface PricingFactors {
  basePrice: number;
  stock: number;
  maxStock: number;
  daysSinceCreated: number;
  totalSales: number;
  competitorAvgPrice?: number;
  demandScore?: number;
}

export interface DynamicPriceResult {
  recommendedPrice: number;
  strategy: 'stock_discount' | 'high_demand' | 'age_discount' | 'competitive' | 'standard';
  factors: string[];
  savings?: number;
}

export function calculateDynamicPrice(factors: PricingFactors): DynamicPriceResult {
  const { basePrice, stock, maxStock, daysSinceCreated, totalSales, competitorAvgPrice } = factors;
  const stockRatio = stock / maxStock;
  const factorsList: string[] = [];
  let multiplier = 1;
  let strategy: DynamicPriceResult['strategy'] = 'standard';

  // Overstock discount (>80% stock remaining)
  if (stockRatio > 0.8 && totalSales > 0) {
    multiplier = 0.85;
    strategy = 'stock_discount';
    factorsList.push('High stock level — 15% discount applied');
  }

  // Low stock / high demand
  if (stockRatio < 0.2 && totalSales > 10) {
    multiplier = 1.15;
    strategy = 'high_demand';
    factorsList.push('Low stock with high demand — 15% premium applied');
  }

  // Old stock discount (>180 days)
  if (daysSinceCreated > 180 && stockRatio > 0.3) {
    multiplier = Math.min(multiplier, 0.75);
    strategy = 'age_discount';
    factorsList.push('Product over 180 days old — 25% clearance discount');
  } else if (daysSinceCreated > 90 && stockRatio > 0.5) {
    multiplier = Math.min(multiplier, 0.9);
    strategy = 'age_discount';
    factorsList.push('Product over 90 days old — 10% discount applied');
  }

  // Competitive pricing
  if (competitorAvgPrice && competitorAvgPrice < basePrice * 0.95) {
    const compRatio = competitorAvgPrice / basePrice;
    multiplier = Math.min(multiplier, compRatio * 1.02);
    strategy = 'competitive';
    factorsList.push('Competitive pricing adjustment to match market');
  }

  const recommendedPrice = Math.round(basePrice * multiplier * 100) / 100;
  const savings = multiplier < 1 ? Math.round((basePrice - recommendedPrice) * 100) / 100 : undefined;

  return { recommendedPrice, strategy, factors: factorsList, savings };
}

export async function getCategoryDemandScore(categoryId: string): Promise<number> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const q = query(
      collection(db, 'orders'),
      where('status', '==', 'delivered'),
      orderBy('createdAt', 'desc'),
      limit(100),
    );
    const snap = await getDocs(q);
    let categoryCount = 0;
    let totalCount = 0;

    snap.docs.forEach(d => {
      const items = d.data().items ?? [];
      totalCount += items.length;
      categoryCount += items.filter((i: { category?: string }) => i.category === categoryId).length;
    });

    if (totalCount === 0) return 0.5;
    return Math.min(categoryCount / totalCount, 1);
  } catch {
    return 0.5;
  }
}

export function getPriceRecommendationLabel(strategy: DynamicPriceResult['strategy']): string {
  const labels: Record<string, string> = {
    stock_discount: 'Stock Clearance',
    high_demand: 'High Demand',
    age_discount: 'Time Discount',
    competitive: 'Market Match',
    standard: 'Standard Price',
  };
  return labels[strategy] ?? 'Standard Price';
}
