import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from './src/lib/firebase-admin.js';
import { isFiniteNumber, isNonEmptyString, itemsSignature } from './src/lib/serverValidators.js';
import { createAuthMiddlewares } from './src/lib/authMiddleware.js';
import { registerSellerApiRoutes } from './server/routes/sellerApi.js';
import { registerIyzicoRoutes } from './server/routes/iyzico.js';
import { IyzicoProvider } from './server/services/paymentProvider.js';
import { registerStripeWebhook, registerStripeRoutes } from './server/routes/stripe.js';
import { registerGeminiRoutes } from './server/routes/gemini.js';
import { registerOrderRoutes } from './server/routes/orders.js';
import { registerReviewRoutes } from './server/routes/reviews.js';
import { registerCommissionRoutes } from './server/routes/commission.js';
import { registerComplianceRoutes } from './server/routes/compliance.js';
import { registerPayoutRoutes } from './server/routes/payouts.js';
import { registerFinanceRoutes } from './server/routes/finance.js';
import { registerEmailRoutes } from './server/routes/email.js';
import { registerRefundRoutes } from './server/routes/refund.js';
import { registerCsvImportRoutes } from './server/routes/csvImport.js';
import { registerShippingRoutes } from './server/routes/shipping.js';
import { registerCarrierWebhook } from './server/routes/carrierWebhook.js';
import { registerCarrierPollRoutes } from './server/routes/carrierPoll.js';
import { registerReturnsRoutes } from './server/routes/returns.js';
import { registerTypesenseSyncRoutes } from './server/routes/typesenseSync.js';
import { registerFxRateRoutes } from './server/routes/fxRates.js';
import { registerVerificationRoutes } from './server/routes/verification.js';
import { sendAbandonedCartEmail } from './server/services/emailService.js';
import { logger, httpLogger } from './server/logger.js';
import { audit } from './server/lib/auditLog.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil' as any,
});

// â”€â”€â”€ Lazy iyzico SDK loader â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Security Middleware â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // CORS â€” allow our own origin for API calls
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === 'production'
          ? process.env.APP_URL || 'https://benimolan.com'
          : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Stripe-Signature'],
      credentials: true,
    }),
  );

  // HTTP request logging — pino-http (auto-log every request/response)
  app.use(httpLogger);

  // Helmet â€” secure HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // inline gerekli: GTM/analytics snippet'leri
            // 'unsafe-eval' yalnÄ±zca geliÅŸtirmede (Vite HMR) â€” production'da kaldÄ±rÄ±ldÄ± (XSS sertleÅŸtirme)
            ...(process.env.NODE_ENV !== 'production' ? ["'unsafe-eval'"] : []),
            'https://js.stripe.com',
            'https://*.iyzipay.com',
            'https://www.googletagmanager.com',
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
            'https://js.stripe.com',
          ],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            'https://firebasestorage.googleapis.com',
            'https://*.googleapis.com',
            'https://*.googleusercontent.com',
            'https://*.cloudfront.net',
            'https://*.iyzipay.com',
            'https://images.unsplash.com',
            'https://picsum.photos',
            'https://*.picsum.photos',
            'https://via.placeholder.com',
            'https://*.placeholder.com',
            'https://api.dicebear.com',
            'https://www.googletagmanager.com',
            'https://www.facebook.com',
          ],
          connectSrc: [
            "'self'",
            'https://api.stripe.com',
            'https://*.iyzipay.com',
            'https://firestore.googleapis.com',
            'https://identitytoolkit.googleapis.com',
            'https://securetoken.googleapis.com',
            'https://api.postcodes.io',
            'https://*.ingest.de.sentry.io',
            'https://*.ingest.sentry.io',
            'https://v6.exchangerate-api.com',
            'wss://*.firebaseio.com',
            'https://generativelanguage.googleapis.com',
            'https://www.google-analytics.com',
            'https://www.facebook.com',
            'https://connect.facebook.net',
            // Vite HMR websocket + asset loading â€” development only
            ...(process.env.NODE_ENV !== 'production'
              ? ['ws://localhost:*', 'ws://127.0.0.1:*', 'http://localhost:*', 'http://127.0.0.1:*']
              : []),
          ],
          frameSrc: ["'self'", 'https://js.stripe.com', 'https://*.iyzipay.com'],
          fontSrc: ["'self'", 'data:', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
          manifestSrc: ["'self'"],
          workerSrc: ["'self'", 'blob:'],
          mediaSrc: ["'self'"],
          objectSrc: ["'none'"],
          formAction: ["'self'", 'https://*.iyzipay.com'],
          // Forcing https upgrade breaks http://localhost dev assets â€” production only
          ...(process.env.NODE_ENV === 'production' ? { upgradeInsecureRequests: [] } : {}),
        },
      },
      crossOriginEmbedderPolicy: false, // allow Stripe/iyzico iframes
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    }),
  );

  // Rate limiting â€” per-IP
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
  // OTP rate limiter — 5 req/hour per IP
  const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Cok fazla deneme. Lutfen 1 saat sonra tekrar deneyin.' },
  });
  app.use('/api/verification/', otpLimiter);

  // â”€â”€â”€ Auth Middleware â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // verifyFirebaseToken / verifyAdmin / verifyCronSecret â†' src/lib/authMiddleware.ts
  const {
    verifyFirebaseToken,
    verifyAdmin,
    verifySeller,
    verifyBuyer,
    verifyCronSecret,
    requireAdminRole,
  } = createAuthMiddlewares(adminAuth);

  // â”€â”€â”€ Lightweight Input Validators â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // isFiniteNumber / isNonEmptyString / itemsSignature â†' src/lib/serverValidators.ts

  // â”€â”€â”€ Abandoned Cart Email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  app.post('/api/abandoned-cart/check', verifyCronSecret, async (req, res) => {
    try {
      if (!adminDb) {
        return res.status(503).json({ error: 'Firebase Admin not configured' });
      }

      const { windowHours = 1, maxReminders = 2 } = req.body;
      const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
      const tooOld = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(); // skip carts >72h old

      const cartsSnap = await adminDb
        .collection('carts')
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
        const remindersSnap = await adminDb
          .collection('cart_reminders')
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
        } catch {
          /* noop */
        }

        if (!userEmail) {
          results.push({ userId, itemCount: items.length, status: 'no_email' });
          continue;
        }

        // Build product names for the email
        const productNames = items
          .slice(0, 5)
          .map((i: any) => i.productId)
          .join(', ');
        const itemCount = items.reduce((s: number, i: any) => s + (i.quantity || 0), 0);

        // Build cart URL
        const appUrl = process.env.APP_URL || 'https://benimolan.com';
        const cartUrl = `${appUrl}/cart`;

        // Send via Resend email service
        const reminderCount = remindersSnap.empty ? 0 : remindersSnap.docs[0].data().count;
        const cartItems = items
          .slice(0, 10)
          .map((i: any) => ({ name: i.productId || 'Urun', image: undefined }));
        await sendAbandonedCartEmail(userEmail, 'Musteri', cartItems, cartUrl);

        // Record the reminder
        await adminDb.collection('cart_reminders').add({
          userId,
          sentAt: new Date().toISOString(),
          count: (reminderCount || 0) + 1,
          items: items.map((i: any) => ({ productId: i.productId, quantity: i.quantity })),
          cartUpdatedAt: updatedAt,
        });

        results.push({ userId, email: userEmail, itemCount: items.length, status: 'sent' });
        logger.info('cart', `Abandoned cart email sent`, { userEmail, itemCount });
      }

      res.json({ checked: cartsSnap.docs.length, results });
    } catch (err: any) {
      logger.error('cart', 'Abandoned cart check failed', { error: (err as Error).message });
      res.status(500).json({ error: err.message });
    }
  });

  // â”€â”€â”€ Stripe webhook (raw body) â†' server/routes/stripe.ts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // MUST register before express.json() so the raw body survives for signature verification
  registerStripeWebhook(app, stripe, adminDb);

  // ─── EasyPost carrier webhook (raw body) → server/routes/carrierWebhook.ts ─
  // MUST also register before express.json() for HMAC verification to work
  registerCarrierWebhook(app, { adminDb });

  // JSON parser for all other routes
  app.use(express.json());

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV });
  });

  // â”€â”€â”€ Stripe payment endpoints â†' server/routes/stripe.ts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  registerStripeRoutes(app, { stripe, adminDb, verifyFirebaseToken, verifyAdmin, port: PORT });

  // â”€â”€â”€ iyzico API â†' server/routes/iyzico.ts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const iyzicoProvider = new IyzicoProvider({ getIyzico });
  registerIyzicoRoutes(app, {
    getIyzico,
    iyzicoProvider,
    adminDb,
    verifyFirebaseToken,
    port: PORT,
  });

  // â”€â”€â”€ Seller REST API (/api/v1) â†' server/routes/sellerApi.ts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  registerSellerApiRoutes(app, adminDb);

  registerGeminiRoutes(app);

  // --- Custom Claims Admin API ---
  // POST /api/admin/set-claims — Set custom claims for a user (verifyAdmin)
  app.post('/api/admin/set-claims', verifyAdmin, async (req: any, res) => {
    try {
      const { uid, claims } = req.body;
      if (!uid || typeof uid !== 'string') {
        return res.status(400).json({ error: 'uid is required' });
      }
      if (!claims || !claims.role || !['admin', 'seller', 'buyer'].includes(claims.role)) {
        return res.status(400).json({ error: 'claims.role must be admin, seller, or buyer' });
      }
      // Validate adminRole if provided (only relevant when role is admin)
      const validAdminRoles = ['super-admin', 'support', 'finance'];
      if (claims.adminRole !== undefined) {
        if (!validAdminRoles.includes(claims.adminRole)) {
          return res.status(400).json({
            error: `Invalid adminRole. Must be one of: ${validAdminRoles.join(', ')}`,
          });
        }
        if (claims.role !== 'admin') {
          return res.status(400).json({ error: 'adminRole can only be set when role is admin' });
        }
      }
      if (!adminAuth) {
        return res.status(503).json({ error: 'Auth not configured' });
      }
      await adminAuth.setCustomUserClaims(uid, claims);
      audit(
        req.uid,
        req.userEmail ?? '',
        req.decodedToken?.role || 'admin',
        'admin.role_change',
        'user',
        uid,
        `Role change for ${uid}`,
        `role=${claims.role}, adminRole=${claims.adminRole || 'none'}`,
      );
      logger.info('admin', 'Custom claims set', {
        uid,
        role: claims.role,
        adminRole: claims.adminRole,
      });
      res.json({ success: true });
    } catch (err: any) {
      logger.error('admin', 'Failed to set custom claims', { error: (err as Error).message });
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/admin/get-claims/:uid — Get custom claims for a user (verifyAdmin)
  app.get('/api/admin/get-claims/:uid', verifyAdmin, async (req: any, res) => {
    try {
      if (!adminAuth) {
        return res.status(503).json({ error: 'Auth not configured' });
      }
      const user = await adminAuth.getUser(req.params.uid);
      res.json({ claims: user.customClaims || {} });
    } catch (err: any) {
      logger.error('admin', 'Failed to get custom claims', { error: (err as Error).message });
      res.status(500).json({ error: (err as Error).message });
    }
  });

  //  Order Set API (/api/orders/*)  server/routes/orders.ts
  registerOrderRoutes(app, { adminDb, verifyFirebaseToken, getIyzico });

  //  Reviews API (/api/reviews)  server/routes/reviews.ts (verified-purchase gated)
  registerReviewRoutes(app, { adminDb, verifyFirebaseToken });

  //  Commission Rules API (/api/commission-rules/*) - server/routes/commission.ts
  registerCommissionRoutes(app, { adminDb, verifyFirebaseToken, verifyAdmin });

  //  Compliance API (/api/compliance/*)  server/routes/compliance.ts
  registerComplianceRoutes(app, { adminDb, verifyFirebaseToken, verifyAdmin });

  // POST /api/send-push â€” Send push notification to a user
  app.post('/api/send-push', verifyFirebaseToken, async (req: any, res) => {
    try {
      const { userId, title, body, url } = req.body;
      if (
        !isNonEmptyString(userId, 128) ||
        !isNonEmptyString(title, 200) ||
        !isNonEmptyString(body, 1000)
      ) {
        return res.status(400).json({ error: 'userId, title, body required (valid strings)' });
      }
      if (url !== undefined && !isNonEmptyString(url, 2000)) {
        return res.status(400).json({ error: 'invalid url' });
      }
      if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not initialized' });

      const tokenDoc = await adminDb.collection('pushTokens').doc(userId).get();
      if (!tokenDoc.exists) return res.json({ sent: false, reason: 'No push token' });

      const token = tokenDoc.data()!.token;
      await adminDb.collection('pushMessages').add({
        userId,
        title,
        body,
        url: url || null,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      return res.json({ sent: true, token: token.slice(0, 20) + '...' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // â”€â”€â”€ Payout + Finance Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  registerPayoutRoutes(app, {
    adminDb,
    verifyAdmin,
    verifyCronSecret,
    verifyFirebaseToken,
    requireAdminRole,
  });
  registerFinanceRoutes(app, { adminDb, verifyFirebaseToken });

  // ─── Email Trigger Config (/api/email/*) ─────────────────────────────────
  registerEmailRoutes(app, { adminDb, verifyAdmin });

  // ─── Admin Refund + Cancel Order Routes ──────────────────────────────────
  registerRefundRoutes(app, { adminDb, getIyzico, verifyAdmin, requireAdminRole });

  // ─── CSV Bulk Import / Export Routes (SEL-05) ────────────────────────────
  registerCsvImportRoutes(app, { adminDb, verifyFirebaseToken });

  // ─── Shipping label creation → server/routes/shipping.ts ────────────────
  registerShippingRoutes(app, { adminDb, verifyFirebaseToken, verifySeller });

  // ─── Carrier cron routes (Entegi poll + delay check) ────────────────────
  registerCarrierPollRoutes(app, { adminDb, verifyCronSecret });

  // ─── Returns workflow routes (SHP-05) → server/routes/returns.ts ─────────
  registerReturnsRoutes(app, {
    adminDb,
    verifyFirebaseToken,
    verifyAdmin,
    verifySeller,
    getIyzico,
  });

  // ─── Typesense search sync → server/routes/typesenseSync.ts ────────────────
  registerTypesenseSyncRoutes(app, { verifyFirebaseToken });

  // ─── FX Rate routes → server/routes/fxRates.ts ──────────────────────────
  registerFxRateRoutes(app, { verifyCronSecret });
  registerVerificationRoutes(app);

  // â”€â”€â”€ Legacy Scheduled Auto-Payout (sellerBalances â€” kept for backward compat) â”€â”€
  // The new T+7 ledger-based payout is handled by registerPayoutRoutes above.
  app.post('/api/process-scheduled-payouts-legacy', verifyCronSecret, async (_req, res) => {
    try {
      if (!adminDb) return res.status(503).json({ error: 'Firebase Admin not initialized' });
      const schedulesSnap = await adminDb.collection('payoutSchedules').get();
      const schedules = new Map<string, any>();
      schedulesSnap.docs.forEach((d) => {
        const s = d.data();
        if (s.autoPayoutEnabled) schedules.set(s.sellerId, s);
      });

      if (schedules.size === 0) {
        return res.json({
          processed: 0,
          skipped: 0,
          failed: 0,
          totalAmount: 0,
          message: 'No auto-payout enabled sellers',
        });
      }

      const balancesSnap = await adminDb.collection('sellerBalances').get();
      const now = new Date().toISOString();
      let processed = 0,
        skipped = 0,
        failed = 0,
        totalAmount = 0;
      const details: any[] = [];

      for (const balanceDoc of balancesSnap.docs) {
        const balance = balanceDoc.data();
        const schedule = schedules.get(balance.sellerId);
        if (!schedule) {
          skipped++;
          continue;
        }

        const available = balance.availableBalance ?? 0;
        if (available < (schedule.minBalanceThreshold ?? 500)) {
          skipped++;
          continue;
        }

        try {
          const fee = Math.round(Math.max(5, available * 0.01) * 100) / 100;
          const netAmount = Math.round((available - fee) * 100) / 100;

          await adminDb.collection('payoutRequests').add({
            sellerId: balance.sellerId,
            amount: available,
            fee,
            netAmount,
            status: 'completed',
            method: 'bank_transfer',
            destination: 'auto',
            autoGenerated: true,
            processedBy: 'cron',
            processedAt: now,
            createdAt: now,
          });

          // Update schedule
          const schedSnap = await adminDb
            .collection('payoutSchedules')
            .where('sellerId', '==', balance.sellerId)
            .get();
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
          details.push({
            sellerId: balance.sellerId,
            amount: available,
            status: 'failed',
            reason: err.message,
          });
        }
      }

      logger.info('payout', `Auto-payout completed`, {
        processed,
        skipped,
        failed,
        total: totalAmount,
      });
      return res.json({ processed, skipped, failed, totalAmount, details });
    } catch (err: any) {
      logger.error('payout', 'Auto-payout endpoint error', { error: (err as Error).message });
      return res.status(500).json({ error: err.message });
    }
  });

  // Chrome DevTools capability endpoint â€” avoid 404 noise in console
  app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
    res.json({});
  });

  // Firebase Hosting auto-config â€” served natively by Firebase Hosting in production;
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
  if (process.env.NODE_ENV !== 'production') {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      logger.error('vite', 'Failed to create dev server', { error: (err as Error).message });
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

  // â”€â”€â”€ Centralized error handler (must be last middleware) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('server', 'Unhandled error', {
      message: err?.message,
      stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined,
    });
    res.status(err?.status || 500).json({
      error:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err?.message || 'Unknown error',
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    logger.info('server', `Benim Olan Server running`, { port: PORT });
  });
}

startServer();
