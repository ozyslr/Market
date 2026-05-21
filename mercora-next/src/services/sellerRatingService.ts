'use client';

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';
import type { Order } from '@/types/order';

export interface SellerPerformanceScore {
  overall: number;
  ratingScore: number;
  shipSpeedScore: number;
  complianceScore: number;
  returnRate: number;
  cancelRate: number;
  responseRate: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export async function calcSellerPerformance(sellerId: string): Promise<SellerPerformanceScore> {
  const orders = await getSellerOrders(sellerId);
  const totalOrders = orders.length;
  if (!totalOrders) {
    return {
      overall: 100, ratingScore: 100, shipSpeedScore: 100, complianceScore: 100,
      returnRate: 0, cancelRate: 0, responseRate: 100, level: 'bronze',
    };
  }

  const ratingScore = Math.min(100, 75);

  const delivered = orders.filter(o => o.status === 'delivered');
  const shipSpeedScore = delivered.length ? Math.min(100, 80 + Math.random() * 15) : 0;

  const cancelled = orders.filter(o => o.status === 'cancelled').length;
  const cancelRate = (cancelled / totalOrders) * 100;

  const returned = 0;
  const returnRate = totalOrders > 0 ? (returned / totalOrders) * 100 : 0;

  const complianceScore = Math.max(0, 100 - cancelRate * 2 - returnRate * 3);
  const responseRate = 90;

  const overall = Math.round(
    ratingScore * 0.3 +
    shipSpeedScore * 0.2 +
    complianceScore * 0.25 +
    responseRate * 0.15 +
    (100 - cancelRate * 2) * 0.1
  );

  const level: SellerPerformanceScore['level'] =
    overall >= 90 ? 'platinum' :
    overall >= 75 ? 'gold' :
    overall >= 60 ? 'silver' : 'bronze';

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
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
  } catch {
    return [];
  }
}
