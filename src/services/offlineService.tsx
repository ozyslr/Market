/**
 * Offline-first utilities and network status management.
 *
 * Provides:
 * - useNetworkStatus hook (online/offline detection)
 * - OfflineBanner component
 * - IndexedDB cache for offline data access
 * - Offline cart sync
 */

import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

// ─── Network Status Hook ────────────────────────────────────────────────────

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Coming back online - trigger reconnection
        setWasOffline(false);
      }
    };
    const goOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
}

// ─── Offline Banner ─────────────────────────────────────────────────────────

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 start-0 end-0 z-[9999] bg-amber-500 text-white px-4 py-2 text-center">
      <p className="text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
        <WifiOff size={14} /> Çevrimdışısınız — veriler bağlantı kurulduğunda senkronize edilecek
      </p>
    </div>
  );
}

// ─── Connection Indicator ───────────────────────────────────────────────────

export function ConnectionIndicator() {
  const { isOnline } = useNetworkStatus();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
      isOnline ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
    }`}>
      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      {isOnline ? 'Online' : 'Offline'}
    </span>
  );
}

// ─── IndexedDB Offline Cache ────────────────────────────────────────────────

const DB_NAME = 'benimolan_offline';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('pendingActions')) {
        db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Store data in offline cache */
export async function cacheOfflineData(key: string, data: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('cache', 'readwrite');
    tx.objectStore('cache').put({ key, data, timestamp: Date.now() });
  } catch { /* non-critical */ }
}

/** Read data from offline cache */
export async function getOfflineData<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise(resolve => {
      const tx = db.transaction('cache', 'readonly');
      const req = tx.objectStore('cache').get(key);
      req.onsuccess = () => {
        const result = req.result;
        resolve(result ? result.data as T : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** Queue an action to be performed when back online */
export async function queueOfflineAction(action: { type: string; payload: any }): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('pendingActions', 'readwrite');
    tx.objectStore('pendingActions').add({ ...action, createdAt: Date.now() });
  } catch { /* non-critical */ }
}

/** Process all queued offline actions */
export async function processPendingActions(
  handler: (action: { type: string; payload: any }) => Promise<void>,
): Promise<number> {
  try {
    const db = await openDB();
    const tx = db.transaction('pendingActions', 'readwrite');
    const store = tx.objectStore('pendingActions');
    const all = await new Promise<any[]>((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    let processed = 0;
    for (const action of all) {
      try {
        await handler(action);
        store.delete(action.id);
        processed++;
      } catch { /* skip failed */ }
    }
    return processed;
  } catch {
    return 0;
  }
}

// ─── Offline-Ready Cart Hook ────────────────────────────────────────────────

/**
 * Enhances cart with offline persistence.
 * Cart is already stored in Firestore + Context; this adds localStorage fallback.
 */
export function useOfflineCart() {
  const CART_KEY = 'offline_cart';

  const saveCartOffline = useCallback((items: any[]) => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {}
  }, []);

  const loadCartOffline = useCallback((): any[] => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const clearOfflineCart = useCallback(() => {
    try {
      localStorage.removeItem(CART_KEY);
    } catch {}
  }, []);

  return { saveCartOffline, loadCartOffline, clearOfflineCart };
}

// ─── Reconnection Handler ───────────────────────────────────────────────────

/**
 * Hook that processes queued actions when coming back online.
 * Usage: useReconnectHandler(processOrder, processCartUpdate)
 */
export function useReconnectHandler(
  onReconnect?: () => void,
) {
  const { isOnline } = useNetworkStatus();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ processed: number; failed: number } | null>(null);

  useEffect(() => {
    if (!isOnline || !onReconnect) return;
    setSyncing(true);
    onReconnect();
    // Process pending actions
    processPendingActions(async (action) => {
      // Default handler - can be overridden
      console.log('[offline] Processing pending action:', action.type, action.payload);
    }).then(processed => {
      setSyncResult({ processed, failed: 0 });
      setSyncing(false);
      setTimeout(() => setSyncResult(null), 5000);
    });
  }, [isOnline]);

  return { syncing, syncResult };
}
