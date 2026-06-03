/**
 * API Key Management Service
 *
 * Seller REST API authentication via API keys.
 * Keys are scoped per-seller with configurable permissions.
 *
 * SECURITY: Hash computed server-side only — never hash API keys in browser code.
 * The SHA-256 hash is computed on the server via POST /api/v1/keys.
 * Only the hash (keyHash) is stored in Firestore; rawKey is returned once and never persisted.
 */

import { collection, doc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { auth } from '@/lib/firebase';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ApiKeyPermission =
  | 'products:read'
  | 'products:write'
  | 'orders:read'
  | 'orders:write'
  | 'inventory:read'
  | 'inventory:write'
  | 'pricing:read'
  | 'pricing:write';

export const ALL_PERMISSIONS: ApiKeyPermission[] = [
  'products:read',
  'products:write',
  'orders:read',
  'orders:write',
  'inventory:read',
  'inventory:write',
  'pricing:read',
  'pricing:write',
];

export interface ApiKey {
  id: string;
  sellerId: string;
  /** Human-readable name */
  name: string;
  /** Key prefix for display (first 10 chars) */
  keyPrefix: string;
  /** Active permissions */
  permissions: ApiKeyPermission[];
  /** Whether the key is active */
  isActive: boolean;
  /** Last used timestamp */
  lastUsedAt?: string;
  /** Total API calls made with this key */
  usageCount: number;
  createdAt: string;
}

export interface ApiKeyValidation {
  valid: boolean;
  sellerId?: string;
  permissions?: ApiKeyPermission[];
  error?: string;
}

const COL = 'apiKeys';

// ─── CRUD ───────────────────────────────────────────────────────────────────

/**
 * Create a new API key.
 * Calls the server-side POST /api/v1/keys endpoint which:
 *   1. Generates rawKey = 'bo_' + randomBytes(32).toString('hex') securely
 *   2. Computes SHA-256 hash server-side
 *   3. Stores only the hash in Firestore
 *   4. Returns { rawKey, keyId } — rawKey is returned ONCE and never stored
 *
 * The returned rawKey MUST be shown to the user immediately and never persisted
 * to Firestore, localStorage, or sessionStorage.
 */
export async function createApiKey(
  name: string,
  permissions: ApiKeyPermission[],
): Promise<{ rawKey: string; keyId: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Kullanıcı oturumu bulunamadı.');

  const idToken = await currentUser.getIdToken();

  const response = await fetch('/api/v1/keys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ name, permissions }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Anahtar oluşturma başarısız.' }));
    throw new Error(err.error || 'Anahtar oluşturma başarısız.');
  }

  const data = await response.json();
  return { rawKey: data.rawKey as string, keyId: data.keyId as string };
}

export async function getApiKeys(sellerId: string): Promise<ApiKey[]> {
  try {
    const q = query(collection(db, COL), where('sellerId', '==', sellerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        sellerId: data.sellerId,
        name: data.name,
        keyPrefix: data.keyPrefix || 'bo_****',
        permissions: data.permissions || [],
        isActive: data.isActive ?? true,
        lastUsedAt: data.lastUsedAt ?? undefined,
        usageCount: data.usageCount || 0,
        createdAt: data.createdAt,
      } as ApiKey;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function revokeApiKey(sellerId: string, keyId: string): Promise<void> {
  try {
    // Verify ownership
    const snap = await getDocs(query(collection(db, COL), where('sellerId', '==', sellerId)));
    const owns = snap.docs.some((d) => d.id === keyId);
    if (!owns) throw new Error('Bu API anahtarı size ait değil.');
    await updateDoc(doc(db, COL, keyId), { isActive: false });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${keyId}`);
    throw error;
  }
}
