// ─── Carrier Webhook — EasyPost raw-body endpoint ─────────────────────────────
// MUST be registered BEFORE express.json() in server.ts (same as Stripe webhook).
// Security: HMAC-SHA256 verification via X-Hmac-Signature header (T-05-03-01)
// Dedup: two-phase processedWebhooks check + runTransaction (T-05-03-02)

import express from 'express';
import type { Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { transitionOrder } from '../services/transitionEngine.js';
import type { OrderSetStatus } from '../services/transitionEngine.js';
import { sendDeliveryConfirmationEmail } from '../services/emailService.js';
import { logger } from '../logger.js';

interface CarrierWebhookDeps {
  adminDb: Firestore | null;
}

/**
 * Validates EasyPost HMAC-SHA256 signature.
 * Returns false if lengths differ (guard against timing oracle) or digest mismatch.
 */
function validateEasyPostHmac(secret: string, signature: string, body: Buffer): boolean {
  if (!secret || !signature) return false;
  const digest = crypto.createHmac('sha256', secret).update(body).digest('hex');
  const sigBuffer = Buffer.from(signature, 'hex');
  const digestBuffer = Buffer.from(digest, 'hex');
  // Guard: timingSafeEqual requires equal-length buffers
  if (sigBuffer.length !== digestBuffer.length) return false;
  return crypto.timingSafeEqual(sigBuffer, digestBuffer);
}

export function registerCarrierWebhook(app: Express, deps: CarrierWebhookDeps): void {
  const { adminDb } = deps;

  app.post(
    '/api/carrier/easypost/webhook',
    express.raw({ type: 'application/json' }), // raw body — must be before express.json()
    async (req: any, res: any) => {
      try {
        // ── HMAC verification (T-05-03-01) ────────────────────────────────
        const secret = process.env.EASYPOST_WEBHOOK_SECRET ?? '';
        if (!secret) {
          logger.error('carrier', 'EASYPOST_WEBHOOK_SECRET not configured — webhook rejected');
          return res.status(500).json({ error: 'webhook not configured' });
        }
        const signature = (req.headers['x-hmac-signature'] as string) || '';
        if (!validateEasyPostHmac(secret, signature, req.body as Buffer)) {
          logger.warn('carrier', 'EasyPost webhook: invalid HMAC signature');
          return res.status(403).json({ error: 'invalid signature' });
        }

        // ── Parse event ────────────────────────────────────────────────────
        let event: any;
        try {
          event = JSON.parse((req.body as Buffer).toString());
        } catch {
          return res.status(400).json({ error: 'invalid JSON body' });
        }

        const eventId: string = event?.id ?? '';
        if (!eventId) {
          return res.status(400).json({ error: 'missing event id' });
        }

        if (!adminDb) {
          logger.warn('carrier', 'EasyPost webhook received but adminDb not configured');
          return res.status(200).json({ received: true });
        }

        // ── Two-phase dedup (T-05-03-02) ──────────────────────────────────
        const dedupRef = adminDb.collection('processedWebhooks').doc(eventId);
        const dedupSnap = await dedupRef.get();
        if (dedupSnap.exists) {
          logger.info('carrier', 'Duplicate EasyPost webhook ignored', { eventId });
          return res.status(200).json({ received: true, duplicate: true });
        }

        // ── Process inside transaction ─────────────────────────────────────
        await adminDb.runTransaction(async (txn: any) => {
          const snapTxn = await txn.get(dedupRef);
          if (snapTxn.exists) return; // race: already processed

          txn.set(dedupRef, {
            eventId,
            provider: 'easypost',
            processedAt: new Date().toISOString(),
          });

          // Extract tracking info from EasyPost event
          const result = event?.result ?? {};
          const trackingNumber: string = result?.tracking_code ?? result?.id ?? '';
          const trackingStatus: string = result?.status ?? '';
          const isDelivered =
            event?.description === 'tracker.updated' && trackingStatus === 'delivered';

          if (!trackingNumber) return;

          // Find the SubOrder by trackingNumber
          const subOrdersSnap = await txn.get(
            adminDb.collection('subOrders').where('trackingNumber', '==', trackingNumber),
          );

          for (const doc of subOrdersSnap.docs) {
            const sub = doc.data();
            const subOrderId = doc.id;
            const orderSetId: string = sub.orderSetId ?? '';

            if (isDelivered) {
              // Transition to delivered
              const currentVersion = (sub.version as number) || 0;
              let transition;
              try {
                transition = transitionOrder(
                  sub.status as OrderSetStatus,
                  'confirm_delivery',
                  currentVersion,
                );
              } catch {
                // Already delivered or invalid transition — skip
                continue;
              }

              txn.update(doc.ref, {
                status: transition.status,
                version: transition.version,
                deliveredAt: new Date().toISOString(),
                currentTrackingStatus: 'delivered',
                updatedAt: new Date().toISOString(),
              });

              // Non-blocking delivery confirmation email (fired after transaction)
              if (orderSetId) {
                adminDb
                  .collection('orderSets')
                  .doc(orderSetId)
                  .get()
                  .then((osSnap: any) => {
                    if (!osSnap.exists) return;
                    const osData = osSnap.data()!;
                    const customerEmail: string = osData.userEmail || '';
                    const customerName: string = osData.userName || osData.userEmail || 'Müşteri';
                    if (customerEmail) {
                      void sendDeliveryConfirmationEmail(orderSetId, customerEmail, customerName);
                    }
                  })
                  .catch((e: any) =>
                    logger.error('carrier', 'Failed to fetch OrderSet for delivery email', {
                      error: e.message,
                    }),
                  );
              }
            } else {
              // Update current tracking status cache
              txn.update(doc.ref, {
                currentTrackingStatus: trackingStatus,
                updatedAt: new Date().toISOString(),
              });
            }
          }
        });

        return res.status(200).json({ received: true });
      } catch (err: any) {
        logger.error('carrier', 'EasyPost webhook processing failed', { error: err.message });
        return res.status(500).json({ error: err.message });
      }
    },
  );
}
