import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ModeratorRouteProps {
  children: ReactNode;
}

/**
 * Client-side moderator access control gate.
 *
 * - Non-moderator/non-admin users are redirected to '/' with a notice.
 * - Admins can access all moderator pages (super-admin bypass).
 * - While auth is loading, renders nothing (no false-negative bounce).
 *
 * The real security boundary is the server verifyAdmin/verifyFirebaseToken + Firestore rules.
 */
export function ModeratorRoute({ children }: ModeratorRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  // Admin sees everything; moderator sees moderator pages
  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    return (
      <Navigate to="/" replace state={{ notice: 'Bu sayfaya erişim yetkiniz yok.' }} />
    );
  }

  return <>{children}</>;
}
