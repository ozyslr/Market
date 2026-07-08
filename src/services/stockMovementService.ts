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
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

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
    const q = query(
      collection(db, 'stockMovements'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc'),
      limit(maxResults),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as StockMovement[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `stockMovements/${productId}`);
    return [];
  }
}
