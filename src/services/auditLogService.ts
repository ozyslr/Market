/**
 * Admin Audit Log Service
 *
 * Tracks all admin/seller actions for security and compliance.
 * Firestore collection: auditLogs
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── Types ──────────────────────────────────────────────────────────────────

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
  /** Who performed the action */
  actorId: string;
  actorEmail: string;
  actorRole: string;
  /** What was done */
  action: AuditAction;
  /** Target entity */
  entityType: string;
  entityId: string;
  entityLabel?: string;
  /** Details */
  details?: string;
  /** Before/after for changes */
  before?: Record<string, any>;
  after?: Record<string, any>;
  /** IP and user agent */
  metadata?: { ip?: string; userAgent?: string };
  createdAt: string;
}

const COL = 'auditLogs';

// ─── Logger ─────────────────────────────────────────────────────────────────

export async function logAudit(entry: Omit<AuditLogEntry, 'createdAt'>): Promise<void> {
  try {
    await addDoc(collection(db, COL), {
      ...entry,
      createdAt: new Date().toISOString(),
    });
  } catch {
    console.error('[audit] Failed to log:', entry.action, entry.entityId);
  }
}

/** Shorthand: log with minimal fields */
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

// ─── Query ──────────────────────────────────────────────────────────────────

export interface AuditFilter {
  actorId?: string;
  action?: AuditAction;
  entityType?: string;
  limit?: number;
}

export async function getAuditLogs(filter?: AuditFilter): Promise<AuditLogEntry[]> {
  try {
    const constraints: any[] = [orderBy('createdAt', 'desc'), limit(filter?.limit || 100)];
    if (filter?.actorId) constraints.unshift(where('actorId', '==', filter.actorId));
    if (filter?.action) constraints.unshift(where('action', '==', filter.action));
    if (filter?.entityType) constraints.unshift(where('entityType', '==', filter.entityType));

    const q = query(collection(db, COL), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLogEntry);
  } catch {
    return [];
  }
}

// ─── Action Labels ──────────────────────────────────────────────────────────

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  'product.approve': 'Ürün Onaylandı',
  'product.reject': 'Ürün Reddedildi',
  'product.delete': 'Ürün Silindi',
  'seller.approve': 'Satıcı Onaylandı',
  'seller.reject': 'Satıcı Reddedildi',
  'seller.suspend': 'Satıcı Askıya Alındı',
  'seller.ban': 'Satıcı Yasaklandı',
  'seller.activate': 'Satıcı Aktif Edildi',
  'order.status_change': 'Sipariş Durumu Değişti',
  'order.cancel': 'Sipariş İptal Edildi',
  'user.suspend': 'Kullanıcı Askıya Alındı',
  'user.ban': 'Kullanıcı Yasaklandı',
  'user.activate': 'Kullanıcı Aktif Edildi',
  'campaign.create': 'Kampanya Oluşturuldu',
  'campaign.update': 'Kampanya Güncellendi',
  'campaign.delete': 'Kampanya Silindi',
  'coupon.create': 'Kupon Oluşturuldu',
  'coupon.update': 'Kupon Güncellendi',
  'coupon.delete': 'Kupon Silindi',
  'review.approve': 'Yorum Onaylandı',
  'review.delete': 'Yorum Silindi',
  'return.approve': 'İade Onaylandı',
  'return.reject': 'İade Reddedildi',
  'return.refund': 'İade Geri Ödendi',
  'settings.update': 'Ayarlar Güncellendi',
  'tier.update': 'Kademe Güncellendi',
  'cms.update': 'CMS Güncellendi',
  'webhook.create': 'Webhook Oluşturuldu',
  'webhook.update': 'Webhook Güncellendi',
  'webhook.delete': 'Webhook Silindi',
  'seed.data': 'Demo Veri Yüklendi',
  'payout.process': 'Ödeme İşlendi',
  'payout.complete': 'Ödeme Tamamlandı',
  'admin.role_change': 'Yetki Değişikliği',
  'user.data_deletion': 'Veri Silme Talebi',
  'category.create': 'Kategori Oluşturuldu',
  'category.update': 'Kategori Güncellendi',
  'category.delete': 'Kategori Silindi',
  'refund.process': 'Geri Ödeme İşlendi',
  'deal.create': 'Fırsat Oluşturuldu',
  'deal.update': 'Fırsat Güncellendi',
  'deal.delete': 'Fırsat Silindi',
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  product: 'Ürün',
  seller: 'Satıcı',
  order: 'Sipariş',
  user: 'Kullanıcı',
  campaign: 'Kampanya',
  coupon: 'Kupon',
  review: 'Yorum',
  return: 'İade',
  settings: 'Ayarlar',
  tier: 'Kademe',
  cms: 'CMS',
  webhook: 'Webhook',
  payout: 'Ödeme',
  admin: 'Admin',
  category: 'Kategori',
  refund: 'İade/İptal',
  data: 'Veri',
  deal: 'Fırsat',
};
