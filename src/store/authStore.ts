import { create } from 'zustand'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'buyer' | 'seller' | 'admin'
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

// Initialize auth listener
onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        useAuthStore.getState().setUser({
          id: firebaseUser.uid,
          name: data.name || firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          role: data.role || 'buyer'
        });
      } else {
        // Fallback for missing user document
        useAuthStore.getState().setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          role: 'buyer'
        });
      }
    } catch (err) {
      console.error("Error fetching user data", err);
      useAuthStore.getState().setUser(null);
    }
  } else {
    useAuthStore.getState().setUser(null);
  }
  useAuthStore.setState({ loading: false });
})
