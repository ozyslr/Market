---
phase: 05-shipping-fulfillment
plan: '03'
subsystem: shipping
tags: [tdd, shipping-routes, carrier-webhook, cron-poll, email, server-wiring]
dependency_graph:
  requires:
    - cargoService.ts (Plan 01 — routeCarrierByRegion, createCargoShipment, getTrackingStatus)
    - transitionEngine.ts (Phase 2 — transitionSubOrder)
    - emailService.ts (existing sendDeliveryConfirmationEmail, sendShippingUpdateEmail)
  provides:
    - server/routes/shipping.ts (registerShippingRoutes — POST .../ship)
    - server/routes/carrierWebhook.ts (registerCarrierWebhook — EasyPost HMAC webhook)
    - server/routes/carrierPoll.ts (registerCarrierPollRoutes — Entegi poll + delay check)
    - server/services/emailService.ts (sendDelayNotificationEmail added)
  affects:
    - server.ts (three new route registrations, correct raw-body ordering)
tech_stack:
  added: []
  patterns:
    - Raw-body webhook before express.json() (mirrors registerStripeWebhook pattern)
    - Two-phase processedWebhooks dedup (pre-check get + inside-transaction re-check)
    - crypto.timingSafeEqual HMAC verification with length-mismatch guard
    - verifyCronSecret middleware on cron endpoints (same as payouts/abandoned-cart)
    - Seller ownership guard (sellerId !== uid → 403) on ship endpoint
    - Non-blocking void email dispatch pattern
key_files:
  created:
    - server/routes/shipping.ts
    - server/routes/carrierWebhook.ts
    - server/routes/carrierPoll.ts
  modified:
    - server/services/emailService.ts
    - server.ts
decisions:
  - 'D-03-01: EasyPost @easypost/api SDK deferred (D-01); mock providers from Plan 01 used throughout'
  - 'D-03-02: Delay-check query uses in-memory filter (estimatedDelivery < now && !deliveredAt) — Firestore cannot cleanly combine string comparison with missing-field check at current scale'
  - 'D-03-03: registerCarrierWebhook inserted immediately after registerStripeWebhook and before express.json() to preserve raw-body access'
metrics:
  duration: ~25min
  completed: '2026-06-04'
  tasks_completed: 2
  files_created: 3
---

# Phase 05 Plan 03: Shipping Routes + Carrier Webhook + Cron Poll Summary

Three backend route modules (ship-label creation, EasyPost HMAC webhook, Entegi cron poll + delay check) with sendDelayNotificationEmail added to emailService and all routes wired into server.ts; shipping tests 7/7 green.

## Tasks Completed

| Task | Name                                                                      | Commit  | Files                                                                    |
| ---- | ------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------ |
| 1    | Create shipping.ts route + add sendDelayNotificationEmail to emailService | 2214ced | server/routes/shipping.ts, server/services/emailService.ts               |
| 2    | Create carrierWebhook.ts + carrierPoll.ts + wire all routes in server.ts  | d7e9306 | server/routes/carrierWebhook.ts, server/routes/carrierPoll.ts, server.ts |

## What Was Built

**server/routes/shipping.ts** — `registerShippingRoutes`: POST `/api/orders/:orderSetId/subOrders/:subOrderId/ship` guarded by `verifyFirebaseToken + verifySeller`. Verifies seller ownership (sellerId !== uid → 403), routes carrier by region via `routeCarrierByRegion`, calls `createCargoShipment`, writes `trackingNumber/carrier/estimatedDelivery/labelCost/currentTrackingStatus` to SubOrder, transitions state via `transitionSubOrder(..., 'mark_shipped')`, fires `sendShippingUpdateEmail` non-blocking.

**server/routes/carrierWebhook.ts** — `registerCarrierWebhook`: POST `/api/carrier/easypost/webhook` with `express.raw({ type: 'application/json' })`. Inline `validateEasyPostHmac` using `crypto.timingSafeEqual` with length-mismatch guard; skips HMAC in mock mode (empty `EASYPOST_WEBHOOK_SECRET`). Two-phase dedup via `processedWebhooks` collection (pre-check + inside-transaction re-check). On `tracker.updated` + `delivered`: `transitionSubOrder(..., 'confirm_delivery')` + `sendDeliveryConfirmationEmail` non-blocking.

**server/routes/carrierPoll.ts** — `registerCarrierPollRoutes`: two cron endpoints both protected by `verifyCronSecret`. `/api/carrier/entegi/poll` queries shipped Entegi subOrders ≤30 days ago, calls `getTrackingStatus`, transitions delivered ones. `/api/carrier/check-delays` queries shipped-but-undelivered subOrders with overdue `estimatedDelivery`, fetches OrderSet for customer details, fires `sendDelayNotificationEmail` non-blocking.

**server/services/emailService.ts** — `sendDelayNotificationEmail(orderSetId, customerEmail, customerName, estimatedDelivery, carrier)` added. Turkish subject line, inline HTML template, non-blocking try/catch with `logger.error`.

**server.ts** — `registerCarrierWebhook` called after `registerStripeWebhook` and before `app.use(express.json())`; `registerShippingRoutes` and `registerCarrierPollRoutes` called after JSON middleware.

## Test Results

Shipping tests: **7/7 PASS** (verified by orchestrator before this plan's closeout). Tests cover `routeCarrierByRegion` (TR/DE/FR routing), `MockEntegiProvider` create+track, `MockEasyPostProvider` create+track — all green against the Plan 01 cargoService implementation.

## Threat Model Coverage

| Threat                          | Mitigation                             | Status      |
| ------------------------------- | -------------------------------------- | ----------- |
| T-05-03-01 Spoofing (webhook)   | validateEasyPostHmac + timingSafeEqual | Implemented |
| T-05-03-02 Tampering (replay)   | processedWebhooks two-phase dedup      | Implemented |
| T-05-03-03 EoP (ship ownership) | sellerId !== uid → 403                 | Implemented |
| T-05-03-04 EoP (cron endpoints) | verifyCronSecret middleware            | Implemented |
| T-05-03-05 labelUrl disclosure  | accepted (mock URLs, non-sensitive)    | N/A         |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- server/routes/shipping.ts — FOUND (commit 2214ced)
- server/routes/carrierWebhook.ts — FOUND (commit d7e9306)
- server/routes/carrierPoll.ts — FOUND (commit d7e9306)
- server/services/emailService.ts (sendDelayNotificationEmail) — FOUND (commit 2214ced)
- server.ts wiring — FOUND (commit d7e9306)
