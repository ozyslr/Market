import { create } from 'zustand'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'buyer' | 'seller' | 'admin'
  token: string
}

interface AuthStore {
  user: AuthUser | null
  loading: boolean
  setUser: (user: AuthUser | null) => void
  logout: () => Promise<void>
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  logout: async () => {
    await signOut(auth);
    set({ user: null });
  },
  isAuthenticated: () => get().user !== null,
}))

// Firebase auth listener — syncs with backend to get custom JWT + role
onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    try {
      const res = await fetch('/api/auth/firebase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        useAuthStore.getState().setUser(data.user)
      } else {
        useAuthStore.getState().setUser(null)
      }
    } catch {
      useAuthStore.getState().setUser(null)
    }
  } else {
    useAuthStore.getState().setUser(null)
  }
  useAuthStore.setState({ loading: false })
})
