/**
 * Webhook Altyapısı
 *
 * Event-driven webhook system for real-time order, product, and seller notifications.
 * Trendyol-compatible: supports CRUD, event types, retry logic, and delivery logs.
 *
 * Architecture:
 *   Event occurs (order created) → webhookService.dispatch('order.created', payload)
 *   → Find matching subscriptions → POST to each URL → Log result → Retry if needed
 */

import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';

// ─── Types ──────────────────────────────────────────────────────────────────

export type WebhookEventType =
  | 'order.created'
  | 'order.shipped'
  | 'order.delivered'
  | 'order.cancelled'
  | 'order.returned'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'seller.verified'
  | 'seller.suspended'
  | 'payout.completed'
  | 'return.created'
  | 'return.approved'
  | 'return.received'
  | 'invoice.created';

export const WEBHOOK_EVENT_LABELS: Record<WebhookEventType, string> = {
  'order.created': 'Sipariş Oluşturuldu',
  'order.shipped': 'Sipariş Kargolandı',
  'order.delivered': 'Sipariş Teslim Edildi',
  'order.cancelled': 'Sipariş İptal Edildi',
  'order.returned': 'Sipariş İade Edildi',
  'product.created': 'Ürün Oluşturuldu',
  'product.updated': 'Ürün Güncellendi',
  'product.deleted': 'Ürün Silindi',
  'seller.verified': 'Satıcı Onaylandı',
  'seller.suspended': 'Satıcı Askıya Alındı',
  'payout.completed': 'Ödeme Tamamlandı',
  'return.created': 'İade Talebi Oluşturuldu',
  'return.approved': 'İade Onaylandı',
  'return.received': 'İade Teslim Alındı',
  'invoice.created': 'Fatura Oluşturuldu',
};

export interface WebhookSubscription {
  id: string;
  /** Owner of this webhook (admin or sellerId) */
  ownerId: string;
  /** Display name */
  name: string;
  /** Target URL to POST events to */
  url: string;
  /** Events this webhook subscribes to */
  events: WebhookEventType[];
  /** Secret for HMAC-SHA256 signature verification */
  secret?: string;
  /** Whether this webhook is active */
  isActive: boolean;
  /** Custom headers to include in requests */
  headers?: Record<string, string>;
  /** Number of retries on failure (max 3) */
  maxRetries: number;
  /** Last delivery status */
  lastStatus?: 'success' | 'failed' | 'pending';
  /** Last delivery timestamp */
  lastDeliveryAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WebhookDeliveryLog {
  id: string;
  subscriptionId: string;
  eventType: WebhookEventType;
  url: string;
  status: 'success' | 'failed' | 'retrying';
  requestPayload: string;
  responseStatus?: number;
  responseBody?: string;
  errorMessage?: string;
  attempt: number;
  duration: number; // ms
  createdAt: string;
}

// ─── CRUD ───────────────────────────────────────────────────────────────────

const SUB_COL = 'webhookSubscriptions';
const LOG_COL = 'webhookDeliveryLogs';

export async function getWebhooks(ownerId?: string): Promise<WebhookSubscription[]> {
  try {
    const ref = collection(db, SUB_COL);
    const q = ownerId
      ? query(ref, where('ownerId', '==', ownerId))
      : ref;
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as WebhookSubscription));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, SUB_COL);
    return [];
  }
}

export async function createWebhook(
  data: Omit<WebhookSubscription, 'id' | 'createdAt'>,
): Promise<WebhookSubscription> {
  try {
    const sub: Omit<WebhookSubscription, 'id'> = {
      ...data,
      maxRetries: data.maxRetries ?? 3,
      createdAt: new Date().toISOString(),
    };
    const ref = await addDoc(collection(db, SUB_COL), sub);
    return { id: ref.id, ...sub };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, SUB_COL);
    throw error;
  }
}

export async function updateWebhook(id: string, data: Partial<WebhookSubscription>): Promise<void> {
  try {
    await updateDoc(doc(db, SUB_COL, id), { ...data, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${SUB_COL}/${id}`);
    throw error;
  }
}

export async function deleteWebhook(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, SUB_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${SUB_COL}/${id}`);
    throw error;
  }
}

export async function getDeliveryLogs(subscriptionId?: string, limit = 50): Promise<WebhookDeliveryLog[]> {
  try {
    const ref = collection(db, LOG_COL);
    const q = subscriptionId
      ? query(ref, where('subscriptionId', '==', subscriptionId))
      : ref;
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as WebhookDeliveryLog))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, LOG_COL);
    return [];
  }
}

// ─── Signature Generation ───────────────────────────────────────────────────

async function generateSignature(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Delivery Engine ────────────────────────────────────────────────────────

async function deliverToUrl(
  url: string,
  payload: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: string; duration: number }> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'BenimOlan-Webhook/1.0', ...headers },
      body: payload,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });
    const body = await res.text().catch(() => '');
    return { status: res.status, body: body.slice(0, 500), duration: Date.now() - start };
  } catch (err: any) {
    return { status: 0, body: err.message || 'Network error', duration: Date.now() - start };
  }
}

async function logDelivery(log: Omit<WebhookDeliveryLog, 'id' | 'createdAt'>): Promise<void> {
  try {
    await addDoc(collection(db, LOG_COL), { ...log, createdAt: new Date().toISOString() });
  } catch { /* non-critical */ }
}

async function retryWithBackoff(
  url: string,
  payload: string,
  headers: Record<string, string>,
  maxRetries: number,
  subscriptionId: string,
  eventType: WebhookEventType,
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
    await new Promise(r => setTimeout(r, delay));

    const result = await deliverToUrl(url, payload, headers);

    await logDelivery({
      subscriptionId, eventType, url, attempt,
      status: result.status >= 200 && result.status < 300 ? 'success' : 'retrying',
      requestPayload: payload.slice(0, 1000),
      responseStatus: result.status,
      responseBody: result.body,
      errorMessage: result.status === 0 ? result.body : undefined,
      duration: result.duration,
    });

    if (result.status >= 200 && result.status < 300) return true;
  }
  return false;
}

// ─── Main Dispatch ──────────────────────────────────────────────────────────

/**
 * Dispatch an event to all matching webhook subscriptions.
 * Called synchronously from the triggering code path.
 * Delivery is fire-and-forget (non-blocking).
 */
export async function dispatchWebhook(
  eventType: WebhookEventType,
  payload: Record<string, any>,
): Promise<{ delivered: number; failed: number }> {
  try {
    const all = await getWebhooks();
    const matching = all.filter(sub =>
      sub.isActive &&
      sub.events.includes(eventType) &&
      sub.url.startsWith('https://')
    );

    if (matching.length === 0) return { delivered: 0, failed: 0 };

    const payloadStr = JSON.stringify({
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    let delivered = 0;
    let failed = 0;

    // Fire all deliveries in parallel (non-blocking)
    const deliveries = matching.map(async sub => {
      const headers: Record<string, string> = { ...sub.headers };
      if (sub.secret) {
        headers['X-Webhook-Signature'] = await generateSignature(sub.secret, payloadStr);
      }

      const result = await deliverToUrl(sub.url, payloadStr, headers);
      const success = result.status >= 200 && result.status < 300;

      await logDelivery({
        subscriptionId: sub.id, eventType, url: sub.url,
        status: success ? 'success' : 'failed',
        requestPayload: payloadStr.slice(0, 1000),
        responseStatus: result.status,
        responseBody: result.body,
        errorMessage: !success ? `HTTP ${result.status}` : undefined,
        attempt: 1,
        duration: result.duration,
      });

      if (success) {
        delivered++;
        await updateDoc(doc(db, SUB_COL, sub.id), {
          lastStatus: 'success',
          lastDeliveryAt: new Date().toISOString(),
        });
      } else if (sub.maxRetries > 0) {
        const retrySuccess = await retryWithBackoff(
          sub.url, payloadStr, headers, sub.maxRetries, sub.id, eventType,
        );
        if (retrySuccess) {
          delivered++;
          await updateDoc(doc(db, SUB_COL, sub.id), {
            lastStatus: 'success',
            lastDeliveryAt: new Date().toISOString(),
          });
        } else {
          failed++;
          await updateDoc(doc(db, SUB_COL, sub.id), {
            lastStatus: 'failed',
            lastDeliveryAt: new Date().toISOString(),
          });
        }
      } else {
        failed++;
        await updateDoc(doc(db, SUB_COL, sub.id), {
          lastStatus: 'failed',
          lastDeliveryAt: new Date().toISOString(),
        });
      }
    });

    // Fire and forget
    Promise.all(deliveries).catch(() => {});

    return { delivered, failed };
  } catch (error) {
    console.error('[webhook] dispatch error:', error);
    return { delivered: 0, failed: 0 };
  }
}

/**
 * Test a webhook subscription by sending a ping event.
 */
export async function testWebhook(subscriptionId: string): Promise<{ success: boolean; status: number; body: string; duration: number }> {
  const all = await getWebhooks();
  const sub = all.find(s => s.id === subscriptionId);
  if (!sub) return { success: false, status: 0, body: 'Webhook not found', duration: 0 };

  const payload = JSON.stringify({
    event: 'ping',
    timestamp: new Date().toISOString(),
    data: { message: 'Benim Olan webhook testi — başarılı!' },
  });

  const headers: Record<string, string> = { ...sub.headers };
  if (sub.secret) {
    headers['X-Webhook-Signature'] = await generateSignature(sub.secret, payload);
  }

  const result = await deliverToUrl(sub.url, payload, headers);
  return {
    success: result.status >= 200 && result.status < 300,
    status: result.status,
    body: result.body,
    duration: result.duration,
  };
}
