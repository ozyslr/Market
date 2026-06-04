import { describe, it, expect, vi, beforeEach } from 'vitest';

const getDocsMock = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  getDocs: (...args: any[]) => getDocsMock(...args),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
  handleFirestoreError: vi.fn(),
  OperationType: { LIST: 'LIST' },
}));

import { getSellerStarSummary } from './sellerRatingService';

function snapOf(reviews: any[]) {
  return { docs: reviews.map((r, i) => ({ id: r.id || `r${i}`, data: () => r })) };
}

describe('getSellerStarSummary', () => {
  beforeEach(() => {
    getDocsMock.mockReset();
  });

  it('aggregates approved reviews into average, total, and distribution', async () => {
    getDocsMock.mockResolvedValue(
      snapOf([
        { rating: 5, status: 'approved' },
        { rating: 4, status: 'approved' },
        { rating: 3, status: 'approved' },
      ]),
    );
    const summary = await getSellerStarSummary('seller-1');
    expect(summary.average).toBe(4);
    expect(summary.total).toBe(3);
    expect(summary.distribution).toMatchObject({ 5: 1, 4: 1, 3: 1, 2: 0, 1: 0 });
  });

  it('returns zeros when the seller has no reviews', async () => {
    getDocsMock.mockResolvedValue(snapOf([]));
    const summary = await getSellerStarSummary('seller-1');
    expect(summary.average).toBe(0);
    expect(summary.total).toBe(0);
    expect(summary.distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  });

  it('excludes non-approved (pending) reviews from the summary', async () => {
    getDocsMock.mockResolvedValue(
      snapOf([
        { rating: 5, status: 'approved' },
        { rating: 1, status: 'pending' },
      ]),
    );
    const summary = await getSellerStarSummary('seller-1');
    expect(summary.total).toBe(1);
    expect(summary.average).toBe(5);
    expect(summary.distribution[1]).toBe(0);
  });

  it('degrades gracefully (zeros, no throw) on a Firestore error', async () => {
    getDocsMock.mockRejectedValue(new Error('firestore boom'));
    const summary = await getSellerStarSummary('seller-1');
    expect(summary).toEqual({
      average: 0,
      total: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  });
});
