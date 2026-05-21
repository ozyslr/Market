'use client';

import { collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';

export type EventType = 'view' | 'click' | 'cart' | 'purchase' | 'wishlist';

export interface AnalyticsEvent {
  userId?: string;
  productId: string;
  type: EventType;
  sessionId?: string;
  ts: string;
}

let _sessionId: string | null = null;

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  if (!_sessionId) {
    _sessionId = sessionStorage.getItem('mcr_sid') ?? Math.random().toString(36).slice(2);
    sessionStorage.setItem('mcr_sid', _sessionId);
  }
  return _sessionId;
}

export async function trackEvent(
  type: EventType,
  productId: string,
  userId?: string,
): Promise<void> {
  try {
    await addDoc(collection(db, 'events'), {
      type,
      productId,
      userId: userId ?? null,
      sessionId: getSessionId(),
      ts: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'events');
  }
}

export async function getTrendingProductIds(topN = 10): Promise<string[]> {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const q = query(
      collection(db, 'events'),
      where('type', 'in', ['view', 'click', 'cart']),
      orderBy('ts', 'desc'),
      limit(500),
    );
    const snap = await getDocs(q);
    const counts: Record<string, number> = {};
    snap.docs.forEach(d => {
      const pid: string = d.data().productId;
      counts[pid] = (counts[pid] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN)
      .map(([id]) => id);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'events');
    return [];
  }
}

export async function getPersonalizedProductIds(userId: string, topN = 10): Promise<string[]> {
  try {
    const q = query(
      collection(db, 'events'),
      where('userId', '==', userId),
      orderBy('ts', 'desc'),
      limit(100),
    );
    const snap = await getDocs(q);
    const counts: Record<string, number> = {};
    snap.docs.forEach(d => {
      const pid: string = d.data().productId;
      const weight = d.data().type === 'purchase' ? 5 : d.data().type === 'cart' ? 3 : 1;
      counts[pid] = (counts[pid] ?? 0) + weight;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN)
      .map(([id]) => id);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'events');
    return [];
  }
}
