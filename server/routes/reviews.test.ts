import { describe, it, expect } from 'vitest';
import { registerReviewRoutes } from './reviews';

// ─── Minimal Express-route harness (no supertest dependency) ────────────────────
// registerReviewRoutes registers app.post(path, ...middlewares). We capture the
// middleware chain and drive it sequentially: each middleware either responds
// (res._ended) or advances (next()).

function makeRes() {
  const res: any = { _ended: false, statusCode: 200, body: undefined };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body: any) => {
    res.body = body;
    res._ended = true;
    return res;
  };
  return res;
}

async function runChain(handlers: any[], req: any) {
  const res = makeRes();
  for (const h of handlers) {
    let advanced = false;
    const next = () => {
      advanced = true;
    };
    await h(req, res, next);
    if (res._ended) return res;
    if (!advanced) return res;
  }
  return res;
}

function captureRoute() {
  const routes: Record<string, any[]> = {};
  const app: any = {
    post: (path: string, ...handlers: any[]) => {
      routes[path] = handlers;
    },
  };
  return { app, routes };
}

const verifyFirebaseToken = (req: any, _res: any, next: any) => {
  req.uid = req._uid || 'buyer-1';
  next();
};

interface MockData {
  orderSets?: any[];
  subOrders?: Record<string, any>;
  products?: Record<string, any>;
  existingReviews?: any[];
}

function snap(data: any) {
  return { exists: !!data, data: () => data };
}

function queryable(rows: any[]) {
  const q: any = {
    where: () => q,
    limit: () => q,
    get: async () => ({
      docs: rows.map((r) => ({ data: () => r })),
      empty: rows.length === 0,
    }),
  };
  return q;
}

function createAdminDb(opts: MockData) {
  const added: any[] = [];
  const db: any = {
    _added: added,
    collection(name: string) {
      if (name === 'orderSets') return queryable(opts.orderSets || []);
      if (name === 'subOrders')
        return { doc: (id: string) => ({ get: async () => snap((opts.subOrders || {})[id]) }) };
      if (name === 'products')
        return { doc: (id: string) => ({ get: async () => snap((opts.products || {})[id]) }) };
      if (name === 'reviews')
        return {
          ...queryable(opts.existingReviews || []),
          add: async (obj: any) => {
            added.push(obj);
            return { id: `rev-${added.length}` };
          },
        };
      return queryable([]);
    },
  };
  return db;
}

function setup(opts: MockData) {
  const { app, routes } = captureRoute();
  const adminDb = createAdminDb(opts);
  registerReviewRoutes(app, { adminDb, verifyFirebaseToken });
  return { handlers: routes['/api/reviews'], adminDb };
}

const baseBody = { productId: 'p1', rating: 5, comment: 'Harika ürün', userName: 'Ali' };

describe('POST /api/reviews', () => {
  it('returns 403 when the user has no delivered SubOrder containing the product', async () => {
    const { handlers } = setup({
      orderSets: [{ subOrderIds: ['s1'] }],
      subOrders: { s1: { status: 'pending', items: [{ productId: 'p1', sellerId: 'seller-1' }] } },
    });
    const res = await runChain(handlers, { body: { ...baseBody } });
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Yalnızca teslim alınan ürünler için yorum yapabilirsiniz.');
  });

  it('returns 201 with server-set verified:true and status:approved for a delivered buyer', async () => {
    const { handlers, adminDb } = setup({
      orderSets: [{ subOrderIds: ['s1'] }],
      subOrders: {
        s1: { status: 'delivered', items: [{ productId: 'p1', sellerId: 'seller-1' }] },
      },
      products: { p1: { sellerId: 'seller-1' } },
      existingReviews: [],
    });
    // Client attempts to forge verified/status — must be ignored by the server.
    const res = await runChain(handlers, {
      body: { ...baseBody, verified: false, status: 'pending' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.verified).toBe(true);
    expect(res.body.data.status).toBe('approved');
    expect(res.body.data.sellerId).toBe('seller-1');
    expect(adminDb._added).toHaveLength(1);
    expect(adminDb._added[0].verified).toBe(true);
  });

  it('returns 409 when the user already has an approved review for the product', async () => {
    const { handlers, adminDb } = setup({
      orderSets: [{ subOrderIds: ['s1'] }],
      subOrders: {
        s1: { status: 'delivered', items: [{ productId: 'p1', sellerId: 'seller-1' }] },
      },
      products: { p1: { sellerId: 'seller-1' } },
      existingReviews: [{ id: 'rev-existing', productId: 'p1', userId: 'buyer-1' }],
    });
    const res = await runChain(handlers, { body: { ...baseBody } });
    expect(res.statusCode).toBe(409);
    expect(adminDb._added).toHaveLength(0);
  });

  it('returns 400 (Zod) when photos exceed 5', async () => {
    const { handlers } = setup({
      orderSets: [{ subOrderIds: ['s1'] }],
      subOrders: {
        s1: { status: 'delivered', items: [{ productId: 'p1', sellerId: 'seller-1' }] },
      },
    });
    const photos = Array.from({ length: 6 }, (_, i) => `https://cdn.example.com/${i}.jpg`);
    const res = await runChain(handlers, { body: { ...baseBody, photos } });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 (Zod) when rating is out of the 1-5 range', async () => {
    const { handlers } = setup({
      orderSets: [{ subOrderIds: ['s1'] }],
      subOrders: {
        s1: { status: 'delivered', items: [{ productId: 'p1', sellerId: 'seller-1' }] },
      },
    });
    const res0 = await runChain(handlers, { body: { ...baseBody, rating: 0 } });
    expect(res0.statusCode).toBe(400);
    const res6 = await runChain(handlers, { body: { ...baseBody, rating: 6 } });
    expect(res6.statusCode).toBe(400);
  });
});
