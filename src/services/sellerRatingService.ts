import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import type { Order } from '@/types/order';
import type { Review } from '@/types';

export interface SellerStarSummary {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

/**
 * Aggregate a seller's reputation from approved reviews across all their products
 * (REV-03, D-03). Compute-on-read; reuses the same star-distribution shape as the
 * product-level review stats. `calcSellerPerformance` (below) is left untouched.
 */
export async function getSellerStarSummary(sellerId: string): Promise<SellerStarSummary> {
  const zero: SellerStarSummary = {
    average: 0,
    total: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
  try {
    const q = query(
      collection(db, 'reviews'),
      where('sellerId', '==', sellerId),
      where('status', '==', 'approved'),
    );
    const snap = await getDocs(q);
    const reviews = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Review)
      // Defensive: only approved reviews count toward the seller summary.
      .filter((r) => r.status === 'approved');

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let weightedSum = 0;
    let total = 0;
    for (const r of reviews) {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        weightedSum += r.rating;
        total += 1;
      }
    }
    const average = total > 0 ? Math.round((weightedSum / total) * 10) / 10 : 0;
    return { average, total, distribution };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'reviews');
    return zero;
  }
}

export interface SellerPerformanceScore {
  /** Overall score 0-100 */
  overall: number;
  /** Rating score (avg review rating × 20) */
  ratingScore: number;
  /** Ship speed score based on estimated vs actual */
  shipSpeedScore: number;
  /** Fulfillment compliance rate */
  complianceScore: number;
  /** Return rate penalty (lower is better) */
  returnRate: number;
  /** Cancellation rate penalty (lower is better) */
  cancelRate: number;
  /** Customer response rate */
  responseRate: number;
  /** Level badge */
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
}

/**
 * Calculate seller performance score based on orders, reviews, and fulfillment.
 */
export async function calcSellerPerformance(sellerId: string): Promise<SellerPerformanceScore> {
  const orders = await getSellerOrders(sellerId);
  const totalOrders = orders.length;
  if (!totalOrders) {
    return {
      overall: 100,
      ratingScore: 100,
      shipSpeedScore: 100,
      complianceScore: 100,
      returnRate: 0,
      cancelRate: 0,
      responseRate: 100,
      level: 'bronze',
    };
  }

  // Rating score — from product reviews
  const ratingScore = Math.min(100, 75); // placeholder, uses product review avg * 20

  // Ship speed — from fulfillment data
  const delivered = orders.filter((o) => o.status === 'delivered');
  const shipSpeedScore = delivered.length ? Math.min(100, 80 + Math.random() * 15) : 0;

  // Cancellation rate
  const cancelled = orders.filter((o) => o.status === 'cancelled').length;
  const cancelRate = (cancelled / totalOrders) * 100;

  // Return rate
  const returned = 0; // placeholder — would need returnRequest collection
  const returnRate = totalOrders > 0 ? (returned / totalOrders) * 100 : 0;

  // Compliance score
  const complianceScore = Math.max(0, 100 - cancelRate * 2 - returnRate * 3);

  // Response rate (placeholder)
  const responseRate = 90;

  // Overall weighted score
  const overall = Math.round(
    ratingScore * 0.3 +
      shipSpeedScore * 0.2 +
      complianceScore * 0.25 +
      responseRate * 0.15 +
      (100 - cancelRate * 2) * 0.1,
  );

  const level: SellerPerformanceScore['level'] =
    overall >= 90 ? 'platinum' : overall >= 75 ? 'gold' : overall >= 60 ? 'silver' : 'bronze';

  return {
    overall: Math.min(100, Math.max(0, overall)),
    ratingScore: Math.round(ratingScore),
    shipSpeedScore: Math.round(shipSpeedScore),
    complianceScore: Math.round(complianceScore),
    returnRate: Math.round(returnRate * 10) / 10,
    cancelRate: Math.round(cancelRate * 10) / 10,
    responseRate: Math.round(responseRate),
    level,
  };
}

async function getSellerOrders(sellerId: string): Promise<Order[]> {
  try {
    const q = query(collection(db, 'orders'), where('sellerIds', 'array-contains', sellerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
  } catch {
    return [];
  }
}
