import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminAuth } from "./src/lib/firebase-admin.js";
import { isFiniteNumber, isNonEmptyString, itemsSignature } from "./src/lib/serverValidators.js";
import { createAuthMiddlewares } from "./src/lib/authMiddleware.js";
import { registerSellerApiRoutes } from "./server/routes/sellerApi.js";
import { registerIyzicoRoutes } from "./server/routes/iyzico.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil' as any,
});

// ─── Lazy iyzico SDK loader ─────────────────────────────────────────────────
let iyzicoSdk: any = null;
async function getIyzico() {
  if (!iyzicoSdk) {
    const mod = await import('./server/iyzico.cjs');
    const apiKey = process.env.IYZICO_API_KEY || '';
    const secretKey = process.env.IYZICO_SECRET_KEY || '';
    const baseUrl = process.env.IYZICO_BASE_URL || 'https://sandbox.iyzipay.com';
    if (apiKey && secretKey) {
      const client = mod.createClient({ apiKey, secretKey, uri: baseUrl });
      iyzicoSdk = { client, ...mod };
    } else {
      iyzicoSdk = null;
    }
  }
  return iyzicoSdk;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ─── Security Middleware ─────────────────────────────────────────────────────
  // CORS — allow our own origin for API calls
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? (process.env.APP_URL || 'https://benimolan.com')
      : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Stripe-Signature'],
    credentials: true,
  }));

  // Helmet — secure HTTP headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", // inline gerekli: GTM/analytics snippet'leri
          // 'unsafe-eval' yalnızca geliştirmede (Vite HMR) — production'da kaldırıldı (XSS sertleştirme)
          ...(process.env.NODE_ENV !== 'production' ? ["'unsafe-eval'"] : []),
          "https://js.stripe.com",
          "https://*.iyzipay.com",
          "https://www.googletagmanager.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://js.stripe.com"],
        imgSrc: ["'self'", "data:", "blob:",
          "https://firebasestorage.googleapis.com",
          "https://*.googleapis.com",
          "https://*.googleusercontent.com",
          "https://*.cloudfront.net",
          "https://*.iyzipay.com",
          "https://images.unsplash.com",
          "https://picsum.photos",
          "https://*.picsum.photos",
          "https://via.placeholder.com",
          "https://*.placeholder.com",
          "https://api.dicebear.com",
          "https://www.googletagmanager.com",
          "https://www.facebook.com",
        ],
        connectSrc: ["'self'",
          "https://api.stripe.com",
          "https://*.iyzipay.com",
          "https://firestore.googleapis.com",
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com",
          "https://api.postcodes.io",
          "https://*.ingest.de.sentry.io",
          "https://v6.exchangerate-api.com",
          "wss://*.firebaseio.com",
        ],
        frameSrc: ["'self'",
          "https://js.stripe.com",
          "https://*.iyzipay.com",
        ],
        fontSrc: ["'self'", "data:", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
        manifestSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        formAction: ["'self'", "https://*.iyzipay.com"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // allow Stripe/iyzico iframes
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }));

  // Rate limiting — per-IP
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use('/api/', generalLimiter);

  // Stricter rate limit for payment endpoints
  const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many payment attempts, please try again later.' },
  });
  app.use('/api/create-payment-intent', paymentLimiter);
  app.use('/api/iyzico/init', paymentLimiter);
  app.use('/api/create-setup-intent', paymentLimiter);
  app.use('/api/setup-payment-method', paymentLimiter);
  app.use('/api/one-click-checkout', paymentLimiter);

  // ─── Auth Middleware ─────────────────────────────────────────────────────────
  // verifyFirebaseToken / verifyAdmin / verifyCronSecret → src/lib/authMiddleware.ts
  const { verifyFirebaseToken, verifyAdmin, verifyCronSecret } =
    createAuthMiddlewares(adminAuth, adminDb);

  // ─── Lightweight Input Validators ────────────────────────────────────────────
  // isFiniteNumber / isNonEmptyString / itemsSignature → src/lib/serverValidators.ts

  // ─── Abandoned Cart Email ──────────────────────────────────────────────────
  app.post("/api/abandoned-cart/check", verifyCronSecret, async (req, res) => {
    try {
      if (!adminDb) {
        return res.status(503).json({ error: 'Firebase Admin not configured' });
      }

      const { windowHours = 2, maxReminders = 2 } = req.body;
      const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
      const tooOld = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(); // skip carts >72h old

      const cartsSnap = await adminDb.collection('carts')
        .orderBy('updatedAt', 'asc')
        .limit(100)
        .get();

      const results: { userId: string; email?: string; itemCount: number; status: string }[] = [];

      for (const cartDoc of cartsSnap.docs) {
        const cartData = cartDoc.data();
        const userId = cartDoc.id;
        const updatedAt = cartData.updatedAt || '';
        const items = cartData.items || [];

        // Skip empty carts
        if (!items.length) continue;

        // Check time window: abandoned (updatedAt between tooOld and cutoff)
        if (updatedAt > cutoff || updatedAt < tooOld) continue;

        // Check if reminder already sent
        const remindersSnap = await adminDb.collection('cart_reminders')
          .where('userId', '==', userId)
          .orderBy('sentAt', 'desc')
          .limit(1)
          .get();

        if (!remindersSnap.empty) {
          const lastReminder = remindersSnap.docs[0].data();
          if (lastReminder.count >= maxReminders) {
            results.push({ userId, itemCount: items.length, status: 'max_reminders_reached' });
            continue;
          }
          // Don't re-send within 24 hours
          const lastSent = new Date(lastReminder.sentAt).getTime();
          if (Date.now() - lastSent < 24 * 60 * 60 * 1000) {
            results.push({ userId, itemCount: items.length, status: 'too_soon' });
            continue;
          }
        }

        // Look up user email from Firebase Auth
        let userEmail = '';
        try {
          if (adminAuth) {
            const userRecord = await adminAuth.getUser(userId);
            userEmail = userRecord.email || '';
          }
        } catch { /* noop */ }

        if (!userEmail) {
          results.push({ userId, itemCount: items.length, status: 'no_email' });
          continue;
        }

        // Build product names for the email
        const productNames = items.slice(0, 5).map((i: any) => i.productId).join(', ');
        const itemCount = items.reduce((s: number, i: any) => s + (i.quantity || 0), 0);

        // Build cart URL
        const appUrl = process.env.APP_URL || 'https://benimolan.com';

        // Build abandoned cart email HTML
        const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F8FA;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8FA;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:24px;overflow:hidden;max-width:100%;">
        <tr><td style="background:linear-gradient(135deg,#7C3AED,#1A1033);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:900;letter-spacing:-1px;font-style:italic;">MERCORA</h1>
        </td></tr>
        <tr><td style="padding:32px 40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">🛒</div>
          <h2 style="margin:0 0 8px;font-size:20px;font-weight:900;color:#1A1033;">Sepetinde ${itemCount} ürün kaldı!</h2>
          <p style="margin:0 0 24px;font-size:13px;color:#666;line-height:1.6;">
            Sepetine eklediğin ürünler hala seni bekliyor.<br>
            Kaçırmadan tamamlamak ister misin?
          </p>
          <a href="${appUrl}/cart"
             style="display:inline-block;padding:14px 36px;background:#7C3AED;color:#fff;text-decoration:none;border-radius:12px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;box-shadow:0 8px 24px rgba(124,58,237,0.3);">
            Sepete Dön
          </a>
          <p style="margin:20px 0 0;font-size:10px;color:#bbb;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
            ${items.length} farklı ürün sepetinde seni bekliyor
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;background:#F8F8FA;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;font-size:10px;color:#bbb;font-weight:700;text-transform:uppercase;letter-spacing:2px;">
            Benim Olan · Bu email otomatik gönderilmiştir
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

        // Send via Firebase Trigger Email
        const reminderCount = remindersSnap.empty ? 0 : remindersSnap.docs[0].data().count;
        await adminDb.collection('mail').add({
          to: userEmail,
          message: {
            subject: `Sepetinde ${itemCount} ürün kaldı — Benim Olan`,
            html: emailHtml,
          },
        });

        // Record the reminder
        await adminDb.collection('cart_reminders').add({
          userId,
          sentAt: new Date().toISOString(),
          count: (reminderCount || 0) + 1,
          items: items.map((i: any) => ({ productId: i.productId, quantity: i.quantity })),
          cartUpdatedAt: updatedAt,
        });

        results.push({ userId, email: userEmail, itemCount: items.length, status: 'sent' });
        console.log(`Abandoned cart email sent to ${userEmail} (${itemCount} items)`);
      }

      res.json({ checked: cartsSnap.docs.length, results });
    } catch (err: any) {
      console.error('Abandoned cart check error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Stripe webhook needs raw body — parse before JSON middleware
  app.post(
    "/api/webhook",
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.warn('STRIPE_WEBHOOK_SECRET not set — skipping webhook verification');
        return res.status(200).json({ received: true });
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
      }

      console.log(`Webhook received: ${event.type}`);

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
              console.log(`Order ${orderId} marked as paid`);
            }
            break;
          }

          case 'payment_intent.succeeded': {
            const pi = event.data.object as Stripe.PaymentIntent;
            console.log(`PaymentIntent ${pi.id} succeeded: ${pi.amount} ${pi.currency}`);
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
              console.log(`Order ${failedOrderId} cancelled due to payment failure`);
            }
            break;
          }

          default:
            console.log(`Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error('Webhook handler error:', err);
      }

      res.json({ received: true });
    }
  );

  // JSON parser for all other routes
  app.use(express.json());

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", environment: process.env.NODE_ENV });
  });

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
      console.warn("STRIPE_SECRET_KEY not set, using mock response.");
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
        } catch (e) { console.warn('Stock release failed:', e); }
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
          console.warn('one-click-checkout: confirmation email failed:', e);
        }
      }

      res.json({ status: 'succeeded', orderId: orderRef.id, total });
    } catch (error: any) {
      // Handle Stripe card errors (declined, etc.)
      if (error.type === 'StripeCardError') {
        return res.json({ status: 'failed', errorMessage: error.message });
      }
      console.error('one-click-checkout error:', error);
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
      console.error('refund error:', error);
      res.status(500).json({ error: error.message || 'Refund failed' });
    }
  });

  // ─── iyzico API → server/routes/iyzico.ts ──────────────────────────────────
  registerIyzicoRoutes(app, { getIyzico, adminDb, port: PORT });

  // ─── Seller REST API (/api/v1) → server/routes/sellerApi.ts ────────────────
  registerSellerApiRoutes(app, adminDb!);

  // POST /api/send-push — Send push notification to a user
  app.post('/api/send-push', verifyFirebaseToken, async (req: any, res) => {
    try {
      const { userId, title, body, url } = req.body;
      if (!isNonEmptyString(userId, 128) || !isNonEmptyString(title, 200) || !isNonEmptyString(body, 1000)) {
        return res.status(400).json({ error: 'userId, title, body required (valid strings)' });
      }
      if (url !== undefined && !isNonEmptyString(url, 2000)) {
        return res.status(400).json({ error: 'invalid url' });
      }

      const tokenDoc = await adminDb.collection('pushTokens').doc(userId).get();
      if (!tokenDoc.exists) return res.json({ sent: false, reason: 'No push token' });

      const token = tokenDoc.data()!.token;
      await adminDb.collection('pushMessages').add({
        userId, title, body, url: url || null,
        status: 'pending', createdAt: new Date().toISOString(),
      });
      return res.json({ sent: true, token: token.slice(0, 20) + '...' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ─── Scheduled Auto-Payout Endpoint ───────────────────────────────────────
  // POST /api/process-scheduled-payouts
  // Called by external cron (e.g. cron-job.org) every Monday at 3 AM
  app.post('/api/process-scheduled-payouts', verifyCronSecret, async (_req, res) => {
    try {
      const schedulesSnap = await adminDb.collection('payoutSchedules').get();
      const schedules = new Map<string, any>();
      schedulesSnap.docs.forEach(d => {
        const s = d.data();
        if (s.autoPayoutEnabled) schedules.set(s.sellerId, s);
      });

      if (schedules.size === 0) {
        return res.json({ processed: 0, skipped: 0, failed: 0, totalAmount: 0, message: 'No auto-payout enabled sellers' });
      }

      const balancesSnap = await adminDb.collection('sellerBalances').get();
      const now = new Date().toISOString();
      let processed = 0, skipped = 0, failed = 0, totalAmount = 0;
      const details: any[] = [];

      for (const balanceDoc of balancesSnap.docs) {
        const balance = balanceDoc.data();
        const schedule = schedules.get(balance.sellerId);
        if (!schedule) { skipped++; continue; }

        const available = balance.availableBalance ?? 0;
        if (available < (schedule.minBalanceThreshold ?? 500)) {
          skipped++;
          continue;
        }

        try {
          const fee = Math.round(Math.max(5, available * 0.01) * 100) / 100;
          const netAmount = Math.round((available - fee) * 100) / 100;

          await adminDb.collection('payoutRequests').add({
            sellerId: balance.sellerId, amount: available, fee, netAmount,
            status: 'completed', method: 'bank_transfer', destination: 'auto',
            autoGenerated: true, processedBy: 'cron', processedAt: now, createdAt: now,
          });

          // Update schedule
          const schedSnap = await adminDb.collection('payoutSchedules')
            .where('sellerId', '==', balance.sellerId).get();
          if (!schedSnap.empty) {
            await schedSnap.docs[0].ref.update({ lastAutoPayout: now });
          }

          // Reset balance
          await balanceDoc.ref.update({
            totalPaidOut: FieldValue.increment(available),
            availableBalance: 0,
            pendingBalance: 0,
            updatedAt: now,
          });

          processed++;
          totalAmount += netAmount;
          details.push({ sellerId: balance.sellerId, amount: netAmount, status: 'completed' });
        } catch (err: any) {
          failed++;
          details.push({ sellerId: balance.sellerId, amount: available, status: 'failed', reason: err.message });
        }
      }

      console.log(`[autoPayout] Processed=${processed} Skipped=${skipped} Failed=${failed} Total=${totalAmount.toFixed(2)} ₺`);
      return res.json({ processed, skipped, failed, totalAmount, details });
    } catch (err: any) {
      console.error('[autoPayout] Endpoint error:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Chrome DevTools capability endpoint — avoid 404 noise in console
  app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
    res.json({});
  });

  // Firebase Hosting auto-config — served natively by Firebase Hosting in production;
  // this dev-server route mirrors it so firebase-messaging-sw.js works without hardcoded keys.
  app.get('/__/firebase/init.js', (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
if (typeof firebase !== 'undefined') {
  firebase.initializeApp({
    apiKey: ${JSON.stringify(process.env.VITE_FIREBASE_API_KEY || '')},
    authDomain: ${JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN || '')},
    projectId: ${JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID || '')},
    storageBucket: ${JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET || '')},
    messagingSenderId: ${JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '')},
    appId: ${JSON.stringify(process.env.VITE_FIREBASE_APP_ID || '')},
  });
}
`);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error('[Vite] Failed to create dev server:', err);
      // Fallback: serve dist if available
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Benim Olan Server running on http://localhost:${PORT}`);
  });
}

startServer();
