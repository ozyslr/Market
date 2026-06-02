// ─── iyzico payment routes ───────────────────────────────────────────────────
// Marketplace checkout init (subMerchant splits), server-to-server callback
// (OrderSet transition), browser redirect callback, and installment options.
import express, { type Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { logger } from '../logger.js';
import { validate } from '../lib/validate.js';
import {
  iyzicoCallbackSchema,
  iyzicoInitSchema,
  iyzicoInstallmentsQuerySchema,
  iyzicoMarketplaceInitSchema,
} from '../lib/schemas.js';
import type { IPaymentProvider } from '../services/paymentProvider.js';
import { getOrderSet, transitionOrderSetStatus } from '../services/orderService.js';
import { recordEntry } from '../services/ledgerService.js';

export interface IyzicoRouteDeps {
  /** Legacy lazy loader — kept for installment helper and legacy init. */
  getIyzico: () => Promise<any>;
  /** Marketplace payment provider (Task 2). */
  iyzicoProvider?: IPaymentProvider;
  adminDb: Firestore | null;
  port: number;
  verifyFirebaseToken?: (req: any, res: any, next: any) => void;
}

export function registerIyzicoRoutes(app: Express, deps: IyzicoRouteDeps) {
  const { getIyzico, iyzicoProvider, adminDb, port: PORT, verifyFirebaseToken } = deps;

  // ─── Marketplace init (new OrderSet-based flow) ───────────────────────────
  app.post(
    '/api/iyzico/marketplace-init',
    ...(verifyFirebaseToken ? [verifyFirebaseToken] : []),
    validate(iyzicoMarketplaceInitSchema),
    async (req: any, res: any) => {
      try {
        if (!iyzicoProvider) {
          return res.status(503).json({ error: 'iyzicoProvider not configured' });
        }
        if (!adminDb) {
          return res.status(503).json({ error: 'Database not configured' });
        }

        const {
          orderSetId,
          userId,
          userEmail,
          userName,
          buyerPhone,
          currency,
          installment,
          shippingAddress,
          items,
        } = req.body;

        // ── Verify OrderSet exists and is in pending status (T-02-001) ──────
        const orderSet = await getOrderSet(orderSetId);
        if (!orderSet) {
          return res.status(404).json({ error: `OrderSet ${orderSetId} not found` });
        }
        const orderSetStatus = (orderSet as any).status as string;
        if (orderSetStatus !== 'pending') {
          return res.status(409).json({
            error: `OrderSet is in status '${orderSetStatus}' — only 'pending' can initiate checkout`,
          });
        }

        // ── Calculate total from items (server-authoritative pricing T-02-001) ──
        const totalAmount = items.reduce((sum: number, item: any) => sum + item.price, 0);

        // ── Record pending commission entries in ledger (D-05) ──────────────
        // Group items by seller to build per-subOrder commission entries
        const sellerCommissions = new Map<
          string,
          { subOrderId: string; commission: number; sellerId: string }
        >();
        const subOrders: any[] = (orderSet as any).subOrders || [];

        for (const item of items) {
          const sellerId = item.sellerId;
          if (!sellerId) continue;

          const commissionAmount = item.price - item.subMerchantPrice;
          if (commissionAmount <= 0) continue;

          if (!sellerCommissions.has(sellerId)) {
            // Find matching subOrder for this seller
            const subOrder = subOrders.find((s: any) => s.sellerId === sellerId);
            sellerCommissions.set(sellerId, {
              subOrderId: subOrder?.id ?? '',
              commission: 0,
              sellerId,
            });
          }
          const entry = sellerCommissions.get(sellerId)!;
          entry.commission += commissionAmount;
        }

        // Write pending commission entries
        const ledgerPromises: Promise<any>[] = [];
        for (const [, entry] of sellerCommissions) {
          if (entry.commission > 0 && entry.subOrderId) {
            ledgerPromises.push(
              recordEntry(adminDb, {
                orderSetId,
                subOrderId: entry.subOrderId,
                sellerId: entry.sellerId,
                type: 'commission',
                amount: -entry.commission, // negative: deducted from seller
                currency: currency || 'TRY',
                reference: '',
                reason: 'marketplace_checkout_pending',
                createdBy: 'system',
              }),
            );
          }
        }
        await Promise.all(ledgerPromises);

        // ── Call IyzicoProvider.initCheckout() ───────────────────────────────
        const callbackUrl = `${req.protocol}://${req.get('host')}/api/iyzico/callback`;

        const result = await iyzicoProvider.initCheckout({
          orderSetId,
          totalAmount,
          currency: currency || 'TRY',
          items: items.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            subMerchantKey: item.subMerchantKey,
            subMerchantPrice: item.subMerchantPrice,
            category: item.category,
            sellerId: item.sellerId,
            categoryId: item.categoryId,
          })),
          buyer: {
            id: userId,
            email: userEmail,
            name: userName,
            phone: buyerPhone || '+905555555555',
          },
          shippingAddress: shippingAddress as Record<string, unknown>,
          callbackUrl,
          installment,
        });

        res.json({
          token: result.token,
          paymentPageUrl: result.paymentPageUrl,
          checkoutFormContent: result.checkoutFormContent,
        });
      } catch (err: any) {
        logger.error('iyzico', 'Marketplace init error', { error: (err as Error).message });
        res.status(500).json({ error: err.message });
      }
    },
  );

  // ─── Server-to-server callback (raw body) ────────────────────────────────
  app.post(
    '/api/iyzico/callback',
    express.raw({ type: 'application/json' }),
    async (req: any, res: any) => {
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const token = body?.token as string | undefined;
        if (!token) {
          return res.status(400).json({ error: 'Missing token' });
        }

        // ── Verify payment via IyzicoProvider (T-02-002: server verifies, not client) ──
        if (iyzicoProvider) {
          const verification = await iyzicoProvider.verifyPayment(token);

          if (verification.status === 'SUCCESS' || verification.status === 'success') {
            // Determine orderSetId from transactions (basketId / conversationId)
            const transactions = verification.transactions as any[];
            const orderSetId: string | undefined =
              (body.basketId as string) || transactions?.[0]?.basketId;

            if (orderSetId && adminDb) {
              // Transition OrderSet to paid
              try {
                await transitionOrderSetStatus(orderSetId, 'payment_received');
              } catch (e) {
                logger.warn('iyzico', 'OrderSet transition failed (may already be paid)', {
                  orderSetId,
                  error: (e as Error).message,
                });
              }

              // Store paymentTransactionId on each SubOrder
              for (const tx of transactions) {
                const subOrderId = tx.subMerchantKey
                  ? undefined // subMerchantKey identifies seller, not subOrder; skip for now
                  : undefined;
                if (tx.paymentTransactionId && tx.itemId) {
                  // Find the subOrder that has this item and update it
                  const orderSet = await getOrderSet(orderSetId);
                  const subOrders: any[] = (orderSet as any)?.subOrders ?? [];
                  for (const subOrder of subOrders) {
                    const hasItem = (subOrder.items || []).some(
                      (it: any) => it.productId === tx.itemId || it.id === tx.itemId,
                    );
                    if (hasItem) {
                      await adminDb.collection('subOrders').doc(subOrder.id).update({
                        paymentTransactionId: tx.paymentTransactionId,
                        updatedAt: new Date().toISOString(),
                      });
                    }
                  }
                }
                void subOrderId; // suppress unused var
              }

              logger.info('iyzico', 'OrderSet transitioned to paid', { orderSetId });
            }

            return res.json({ status: 'success', paymentStatus: verification.status });
          } else {
            // Payment failed — update orderSet paymentStatus
            const orderSetId = body.basketId as string | undefined;
            if (orderSetId && adminDb) {
              await adminDb.collection('orderSets').doc(orderSetId).update({
                paymentStatus: 'failed',
                updatedAt: new Date().toISOString(),
              });
            }
            return res.json({ status: 'failure', paymentStatus: verification.status });
          }
        }

        // ── Legacy fallback (no iyzicoProvider) ─────────────────────────────
        const iyzico = await getIyzico();
        if (!iyzico) {
          return res.status(503).json({ error: 'iyzico not configured' });
        }
        const result = await iyzico.retrieveCheckoutForm(iyzico.client, { locale: 'tr', token });
        res.json({ status: result.status, paymentStatus: result.paymentStatus });
      } catch (err: any) {
        logger.error('iyzico', 'Callback error', { error: (err as Error).message });
        res.status(500).json({ error: err.message });
      }
    },
  );

  // ─── Browser redirect callback (user lands here after payment) ──────────
  app.get('/api/iyzico/callback', async (req: any, res: any) => {
    const token = req.query.token as string;
    const frontendUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    if (!token) {
      return res.redirect(`${frontendUrl}/checkout?iyzico_status=error&reason=missing_token`);
    }
    try {
      const iyzico = await getIyzico();
      if (!iyzico) {
        return res.redirect(`${frontendUrl}/checkout?iyzico_status=error&reason=not_configured`);
      }
      const result = await iyzico.retrieveCheckoutForm(iyzico.client, { locale: 'tr', token });
      const orderSetId = (result.basketId || '') as string;
      if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
        res.redirect(
          `${frontendUrl}/checkout?iyzico_status=success&orderSetId=${orderSetId}&token=${token}`,
        );
      } else {
        res.redirect(
          `${frontendUrl}/checkout?iyzico_status=failed&orderSetId=${orderSetId}&reason=${result.errorMessage || 'payment_failed'}`,
        );
      }
    } catch (err: any) {
      res.redirect(
        `${frontendUrl}/checkout?iyzico_status=error&reason=${encodeURIComponent(err.message)}`,
      );
    }
  });

  // ─── Legacy init (kept for backwards compatibility) ──────────────────────
  app.post('/api/iyzico/init', validate(iyzicoInitSchema), async (req: any, res: any) => {
    try {
      const iyzico = await getIyzico();
      if (!iyzico) {
        return res.status(503).json({ error: 'iyzico not configured', isMock: true });
      }

      const {
        userId,
        userEmail,
        userName,
        total,
        currency,
        installment,
        orderId,
        items,
        shippingAddress,
        buyerPhone,
      } = req.body;

      const basketItems = (items || []).map((item: any, i: number) => ({
        id: item.productId || String(i),
        name: item.name,
        category1: item.category || 'General',
        itemType: 'PHYSICAL',
        price: String(item.price),
      }));

      const request = {
        locale: 'tr',
        conversationId: orderId,
        price: String(total),
        paidPrice: String(total),
        currency: currency === 'TRY' ? 'TRY' : 'GBP',
        installment: String(installment || 1),
        basketId: orderId,
        paymentGroup: 'PRODUCT',
        callbackUrl: `${req.protocol}://${req.get('host')}/api/iyzico/callback`,
        buyer: {
          id: userId,
          name: userName?.split(' ')[0] || 'Buyer',
          surname: userName?.split(' ').slice(1).join(' ') || 'Unknown',
          gsmNumber: buyerPhone || '+905555555555',
          email: userEmail,
          identityNumber: '11111111111',
          registrationAddress: shippingAddress?.line1 || 'Address',
          city: shippingAddress?.city || 'Istanbul',
          country: shippingAddress?.country || 'Turkey',
        },
        shippingAddress: {
          contactName: shippingAddress?.fullName || userName,
          city: shippingAddress?.city || 'Istanbul',
          country: shippingAddress?.country || 'Turkey',
          address: shippingAddress?.line1 || 'Address',
        },
        billingAddress: {
          contactName: shippingAddress?.fullName || userName,
          city: shippingAddress?.city || 'Istanbul',
          country: shippingAddress?.country || 'Turkey',
          address: shippingAddress?.line1 || 'Address',
        },
        basketItems,
      };

      const result = await iyzico.createCheckoutForm(iyzico.client, request);

      if (result.status === 'success') {
        res.json({
          token: result.token,
          checkoutFormContent: result.checkoutFormContent,
          paymentPageUrl: result.paymentPageUrl,
        });
      } else {
        res
          .status(400)
          .json({
            error: result.errorMessage || 'iyzico initialization failed',
            errorCode: result.errorCode,
          });
      }
    } catch (err: any) {
      logger.error('iyzico', 'Init error', { error: (err as Error).message });
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Installment options ─────────────────────────────────────────────────
  app.get('/api/iyzico/installments', async (req: any, res: any) => {
    try {
      const iyzico = await getIyzico();
      if (!iyzico) {
        return res.json({ installments: [] });
      }

      const { bin, amount } = req.query;
      const request: any = { locale: 'tr' };
      if (bin) request.binNumber = String(bin);
      if (amount) request.price = String(amount);

      const result = await iyzico.getInstallmentOptions(iyzico.client, request);

      if (result.status === 'success') {
        res.json({ installments: result.installmentDetails || [] });
      } else {
        res.json({ installments: [] });
      }
    } catch (err: any) {
      logger.error('iyzico', 'Installments error', { error: (err as Error).message });
      res.json({ installments: [] });
    }
  });
}
