import { describe, it, expect } from 'vitest';
import { priceAlertDue, runAlerts } from './alerts';

// Minimal Firestore fake: collection get / equality where / add, doc update, getAll.
function fakeDb(data: Record<string, Record<string, any>>) {
  const added: { col: string; doc: any }[] = [];
  const snap = (col: string, id: string) => ({
    id,
    exists: id in (data[col] ?? {}),
    data: () => data[col]?.[id],
    ref: { update: async (u: any) => Object.assign(data[col][id], u) },
  });
  const query = (col: string, filters: [string, any][]) => ({
    where: (f: string, _op: string, v: any) => query(col, [...filters, [f, v]]),
    get: async () => ({
      docs: Object.keys(data[col] ?? {})
        .filter((id) => filters.every(([f, v]) => data[col][id][f] === v))
        .map((id) => snap(col, id)),
    }),
  });
  const db: any = {
    collection: (col: string) => ({
      ...query(col, []),
      doc: (id: string) => ({ col, id }),
      add: async (doc: any) => added.push({ col, doc }),
    }),
    getAll: async (...refs: { col: string; id: string }[]) => refs.map((r) => snap(r.col, r.id)),
  };
  return { db, data, added };
}

describe('priceAlertDue', () => {
  it('fires when the target price is reached, not above it', () => {
    expect(priceAlertDue({ targetPrice: 400 }, 400)).toBe(true);
    expect(priceAlertDue({ targetPrice: 400 }, 401)).toBe(false);
  });
  it('with no target, fires on any drop below the original price', () => {
    expect(priceAlertDue({ targetPrice: 0, originalPrice: 500 }, 499)).toBe(true);
    expect(priceAlertDue({ targetPrice: 0, originalPrice: 500 }, 500)).toBe(false);
  });
  it('never fires twice for the same or a higher price', () => {
    expect(priceAlertDue({ targetPrice: 400, lastNotifiedPrice: 380 }, 380)).toBe(false);
    expect(priceAlertDue({ targetPrice: 400, lastNotifiedPrice: 380 }, 350)).toBe(true);
  });
});

describe('runAlerts', () => {
  it('notifies once per drop and back-in-stock, skipping demo and out-of-stock products', async () => {
    const { db, data, added } = fakeDb({
      products: {
        p1: { status: 'approved', price: 350, stock: 3, title: 'Kupa', slug: 'kupa' },
        demo: { status: 'approved', isDemo: true, price: 1, stock: 9, title: 'Vitrin', slug: 'v' },
        empty: { status: 'approved', price: 10, stock: 0, title: 'Tabak', slug: 't' },
      },
      priceTracks: { a: { userId: 'u1', productId: 'p1', targetPrice: 0, originalPrice: 500 } },
      priceAlerts: { b: { userId: 'u2', productId: 'demo', targetPrice: 100 } },
      stockAlerts: {
        c: { userId: 'u3', productId: 'p1', notified: false },
        d: { userId: 'u4', productId: 'empty', notified: false },
      },
    });

    expect(await runAlerts(db)).toEqual({ priceNotified: 1, stockNotified: 1 });
    expect(added.map((a) => [a.doc.userId, a.doc.type, a.doc.link])).toEqual([
      ['u1', 'price_drop', '/product/kupa'],
      ['u3', 'back_in_stock', '/product/kupa'],
    ]);
    expect(data.priceTracks.a.lastNotifiedPrice).toBe(350);
    expect(data.stockAlerts.c.notified).toBe(true);

    // Second run, nothing changed: no repeats.
    expect(await runAlerts(db)).toEqual({ priceNotified: 0, stockNotified: 0 });
  });
});
