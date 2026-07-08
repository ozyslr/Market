import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  CartItem,
  getCart,
  saveCart,
  clearCart as clearCartFromFirestore,
} from '../services/cartService';

const LOCAL_CART_KEY = 'mcr_guest_cart';

interface LocalCartData {
  items: { productId: string; variantId?: string; quantity: number }[];
  updatedAt: string;
}

/**
 * Merge guest (localStorage) cart with authenticated (Firestore) cart.
 * Deduplicates by productId+variantId, sums quantities.
 * Firestore items take priority on conflict (DB record preserved).
 */
function mergeCarts(guestItems: CartItem[], firestoreItems: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>();

  // Add Firestore items first (they take priority)
  for (const item of firestoreItems) {
    const key = `${item.productId}::${item.variantId ?? ''}`;
    merged.set(key, { ...item });
  }

  // Add guest items, summing quantities for duplicates
  for (const item of guestItems) {
    const key = `${item.productId}::${item.variantId ?? ''}`;
    if (merged.has(key)) {
      const existing = merged.get(key)!;
      merged.set(key, { ...existing, quantity: existing.quantity + item.quantity });
    } else {
      merged.set(key, { ...item });
    }
  }

  return Array.from(merged.values());
}

interface CartContextType {
  items: CartItem[];
  addItem: (productId: string, quantity?: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser, isAnonymous } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const firestoreDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localStorageDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(false);
  const prevIsAnonymous = useRef<boolean | null>(null);
  const hasMerged = useRef(false);

  // Load cart — localStorage for anonymous, Firestore for authenticated.
  // On anonymous→authenticated transition, merge carts.
  useEffect(() => {
    const wasAnonymous = prevIsAnonymous.current;
    prevIsAnonymous.current = isAnonymous;

    if (firebaseUser && !isAnonymous) {
      // ── Authenticated user ──────────────────────────────────────────
      if (wasAnonymous === true && !hasMerged.current) {
        // Transition: anonymous → authenticated — merge carts
        hasMerged.current = true;
        let guestItems: CartItem[] = [];
        try {
          const raw = localStorage.getItem(LOCAL_CART_KEY);
          if (raw) {
            const data: LocalCartData = JSON.parse(raw);
            guestItems = (data.items || []).map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
              addedAt: new Date().toISOString(),
            }));
          }
        } catch {
          /* ignore corrupt localStorage */
        }

        getCart(firebaseUser.uid)
          .then((firestoreItems) => {
            const merged = mergeCarts(guestItems, firestoreItems);
            setItems(merged);
            if (merged.length > 0) {
              saveCart(firebaseUser.uid, merged);
            }
            localStorage.removeItem(LOCAL_CART_KEY);
            isInitialLoad.current = false;
          })
          .catch(() => {
            // Firestore read failed — fall back to guest items
            if (guestItems.length > 0) {
              setItems(guestItems);
              saveCart(firebaseUser.uid, guestItems);
            }
            localStorage.removeItem(LOCAL_CART_KEY);
            isInitialLoad.current = false;
          });
      } else {
        // Normal authenticated load (or already merged)
        isInitialLoad.current = true;
        getCart(firebaseUser.uid)
          .then((firestoreItems) => {
            setItems(firestoreItems);
            isInitialLoad.current = false;
          })
          .catch(() => {
            isInitialLoad.current = false;
          });
      }
    } else if (isAnonymous) {
      // ── Anonymous user — restore from localStorage ──────────────────
      hasMerged.current = false;
      try {
        const raw = localStorage.getItem(LOCAL_CART_KEY);
        if (raw) {
          const data: LocalCartData = JSON.parse(raw);
          const restored: CartItem[] = (data.items || []).map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            addedAt: new Date().toISOString(),
          }));
          setItems(restored);
          // Clear after successful read to prevent stale restores on
          // subsequent mounts — the debounced save effect will re-persist.
          localStorage.removeItem(LOCAL_CART_KEY);
        } else {
          setItems([]);
        }
      } catch {
        setItems([]);
      }
    } else {
      // No user at all (brief loading state)
      setItems([]);
    }
  }, [firebaseUser, isAnonymous]);

  // Debounced save to Firestore on items change (authenticated only)
  useEffect(() => {
    if (!firebaseUser || isAnonymous || isInitialLoad.current) return;

    if (firestoreDebounceRef.current) clearTimeout(firestoreDebounceRef.current);
    firestoreDebounceRef.current = setTimeout(() => {
      if (items.length === 0) {
        clearCartFromFirestore(firebaseUser.uid);
      } else {
        saveCart(firebaseUser.uid, items);
      }
    }, 500);

    return () => {
      if (firestoreDebounceRef.current) clearTimeout(firestoreDebounceRef.current);
    };
  }, [items, firebaseUser, isAnonymous]);

  // Debounced save to localStorage on items change (anonymous only, 300ms)
  useEffect(() => {
    if (!isAnonymous || isInitialLoad.current) return;

    if (localStorageDebounceRef.current) clearTimeout(localStorageDebounceRef.current);
    localStorageDebounceRef.current = setTimeout(() => {
      const data: LocalCartData = {
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(data));
    }, 300);

    return () => {
      if (localStorageDebounceRef.current) clearTimeout(localStorageDebounceRef.current);
    };
  }, [items, isAnonymous]);

  const matchItem = (i: CartItem, productId: string, variantId?: string) =>
    i.productId === productId && (i.variantId ?? '') === (variantId ?? '');

  const addItem = (productId: string, quantity = 1, variantId?: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => matchItem(i, productId, variantId));
      if (existing) {
        return prev.map((i) =>
          matchItem(i, productId, variantId) ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...prev, { productId, variantId, quantity, addedAt: new Date().toISOString() }];
    });
  };

  const removeItem = (productId: string, variantId?: string) => {
    setItems((prev) => prev.filter((i) => !matchItem(i, productId, variantId)));
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => (matchItem(i, productId, variantId) ? { ...i, quantity } : i)),
    );
  };

  const clearCart = () => {
    setItems([]);
    if (firebaseUser) {
      clearCartFromFirestore(firebaseUser.uid);
    }
    localStorage.removeItem(LOCAL_CART_KEY);
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
