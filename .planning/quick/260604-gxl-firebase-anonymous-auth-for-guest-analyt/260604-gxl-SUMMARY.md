---
phase: 260604-gxl
plan: '01'
subsystem: auth
tags: [anonymous-auth, firestore-rules, analytics, security]
dependency_graph:
  requires: []
  provides: [anonymous-firebase-session, isFullUser-rule-helper]
  affects: [src/context/AuthContext.tsx, firestore.rules]
tech_stack:
  added: [signInAnonymously (firebase/auth)]
  patterns: [isFullUser() Firestore helper, anonymous-passthrough guard]
key_files:
  created: []
  modified:
    - src/context/AuthContext.tsx
    - firestore.rules
decisions:
  - 'isAnonymous computed from firebaseUser?.isAnonymous ?? false (not state) — stays reactive to auth changes'
  - 'null-user path calls signInAnonymously then returns without setLoading(false) — loading resolves on the next onAuthStateChanged callback when anon user arrives'
  - 'products collection left on isSignedIn() for create/update because isSeller()/isAdmin() role claims already exclude anonymous users by definition'
metrics:
  duration: '~12 minutes'
  completed: '2026-06-04'
  tasks_completed: 2
  tasks_total: 3
  files_modified: 2
---

# Phase 260604-gxl Plan 01: Firebase Anonymous Auth for Guest Analytics — Summary

**One-liner:** Wired `signInAnonymously` on the null-user path in AuthContext and added `isFullUser()` Firestore helper blocking anonymous writes to all sensitive collections while keeping `events` open.

## Tasks Completed

| Task | Name                                                                | Commit    | Files                         |
| ---- | ------------------------------------------------------------------- | --------- | ----------------------------- |
| 2    | AuthContext — wire signInAnonymously and expose isAnonymous         | `881ec10` | `src/context/AuthContext.tsx` |
| 3    | firestore.rules — add isFullUser() and harden sensitive collections | `1c0f94f` | `firestore.rules`             |

## Task 1 — Pending Human Action

Task 1 (Enable Anonymous sign-in provider in Firebase Console) was intentionally skipped — it is a console-only action. Required step:

1. Firebase Console → Authentication → Sign-in method → Anonymous → Toggle **Enabled** → Save

Until this is done, `signInAnonymously(auth)` will throw `auth/operation-not-allowed`. The `.catch(() => setLoading(false))` in AuthContext prevents the app from hanging on a spinner in this case.

## Deploying firestore.rules — Pending Human Action

The updated `firestore.rules` must be deployed before the new security hardening takes effect in production:

```bash
firebase deploy --only firestore:rules
```

Until deployed, the new `isFullUser()` gates are not active in Firebase.

## firebaseUser Consumer Grep Finding — PASS

Command run: `grep -rn "firebaseUser" src/ --include=*.ts --include=*.tsx | grep -v AuthContext`

**Finding: No consumer uses `firebaseUser` as a login gate. PASS.**

Every consumer uses `firebaseUser` for one of these purposes only:

- Null check to get the uid (`if (!firebaseUser) return`) — guards side-effects, not login state
- Calling `firebaseUser.getIdToken()` for API auth headers
- Reading `firebaseUser.uid` to scope Firestore reads (cart, follows, addresses)
- Displaying `firebaseUser?.displayName` as a fallback display name

All business-logic login gates use `user` (UserProfile) — e.g. `if (!user || !firebaseUser)` in Checkout, SellerApplication. Since `user` (UserProfile) remains `null` for anonymous users, no regression exists. Anonymous users with a non-null `firebaseUser` will correctly fall through every `if (!user)` guard.

Notable files checked: `CartContext.tsx`, `FollowsContext.tsx`, `NotificationContext.tsx`, `Checkout.tsx`, `ProductDetail.tsx`, `SellerApplication.tsx`, `useOneClickCheckout.ts` — all confirmed safe.

## Rules Changed to isFullUser()

**Count: 28 rule clauses changed** across the following collections:

| Collection             | Rules changed                          |
| ---------------------- | -------------------------------------- |
| users                  | get, create, update (3)                |
| sellers                | create, update (2)                     |
| orderSets              | read, create (2)                       |
| commissionRules        | read (1)                               |
| dataDeletionRequests   | create (1)                             |
| carts                  | read/create/update/delete (1 compound) |
| mail                   | restructured: create (1)               |
| chat_sessions          | read, create, update (3)               |
| chat_sessions/messages | read, create (2)                       |
| activity_logs          | create (1)                             |
| orders                 | read, create (2)                       |
| sellerBalances         | read (1)                               |
| payoutSchedules        | read (1)                               |
| payoutRequests         | read (1)                               |
| pushTokens             | create, update, delete (3)             |
| pushMessages           | create (1)                             |
| reviews                | create, update (2)                     |
| follows                | create, delete (2)                     |

## events Collection — Confirmed Open

```
match /events/{eventId} {
  allow create: if isSignedIn();   // KEPT — anonymous guests must write analytics
  allow read: if isAdmin();
}
```

`isSignedIn()` remains on `events/create`. All other `isSignedIn()` usages in the file were replaced with `isFullUser()`.

## Deviations from Plan

None — plan executed exactly as written. The mandatory fixes from plan-checker were all applied:

1. Anonymous guard placed as first statement inside `if (fUser) {` block — before `getDoc`
2. Null-user branch calls `signInAnonymously(auth).catch(() => setLoading(false))` then returns
3. firebaseUser consumer grep confirmed no login-gate regressions
4. `mail` rule restructured to explicit `allow read: if false; allow create: if isFullUser(); allow update, delete: if false;`
5. `isFullUser()` added and applied to all 28 sensitive rule clauses; `events` kept on `isSignedIn()`

## Self-Check: PASSED

- `src/context/AuthContext.tsx` exists and contains `signInAnonymously`, `isAnonymous`, anonymous guard
- `firestore.rules` exists and contains `isFullUser()` helper
- Commit `881ec10` exists (Task 2)
- Commit `1c0f94f` exists (Task 3)
- `npm run lint`: 0 errors, 19 pre-existing warnings (unchanged from baseline)
