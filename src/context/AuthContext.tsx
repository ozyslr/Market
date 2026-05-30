import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
          } else {
            // Initialize new user profile
            const isOwner = fUser.email === 'ozyslr@gmail.com';
            const newUser: UserProfile = {
              id: fUser.uid,
              name: fUser.displayName || 'New User',
              email: fUser.email || '',
              role: (isOwner ? 'admin' : 'buyer') as UserRole,
              country: 'UK', // Default
              currency: 'GBP',
              spentTotal: 0,
              lastLogin: new Date().toISOString(),
              orders: [],
              savedItems: [],
              preferences: {
                newsletter: true,
                personalizedDeals: true,
                pushNotifications: false
              }
            };
            await setDoc(doc(db, 'users', fUser.uid), newUser);
            setUser(newUser);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          handleFirestoreError(error, OperationType.WRITE, `users/${fUser?.uid}`);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
       console.error("Login Error:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
       console.error("Logout Error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
