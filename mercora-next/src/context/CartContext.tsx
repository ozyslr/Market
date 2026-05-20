'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

interface CartItem {
  productId: string;
  quantity: number;
  variantId?: string;
  price?: number;
  title?: string;
  image?: string;
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

function loadLocalCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('mercora-cart');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('mercora-cart', JSON.stringify(items));
  } catch { /* noop */ }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const initialized = useRef(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setItems(loadLocalCart());
    }
  }, []);

  // Persist to localStorage on changes
  useEffect(() => {
    if (initialized.current) {
      saveLocalCart(items);
    }
  }, [items]);

  const matchItem = (i: CartItem, productId: string, variantId?: string) =>
    i.productId === productId && (i.variantId ?? '') === (variantId ?? '');

  const addItem = (productId: string, quantity = 1, variantId?: string) => {
    setItems(prev => {
      const existing = prev.find(i => matchItem(i, productId, variantId));
      if (existing) {
        return prev.map(i =>
          matchItem(i, productId, variantId)
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { productId, quantity, variantId }];
    });
  };

  const removeItem = (productId: string, variantId?: string) => {
    setItems(prev => prev.filter(i => !matchItem(i, productId, variantId)));
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }
    setItems(prev =>
      prev.map(i => (matchItem(i, productId, variantId) ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

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
