/**
 * API Key Management Service
 *
 * Seller REST API authentication via API keys.
 * Keys are scoped per-seller with configurable permissions.
 */

import { collection, doc, getDocs, addDoc, deleteDoc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';

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
  'products:read', 'products:write',
  'orders:read', 'orders:write',
  'inventory:read', 'inventory:write',
  'pricing:read', 'pricing:write',
];

export interface ApiKey {
  id: string;
  sellerId: string;
  /** Human-readable name */
  name: string;
  /** The actual API key (only shown once at creation) */
  key: string;
  /** Key prefix for display (first 8 chars) */
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

// ─── Key Generation ─────────────────────────────────────────────────────────

function generateApiKey(): string {
  const prefix = 'bo_'; // Benim Olan prefix
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const random = Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}${random}`;
}

function hashKey(key: string): string {
  // Simple hash for storage (production: use SHA-256)
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const chr = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// ─── CRUD ───────────────────────────────────────────────────────────────────

export async function createApiKey(
  sellerId: string,
  name: string,
  permissions: ApiKeyPermission[],
): Promise<ApiKey> {
  try {
    const key = generateApiKey();
    const hashedKey = hashKey(key);

    const docData: Omit<ApiKey, 'id'> = {
      sellerId,
      name,
      key: hashedKey,
      keyPrefix: key.slice(0, 10),
      permissions,
      isActive: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };

    const ref = await addDoc(collection(db, COL), docData);

    // Return the raw key only at creation time
    return { id: ref.id, ...docData, key };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COL);
    throw error;
  }
}

export async function getApiKeys(sellerId: string): Promise<Omit<ApiKey, 'key'>[]> {
  try {
    const q = query(collection(db, COL), where('sellerId', '==', sellerId));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        sellerId: data.sellerId,
        name: data.name,
        keyPrefix: data.keyPrefix || (data.key as string)?.slice(0, 10) || 'bo_****',
        permissions: data.permissions || [],
        isActive: data.isActive ?? true,
        lastUsedAt: data.lastUsedAt,
        usageCount: data.usageCount || 0,
        createdAt: data.createdAt,
      } as Omit<ApiKey, 'key'>;
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
    const owns = snap.docs.some(d => d.id === keyId);
    if (!owns) throw new Error('Bu API anahtarı size ait değil.');
    await updateDoc(doc(db, COL, keyId), { isActive: false });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${keyId}`);
    throw error;
  }
}

export async function deleteApiKey(sellerId: string, keyId: string): Promise<void> {
  try {
    const snap = await getDocs(query(collection(db, COL), where('sellerId', '==', sellerId)));
    const owns = snap.docs.some(d => d.id === keyId);
    if (!owns) throw new Error('Bu API anahtarı size ait değil.');
    await deleteDoc(doc(db, COL, keyId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COL}/${keyId}`);
    throw error;
  }
}

// ─── Validation ─────────────────────────────────────────────────────────────

/**
 * Validate an API key from request headers.
 * Returns the sellerId and permissions if valid.
 */
export async function validateApiKey(rawKey: string): Promise<ApiKeyValidation> {
  if (!rawKey || !rawKey.startsWith('bo_')) {
    return { valid: false, error: 'Geçersiz API anahtarı formatı. "bo_" ile başlamalıdır.' };
  }

  try {
    const hashedKey = hashKey(rawKey);
    const q = query(
      collection(db, COL),
      where('key', '==', hashedKey),
      where('isActive', '==', true),
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return { valid: false, error: 'API anahtarı bulunamadı veya devre dışı.' };
    }

    const apiKey = { id: snap.docs[0].id, ...snap.docs[0].data() } as ApiKey;

    // Update usage stats
    updateDoc(doc(db, COL, apiKey.id), {
      lastUsedAt: new Date().toISOString(),
      usageCount: (apiKey.usageCount || 0) + 1,
    }).catch(() => {});

    return {
      valid: true,
      sellerId: apiKey.sellerId,
      permissions: apiKey.permissions,
    };
  } catch (error) {
    console.error('[apiKey] Validation error:', error);
    return { valid: false, error: 'API anahtarı doğrulama hatası.' };
  }
}

// ─── Rate Limiting ──────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  'products:read': { max: 300, windowMs: 60000 },
  'products:write': { max: 100, windowMs: 60000 },
  'orders:read': { max: 200, windowMs: 60000 },
  'orders:write': { max: 50, windowMs: 60000 },
  'inventory:read': { max: 200, windowMs: 60000 },
  'inventory:write': { max: 100, windowMs: 60000 },
  'pricing:read': { max: 200, windowMs: 60000 },
  'pricing:write': { max: 100, windowMs: 60000 },
  default: { max: 100, windowMs: 60000 },
};

export function checkRateLimit(sellerId: string, permission: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = `${sellerId}:${permission}`;
  const entry = rateLimitMap.get(key);
  const limit = RATE_LIMITS[permission] || RATE_LIMITS.default;

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + limit.windowMs });
    return { allowed: true, remaining: limit.max - 1, resetAt: now + limit.windowMs };
  }

  if (entry.count >= limit.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit.max - entry.count, resetAt: entry.resetAt };
}
