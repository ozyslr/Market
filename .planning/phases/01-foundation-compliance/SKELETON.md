# Walking Skeleton — Benim Olan (Mercora)

**Phase:** 1
**Generated:** 2026-06-02

## Capability Proven End-to-End

A signed-in buyer creates an order through the Express API -> OrderSet + SubOrder documents are written to Firestore (server-side validated) -> the buyer sees the order on their order history page. The transition matrix enforces valid state transitions (pending -> processing). This proves the OrderSet/SubOrder data model, state machine engine, and Firestore security rules work end-to-end.

## Architectural Decisions

| Decision          | Choice                                                                                                                                                                         | Rationale                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Framework         | Express.js (existing) + React 19 SPA (Vite 6)                                                                                                                                  | Already live. No rewrite. Extend existing route registration pattern. |
| Data model        | OrderSet (parent) + SubOrder (per-seller) in Firestore                                                                                                                         | Multi-seller preparation; per-seller checkout in Phase 1. D-01.       |
| State machine     | Server-side TypeScript transition matrix (no external lib)                                                                                                                     | Centralized authority for order lifecycle. D-02.                      |
| Immutable ledger  | Append-only Firestore collection with SHA-256 hash chain                                                                                                                       | Audit compliance. No update/delete on ledger entries. D-03.           |
| Auth model        | Firebase custom claims (3 roles: admin/seller/buyer)                                                                                                                           | Eliminates Firestore rule `get()` calls for role checks. D-10, D-11.  |
| Commission rules  | Specificity priority: seller override > category > global 10%                                                                                                                  | D-04. Stored in Firestore, calculated server-side.                    |
| Cookie consent    | 3-tier granular (mandatory/analytics/marketing) with GDPR/KVKK dual flow                                                                                                       | TR buyer: implicit consent + opt-out. EU buyer: opt-in default. D-07. |
| Deployment target | Local dev: `npm run dev`. Firebase security rules: `firebase deploy --only firestone:rules`                                                                                    | No production hosting changes in Phase 1.                             |
| Directory layout  | New `server/routes/orders.ts`, `server/routes/commission.ts`, `server/services/transitionEngine.ts`, `server/services/commissionEngine.ts`, `server/services/ledgerService.ts` | Follows existing `server/routes/stripe.ts` registration pattern.      |

## Stack Touched in Phase 1

- [x] Project scaffold (Express + React SPA + Vite 6) -- EXISTS
- [x] Routing (React Router + Express catch-all) -- EXISTS
- [x] Authentication (Firebase Auth + server-side token verification) -- EXISTS
- [ ] Database -- OrderSet, SubOrder, LedgerEntry collections created in Firestore with security rules
- [ ] State machine -- transitionEngine.ts with transition matrix, optimistic concurrency
- [ ] API -- POST /api/orders/create, GET /api/orders, GET /api/orders/:orderSetId
- [ ] UI -- Updated OrderHistory page fetching from API. Updated OrderTracking page showing SubOrders.
- [ ] Commission -- Commission rule engine with specificity priority, admin CRUD API
- [ ] Compliance -- Cookie consent 3-tier, GDPR/KVKK dual flow, 5 legal pages, data deletion
- [ ] Security -- 3-role custom claims, per-collection Firestore rules, schema deploy
- [ ] Deployment -- `firebase deploy --only firestore:rules` command verified

## Out of Scope (Deferred to Later Slices)

- Multi-seller checkout (single payment for items from multiple sellers) -- D-01 explicitly defers to P2
- KYC document upload and admin review workflow (Phase 3)
- Stripe Connect / Iyzico sub-merchant payout processing (Phase 2)
- Search engine integration (Phase 4)
- Shipping carrier API integration (Phase 5)
- Multi-currency display and settlement (Phase 6)
- Verified purchase badges and photo reviews (Phase 7)
- Cloud Function for T+7 auto-payout (Phase 2 -- ledger records in Phase 1, payout trigger later)
- VERBIS registration legal process (hukuk danismani ile yurutulecek -- deferred from D-09)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Payment & Order Lifecycle -- Iyzico TRY + Stripe EUR dual payment, escrow flow, order lifecycle with real payment, seller payout scheduling, transactional emails
- Phase 3: Seller Onboarding & KYC -- Document upload, admin review/approval, store management, CSV import/export
- Phase 4: Search & Discovery -- Typesense full-text search, faceted filters, event-driven indexing
- Phase 5: Shipping & Fulfillment -- Entegi + EasyPost carrier integration, live tracking, returns
- Phase 6: Multi-Currency -- FX rate service, TRY/EUR display, rate locking at checkout
- Phase 7: Reviews & Trust -- Verified purchase badge, photo reviews, seller Q&A
