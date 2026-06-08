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
  approveSellerSchema,
} from '../lib/schemas.js';
import type { IPaymentProvider } from '../services/paymentProvider.js';
import { getOrderSet, transitionOrderSetStatus } from '../services/orderService.js';
import { recordEntry } from '../services/ledgerService.js';
import { confirmStock } from '../services/stockService.js';
import { sendOrderConfirmationEmail, sendNewSellerOrderEmail } from '../services/emailService.js';
import { hasAllRequiredDocs, type KycDocumentRef } from '../services/kycService.js';
import { validatePrices, type PriceCheckItem } from '../lib/priceValidator.js';

export interface IyzicoRouteDeps {
  /** Legacy lazy loader — kept for installment helper and legacy init. */
  getIyzico: () => Promise<any>;
  /** Marketplace payment provider (Task 2). */
  iyzicoProvider?: IPaymentProvider;
  adminDb: Firestore | null;
  port: number;
  verifyFirebaseToken?: (req: any, res: any, next: any) => void;
  verifyAdmin?: (req: any, res: any, next: any) => void;
}

export function registerIyzicoRoutes(app: Express, deps: IyzicoRouteDeps) {
  const { getIyzico, iyzicoProvider, adminDb, port: PORT, verifyFirebaseToken, verifyAdmin } = deps;

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

        // ── Server-side price validation (prevents client price manipulation) ──
        const priceCheckItems: PriceCheckItem[] = items.map((item: any) => ({
          productId: item.productId || item.id,
          quantity: item.quantity || 1,
          price: item.price / (item.quantity || 1), // unit price
        }));
        const priceCheck = await validatePrices(adminDb, priceCheckItems);
        if (!priceCheck.valid) {
          logger.warn('iyzico', 'Price validation failed', {
            reason: priceCheck.reason,
            clientTotal: priceCheck.clientTotal,
            serverTotal: priceCheck.serverTotal,
            orderSetId,
          });
          return res.status(400).json({
            error: 'Price mismatch detected. Please refresh and try again.',
            detail: priceCheck.reason,
          });
        }

        // ── Calculate total from items (server-authoritative pricing) ──
        const totalAmount = priceCheck.serverTotal;

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
            const transactions = verification.transactions as any[];
            const orderSetId: string | undefined =
              (body.basketId as string) || transactions?.[0]?.basketId;

            if (orderSetId && adminDb) {
              // ── Webhook dedup check (D-07) — idempotent processing ────────
              // Use paymentToken as eventId for dedup key (T-02-005)
              const eventId = token;
              const dedupRef = adminDb.collection('processedWebhooks').doc(eventId);
              const dedupSnap = await dedupRef.get();

              if (dedupSnap.exists) {
                // Already processed — return 200 immediately (idempotent)
                logger.info('iyzico', 'Duplicate webhook ignored', { eventId, orderSetId });
                return res.json({ status: 'success', duplicate: true });
              }

              // ── Atomic transaction: dedup marker + OrderSet transition + stock confirm (D-08) ──
              try {
                await adminDb.runTransaction(async (txn: any) => {
                  // 1. Re-check dedup inside transaction (avoid race)
                  const dedupSnapTxn = await txn.get(dedupRef);
                  if (dedupSnapTxn.exists) {
                    return; // Already processed by a concurrent request
                  }

                  // 2. Read and verify OrderSet is in pending/processing state
                  const orderSetRef = adminDb.collection('orderSets').doc(orderSetId);
                  const orderSetSnap = await txn.get(orderSetRef);

                  if (!orderSetSnap.exists) {
                    throw new Error(`OrderSet ${orderSetId} not found`);
                  }

                  const orderSetData = orderSetSnap.data()!;
                  const currentStatus = orderSetData.status as string;

                  // 3. Write dedup marker
                  txn.set(dedupRef, {
                    eventId,
                    provider: 'iyzico',
                    processedAt: new Date().toISOString(),
                    orderSetId,
                  });

                  // 4. Transition OrderSet status (only if still pending)
                  if (currentStatus === 'pending') {
                    const currentVersion = (orderSetData.version as number) || 0;
                    txn.update(orderSetRef, {
                      status: 'processing',
                      version: currentVersion + 1,
                      paymentStatus: 'paid',
                      updatedAt: new Date().toISOString(),
                    });
                  }

                  // 5. Update SubOrders with paymentTransactionId
                  const subOrderIds: string[] = orderSetData.subOrderIds || [];
                  for (const subOrderId of subOrderIds) {
                    const subRef = adminDb.collection('subOrders').doc(subOrderId);
                    const subSnap = await txn.get(subRef);
                    if (subSnap.exists) {
                      const subData = subSnap.data()!;
                      // Find matching transaction for this subOrder's items
                      const subItems: any[] = subData.items || [];
                      const matchingTx = transactions.find((tx: any) =>
                        subItems.some(
                          (item: any) => item.productId === tx.itemId || item.id === tx.itemId,
                        ),
                      );

                      const updateFields: Record<string, any> = {
                        status: 'processing',
                        updatedAt: new Date().toISOString(),
                      };
                      if (matchingTx?.paymentTransactionId) {
                        updateFields.paymentTransactionId = matchingTx.paymentTransactionId;
                      }
                      txn.update(subRef, updateFields);
                    }
                  }
                });

                // 6. Confirm stock for each item (outside main txn — non-critical, best effort)
                const orderSet = await getOrderSet(orderSetId);
                if (orderSet) {
                  const subOrders: any[] = (orderSet as any).subOrders ?? [];
                  const confirmPromises: Promise<any>[] = [];
                  for (const subOrder of subOrders) {
                    for (const item of subOrder.items || []) {
                      if (item.productId && item.quantity) {
                        confirmPromises.push(
                          confirmStock(adminDb, item.productId, item.quantity).catch((e: Error) => {
                            logger.warn('iyzico', 'confirmStock failed (non-critical)', {
                              productId: item.productId,
                              error: e.message,
                            });
                          }),
                        );
                      }
                    }
                  }
                  await Promise.all(confirmPromises);

                  // ── Send order confirmation + seller notification emails (non-blocking) ──
                  const orderSetData = orderSet as any;
                  const customerEmail: string = orderSetData.userEmail || '';
                  const customerName: string =
                    orderSetData.userName || orderSetData.userEmail || 'Müşteri';
                  const currency: string = orderSetData.currency || 'TRY';
                  const totalAmount: number = orderSetData.totalAmount || 0;
                  const shippingAddress: any = orderSetData.shippingAddress;

                  // Flatten items for order confirmation
                  const allItems: Array<{ name: string; quantity: number; price: number }> = [];
                  for (const sub of subOrders) {
                    for (const item of sub.items || []) {
                      allItems.push({
                        name: item.name || item.productId || 'Ürün',
                        quantity: item.quantity || 1,
                        price: item.price || item.subtotal || 0,
                      });
                    }
                  }

                  if (customerEmail) {
                    sendOrderConfirmationEmail(
                      orderSetId,
                      customerEmail,
                      customerName,
                      allItems,
                      totalAmount,
                      currency,
                      shippingAddress,
                    ).catch(() => {}); // already non-blocking inside, belt-and-suspenders
                  }

                  // Seller notifications — one per subOrder
                  if (adminDb) {
                    for (const sub of subOrders) {
                      const sellerId: string = sub.sellerId;
                      if (!sellerId) continue;
                      const sellerItems = (sub.items || []).map((i: any) => ({
                        name: i.name || i.productId || 'Ürün',
                        quantity: i.quantity || 1,
                      }));
                      const subTotal: number = (sub.items || []).reduce(
                        (s: number, i: any) => s + (i.subtotal || i.price || 0),
                        0,
                      );

                      // Fetch seller email asynchronously (best effort)
                      adminDb
                        .collection('users')
                        .doc(sellerId)
                        .get()
                        .then((snap: any) => {
                          const sellerData = snap.exists ? snap.data() : {};
                          const sellerEmail: string = sellerData?.email || '';
                          const sellerName: string =
                            sellerData?.displayName || sellerData?.storeName || 'Satıcı';
                          if (sellerEmail) {
                            sendNewSellerOrderEmail(
                              orderSetId,
                              sellerEmail,
                              sellerName,
                              sellerItems,
                              subTotal,
                              currency,
                            ).catch(() => {});
                          }
                        })
                        .catch(() => {}); // non-blocking
                    }
                  }
                }

                logger.info('iyzico', 'OrderSet transitioned to paid', { orderSetId });
              } catch (txnErr: any) {
                // Transaction failure — return 500 so iyzico retries (D-08)
                logger.error('iyzico', 'Callback transaction failed', {
                  error: txnErr.message,
                  orderSetId,
                });
                return res.status(500).json({ error: 'Processing failed — please retry' });
              }
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
        res.status(400).json({
          error: result.errorMessage || 'iyzico initialization failed',
          errorCode: result.errorCode,
        });
      }
    } catch (err: any) {
      logger.error('iyzico', 'Init error', { error: (err as Error).message });
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Admin: Approve TR seller — provision Iyzico sub-merchant ───────────
  // POST /api/admin/seller/:id/approve-tr (T-03-02, D-03)
  // Idempotent: checks iyzicoSubMerchantKey before calling subMerchantCreate (T-03-05).
  app.post(
    '/api/admin/seller/:id/approve-tr',
    ...(verifyAdmin ? [verifyAdmin] : []),
    validate(approveSellerSchema),
    async (req: any, res: any) => {
      if (!adminDb) return res.status(503).json({ error: 'DB not configured' });
      const sellerId = req.params.id;

      try {
        // Fetch application
        const appSnap = await adminDb.collection('sellerApplications').doc(sellerId).get();
        if (!appSnap.exists) {
          return res.status(404).json({ error: 'Application not found' });
        }
        const appData = appSnap.data() as any;
        const kycDocs: KycDocumentRef[] = appData.kycDocuments ?? [];

        // 3-doc gate (T-03-07)
        if (!hasAllRequiredDocs(kycDocs)) {
          return res.status(400).json({
            error:
              'All 3 KYC documents (identity, tax_certificate, bank_iban) must be uploaded before approval',
          });
        }

        // Idempotency guard (T-03-05)
        const sellerSnap = await adminDb.collection('sellers').doc(sellerId).get();
        const sellerData = sellerSnap.data() ?? {};
        if (sellerData.iyzicoSubMerchantKey) {
          logger.info('kyc', 'approve-tr: already provisioned', { sellerId });
          return res.json({
            alreadyProvisioned: true,
            subMerchantKey: sellerData.iyzicoSubMerchantKey,
          });
        }

        // Build sub-merchant request from application data
        const iyzico = await getIyzico();
        if (!iyzico) {
          return res.status(503).json({ error: 'iyzico not configured' });
        }

        const { subMerchantCreate } = await import('../iyzico.cjs');
        const applicationId = sellerId;
        const request = {
          locale: 'tr',
          conversationId: applicationId,
          subMerchantExternalId: sellerId,
          subMerchantType: 'PERSONAL',
          address: appData.address ?? 'TR',
          taxOffice: appData.taxId ? 'Vergi Dairesi' : undefined,
          taxNumber: appData.taxId ?? undefined,
          legalCompanyTitle: appData.storeName ?? '',
          email: appData.userEmail ?? '',
          gsmNumber: appData.phone ?? '',
          name: appData.storeName ?? '',
          iban: appData.bankIban ?? '',
          identityNumber: appData.taxId ?? '11111111111',
          currency: 'TRY',
        };

        const result = (await subMerchantCreate(iyzico.client, request)) as Record<string, unknown>;

        if (result.status !== 'success') {
          logger.error('kyc', 'Iyzico subMerchantCreate failed', {
            sellerId,
            errorMessage: result.errorMessage,
          });
          return res.status(502).json({
            error: (result.errorMessage as string) ?? 'Iyzico sub-merchant creation failed',
          });
        }

        const subMerchantKey = result.subMerchantKey as string;

        // Persist sub-merchant key + update application status
        await adminDb
          .collection('sellers')
          .doc(sellerId)
          .set(
            {
              iyzicoSubMerchantKey: subMerchantKey,
              iyzicoOnboardingStatus: 'complete',
              updatedAt: new Date().toISOString(),
            },
            { merge: true },
          );
        await adminDb
          .collection('sellerApplications')
          .doc(sellerId)
          .update({
            status: 'approved',
            reviewedAt: new Date().toISOString(),
            adminNote: req.body.adminNote ?? '',
          });

        logger.info('kyc', 'TR seller approved — Iyzico sub-merchant provisioned', {
          sellerId,
          subMerchantKey,
        });
        res.json({ subMerchantKey });
      } catch (err: any) {
        logger.error('kyc', 'approve-tr error', { error: err.message });
        res.status(500).json({ error: err.message });
      }
    },
  );

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
