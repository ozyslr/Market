---
phase: 03-seller-onboarding-kyc
plan: 01
subsystem: kyc-onboarding
tags: [kyc, stripe-connect, stripe-identity, iyzico, storage-rules, security]
dependency_graph:
  requires: []
  provides:
    - kycService (getKycUploadUrl, getKycSignedUrl, deleteKycDocuments, hasAllRequiredDocs)
    - StripeConnectProvider (provisionAccount)
    - storage.rules (kyc/* deny-all)
    - sellerApplicationService (KycDocument, identityVerificationStatus, hasAllRequiredDocs)
    - POST /api/kyc/upload-url
    - POST /api/kyc/identity-verify
    - GET /api/kyc/signed-url/:encodedPath
    - POST /api/admin/seller/:id/approve-eu
    - POST /api/admin/seller/:id/approve-tr
    - webhook: account.updated, identity.verification_session.verified, identity.verification_session.requires_input
  affects:
    - src/pages/SellerApplication.tsx
    - src/pages/AdminSellerView.tsx
    - src/types.ts (Seller interface extended)
tech_stack:
  added: []
  patterns:
    - v4 signed URL for KYC storage (write 10min, read 5min TTL)
    - Stripe Connect Express hosted onboarding with idempotency guard
    - Stripe Identity verification_session with applicationId metadata
    - Iyzico subMerchantCreate with idempotency guard on iyzicoSubMerchantKey
    - storage.rules deny-all client SDK on kyc/* path
key_files:
  created:
    - server/services/kycService.ts
    - storage.rules
  modified:
    - server/services/paymentProvider.ts
    - server/lib/schemas.ts
    - server/routes/stripe.ts
    - server/routes/iyzico.ts
    - src/services/sellerApplicationService.ts
    - src/pages/SellerApplication.tsx
    - src/pages/AdminSellerView.tsx
    - src/types.ts
decisions:
  - D-04: Private KYC storage — storagePath stored in Firestore, never public URL; signed URLs via Admin SDK only
  - D-05: Stripe Identity session (doc + selfie) created on POST /api/kyc/identity-verify; result via webhook
  - D-06: 3-doc gate — Submit button disabled until identity/tax_certificate/bank_iban all uploaded
  - D-01/D-02: EU sellers → Stripe Connect Express provisioned on admin approval (idempotent)
  - D-03: TR sellers → Iyzico subMerchantCreate on admin approval (idempotent)
metrics:
  duration: '~45 minutes'
  completed_date: '2026-06-03'
  tasks: 3
  files_changed: 8
  files_created: 2
requirements:
  - SEL-01
  - SEL-02
---

# Phase 03 Plan 01: KYC Onboarding Pipeline Summary

**One-liner:** Private KYC document storage via signed URLs, Stripe Identity auto-verification, admin review panel with 5-min signed-URL document viewer, and idempotent Stripe Connect Express / Iyzico sub-merchant provisioning on regional approval.

## Tasks Completed

| Task | Name                                                                                               | Commit  | Key Files                                                                                                 |
| ---- | -------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| 1    | KYC service layer + storage rules + type extension                                                 | 196e3d2 | server/services/kycService.ts, storage.rules, sellerApplicationService.ts, paymentProvider.ts, schemas.ts |
| 2    | KYC API routes — upload-url, identity-verify, signed-url, approve-tr, approve-eu + webhooks        | 951dee3 | server/routes/stripe.ts, server/routes/iyzico.ts                                                          |
| 3    | UI hardening — SellerApplication 3-doc upload + AdminSellerView signed-URL viewer + approve/reject | 3fc1028 | src/pages/SellerApplication.tsx, src/pages/AdminSellerView.tsx, src/types.ts                              |

## What Was Built

### server/services/kycService.ts (new)

- `getKycUploadUrl(sellerId, docType, fileName)` — v4 signed URL, action:write, 10-min TTL; returns `{ uploadUrl, storagePath }`. storagePath is what gets stored in Firestore.
- `getKycSignedUrl(storagePath)` — v4 signed URL, action:read, 5-min TTL for admin document viewing.
- `deleteKycDocuments(sellerId)` — `bucket.deleteFiles({ prefix: 'kyc/{sellerId}/' })` for GDPR/KVKK.
- `hasAllRequiredDocs(kycDocuments)` — Set check for all 3 required docTypes.

### server/services/paymentProvider.ts (extended)

- `StripeConnectProvider` class with `provisionAccount(sellerId, email, country)` — idempotency guard reads `sellers/{sellerId}.stripeAccountId` before creating; creates Express account, persists accountId, creates hosted onboarding link.
- `createPaymentProvider` factory extended with `'stripe-connect'` case (overloaded signatures).

### storage.rules (new)

- `kyc/{sellerId}/{docId}` — `allow read, write: if false` (client SDK blocked; Admin SDK bypasses rules).
- `products/**` — public read, authenticated write.

### server/lib/schemas.ts (extended)

- `kycUploadUrlSchema`, `identityVerifySchema`, `approveSellerSchema` added.

### src/services/sellerApplicationService.ts (extended)

- `KycDocument` interface: `{ docType, storagePath, uploadedAt, fileName }`.
- `SellerApplication.kycDocuments` field changed from `{ name, url }[]` to `KycDocument[]`.
- New fields: `identityVerificationStatus`, `identitySessionId`, `identityVerificationError`.
- `hasAllRequiredDocs(app)` exported for client-side gate.
- `submitApplication` now has slug uniqueness guard (query + timestamp suffix, Pitfall 8).

### server/routes/stripe.ts (extended)

- `POST /api/kyc/upload-url` — verifyFirebaseToken, sellerId===req.uid ownership check (T-03-04).
- `POST /api/kyc/identity-verify` — idempotent (reuses session if verified), idempotency key = applicationId (T-03-06).
- `GET /api/kyc/signed-url/:encodedPath` — verifyAdmin, kyc/ path namespace guard (T-03-01).
- `POST /api/admin/seller/:id/approve-eu` — verifyAdmin, 3-doc gate, StripeConnectProvider idempotent (T-03-03).
- Webhook cases: `account.updated`, `identity.verification_session.verified`, `identity.verification_session.requires_input`.

### server/routes/iyzico.ts (extended)

- `POST /api/admin/seller/:id/approve-tr` — verifyAdmin, 3-doc gate, `iyzicoSubMerchantKey` idempotency guard, subMerchantCreate, sellers doc update (T-03-02, D-03).

### src/pages/SellerApplication.tsx (rewritten)

- `DocUploadSlot` component — 4 states: empty (dashed border, Upload icon), uploading (spinner + progress bar), uploaded (green border, CheckCircle, truncated name, Replace link), error (red border, AlertCircle, Retry).
- Upload flow: POST /api/kyc/upload-url → PUT signed URL binary. 5 MB client-side guard before API call.
- 3-doc gate: `allDocsUploaded` computed from all 3 slot states. Submit button has `disabled` attribute + `opacity-50 cursor-not-allowed` + title tooltip when gate fails (D-06).
- Stripe Identity section: visible once all docs uploaded; `not_started / pending / verified / requires_input` states; on click POST /api/kyc/identity-verify → `window.location.href = verificationUrl`.
- `kycDocuments` array contains `storagePath` (never URLs) passed to `submitApplication`.
- Step indicator: completed=green/checkmark, active=violet/numeral, upcoming=gray.
- Step transitions: `motion.div initial={{ x:20, opacity:0 }} animate={{ x:0, opacity:1 }} duration:200ms`.

### src/pages/AdminSellerView.tsx (hardened)

- `DocViewerCard` component — fetches `GET /api/kyc/signed-url/{encodeURIComponent(storagePath)}` lazily on button click; opens `{ url }` in new tab. Raw `storagePath` is never rendered in DOM (T-03-01). Expired-link amber alert on fetch failure.
- Identity verification status row — verified/requires_input/pending badge with error reason text.
- Payment provisioning status row — TR: Iyzico sub-merchant + active/pending badge; EU: Stripe Connect Express + onboarding/active badge; copyable onboarding URL field with Copy button.
- Approve button — disabled when `!hasAllRequiredDocs(application)` OR `identityVerificationStatus !== 'verified'`; title tooltip explains reason (T-03-07).
- Reject inline form — textarea min 10 chars, field-level error on validation failure, Confirm Rejection + Cancel.
- Approve handler — branches on `application.origin`: TR → `/api/admin/seller/:id/approve-tr`, non-TR → `/api/admin/seller/:id/approve-eu`.
- Slide-in toast notifications (top-right, 4s, motion slide-in) for success and error states.
- Fetches seller application from `sellerApplications` collection via `where('userId', '==', sellerId)`.

### src/types.ts (extended)

- `Seller` interface: `stripeAccountId`, `stripeOnboardingStatus`, `payoutsEnabled`, `iyzicoSubMerchantKey`, `iyzicoOnboardingStatus` added as optional fields.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SellerApplication.tsx type mismatch after KycDocument interface change**

- **Found during:** Task 1 verification (tsc --noEmit)
- **Issue:** Existing `docs` state was typed as `{ name: string; url: string }[]` — incompatible with new `KycDocument[]` type.
- **Fix:** Updated state type, `handleDocUpload`, `removeDoc` and rendered list to use `KycDocument` fields (`storagePath`, `fileName`) — these were pre-Task-3 temporary stubs, fully replaced by Task 3 rewrite.
- **Files modified:** `src/pages/SellerApplication.tsx`
- **Commit:** 196e3d2

**2. [Rule 2 - Missing field] Seller type missing payment provisioning fields**

- **Found during:** Task 3 tsc check
- **Issue:** `Seller` interface in `src/types.ts` lacked `stripeAccountId`, `stripeOnboardingStatus`, `payoutsEnabled`, `iyzicoSubMerchantKey`, `iyzicoOnboardingStatus` fields referenced in `AdminSellerView.tsx`.
- **Fix:** Added all 5 optional fields to `Seller` interface.
- **Files modified:** `src/types.ts`
- **Commit:** 3fc1028 (included in Task 3 commit)

## Security Verification

| Threat ID | Mitigation                                                                                   | Status      |
| --------- | -------------------------------------------------------------------------------------------- | ----------- |
| T-03-01   | storage.rules deny-all on kyc/\*; storagePath never in DOM; signed URL via verifyAdmin route | Implemented |
| T-03-02   | verifyAdmin on /api/admin/seller/:id/approve-tr                                              | Implemented |
| T-03-03   | verifyAdmin on /api/admin/seller/:id/approve-eu; idempotency guard on stripeAccountId        | Implemented |
| T-03-04   | req.uid === sellerId ownership check on /api/kyc/upload-url                                  | Implemented |
| T-03-05   | stripeAccountId / iyzicoSubMerchantKey read before provisioning                              | Implemented |
| T-03-06   | identitySessionId read before creating new session; idempotency key = applicationId          | Implemented |
| T-03-07   | hasAllRequiredDocs() server-side 400 gate + UI disabled state                                | Implemented |

## Known Stubs

None — all KYC upload, identity verification, and approval flows are fully wired. The DocViewerCard receives `adminToken=""` as a prop but fetches the token lazily via `firebaseUser.getIdToken()` inside the handler — the prop is vestigial and safe (not rendered).

## Threat Flags

None — all new network endpoints match the plan's threat model. No unplanned trust boundaries introduced.

## Self-Check: PASSED

- server/services/kycService.ts: EXISTS
- storage.rules: EXISTS
- server/services/paymentProvider.ts contains StripeConnectProvider: VERIFIED (class StripeConnectProvider present)
- src/services/sellerApplicationService.ts exports KycDocument: VERIFIED
- server/lib/schemas.ts exports kycUploadUrlSchema: VERIFIED
- Commits 196e3d2, 951dee3, 3fc1028: VERIFIED (git log)
- tsc --noEmit: PASS (zero errors)
- storagePath not rendered in AdminSellerView DOM: VERIFIED (grep confirms only API call usage)
- dangerouslySetInnerHTML: NOT PRESENT in AdminSellerView
