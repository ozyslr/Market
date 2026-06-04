// ─── Shipping Route — POST .../ship ───────────────────────────────────────────
// Seller triggers label creation for a SubOrder.
// Flow: auth → ownership check → routeCarrierByRegion → createCargoShipment
//       → update SubOrder fields → transition to shipped → email (non-blocking)

import type { Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { routeCarrierByRegion, createCargoShipment } from '../../src/services/cargoService.js';
import type { ShipmentRequest } from '../../src/services/cargoService.js';
import { transitionOrder } from '../services/transitionEngine.js';
import type { OrderSetStatus } from '../services/transitionEngine.js';
import { sendShippingUpdateEmail } from '../services/emailService.js';
import { logger } from '../logger.js';

type Middleware = (req: any, res: any, next: any) => any;

interface ShippingRouteDeps {
  adminDb: Firestore | null;
  verifyFirebaseToken: Middleware;
  verifySeller: Middleware;
}

export function registerShippingRoutes(app: Express, deps: ShippingRouteDeps): void {
  const { adminDb, verifyFirebaseToken, verifySeller } = deps;

  /**
   * POST /api/orders/:orderSetId/subOrders/:subOrderId/ship
   * Seller creates a shipping label and marks the SubOrder as shipped.
   * Security: verifyFirebaseToken + verifySeller + sellerId ownership check (T-05-03-03)
   */
  app.post(
    '/api/orders/:orderSetId/subOrders/:subOrderId/ship',
    verifyFirebaseToken,
    verifySeller,
    async (req: any, res: any) => {
      const { orderSetId, subOrderId } = req.params;

      try {
        if (!adminDb) {
          return res.status(503).json({ error: 'Database not configured' });
        }

        // 1. Load SubOrder
        const subOrderRef = adminDb.collection('subOrders').doc(subOrderId);
        const subSnap = await subOrderRef.get();
        if (!subSnap.exists) {
          return res.status(404).json({ error: 'SubOrder not found' });
        }
        const subOrder = subSnap.data()!;

        // 2. Seller ownership check (T-05-03-03)
        if (subOrder.sellerId !== req.uid) {
          return res.status(403).json({ error: 'forbidden' });
        }

        // 3. Load parent OrderSet for shipping address and customer info
        const orderSetRef = adminDb.collection('orderSets').doc(orderSetId);
        const orderSetSnap = await orderSetRef.get();
        if (!orderSetSnap.exists) {
          return res.status(404).json({ error: 'OrderSet not found' });
        }
        const orderSet = orderSetSnap.data()!;
        const shippingAddress = orderSet.shippingAddress || {};

        // 4. Load seller profile for sender details
        const sellerSnap = await adminDb.collection('sellers').doc(req.uid).get();
        const seller = sellerSnap.exists ? sellerSnap.data()! : {};

        // 5. Route carrier by receiver country
        const country = shippingAddress.country || 'TR';
        const providerName = routeCarrierByRegion(country);

        // 6. Build ShipmentRequest
        const shipmentReq: ShipmentRequest = {
          orderId: subOrderId,
          senderName: seller.storeName || seller.name || 'Satıcı',
          senderAddress: seller.address || seller.storeAddress || 'Satıcı Adresi',
          senderCity: seller.city || 'Istanbul',
          senderPhone: seller.phone || seller.phoneNumber || '',
          receiverName: shippingAddress.fullName || orderSet.userName || 'Alıcı',
          receiverAddress: `${shippingAddress.line1 || ''}${shippingAddress.line2 ? ' ' + shippingAddress.line2 : ''}`,
          receiverCity: shippingAddress.city || '',
          receiverPhone: shippingAddress.phone || '',
          receiverCountry: country,
          packageCount: 1,
          totalWeight: 1,
          notes: `Order: ${orderSetId}`,
        };

        // 7. Create shipment via carrier provider
        const result = await createCargoShipment(providerName, shipmentReq);

        if (!result.success) {
          return res.status(502).json({ error: result.error || 'Carrier rejected shipment' });
        }

        // 8. Update SubOrder with tracking info
        const currentVersion = (subOrder.version as number) || 0;
        const transition = transitionOrder(
          subOrder.status as OrderSetStatus,
          'mark_shipped',
          currentVersion,
        );

        await subOrderRef.update({
          trackingNumber: result.trackingNumber,
          carrier: providerName,
          estimatedDelivery: result.estimatedDelivery ?? null,
          labelCost: result.labelCost ?? null,
          currentTrackingStatus: 'label_created',
          status: transition.status,
          version: transition.version,
          shippedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // 9. Non-blocking shipping update email
        const customerEmail: string = orderSet.userEmail || '';
        const customerName: string = orderSet.userName || orderSet.userEmail || 'Müşteri';
        if (customerEmail) {
          void sendShippingUpdateEmail(
            orderSetId,
            customerEmail,
            customerName,
            String(providerName),
            result.trackingNumber,
          );
        }

        logger.info('shipping', 'Shipment created', {
          orderSetId,
          subOrderId,
          trackingNumber: result.trackingNumber,
          provider: providerName,
        });

        return res.json({
          trackingNumber: result.trackingNumber,
          labelUrl: result.labelUrl ?? null,
          estimatedDelivery: result.estimatedDelivery ?? null,
        });
      } catch (err: any) {
        logger.error('shipping', 'Ship route failed', {
          error: err.message,
          orderSetId,
          subOrderId,
        });
        return res.status(err.statusCode ?? 500).json({ error: err.message });
      }
    },
  );
}
