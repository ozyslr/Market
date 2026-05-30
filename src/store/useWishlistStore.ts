import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

interface WishlistStore {
  items: Product[];
  toggleItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
  getCount: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      toggleItem: (product) => {
        set((state) => {
          const exists = state.items.some((p) => p.id === product.id);
          if (exists) {
            return { items: state.items.filter((p) => p.id !== product.id) };
          }
          return { items: [product, ...state.items] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((p) => p.id !== productId),
        }));
      },

      clearWishlist: () => set({ items: [] }),

      isInWishlist: (productId) => get().items.some((p) => p.id === productId),

      getCount: () => get().items.length,
    }),
    {
      name: 'mercora-wishlist-storage',
    }
  )
);
