import { create } from 'zustand'
import type { Product } from '@/types'

const MAX = 4

interface CompareStore {
  products: Product[]
  add: (product: Product) => boolean
  remove: (productId: string) => void
  clear: () => void
  has: (productId: string) => boolean
}

export const useCompareStore = create<CompareStore>((set, get) => ({
  products: [],
  has: (productId) => get().products.some(p => p.id === productId),
  add: (product) => {
    if (get().products.length >= MAX) return false
    if (get().has(product.id)) return true
    set(s => ({ products: [...s.products, product] }))
    return true
  },
  remove: (productId) => set(s => ({ products: s.products.filter(p => p.id !== productId) })),
  clear: () => set({ products: [] }),
}))
