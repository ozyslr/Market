---
status: partial
phase: 05-shipping-fulfillment
source: [05-VERIFICATION.md]
started: 2026-06-04T18:50:00Z
updated: 2026-06-04T18:50:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Seller end-to-end shipment creation

expected: As a seller with a Processing-status order, on `/seller/orders` click "Kargola + Etiket Al". A loading spinner shows, then a success panel with tracking number + "Etiketi Görüntüle" link. Network tab: `POST /api/orders/:orderSetId/subOrders/:subOrderId/ship` returns 200 with `{ trackingNumber, labelUrl, estimatedDelivery }`. Firestore `subOrders/{id}` gets `trackingNumber`, `carrier`, `estimatedDelivery`, `status=shipped`.
result: [pending]

### 2. Buyer live tracking display

expected: As a buyer on `/orders/:orderSetId` for a shipped order, the tracking section shows carrier badge, tracking number, `currentTrackingStatus` badge with Turkish labels ("Yolda"/"Dağıtımda"/etc.), and estimated delivery date.
result: [pending]

### 3. Buyer return request submission

expected: As a buyer on a delivered order within the 14-day window, "İade Talebi Oluştur" button appears. Selecting a reason (+ optional notes) and submitting shows status badge "İade Talebi Alındı". Firestore `returns/{id}` doc created with `status=pending`/`requested`.
result: [pending]

### 4. Seller approve/reject returns flow

expected: As a seller on `/seller/orders` → "İadeler" → "İade Talepleri", the pending return appears. Clicking Onayla (approve) removes the card, shows a success message with tracking number, generates a return label populated with the real seller address/name, and triggers the Phase 2 refund engine (return reaches `refunded`). Reject path also works.
result: [pending]

### 5. Deploy Firestore rules

expected: Run `firebase deploy --only firestore:rules` (project market-ecommerce-app). The returns collection rule deploys successfully; buyer/seller returns reads/writes work against live rules per least-privilege (isFullUser()).
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
