import { doc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface StockLocation {
  productId: string;
  warehouse: string;
  aisle: string;
  shelf: string;
  quantity: number;
  updatedAt: string;
}

export interface StockMovement {
  id?: string;
  productId: string;
  type: 'in' | 'out' | 'transfer';
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  note: string;
  timestamp: string;
}

export async function setStockLocation(location: Omit<StockLocation, 'updatedAt'>): Promise<void> {
  const ref = doc(db, 'stockLocations', location.productId);
  await updateDoc(ref, { ...location, updatedAt: new Date().toISOString() });
}

export async function getStockLocation(productId: string): Promise<StockLocation | null> {
  try {
    const ref = doc(db, 'stockLocations', productId);
    const snap = await (await import('firebase/firestore')).getDoc(ref);
    if (snap.exists()) return snap.data() as StockLocation;
  } catch {}
  return null;
}

export async function recordStockMovement(movement: Omit<StockMovement, 'id' | 'timestamp'>): Promise<void> {
  const mov: any = { ...movement, timestamp: new Date().toISOString() };
  await addDoc(collection(db, 'stockMovements'), mov);
}

export async function getStockMovements(productId: string): Promise<StockMovement[]> {
  try {
    const q = query(collection(db, 'stockMovements'), where('productId', '==', productId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockMovement));
  } catch { return []; }
}

export async function checkLowStock(storeId: string, threshold = 5): Promise<Array<{ productId: string; title: string; stock: number }>> {
  try {
    const q = query(collection(db, 'products'), where('storeId', '==', storeId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ productId: d.id, title: (d.data() as any).title || '', stock: (d.data() as any).stock || 0 }))
      .filter((p) => p.stock <= threshold);
  } catch { return []; }
}
