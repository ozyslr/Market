// server/lib/sellerAccess.ts
// Single source of truth for turning an approved applicant into a seller.
//
// Firestore rules authorise seller writes via custom claims
// (request.auth.token.role == 'seller' && request.auth.token.sellerId), so every
// approval path MUST go through grantSellerAccess — updating only Firestore
// docs leaves the seller locked out (permission-denied on product create).
//
// Convention: sellerId === Firebase Auth uid (products.sellerId, sellers/{uid}).
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

export interface GrantSellerAccessResult {
  uid: string;
  /** false when the user is an admin — admins keep their role (never downgraded). */
  claimsUpdated: boolean;
}

export async function grantSellerAccess(
  adminAuth: Auth,
  adminDb: Firestore,
  uid: string,
): Promise<GrantSellerAccessResult> {
  if (!uid || typeof uid !== 'string') throw new Error('grantSellerAccess: uid is required');

  const user = await adminAuth.getUser(uid);
  const existing = (user.customClaims ?? {}) as Record<string, unknown>;

  let claimsUpdated = false;
  if (existing.role !== 'admin') {
    await adminAuth.setCustomUserClaims(uid, { role: 'seller', sellerId: uid });
    claimsUpdated = true;
  }

  const now = new Date().toISOString();
  const batch = adminDb.batch();
  if (existing.role !== 'admin') {
    batch.set(adminDb.collection('users').doc(uid), { role: 'seller' }, { merge: true });
  }
  batch.set(
    adminDb.collection('sellers').doc(uid),
    { userId: uid, kycStatus: 'verified', isVerified: true, updatedAt: now },
    { merge: true },
  );
  await batch.commit();

  return { uid, claimsUpdated };
}

/**
 * Resolves a seller application from either its doc id (`app-<ts>`) or the
 * applicant's uid (admin seller pages route by uid). Returns the newest match.
 */
export async function findApplicationRef(adminDb: Firestore, idOrUid: string) {
  const direct = await adminDb.collection('sellerApplications').doc(idOrUid).get();
  if (direct.exists) return direct;
  const byUser = await adminDb
    .collection('sellerApplications')
    .where('userId', '==', idOrUid)
    .get();
  if (byUser.empty) return null;
  return byUser.docs.sort((a, b) =>
    String(b.data().createdAt ?? '').localeCompare(String(a.data().createdAt ?? '')),
  )[0];
}

/** Allowed custom-claim shape. Anything else in a request body is dropped. */
export type ClaimRole = 'admin' | 'seller' | 'buyer';

export function buildClaims(
  uid: string,
  role: ClaimRole,
  adminRole?: string,
): Record<string, string> {
  if (role === 'seller') return { role, sellerId: uid };
  if (role === 'admin') return adminRole ? { role, adminRole } : { role };
  return { role };
}
