import { doc, getDoc, getDocs, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import type { Order } from '@/types/order';
import type { Product } from '@/types';
import type { CartItem } from './cartService';
import { saveCart } from './cartService';

export interface ReorderValidation {
  productId: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  available: boolean;
  reason?: string;
}

/**
 * Get the user's most recent completed order (delivered or paid).
 * Returns null if no completed orders exist.
 */
export async function getLastOrder(userId: string): Promise<Order | null> {
  try {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      where('status', 'in', ['delivered', 'paid']),
      orderBy('createdAt', 'desc'),
      limit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Order;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'orders');
    return null;
  }
}

/**
 * Validate which items from an order are still available for reorder.
 * Checks product existence, active/approved status, and stock.
 */
export async function validateReorderItems(order: Order): Promise<ReorderValidation[]> {
  const results: ReorderValidation[] = [];

  for (const item of order.items) {
    try {
      const snap = await getDoc(doc(db, 'products', item.productId));
      if (!snap.exists()) {
        results.push({
          productId: item.productId,
          title: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          available: false,
          reason: 'Urun artik mevcut degil',
        });
        continue;
      }

      const product = snap.data() as Product;
      const isActive = product.isActive !== false;
      const isApproved = !product.status || product.status === 'approved';
      const inStock = (product.stock ?? 0) > 0;

      if (!isActive || !isApproved) {
        results.push({
          productId: item.productId,
          title: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          available: false,
          reason: 'Urun artik satista degil',
        });
      } else if (!inStock) {
        results.push({
          productId: item.productId,
          title: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          available: false,
          reason: 'Stokta yok',
        });
      } else {
        results.push({
          productId: item.productId,
          title: item.name,
          image: item.image,
          price: product.price,
          quantity: item.quantity,
          available: true,
        });
      }
    } catch {
      results.push({
        productId: item.productId,
        title: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        available: false,
        reason: 'Dogrulama hatasi',
      });
    }
  }

  return results;
}

/**
 * Add valid (available) items from an order to the user's cart.
 * Merges with existing cart items, incrementing quantities for duplicates.
 * Returns counts of added vs skipped items.
 */
export async function reorderToCart(
  userId: string,
  orderId: string,
): Promise<{ added: number; skipped: number }> {
  try {
    const orderSnap = await getDoc(doc(db, 'orders', orderId));
    if (!orderSnap.exists()) throw new Error('Siparis bulunamadi');
    const order = { id: orderSnap.id, ...orderSnap.data() } as Order;

    const validation = await validateReorderItems(order);
    const available = validation.filter((v) => v.available);

    // Get existing cart from Firestore
    const cartSnap = await getDoc(doc(db, 'carts', userId));
    const existingItems: CartItem[] = cartSnap.exists()
      ? ((cartSnap.data().items as CartItem[]) ?? [])
      : [];

    // Merge available items into existing cart
    for (const item of available) {
      const existing = existingItems.find((i) => i.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        existingItems.push({
          productId: item.productId,
          quantity: item.quantity,
          addedAt: new Date().toISOString(),
        });
      }
    }

    // Persist merged cart
    await saveCart(userId, existingItems);

    return {
      added: available.length,
      skipped: validation.length - available.length,
    };
  } catch (error) {
    console.error('[reorderService] reorderToCart error:', error);
    throw error;
  }
}
