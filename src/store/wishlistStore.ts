import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistStore {
  ids: Set<string>
  toggle: (productId: string, token: string | undefined, addToast: (msg: string, type?: 'success' | 'error' | 'info') => void) => Promise<void>
  fetchIds: (token: string) => Promise<void>
  isWished: (productId: string) => boolean
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: new Set<string>(),
      isWished: (productId) => get().ids.has(productId),
      fetchIds: async (token) => {
        try {
          const res = await fetch('/api/wishlist/ids', { headers: { Authorization: `Bearer ${token}` } })
          if (res.ok) {
            const { ids } = await res.json()
            set({ ids: new Set(ids) })
          }
        } catch { /* ignore */ }
      },
      toggle: async (productId, token, addToast) => {
        if (!token) { addToast('Favorilere eklemek için giriş yapın', 'error'); return }
        const wished = get().ids.has(productId)
        try {
          const res = await fetch(`/api/wishlist/${productId}`, {
            method: wished ? 'DELETE' : 'POST',
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            set((state) => {
              const next = new Set(state.ids)
              wished ? next.delete(productId) : next.add(productId)
              return { ids: next }
            })
            addToast(wished ? 'Favorilerden kaldırıldı' : 'Favorilere eklendi', 'success')
          }
        } catch {
          addToast('İşlem başarısız', 'error')
        }
      },
    }),
    {
      name: 'mercora-wishlist',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          const parsed = JSON.parse(str)
          return { ...parsed, state: { ...parsed.state, ids: new Set(parsed.state.ids ?? []) } }
        },
        setItem: (name, value) => {
          const toStore = { ...value, state: { ...value.state, ids: Array.from(value.state.ids) } }
          localStorage.setItem(name, JSON.stringify(toStore))
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)
