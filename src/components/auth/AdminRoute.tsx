import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { AdminRole } from '@/types';

interface AdminRouteProps {
  children: ReactNode;
  /** If set, restricts access to a specific admin sub-role. super-admin bypasses. */
  requiredRole?: AdminRole;
}

/**
 * Client-side admin access control gate (defense-in-depth).
 *
 * - Non-admins (buyer/seller/anonymous) are redirected to '/' with a notice.
 * - Admins with a non-matching requiredRole are redirected (super-admin sees all).
 * - While auth is loading, renders nothing (no false-negative bounce).
 *
 * The real security boundary is the server verifyAdmin + Firestore rules.
 */
export function AdminRoute({ children, requiredRole }: AdminRouteProps) {
  const { user, adminRole, loading } = useAuth();

  // Avoid false-negative redirect while Firebase Auth is resolving
  if (loading) {
    return null;
  }

  // Non-admin: redirect home with notice
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace state={{ notice: 'Bu sayfaya erişim yetkiniz yok.' }} />;
  }

  // Sub-role gate (super-admin sees all)
  if (requiredRole && adminRole !== 'super-admin' && adminRole !== requiredRole) {
    return <Navigate to="/" replace state={{ notice: 'Bu sayfaya erişim yetkiniz yok.' }} />;
  }

  return <>{children}</>;
}
