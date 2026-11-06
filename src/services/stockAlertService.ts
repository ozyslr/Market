import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createNotification } from './notificationService';
import { getStoreConfig } from './sellerStoreService';
import { Product } from '@/types';

const COL = 'stockAlerts';

export interface StockAlert {
  userId: string;
  productId: string;
  createdAt: string;
  notified: boolean;
}

function alertId(userId: string, productId: string): string {
  return `${userId}_${productId}`;
}

export async function subscribeToStockAlert(userId: string, productId: string): Promise<void> {
  await setDoc(doc(db, COL, alertId(userId, productId)), {
    userId,
    productId,
    createdAt: new Date().toISOString(),
    notified: false,
  });
}

export async function unsubscribeFromStockAlert(userId: string, productId: string): Promise<void> {
  await deleteDoc(doc(db, COL, alertId(userId, productId)));
}

export async function isSubscribedToStockAlert(
  userId: string,
  productId: string,
): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, COL, alertId(userId, productId)));
    return snap.exists();
  } catch {
    return false;
  }
}

/**
 * Notify seller when product stock drops below threshold.
 * Call this after a successful order reduces stock.
 * Respects per-product threshold override, falling back to seller-level config.
 */
export async function notifySellerLowStock(
  sellerId: string,
  productId: string,
  currentStock: number,
  productTitle: string,
  productSlug: string,
): Promise<void> {
  try {
    // Get per-product threshold override
    const productSnap = await getDoc(doc(db, 'products', productId));
    let threshold: number | null = null;
    if (productSnap.exists()) {
      threshold = (productSnap.data() as Product).lowStockThreshold ?? null;
    }

    // Fall back to seller-level config
    if (threshold == null) {
      const config = await getStoreConfig(sellerId);
      threshold = config.lowStockThreshold ?? 5;
    }

    if (currentStock > threshold) return;

    const link = `/seller/inventory`;
    if (currentStock === 0) {
      await createNotification(
        sellerId,
        'admin_alert',
        'Stok Tükendi!',
        `"${productTitle}" ürününün stoğu tükendi. Lütfen stok güncelleyin.`,
        link,
      );
    } else {
      await createNotification(
        sellerId,
        'admin_alert',
        'Düşük Stok Uyarısı',
        `"${productTitle}" ürününde sadece ${currentStock} adet kaldı (eşik: ${threshold}).`,
        link,
      );
    }
  } catch (error) {
    console.error('[stockAlertService] notifySellerLowStock error:', error);
  }
}
