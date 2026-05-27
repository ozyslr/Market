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
      ? (process.env.APP_URL || 'https://mercora.app')
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
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'",
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

  // ─── Auth Middleware Helper ─────────────────────────────────────────────────
  async function verifyFirebaseToken(req: any, res: any, next: any) {
    const header = (req.headers.authorization as string) || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    if (!adminAuth) return res.status(503).json({ error: 'Auth not configured' });
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      req.uid = decoded.uid;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  // ─── Abandoned Cart Email ──────────────────────────────────────────────────
  app.post("/api/abandoned-cart/check", async (req, res) => {
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
        const appUrl = process.env.APP_URL || 'https://mercora.app';

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
      });

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
    if (!items?.length) return res.status(400).json({ error: 'No items provided' });

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

      // ── Charge off-session ────────────────────────────────────────────
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency,
        customer: stripeCustomerId,
        payment_method: defaultPaymentMethodId,
        confirm: true,
        off_session: true,
      });

      if (paymentIntent.status === 'requires_action') {
        return res.json({ status: 'requires_action', clientSecret: paymentIntent.client_secret });
      }

      if (paymentIntent.status !== 'succeeded') {
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

      // ── Decrease stock ────────────────────────────────────────────────
      for (const item of items) {
        await adminDb.collection('products').doc(item.productId).update({
          stock: FieldValue.increment(-item.quantity),
        });
      }

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

  // ─── iyzico API ───────────────────────────────────────────────────────────
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

            // On success, decrease stock and send confirmation email
            if (result.paymentStatus === 'SUCCESS') {
              const orderSnap = await orderRef.get();
              const orderData = orderSnap.data();
              if (orderData?.items) {
                for (const item of orderData.items) {
                  try {
                    await adminDb.collection('products').doc(item.productId).update({
                      stock: FieldValue.increment(-item.quantity),
                    });
                  } catch (e) {
                    console.warn(`Failed to decrease stock for ${item.productId}:`, e);
                  }
                }
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

  // Chrome DevTools capability endpoint — avoid 404 noise in console
  app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
    res.json({});
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
