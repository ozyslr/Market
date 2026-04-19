import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

// Middleware to check authentication (dummy for now until we move to Firebase Auth properly on the backend or we just pass the user ID from the frontend)
const authenticateUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // TODO: Verify Firebase ID token
  next();
};

router.post('/create-intent', authenticateUser, async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amounts in cents
      currency,
      // In the latest api versions, automatic_payment_methods is enabled by default
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Stripe create-intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

export default router;
