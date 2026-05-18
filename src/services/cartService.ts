import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  addedAt: string;
}

export async function getCart(userId: string): Promise<CartItem[]> {
  try {
    const snap = await getDoc(doc(db, 'carts', userId));
    return snap.exists() ? (snap.data().items as CartItem[]) : [];
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `carts/${userId}`);
    return [];
  }
}

export async function saveCart(userId: string, items: CartItem[]): Promise<void> {
  try {
    const cleanItems = items.map(({ variantId, ...rest }) =>
      variantId !== undefined ? { ...rest, variantId } : rest
    );
    await setDoc(doc(db, 'carts', userId), {
      items: cleanItems,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `carts/${userId}`);
  }
}

export async function clearCart(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'carts', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `carts/${userId}`);
  }
}
