// ─── Price & stock alerts ────────────────────────────────────────────────────
// POST /api/alerts/run — Cloud Scheduler (x-cron-secret), hourly.
// Buyers' alerts are private (firestore.rules), so only the server can match them to products.
//   priceTracks : product page / profile list  (targetPrice 0 = any drop below originalPrice)
//   priceAlerts : price-alert button / page     (targetPrice set)
//   stockAlerts : back-in-stock button          (notified false → true once sent)
import type { Express } from 'express';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { logger } from '../logger.js';

type Middleware = (req: any, res: any, next: any) => any;

/** True when this price should trigger the alert; never twice for the same or a higher price. */
export function priceAlertDue(alert: Record<string, any>, price: unknown): boolean {
  if (typeof price !== 'number' || !(price > 0)) return false;
  const last = alert.lastNotifiedPrice;
  if (typeof last === 'number' && price >= last) return false;
  const target = Number(alert.targetPrice) || 0;
  if (target > 0) return price <= target;
  const reference = Number(alert.originalPrice ?? alert.currentPrice) || 0;
  return reference > 0 && price < reference;
}

const tl = (n: number) =>
  `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;

// shortcut: reads every alert doc on each run; switch to a price/stock-change trigger past ~10k alerts.
export async function runAlerts(db: Firestore) {
  const [tracks, alerts, stock] = await Promise.all([
    db.collection('priceTracks').get(),
    db.collection('priceAlerts').get(),
    db.collection('stockAlerts').where('notified', '==', false).get(),
  ]);
  const priceDocs = [...tracks.docs, ...alerts.docs];

  const ids = [
    ...new Set(
      [...priceDocs, ...stock.docs]
        .map((d) => d.data().productId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  ];
  const products = new Map<string, Record<string, any>>();
  for (let i = 0; i < ids.length; i += 100) {
    const refs = ids.slice(i, i + 100).map((id) => db.collection('products').doc(id));
    for (const s of await db.getAll(...refs)) if (s.exists) products.set(s.id, s.data()!);
  }
  // Only products a buyer can actually order.
  const sellable = (id: string) => {
    const p = products.get(id);
    return p && p.status === 'approved' && !p.isDemo ? p : null;
  };

  const notify = (userId: string, type: string, title: string, message: string, slug?: string) =>
    db.collection('notifications').add({
      userId,
      type,
      title,
      message,
      link: slug ? `/product/${slug}` : null,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

  const result = { priceNotified: 0, stockNotified: 0 };
  // Notify first, then mark: a failed mark repeats one notification instead of losing it.
  for (const d of priceDocs) {
    const a = d.data();
    const p = sellable(a.productId);
    if (!p || !a.userId || !priceAlertDue(a, p.price)) continue;
    await notify(
      a.userId,
      'price_drop',
      'Fiyat Düştü!',
      `${p.title} şimdi ${tl(p.price)}.`,
      p.slug,
    );
    await d.ref.update({ lastNotifiedPrice: p.price });
    result.priceNotified++;
  }
  for (const d of stock.docs) {
    const a = d.data();
    const p = sellable(a.productId);
    if (!p || !a.userId || !((p.stock ?? 0) > 0)) continue;
    await notify(
      a.userId,
      'back_in_stock',
      'Tekrar Stokta!',
      `${p.title} tekrar stokta. Hemen sipariş verebilirsiniz.`,
      p.slug,
    );
    await d.ref.update({ notified: true });
    result.stockNotified++;
  }
  return result;
}

export function registerAlertRoutes(
  app: Express,
  deps: { adminDb: Firestore | null; verifyCronSecret: Middleware },
) {
  const { adminDb, verifyCronSecret } = deps;
  app.post('/api/alerts/run', verifyCronSecret, async (_req: any, res: any) => {
    if (!adminDb) return res.status(503).json({ error: 'Database not configured' });
    try {
      const result = await runAlerts(adminDb);
      logger.info('alerts', 'Alert run', result);
      res.json(result);
    } catch (e: any) {
      logger.error('alerts', 'Alert run failed', { error: e?.message });
      res.status(500).json({ error: 'Alert run failed' });
    }
  });
}
