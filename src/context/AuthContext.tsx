import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { notifyAdmins } from '../services/notificationService';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
            const userData = userDoc.data() as UserProfile;
            // Firebase Auth photoURL'i Firestore'da yoksa birleştir (Google OAuth gibi)
            if (fUser.photoURL && !userData.photoURL) {
              userData.photoURL = fUser.photoURL;
            }
            setUser(userData);
          } else {
            // Initialize new user profile
            const isOwner = fUser.email === 'ozyslr@gmail.com';
            const newUser: UserProfile = {
              id: fUser.uid,
              name: fUser.displayName || 'New User',
              email: fUser.email || '',
              photoURL: fUser.photoURL || '',
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
            notifyAdmins(
              'admin_alert',
              'Yeni Üye Kaydı',
              `${newUser.name} (${newUser.email}) sisteme kaydoldu.`,
              '/admin',
            ).catch(() => {});
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

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = async (email: string, name: string, password: string) => {
    const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(fbUser, { displayName: name });
    const isOwner = email === 'ozyslr@gmail.com';
    const newUser: UserProfile = {
      id: fbUser.uid,
      name,
      email,
      role: (isOwner ? 'admin' : 'buyer') as UserRole,
      country: 'TR',
      currency: 'TRY',
      spentTotal: 0,
      lastLogin: new Date().toISOString(),
      orders: [],
      savedItems: [],
      preferences: { newsletter: true, personalizedDeals: true, pushNotifications: false }
    };
    await setDoc(doc(db, 'users', fbUser.uid), newUser);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!auth.currentUser) return;
    const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (snap.exists()) {
      setUser({ id: snap.id, ...snap.data() } as UserProfile);
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, loginWithEmail, registerWithEmail, logout, refreshUser }}>
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
