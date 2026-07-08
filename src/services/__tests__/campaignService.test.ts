import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockGetDocs, mockSetDoc, mockUpdateDoc, mockDeleteDoc,
  mockDoc, mockCollection, mockQuery, mockWhere,
  mockHandleFirestoreError,
} = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockSetDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
  mockDoc: vi.fn(),
  mockCollection: vi.fn(),
  mockQuery: vi.fn(),
  mockWhere: vi.fn(),
  mockHandleFirestoreError: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  doc: mockDoc,
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
}));

vi.mock('../../lib/firebase', () => ({
  db: {},
  handleFirestoreError: mockHandleFirestoreError,
  OperationType: {
    CREATE: 'create', UPDATE: 'update', DELETE: 'delete',
    LIST: 'list', GET: 'get', WRITE: 'write',
  },
}));

vi.mock('../../mockData', () => ({
  MOCK_PRODUCTS: [],
}));

import {
  getCampaigns, getActiveCampaigns, createCampaign,
  updateCampaign, deleteCampaign, calcCampaignDiscount,
} from '../campaignService';
import type { Campaign } from '../../types';

beforeEach(() => {
  vi.clearAllMocks();
});

// ── helpers ──────────────────────────────────────────────────────────────────

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'camp-1',
    name: 'Summer Sale',
    discountType: 'percentage',
    discountValue: 15,
    targetType: 'all_products',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.000Z',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ── getCampaigns ─────────────────────────────────────────────────────────────

describe('getCampaigns', () => {
  it('returns all campaigns from Firestore', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [
        { id: 'c1', data: () => makeCampaign({ id: 'c1' }) },
        { id: 'c2', data: () => makeCampaign({ id: 'c2', name: 'Winter Sale' }) },
      ],
    });

    const result = await getCampaigns();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Summer Sale');
    expect(result[1].name).toBe('Winter Sale');
  });

  it('returns empty array when no campaigns exist', async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    const result = await getCampaigns();
    expect(result).toEqual([]);
  });

  it('returns empty array on Firestore error', async () => {
    mockGetDocs.mockRejectedValue(new Error('Firestore error'));
    const result = await getCampaigns();
    expect(result).toEqual([]);
    expect(mockHandleFirestoreError).toHaveBeenCalled();
  });
});

// ── getActiveCampaigns ───────────────────────────────────────────────────────

describe('getActiveCampaigns', () => {
  it('returns only campaigns active and within date range', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));

    // The mock simulates a Firestore query that has already filtered by
    // isActive === true via the `where` clause, so only active docs come back.
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'c1',
          data: () => makeCampaign({
            startDate: '2026-01-01T00:00:00.000Z',
            endDate: '2026-12-31T23:59:59.000Z',
          }),
        },
      ],
    });

    const result = await getActiveCampaigns();
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].id).toBe('camp-1');

    vi.useRealTimers();
  });

  it('excludes campaigns outside their date window', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));

    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'expired',
          data: () => makeCampaign({
            isActive: true,
            startDate: '2025-01-01T00:00:00.000Z',
            endDate: '2025-06-01T00:00:00.000Z',
          }),
        },
      ],
    });

    const result = await getActiveCampaigns();
    expect(result).toHaveLength(0);

    vi.useRealTimers();
  });

  it('returns empty array on Firestore error', async () => {
    mockGetDocs.mockRejectedValue(new Error('DB error'));
    const result = await getActiveCampaigns();
    expect(result).toEqual([]);
    expect(mockHandleFirestoreError).toHaveBeenCalled();
  });
});

// ── createCampaign ───────────────────────────────────────────────────────────

describe('createCampaign', () => {
  const validData = {
    name: 'Flash Sale',
    discountType: 'percentage' as const,
    discountValue: 25,
    targetType: 'all_products' as const,
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-06-30T23:59:59.000Z',
    isActive: true,
  };

  it('creates a campaign with generated id and createdAt', async () => {
    const result = await createCampaign(validData);

    expect(result).toMatchObject({
      name: 'Flash Sale',
      discountType: 'percentage',
      discountValue: 25,
    });
    expect(result.id).toMatch(/^campaign-/);
    expect(result).toHaveProperty('createdAt');
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
  });

  it('throws on Firestore error and calls handleFirestoreError', async () => {
    const err = new Error('Permission denied');
    mockSetDoc.mockRejectedValue(err);

    await expect(createCampaign(validData)).rejects.toThrow('Permission denied');
    expect(mockHandleFirestoreError).toHaveBeenCalled();
  });
});

// ── updateCampaign ───────────────────────────────────────────────────────────

describe('updateCampaign', () => {
  it('calls updateDoc with data and updatedAt timestamp', async () => {
    await updateCampaign('camp-1', { discountValue: 20 });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const [ref, payload] = mockUpdateDoc.mock.calls[0];
    expect(payload).toHaveProperty('discountValue', 20);
    expect(payload).toHaveProperty('updatedAt');
    expect(typeof payload.updatedAt).toBe('string');
  });

  it('throws on Firestore error', async () => {
    const err = new Error('Not found');
    mockUpdateDoc.mockRejectedValue(err);

    await expect(updateCampaign('camp-1', {})).rejects.toThrow('Not found');
    expect(mockHandleFirestoreError).toHaveBeenCalled();
  });
});

// ── deleteCampaign ───────────────────────────────────────────────────────────

describe('deleteCampaign', () => {
  it('calls deleteDoc with correct document reference', async () => {
    await deleteCampaign('camp-1');
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });

  it('throws on Firestore error', async () => {
    const err = new Error('Forbidden');
    mockDeleteDoc.mockRejectedValue(err);

    await expect(deleteCampaign('camp-1')).rejects.toThrow('Forbidden');
    expect(mockHandleFirestoreError).toHaveBeenCalled();
  });
});

// ── calcCampaignDiscount ─────────────────────────────────────────────────────

describe('calcCampaignDiscount', () => {
  it('returns 0 when there are no applicable campaigns', () => {
    const result = calcCampaignDiscount([], 100);
    expect(result).toBe(0);
  });

  it('returns the percentage discount for active campaigns', () => {
    const campaigns = [makeCampaign({ discountValue: 10 })];
    const result = calcCampaignDiscount(campaigns, 200);
    expect(result).toBe(20);
  });

  it('returns the fixed discount for fixed campaigns', () => {
    const campaigns = [makeCampaign({ discountType: 'fixed', discountValue: 30 })];
    const result = calcCampaignDiscount(campaigns, 200);
    expect(result).toBe(30);
  });

  it('caps discount at order total', () => {
    const campaigns = [makeCampaign({ discountType: 'fixed', discountValue: 100 })];
    const result = calcCampaignDiscount(campaigns, 50);
    expect(result).toBe(50);
  });

  it('picks the best discount from multiple applicable campaigns', () => {
    const campaigns = [
      makeCampaign({ discountValue: 10 }), // 10% = 20
      makeCampaign({ discountValue: 25 }), // 25% = 50
      makeCampaign({ discountType: 'fixed', discountValue: 10 }), // fixed $10
    ];
    const result = calcCampaignDiscount(campaigns, 200);
    expect(result).toBe(50); // best is 25% = 50
  });

  it('filters by minOrderAmount', () => {
    const campaigns = [makeCampaign({ minOrderAmount: 100 })];
    expect(calcCampaignDiscount(campaigns, 50)).toBe(0);
    expect(calcCampaignDiscount(campaigns, 100)).toBe(15); // 15% of 100
    expect(calcCampaignDiscount(campaigns, 200)).toBe(30); // 15% of 200
  });

  it('filters by category target type', () => {
    const campaigns = [
      makeCampaign({ targetType: 'category', targetValue: 'cat1', discountValue: 20 }),
    ];
    expect(calcCampaignDiscount(campaigns, 100, 'cat1')).toBe(20);
    expect(calcCampaignDiscount(campaigns, 100, 'cat2')).toBe(0);
  });

  it('filters by brand target type', () => {
    const campaigns = [
      makeCampaign({ targetType: 'brand', targetValue: 'brandX', discountValue: 15 }),
    ];
    expect(calcCampaignDiscount(campaigns, 100, undefined, 'brandX')).toBe(15);
    expect(calcCampaignDiscount(campaigns, 100, undefined, 'brandY')).toBe(0);
  });

  it('picks the highest discount when multiple campaigns apply', () => {
    const campaigns = [
      makeCampaign({ discountValue: 5 }),
      makeCampaign({ discountValue: 20 }),
      makeCampaign({ discountValue: 10 }),
    ];
    const result = calcCampaignDiscount(campaigns, 300);
    expect(result).toBe(60); // 20% of 300
  });
});
