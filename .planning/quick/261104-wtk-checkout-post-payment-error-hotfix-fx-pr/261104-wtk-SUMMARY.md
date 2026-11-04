---
quick_id: 261104-wtk
slug: checkout-post-payment-error-hotfix-fx-provider-entegi-index
date: 2026-11-04
status: complete
---

# Summary — Checkout post-payment error hotfix, FX provider, Entegi index

## Hotfix (Checkout.tsx)

After a paid order was created, `decreaseProductStock` (client transaction on `products`) and
`incrementCouponUsage` (`coupons`, no rule) threw permission-denied for every non-admin buyer → the buyer saw
"Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin." although they had paid (double-charge risk).
Both are now non-blocking (logged). Stock was never decremented for buyers before either; this changes only the
error the buyer sees.

## Cron follow-ups

- CRON_SECRET had a trailing CR (Windows openssl/gcloud output) → scheduler got 401. User re-created it clean,
  updated the 5 jobs and redeployed (rev 00006). Auth now passes.
- fx-rates: exchangerate.host now needs a key (401) → switched to keyless Frankfurter (ECB). Removed the silent
  0.028 fallback on refresh (real rate 0.0177, the guess was 58 % off). Needs a Cloud Run redeploy.
- entegi-poll: missing composite index subOrders(carrier, status, shippedAt) → added to firestore.indexes.json and
  created in prod via gcloud.

## Found, NOT fixed — P0 before real sales

1. Checkout creates orders client-side (`orders` collection) with client-written `status: 'paid'` — a user can
   create a "paid" order without paying; sellers read these orders. Server path `/api/orders/create` exists
   (verifies payment, reserves stock via server/services/stockService) but Checkout does not use it.
2. Guest checkout: `orders` create requires isFullUser() → anonymous guests cannot create the order after paying.
3. 17 client-used collections have no Firestore rule (admin-only via catch-all) — see 261104-w16.
4. ReturnRequestModal writes `returnRequests` (client-side auto-approval); sellers read `returns` → buyer return
   requests from the profile never reach sellers. Keep `returnRequests` locked; point the modal at the `returns` flow.
5. Invoice numbering (invoiceService.getNextInvoiceNumber) counts all sellers' invoices client-side — move to
   server with the e-Fatura integrator.
6. Client FX fallbacks still 0.028 (useExchangeRate, fxRateService) — TRY-only today, fix with multi-currency.
