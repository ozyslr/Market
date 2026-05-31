// ─── Stripe payment routes ───────────────────────────────────────────────────
// Extracted verbatim from server.ts. The webhook needs the raw request body and
// MUST be registered BEFORE express.json(); registerStripeWebhook handles that
// half, registerStripeRoutes handles the JSON-parsed endpoints.
import express, { type Express } from 'express';
import type Stripe from 'stripe';
import { FieldValue } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logger } from '../logger.js';
import { isFiniteNumber, isNonEmptyString, itemsSignature } from '../../src/lib/serverValidators.js';

type Middleware = (req: any, res: any, next: any) => any;

export interface StripeRouteDeps {
  stripe: Stripe;
  adminDb: Firestore | null;
  verifyFirebaseToken: Middleware;
  verifyAdmin: Middleware;
  port: number;
}

/** Raw-body Stripe webhook. Register BEFORE express.json(). */
export function registerStripeWebhook(app: Express, stripe: Stripe, adminDb: Firestore | null) {
  // Stripe webhook needs raw body — parse before JSON middleware
  app.post(
    "/api/webhook",
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        logger.warn('stripe', 'Webhook secret not set — skipping verification');
        return res.status(200).json({ received: true });
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        logger.error('stripe', 'Webhook signature verification failed', { error: (err as Error).message });
        return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
      }

      logger.info('stripe', 'Webhook received', { eventType: event.type });

      try {
        switch (event.type) {
          case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const orderId = session.metadata?.orderId;
            if (orderId && adminDb) {
              await adminDb.collection('orders').doc(orderId).update({
                status: 'paid',
                paidAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                stripePaymentIntentId: session.payment_intent as string,
              });
              logger.info('stripe', 'Order marked as paid', { orderId });
            }
            break;
          }

          case 'payment_intent.succeeded': {
            const pi = event.data.object as Stripe.PaymentIntent;
            logger.info('stripe', 'PaymentIntent succeeded', { piId: pi.id, amount: pi.amount, currency: pi.currency });
            break;
          }

          case 'payment_intent.payment_failed': {
            const failedPi = event.data.object as Stripe.PaymentIntent;
            const failedOrderId = failedPi.metadata?.orderId;
            if (failedOrderId && adminDb) {
              await adminDb.collection('orders').doc(failedOrderId).update({
                status: 'cancelled',
                updatedAt: new Date().toISOString(),
              });
              logger.info('stripe', 'Order cancelled due to payment failure', { orderId: failedOrderId });
            }
            break;
          }

          default:
            logger.info('stripe', 'Unhandled event type', { eventType: event.type });
        }
      } catch (err) {
        logger.error('stripe', 'Webhook handler error', { error: (err as Error).message });
      }

      res.json({ received: true });
    }
  );
}

/** JSON-parsed Stripe endpoints. Register AFTER express.json(). */
export function registerStripeRoutes(app: Express, deps: StripeRouteDeps) {
  const { stripe, adminDb, verifyFirebaseToken, verifyAdmin, port: PORT } = deps;

  // Stripe Payment Intent
  app.post("/api/create-payment-intent", async (req, res) => {
    const { amount, currency = "gbp", orderId } = req.body;

    // ── Input validation ──────────────────────────────────────────────
    if (!isFiniteNumber(amount) || amount <= 0 || amount > 1_000_000) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    if (typeof currency !== 'string' || currency.length > 5) {
      return res.status(400).json({ error: 'Invalid currency' });
    }
    if (orderId !== undefined && !isNonEmptyString(orderId, 128)) {
      return res.status(400).json({ error: 'Invalid orderId' });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey || stripeKey === "YOUR_STRIPE_SECRET_KEY") {
      logger.warn('stripe', 'Secret key not set, using mock response');
      return res.json({
        clientSecret: "mock_secret_" + Math.random().toString(36).substring(7),
        isMock: true
      });
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        automatic_payment_methods: { enabled: true },
        metadata: { orderId: orderId || '' },
      }, orderId ? { idempotencyKey: `pi_${orderId}` } : undefined);

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ─── Save Card: Create SetupIntent ──────────────────────────────────────────
  app.post('/api/create-setup-intent', verifyFirebaseToken, async (req: any, res) => {
    if (!adminDb) return res.status(503).json({ error: 'DB not configured' });
    try {
      const uid: string = req.uid;
      const userDoc = await adminDb.collection('users').doc(uid).get();
      let customerId: string = userDoc.data()?.stripeCustomerId || '';

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userDoc.data()?.email || '',
          metadata: { firebaseUid: uid },
        });
        customerId = customer.id;
        // Write customerId now so setup-payment-method can rely on it
        await adminDb.collection('users').doc(uid).update({ stripeCustomerId: customerId });
      }

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        usage: 'off_session',
        automatic_payment_methods: { enabled: true },
      });
      res.json({ clientSecret: setupIntent.client_secret });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ─── Save Card: Attach PaymentMethod to Customer ─────────────────────────────
  app.post('/api/setup-payment-method', verifyFirebaseToken, async (req: any, res) => {
    if (!adminDb) return res.status(503).json({ error: 'DB not configured' });
    const { paymentMethodId, last4, brand } = req.body;
    if (!paymentMethodId) return res.status(400).json({ error: 'paymentMethodId required' });

    try {
      const uid: string = req.uid;
      const userDoc = await adminDb.collection('users').doc(uid).get();
      const customerId: string = userDoc.data()?.stripeCustomerId || '';
      if (!customerId) return res.status(400).json({ error: 'No Stripe customer found — call create-setup-intent first' });

      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      await adminDb.collection('users').doc(uid).update({
        defaultPaymentMethodId: paymentMethodId,
        defaultPaymentMethodLast4: last4 || '',
        defaultPaymentMethodBrand: brand || '',
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ─── Wallet: List saved cards ────────────────────────────────────────────────
  app.get('/api/payment-methods', verifyFirebaseToken, async (req: any, res) => {
    if (!adminDb) return res.status(503).json({ error: 'DB not configured' });
    try {
      const uid: string = req.uid;
      const userDoc = await adminDb.collection('users').doc(uid).get();
      const customerId: string = userDoc.data()?.stripeCustomerId || '';
      if (!customerId) return res.json({ cards: [] });

      const [methods, customer] = await Promise.all([
        stripe.paymentMethods.list({ customer: customerId, type: 'card' }),
        stripe.customers.retrieve(customerId),
      ]);
      const defaultPm = (customer && !('deleted' in customer))
        ? ((customer.invoice_settings?.default_payment_method as string | null) || '')
        : '';
      const cards = methods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand || '',
        last4: pm.card?.last4 || '',
        expMonth: pm.card?.exp_month || 0,
        expYear: pm.card?.exp_year || 0,
        isDefault: pm.id === defaultPm,
      }));
      res.json({ cards });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ─── Wallet: Remove a saved card ─────────────────────────────────────────────
  app.delete('/api/payment-methods/:id', verifyFirebaseToken, async (req: any, res) => {
    if (!adminDb) return res.status(503).json({ error: 'DB not configured' });
    const id = req.params.id;
    if (!isNonEmptyString(id, 128)) return res.status(400).json({ error: 'Invalid payment method id' });
    try {
      const uid: string = req.uid;
      const userRef = adminDb.collection('users').doc(uid);
      const userData = (await userRef.get()).data() || {};
      const customerId: string = userData.stripeCustomerId || '';
      if (!customerId) return res.status(400).json({ error: 'No Stripe customer' });

      // Ownership check — never detach another customer's card
      const pm = await stripe.paymentMethods.retrieve(id);
      if (pm.customer !== customerId) return res.status(403).json({ error: 'Not your card' });

      await stripe.paymentMethods.detach(id);

      // If the removed card was the default, promote the next one (or clear)
      let newDefaultId: string | null = null;
      if (userData.defaultPaymentMethodId === id) {
        const remaining = await stripe.paymentMethods.list({ customer: customerId, type: 'card' });
        const next = remaining.data[0];
        if (next) {
          newDefaultId = next.id;
          await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: next.id } });
          await userRef.update({
            defaultPaymentMethodId: next.id,
            defaultPaymentMethodLast4: next.card?.last4 || '',
            defaultPaymentMethodBrand: next.card?.brand || '',
          });
        } else {
          await userRef.update({
            defaultPaymentMethodId: '',
            defaultPaymentMethodLast4: '',
            defaultPaymentMethodBrand: '',
          });
        }
      }
      res.json({ success: true, newDefaultId });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ─── Wallet: Set default card ────────────────────────────────────────────────
  app.patch('/api/payment-methods/default', verifyFirebaseToken, async (req: any, res) => {
    if (!adminDb) return res.status(503).json({ error: 'DB not configured' });
    const { paymentMethodId } = req.body || {};
    if (!isNonEmptyString(paymentMethodId, 128)) return res.status(400).json({ error: 'paymentMethodId required' });
    try {
      const uid: string = req.uid;
      const userRef = adminDb.collection('users').doc(uid);
      const customerId: string = (await userRef.get()).data()?.stripeCustomerId || '';
      if (!customerId) return res.status(400).json({ error: 'No Stripe customer' });

      const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
      if (pm.customer !== customerId) return res.status(403).json({ error: 'Not your card' });

      await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } });
      await userRef.update({
        defaultPaymentMethodId: paymentMethodId,
        defaultPaymentMethodLast4: pm.card?.last4 || '',
        defaultPaymentMethodBrand: pm.card?.brand || '',
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ─── One-Click Checkout ──────────────────────────────────────────────────────
  app.post('/api/one-click-checkout', verifyFirebaseToken, async (req: any, res) => {
    if (!adminDb) return res.status(503).json({ error: 'DB not configured' });
    const { items, currency = 'gbp' } = req.body as {
      items: Array<{ productId: string; variantId?: string; quantity: number }>;
      currency: string;
    };
    if (!Array.isArray(items) || !items.length || items.length > 100) {
      return res.status(400).json({ error: 'No items provided' });
    }
    for (const it of items) {
      if (!isNonEmptyString(it?.productId, 128) ||
          !isFiniteNumber(it?.quantity) || it.quantity <= 0 || it.quantity > 1000 ||
          (it.variantId !== undefined && !isNonEmptyString(it.variantId, 128))) {
        return res.status(400).json({ error: 'Invalid item in request' });
      }
    }
    if (typeof currency !== 'string' || currency.length > 5) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    try {
      const uid: string = req.uid;
      const userDoc = await adminDb.collection('users').doc(uid).get();
      const userData = userDoc.data();
      if (!userData) return res.status(404).json({ error: 'User not found' });

      const { stripeCustomerId, defaultPaymentMethodId, defaultAddressId, addresses = [], email } = userData;
      if (!stripeCustomerId || !defaultPaymentMethodId) {
        return res.status(400).json({ error: 'No saved payment method' });
      }
      const shippingAddress = addresses.find((a: any) => a.id === defaultAddressId);
      if (!shippingAddress) {
        return res.status(400).json({ error: 'No default shipping address' });
      }

      // ── Fetch product prices server-side (never trust client prices) ──
      let subtotal = 0;
      const orderItems: any[] = [];
      for (const item of items) {
        const productDoc = await adminDb.collection('products').doc(item.productId).get();
        const product = productDoc.data();
        if (!product) return res.status(404).json({ error: `Product ${item.productId} not found` });

        let price: number = product.price;
        if (item.variantId && product.variants) {
          const variant = product.variants.find((v: any) => v.id === item.variantId);
          if (variant) price = variant.price;
        }
        subtotal += price * item.quantity;
        orderItems.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price,
          name: product.name,
          image: product.images?.[0] || '',
          sellerId: product.sellerId || '',
        });
      }

      const shipping = subtotal >= 100 ? 0 : 4.99;
      const tax = parseFloat((subtotal * 0.2).toFixed(2));
      const total = parseFloat((subtotal + shipping + tax).toFixed(2));

      // ── Reserve stock atomically BEFORE charging (prevents overselling) ──
      try {
        await adminDb.runTransaction(async (tx) => {
          const refs = items.map((it) => adminDb!.collection('products').doc(it.productId));
          const snaps = await Promise.all(refs.map((r) => tx.get(r)));
          for (let i = 0; i < items.length; i++) {
            const available = snaps[i].data()?.stock ?? 0;
            if (available < items[i].quantity) throw new Error(`INSUFFICIENT_STOCK:${items[i].productId}`);
          }
          for (let i = 0; i < items.length; i++) {
            tx.update(refs[i], { stock: FieldValue.increment(-items[i].quantity) });
          }
        });
      } catch (e: any) {
        if (String(e?.message).startsWith('INSUFFICIENT_STOCK')) {
          return res.status(409).json({ status: 'failed', errorMessage: 'Yetersiz stok', detail: e.message });
        }
        throw e;
      }

      // ── Release reserved stock if the charge does not complete ──────────
      const releaseStock = async () => {
        try {
          const batch = adminDb!.batch();
          for (const it of items) {
            batch.update(adminDb!.collection('products').doc(it.productId), { stock: FieldValue.increment(it.quantity) });
          }
          await batch.commit();
        } catch (e) { logger.warn('stripe', 'Stock release failed', { error: (e as Error).message }); }
      };

      // ── Charge off-session (idempotent on rapid double-submit) ──────────
      let paymentIntent: Stripe.PaymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(total * 100),
          currency,
          customer: stripeCustomerId,
          payment_method: defaultPaymentMethodId,
          confirm: true,
          off_session: true,
        }, { idempotencyKey: `oc:${uid}:${itemsSignature(items)}:${Math.floor(Date.now() / 60000)}` });
      } catch (chargeErr) {
        await releaseStock();
        throw chargeErr;
      }

      if (paymentIntent.status === 'requires_action') {
        await releaseStock();
        return res.json({ status: 'requires_action', clientSecret: paymentIntent.client_secret });
      }

      if (paymentIntent.status !== 'succeeded') {
        await releaseStock();
        return res.json({ status: 'failed', errorMessage: 'Payment did not succeed' });
      }

      // ── Create order ──────────────────────────────────────────────────
      const sellerIds = [...new Set(orderItems.map((i: any) => i.sellerId).filter(Boolean))];
      const orderRef = await adminDb.collection('orders').add({
        userId: uid,
        userEmail: email || '',
        items: orderItems,
        sellerIds,
        subtotal,
        shipping,
        tax,
        total,
        currency,
        status: 'confirmed',
        paymentStatus: 'succeeded',
        paymentMethod: 'stripe',
        stripePaymentIntentId: paymentIntent.id,
        shippingAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // (Stok zaten şarjdan önce atomik olarak rezerve edildi — burada tekrar düşülmez)

      // ── Clear cart ────────────────────────────────────────────────────
      await adminDb.collection('carts').doc(uid).delete();

      // ── Create in-app notification ────────────────────────────────────
      await adminDb.collection('notifications').add({
        userId: uid,
        type: 'order_status',
        title: 'Siparişiniz Alındı',
        message: `#${orderRef.id.slice(0, 8).toUpperCase()} numaralı siparişiniz onaylandı.`,
        link: `/profile?tab=orders`,
        read: false,
        createdAt: new Date().toISOString(),
      });

      // ── Send order confirmation email via Firebase Trigger Email ──────
      if (email) {
        try {
          const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
          const rows = orderItems.map((i: any) =>
            `<tr><td style="padding:8px 0;font-size:13px;color:#1A1033;">${i.name} × ${i.quantity}</td>` +
            `<td style="padding:8px 0;font-size:13px;color:#1A1033;text-align:right;font-weight:700;">${currency} ${(i.price * i.quantity).toFixed(2)}</td></tr>`
          ).join('');
          await adminDb.collection('mail').add({
            to: email,
            message: {
              subject: `Siparişiniz Alındı — #${orderRef.id.slice(0, 8).toUpperCase()}`,
              html: `<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;font-family:Arial,sans-serif;">
  <tr><td style="padding:32px 40px;text-align:center;">
    <div style="font-size:48px;margin-bottom:16px;">✅</div>
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:900;color:#1A1033;">Siparişiniz onaylandı!</h2>
    <p style="margin:0 0 24px;font-size:13px;color:#666;">Sipariş No: <strong>#${orderRef.id.slice(0, 8).toUpperCase()}</strong></p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;border-bottom:1px solid #eee;margin-bottom:16px;">${rows}</table>
    <p style="margin:0 0 24px;font-size:15px;font-weight:900;color:#1A1033;text-align:right;">Toplam: ${currency} ${total.toFixed(2)}</p>
    <a href="${appUrl}/profile?tab=orders" style="display:inline-block;padding:14px 36px;background:#7C3AED;color:#fff;text-decoration:none;border-radius:12px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;">Siparişimi Görüntüle</a>
  </td></tr>
  <tr><td style="padding:24px 40px;background:#F8F8FA;text-align:center;border-top:1px solid #eee;">
    <p style="margin:0;font-size:10px;color:#bbb;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Benim Olan · Bu email otomatik gönderilmiştir</p>
  </td></tr>
</table>`,
            },
          });
        } catch (e) {
          logger.warn('stripe', 'One-click checkout confirmation email failed', { error: (e as Error).message });
        }
      }

      res.json({ status: 'succeeded', orderId: orderRef.id, total });
    } catch (error: any) {
      // Handle Stripe card errors (declined, etc.)
      if (error.type === 'StripeCardError') {
        return res.json({ status: 'failed', errorMessage: error.message });
      }
      logger.error('stripe', 'One-click checkout error', { error: (error as Error).message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ─── Refund (admin only) ────────────────────────────────────────────────
  app.post('/api/refund', verifyAdmin, async (req: any, res) => {
    try {
      if (!adminDb) return res.status(503).json({ error: 'Firestore not configured' });
      const { orderId, amount } = req.body || {};
      if (!isNonEmptyString(orderId, 128)) {
        return res.status(400).json({ error: 'orderId is required' });
      }
      if (amount !== undefined && (!isFiniteNumber(amount) || amount <= 0)) {
        return res.status(400).json({ error: 'amount must be a positive number' });
      }

      const orderRef = adminDb.collection('orders').doc(orderId);
      const orderSnap = await orderRef.get();
      if (!orderSnap.exists) return res.status(404).json({ error: 'Order not found' });
      const order = orderSnap.data() as any;

      if (order.status === 'refunded') {
        return res.status(409).json({ error: 'Order already refunded' });
      }

      // Partial refund must not exceed the order total
      const orderTotal = order.total ?? order.totalAmount ?? 0;
      if (amount !== undefined && amount > orderTotal) {
        return res.status(400).json({ error: 'Refund amount exceeds order total' });
      }

      let refundId: string | null = null;
      if (order.paymentMethod === 'stripe' && order.stripePaymentIntentId) {
        const refund = await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
          ...(amount !== undefined ? { amount: Math.round(amount * 100) } : {}),
        });
        refundId = refund.id;
      } else if (order.paymentMethod === 'iyzico') {
        // iyzico iadesi her ödeme kalemi için paymentTransactionId gerektirir —
        // şimdilik manuel iade gerektiğini bildir, sipariş yine de işaretlenmez.
        return res.status(422).json({
          error: 'iyzico_manual_refund_required',
          message: 'iyzico iadeleri panelden manuel yapılmalıdır.',
        });
      } else {
        return res.status(422).json({ error: 'No refundable payment reference on this order' });
      }

      const now = new Date().toISOString();
      await orderRef.update({
        status: 'refunded',
        refundId,
        refundAmount: amount ?? orderTotal,
        refundedAt: now,
        updatedAt: now,
      });

      // Notify buyer
      if (order.userId) {
        await adminDb.collection('notifications').add({
          userId: order.userId,
          type: 'order_status',
          title: 'İadeniz Tamamlandı',
          message: `#${orderId.slice(0, 8).toUpperCase()} numaralı siparişiniz için ${(amount ?? orderTotal).toFixed(2)} ${order.currency || 'TRY'} iade edildi.`,
          link: `/profile?tab=orders`,
          read: false,
          createdAt: now,
        });
      }

      res.json({ status: 'refunded', orderId, refundId, amount: amount ?? orderTotal });
    } catch (error: any) {
      logger.error('stripe', 'Refund error', { error: (error as Error).message });
      res.status(500).json({ error: error.message || 'Refund failed' });
    }
  });
}
