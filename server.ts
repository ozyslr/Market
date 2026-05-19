import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";
import { adminDb } from "./src/lib/firebase-admin.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
});

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mercora Omni-Channel Server running on http://localhost:${PORT}`);
  });
}

startServer();
