---
phase: 05-shipping-fulfillment
plan: '06'
subsystem: returns-ui
tags: [returns, buyer-ux, seller-ux, firestore-rules]
dependency_graph:
  requires: [05-04]
  provides: [returns-ui-slice]
  affects: [OrderTracking, ReturnManagementSection, SellerOrders, firestore.rules]
tech_stack:
  added: []
  patterns:
    - SubOrderReturnSection state machine (idle/form/submitting/submitted)
    - Per-card actionLoading/actionSuccess/actionError maps in ReturnManagementSection
    - Firestore returns collection client read; Admin SDK write-only pattern
key_files:
  created: []
  modified:
    - src/pages/OrderTracking.tsx
    - src/components/seller/ReturnManagementSection.tsx
    - firestore.rules
decisions:
  - 'ReturnManagementSection rewired from returnService.ts (returnRequests collection, old ReturnRequest type) to returns Firestore collection + src/types/returns.ts types + backend API — no conflicting duplicate types remain in scope of this plan'
  - 'Legacy uid/show props preserved on ReturnManagementSection for SellerOrders.tsx backward compat (show toggle already wired pre-plan)'
  - 'firestore deploy flagged as human-action item — rule added to file but not deployed'
metrics:
  duration: '~35 minutes'
  completed: '2026-06-04'
  tasks_completed: 2
  files_modified: 3
---

# Phase 05 Plan 06: Returns UI Slice Summary

Returns UI vertical slice: buyer submits return request from delivered order → seller approves/rejects in Seller Orders page → refund triggered via Plan 04 backend.

## What Was Built

### Task 1 — OrderTracking.tsx + firestore.rules (commit c443b98)

**OrderTracking.tsx:**

- Added `SubOrderReturnSection` component with a 4-state machine: `idle → form → submitting → submitted`
- `ReturnStatusBadge` component: renders Turkish status label, optional `returnLabelUrl` download link, optional `rejectionReason` text
- Firestore fetch: queries `returns` collection on mount (where `subOrderId == id`, ordered by `createdAt desc`, limit 1) — shows existing return status without re-submitting
- Form: `<select>` for ReturnReason (5 options, TR labels), `<textarea maxLength={500}>` for notes, Submit/Cancel buttons
- POST `/api/orders/:orderSetId/subOrders/:subOrderId/return-request` with `Authorization: Bearer` token
- 409 `return_window_expired` → inline "İade süresi doldu" error; other errors shown inline
- Replaced the Plan 05 stub button (`/* Plan 06 will wire return form submission */`) with `<SubOrderReturnSection>`
- Only renders when `subOrder.status === 'delivered'` and within 14 days of `deliveredAt`
- All Plan 05 shipping/tracking UI preserved

**firestore.rules:**

- Added `match /returns/{returnId}` block with:
  - `allow read: if isFullUser() && (buyerId || sellerId match)`
  - `allow create: if isFullUser() && request.auth.uid == request.resource.data.buyerId`
  - `allow update, delete: if false` (Admin SDK server-side only)

### Task 2 — ReturnManagementSection.tsx (commit 1e6797f)

Rewrote component to use plan's `returns` Firestore collection and backend API:

- Queries `returns` where `sellerId == effectiveSellerId` and `status == 'pending'`
- `handleApprove`: POST `/api/returns/:id/approve` — on success removes card, shows `returnTrackingNumber` if present
- `handleReject`: POST `/api/returns/:id/reject` with `rejectionReason` — requires non-empty input per card before calling
- Per-card state maps: `actionLoading`, `actionSuccess`, `actionError`, `rejectionInputs`
- Empty state: "Bekleyen iade talebi yok"; loading spinner; error fallback
- Shows `windowExpiresAt` ("Son tarih: {date}") and `subOrderId` on each card
- Preserved `uid` and `show` legacy props — SellerOrders.tsx already wires `uid={firebaseUser?.uid}` and `show={showReturns}` (no change to SellerOrders needed)
- Named export `ReturnManagementSection`; no default export

**SellerOrders.tsx:** No changes required — import and JSX render already existed from pre-plan state (`grep -c "ReturnManagementSection" SellerOrders.tsx` returns 2).

## Deviations from Plan

**1. [Rule 1 - Bug] ReturnManagementSection pre-existed with wrong type binding**

- Found during: Task 2 read
- Issue: Existing component used `returnService.ts` types (`ReturnRequest` with `requested` status, `returnRequests` collection) — incompatible with plan's `returns` collection and `src/types/returns.ts` types
- Fix: Rewrote component to use `src/types/returns.ts` and backend API; removed returnService.ts imports entirely from this component
- Files modified: `src/components/seller/ReturnManagementSection.tsx`

**2. [Rule 2 - Missing] Legacy props preserved for backward compat**

- Found during: Task 2 — SellerOrders.tsx passes `uid` and `show` props
- Fix: Added `uid?: string` and `show?: boolean` to Props interface; `effectiveSellerId = sellerId ?? uid ?? firebaseUser?.uid`
- Prevents SellerOrders.tsx from needing changes

## Human-Action Item: Firestore Rules Deployment

The `firestore.rules` file has been updated with the `returns` collection rule, but deployment requires a manual step:

```bash
firebase deploy --only firestore:rules
```

This must be run by the developer to activate the rule in production. Emulator tests use the local file immediately.

## Known Stubs

None — all UI sections are wired to real data sources (Firestore `returns` collection or backend API routes).

## Threat Flags

No new network endpoints or trust boundaries introduced by this plan. All surface is from Plan 04 backend routes (already threat-modeled).

## Verification Results

- `npx tsc --noEmit` — exit code 0, zero errors
- `grep -c "match /returns/{returnId}" firestore.rules` → 1
- `grep -c "allow update, delete: if false" firestore.rules` → 1 (returns block)
- `grep -c "ReturnManagementSection" src/pages/SellerOrders.tsx` → 2 (import + render)
- `grep -c "return-request" src/pages/OrderTracking.tsx` → present (POST URL in handleSubmit)
- `grep -c "handleApprove\|handleReject" src/components/seller/ReturnManagementSection.tsx` → 2

## Self-Check

- [x] `src/pages/OrderTracking.tsx` — modified, committed c443b98
- [x] `src/components/seller/ReturnManagementSection.tsx` — modified, committed 1e6797f
- [x] `firestore.rules` — modified, committed c443b98
- [x] `tsc --noEmit` clean (exit 0)
- [x] No conflicting duplicate ReturnRequest types (ReturnManagementSection now uses `src/types/returns.ts` exclusively)
- [x] Plan 05 shipping UI preserved (SubOrderReturnSection is additive below existing shipping section)
