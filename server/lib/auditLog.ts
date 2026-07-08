/**
 * Server-Side Audit Logger
 *
 * Writes admin action audit entries to the auditLogs Firestore collection
 * using firebase-admin SDK. Mirrors the client-side auditLogService API.
 *
 * All audit calls are fire-and-forget — never block the response on audit write.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { adminDb } from '../../src/lib/firebase-admin.js';

// ─── Types (mirrors client-side src/services/auditLogService.ts) ────────────

export type AuditAction =
  | 'product.approve'
  | 'product.reject'
  | 'product.delete'
  | 'seller.approve'
  | 'seller.reject'
  | 'seller.suspend'
  | 'seller.ban'
  | 'seller.activate'
  | 'order.status_change'
  | 'order.cancel'
  | 'user.suspend'
  | 'user.ban'
  | 'user.activate'
  | 'campaign.create'
  | 'campaign.update'
  | 'campaign.delete'
  | 'coupon.create'
  | 'coupon.update'
  | 'coupon.delete'
  | 'review.approve'
  | 'review.delete'
  | 'return.approve'
  | 'return.reject'
  | 'return.refund'
  | 'settings.update'
  | 'tier.update'
  | 'cms.update'
  | 'webhook.create'
  | 'webhook.update'
  | 'webhook.delete'
  | 'seed.data'
  // D-ADM-03 additions
  | 'payout.process'
  | 'payout.complete'
  | 'admin.role_change'
  | 'user.data_deletion'
  | 'category.create'
  | 'category.update'
  | 'category.delete'
  | 'refund.process'
  | 'deal.create'
  | 'deal.update'
  | 'deal.delete';

export interface AuditLogEntry {
  id?: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  details?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  metadata?: { ip?: string; userAgent?: string };
  createdAt: string;
}

const COL = 'auditLogs';

// ─── Logger ─────────────────────────────────────────────────────────────────

/**
 * Write an audit entry to Firestore using the admin SDK.
 * Errors are caught and logged — never throws.
 */
export async function logAudit(entry: Omit<AuditLogEntry, 'createdAt'>): Promise<void> {
  try {
    if (!adminDb) {
      console.error('[audit] adminDb not initialized — skipping audit log');
      return;
    }
    await (adminDb as Firestore).collection(COL).add({
      ...entry,
      createdAt: new Date().toISOString(),
    });
  } catch {
    console.error('[audit] Failed to log:', entry.action, entry.entityId);
  }
}

/**
 * Fire-and-forget shorthand. Calls logAudit() and catches any errors internally.
 * Safe to call inline without await — will never throw or block.
 */
export function audit(
  actorId: string,
  actorEmail: string,
  actorRole: string,
  action: AuditAction,
  entityType: string,
  entityId: string,
  entityLabel?: string,
  details?: string,
  before?: any,
  after?: any,
): void {
  logAudit({
    actorId,
    actorEmail,
    actorRole,
    action,
    entityType,
    entityId,
    entityLabel: entityLabel || entityId,
    details,
    before,
    after,
  }).catch(() => {});
}
