import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { Warehouse, WarehouseStock } from '../types';

/**
 * Create a new warehouse for a seller.
 * If isDefault is true, first unsets any existing default for this seller.
 */
export async function createWarehouse(
  sellerId: string,
  data: Omit<Warehouse, 'id' | 'sellerId' | 'createdAt'>,
): Promise<string> {
  try {
    if (data.isDefault) {
      await unsetOtherDefaults(sellerId);
    }
    const docRef = await addDoc(collection(db, 'warehouses'), {
      sellerId,
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'warehouses');
    throw error;
  }
}

/**
 * Get all warehouses for a seller, newest first.
 */
export async function getWarehouses(sellerId: string): Promise<Warehouse[]> {
  try {
    const q = query(
      collection(db, 'warehouses'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Warehouse);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `warehouses/${sellerId}`);
    return [];
  }
}

/**
 * Update a warehouse.
 * If isDefault is being set to true, first unsets any existing default for the seller.
 */
export async function updateWarehouse(id: string, data: Partial<Warehouse>): Promise<void> {
  try {
    if (data.isDefault) {
      // Need the sellerId to unset other defaults
      const snap = await getDoc(doc(db, 'warehouses', id));
      if (snap.exists()) {
        const existing = snap.data() as Warehouse;
        await unsetOtherDefaults(existing.sellerId);
      }
    }
    await updateDoc(doc(db, 'warehouses', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `warehouses/${id}`);
    throw error;
  }
}

/**
 * Delete a warehouse and all its warehouseStock entries.
 */
export async function deleteWarehouse(id: string): Promise<void> {
  try {
    // Delete the warehouse doc
    await deleteDoc(doc(db, 'warehouses', id));

    // Delete all warehouseStock docs for this warehouse
    const stockQ = query(collection(db, 'warehouseStock'), where('warehouseId', '==', id));
    const stockSnap = await getDocs(stockQ);
    if (stockSnap.size > 0) {
      const batch = writeBatch(db);
      stockSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `warehouses/${id}`);
    throw error;
  }
}

/**
 * Get the default warehouse for a seller, or null if none set.
 */
export async function getDefaultWarehouse(sellerId: string): Promise<Warehouse | null> {
  try {
    const q = query(
      collection(db, 'warehouses'),
      where('sellerId', '==', sellerId),
      where('isDefault', '==', true),
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as Warehouse;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `warehouses/default/${sellerId}`);
    return null;
  }
}

/**
 * Set or update warehouse stock for a given product.
 * Uses `warehouseStock/{warehouseId}_{productId}` as the doc ID for idempotent writes.
 */
export async function setWarehouseStock(
  warehouseId: string,
  productId: string,
  quantity: number,
  lowStockThreshold?: number,
): Promise<void> {
  try {
    const docId = `${warehouseId}_${productId}`;
    const data: Record<string, any> = {
      warehouseId,
      productId,
      quantity,
      lowStockThreshold: lowStockThreshold ?? 5,
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'warehouseStock', docId), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `warehouseStock/${warehouseId}_${productId}`);
    throw error;
  }
}

/**
 * Get all warehouse stock entries for a given product.
 */
export async function getWarehouseStock(productId: string): Promise<WarehouseStock[]> {
  try {
    const q = query(collection(db, 'warehouseStock'), where('productId', '==', productId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as WarehouseStock);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `warehouseStock/${productId}`);
    return [];
  }
}

/**
 * Get the total stock across all warehouses for a given product.
 * Returns the sum and a per-warehouse breakdown.
 */
export async function getTotalStock(
  productId: string,
): Promise<{ totalQuantity: number; breakdown: WarehouseStock[] }> {
  const breakdown = await getWarehouseStock(productId);
  const totalQuantity = breakdown.reduce((sum, ws) => sum + (ws.quantity ?? 0), 0);
  return { totalQuantity, breakdown };
}

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Unset isDefault on all warehouses belonging to a seller.
 * Called before setting a new default to ensure only one default exists.
 */
async function unsetOtherDefaults(sellerId: string): Promise<void> {
  const q = query(
    collection(db, 'warehouses'),
    where('sellerId', '==', sellerId),
    where('isDefault', '==', true),
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) =>
    batch.update(d.ref, { isDefault: false, updatedAt: serverTimestamp() }),
  );
  await batch.commit();
}
