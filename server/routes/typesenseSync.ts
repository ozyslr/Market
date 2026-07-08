// ─── Typesense sync webhook ──────────────────────────────────────────────────
import express, { type Express, type NextFunction } from 'express';
import { logger } from '../logger.js';
import {
  upsertProduct,
  deleteProduct,
  getIndexStatus,
  deleteAllProducts,
  type TypesenseProduct,
} from '../../src/services/typesenseService.js';

function verifySyncSecret(req: express.Request, res: express.Response): boolean {
  const secret = req.headers['x-typesense-sync-secret'];
  if (secret !== (process.env.TYPESENSE_SYNC_SECRET || 'dev-secret')) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export function registerTypesenseSyncRoutes(
  app: Express,
  deps: { verifyFirebaseToken: express.RequestHandler },
): void {
  // Upsert a product
  app.post('/api/typesense/sync/product', async (req, res) => {
    if (!verifySyncSecret(req, res)) return;
    try {
      const product: TypesenseProduct = req.body;
      if (!product.id) return res.status(400).json({ error: 'Missing product id' });
      await upsertProduct(product);
      logger.info('typesense', `Product upserted: ${product.id}`);
      res.json({ status: 'ok' });
    } catch (err: any) {
      logger.error('typesense', 'Sync error', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  // Delete a product
  app.delete('/api/typesense/sync/product/:id', async (req, res) => {
    if (!verifySyncSecret(req, res)) return;
    try {
      await deleteProduct(req.params.id);
      logger.info('typesense', `Product deleted: ${req.params.id}`);
      res.json({ status: 'ok' });
    } catch (err: any) {
      logger.error('typesense', 'Delete error', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  // Index status
  app.get('/api/typesense/sync/status', async (_req, res) => {
    try {
      const status = await getIndexStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin re-index — requires Firebase auth
  app.post('/api/typesense/sync/reindex', deps.verifyFirebaseToken, async (req, res) => {
    try {
      const startedAt = Date.now();
      const { adminDb } = await import('../../src/lib/firebase-admin.js');
      if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not initialized' });

      // Delete all existing docs
      await deleteAllProducts();

      // Re-index all products with cursor pagination
      let count = 0;
      let lastDoc: any = null;
      const BATCH_SIZE = 500;

      while (true) {
        let query = adminDb.collection('products').orderBy('__name__').limit(BATCH_SIZE);
        if (lastDoc) query = query.startAfter(lastDoc);
        const snapshot = await query.get();

        if (snapshot.empty) break;

        const batch: TypesenseProduct[] = [];
        snapshot.forEach((doc: any) => {
          const data = doc.data();
          batch.push({
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            price: data.price || 0,
            categoryId: data.categoryId || '',
            brand: data.brand || '',
            rating: data.rating || 0,
            imageUrl: data.images?.[0] || data.imageUrl || '',
            storeId: data.storeId || '',
            language: data.language || 'tr',
            tags: data.tags || [],
            createdAt: data.createdAt?._seconds || Math.floor(Date.now() / 1000),
          });
        });

        await Promise.all(batch.map((p) => upsertProduct(p)));
        count += batch.length;
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        logger.info('typesense', `Re-index progress: ${count} products`);
      }

      const durationMs = Date.now() - startedAt;
      logger.info('typesense', `Re-index complete: ${count} products in ${durationMs}ms`);
      res.json({ status: 'completed', indexed: count, durationMs });
    } catch (err: any) {
      logger.error('typesense', 'Re-index error', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });
}
