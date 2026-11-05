---
quick_id: 261105-d2x
slug: server-side-checkout-authoritative-quote
date: 2026-11-05
status: complete
---

# Summary — Server-side checkout, order/return flows, rules for 16 collections

## Why

Audit (261104-wtk) found the shop could not safely sell: orders were written by the browser with a
client-chosen `status: 'paid'`, guests could not create orders, iyzico payments never created an order
(empty basket + random id; schema rejected it anyway), sellers could neither read nor ship their orders,
buyer return requests went to a collection sellers never read, and 16 client-used collections had no rule.
Found while fixing: `/api/create-payment-intent` trusted an **unverified** JWT for saved cards (charge any
user's saved card with a forged token), Apple/Google Pay created a second, unvalidated PaymentIntent, and
guests were charged in GBP (default currency) for TRY prices.

## What changed

- `server/services/checkoutQuote.ts` — server total: DB prices, coupon (incl. seller-scoped), best cart
  campaign, TR VAT on top, shipping (client rate capped at 1000 TRY — shortcut until carrier APIs).
- `/api/create-payment-intent` — `verifyFirebaseToken`; charges the server quote in TRY, refuses (409) if
  the shown total differs by > 1 TRY; PaymentIntent metadata binds `uid` + cart signature.
- `server/routes/checkout.ts` — `/api/checkout/complete` creates every order:
  stripe (PI must be succeeded/own/same cart; idempotent via `paymentClaims/{pi}`; stock + coupon in one
  transaction), manual EFT (stock reserved, `pending`), iyzico (`pending` until paid).
  `/api/checkout/quote` — coupon preview (buyers can no longer read `coupons`).
- iyzico: `/api/iyzico/init` takes only `{orderId, installment}` (auth, owner, amount/basket from the order);
  browser + server callbacks mark the order paid (`markIyzicoOrderPaid`, idempotent, checks paid ≥ total)
  or cancelled; redirect carries `orderId` so the confirmation page shows the order.
- Checkout.tsx: TRY only, server order creation, "Tekrar dene" after a paid-but-unsaved order (no second
  charge). Wallet pay confirms the existing PaymentIntent. Seller list hides unpaid iyzico orders.
- Seller shipping: checkout orders are shipped with a manual tracking number (label API is subOrder-only).
- Returns: `POST /api/orders/:orderId/return-request` (owner, delivered, 14 days, per seller) →
  `returns`; approve/reject understand checkout orders (approve = approval only, admin refunds via
  `/api/refund`). Dead `returnService.ts` (`returnRequests`) removed.
- Queries scoped for rules: warehouseStock (+`sellerId`), stockMovements, per-seller invoice numbering.
- `firestore.rules`: orders (create server-only; guest/seller read; seller fulfilment fields; buyer
  delivered), returns create server-only, rules for support_tickets, notifications, priceAlerts,
  priceTracks, stockAlerts, coupons, sellerCoupons, warehouses, warehouseStock, stockMovements, invoices,
  pricingRules, sellerIntegrations, apiKeys, productCertificates, sellerTiers.

## Verification

- `tsc --noEmit` clean; vitest 38 files / 328 tests pass (new: checkoutQuote.test.ts — quote math, coupon,
  shipping cap, cart signature, iyzico basket sum).
- Rules tested with the Firebase Rules API (`projects.test`, not deployed): 35/35 scenarios pass.
- New server modules load under tsx.

## Not done / follow-ups

- **Deploy order:** Cloud Run first (new endpoints), then push (Hosting), then `firebase deploy --only
firestore:rules` (user approval). Old client ↔ new server is incompatible.
- Not tested end-to-end with a real card / iyzico sandbox (iyzico keys not configured in prod).
- Seller-triggered price/stock alert fan-out (`priceAlerts`/`stockAlerts` queried by productId) is now denied
  → needs a server job. Existing `warehouseStock` docs without `sellerId` become unreadable (none expected).
- Checkout-order returns: no return label, no automatic refund (iyzico refund needs transaction ids).
