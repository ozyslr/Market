// src/services/sellerAccessService.ts
// Admin-only calls that change a user's Firebase custom claims.
// Firestore rules authorise by claims, so role changes MUST go through the
// server — writing users.role from the client only changes what the UI shows.
import { auth } from '@/lib/firebase';
import type { UserRole } from '@/types';

async function authedPost(url: string, body?: unknown): Promise<void> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Oturum bulunamadı');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `İstek başarısız (${res.status})`);
  }
}

/** Approves the user as a seller: claims {role:'seller', sellerId:uid} + profile + KYC flag. */
export function grantSellerAccess(uid: string): Promise<void> {
  return authedPost(`/api/admin/seller/${encodeURIComponent(uid)}/grant-access`);
}

/** Sets the user's role claim (and syncs users.role on the server). */
export function setUserRole(uid: string, role: UserRole): Promise<void> {
  return authedPost('/api/admin/set-claims', { uid, claims: { role } });
}
