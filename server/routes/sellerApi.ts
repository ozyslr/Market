// ─── Seller REST API (/api/v1) ────────────────────────────────────────────────
// Public, API-key-authenticated endpoints for sellers to manage their own
// products, inventory and orders. Extracted verbatim from server.ts.
// All endpoints require: Authorization: Bearer bo_<api_key>
import type { Express } from 'express';
import { createHash, timingSafeEqual, randomBytes } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { validate } from '../lib/validate.js';
import { createProductSchema, updateProductSchema, bulkStockUpdateSchema } from '../lib/schemas.js';
import type { Firestore } from 'firebase-admin/firestore';

const API_RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  'products:read': { max: 300, windowMs: 60000 },
  'products:write': { max: 100, windowMs: 60000 },
  'orders:read': { max: 200, windowMs: 60000 },
  'inventory:read': { max: 200, windowMs: 60000 },
  'inventory:write': { max: 100, windowMs: 60000 },
};

// ─── Hash helpers ────────────────────────────────────────────────────────────

function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey, 'utf8').digest('hex');
}

function verifyApiKey(rawKey: string, storedHash: string): boolean {
  const a = Buffer.from(hashApiKey(rawKey), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ─── Firestore-backed rate limit ─────────────────────────────────────────────

async function checkApiRateLimit(
  db: Firestore,
  sellerId: string,
  permission: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = API_RATE_LIMITS[permission] || { max: 100, windowMs: 60000 };
  const MAX = limit.max;
  const WINDOW = limit.windowMs;
  const key = `${sellerId}:${permission}`;
  const ref = db.collection('apiRateLimits').doc(key);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    if (!snap.exists || now > (snap.data()?.resetAt ?? 0)) {
      tx.set(ref, { count: 1, resetAt: now + WINDOW, max: MAX, windowMs: WINDOW });
      return { allowed: true, remaining: MAX - 1 };
    }
    const count = snap.data()!.count as number;
    if (count >= MAX) return { allowed: false, remaining: 0 };
    tx.update(ref, { count: FieldValue.increment(1) });
    return { allowed: true, remaining: MAX - count - 1 };
  });
}

export function registerSellerApiRoutes(
  app: Express,
  adminDb: Firestore | null,
  verifyFirebaseToken?: (req: any, res: any, next: any) => void,
) {
  // ── Guard: if Firestore Admin isn't configured, all routes return 503 ──
  if (!adminDb) {
    const unavailable = (_req: any, res: any) =>
      res.status(503).json({ error: 'Database not configured' });
    app.get('/api/v1', unavailable);
    app.post('/api/v1/keys', unavailable);
    app.get('/api/v1/products', unavailable);
    app.get('/api/v1/products/:id', unavailable);
    app.post('/api/v1/products', unavailable);
    app.put('/api/v1/products/:id', unavailable);
    app.put('/api/v1/products/stock', unavailable);
    app.get('/api/v1/orders', unavailable);
    app.get('/api/v1/orders/:id', unavailable);
    console.warn('[sellerApi] adminDb is null — all /api/v1 routes return 503');
    return;
  }

  // After the null guard, adminDb is guaranteed non-null. Alias for closures.
  const db: Firestore = adminDb;

  // MIGRATION NOTE: existing API keys hashed with the old djb2 algorithm are now
  // invalid. Sellers must regenerate their API keys from the dashboard.
  console.warn(
    '[sellerApi] MIGRATION: existing API keys hashed with old algorithm are now invalid. ' +
      'Sellers must regenerate their API keys.',
  );

  async function authenticateApiKey(
    req: any,
  ): Promise<{ sellerId: string; permissions: string[]; keyId: string } | null> {
    const auth = req.headers?.authorization || '';
    if (!auth.startsWith('Bearer bo_')) return null;
    const rawKey = auth.slice(7); // "Bearer " = 7 chars → gives "bo_..."
    try {
      const snap = await db.collection('apiKeys').where('isActive', '==', true).get();
      if (snap.empty) return null;

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const storedHash: string = data.keyHash || data.key || '';

        // Reject old 8-char djb2 hashes (SHA-256 hashes are 64 hex chars)
        if (storedHash.length !== 64) {
          // Key is old format — skip (caller will get 401 with KEY_REHASH_REQUIRED
          // if NO valid key matches at the end)
          continue;
        }

        if (verifyApiKey(rawKey, storedHash)) {
          // Update usage
          docSnap.ref
            .update({
              lastUsedAt: new Date().toISOString(),
              usageCount: (data.usageCount || 0) + 1,
            })
            .catch(() => {});
          return {
            sellerId: data.sellerId,
            permissions: data.permissions || [],
            keyId: docSnap.id,
          };
        }
      }

      // Check if there are any old-format keys for this seller to give helpful error
      const hasOldKeys = snap.docs.some((d) => {
        const h: string = d.data().keyHash || d.data().key || '';
        return h.length !== 64;
      });
      if (hasOldKeys) {
        // Signal to caller to return KEY_REHASH_REQUIRED
        return null;
      }
      return null;
    } catch {
      return null;
    }
  }

  // ─── POST /api/v1/keys — create API key (Firebase-authenticated) ────────────
  app.post('/api/v1/keys', async (req: any, res: any) => {
    // Verify Firebase ID token
    const authHeader = req.headers?.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Firebase kimlik doğrulaması gerekli.' });
    }
    const idToken = authHeader.slice(7);
    let uid: string;
    try {
      // Use firebase-admin auth to verify the ID token
      const { getAuth } = await import('firebase-admin/auth');
      const decoded = await getAuth().verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return res
        .status(401)
        .json({ error: 'Geçersiz veya süresi dolmuş kimlik doğrulama tokeni.' });
    }

    const { name, permissions } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim().length < 1) {
      return res.status(400).json({ error: 'Anahtar adı gereklidir.' });
    }
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({ error: 'En az bir izin seçilmelidir.' });
    }

    try {
      // Generate raw key server-side using cryptographically secure random bytes
      const rawKey = 'bo_' + randomBytes(32).toString('hex');
      const keyHash = hashApiKey(rawKey);
      const keyPrefix = rawKey.slice(0, 10);
      const now = new Date().toISOString();

      const docData = {
        keyHash,
        keyPrefix,
        name: name.trim(),
        permissions,
        sellerId: uid,
        isActive: true,
        usageCount: 0,
        createdAt: now,
        lastUsedAt: null,
      };

      const ref = await db.collection('apiKeys').add(docData);

      // Return rawKey ONCE — it is never stored in Firestore
      return res.status(201).json({ rawKey, keyId: ref.id });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // GET /api/v1/products — list seller's products
  app.get('/api/v1/products', async (req: any, res: any) => {
    const auth = await authenticateApiKey(req);
    if (!auth)
      return res.status(401).json({
        error: 'Geçersiz API anahtarı. Lütfen yeni bir anahtar oluşturun.',
        code: 'KEY_REHASH_REQUIRED',
      });
    if (!auth.permissions.includes('products:read') && !auth.permissions.includes('inventory:read'))
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok (products:read)' });
    const rateCheck = await checkApiRateLimit(db, auth.sellerId, 'products:read');
    if (!rateCheck.allowed)
      return res.status(429).json({ error: 'Hız limiti aşıldı. 60 saniye içinde tekrar deneyin.' });

    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const snap = await db
        .collection('products')
        .where('sellerId', '==', auth.sellerId)
        .limit(limit)
        .get();
      const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return res.json({ count: products.length, products });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // GET /api/v1/products/:id — get single product
  app.get('/api/v1/products/:id', async (req: any, res: any) => {
    const auth = await authenticateApiKey(req);
    if (!auth)
      return res.status(401).json({
        error: 'Geçersiz API anahtarı. Lütfen yeni bir anahtar oluşturun.',
        code: 'KEY_REHASH_REQUIRED',
      });
    const rateCheck = await checkApiRateLimit(db, auth.sellerId, 'products:read');
    if (!rateCheck.allowed)
      return res.status(429).json({ error: 'Hız limiti aşıldı. 60 saniye içinde tekrar deneyin.' });

    try {
      const doc = await db.collection('products').doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Ürün bulunamadı' });
      const product: any = { id: doc.id, ...doc.data() };
      if (product.sellerId !== auth.sellerId)
        return res.status(403).json({ error: 'Bu ürün size ait değil' });
      return res.json({ product });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/v1/products — create product
  app.post('/api/v1/products', async (req: any, res: any) => {
    const auth = await authenticateApiKey(req);
    if (!auth)
      return res.status(401).json({
        error: 'Geçersiz API anahtarı. Lütfen yeni bir anahtar oluşturun.',
        code: 'KEY_REHASH_REQUIRED',
      });
    if (!auth.permissions.includes('products:write'))
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok (products:write)' });
    const rateCheck = await checkApiRateLimit(db, auth.sellerId, 'products:write');
    if (!rateCheck.allowed)
      return res.status(429).json({ error: 'Hız limiti aşıldı. 60 saniye içinde tekrar deneyin.' });

    try {
      const { title, price, stock, categoryId, brand, description, images, currency } = req.body;
      // D-11: server-side product validation (T-03-08) before Firestore write
      if (!title || typeof title !== 'string' || title.trim().length < 1)
        return res.status(400).json({ error: 'title is required' });
      if (typeof price !== 'number' || price <= 0)
        return res.status(400).json({ error: 'price must be a positive number' });
      if (!images || !Array.isArray(images) || images.length < 1)
        return res.status(400).json({ error: 'At least one product image is required' });
      if (!categoryId || typeof categoryId !== 'string' || categoryId.trim().length < 1)
        return res.status(400).json({ error: 'categoryId is required' });

      const now = new Date().toISOString();
      const product = {
        title,
        price: Number(price),
        stock: Number(stock) || 0,
        categoryId: categoryId || 'genel',
        brand: brand || '',
        description: description || '',
        images: images || ['https://images.unsplash.com/photo-1542382257-80dedb725088?w=800'],
        currency: currency || 'TRY',
        sellerId: auth.sellerId,
        status: 'pending',
        rating: 0,
        reviewsCount: 0,
        featured: false,
        createdAt: now,
        updatedAt: now,
      };
      const ref = await db.collection('products').add(product);
      return res.status(201).json({ product: { id: ref.id, ...product } });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/v1/products/:id — update product
  app.put('/api/v1/products/:id', async (req: any, res: any) => {
    const auth = await authenticateApiKey(req);
    if (!auth)
      return res.status(401).json({
        error: 'Geçersiz API anahtarı. Lütfen yeni bir anahtar oluşturun.',
        code: 'KEY_REHASH_REQUIRED',
      });
    if (!auth.permissions.includes('products:write'))
      return res.status(403).json({ error: 'Yetkiniz yok (products:write)' });
    const rateCheck = await checkApiRateLimit(db, auth.sellerId, 'products:write');
    if (!rateCheck.allowed)
      return res.status(429).json({ error: 'Hız limiti aşıldı. 60 saniye içinde tekrar deneyin.' });

    try {
      const docRef = db.collection('products').doc(req.params.id);
      const snap = await docRef.get();
      if (!snap.exists) return res.status(404).json({ error: 'Ürün bulunamadı' });
      if (snap.data()!.sellerId !== auth.sellerId)
        return res.status(403).json({ error: 'Bu ürün size ait değil' });

      // D-11: validate fields that are present in partial update (T-03-08)
      if (
        req.body.images !== undefined &&
        (!Array.isArray(req.body.images) || req.body.images.length < 1)
      )
        return res.status(400).json({ error: 'At least one product image is required' });
      if (
        req.body.categoryId !== undefined &&
        (typeof req.body.categoryId !== 'string' || req.body.categoryId.trim().length < 1)
      )
        return res.status(400).json({ error: 'categoryId is required' });
      if (
        req.body.price !== undefined &&
        (typeof req.body.price !== 'number' || req.body.price <= 0)
      )
        return res.status(400).json({ error: 'price must be a positive number' });

      const allowed = [
        'title',
        'price',
        'stock',
        'description',
        'brand',
        'categoryId',
        'images',
        'currency',
      ];
      const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      await docRef.update(updates);
      return res.json({ success: true, updates });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/v1/products/stock — batch stock/price update
  app.put('/api/v1/products/stock', async (req: any, res: any) => {
    const auth = await authenticateApiKey(req);
    if (!auth)
      return res.status(401).json({
        error: 'Geçersiz API anahtarı. Lütfen yeni bir anahtar oluşturun.',
        code: 'KEY_REHASH_REQUIRED',
      });
    if (!auth.permissions.includes('inventory:write'))
      return res.status(403).json({ error: 'Yetkiniz yok (inventory:write)' });
    const rateCheck = await checkApiRateLimit(db, auth.sellerId, 'inventory:write');
    if (!rateCheck.allowed)
      return res.status(429).json({ error: 'Hız limiti aşıldı. 60 saniye içinde tekrar deneyin.' });

    try {
      const { items } = req.body; // [{ productId, stock, price }]
      if (!Array.isArray(items) || items.length === 0)
        return res.status(400).json({ error: 'items[] dizisi gerekli' });
      if (items.length > 500) return res.status(400).json({ error: 'Tek seferde max 500 ürün' });

      const batch = db.batch();
      const now = new Date().toISOString();
      for (const item of items) {
        const ref = db.collection('products').doc(item.productId);
        const data: Record<string, any> = { updatedAt: now };
        if (item.stock !== undefined) data.stock = Number(item.stock);
        if (item.price !== undefined) data.price = Number(item.price);
        batch.update(ref, data);
      }
      await batch.commit();
      return res.json({ success: true, updated: items.length });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // GET /api/v1/orders — list seller's orders
  app.get('/api/v1/orders', async (req: any, res: any) => {
    const auth = await authenticateApiKey(req);
    if (!auth)
      return res.status(401).json({
        error: 'Geçersiz API anahtarı. Lütfen yeni bir anahtar oluşturun.',
        code: 'KEY_REHASH_REQUIRED',
      });
    if (!auth.permissions.includes('orders:read'))
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok (orders:read)' });
    const rateCheck = await checkApiRateLimit(db, auth.sellerId, 'orders:read');
    if (!rateCheck.allowed)
      return res.status(429).json({ error: 'Hız limiti aşıldı. 60 saniye içinde tekrar deneyin.' });

    try {
      const status = req.query.status as string;
      let query = db.collection('orders').where('sellerIds', 'array-contains', auth.sellerId);
      if (status) query = query.where('status', '==', status);
      const snap = await query.limit(100).get();
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return res.json({ count: orders.length, orders });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // GET /api/v1/orders/:id — get single order
  app.get('/api/v1/orders/:id', async (req: any, res: any) => {
    const auth = await authenticateApiKey(req);
    if (!auth)
      return res.status(401).json({
        error: 'Geçersiz API anahtarı. Lütfen yeni bir anahtar oluşturun.',
        code: 'KEY_REHASH_REQUIRED',
      });
    const rateCheck = await checkApiRateLimit(db, auth.sellerId, 'orders:read');
    if (!rateCheck.allowed)
      return res.status(429).json({ error: 'Hız limiti aşıldı. 60 saniye içinde tekrar deneyin.' });

    try {
      const doc = await db.collection('orders').doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Sipariş bulunamadı' });
      const order: any = { id: doc.id, ...doc.data() };
      if (!order.sellerIds?.includes(auth.sellerId))
        return res.status(403).json({ error: 'Bu sipariş size ait değil' });
      return res.json({ order });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // GET /api/v1 — API info / health
  app.get('/api/v1', (_req: any, res: any) => {
    return res.json({
      api: 'Benim Olan Seller REST API',
      version: '1.0.0',
      endpoints: [
        'POST   /api/v1/keys',
        'GET    /api/v1/products',
        'GET    /api/v1/products/:id',
        'POST   /api/v1/products',
        'PUT    /api/v1/products/:id',
        'PUT    /api/v1/products/stock',
        'GET    /api/v1/orders',
        'GET    /api/v1/orders/:id',
      ],
      auth: 'Bearer bo_<api_key>',
      docs: '/api/v1',
    });
  });
}
