import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signOut,
  signInAnonymously,
  linkWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole, AdminRole } from '../types';
import { notifyAdmins } from '../services/notificationService';
import { recordEvent } from '../services/sellerOnboardingService';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAnonymous: boolean;
  loading: boolean;
  adminRole: AdminRole | null;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  upgradeAnonymousAccount: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);

  const isAnonymous = firebaseUser?.isAnonymous ?? false;

  useEffect(() => {
    let lastUid: string | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      // Skip full profile fetch on token-refresh re-fire for the same user
      if (fUser && fUser.uid === lastUid && !fUser.isAnonymous) {
        // Token refreshed — update firebaseUser ref but skip Firestore read
        setFirebaseUser(fUser);
        try {
          const idTokenResult = await fUser.getIdTokenResult();
          setAdminRole((idTokenResult.claims.adminRole as AdminRole) || null);
        } catch (claimErr) {
          console.error('Error reading token claims:', claimErr);
        }
        return;
      }
      lastUid = fUser?.uid ?? null;

      setFirebaseUser(fUser);
      if (fUser) {
        if (fUser.isAnonymous) {
          setUser(null);
          setAdminRole(null);
          setLoading(false);
          return;
        }
        let resolvedUser: UserProfile | null = null;
        try {
          const userDoc = await getDoc(doc(db, 'users', fUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            // Firebase Auth photoURL'i Firestore'da yoksa birleştir (Google OAuth gibi)
            if (fUser.photoURL && !userData.photoURL) {
              userData.photoURL = fUser.photoURL;
            }
            resolvedUser = userData;
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
                pushNotifications: false,
              },
            };
            await setDoc(doc(db, 'users', fUser.uid), newUser);
            resolvedUser = newUser;
            setUser(newUser);
            notifyAdmins(
              'admin_alert',
              'Yeni Üye Kaydı',
              `${newUser.name} (${newUser.email}) sisteme kaydoldu.`,
              '/admin',
            ).catch(() => {});
          }
          // Record seller_first_login for funnel instrumentation (fire-and-forget)
          if (resolvedUser && resolvedUser.role === 'seller') {
            recordEvent(resolvedUser.id, 'seller_first_login').catch(() => {});
          }
          // Read adminRole from Firebase custom claims
          try {
            const idTokenResult = await fUser.getIdTokenResult();
            const claims = idTokenResult.claims;
            // Role claim takes precedence over profile-derived role (avoid regressions)
            if (claims.role && resolvedUser && claims.role !== resolvedUser.role) {
              resolvedUser.role = claims.role as UserRole;
              setUser({ ...resolvedUser });
            }
            setAdminRole((claims.adminRole as AdminRole) || null);
          } catch (claimErr) {
            console.error('Error reading token claims:', claimErr);
            setAdminRole(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          handleFirestoreError(error, OperationType.WRITE, `users/${fUser?.uid}`);
        }
      } else {
        setUser(null);
        setAdminRole(null);
        setLoading(false);
        // Sign in anonymously so guests can browse; fire-and-forget
        signInAnonymously(auth).catch((err) => {
          console.warn('[auth] Anonymous sign-in failed:', err.message);
        });
        return;
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
      console.error('Login Error:', error);
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
      preferences: { newsletter: true, personalizedDeals: true, pushNotifications: false },
    };
    await setDoc(doc(db, 'users', fbUser.uid), newUser);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!auth.currentUser) return;
    const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (snap.exists()) {
      setUser({ id: snap.id, ...snap.data() } as UserProfile);
    }
    // Refresh adminRole from claims as well
    try {
      const idTokenResult = await auth.currentUser.getIdTokenResult();
      setAdminRole((idTokenResult.claims.adminRole as AdminRole) || null);
    } catch (claimErr) {
      console.error('Error refreshing token claims:', claimErr);
    }
  };

  /**
   * Upgrade an anonymous Firebase Auth account to a permanent email/password account.
   * Uses linkWithCredential to preserve the anonymous user's UID and all associated data.
   */
  const upgradeAnonymousAccount = async (email: string, password: string): Promise<void> => {
    const fbUser = auth.currentUser;
    if (!fbUser) {
      throw new Error('Oturum bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.');
    }
    if (!fbUser.isAnonymous) {
      throw new Error('Bu hesap zaten kalıcı bir hesap. Yükseltme gerekmiyor.');
    }

    const credential = EmailAuthProvider.credential(email, password);

    try {
      const result = await linkWithCredential(fbUser, credential);
      // Update Firestore profile with the email
      try {
        await updateDoc(doc(db, 'users', result.user.uid), { email });
      } catch (profileErr) {
        // Firestore update is best-effort; the auth upgrade already succeeded
        console.warn('[auth] Firestore email update after upgrade failed:', profileErr);
      }
      // Refresh the now-authenticated user
      await refreshUser();
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('Bu e-posta zaten kullanılıyor. Giriş yapmayı dene.', { cause: err });
      }
      if (err.code === 'auth/credential-already-in-use') {
        throw new Error('Bu hesap zaten başka bir kullanıcıya bağlı. Giriş yapmayı dene.', {
          cause: err,
        });
      }
      if (err.code === 'auth/weak-password') {
        throw new Error('Şifre en az 6 karakter olmalıdır.', { cause: err });
      }
      if (err.code === 'auth/invalid-email') {
        throw new Error('Geçerli bir e-posta adresi girin.', { cause: err });
      }
      // If the anonymous account was deleted (rare race condition), fall back to
      // creating a new account so the user still has their order email on record.
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/user-token-expired' ||
        err.code === 'auth/user-disabled'
      ) {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          // Firestore profile will be created by onAuthStateChanged
          await refreshUser();
          return;
        } catch (fallbackErr: any) {
          throw new Error('Oturum süren doldu. Lütfen kaydol.', { cause: fallbackErr });
        }
      }
      throw new Error('Hesap oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.', {
        cause: err,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAnonymous,
        loading,
        adminRole,
        login,
        loginWithEmail,
        registerWithEmail,
        logout,
        refreshUser,
        upgradeAnonymousAccount,
      }}
    >
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
