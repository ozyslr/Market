import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  loading: false,
  addItem: async () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  total: 0,
  itemCount: 0,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const cartRef = doc(db, 'carts', user.id);
    const unsub = onSnapshot(cartRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setItems(data.items || []);
      } else {
        setItems([]);
      }
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const saveCart = async (newItems: CartItem[]) => {
    if (!user) return;
    await setDoc(doc(db, 'carts', user.id), {
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  };

  const addItem = (item: CartItem) => {
    const existing = items.find(i => i.productId === item.productId);
    let newItems: CartItem[];
    if (existing) {
      newItems = items.map(i =>
        i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i
      );
    } else {
      newItems = [...items, item];
    }
    setItems(newItems);
    saveCart(newItems);
  };

  const removeItem = (productId: string) => {
    const newItems = items.filter(i => i.productId !== productId);
    setItems(newItems);
    saveCart(newItems);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    const newItems = items.map(i =>
      i.productId === productId ? { ...i, quantity } : i
    );
    setItems(newItems);
    saveCart(newItems);
  };

  const clearCart = () => {
    setItems([]);
    if (user) {
      setDoc(doc(db, 'carts', user.id), { items: [], updatedAt: new Date().toISOString() });
    }
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
