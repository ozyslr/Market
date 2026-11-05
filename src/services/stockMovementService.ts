import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface StockMovement {
  id?: string;
  productId: string;
  sellerId: string;
  oldStock: number;
  newStock: number;
  delta: number;
  reason: string;
  userId: string;
  warehouseId?: string;
  createdAt?: any;
}

const REASONS: Record<string, string> = {
  manual_update: 'Manuel Güncelleme',
  bulk_update: 'Toplu Güncelleme',
  order_placed: 'Sipariş Verildi',
  order_cancelled: 'Sipariş İptal',
  order_refunded: 'Sipariş İade',
  stock_adjustment: 'Stok Düzeltme',
  csv_import: 'CSV İçe Aktarma',
  product_created: 'Ürün Oluşturuldu',
};

export function getReasonLabel(reason: string): string {
  return REASONS[reason] ?? reason;
}

/**
 * Record a stock change to Firestore 'stockMovements' collection.
 * No-op when oldStock === newStock. Fire-and-forget — failures are logged
 * but never thrown to the caller.
 */
export async function recordStockChange(
  productId: string,
  sellerId: string,
  oldStock: number,
  newStock: number,
  reason: string,
  userId: string,
  warehouseId?: string,
): Promise<void> {
  if (oldStock === newStock) return;
  try {
    await addDoc(collection(db, 'stockMovements'), {
      productId,
      sellerId: sellerId || '',
      oldStock,
      newStock,
      delta: newStock - oldStock,
      reason,
      userId: userId || 'system',
      warehouseId: warehouseId || '',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Non-blocking — stock recording failure must never fail the parent operation
    console.error('[stockMovement] Failed to record:', error);
  }
}

/**
 * Fetch stock movement history for a product, newest first.
 */
export async function getStockMovements(
  productId: string,
  maxResults = 50,
): Promise<StockMovement[]> {
  try {
    // Scoped to the signed-in seller (rules); equality-only, sorted here to avoid a composite index.
    const q = query(
      collection(db, 'stockMovements'),
      where('sellerId', '==', auth.currentUser?.uid ?? ''),
      where('productId', '==', productId),
    );
    const snapshot = await getDocs(q);
    const millis = (m: any) => m.createdAt?.toMillis?.() ?? 0;
    return (snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as StockMovement[])
      .sort((a, b) => millis(b) - millis(a))
      .slice(0, maxResults);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `stockMovements/${productId}`);
    return [];
  }
}
