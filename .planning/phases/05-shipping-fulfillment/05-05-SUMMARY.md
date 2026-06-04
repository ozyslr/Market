---
phase: 05-shipping-fulfillment
plan: '05'
subsystem: shipping-ui
tags: [seller-orders, order-tracking, carrier-integration, ui-wiring]
dependency_graph:
  requires:
    - server/routes/shipping.ts (Plan 03 — POST .../ship endpoint)
    - src/types/order.ts (Plan 01 — SubOrder tracking fields)
  provides:
    - src/pages/SellerOrders.tsx (handleShip calls backend route; shows trackingNumber + labelUrl)
    - src/pages/OrderTracking.tsx (SubOrder tracking status, estimatedDelivery, return window button)
  affects:
    - Seller order modal (ship button label + result display)
    - Buyer order detail page (new tracking section per SubOrder)
tech_stack:
  added: []
  patterns:
    - fetch() with Authorization Bearer for server-side route call
    - Inline IIFE pattern for status label mapping inside JSX
    - Client-side 14-day return window gate (UX-only; server enforces in Plan 04)
key_files:
  created: []
  modified:
    - src/pages/SellerOrders.tsx
    - src/pages/OrderTracking.tsx
decisions:
  - 'D-05-05-01: fetch() used (not axios) for ship endpoint — axios already imported but fetch is simpler for a single POST; axios remains for other calls'
  - 'D-05-05-02: orderSetId falls back to shipTarget.id for backward compat with old Order model documents that lack the orderSetId field'
  - 'D-05-05-03: Tracking section added only to useNewModel (OrderSet/SubOrder) render path — old Order model already has CarrierTrackingCard handling'
metrics:
  duration: ~20min
  completed: '2026-06-04'
  tasks_completed: 2
  files_created: 0
---

# Phase 05 Plan 05: Carrier Integration UI Wiring Summary

Backend shipping route wired into seller UI (POST .../ship with Bearer token, trackingNumber + labelUrl displayed on success) and buyer order tracking page extended with live SubOrder tracking fields (currentTrackingStatus badge, estimatedDelivery, 14-day return window button).

## Tasks Completed

| Task | Name                                                                 | Commit  | Files                       |
| ---- | -------------------------------------------------------------------- | ------- | --------------------------- |
| 1    | Update SellerOrders.tsx — replace handleShip with backend route call | 43808f2 | src/pages/SellerOrders.tsx  |
| 2    | Update OrderTracking.tsx — display live SubOrder tracking fields     | daa9a05 | src/pages/OrderTracking.tsx |

## What Was Built

**src/pages/SellerOrders.tsx** — `handleShip` refactored: fires `POST /api/orders/:orderSetId/subOrders/:subOrderId/ship` with `Authorization: Bearer <token>` and `{ weight: 1, desi: 1 }` body. On 200: `shipResult` state stores `trackingNumber`, `labelUrl`, `estimatedDelivery`; modal shows success panel with "Etiketi Görüntüle" link. On error: `shipError` displays inline. Button label changed to "Kargola + Etiket Al" (table row + modal submit). Removed unused `createCargoShipment` and `getAvailableCarriers` imports. Invoice generation and notification remain non-blocking.

**src/pages/OrderTracking.tsx** — Inside the `useNewModel` SubOrder render loop, a new tracking section appears when `subOrder.status === 'shipped' || 'delivered'`: carrier name, tracking number code element, `currentTrackingStatus` badge with Turkish label mapping (pre_transit/in_transit/out_for_delivery/delivered + Turkish aliases), `estimatedDelivery` formatted date. For `delivered` SubOrders with `deliveredAt`: inline IIFE computes `daysElapsed`; renders "Iade Talebi Olustur" button within 14 days or "Iade suresi doldu (14 gun)" text beyond the window. Return form submission deferred to Plan 06.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Coverage

| Threat                               | Mitigation                                                        | Status      |
| ------------------------------------ | ----------------------------------------------------------------- | ----------- |
| T-05-05-03 Spoofing (Bearer token)   | getIdToken() on client; verifyFirebaseToken on server             | Implemented |
| T-05-05-02 Tampering (14-day window) | Client check is UX-only; server enforces in Plan 04 returns route | Accepted    |
| T-05-05-01 labelUrl disclosure       | Mock mode — non-sensitive relative path                           | Accepted    |

## Self-Check: PASSED

- src/pages/SellerOrders.tsx — FOUND (commit 43808f2)
- src/pages/OrderTracking.tsx — FOUND (commit daa9a05)
- npx tsc --noEmit — zero errors on both files
- handleShip POSTs to /api/orders/:orderSetId/subOrders/:subOrderId/ship — VERIFIED
- Button label "Kargola + Etiket Al" — VERIFIED
- currentTrackingStatus badge in OrderTracking — VERIFIED
- estimatedDelivery display — VERIFIED
- Return window button — VERIFIED
