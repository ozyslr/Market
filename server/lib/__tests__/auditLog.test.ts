import { describe, it, expect, vi, beforeEach } from 'vitest';

// â”€â”€â”€ Mock firebase-admin modules BEFORE importing the module under test â”€â”€â”€â”€â”€

const mockCollectionFn = vi.fn();
const mockAddFn = vi.fn();

// Mock all firebase-admin sub-modules that firebase-admin.ts statically imports
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  cert: vi.fn(() => ({})),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: (...args: any[]) => {
      mockCollectionFn(...args);
      return { add: (...a: any[]) => mockAddFn(...a) };
    },
  })),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({})),
}));

// firebase-admin.js needs FIREBASE_SERVICE_ACCOUNT_B64 to initialize adminDb
// Set it before the module loads so adminDb is NOT null
process.env.FIREBASE_SERVICE_ACCOUNT_B64 = Buffer.from(
  JSON.stringify({
    type: 'service_account',
    project_id: 'test-project',
    private_key_id: 'test-key-id',
    private_key: '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----\n',
    client_email: 'test@test-project.iam.gserviceaccount.com',
    client_id: '123',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
  }),
).toString('base64');

// â”€â”€â”€ Now import the module under test â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import { logAudit, audit } from '../auditLog.js';
import type { AuditAction } from '../auditLog.js';

beforeEach(() => {
  vi.clearAllMocks();
  // Default: mock add resolves
  mockAddFn.mockResolvedValue({ id: 'audit-001' });
});

// â”€â”€â”€ logAudit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('logAudit', () => {
  it('writes a document to auditLogs collection with all required fields', async () => {
    const entry = {
      actorId: 'user-abc',
      actorEmail: 'admin@mercora.com',
      actorRole: 'admin',
      action: 'seller.approve' as AuditAction,
      entityType: 'seller',
      entityId: 'seller-xyz',
      entityLabel: 'Test Store',
      details: 'KYC approved',
    };

    await logAudit(entry);

    expect(mockCollectionFn).toHaveBeenCalledWith('auditLogs');
    expect(mockAddFn).toHaveBeenCalled();

    const docData = mockAddFn.mock.calls[0][0];
    expect(docData.actorId).toBe('user-abc');
    expect(docData.actorEmail).toBe('admin@mercora.com');
    expect(docData.actorRole).toBe('admin');
    expect(docData.action).toBe('seller.approve');
    expect(docData.entityType).toBe('seller');
    expect(docData.entityId).toBe('seller-xyz');
    expect(docData.entityLabel).toBe('Test Store');
    expect(docData.details).toBe('KYC approved');
    expect(docData.createdAt).toBeDefined();
    // createdAt must be an ISO string
    expect(docData.createdAt).toEqual(expect.stringContaining('T'));
    expect(new Date(docData.createdAt).toISOString()).toBe(docData.createdAt);
  });

  it('handles minimal entry fields', async () => {
    await logAudit({
      actorId: 'system',
      actorEmail: 'system@mercora',
      actorRole: 'admin',
      action: 'payout.process' as AuditAction,
      entityType: 'payout',
      entityId: 'payout-123',
    });

    expect(mockAddFn).toHaveBeenCalled();
    const docData = mockAddFn.mock.calls[0][0];
    expect(docData.actorId).toBe('system');
    expect(docData.entityLabel).toBeUndefined();
    expect(docData.details).toBeUndefined();
  });

  it('includes before/after fields for change tracking', async () => {
    await logAudit({
      actorId: 'user-001',
      actorEmail: 'dev@mercora.com',
      actorRole: 'admin',
      action: 'admin.role_change' as AuditAction,
      entityType: 'user',
      entityId: 'user-target',
      before: { role: 'buyer', adminRole: null },
      after: { role: 'admin', adminRole: 'support' },
    });

    expect(mockAddFn).toHaveBeenCalled();
    const docData = mockAddFn.mock.calls[0][0];
    expect(docData.before).toEqual({ role: 'buyer', adminRole: null });
    expect(docData.after).toEqual({ role: 'admin', adminRole: 'support' });
  });

  it('swallows errors and logs to console', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockAddFn.mockRejectedValueOnce(new Error('Firestore offline'));

    // Should not throw
    await logAudit({
      actorId: 'user-001',
      actorEmail: 'admin@mercora.com',
      actorRole: 'admin',
      action: 'cms.update' as AuditAction,
      entityType: 'cms',
      entityId: 'hero-banner',
    });

    expect(consoleSpy).toHaveBeenCalledWith('[audit] Failed to log:', 'cms.update', 'hero-banner');
    consoleSpy.mockRestore();
  });
});

// â”€â”€â”€ audit (fire-and-forget shorthand) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('audit', () => {
  it('calls logAudit with the correct mapped fields', async () => {
    audit(
      'user-002',
      'support@mercora.com',
      'support',
      'user.data_deletion' as AuditAction,
      'user',
      'user-del',
      'Deleted User',
      'GDPR data deletion request',
    );

    // fire-and-forget: give it a tick
    await vi.waitFor(
      () => {
        expect(mockAddFn).toHaveBeenCalled();
      },
      { timeout: 500 },
    );

    const docData = mockAddFn.mock.calls[0][0];
    expect(docData.actorId).toBe('user-002');
    expect(docData.actorEmail).toBe('support@mercora.com');
    expect(docData.actorRole).toBe('support');
    expect(docData.action).toBe('user.data_deletion');
    expect(docData.entityType).toBe('user');
    expect(docData.entityId).toBe('user-del');
    expect(docData.entityLabel).toBe('Deleted User');
    expect(docData.details).toBe('GDPR data deletion request');
  });

  it('uses entityId as fallback entityLabel when not provided', async () => {
    audit(
      'system',
      'system@mercora',
      'admin',
      'payout.complete' as AuditAction,
      'payout',
      'payout-456',
    );

    await vi.waitFor(
      () => {
        expect(mockAddFn).toHaveBeenCalled();
      },
      { timeout: 500 },
    );

    const docData = mockAddFn.mock.calls[0][0];
    expect(docData.entityLabel).toBe('payout-456');
  });

  it('never throws even when logAudit fails (fire-and-forget)', () => {
    mockAddFn.mockRejectedValue(new Error('Firestore unreachable'));

    // Should not throw
    expect(() => {
      audit('x', 'x@x.com', 'admin', 'category.create' as AuditAction, 'category', 'cat-1');
    }).not.toThrow();
  });
});

// â”€â”€â”€ AuditAction type check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('AuditAction union', () => {
  it('includes all mandated D-ADM-03 action members (compile-time check)', () => {
    // This is a compile-time type check â€” if any action literal doesn't match
    // AuditAction, the test file won't compile (TS error = test failure).
    const actions: AuditAction[] = [
      // Existing
      'product.approve',
      'product.reject',
      'product.delete',
      'seller.approve',
      'seller.reject',
      'seller.suspend',
      'seller.ban',
      'seller.activate',
      'order.status_change',
      'order.cancel',
      'user.suspend',
      'user.ban',
      'user.activate',
      'campaign.create',
      'campaign.update',
      'campaign.delete',
      'coupon.create',
      'coupon.update',
      'coupon.delete',
      'review.approve',
      'review.delete',
      'return.approve',
      'return.reject',
      'return.refund',
      'settings.update',
      'tier.update',
      'cms.update',
      'webhook.create',
      'webhook.update',
      'webhook.delete',
      'seed.data',
      // New D-ADM-03 additions
      'payout.process',
      'payout.complete',
      'admin.role_change',
      'user.data_deletion',
      'category.create',
      'category.update',
      'category.delete',
      'refund.process',
      'deal.create',
      'deal.update',
      'deal.delete',
    ];
    expect(actions).toHaveLength(42);
  });
});
