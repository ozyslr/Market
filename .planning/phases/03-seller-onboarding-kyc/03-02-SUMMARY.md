---
phase: 03-seller-onboarding-kyc
plan: 02
subsystem: seller-store-and-products
tags: [seller, store, kyc, validation, rtl, firebase-storage]
requires:
  - MOCK_SELLERS / sellers Firestore collection
  - firebase storage + firestore (src/lib/firebase)
  - server/routes/sellerApi.ts (existing)
provides:
  - Public /store/:slug route
  - Store URL copy + owner store management (logo/banner/about)
  - Client + server product validation (min-1-photo, required category) per D-11
affects:
  - src/App.tsx (route table)
  - seller inventory / product-create flow
tech-stack:
  added: []
  patterns:
    - firebase/storage uploadBytes + getDownloadURL to store-assets/{sellerId}
    - field-level client validation with errors record
    - server-side 400 guards before Firestore write
key-files:
  created:
    - .planning/phases/03-seller-onboarding-kyc/03-02-SUMMARY.md
  modified:
    - src/App.tsx
    - src/pages/SellerStore.tsx
    - src/components/seller/ProductForm.tsx
    - src/pages/SellerInventory.tsx
    - server/routes/sellerApi.ts
decisions:
  - D-11 enforced on both client (ProductForm) and server (sellerApi) layers
  - Client product validation placed in ProductForm.tsx (the real form), empty state in SellerInventory.tsx
  - Store management (logo/banner/about) gated to store owner (user.id === sellerData.id)
metrics:
  duration: ~1 session
  completed: 2026-06-03
---

# Phase 3 Plan 02: Seller Store & Product Hardening Summary

Hardened the seller store page (copyable `/store/:slug` URL, owner logo/banner upload to Firebase Storage, 500-char about counter) and added min-1-photo + required-category product validation on both the client form and the `/api/v1/products` server endpoints per D-11.

## What Was Built

### Task 1 — SellerStore.tsx + routing

- Added `/store/:slug` public route in `src/App.tsx` (reuses `SellerStorePage`); component now resolves seller by `slug` OR `id` param.
- Shareable store URL panel with read-only input + `copyToClipboard` (Copy → Check swap, "Store URL copied!" toast); Share button also copies.
- Owner-only store management block:
  - Circular 80px logo upload (image/\*, max 2 MB) → `store-assets/{sellerId}/logo`, updates `sellers/{id}.logoUrl`.
  - Banner upload (16:4, max 5 MB) → `store-assets/{sellerId}/banner`, updates `sellers/{id}.bannerUrl`.
  - About textarea `maxLength={500}` with live color-coded `{N} / 500` counter (gray < 450, amber 450–499, red at 500).
  - "Save Changes" (full-width mobile, right-aligned desktop) with Loader2 + "Changes saved" confirmation.
- RTL-safe: only logical properties (ms-/me-/ps-/pe-/text-start/text-end); zero `ml-/mr-/pl-/pr-` violations.

### Task 2 — Product validation (client + server, D-11)

- `src/components/seller/ProductForm.tsx`: `validateForm()` blocks submit when images < 1 ("At least 1 product photo is required"), no category ("Please select a category"), invalid price ("Enter a valid price"), negative stock ("Stock cannot be negative"). Inline `text-red-600` field errors + red borders; top server-error banner (AlertCircle, border-s-4 red).
- `src/pages/SellerInventory.tsx`: empty state with `Package` icon 48px, "No products yet", "Add your first product to start selling." + "Add Product" CTA.
- `server/routes/sellerApi.ts`: POST `/api/v1/products` returns 400 for missing/empty title, non-positive price, `images.length < 1`, or missing `categoryId`. PUT `/api/v1/products/:id` validates the same fields when present in a partial update. (Per plan scope: broken hash, rate-limit Map, and UTF-8 mojibake left for Plan 04.)

## Deviations from Plan

### Auto-fixed / scope clarifications

1. **[Rule 3 - Blocking] Client validation location.** Plan referenced `SellerInventory.tsx` for client validation, but the actual product form lives in `src/components/seller/ProductForm.tsx` (rendered via `ProductFormModal`). Placed field validation in `ProductForm.tsx` and the empty state in `SellerInventory.tsx`. Both acceptance grep strings ("At least 1 product photo", "Please select a category", "No products yet") are satisfied across these files.
2. **Store management UI** added inline in `SellerStore.tsx`, owner-gated, since no separate store-management page exists. Public view remains unauthenticated.

## Threat Mitigations Applied

- T-03-08 (Tampering — invalid product data): server-side 400 guards before Firestore write. ✅
- T-03-11 (oversized/non-image upload): client type + size checks (2 MB logo / 5 MB banner). ✅

## Known Stubs

- SellerStore product listing and reviews remain mock-data driven (`MOCK_SELLERS`/`MOCK_PRODUCTS`) — pre-existing, out of this plan's scope.
- About save writes `aboutText` to `sellers/{id}`; rendered "Hikayemiz" still reads `sellerData.description` from mock until store data is wired to Firestore (future plan).

## Verification

- `npx tsc --noEmit`: zero errors. ✅
- Acceptance greps satisfied: `copyToClipboard`/`navigator.clipboard`, `maxLength`/`/ 500`, `store-assets`, no logical-property violations, server `images.length`, `categoryId`, empty-state "No products yet".

## Self-Check: PASSED

- src/App.tsx, src/pages/SellerStore.tsx, src/components/seller/ProductForm.tsx, src/pages/SellerInventory.tsx, server/routes/sellerApi.ts — all present and modified.
- Commits 560dbcb (Task 1) and 10e00b8 (Task 2) exist on master.
