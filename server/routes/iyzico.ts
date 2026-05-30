// ─── iyzico payment routes ───────────────────────────────────────────────────
// Server-to-server callback (raw body / signature), browser redirect callback,
// checkout-form init, and installment options. Extracted verbatim from
// server.ts. Behavior unchanged.
import express, { type Express } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';

export interface IyzicoRouteDeps {
  getIyzico: () => Promise<any>;
  adminDb: Firestore | null;
  port: number;
}

export function registerIyzicoRoutes(app: Express, deps: IyzicoRouteDeps) {
  const { getIyzico, adminDb, port: PORT } = deps;

  // iyzico callback requires raw body (signature verification)
  app.post(
    "/api/iyzico/callback",
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      try {
        const iyzico = await getIyzico();
        if (!iyzico) {
          return res.status(503).json({ error: 'iyzico not configured' });
        }
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const token = body.token;
        if (!token) {
          return res.status(400).json({ error: 'Missing token' });
        }

        const result = await iyzico.retrieveCheckoutForm(iyzico.client, {
          locale: 'tr',
          token,
        });

        if (result.status === 'success') {
          const orderId = result.basketId;
          if (orderId && adminDb) {
            const orderRef = adminDb.collection('orders').doc(orderId);
            await orderRef.update({
              status: result.paymentStatus === 'SUCCESS' ? 'paid' : 'pending',
              paymentStatus: result.paymentStatus === 'SUCCESS' ? 'succeeded' : 'failed',
              iyzicoPaymentToken: token,
              paidAt: result.paymentStatus === 'SUCCESS' ? new Date().toISOString() : null,
              updatedAt: new Date().toISOString(),
            });

            // On success, decrease stock (atomik + idempotent) and send email
            if (result.paymentStatus === 'SUCCESS') {
              let orderData: any;
              try {
                await adminDb.runTransaction(async (tx) => {
                  const oSnap = await tx.get(orderRef);
                  const oData = oSnap.data();
                  orderData = oData;
                  // stockDecremented bayrağı set ise callback tekrar geldi → atla
                  if (!oData || oData.stockDecremented) return;
                  const orderItems = oData.items || [];
                  const refs = orderItems.map((it: any) => adminDb!.collection('products').doc(it.productId));
                  const snaps = await Promise.all(refs.map((r: any) => tx.get(r)));
                  orderItems.forEach((it: any, idx: number) => {
                    const available = snaps[idx].data()?.stock ?? 0;
                    tx.update(refs[idx], { stock: FieldValue.increment(-Math.min(available, it.quantity || 0)) });
                  });
                  tx.update(orderRef, { stockDecremented: true });
                });
              } catch (e) {
                console.warn('iyzico stok düşürme transaction hatası:', e);
                const oSnap = await orderRef.get();
                orderData = oSnap.data();
              }
              // Send confirmation email via Firebase Trigger Email
              if (orderData?.userEmail) {
                try {
                  await adminDb.collection('mail').add({
                    to: orderData.userEmail,
                    message: {
                      subject: `Siparişiniz Alındı — #${orderId.slice(0, 8).toUpperCase()}`,
                      html: `<p>Merhaba,</p><p>Siparişiniz başarıyla alındı. Sipariş numaranız: <strong>${orderId}</strong></p><p>Teşekkür ederiz.</p>`,
                    },
                  });
                } catch (e) {
                  console.warn('Failed to send confirmation email:', e);
                }
              }
            }

            console.log(`iyzico: Order ${orderId} → ${result.paymentStatus}`);
          }
        }

        res.json({ status: result.status, paymentStatus: result.paymentStatus });
      } catch (err: any) {
        console.error('iyzico callback error:', err);
        res.status(500).json({ error: err.message });
      }
    }
  );

  // iyzico browser redirect callback (user lands here after payment)
  app.get("/api/iyzico/callback", async (req, res) => {
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
      const orderId = result.basketId || '';
      if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
        res.redirect(`${frontendUrl}/checkout?iyzico_status=success&orderId=${orderId}&token=${token}`);
      } else {
        res.redirect(`${frontendUrl}/checkout?iyzico_status=failed&orderId=${orderId}&reason=${result.errorMessage || 'payment_failed'}`);
      }
    } catch (err: any) {
      res.redirect(`${frontendUrl}/checkout?iyzico_status=error&reason=${encodeURIComponent(err.message)}`);
    }
  });

  app.post("/api/iyzico/init", async (req, res) => {
    try {
      const iyzico = await getIyzico();
      if (!iyzico) {
        return res.status(503).json({ error: 'iyzico not configured', isMock: true });
      }

      const { userId, userEmail, userName, total, currency, installment, orderId, items, shippingAddress, buyerPhone } = req.body;

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
        res.status(400).json({ error: result.errorMessage || 'iyzico initialization failed', errorCode: result.errorCode });
      }
    } catch (err: any) {
      console.error('iyzico init error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/iyzico/installments", async (req, res) => {
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
      console.error('iyzico installments error:', err);
      res.json({ installments: [] });
    }
  });
}
