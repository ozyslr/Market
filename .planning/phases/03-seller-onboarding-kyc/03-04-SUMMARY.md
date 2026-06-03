---
phase: 03-seller-onboarding-kyc
plan: '04'
subsystem: seller-api-security
tags: [security, api-keys, sha256, rate-limiting, firestore, ux]
dependency_graph:
  requires: [03-01, 03-02, 03-03]
  provides: [hardened-seller-api, server-side-key-creation, firestore-rate-limit]
  affects: [server/routes/sellerApi.ts, src/services/apiKeyService.ts, src/pages/SellerApiKeys.tsx]
tech_stack:
  added: []
  patterns:
    - SHA-256 API key hashing via Node.js crypto.createHash (server-side only)
    - crypto.timingSafeEqual for constant-time key comparison
    - Firestore-backed rate limiting with FieldValue.increment atomic counter
    - Raw key shown once in component state, never persisted
    - AnimatePresence inline revoke confirmation (no modal)
key_files:
  created: []
  modified:
    - server/routes/sellerApi.ts
    - src/services/apiKeyService.ts
    - src/pages/SellerApiKeys.tsx
decisions:
  - 'D-10: SHA-256 replaces djb2 for API key hashing; timingSafeEqual replaces string equality'
  - 'Firestore apiRateLimits collection replaces in-memory Map for persistent rate limiting'
  - 'POST /api/v1/keys endpoint added for server-side key generation (Firebase ID token auth)'
  - 'Old 8-char djb2 hashes rejected with KEY_REHASH_REQUIRED code; sellers must regenerate'
metrics:
  duration: ~30min
  completed_date: '2026-06-03'
  tasks_completed: 2
  files_modified: 3
---

# Phase 03 Plan 04: Seller API Security Hardening Summary

**One-liner:** SHA-256 + timingSafeEqual replaces brute-forceable 32-bit djb2 hash; Firestore-backed rate limiting replaces in-memory Map; raw key shown once in UI, never stored.

## What Was Built

### Task 1 — sellerApi.ts: SHA-256 + timingSafeEqual + Firestore rate limit + UTF-8 fix (commit 5992ef2)

- Removed the broken djb2 `hashApiKey` (32-bit `(h<<5)-h+charCodeAt` — brute-forceable in ~4B guesses)
- Added `hashApiKey` using `createHash('sha256').update(rawKey,'utf8').digest('hex')` → 64-char hex
- Added `verifyApiKey` using `crypto.timingSafeEqual` for constant-time comparison (prevents timing attacks T-03-17)
- Replaced `const apiRateStore = new Map()` with async `checkApiRateLimit` backed by Firestore collection `apiRateLimits`, using `FieldValue.increment(1)` in a transaction — survives server restarts (T-03-19)
- Added `POST /api/v1/keys` endpoint: verifies Firebase ID token via `getAuth().verifyIdToken`, generates `bo_` + `randomBytes(32).toString('hex')`, stores only SHA-256 hash in Firestore, returns `{ rawKey, keyId }` once
- Old 8-char djb2 hashes rejected with `{ code: 'KEY_REHASH_REQUIRED' }` 401 response (T-03-22)
- Migration warning logged at startup
- All mojibake UTF-8 Turkish strings fixed (geçersiz, işlem, aşıldı, sipariş, ürün, etc.)

### Task 2 — apiKeyService.ts + SellerApiKeys.tsx: server-side hash + raw-key-once UX + inline revoke (commit 2c36964)

- Removed client-side `hashKey` djb2 function from `apiKeyService.ts` (Node `crypto` not available in browser)
- `createApiKey` now calls `POST /api/v1/keys` with Firebase ID token; returns `{ rawKey, keyId }` once
- Removed client-side `rateLimitMap` (redundant with server Firestore check)
- `SellerApiKeys.tsx` raw key display: `yellow-50` bg, `amber-300` border, `font-mono text-sm`, AlertCircle warning, Copy button with check feedback
- Warning text: "Bu anahtar bir daha gösterilmeyecek. Şimdi kopyalayın." (T-03-20, T-03-21)
- `newlyCreatedKey` held in component state only — zero `localStorage`/`sessionStorage` writes
- AnimatePresence inline revoke confirmation below each row (no modal): "Bu anahtarı iptal etmek istiyor musunuz? Bu işlem geri alınamaz." + Red "Anahtarı İptal Et" + "Vazgeç" link
- Revoked row fades out via `motion exit={{ opacity:0, height:0 }}` 350ms
- Permission scope pills styled `bg-gray-100 text-gray-700 text-xs rounded px-2 py-0.5`
- Rate limit info row: gray-50 card, Info icon, "API istekleri dakikada 100 istek ile sınırlıdır."

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

No new network endpoints beyond `POST /api/v1/keys` (documented in plan threat model). No new auth paths, file access patterns, or schema changes beyond `apiRateLimits` and `apiKeys.keyHash` field.

## Known Stubs

None. All data flows wired end-to-end: `SellerApiKeys.tsx` → `POST /api/v1/keys` → Firestore `apiKeys` collection.

## Self-Check: PASSED

- `server/routes/sellerApi.ts` — exists, contains `timingSafeEqual`, `apiRateLimits`, `FieldValue.increment`
- `src/services/apiKeyService.ts` — exists, no `hashKey`/`charCodeAt`, calls `POST /api/v1/keys`
- `src/pages/SellerApiKeys.tsx` — exists, contains `newlyCreatedKey`, `AnimatePresence`, inline revoke
- Commit 5992ef2 — Task 1
- Commit 2c36964 — Task 2
- `tsc --noEmit` — zero errors
