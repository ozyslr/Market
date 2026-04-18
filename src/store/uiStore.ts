import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface UIStore {
  darkMode: boolean
  toasts: Toast[]
  toggleDarkMode: () => void
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      darkMode: false,
      toasts: [],
      toggleDarkMode: () =>
        set((state) => {
          const next = !state.darkMode
          if (next) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
          return { darkMode: next }
        }),
      addToast: (message, type = 'success') => {
        const id = Math.random().toString(36).slice(2)
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
        setTimeout(
          () =>
            set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
          3000
        )
      },
      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'mercora-ui',
      partialize: (state) => ({ darkMode: state.darkMode }),
    }
  )
)
