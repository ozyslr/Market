import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { CartItem, getCart, saveCart, clearCart as clearCartFromFirestore } from '../services/cartService';

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
  const { firebaseUser } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(false);

  // Load cart from Firestore when user logs in
  useEffect(() => {
    if (firebaseUser) {
      isInitialLoad.current = true;
      getCart(firebaseUser.uid).then(firestoreItems => {
        setItems(firestoreItems);
        isInitialLoad.current = false;
      });
    } else {
      setItems([]);
    }
  }, [firebaseUser]);

  // Debounced save to Firestore on items change
  useEffect(() => {
    if (!firebaseUser || isInitialLoad.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (items.length === 0) {
        clearCartFromFirestore(firebaseUser.uid);
      } else {
        saveCart(firebaseUser.uid, items);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [items, firebaseUser]);

  const matchItem = (i: CartItem, productId: string, variantId?: string) =>
    i.productId === productId && (i.variantId ?? '') === (variantId ?? '');

  const addItem = (productId: string, quantity = 1, variantId?: string) => {
    setItems(prev => {
      const existing = prev.find(i => matchItem(i, productId, variantId));
      if (existing) {
        return prev.map(i =>
          matchItem(i, productId, variantId) ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { productId, variantId, quantity, addedAt: new Date().toISOString() }];
    });
  };

  const removeItem = (productId: string, variantId?: string) => {
    setItems(prev => prev.filter(i => !matchItem(i, productId, variantId)));
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity < 1) return;
    setItems(prev =>
      prev.map(i => (matchItem(i, productId, variantId) ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    if (firebaseUser) {
      clearCartFromFirestore(firebaseUser.uid);
    }
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount }}>
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
