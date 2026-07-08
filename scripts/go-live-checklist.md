# Go-Live Checklist — Benim Olan (Mercora)

**Created:** 2026-06-07 | **Target:** Production launch

## Payments

- [ ] Stripe production keys configured (sk*live* / pk*live*)
- [ ] Stripe webhook secret set + verified in Dashboard
- [ ] Stripe Tax enabled in Dashboard (EU VAT)
- [ ] Iyzico production keys configured
- [ ] Test charge: Stripe EUR payment succeeds
- [ ] Test charge: Iyzico TRY payment succeeds
- [ ] 3DS authentication flow tested
- [ ] Refund flow tested (full + partial)

## Infrastructure

- [ ] Typesense Cloud/server provisioned + API key set
- [ ] Bootstrap script run: all products indexed
- [ ] Firestore → Typesense sync verified (add product, search within 5s)
- [ ] Firebase Storage rules deployed (`firebase deploy --only storage`)
- [ ] Firestore rules deployed (`firebase deploy --only firestore:rules`)
- [ ] Firestore indexes deployed (`firebase deploy --only firestore:indexes`)

## Core Flows

- [ ] Guest checkout: anonymous → cart → Stripe → paid order
- [ ] Registered checkout: login → cart → saved card → paid order
- [ ] Seller registration: KYC docs → admin approval → product listing
- [ ] Product search: typo-tolerant results (Typesense)
- [ ] Currency toggle: EUR/TRY prices update correctly
- [ ] Rate lock: 15-min countdown on checkout
- [ ] Invoice PDF: downloadable from order detail

## E2E Tests

- [ ] `npx playwright test e2e/checkout-guest.spec.ts` — PASS
- [ ] `npx playwright test e2e/checkout-authenticated.spec.ts` — PASS
- [ ] `npx playwright test e2e/checkout-address-book.spec.ts` — PASS

## Email & Notifications

- [ ] Order confirmation email received
- [ ] Shipping update email received
- [ ] Seller approval notification email received
- [ ] Abandoned cart email triggers

## Compliance

- [ ] KVKK/GDPR consent banner shown
- [ ] Privacy Policy + Terms of Service pages live
- [ ] GPSR compliance badge on product detail (EU)
- [ ] HS codes displayed on product detail

## Performance

- [ ] Lighthouse CI thresholds met (LCP < 2.5s, CLS < 0.1, TBT < 200ms)
- [ ] Bundle budget check passes
- [ ] OptimizedImages using srcSet

## Security

- [ ] Helmet security headers active
- [ ] CORS restricted to production domain
- [ ] Rate limiting enabled on API routes
- [ ] Admin routes require authentication (verifyAdmin middleware)
- [ ] Firebase Storage rules restrict write to authenticated users

## Sign-off

- [ ] All items above checked
- [ ] DNS: benimolan.com points to production
- [ ] SSL: HTTPS enforced
- [ ] Monitoring: Sentry + Firebase Console alerts configured
