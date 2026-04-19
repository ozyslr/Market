import { Router } from 'express';
import Stripe from 'stripe';
import db from '../db.js';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

router.post('/', (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    // request.body must be raw buffer here
    event = stripe.webhooks.constructEvent(request.body, sig as string, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent was successful!', paymentIntentSucceeded.id);
      // Here we should update the order status to 'processing' or 'paid'
      // We need a way to link the PaymentIntent to the Order.
      if (paymentIntentSucceeded.id) {
        db.prepare('UPDATE orders SET status = ? WHERE payment_intent_id = ?')
          .run('processing', paymentIntentSucceeded.id);
      }
      break;
    case 'payment_intent.payment_failed':
      const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
      console.log('Payment failed!', paymentIntentFailed.last_payment_error?.message);
      if (paymentIntentFailed.id) {
        db.prepare('UPDATE orders SET status = ? WHERE payment_intent_id = ?')
          .run('cancelled', paymentIntentFailed.id);
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});

export default router;
