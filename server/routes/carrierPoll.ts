// ─── Carrier Cron Routes — Entegi poll + delay check ──────────────────────────
// Protected by verifyCronSecret (T-05-03-04).
// POST /api/carrier/entegi/poll — poll Entegi tracking for shipped SubOrders
// POST /api/carrier/check-delays — find overdue SubOrders and send delay notifications

import type { Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { getTrackingStatus } from '../../src/services/cargoService.js';
import { transitionOrder } from '../services/transitionEngine.js';
import type { OrderSetStatus } from '../services/transitionEngine.js';
import {
  sendDeliveryConfirmationEmail,
  sendDelayNotificationEmail,
} from '../services/emailService.js';
import { logger } from '../logger.js';

type Middleware = (req: any, res: any, next: any) => any;

interface CarrierPollDeps {
  adminDb: Firestore | null;
  verifyCronSecret: Middleware;
}

export function registerCarrierPollRoutes(app: Express, deps: CarrierPollDeps): void {
  const { adminDb, verifyCronSecret } = deps;

  /**
   * POST /api/carrier/entegi/poll
   * Cron-triggered: polls Entegi tracking API for all shipped SubOrders.
   * Transitions delivered SubOrders and fires delivery confirmation emails.
   * Security: verifyCronSecret (T-05-03-04)
   */
  app.post('/api/carrier/entegi/poll', verifyCronSecret, async (_req: any, res: any) => {
    try {
      if (!adminDb) {
        return res.status(503).json({ error: 'Database not configured' });
      }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString();

      // Query shipped Entegi SubOrders within the last 30 days
      const subOrdersSnap = await adminDb
        .collection('subOrders')
        .where('carrier', '==', 'Entegi')
        .where('status', '==', 'shipped')
        .where('shippedAt', '>=', thirtyDaysAgo)
        .get();

      const results: Array<{ subOrderId: string; status: string; action: string }> = [];

      for (const doc of subOrdersSnap.docs) {
        const sub = doc.data();
        const subOrderId = doc.id;
        const trackingNumber: string = sub.trackingNumber ?? '';
        const orderSetId: string = sub.orderSetId ?? '';

        if (!trackingNumber) {
          results.push({ subOrderId, status: 'no_tracking', action: 'skipped' });
          continue;
        }

        try {
          const tracking = await getTrackingStatus('Entegi', trackingNumber);

          if (tracking.delivered) {
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
              results.push({
                subOrderId,
                status: tracking.currentStatus,
                action: 'already_terminal',
              });
              continue;
            }

            await doc.ref.update({
              status: transition.status,
              version: transition.version,
              deliveredAt: new Date().toISOString(),
              currentTrackingStatus: 'delivered',
              updatedAt: new Date().toISOString(),
            });

            // Non-blocking delivery email
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
                  logger.error('carrier', 'Poll: failed to fetch OrderSet for delivery email', {
                    error: e.message,
                  }),
                );
            }

            results.push({ subOrderId, status: 'delivered', action: 'transitioned' });
          } else {
            // Update tracking status cache only
            await doc.ref.update({
              currentTrackingStatus: tracking.currentStatus,
              updatedAt: new Date().toISOString(),
            });
            results.push({ subOrderId, status: tracking.currentStatus, action: 'updated' });
          }
        } catch (trackErr: any) {
          logger.error('carrier', 'Poll: tracking fetch failed', {
            subOrderId,
            error: trackErr.message,
          });
          results.push({ subOrderId, status: 'error', action: trackErr.message });
        }
      }

      logger.info('carrier', 'Entegi poll complete', { polled: subOrdersSnap.docs.length });
      return res.json({ polled: subOrdersSnap.docs.length, results });
    } catch (err: any) {
      logger.error('carrier', 'Entegi poll route failed', { error: err.message });
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/carrier/check-delays
   * Cron-triggered: finds shipped SubOrders past their estimatedDelivery and sends delay emails.
   * Security: verifyCronSecret (T-05-03-04)
   */
  app.post('/api/carrier/check-delays', verifyCronSecret, async (_req: any, res: any) => {
    try {
      if (!adminDb) {
        return res.status(503).json({ error: 'Database not configured' });
      }

      const now = new Date().toISOString();

      // Fetch all shipped SubOrders — filter in-memory for estimatedDelivery < now && no deliveredAt
      // (Firestore cannot cleanly combine < on string + missing field in a single compound query)
      const subOrdersSnap = await adminDb
        .collection('subOrders')
        .where('status', '==', 'shipped')
        .get();

      const overdue = subOrdersSnap.docs.filter((doc: any) => {
        const sub = doc.data();
        const estimated: string = sub.estimatedDelivery ?? '';
        const deliveredAt: string | undefined = sub.deliveredAt;
        return estimated && estimated < now && !deliveredAt;
      });

      let notified = 0;

      for (const doc of overdue) {
        const sub = doc.data();
        const orderSetId: string = sub.orderSetId ?? '';
        const carrier: string = sub.carrier ?? '';
        const estimatedDelivery: string = sub.estimatedDelivery ?? '';

        if (!orderSetId) continue;

        try {
          const osSnap = await adminDb.collection('orderSets').doc(orderSetId).get();
          if (!osSnap.exists) continue;

          const osData = osSnap.data()!;
          const customerEmail: string = osData.userEmail || '';
          const customerName: string = osData.userName || osData.userEmail || 'Müşteri';

          if (!customerEmail) continue;

          void sendDelayNotificationEmail(
            orderSetId,
            customerEmail,
            customerName,
            estimatedDelivery,
            carrier,
          );
          notified++;
        } catch (emailErr: any) {
          logger.error('carrier', 'Delay check: failed to process SubOrder', {
            subOrderId: doc.id,
            error: emailErr.message,
          });
        }
      }

      logger.info('carrier', 'Delay check complete', {
        checked: subOrdersSnap.docs.length,
        notified,
      });
      return res.json({ notified });
    } catch (err: any) {
      logger.error('carrier', 'Delay check route failed', { error: err.message });
      return res.status(500).json({ error: err.message });
    }
  });
}
