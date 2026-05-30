// ─── Seller REST API (/api/v1) ───────────────────────────────────────────────
// Public, API-key-authenticated endpoints for sellers to manage their own
// products, inventory and orders. Extracted verbatim from server.ts.
// All endpoints require: Authorization: Bearer bo_<api_key>
import type { Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';

const API_RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  'products:read': { max: 300, windowMs: 60000 },
  'products:write': { max: 100, windowMs: 60000 },
  'orders:read': { max: 200, windowMs: 60000 },
  'inventory:read': { max: 200, windowMs: 60000 },
  'inventory:write': { max: 100, windowMs: 60000 },
};

const apiRateStore = new Map<string, { count: number; resetAt: number }>();

export function registerSellerApiRoutes(app: Express, adminDb: Firestore) {
  async function authenticateApiKey(req: any): Promise<{ sellerId: string; permissions: string[] } | null> {
    const auth = req.headers?.authorization || '';
    if (!auth.startsWith('Bearer bo_')) return null;
    const rawKey = auth.slice(7);
    try {
      const hashedKey = Math.abs(rawKey.split('').reduce((h: number, c: string) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)).toString(16).padStart(8, '0');
      const snap = await adminDb.collection('apiKeys')
        .where('key', '==', hashedKey)
        .where('isActive', '==', true)
        .limit(1).get();
      if (snap.empty) return null;
      const data = snap.docs[0].data();
      // Update usage
      snap.docs[0].ref.update({ lastUsedAt: new Date().toISOString(), usageCount: (data.usageCount || 0) + 1 }).catch(() => {});
      return { sellerId: data.sellerId, permissions: data.permissions || [] };
    } catch { return null; }
  }

  function checkApiRateLimit(sellerId: string, permission: string): boolean {
    const now = Date.now();
    const key = `${sellerId}:${permission}`;
    const entry = apiRateStore.get(key);
    const limit = API_RATE_LIMITS[permission] || { max: 100, windowMs: 60000 };
    if (!entry || now > entry.resetAt) {
      apiRateStore.set(key, { count: 1, resetAt: now + limit.windowMs });
      return true;
    }
    if (entry.count >= limit.max) return false;
    entry.count++;
    return true;
  }

  // GET /api/v1/products — list seller's products
  app.get('/api/v1/products', async (req, res) => {
    const auth = await authenticateApiKey(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized — geçersiz API anahtarı' });
    if (!auth.permissions.includes('products:read') && !auth.permissions.includes('inventory:read'))
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok (products:read)' });
    if (!checkApiRateLimit(auth.sellerId, 'products:read'))
      return res.status(429).json({ error: 'Rate limit aşıldı. Lütfen bekleyin.' });

    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const snap = await adminDb.collection('products')
        .where('sellerId', '==', auth.sellerId)
        .limit(limit).get();
      const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.json({ count: products.length, products });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // GET /api/v1/products/:id — get single product
  app.get('/api/v1/products/:id', async (req, res) => {
    const auth = await authenticateApiKey(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    if (!checkApiRateLimit(auth.sellerId, 'products:read'))
      return res.status(429).json({ error: 'Rate limit aşıldı' });

    try {
      const doc = await adminDb.collection('products').doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Ürün bulunamadı' });
      const product: any = { id: doc.id, ...doc.data() };
      if (product.sellerId !== auth.sellerId) return res.status(403).json({ error: 'Bu ürün size ait değil' });
      return res.json({ product });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/v1/products — create product
  app.post('/api/v1/products', async (req, res) => {
    const auth = await authenticateApiKey(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    if (!auth.permissions.includes('products:write'))
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok (products:write)' });
    if (!checkApiRateLimit(auth.sellerId, 'products:write'))
      return res.status(429).json({ error: 'Rate limit aşıldı' });

    try {
      const { title, price, stock, categoryId, brand, description, images, currency } = req.body;
      if (!title || !price) return res.status(400).json({ error: 'title ve price zorunludur' });

      const now = new Date().toISOString();
      const product = {
        title, price: Number(price), stock: Number(stock) || 0,
        categoryId: categoryId || 'genel', brand: brand || '', description: description || '',
        images: images || ['https://images.unsplash.com/photo-1542382257-80dedb725088?w=800'],
        currency: currency || 'TRY',
        sellerId: auth.sellerId,
        status: 'pending',
        rating: 0, reviewsCount: 0, featured: false,
        createdAt: now, updatedAt: now,
      };
      const ref = await adminDb.collection('products').add(product);
      return res.status(201).json({ product: { id: ref.id, ...product } });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/v1/products/:id — update product
  app.put('/api/v1/products/:id', async (req, res) => {
    const auth = await authenticateApiKey(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    if (!auth.permissions.includes('products:write'))
      return res.status(403).json({ error: 'Yetkiniz yok (products:write)' });
    if (!checkApiRateLimit(auth.sellerId, 'products:write'))
      return res.status(429).json({ error: 'Rate limit aşıldı' });

    try {
      const docRef = adminDb.collection('products').doc(req.params.id);
      const snap = await docRef.get();
      if (!snap.exists) return res.status(404).json({ error: 'Ürün bulunamadı' });
      if (snap.data()!.sellerId !== auth.sellerId) return res.status(403).json({ error: 'Bu ürün size ait değil' });

      const allowed = ['title', 'price', 'stock', 'description', 'brand', 'categoryId', 'images', 'currency'];
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
  app.put('/api/v1/products/stock', async (req, res) => {
    const auth = await authenticateApiKey(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    if (!auth.permissions.includes('inventory:write'))
      return res.status(403).json({ error: 'Yetkiniz yok (inventory:write)' });
    if (!checkApiRateLimit(auth.sellerId, 'inventory:write'))
      return res.status(429).json({ error: 'Rate limit aşıldı' });

    try {
      const { items } = req.body; // [{ productId, stock, price }]
      if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items[] dizisi gerekli' });
      if (items.length > 500) return res.status(400).json({ error: 'Tek seferde max 500 ürün' });

      const batch = adminDb.batch();
      const now = new Date().toISOString();
      for (const item of items) {
        const ref = adminDb.collection('products').doc(item.productId);
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
  app.get('/api/v1/orders', async (req, res) => {
    const auth = await authenticateApiKey(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    if (!auth.permissions.includes('orders:read'))
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok (orders:read)' });
    if (!checkApiRateLimit(auth.sellerId, 'orders:read'))
      return res.status(429).json({ error: 'Rate limit aşıldı' });

    try {
      const status = req.query.status as string;
      let query = adminDb.collection('orders').where('sellerIds', 'array-contains', auth.sellerId);
      if (status) query = query.where('status', '==', status);
      const snap = await query.limit(100).get();
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.json({ count: orders.length, orders });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // GET /api/v1/orders/:id — get single order
  app.get('/api/v1/orders/:id', async (req, res) => {
    const auth = await authenticateApiKey(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    if (!checkApiRateLimit(auth.sellerId, 'orders:read'))
      return res.status(429).json({ error: 'Rate limit aşıldı' });

    try {
      const doc = await adminDb.collection('orders').doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Sipariş bulunamadı' });
      const order: any = { id: doc.id, ...doc.data() };
      if (!order.sellerIds?.includes(auth.sellerId)) return res.status(403).json({ error: 'Bu sipariş size ait değil' });
      return res.json({ order });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // GET /api/v1 — API info / health
  app.get('/api/v1', (_req, res) => {
    return res.json({
      api: 'Benim Olan Seller REST API',
      version: '1.0.0',
      endpoints: [
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
