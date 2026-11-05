import { describe, it, expect } from 'vitest';
import { quoteCheckout, cartSignature, QuoteError } from './checkoutQuote';
import { iyzicoBasket } from '../routes/checkout';

// Minimal Firestore fake: doc().get() and where()/limit()/get() equality queries.
function fakeDb(data: Record<string, Record<string, any>>): any {
  const query = (name: string, filters: [string, any][]) => ({
    where: (f: string, _op: string, v: any) => query(name, [...filters, [f, v]]),
    limit: () => query(name, filters),
    get: async () => {
      const docs = Object.entries(data[name] ?? {})
        .filter(([, d]) => filters.every(([f, v]) => d[f] === v))
        .map(([id, d]) => ({ id, data: () => d }));
      return { empty: docs.length === 0, docs };
    },
  });
  return {
    collection: (name: string) => ({
      ...query(name, []),
      doc: (id: string) => ({
        get: async () => {
          const d = data[name]?.[id];
          return { id, exists: !!d, data: () => d };
        },
      }),
    }),
  };
}

const products = {
  a: { price: 100, title: 'Kupa', sellerId: 's1', images: ['a.jpg'] },
  b: { price: 50, title: 'Tabak', sellerId: 's2', freeShipping: true },
};

describe('quoteCheckout', () => {
  it('prices from the database, adds TR VAT and shipping', async () => {
    const q = await quoteCheckout(fakeDb({ products }), {
      items: [{ productId: 'a', quantity: 2 }],
      shipping: 30,
    });
    expect(q.subtotal).toBe(200);
    expect(q.tax).toBe(40);
    expect(q.total).toBe(270);
    expect(q.lines[0]).toMatchObject({ name: 'Kupa', sellerId: 's1', subtotal: 200 });
  });

  it('charges no shipping when every line ships free, and caps a forged shipping fee', async () => {
    const db = fakeDb({ products });
    const free = await quoteCheckout(db, {
      items: [{ productId: 'b', quantity: 1 }],
      shipping: 99,
    });
    expect(free.shipping).toBe(0);
    const capped = await quoteCheckout(db, {
      items: [{ productId: 'a', quantity: 1 }],
      shipping: 1e9,
    });
    expect(capped.shipping).toBe(1000);
  });

  it('applies a seller-scoped coupon only to that seller lines, plus the best campaign', async () => {
    const db = fakeDb({
      products,
      coupons: {
        c1: {
          code: 'KUPA10',
          isActive: true,
          sellerId: 's1',
          discountType: 'percentage',
          discountValue: 10,
          usedCount: 0,
        },
      },
      campaigns: {
        k1: {
          isActive: true,
          isCartCampaign: true,
          startDate: '2000-01-01',
          endDate: '2999-01-01',
          discountType: 'fixed',
          discountValue: 5,
        },
      },
    });
    const q = await quoteCheckout(db, {
      items: [
        { productId: 'a', quantity: 1 },
        { productId: 'b', quantity: 1 },
      ],
      couponCode: 'kupa10',
    });
    expect(q.couponId).toBe('c1');
    expect(q.discount).toBe(15); // 10 % of seller s1's 100 + 5 campaign
    expect(q.total).toBe(162); // (150 - 15) * 1.2, no shipping sent
  });

  it('rejects unknown products and used-up coupons', async () => {
    const db = fakeDb({
      products,
      coupons: {
        c: {
          code: 'X',
          isActive: true,
          maxUses: 1,
          usedCount: 1,
          discountType: 'fixed',
          discountValue: 5,
        },
      },
    });
    await expect(
      quoteCheckout(db, { items: [{ productId: 'zz', quantity: 1 }] }),
    ).rejects.toBeInstanceOf(QuoteError);
    await expect(
      quoteCheckout(db, { items: [{ productId: 'a', quantity: 1 }], couponCode: 'X' }),
    ).rejects.toThrow(/kupon/);
  });
});

describe('cartSignature', () => {
  it('ignores line order but not quantities', () => {
    const a1 = { productId: 'a', quantity: 1 };
    const b2 = { productId: 'b', quantity: 2 };
    expect(cartSignature([b2, a1])).toBe(cartSignature([a1, b2]));
    expect(cartSignature([{ productId: 'a', quantity: 2 }, b2])).not.toBe(cartSignature([a1, b2]));
  });
});

describe('iyzicoBasket', () => {
  it('spreads the order total so the basket sums exactly to it', () => {
    const basket = iyzicoBasket(
      [
        { productId: 'a', name: 'A', subtotal: 100 },
        { productId: 'b', name: 'B', subtotal: 33.33 },
        { productId: 'c', name: 'C', subtotal: 0 },
      ],
      191.99,
    );
    expect(basket.map((b) => b.id)).toEqual(['a', 'b']);
    const sum = basket.reduce((s, b) => s + Number(b.price), 0);
    expect(sum.toFixed(2)).toBe('191.99');
  });
});
