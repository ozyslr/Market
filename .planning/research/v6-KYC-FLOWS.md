# v6.0 KYC Flows — Admin Seller Control Center Research

**Date:** 2026-06-08
**Scope:** KYC lifecycle, provisioning, audit, suspension, and recommended control-center actions

---

## 1. Existing KYC Lifecycle

### 1.1 Data split: two collections, two status fields

The application and the live seller record are separate Firestore documents:

| Collection           | Document ID             | Status field                                       | Source of truth for                         |
| -------------------- | ----------------------- | -------------------------------------------------- | ------------------------------------------- |
| `sellerApplications` | `{sellerId}` (= userId) | `status: 'pending' \| 'approved' \| 'rejected'`    | KYC review decision                         |
| `sellers`            | `{sellerId}`            | `kycStatus: 'pending' \| 'verified' \| 'rejected'` | Seller panel display, product creation gate |

`sellers.kycStatus` is set independently (via `AdminSellers.setKyc`, `src/pages/AdminSellers.tsx:228`) and is NOT automatically derived from `sellerApplications.status`. The two must be kept in sync manually — this is a current gap.

### 1.2 Application state machine

```
[Seller submits on /sell]
        │
        ▼
sellerApplications.status = 'pending'
sellers.kycStatus          = 'pending'         (set during store creation, SellOnBenimOlan.tsx:76)
        │
        │  Stripe Identity webhook fires (server/routes/stripe.ts:139-176)
        ▼
identityVerificationStatus = 'verified' | 'requires_input'
        │
        │  Admin opens /admin/seller/:id (AdminSellerView.tsx)
        │  canApprove = all3Docs + identityVerified + status==='pending'  (line 283-287)
        │
   ┌────┴────────────────────────┐
   │ Approve                     │ Reject
   ▼                             ▼
POST /api/admin/seller/:id/    reviewApplication(id,'rejected',reason,adminBy)
  approve-eu  OR  approve-tr     → sellerApplications.status = 'rejected'
  (see §2)                       → sellers.kycStatus NOT auto-updated
        │
        ▼
sellerApplications.status   = 'approved'
sellerApplications.reviewedAt = <ISO>
sellerApplications.adminNote  = adminNote
[+] sellers.iyzicoSubMerchantKey or sellers.stripeAccountId provisioned
[+] sellerOnboardingService.recordEvent(sellerId,'kyc_approved')   (line 144-146)
        │
        │  Stripe Connect: account.updated webhook (stripe.ts:116-135)
        ▼
sellers.stripeOnboardingStatus = 'complete'
sellers.payoutsEnabled         = true
```

### 1.3 Key gates before approval

Gate enforced **both** client-side (`AdminSellerView.tsx:283-287`) and server-side (`kycService.hasAllRequiredDocs`, `stripe.ts:859`, `iyzico.ts:556`):

1. All 3 KYC document types uploaded: `identity`, `tax_certificate`, `bank_iban`
2. `identityVerificationStatus === 'verified'` (Stripe Identity webhook must have fired)
3. Application `status === 'pending'`

### 1.4 Document visibility

- **Storage path:** `kyc/{sellerId}/{docType}-{timestamp}` (set in `kycService.ts:29`)
- **Storage paths never exposed in DOM** (comment at `AdminSellerView.tsx:94`)
- **Admin reads** via `GET /api/kyc/signed-url/:encodedPath` (5-minute TTL v4 signed URL, `kycService.ts:55-75`)
- **Client uploads** via `POST /api/kyc/upload-url` → PUT to signed URL (10-minute TTL, `kycService.ts:22-49`)
- No public URL is ever written to Firestore

---

## 2. Provisioning on Approval

### 2.1 TR sellers — Iyzico sub-merchant

**Endpoint:** `POST /api/admin/seller/:id/approve-tr` (`server/routes/iyzico.ts:538`)

**Flow:**

1. Fetch `sellerApplications/{sellerId}` — verify 3-doc gate
2. **Idempotency check** (`iyzico.ts:564-570`): if `sellers/{sellerId}.iyzicoSubMerchantKey` already set → return `{ alreadyProvisioned: true, subMerchantKey }` without re-calling Iyzico
3. Call `iyzico.subMerchantCreate(...)` with `subMerchantExternalId = sellerId`
4. On success: write `sellers/{sellerId}.iyzicoSubMerchantKey` + `iyzicoOnboardingStatus: 'complete'`
5. Update `sellerApplications/{sellerId}.status = 'approved'`

**Sub-merchant fields used:** `address`, `taxId`, `storeName`, `userEmail`, `phone`, `bankIban`

### 2.2 EU sellers — Stripe Connect Express

**Endpoint:** `POST /api/admin/seller/:id/approve-eu` (`server/routes/stripe.ts:842`)

**Flow:**

1. Fetch `sellerApplications/{sellerId}` — verify 3-doc gate
2. Call `StripeConnectProvider.provisionAccount(sellerId, email, country)` (`server/services/paymentProvider.ts`)
3. Provider is idempotent (checks `sellers.stripeAccountId` before calling `stripe.accounts.create`)
4. Update `sellerApplications/{sellerId}.status = 'approved'`
5. Return `{ onboardingUrl, accountId }` — admin copies onboarding link to seller
6. Seller completes Stripe Connect onboarding; `account.updated` webhook sets `stripeOnboardingStatus: 'complete'`, `payoutsEnabled: true`

### 2.3 Idempotency summary

Both endpoints guard against double-provisioning:

- TR: `iyzicoSubMerchantKey` presence check
- EU: `stripeAccountId` presence check in `StripeConnectProvider.provisionAccount`

Neither endpoint rolls back the `sellerApplications.status` update if provisioning fails — this is a gap.

---

## 3. Audit Log

### 3.1 Shape (`src/services/auditLogService.ts:67-87`)

```typescript
interface AuditLogEntry {
  actorId: string; // Firebase UID of admin
  actorEmail: string;
  actorRole: string;
  action: AuditAction; // see §3.2
  entityType: string; // 'seller', 'product', 'order', etc.
  entityId: string;
  entityLabel?: string; // human-readable name
  details?: string;
  before?: Record<string, any>; // snapshot before change
  after?: Record<string, any>; // snapshot after change
  metadata?: { ip?: string; userAgent?: string };
  createdAt: string; // ISO timestamp
}
```

Stored in `auditLogs` collection. Client SDK writes (no server middleware). **No TTL or deletion policy is currently defined.**

### 3.2 Seller-related AuditActions that exist

Defined in both `src/services/auditLogService.ts:24-65` and `server/lib/auditLog.ts:18-23`:

| AuditAction       | Where called                                        |
| ----------------- | --------------------------------------------------- |
| `seller.approve`  | `AdminSellers.setKyc` (AdminSellers.tsx:233)        |
| `seller.reject`   | `AdminSellers.setKyc` (AdminSellers.tsx:233)        |
| `seller.suspend`  | `AdminSellers.toggleSuspend` (AdminSellers.tsx:171) |
| `seller.activate` | `AdminSellers.toggleSuspend` (AdminSellers.tsx:171) |
| `seller.ban`      | Defined in type but **NOT called anywhere**         |

### 3.3 Gaps in current audit coverage

| Gap                                                                                                              | Risk                                                 |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `reviewApplication()` approval/rejection in `AdminSellerView.handleApprove/handleReject` does NOT call `audit()` | Approval via the detailed view leaves no audit trail |
| `seller.ban` action type exists but no code invokes it                                                           | Ban cannot be proven in audit log                    |
| No `kyc.doc_viewed` event                                                                                        | No record of which admin viewed KYC documents        |
| No `kyc.request_changes` action type                                                                             | "Request changes" flow is entirely absent            |
| No `before`/`after` snapshots captured in `toggleSuspend` or `setKyc`                                            | Auditors cannot see what changed                     |
| `AdminSellerView` approve/reject path does NOT write audit at all                                                | Double approval path with no paper trail             |

---

## 4. Seller Active/Suspended State

### 4.1 Where it is stored

Two documents carry independent active/suspended signals:

**`sellers/{sellerId}`** (`src/types.ts:91`):

```typescript
status?: 'active' | 'suspended' | 'banned';
suspendedUntil?: string;   // ISO date — timed suspension
adminNote?: string;
```

**`users/{userId}`** (`src/types.ts:50-53`):

```typescript
status?: 'active' | 'suspended' | 'banned';
suspendedUntil?: string;
adminNote?: string;
```

The functions `suspendUser`, `banUser`, `unrestrictUser` in `src/services/userService.ts:181-202` operate on the `users` collection only — they do NOT touch the `sellers` collection.

The function `toggleSuspend` in `AdminSellers.tsx:164-175` operates on the `sellers` collection only via `updateSeller` — it does NOT touch the `users` collection.

**These two suspension mechanisms are not linked.**

### 4.2 How enforcement works (and where it doesn't)

| Enforcement point                         | What it checks                                                                 | Status                             |
| ----------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------- |
| `SellerLayout.tsx:54-56`                  | `sellers.kycStatus` (not `sellers.status`) for dashboard access                | Only KYC gate, no suspension check |
| `firestore.rules` — `/sellers/{sellerId}` | No `status` check — suspended seller can still read/write their own seller doc | NOT enforced at rules level        |
| `firestore.rules` — `/products/{pid}`     | Only checks `isSeller()` role claim, not `sellers.status`                      | NOT enforced                       |
| Product listing on storefront             | Reads from `products` collection — no seller status check                      | NOT enforced                       |
| Checkout/payment                          | No seller status check at payment init                                         | NOT enforced                       |

**Critical gap:** A "suspended" seller (`sellers.status = 'suspended'`) can still:

- Log into the seller panel
- Create and publish products
- Receive payments (if Iyzico/Stripe accounts still active)

Suspension is a UI label only — it has no enforcement backing.

### 4.3 `kycStatus` vs `status`

These are separate fields on the `Seller` type:

- `kycStatus: 'pending' | 'verified' | 'rejected'` — tracks KYC verification state
- `status?: 'active' | 'suspended' | 'banned'` — tracks operational state

A seller can have `kycStatus: 'verified'` and `status: 'suspended'` simultaneously with no enforcement conflict in the current code.

---

## 5. Recommended Intervention Action Set

### 5.1 Actions table

| Action                          | Precondition                                    | Server endpoint needed?                                                                                         | Reason capture                                                 | Audit entry                                                               | Risk level                                                               |
| ------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Approve (KYC)**               | `status=pending` + 3 docs + identity verified   | Uses existing `/api/admin/seller/:id/approve-eu` or `approve-tr`                                                | Optional admin note                                            | `seller.approve` — currently missing in `AdminSellerView` path, must add  | LOW — already idempotent                                                 |
| **Reject (KYC)**                | `status=pending`                                | No new endpoint needed — uses `reviewApplication()`                                                             | Required (min 10 chars) — already enforced                     | `seller.reject` — currently missing in `AdminSellerView` path, must add   | LOW                                                                      |
| **Request Changes**             | `status=pending`                                | New endpoint `PATCH /api/admin/seller/:id/request-changes` or client call                                       | Required (which docs / what to fix)                            | New action type `seller.kyc_changes_requested`                            | LOW — sets new `status: 'changes_requested'` on application              |
| **Suspend**                     | `status=active`, `kycStatus=verified`           | New endpoint `POST /api/admin/seller/:id/suspend` (server must disable Stripe/Iyzico payouts + mark Firestore)  | Required — reason + optional duration                          | `seller.suspend` — must include `before`/`after` snapshot                 | HIGH — affects live payouts; must pause Stripe Connect payouts or Iyzico |
| **Reactivate**                  | `status=suspended`                              | New endpoint `POST /api/admin/seller/:id/reactivate`                                                            | Optional lift-note                                             | `seller.activate` — with before/after                                     | HIGH — re-enables payouts                                                |
| **Ban (permanent)**             | Any status                                      | New endpoint `POST /api/admin/seller/:id/ban` (must delete/deactivate payment accounts, freeze pending payouts) | Required — must select reason from predefined list + free text | `seller.ban` — with full snapshot                                         | CRITICAL — requires two-step confirmation modal                          |
| **Add Admin Note**              | Any state                                       | Client-only: `updateDoc(sellers/{id}, {adminNote})`                                                             | The note IS the reason                                         | New action type `seller.note_added`                                       | LOW                                                                      |
| **View KYC Document**           | Admin authenticated                             | Uses existing `GET /api/kyc/signed-url/:path`                                                                   | N/A                                                            | New action type `kyc.doc_viewed` (log storagePath + docType, not the URL) | LOW — compliance/GDPR audit requirement                                  |
| **Reset Identity Verification** | `identityVerificationStatus = 'requires_input'` | New endpoint `POST /api/admin/seller/:id/reset-identity-check` (creates new Stripe Identity session)            | Optional note                                                  | New action type `kyc.identity_reset`                                      | MEDIUM                                                                   |
| **Change Commission Rate**      | Seller exists                                   | Client-only `updateSeller` or new endpoint                                                                      | Required — reason                                              | `tier.update` (existing action type) with before/after rates              | MEDIUM — affects seller earnings                                         |

### 5.2 Guardrail recommendations per risk level

**HIGH / CRITICAL actions (Suspend, Ban):**

- Two-step confirmation modal: "Type the seller name to confirm"
- Predefined reason dropdown (`ToS violation`, `Fraudulent listing`, `Disputed payout`, `Compliance failure`, `Manual review`) + optional free text
- Before-state snapshot captured into `audit.before`
- Server endpoint MUST be used (not client-side Firestore write) so enforcement (Stripe payout pause, Firestore `sellers.status`) is atomic
- Ban must trigger `stripe.accounts.reject()` or `stripe.accounts.delete()` for EU sellers, and Iyzico sub-merchant deactivation for TR sellers — **this does not exist yet**

**MEDIUM actions (Reactivate, Reset Identity, Commission Change):**

- Single confirmation dialog with reason required
- Audit entry with before/after
- For Reactivate: must check that original suspension reason is resolved

**LOW actions (Approve, Reject, Add Note, View Doc):**

- Existing approve/reject confirmation flow is sufficient
- Must add missing `audit()` calls to `AdminSellerView.handleApprove` and `handleReject`

### 5.3 Missing `status` on `sellerApplications`

The application status enum (`pending | approved | rejected`) needs a 4th state:

```typescript
status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
```

This lets the seller know they must re-upload or fix something, and lets the admin see at-a-glance that the ball is in the seller's court.

### 5.4 Recommended new server endpoints

| Endpoint                                     | Method | Auth          | Body                                     |
| -------------------------------------------- | ------ | ------------- | ---------------------------------------- |
| `/api/admin/seller/:id/suspend`              | POST   | `verifyAdmin` | `{ reason: string, until?: string }`     |
| `/api/admin/seller/:id/reactivate`           | POST   | `verifyAdmin` | `{ note?: string }`                      |
| `/api/admin/seller/:id/ban`                  | POST   | `verifyAdmin` | `{ reason: string, reasonCode: string }` |
| `/api/admin/seller/:id/request-changes`      | PATCH  | `verifyAdmin` | `{ changes: string }`                    |
| `/api/admin/seller/:id/reset-identity-check` | POST   | `verifyAdmin` | `{ note?: string }`                      |

All must:

1. Use Firebase Admin SDK (not client SDK) to write — bypasses security rule gaps
2. Write an audit entry via `server/lib/auditLog.ts` with `before`/`after` snapshots
3. Return 409 if precondition fails (e.g., suspend on already-suspended seller)
4. Be idempotent (safe to retry)

---

## Summary of Gaps to Address in v6.0

| Gap                                                                                 | Priority | Location                                                                   |
| ----------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| `AdminSellerView` approve/reject does not call `audit()`                            | High     | `src/pages/AdminSellerView.tsx:182-238`                                    |
| `sellers.status` suspension has no enforcement (rules, panel, products, checkout)   | High     | `firestore.rules`, `SellerLayout.tsx`                                      |
| `seller.ban` action type exists but no ban endpoint/call                            | High     | `server/routes/` (missing)                                                 |
| Suspension does NOT pause Stripe Connect payouts or Iyzico sub-merchant             | High     | `server/routes/stripe.ts` (missing)                                        |
| `sellerApplications.status` missing `changes_requested` state                       | Medium   | `src/services/sellerApplicationService.ts:52`                              |
| No `kyc.doc_viewed` audit event                                                     | Medium   | `AdminSellerView.tsx:65-84`                                                |
| KYC approval failure does not roll back `sellerApplications.status`                 | Medium   | `server/routes/stripe.ts:874-882`, `iyzico.ts:621-632`                     |
| `sellers.kycStatus` and `sellerApplications.status` not kept in sync                | Medium   | `AdminSellerView.handleApprove` + `AdminSellers.setKyc` are separate paths |
| `seller.ban` + `admin.role_change` not assigned `before`/`after` snapshots anywhere | Low      | `src/services/auditLogService.ts` callers                                  |
