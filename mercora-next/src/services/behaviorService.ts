'use client';

import { collection, addDoc, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type EventType = 'view' | 'cart' | 'purchase' | 'search';

export interface BehaviorEvent {
  type: EventType;
  productId?: string;
  query?: string;
  timestamp: string;
}

export async function trackEvent(userId: string, event: BehaviorEvent): Promise<void> {
  try {
    await addDoc(collection(db, 'behavior', userId, 'events'), event);
  } catch {
    // silent — tracking never breaks UX
  }
}

export async function getRecentViewedIds(userId: string, count = 8): Promise<string[]> {
  try {
    const q = query(
      collection(db, 'behavior', userId, 'events'),
      where('type', '==', 'view'),
      orderBy('timestamp', 'desc'),
      limit(count * 2),
    );
    const snap = await getDocs(q);
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const d of snap.docs) {
      const pid = d.data().productId as string | undefined;
      if (pid && !seen.has(pid)) {
        seen.add(pid);
        ids.push(pid);
        if (ids.length >= count) break;
      }
    }
    return ids;
  } catch {
    return [];
  }
}
