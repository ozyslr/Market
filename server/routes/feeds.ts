// ─── XML product feeds (sellers/{uid}/feedConfigs) ───────────────────────────
// POST /api/feeds/:feedId/run  — seller runs one of their feeds now (also called right after saving).
// POST /api/feeds/sync         — Cloud Scheduler (x-cron-secret), runs every enabled feed that is due.
// New items become 'pending' products (admin moderation as usual); known items (same feed + SKU)
// only get price / oldPrice / stock updates, so a live listing is never re-written by the feed.
import type { Express } from 'express';
import type { Firestore, DocumentReference } from 'firebase-admin/firestore';
import { logger } from '../logger.js';
import { parseProductFeed } from '../services/feedParser.js';

type Middleware = (req: any, res: any, next: any) => any;

const MAX_FEED_BYTES = 20 * 1024 * 1024;
const SSRF_BLOCK =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.|0\.|\[)/i;
// shortcut: Scheduler runs hourly, so 15m/30m feeds sync hourly; add a faster job if sellers need it.
const DUE_MS: Record<string, number> = {
  '15m': 55 * 60e3,
  '30m': 55 * 60e3,
  '1h': 55 * 60e3,
  daily: 23 * 3600e3,
};

const TR: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };
const slugify = (v: string) =>
  `${
    v
      .toLocaleLowerCase('tr-TR')
      .replace(/[çğıöşü]/g, (c) => TR[c])
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 72) || 'urun'
  }-${Math.random().toString(36).slice(2, 7)}`;

async function downloadFeed(rawUrl: string): Promise<string> {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:') throw new Error('Feed adresi https olmalı');
  if (SSRF_BLOCK.test(url.hostname)) throw new Error('Özel ağ adresleri kullanılamaz');
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000), redirect: 'follow' });
  if (!res.ok) throw new Error(`Feed indirilemedi (HTTP ${res.status})`);
  if (Number(res.headers.get('content-length') || 0) > MAX_FEED_BYTES) {
    throw new Error('Feed 20 MB sınırını aşıyor');
  }
  const body = await res.text();
  if (body.length > MAX_FEED_BYTES) throw new Error('Feed 20 MB sınırını aşıyor');
  return body;
}

export interface FeedRunResult {
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
}

export async function runFeed(
  db: Firestore,
  sellerId: string,
  feedRef: DocumentReference,
): Promise<FeedRunResult> {
  const feed = (await feedRef.get()).data() ?? {};
  const opts: { updatePrice?: boolean; updateStock?: boolean; createNew?: boolean } =
    feed.options ?? {};
  const startedAt = new Date().toISOString();
  const result: FeedRunResult = { total: 0, created: 0, updated: 0, failed: 0, errors: [] };
  const note = (msg: string) => {
    result.failed++;
    if (result.errors.length < 20) result.errors.push(msg);
  };

  try {
    const { items, errors } = parseProductFeed(await downloadFeed(String(feed.url || '')));
    result.total = items.length + errors.length;
    errors.forEach((e) => note(`#${e.index + 1}: ${e.reason}`));

    // Category: name/slug/id from the feed, else the feed's default category.
    const catByKey = new Map<string, string>();
    (await db.collection('categories').get()).forEach((d) => {
      const c = d.data();
      catByKey.set(d.id.toLowerCase(), d.id);
      if (typeof c.slug === 'string') catByKey.set(c.slug.toLowerCase(), d.id);
      if (typeof c.name === 'string') catByKey.set(c.name.toLocaleLowerCase('tr-TR'), d.id);
    });

    const existing = new Map<string, DocumentReference>();
    (
      await db
        .collection('products')
        .where('sellerId', '==', sellerId)
        .where('feedId', '==', feedRef.id)
        .get()
    ).forEach((d) => existing.set(d.data().feedKey, d.ref));

    const now = new Date().toISOString();
    let batch = db.batch();
    let ops = 0;
    const flush = async () => {
      if (ops) await batch.commit();
      batch = db.batch();
      ops = 0;
    };

    for (const item of items) {
      const feedKey = `${feedRef.id}:${item.sku}`;
      const ref = existing.get(feedKey);
      if (ref) {
        if (opts.updatePrice === false && opts.updateStock === false) continue;
        batch.update(ref, {
          ...(opts.updatePrice !== false
            ? { price: item.price, ...(item.oldPrice ? { oldPrice: item.oldPrice } : {}) }
            : {}),
          ...(opts.updateStock !== false ? { stock: item.stock } : {}),
          updatedAt: now,
        });
        result.updated++;
      } else if (opts.createNew === false) {
        continue;
      } else {
        const categoryId =
          catByKey.get(item.category.toLocaleLowerCase('tr-TR')) ?? (feed.defaultCategoryId || '');
        if (!categoryId) {
          note(`${item.title}: kategori bulunamadı (${item.category || 'boş'})`);
          continue;
        }
        if (item.images.length === 0) {
          note(`${item.title}: https görsel yok`);
          continue;
        }
        batch.set(db.collection('products').doc(), {
          title: item.title,
          slug: slugify(item.title),
          description: item.description,
          brand: item.brand,
          price: item.price,
          ...(item.oldPrice ? { oldPrice: item.oldPrice } : {}),
          stock: item.stock,
          categoryId,
          images: item.images,
          sku: item.sku,
          currency: 'TRY',
          sellerId,
          status: 'pending',
          featured: false,
          rating: 0,
          reviewsCount: 0,
          feedId: feedRef.id,
          feedKey,
          createdAt: now,
          updatedAt: now,
        });
        result.created++;
      }
      if (++ops >= 400) await flush();
    }
    await flush();
  } catch (err: any) {
    result.errors.unshift(err?.message || 'Feed işlenemedi');
  }

  const failedRun = result.created + result.updated === 0 && result.errors.length > 0;
  await db
    .collection('sellers')
    .doc(sellerId)
    .collection('importJobs')
    .add({
      feedName: feed.name || 'XML Feed',
      feedId: feedRef.id,
      type: 'xml',
      status: failedRun ? 'failed' : 'completed',
      total: result.total,
      success: result.created + result.updated,
      created: result.created,
      updated: result.updated,
      failed: result.failed,
      errors: result.errors,
      createdAt: startedAt,
    });
  await feedRef.update({
    lastRunAt: new Date().toISOString(),
    lastStatus: failedRun ? 'failed' : 'completed',
    lastResult: { created: result.created, updated: result.updated, failed: result.failed },
  });
  logger.info('feeds', 'Feed run', {
    sellerId,
    feedId: feedRef.id,
    created: result.created,
    updated: result.updated,
    failed: result.failed,
  });
  return result;
}

export function registerFeedRoutes(
  app: Express,
  deps: {
    adminDb: Firestore | null;
    verifyFirebaseToken: Middleware;
    verifyCronSecret: Middleware;
  },
) {
  const { adminDb, verifyFirebaseToken, verifyCronSecret } = deps;

  app.post('/api/feeds/:feedId/run', verifyFirebaseToken, async (req: any, res: any) => {
    if (!adminDb) return res.status(503).json({ error: 'Database not configured' });
    if (req.decodedToken?.role !== 'seller') {
      return res.status(403).json({ error: 'Yalnızca onaylı satıcılar feed çalıştırabilir' });
    }
    const ref = adminDb
      .collection('sellers')
      .doc(req.uid)
      .collection('feedConfigs')
      .doc(req.params.feedId);
    if (!(await ref.get()).exists) return res.status(404).json({ error: 'Feed bulunamadı' });
    res.json(await runFeed(adminDb, req.uid, ref));
  });

  app.post('/api/feeds/sync', verifyCronSecret, async (_req: any, res: any) => {
    if (!adminDb) return res.status(503).json({ error: 'Database not configured' });
    const snap = await adminDb.collectionGroup('feedConfigs').get();
    const now = Date.now();
    let ran = 0;
    for (const d of snap.docs) {
      const f = d.data();
      const due = DUE_MS[f.syncInterval];
      if (!f.enabled || !due) continue; // 'manual' feeds run only from the seller panel
      if (f.lastRunAt && now - new Date(f.lastRunAt).getTime() < due) continue;
      const sellerId = d.ref.parent.parent?.id;
      if (!sellerId) continue;
      await runFeed(adminDb, sellerId, d.ref).catch((e) =>
        logger.error('feeds', 'Feed sync failed', { feedId: d.id, error: e?.message }),
      );
      ran++;
    }
    res.json({ feeds: snap.size, ran });
  });
}
