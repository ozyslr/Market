import { create } from 'zustand';

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  total: 0,
  addItem: (item) =>
    set((s) => {
      const existing = s.items.find((i) => i.id === item.id);
      const items = existing
        ? s.items.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...s.items, { ...item, quantity: 1 }];
      return { items, total: items.reduce((t, i) => t + i.price * i.quantity, 0) };
    }),
  removeItem: (id) =>
    set((s) => {
      const items = s.items.filter((i) => i.id !== id);
      return { items, total: items.reduce((t, i) => t + i.price * i.quantity, 0) };
    }),
  clearCart: () => set({ items: [], total: 0 }),
}));
