import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface SellerRouteProps {
  children: ReactNode;
}

/**
 * Client-side seller access control gate (defense-in-depth).
 *
 * - Non-sellers (buyer/anonymous) are redirected to /sell to apply.
 * - While auth is loading, renders nothing (no false-negative bounce).
 *
 * The real security boundary is the server verifySeller + Firestore rules.
 */
export function SellerRoute({ children }: SellerRouteProps) {
  const { user, loading } = useAuth();

  // Avoid false-negative redirect while Firebase Auth is resolving
  if (loading) {
    return null;
  }

  // Must be logged in and have seller role
  if (!user || user.role !== 'seller') {
    return (
      <Navigate
        to="/sell"
        replace
        state={{ notice: 'Satıcı paneline erişmek için satıcı başvurusu yapmalısınız.' }}
      />
    );
  }

  return <>{children}</>;
}
