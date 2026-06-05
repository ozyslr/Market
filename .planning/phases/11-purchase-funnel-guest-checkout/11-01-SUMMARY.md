---
phase: 11-purchase-funnel-guest-checkout
plan: 01
subsystem: purchase-funnel
tags: [guest-checkout, cart-persistence, localStorage, account-upgrade, anonymous-auth]
requires: []
provides: [BUY-01]
affects: [CartContext, Checkout, AuthContext]
tech-stack:
  added: []
  patterns: [localStorage persistence, cart merge on auth transition, Firebase linkWithCredential]
key-files:
  created: []
  modified:
    - src/context/CartContext.tsx
    - src/pages/Checkout.tsx
    - src/context/AuthContext.tsx
decisions:
  - D-BUY-01: Anonymous users complete orders via Stripe Elements; guest email collected inline; post-purchase account upgrade via linkWithCredential
  - D-BUY-02: localStorage cart persistence for guests (300ms debounce); merge on sign-in with Firestore priority
metrics:
  duration: '~5min'
  completed: 2026-06-05
---

# Phase 11 Plan 01: Guest Checkout E2E Summary

Guest checkout infrastructure: localStorage cart persistence for anonymous users, cart merge on sign-in, guest email collection, and post-purchase account creation prompt.

## One-Liner

Enabled anonymous users to add-to-cart (persistent across refresh), complete checkout with email, and optionally create a permanent account after purchase -- all preserving cart data and UID via Firebase linkWithCredential.

## Tasks Completed

| Task | Name                                      | Commit  | Files Modified  |
| ---- | ----------------------------------------- | ------- | --------------- |
| 1    | localStorage cart persistence + merge     | 0ee5fc5 | CartContext.tsx |
| 2    | Guest email field + Create Account prompt | 83b299b | Checkout.tsx    |
| 3    | Anonymous-to-email account upgrade        | 3707b73 | AuthContext.tsx |

## What Changed

### Task 1: Cart Persistence + Merge (CartContext.tsx)

- Added `LOCAL_CART_KEY` constant and `LocalCartData` interface for type-safe serialization
- Added `mergeCarts(guestItems, firestoreItems)` utility: deduplicates by productId+variantId, sums quantities, Firestore items take priority
- Anonymous users: cart persists to localStorage (300ms debounce); restored on mount with clear-after-read to prevent stale restores
- Anonymous-to-authenticated transition detected via `prevIsAnonymous` ref: merges guest cart with Firestore, writes merged result, clears localStorage
- `hasMerged` ref prevents duplicate merges on re-renders
- Firestore debounce kept at 500ms for authenticated users (unchanged)
- `clearCart()` now also clears localStorage key

### Task 2: Guest Email + Create Account (Checkout.tsx)

- Added `guestEmail`, `accountPassword`, `creatingAccount`, `accountCreated`, `accountError` state variables
- Delivery step (step 1): when `isAnonymous`, renders required email input with format validation before step advance
- `processOrder()`: uses `firebaseUser.email || guestEmail || ''` so guest email flows through to order
- Confirmation step (step 3): when `isAnonymous && !accountCreated`, renders "Hesap Oluştur" card with password input and submit button
- Calls `upgradeAnonymousAccount(guestEmail, password)` from AuthContext on submit
- On success: shows green success banner with "Siparişlerimi Gör" button linking to `/profile`
- "Şimdi değil" skip link navigates to `/`
- Email display in confirmation fixed to fall back to `guestEmail` when `user` is null

### Task 3: Account Upgrade (AuthContext.tsx)

- Added `linkWithCredential` and `EmailAuthProvider` imports from `firebase/auth`
- `upgradeAnonymousAccount(email, password)` added to AuthContextType interface and useAuth() return
- Uses Firebase `linkWithCredential` to convert anonymous account to permanent, preserving UID and all Firestore data
- Updates Firestore profile email after successful link (best-effort)
- Comprehensive error handling with Turkish messages: `auth/email-already-in-use`, `auth/credential-already-in-use`, `auth/weak-password`, `auth/invalid-email`
- Fallback: if anonymous account deleted (rare race), creates new account via `createUserWithEmailAndPassword`
- All thrown errors include `{ cause: err }` for ESLint `preserve-caught-error` compliance

## Deviations from Plan

None -- plan executed exactly as written. Task order adjusted (Task 3 before Task 2) because Checkout.tsx depends on `upgradeAnonymousAccount` from AuthContext.

## Key Decisions Applied

- **D-BUY-01**: Anonymous users complete orders via Stripe Elements (no auth middleware on `/api/create-payment-intent`). Guest email collected inline. Post-purchase account creation prompt with `linkWithCredential` preserves UID.
- **D-BUY-02**: localStorage cart for guests with 300ms debounce. Merge on sign-in: Firestore items take priority on duplicates, quantities summed.

## Known Stubs

None.

## Self-Check

All files verified to exist and all commits confirmed in git history.
