// ─── Webhook Delivery Service ──────────────────────────────────────────────────
// Fire-and-forget webhook delivery with HMAC-SHA256 signatures, exponential
// backoff retry (1s, 5s, 25s), 10s per-attempt timeout, and delivery logging
// to the 'webhookDeliveries' Firestore collection.

import { createHmac, randomBytes } from 'crypto';
import type { Firestore } from 'firebase-admin/firestore';

// ─── Types ──────────────────────────────────────────────────────────────────

export type WebhookEventType = 'order.created' | 'order.updated' | 'product.updated';

export interface SellerWebhook {
  id: string;
  sellerId: string;
  url: string;
  events: WebhookEventType[];
  secret: string; // HMAC secret generated at registration time
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryLog {
  webhookId: string;
  sellerId: string;
  event: WebhookEventType;
  url: string;
  statusCode: number | null;
  success: boolean;
  attempt: number;
  error: string | null;
  requestBody: string; // JSON payload sent
  responseBody: string | null;
  durationMs: number;
  createdAt: string;
}

const WEBHOOKS_COLLECTION = 'sellerWebhooks';
const DELIVERIES_COLLECTION = 'webhookDeliveries';

const RETRY_DELAYS_MS = [1000, 5000, 25000]; // 1s, 5s, 25s
const MAX_RETRIES = RETRY_DELAYS_MS.length;
const DELIVERY_TIMEOUT_MS = 10_000;

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateSecret(): string {
  return randomBytes(32).toString('hex');
}

function computeSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Webhook CRUD ───────────────────────────────────────────────────────────

export async function createWebhook(
  db: Firestore,
  sellerId: string,
  url: string,
  events: WebhookEventType[],
): Promise<SellerWebhook> {
  const now = new Date().toISOString();
  const secret = generateSecret();
  const doc: Omit<SellerWebhook, 'id'> = {
    sellerId,
    url,
    events,
    secret,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await db.collection(WEBHOOKS_COLLECTION).add(doc);
  return { id: ref.id, ...doc };
}

export async function getWebhooks(db: Firestore, sellerId: string): Promise<SellerWebhook[]> {
  const snap = await db.collection(WEBHOOKS_COLLECTION).where('sellerId', '==', sellerId).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SellerWebhook);
}

export async function deleteWebhook(
  db: Firestore,
  webhookId: string,
  sellerId: string,
): Promise<boolean> {
  const ref = db.collection(WEBHOOKS_COLLECTION).doc(webhookId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const data = snap.data()!;
  if (data.sellerId !== sellerId) return false;
  await ref.delete();
  return true;
}

export async function getWebhooksByEvent(
  db: Firestore,
  sellerId: string,
  event: WebhookEventType,
): Promise<SellerWebhook[]> {
  const snap = await db
    .collection(WEBHOOKS_COLLECTION)
    .where('sellerId', '==', sellerId)
    .where('events', 'array-contains', event)
    .where('isActive', '==', true)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SellerWebhook);
}

// ─── Delivery ───────────────────────────────────────────────────────────────

async function logDelivery(
  db: Firestore,
  log: Omit<WebhookDeliveryLog, 'createdAt'>,
): Promise<void> {
  try {
    await db.collection(DELIVERIES_COLLECTION).add({
      ...log,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Delivery logging failure is non-blocking
    console.warn('[webhookService] Failed to write delivery log');
  }
}

/**
 * Attempt a single HTTP POST delivery to the webhook URL.
 * Returns the HTTP status code, or null if the request failed to connect.
 */
async function attemptDelivery(
  url: string,
  payload: string,
  signature: string,
): Promise<{ statusCode: number | null; responseBody: string | null; error: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BenimOlan-Webhook-Signature': `sha256=${signature}`,
        'X-BenimOlan-Webhook-Id': randomBytes(8).toString('hex'),
        'User-Agent': 'BenimOlan-Webhook/1.0',
      },
      body: payload,
      signal: controller.signal,
    });

    clearTimeout(timer);
    let responseBody: string | null = null;
    try {
      responseBody = await response.text();
      // Truncate long responses for logging
      if (responseBody && responseBody.length > 2000) {
        responseBody = responseBody.slice(0, 2000);
      }
    } catch {
      // ignore body read errors
    }

    return {
      statusCode: response.status,
      responseBody,
      error: response.ok ? null : `HTTP ${response.status}`,
    };
  } catch (err: any) {
    clearTimeout(timer);
    const message =
      err.name === 'AbortError' ? 'Request timed out' : err.message || 'Unknown error';
    return { statusCode: null, responseBody: null, error: message };
  }
}

/**
 * Deliver a webhook with retry logic. Logs each attempt to Firestore.
 * Returns true if any attempt succeeded.
 */
export async function deliverWebhook(
  db: Firestore,
  webhook: SellerWebhook,
  event: WebhookEventType,
  payload: Record<string, unknown>,
): Promise<boolean> {
  const payloadStr = JSON.stringify(payload);
  const signature = computeSignature(payloadStr, webhook.secret);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const startMs = Date.now();
    const { statusCode, responseBody, error } = await attemptDelivery(
      webhook.url,
      payloadStr,
      signature,
    );
    const durationMs = Date.now() - startMs;

    const success = statusCode !== null && statusCode >= 200 && statusCode < 300;

    // Log every attempt
    await logDelivery(db, {
      webhookId: webhook.id,
      sellerId: webhook.sellerId,
      event,
      url: webhook.url,
      statusCode,
      success,
      attempt: attempt + 1,
      error,
      requestBody: payloadStr,
      responseBody,
      durationMs,
    });

    if (success) return true;

    // Don't sleep after the last attempt
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAYS_MS[attempt] || 25000;
      console.warn(
        `[webhookService] Delivery attempt ${attempt + 1} failed for webhook ${webhook.id} ` +
          `(event: ${event}): ${error}. Retrying in ${delay}ms...`,
      );
      await sleep(delay);
    }
  }

  console.error(
    `[webhookService] All ${MAX_RETRIES + 1} delivery attempts failed for webhook ${webhook.id} (event: ${event})`,
  );
  return false;
}

/**
 * Trigger webhooks for a seller + event type. Fire-and-forget — does not block
 * the caller or throw on failure.
 */
export function triggerWebhooks(
  db: Firestore,
  sellerId: string,
  event: WebhookEventType,
  payload: Record<string, unknown>,
): void {
  getWebhooksByEvent(db, sellerId, event)
    .then((webhooks) => {
      if (webhooks.length === 0) return;
      // Fire all deliveries in parallel (fire-and-forget per webhook)
      for (const webhook of webhooks) {
        deliverWebhook(db, webhook, event, payload).catch((err) => {
          console.error(
            `[webhookService] Unexpected delivery error for webhook ${webhook.id}:`,
            (err as Error).message,
          );
        });
      }
    })
    .catch((err) => {
      console.error('[webhookService] Failed to fetch webhooks:', (err as Error).message);
    });
}

/**
 * Trigger webhooks for multiple sellers at once. Used after an order containing
 * items from multiple sellers is created.
 */
export function triggerWebhooksForSellers(
  db: Firestore,
  sellerIds: string[],
  event: WebhookEventType,
  payload: Record<string, unknown>,
): void {
  for (const sellerId of sellerIds) {
    triggerWebhooks(db, sellerId, event, payload);
  }
}
