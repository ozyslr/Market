---
phase: 11-purchase-funnel-guest-checkout
plan: 03
status: complete
tags: [express-wallets, apple-pay, google-pay, stripe, payment-request-api]
requires: ['11-01']
provides: ['PaymentRequestButtonElement integration', 'express wallet backend support']
affects: [Checkout payment step]
tech-stack:
  added: []
  patterns:
    [
      'PaymentRequestButtonElement graceful fallback',
      'dual paymentMethodId routing (saved-card vs express-wallet)',
    ]
key-files:
  created: []
  modified:
    - src/components/checkout/StripePaymentForm.tsx
    - server/routes/stripe.ts
    - server/lib/schemas.ts
decisions:
  - 'Express wallet paymentMethodId routed without auth on backend (distinct from saved-card auth-required path)'
  - 'PaymentRequest country hardcoded to TR; currency from checkout context'
  - 'any type used for Stripe PaymentRequest runtime object (typed API incomplete for destroy/listener)'
completed: 2026-06-05
commits:
  Task 1: 03ec41e
  Task 2: 68a0579
duration: '~25m'
task-count: 2
---

# Phase 11 Plan 03: Express Wallets (Apple Pay / Google Pay) Summary

Added Apple Pay and Google Pay integration via Stripe's Payment Request Button, with graceful fallback when Payment Request API is unavailable. No server-side webhook changes needed.

## Tasks Completed

### Task 1: PaymentRequestButtonElement with graceful fallback

**Commit:** `03ec41e`

Modified `src/components/checkout/StripePaymentForm.tsx` to integrate `PaymentRequestButtonElement`:

- Imported `PaymentRequestButtonElement` from `@stripe/react-stripe-js`
- Created `stripe.paymentRequest()` in a mount-effect with `canMakePayment()` check
- Button renders only when browser supports Apple Pay or Google Pay
- Divider text ("veya kart ile") shown between express wallet button and card form
- `paymentmethod` event POSTs paymentMethodId to backend; on success, extracts PI ID and calls `onSuccess`
- Uses refs for closure-safe access to `total`, `currency`, `onSuccess`
- Graceful fallback: `canMakePayment()` returns false on HTTP or unsupported browsers, button never renders
- Mock mode skips PaymentRequest entirely

### Task 2: Backend express wallet paymentMethodId support

**Commit:** `68a0579`

Modified `server/routes/stripe.ts` and `server/lib/schemas.ts`:

- Added optional `paymentMethodId` to `createPaymentIntentSchema`
- Restructured `/api/create-payment-intent` routing:
  - `paymentMethodId` + Bearer auth: saved card (existing, off_session, customer-attached)
  - `paymentMethodId` only (no auth): express wallet (new, online confirm with `automatic_payment_methods`)
  - No `paymentMethodId`: standard flow (unchanged)
- Express wallet PaymentIntent created with `payment_method`, `confirm: true`, `automatic_payment_methods`
- `payment_intent.succeeded` webhook already handles express wallet payments identically

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx tsc --noEmit` passes (no new errors introduced)
- Pre-existing type errors in `AddressSelector.tsx` and `Checkout.tsx` (from Plan 11-02) are unchanged
- Production verification required for Apple Pay (HTTPS + Safari) and Google Pay (HTTPS + Chrome)
- HTTP localhost: `canMakePayment()` returns false, button gracefully hidden

## Known Stubs

None.

## Threat Flags

None — threat surface unchanged. Payment Request API tokenizes card details in the browser; card data never touches our server.

## Self-Check

- [x] `src/components/checkout/StripePaymentForm.tsx` exists and contains PaymentRequestButtonElement
- [x] `server/routes/stripe.ts` contains express wallet paymentMethodId routing
- [x] `server/lib/schemas.ts` includes `paymentMethodId` in createPaymentIntentSchema
- [x] Commit `03ec41e` exists: feat(11-03): add PaymentRequestButtonElement with graceful fallback
- [x] Commit `68a0579` exists: feat(11-03): add express wallet paymentMethodId support to backend
