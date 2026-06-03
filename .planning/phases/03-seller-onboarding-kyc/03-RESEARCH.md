# Phase 3: Seller Onboarding & KYC - Research

**Researched:** 2026-06-03
**Domain:** Seller onboarding, KYC verification, payment account provisioning, document security, CSV import, REST API hardening
**Confidence:** HIGH (all critical paths verified via official Stripe/Iyzico docs + codebase inspection)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Region-based provisioning on approval — TR → Iyzico sub-merchant; EU → Stripe Connect. Behind Phase 2 `IPaymentProvider` interface.
- **D-02:** EU → Stripe Connect **Express** account + Stripe-hosted onboarding; track via `account.updated` webhook (`payouts_enabled`).
- **D-03:** TR → Iyzico sub-merchant created on admin approval (manual KYC review is the gate). `iyzico.createSubMerchant()` called only after admin "approve" click.
- **D-04:** KYC docs in PRIVATE Firebase Storage bucket (`kyc/{sellerId}/{docId}`), admin-only read via short-lived (~5 min) signed URLs, GDPR/KVKK-deletable.
- **D-05:** Automated ID verification via **Stripe Identity** (all sellers incl. TR) — `verification_session`, doc+selfie, webhook result, then admin confirms.
- **D-06:** Required docs: ID + tax certificate + bank/IBAN; approve button disabled until all 3 present.
- **D-07:** CSV partial import + downloadable error report (row#, field, reason); skip bad rows.
- **D-08:** CSV images via `image_url` column (pipe-separated, fetch→Storage); min 1 photo enforced.
- **D-09:** CSV category validated against existing platform taxonomy; unknown category fails the row.
- **D-10:** Harden seller REST API — replace weak hash with SHA-256/HMAC + constant-time compare; keep `bo_` prefix; replace in-memory Map rate limiting with persistent store; fix UTF-8 mojibake.
- **D-11:** Harden store page (SellerStore.tsx) + product management (SellerInventory.tsx); enforce min 1 photo + required category on BOTH client and server.

### Claude's Discretion

- Stripe Identity verification_session UX details and webhook event handling
- API key hash algorithm detail (SHA-256 vs HMAC) and persistent rate-limit store selection
- CSV error report format details, file size limit, export column set
- Signed URL TTL duration (~5 min suggested)
- Closest-category suggestion (optional enhancement)
- Store shareable URL slug structure (custom domain deferred)

### Deferred Ideas (OUT OF SCOPE)

- SKU↔image ZIP bulk upload
- Closest-category suggestion engine
- TR-local KYC/MASAK vendor comparison
- Stripe Custom Connect account (white-label)
- Custom domain store URLs
- Deep product variant support
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID     | Description                                                         | Research Support                                                                                           |
| ------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| SEL-01 | Seller KYC onboarding — identity, tax certificate, bank info upload | D-04 (private Storage), D-05 (Stripe Identity), D-06 (3-doc gate); `sellerApplicationService.ts` extension |
| SEL-02 | Admin KYC review and approve/reject panel                           | D-03 (Iyzico trigger), D-02 (Stripe Connect trigger); `AdminSellerView.tsx` hardening                      |
| SEL-03 | Seller store page — logo, banner, about, products                   | D-11; `SellerStore.tsx` hardening + slug routing                                                           |
| SEL-04 | Seller product management (add, edit, stock, price)                 | D-11; `SellerInventory.tsx` + server-side validation                                                       |
| SEL-05 | Seller CSV bulk import/export                                       | D-07, D-08, D-09; papaparse + Zod row validation                                                           |
| SEL-06 | Seller REST API — improved endpoints                                | D-10; `sellerApi.ts` security hardening                                                                    |

</phase_requirements>

---

## Summary

Phase 3 is a **hardening and completion phase**, not greenfield. The UI scaffolding (`SellerApplication.tsx`, `AdminSellers.tsx`, `AdminSellerView.tsx`, `SellerStore.tsx`, `SellerInventory.tsx`, `SellerImportCenter.tsx`, `SellerApiKeys.tsx`) and server structure (`sellerApi.ts`, `iyzico.cjs`) already exist. The critical work is: (1) wiring the KYC approval to payment account provisioning via two new vendor integrations — Stripe Connect Express and Iyzico sub-merchant; (2) adding Stripe Identity automated ID check; (3) migrating KYC doc storage to a private Firebase Storage path with admin-only signed URLs; (4) completing CSV partial import with image fetch and category validation; and (5) hardening the seller REST API crypto and rate limiting.

The most technically novel parts are Stripe Connect Express (new to this codebase) and Stripe Identity (no prior integration). Both integrate into the existing `server/routes/stripe.ts` webhook handler and the `IPaymentProvider` factory. The Iyzico sub-merchant integration is the lowest risk: the `subMerchantCreate` function already exists in `server/iyzico.cjs` and only needs a new Express route + approval trigger.

**Primary recommendation:** Build in this vertical order — (1) private KYC Storage + signed URL endpoint (unblocks admin review); (2) 3-doc gate + Stripe Identity session on upload; (3) Iyzico sub-merchant on TR approval; (4) Stripe Connect Express on EU approval; (5) CSV import hardening; (6) REST API hardening. Each slice is independently shippable.

---

## Architectural Responsibility Map

| Capability                                                  | Primary Tier                                          | Secondary Tier                         | Rationale                                                              |
| ----------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| KYC doc upload                                              | Frontend (client Firebase Storage SDK)                | API/Backend (signs URL for admin read) | Upload goes direct to Storage; admin read uses Admin SDK signed URL    |
| Stripe Identity session creation                            | API/Backend                                           | —                                      | Server creates session to prevent cost manipulation                    |
| Payment account provisioning (Stripe/Iyzico)                | API/Backend                                           | —                                      | PII and secrets must stay server-side                                  |
| Admin KYC review panel                                      | Frontend                                              | —                                      | Reads from Firestore (admin-only rules) + fetches signed URL via API   |
| KYC approval webhook (Stripe Connect `account.updated`)     | API/Backend (webhook)                                 | —                                      | Must live in `server/routes/stripe.ts` alongside existing webhooks     |
| Stripe Identity webhook (`identity.verification_session.*`) | API/Backend (webhook)                                 | —                                      | Same webhook handler, new event cases                                  |
| Seller store page / slug routing                            | Frontend (React Router) + Backend (Express catch-all) | —                                      | Slug resolved in React Router; Express already has catch-all SPA route |
| Product validation (min 1 photo + category)                 | Both tiers                                            | —                                      | Client-side for UX; server-side for enforcement                        |
| CSV import + image fetch                                    | API/Backend                                           | —                                      | Image fetch from external URL must be server-side (SSRF control)       |
| API key hashing + rate limiting                             | API/Backend                                           | —                                      | Never expose hash logic to client                                      |

---

## Standard Stack

### Core (all already installed — NO new packages required)

| Library              | Version (installed) | Purpose                                            | Status                                     |
| -------------------- | ------------------- | -------------------------------------------------- | ------------------------------------------ |
| `stripe`             | ^22.1.1             | Stripe Connect Express + Stripe Identity           | Already installed [VERIFIED: package.json] |
| `firebase-admin`     | ^13.10.0            | Admin SDK — `getSignedUrl`, Firestore transactions | Already installed [VERIFIED: package.json] |
| `firebase`           | ^12.13.0            | Client Storage upload for KYC docs                 | Already installed [VERIFIED: package.json] |
| `papaparse`          | ^5.5.3              | CSV parse (streaming, per-row)                     | Already installed [VERIFIED: package.json] |
| `zod`                | ^4.4.3              | Row-level CSV validation schema                    | Already installed [VERIFIED: package.json] |
| `express-rate-limit` | ^8.5.2              | Rate limiting middleware (already in server)       | Already installed [VERIFIED: package.json] |
| Node.js `crypto`     | built-in            | SHA-256 hashing + `timingSafeEqual`                | Built-in, no install                       |

### No New npm Packages Required

All capabilities needed for this phase are covered by already-installed dependencies. The crypto hardening uses Node.js built-in `crypto` module. Rate limiting uses the already-installed `express-rate-limit`. Image fetch uses native `fetch` (Node 22+).

**Installation:** None required.

---

## Package Legitimacy Audit

No new external packages are introduced in this phase. All dependencies used are already installed and verified in `package.json`.

| Package                     | Registry | Status                            | Disposition |
| --------------------------- | -------- | --------------------------------- | ----------- |
| `stripe` ^22.1.1            | npm      | Pre-existing, official Stripe SDK | Approved    |
| `firebase-admin` ^13.10.0   | npm      | Pre-existing, official Google SDK | Approved    |
| `papaparse` ^5.5.3          | npm      | Pre-existing                      | Approved    |
| `zod` ^4.4.3                | npm      | Pre-existing                      | Approved    |
| `express-rate-limit` ^8.5.2 | npm      | Pre-existing                      | Approved    |

**Packages removed due to slopcheck verdict:** none
**Packages flagged as suspicious:** none

---

## Architecture Patterns

### System Architecture Diagram

```
[Seller Browser]
     │
     ├─► POST /api/kyc/upload-url → [Express API] → firebase-admin.getSignedUrl(write) → Storage kyc/{id}/{doc}
     ├─► POST /api/kyc/identity-verify → [Express API] → stripe.identity.verificationSessions.create()
     │                                                         └─► returns { client_secret, url }
     ├─► (redirect) Stripe hosted verification flow
     │
[Stripe webhooks]
     ├─► identity.verification_session.verified → update sellerApplications/{id}.identityVerified = true
     ├─► identity.verification_session.requires_input → update .identityVerificationError
     ├─► account.updated (payouts_enabled) → update sellers/{id}.stripeAccountId, payoutsEnabled
     │
[Admin Browser]
     ├─► GET /api/kyc/signed-url/:docId → [Express API (admin-auth)] → firebase-admin.getSignedUrl(read, 5min)
     ├─► POST /api/admin/seller/:id/approve
     │       ├─► if origin=TR → iyzico.subMerchantCreate() → store subMerchantKey in sellers/{id}
     │       └─► if origin=EU → stripe.accounts.create({type:'express'}) → stripe.accountLinks.create()
     │                        → return onboarding URL to admin UI → seller redirected
     │
[CSV Import]
     [Seller Browser] → POST /api/products/csv-import (multipart)
     → [Express API] → papaparse.parse(stream) → per-row Zod validation
     → image_url fetch (server-side, SSRF-protected) → Storage upload
     → Firestore batch write (valid rows) + errors.csv response
```

### Recommended File Changes (not greenfield — delta only)

```
server/
├── routes/
│   ├── stripe.ts              # ADD: Connect + Identity webhooks, /api/kyc/* endpoints
│   ├── iyzico.ts              # ADD: /api/admin/seller/:id/approve-tr route
│   └── sellerApi.ts           # HARDEN: SHA-256 hash, persistent rate-limit, fix encoding
├── services/
│   ├── paymentProvider.ts     # ADD: StripeConnectProvider implementing IPaymentProvider
│   └── kycService.ts          # NEW: signed URL generation, doc validation, GDPR delete
src/
├── services/
│   └── sellerApplicationService.ts  # EXTEND: kycDocuments → private path, 3-doc gate, identityStatus
├── pages/
│   ├── AdminSellerView.tsx    # ADD: signed URL display, payment provisioning trigger, identity status
│   ├── SellerApplication.tsx  # ADD: 3-doc upload to private path, identity verification redirect
│   ├── SellerInventory.tsx    # ADD: min-1-photo + required-category client validation
│   └── SellerStore.tsx        # ADD: slug management, shareable URL display
firestore.rules                # ADD: sellerApplications admin-only, kycDocuments rule reference
storage.rules                  # NEW (or ADD): kyc/* admin-only read, deny public
```

### Pattern 1: Stripe Connect Express — Account Creation + Onboarding Link

**What:** Create Express account on approval, generate AccountLink, redirect seller to Stripe-hosted onboarding.
**When to use:** When `origin` field on `SellerApplication` indicates EU seller.

```typescript
// Source: https://docs.stripe.com/connect/express-accounts
// In server/routes/stripe.ts or server/services/kycService.ts

async function provisionStripeConnect(sellerId: string, sellerEmail: string, country: string) {
  // Step 1: Create Express account
  const account = await stripe.accounts.create({
    type: 'express',
    country, // e.g. 'DE', 'NL', 'GB'
    email: sellerEmail,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
  });

  // Step 2: Persist accountId immediately (idempotency guard)
  await adminDb.collection('sellers').doc(sellerId).update({
    stripeAccountId: account.id,
    stripeOnboardingStatus: 'pending',
    updatedAt: new Date().toISOString(),
  });

  // Step 3: Generate single-use onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${APP_URL}/seller/dashboard?connect=refresh`,
    return_url: `${APP_URL}/seller/dashboard?connect=complete`,
    type: 'account_onboarding',
  });

  return { accountId: account.id, onboardingUrl: accountLink.url };
}
```

**Critical pitfalls:**

- Account links are **single-use** — generate fresh link each time seller needs to resume onboarding
- Check `charges_enabled` (not just `details_submitted`) to confirm full onboarding
- `payouts_enabled` arrives via `account.updated` webhook, not the return_url

### Pattern 2: Stripe Connect — `account.updated` Webhook

```typescript
// Source: https://docs.stripe.com/connect/express-accounts
// Add to switch(event.type) in registerStripeWebhook()

case 'account.updated': {
  const account = event.data.object as Stripe.Account;
  if (account.payouts_enabled && account.charges_enabled) {
    // Find seller by stripeAccountId
    const snap = await adminDb.collection('sellers')
      .where('stripeAccountId', '==', account.id).limit(1).get();
    if (!snap.empty) {
      await snap.docs[0].ref.update({
        stripeOnboardingStatus: 'complete',
        payoutsEnabled: true,
        updatedAt: new Date().toISOString(),
      });
    }
  }
  break;
}
```

### Pattern 3: Stripe Identity — VerificationSession

**What:** Create a server-side VerificationSession; redirect seller to Stripe-hosted doc+selfie flow; handle result webhook.
**When to use:** On KYC document upload completion (all sellers, TR and EU).

```typescript
// Source: https://docs.stripe.com/identity/verification-sessions

// Server: POST /api/kyc/identity-verify
const session = await stripe.identity.verificationSessions.create({
  type: 'document',
  options: {
    document: {
      allowed_types: ['driving_license', 'id_card', 'passport'],
      require_id_number: false,
      require_live_capture: true,
      require_matching_selfie: true,
    },
  },
  provided_details: { email: sellerEmail },
  metadata: { sellerId, applicationId },
  // Use idempotency key = applicationId to avoid duplicate sessions
});

// Return to client: session.url for redirect flow
// OR session.client_secret for embedded (StripeIdentity component)
return { verificationUrl: session.url, sessionId: session.id };
```

```typescript
// Webhook handler — add to switch(event.type):
case 'identity.verification_session.verified': {
  const vs = event.data.object as Stripe.Identity.VerificationSession;
  const { sellerId, applicationId } = vs.metadata;
  await adminDb.collection('sellerApplications').doc(applicationId).update({
    identityVerificationStatus: 'verified',
    identitySessionId: vs.id,
    updatedAt: new Date().toISOString(),
  });
  break;
}
case 'identity.verification_session.requires_input': {
  const vs = event.data.object as Stripe.Identity.VerificationSession;
  const { applicationId } = vs.metadata;
  await adminDb.collection('sellerApplications').doc(applicationId).update({
    identityVerificationStatus: 'requires_input',
    identityVerificationError: vs.last_error?.reason ?? 'Verification failed',
    updatedAt: new Date().toISOString(),
  });
  break;
}
```

### Pattern 4: Iyzico Sub-Merchant Creation

**What:** Call `subMerchantCreate` from `iyzico.cjs` when admin approves a TR seller.
**When to use:** `SellerApplication.origin === 'TR'` and admin clicks approve.

```typescript
// Source: https://docs.iyzico.com/en/products/marketplace/marketplace-implementation/submerchant
// In server/routes/iyzico.ts or server/services/kycService.ts

const { subMerchantCreate } = await import('../iyzico.cjs');

const request = {
  locale: 'tr',
  conversationId: applicationId, // idempotency key
  subMerchantExternalId: sellerId, // MUST be unique per seller — use Firestore userId
  subMerchantType: 'PERSONAL', // or 'PRIVATE_COMPANY' / 'LIMITED_OR_JOINT_STOCK_COMPANY'
  // PERSONAL requires:
  identityNumber: application.taxId, // TC Kimlik No (11 digits)
  contactName: firstName,
  contactSurname: lastName,
  // ALL types:
  name: application.storeName,
  email: application.userEmail,
  gsmNumber: application.phone, // format: +905XXXXXXXXX
  address: application.address,
  iban: application.bankIban, // must match contactName/contactSurname
  currency: 'TRY',
};

const result = await subMerchantCreate(iyzicoClient, request);

if (result.status === 'success') {
  await adminDb.collection('sellers').doc(sellerId).update({
    iyzicoSubMerchantKey: result.subMerchantKey, // store for use in payments
    iyzicoOnboardingStatus: 'complete',
    updatedAt: new Date().toISOString(),
  });
}
```

**Critical:** `subMerchantExternalId` must be globally unique — use the seller's Firebase UID. Sandbox accepts test TC identity numbers (e.g. `74300864791`).

### Pattern 5: Firebase Storage Private KYC + Signed URL

```typescript
// Source: https://firebase.google.com/docs/storage/admin/start
// Server — generate write-upload signed URL for client (POST /api/kyc/upload-url)
import { getStorage } from 'firebase-admin/storage';

const bucket = getStorage().bucket(); // default bucket
const filePath = `kyc/${sellerId}/${docType}-${Date.now()}`;
const file = bucket.file(filePath);

// Signed URL for CLIENT upload (PUT, 10 min)
const [uploadUrl] = await file.getSignedUrl({
  version: 'v4',
  action: 'write',
  expires: Date.now() + 10 * 60 * 1000,
  contentType: 'application/octet-stream',
});

// Signed URL for ADMIN read (GET, 5 min)
const [readUrl] = await file.getSignedUrl({
  version: 'v4',
  action: 'read',
  expires: Date.now() + 5 * 60 * 1000,
});
```

```
// storage.rules — DENY all client reads on kyc/ path
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // KYC documents: NO client access; Admin SDK bypasses these rules
    match /kyc/{sellerId}/{docId} {
      allow read, write: if false;
    }
    // Public product images
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Critical:** Admin SDK calls bypass Storage rules entirely — security for admin-only access is enforced by the Express route's `verifyAdmin` middleware, NOT by Storage rules. Rules only protect client SDK access.

### Pattern 6: CSV Import with papaparse + Zod + SSRF-safe Image Fetch

```typescript
// Source: papaparse 5.5.3 docs (installed)
import Papa from 'papaparse';
import { z } from 'zod';

const csvRowSchema = z.object({
  title: z.string().min(1, 'title required'),
  price: z.coerce.number().positive('price must be positive'),
  stock: z.coerce.number().int().nonnegative(),
  category: z.string().min(1, 'category required'),
  image_url: z.string().min(1, 'at least one image_url required'),
  description: z.string().optional(),
  brand: z.string().optional(),
});

// Parse CSV string (server receives multipart file)
const parsed = Papa.parse<Record<string, string>>(csvString, {
  header: true,
  skipEmptyLines: true,
  transformHeader: (h) => h.trim().toLowerCase(),
});

const errors: Array<{ row: number; field: string; reason: string }> = [];
const validRows: (typeof csvRowSchema._type)[] = [];

for (let i = 0; i < parsed.data.length; i++) {
  const rowNum = i + 2; // 1-indexed + header row
  const result = csvRowSchema.safeParse(parsed.data[i]);
  if (!result.success) {
    result.error.errors.forEach((e) =>
      errors.push({ row: rowNum, field: e.path.join('.'), reason: e.message }),
    );
    continue;
  }
  // Validate category against platform taxonomy
  if (!platformCategorySet.has(result.data.category)) {
    errors.push({
      row: rowNum,
      field: 'category',
      reason: `Unknown category: "${result.data.category}"`,
    });
    continue;
  }
  validRows.push(result.data);
}
```

**SSRF-safe image fetch pattern:**

```typescript
// SSRF mitigation: allowlist URL schemes, block private IP ranges
async function fetchImageToStorage(imageUrl: string, destPath: string): Promise<string> {
  const url = new URL(imageUrl); // throws on invalid URL
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid URL scheme');
  // Block private/loopback ranges — check hostname resolves to public IP
  // Use a library like 'is-ip' [ASSUMED] or manual check:
  const BLOCKED = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/;
  if (BLOCKED.test(url.hostname)) throw new Error('Private URLs not allowed');

  const response = await fetch(imageUrl, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
  const contentType = response.headers.get('content-type') ?? 'image/jpeg';
  if (!contentType.startsWith('image/')) throw new Error('URL is not an image');
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_SIZE) throw new Error('Image exceeds 5 MB limit');

  const bucket = getStorage().bucket();
  await bucket.file(destPath).save(Buffer.from(buffer), { contentType });
  return destPath;
}
```

### Pattern 7: API Key Hardening — SHA-256 + timingSafeEqual

```typescript
// Source: Node.js built-in crypto module
import { createHash, timingSafeEqual } from 'crypto';

// Hashing (replaces the broken (h<<5)-h+charCodeAt implementation)
function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

// Constant-time comparison (replaces direct equality check)
function verifyApiKey(rawKey: string, storedHash: string): boolean {
  const inputHash = Buffer.from(hashApiKey(rawKey));
  const stored = Buffer.from(storedHash);
  if (inputHash.length !== stored.length) return false;
  return timingSafeEqual(inputHash, stored);
}
```

**Rate limiting — use express-rate-limit with Firestore store:**

```typescript
// express-rate-limit 8.5.2 supports custom stores via Store interface
// Firestore-backed store (implement Store interface):
import rateLimit from 'express-rate-limit';

// Option A: Use express-rate-limit with a simple Firestore store
// Option B: Per-request Firestore counter with TTL field (simpler for solo dev)
// Recommendation: For solo-dev + MVP, Firestore counter approach is sufficient
// and avoids adding another dependency.

// Firestore rate limit document: { count, resetAt } keyed by `${sellerId}:${permission}`
// Atomic increment via FieldValue.increment(1) with TTL check — survives restarts
```

### Anti-Patterns to Avoid

- **Do not store raw API keys in Firestore** — only the SHA-256 hash. The raw key is shown once at creation only.
- **Do not use Firebase client SDK for admin KYC reads** — always use Admin SDK signed URLs via the Express API.
- **Do not call `subMerchantCreate` before admin approval** — this is the gate for the TR payment account. Calling it speculatively creates orphan sub-merchants.
- **Do not create Stripe Connect account before admin approval** — same reason, and each account creation starts KYC requirements on Stripe's side immediately.
- **Do not read `return_url` query params to confirm Stripe Connect onboarding** — always confirm via `account.updated` webhook (`charges_enabled: true`).
- **Do not generate a single AccountLink and store it** — they expire and are single-use. Generate fresh on each admin/seller request.
- **Do not fetch CSV images from the client side** — all external URL fetches must go through the server (SSRF control, size limits, content-type validation).

---

## Don't Hand-Roll

| Problem                         | Don't Build                  | Use Instead                                          | Why                                                                                     |
| ------------------------------- | ---------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Identity verification           | Custom doc + selfie matching | Stripe Identity                                      | AML/KYC compliance complexity, liveness detection, document authenticity                |
| EU payment compliance           | Custom SEPA/PSD2 flows       | Stripe Connect Express                               | Stripe bears KYC/AML liability for EU sellers                                           |
| Constant-time string comparison | `===` equality               | `crypto.timingSafeEqual`                             | Timing attacks extract hash bit-by-bit                                                  |
| SHA-256                         | Custom hash function         | `crypto.createHash('sha256')`                        | The existing `(h<<5)-h+charCodeAt` is a djb2 variant — collisions trivially constructed |
| CSV streaming                   | Manual string split          | `papaparse` (already installed)                      | Handles quoted fields, BOM, encoding, line endings                                      |
| Row validation                  | Manual field checks          | `zod` row schema                                     | Already pattern in `server/lib/schemas.ts`                                              |
| Rate limiting state             | In-memory Map                | Firestore counter or `express-rate-limit` with store | Map resets on server restart — defeats rate limiting                                    |
| Image proxy/fetch               | None                         | Native `fetch` + SSRF blocklist                      | Node 22 has native fetch; add hostname validation                                       |

**Key insight:** The existing `(h<<5)-h+charCodeAt` hash in both `apiKeyService.ts` and `sellerApi.ts` is identical — both files must be updated together. The hash is only 8 hex chars (32 bits), meaning ~4 billion possible hash values for arbitrary key space — brute-forceable.

---

## Common Pitfalls

### Pitfall 1: Duplicate Payment Account Provisioning on KYC Approval

**What goes wrong:** Admin clicks "approve" twice (network retry, double-click) → two Stripe Express accounts or two Iyzico sub-merchants created for the same seller.
**Why it happens:** `reviewApplication()` in `sellerApplicationService.ts` does a simple `updateDoc` — no idempotency guard on the provisioning call.
**How to avoid:** Before calling `stripe.accounts.create` or `subMerchantCreate`, check if `sellers/{sellerId}.stripeAccountId` or `.iyzicoSubMerchantKey` already exists. Use Firestore transaction: `if (sellerDoc.stripeAccountId) return existing`. Use `conversationId: applicationId` as Iyzico idempotency key.
**Warning signs:** Two records for same `subMerchantExternalId` in Iyzico (will fail — Iyzico rejects duplicate `subMerchantExternalId`).

### Pitfall 2: Stripe AccountLinks Are Single-Use and Expire

**What goes wrong:** Admin generates onboarding link, sends it to seller, seller doesn't use it immediately → link is expired or used → seller can't complete onboarding.
**Why it happens:** Stripe AccountLinks expire in minutes and become invalid after first use.
**How to avoid:** Generate a fresh AccountLink on demand every time the seller clicks "Continue Onboarding" in the dashboard. Do not persist the URL.
**Warning signs:** Seller gets redirected to `refresh_url` → that's Stripe's signal the link expired.

### Pitfall 3: Stripe Identity Session Duplication

**What goes wrong:** Multiple verification sessions created for same seller → Stripe charges per session.
**Why it happens:** Seller refreshes the page during verification flow → frontend calls create-session endpoint again.
**How to avoid:** Store `identitySessionId` on `sellerApplications` document. Before creating a new session, check if existing session is in `processing` or `requires_input` state and reuse it. Use idempotency key = `applicationId` on the Stripe API call.

### Pitfall 4: Firebase Storage Rules Don't Protect Admin SDK Access

**What goes wrong:** Developer writes `allow read: if isAdmin()` in Storage rules, assumes Admin SDK respects it — it doesn't. Admin SDK bypasses all Storage rules.
**Why it happens:** Firebase Storage rules only apply to client SDK calls. Admin SDK (firebase-admin) has full access regardless.
**How to avoid:** Use `allow read, write: if false` for `kyc/*` in Storage rules (blocks client SDK), and enforce access control in the Express route with `verifyAdmin` middleware before calling `getSignedUrl`.

### Pitfall 5: SSRF via CSV image_url

**What goes wrong:** Attacker uploads a CSV with `image_url=http://169.254.169.254/latest/meta-data/` (AWS IMDS) → server fetches cloud metadata.
**Why it happens:** Naive `fetch(imageUrl)` without hostname validation.
**How to avoid:** Validate URL scheme (https only in prod), block private IP ranges (10.x, 192.168.x, 172.16-31.x, 127.x, 169.254.x), set request timeout (10s), validate `Content-Type: image/*`, enforce max size (5 MB).

### Pitfall 6: Iyzico subMerchantExternalId Must Be Globally Unique

**What goes wrong:** Using a non-unique ID (e.g., sequential counter) → if seller is deleted and re-onboarded, second creation fails with "external ID already exists".
**Why it happens:** Iyzico stores `subMerchantExternalId` permanently.
**How to avoid:** Use Firebase Auth UID as `subMerchantExternalId` — globally unique, permanent.

### Pitfall 7: UTF-8 Mojibake in sellerApi.ts

**What goes wrong:** The file contains UTF-8 Turkish characters stored as Latin-1 mojibake (e.g., `â€"` instead of `—`, `Ã¼` instead of `ü`). Error messages shown to sellers are garbled.
**Why it happens:** File was likely saved/edited with wrong encoding at some point.
**How to avoid:** Fix by rewriting the affected string literals with correct UTF-8 characters in a single commit. No logic changes needed.

### Pitfall 8: Slug Uniqueness for Store Pages

**What goes wrong:** Two sellers register with same store name → same slug → routing conflict.
**Why it happens:** `sellerApplicationService.ts` has a `slug` field but no uniqueness enforcement.
**How to avoid:** On `submitApplication`, query Firestore for existing slug before saving. If collision, append `-2`, `-3`, etc. Store slug on `sellers` collection for routing.

### Pitfall 9: CSV Category Validation Requires Firestore Read

**What goes wrong:** CSV import endpoint doesn't have platform categories loaded → no validation → wrong categories accepted.
**Why it happens:** Categories are in Firestore `categories` collection.
**How to avoid:** At import request start, fetch all categories from Firestore once (or use Admin SDK) to build a Set of valid slugs/names. Cache for the duration of the request. Do not make per-row Firestore reads.

---

## Code Examples

### Verified: Admin SDK getSignedUrl Pattern

```typescript
// Source: https://firebase.google.com/docs/storage/admin/start
import { getStorage } from 'firebase-admin/storage';

export async function getKycSignedUrl(sellerId: string, docId: string): Promise<string> {
  const bucket = getStorage().bucket();
  const file = bucket.file(`kyc/${sellerId}/${docId}`);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
  });
  return url;
}

export async function deleteKycDocuments(sellerId: string): Promise<void> {
  // GDPR/KVKK deletion
  const bucket = getStorage().bucket();
  await bucket.deleteFiles({ prefix: `kyc/${sellerId}/` });
}
```

### Verified: SellerApplication Extension for 3-Doc Gate

```typescript
// Extension to existing SellerApplication type
export interface KycDocument {
  docType: 'identity' | 'tax_certificate' | 'bank_iban';
  storagePath: string; // kyc/{sellerId}/{docId} — NOT a public URL
  uploadedAt: string;
  fileName: string;
}

export interface SellerApplicationV2 extends SellerApplication {
  kycDocuments: KycDocument[]; // replaces { name; url }[]
  identityVerificationStatus?: 'pending' | 'verified' | 'requires_input';
  identitySessionId?: string;
}

// 3-doc gate check (server-side before approve)
function hasAllRequiredDocs(app: SellerApplicationV2): boolean {
  const types = new Set(app.kycDocuments?.map((d) => d.docType) ?? []);
  return types.has('identity') && types.has('tax_certificate') && types.has('bank_iban');
}
```

### Verified: SHA-256 Key Hash Migration

```typescript
// Replaces broken hash in BOTH apiKeyService.ts AND sellerApi.ts
import { createHash, timingSafeEqual } from 'crypto';

export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey, 'utf8').digest('hex');
}

// Migration note: existing hashed keys in Firestore used the OLD hash.
// Plan must include a data migration: re-hash all active keys on next use,
// or invalidate existing keys and require sellers to regenerate.
// Recommendation: invalidate + notify (cleaner, one-time).
```

---

## State of the Art

| Old Approach                 | Current Approach                                      | When Changed                 | Impact                                                   |
| ---------------------------- | ----------------------------------------------------- | ---------------------------- | -------------------------------------------------------- |
| Custom identity verification | Stripe Identity (hosted, webhook-driven)              | 2021+                        | Removes AML/liveness liability from platform             |
| Stripe Standard Connect      | Stripe Express Connect (recommended for marketplaces) | 2019+                        | Stripe hosts onboarding; platform not liable for KYC/AML |
| djb2 hash for tokens         | SHA-256 + timingSafeEqual                             | Node crypto always available | 32-bit hash space → 256-bit; timing-safe                 |
| Public Firebase Storage URLs | Admin-SDK signed URLs with expiry                     | Best practice for PII        | GDPR/KVKK compliance for KYC docs                        |
| All-or-nothing CSV import    | Partial import + error report                         | Industry standard            | Reduces seller friction on large catalogs                |

**Deprecated/outdated in this codebase:**

- `(h<<5)-h+charCodeAt` hash in `apiKeyService.ts` line 69-77 and `sellerApi.ts` line 26: insecure, 32-bit — replace with SHA-256.
- `new Map()` rate limiting in `apiKeyService.ts` line 205 and `sellerApi.ts` line 18: memory-only, not persistent — replace with Firestore counter.
- `kycDocuments: { name: string; url: string }[]` in `sellerApplicationService.ts` line 17: `url` is a public Firebase Storage URL — replace with `storagePath` (private path); signed URL generated on demand.

---

## Critical Integration Gaps (What's Missing vs. Success Criteria)

| Gap                                                | Current State                                                       | Required Change                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| KYC docs are public URLs                           | `kycDocuments[].url` stores public Firebase download URL            | Migrate to `storagePath`; generate signed URL via Admin SDK on demand |
| No 3-doc gate on approve                           | `reviewApplication()` has no doc-count check                        | Server-side check before approve: identity + tax + bank all present   |
| No Stripe Identity integration                     | Zero `stripe.identity` calls anywhere in codebase                   | New endpoint + webhook cases                                          |
| No Stripe Connect anywhere                         | Zero `stripe.accounts` calls                                        | New provisioning logic in approve flow                                |
| No Iyzico sub-merchant provisioning                | `subMerchantCreate` exists in `.cjs` but never called from approval | Wire into admin approve handler                                       |
| API key hash is broken djb2                        | `apiKeyService.ts:hashKey()` + `sellerApi.ts:authenticateApiKey()`  | Both files: replace with SHA-256                                      |
| Rate limiting resets on restart                    | `new Map()` in both files                                           | Firestore-backed counter                                              |
| UTF-8 mojibake in sellerApi.ts                     | Lines 1, 53, 56, 58, etc. garbled                                   | Rewrite string literals as correct UTF-8                              |
| No server-side product validation                  | Product create/update in `sellerApi.ts` doesn't enforce min 1 photo | Add Zod validation: `images.length >= 1`, `categoryId` in valid set   |
| CSV import is scaffolded                           | `SellerImportCenter.tsx` exists but no server import endpoint       | New `/api/products/csv-import` endpoint                               |
| No storage.rules file                              | Only `firebase.json` + `firestore.rules` found                      | Create `storage.rules` denying client access to `kyc/*`               |
| Seller store slug uniqueness                       | `slug` field present in `SellerApplication` but no uniqueness check | Firestore query before submit                                         |
| `createPaymentProvider()` only supports `'iyzico'` | Factory in `paymentProvider.ts` line 226                            | Add `'stripe-connect'` case with `StripeConnectProvider` class        |

---

## Assumptions Log

| #   | Claim                                                                                                  | Section          | Risk if Wrong                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| A1  | `is-ip` or similar private-IP-check library not needed — manual regex SSRF block is sufficient for MVP | CSV Pitfall 5    | If attacker finds bypass, server could fetch internal metadata; add dedicated library if risk appetite changes                |
| A2  | Iyzico sandbox accepts `identityNumber: '74300864791'` as test TC number                               | Iyzico Pattern 4 | Test onboarding will fail; find correct test number from Iyzico sandbox docs                                                  |
| A3  | Stripe Identity redirect flow (`session.url`) preferred over embedded SDK for initial implementation   | Pattern 3        | UX less integrated; can switch to embedded (`stripe.verifyIdentity(clientSecret)`) with `@stripe/stripe-js` already installed |
| A4  | `express-rate-limit` Firestore store will be implemented manually (no separate npm store package)      | Pattern 7        | If Firestore writes add latency, may need `rate-limit-redis` or similar; current stack has no Redis                           |
| A5  | Storage rules file needs to be created — not currently in the repo                                     | Gap table        | If already exists in uncommitted changes, writing it may clobber existing rules                                               |

---

## Environment Availability

| Dependency                               | Required By            | Available   | Version            | Fallback                            |
| ---------------------------------------- | ---------------------- | ----------- | ------------------ | ----------------------------------- |
| Stripe SDK                               | Connect + Identity     | ✓           | ^22.1.1            | —                                   |
| Firebase Admin SDK                       | Signed URLs, Firestore | ✓           | ^13.10.0           | —                                   |
| iyzipay (via iyzico.cjs)                 | Sub-merchant creation  | ✓           | 2.0.67             | —                                   |
| papaparse                                | CSV import             | ✓           | ^5.5.3             | —                                   |
| zod                                      | Row validation         | ✓           | ^4.4.3             | —                                   |
| express-rate-limit                       | API rate limiting      | ✓           | ^8.5.2             | —                                   |
| Node.js crypto                           | Key hashing            | ✓           | built-in (Node 22) | —                                   |
| Native fetch                             | Image URL fetch        | ✓           | built-in (Node 22) | —                                   |
| storage.rules                            | KYC private bucket     | ✗           | —                  | Must create; no fallback            |
| Stripe Identity webhook secret           | Identity webhooks      | ✗ (env var) | —                  | Dev: use Stripe CLI `stripe listen` |
| Stripe Connect webhook (account.updated) | Connect status         | ✗ (env var) | —                  | Dev: use Stripe CLI                 |

**Missing dependencies with no fallback:**

- `storage.rules` file must be created (blocks KYC privacy guarantee)

**Missing dependencies with fallback:**

- Stripe Identity + Connect webhook secrets: use `stripe listen --forward-to localhost:3000/api/webhook` in dev

---

## Validation Architecture

> `workflow.nyquist_validation` is `false` in `.planning/config.json` — this section is SKIPPED per config.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                            |
| --------------------- | ------- | ------------------------------------------------------------------------------------------- |
| V2 Authentication     | yes     | Firebase Auth token + Admin SDK `verifyIdToken` (existing `verifyFirebaseToken` middleware) |
| V3 Session Management | no      | Stateless JWT via Firebase Auth                                                             |
| V4 Access Control     | yes     | `verifyAdmin` middleware gates all KYC signed URL + approval endpoints                      |
| V5 Input Validation   | yes     | `zod` schemas on all API inputs; CSV row validation                                         |
| V6 Cryptography       | yes     | `crypto.createHash('sha256')` + `timingSafeEqual` for API keys; never hand-roll             |

### Known Threat Patterns

| Pattern                                 | STRIDE                      | Standard Mitigation                                                                  |
| --------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------ |
| SSRF via CSV image_url                  | Tampering / Info Disclosure | Hostname allowlist + private IP block + size limit                                   |
| API key brute force via hash comparison | Spoofing                    | SHA-256 (256-bit space) + `timingSafeEqual` (timing-safe)                            |
| KYC document data leak                  | Info Disclosure             | Private Storage path + short-lived signed URL + `verifyAdmin` middleware             |
| Duplicate payment account creation      | Tampering                   | Idempotency check: read `stripeAccountId`/`iyzicoSubMerchantKey` before provisioning |
| Stripe Identity cost abuse              | Repudiation                 | Server-side session creation only; reuse existing session if `processing`            |
| Slug injection / path traversal         | Tampering                   | Sanitize slug: `slug.replace(/[^a-z0-9-]/g, '')` before Firestore write              |

---

## Sources

### Primary (HIGH confidence)

- [Stripe Connect Express Accounts](https://docs.stripe.com/connect/express-accounts) — account creation, AccountLink, onboarding flow, `account.updated` webhook
- [Stripe Identity VerificationSession](https://docs.stripe.com/identity/verification-sessions) — session creation, client_secret, webhook events, pitfalls
- [Stripe Identity Webhook Outcomes](https://docs.stripe.com/identity/handle-verification-outcomes) — `identity.verification_session.verified`, `requires_input`, `last_error`
- [Iyzico SubMerchant API](https://docs.iyzico.com/en/products/marketplace/marketplace-implementation/submerchant) — required fields per type, IBAN constraints, subMerchantKey
- [Firebase Storage Admin SDK](https://firebase.google.com/docs/storage/admin/start) — `getSignedUrl`, `deleteFiles`
- Codebase: `server/services/paymentProvider.ts` — `IPaymentProvider` interface (verified)
- Codebase: `server/iyzico.cjs` — `subMerchantCreate` already wrapped (verified)
- Codebase: `src/services/apiKeyService.ts` — broken `hashKey()` confirmed at line 68-77 (verified)
- Codebase: `server/routes/sellerApi.ts` — broken hash + in-memory Map + mojibake confirmed (verified)
- Codebase: `server/lib/schemas.ts` — existing Zod patterns for server validation (verified)
- Codebase: `firestore.rules` — existing `isAdmin()` custom claims pattern (verified)

### Secondary (MEDIUM confidence)

- Firebase Storage security rules client vs Admin SDK behavior — confirmed by official docs: Admin SDK bypasses rules entirely

### Tertiary (LOW confidence — see Assumptions Log)

- SSRF hostname regex approach (A1)
- Iyzico sandbox test TC number (A2)

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all packages already installed and verified in package.json
- Stripe Connect integration: HIGH — official docs fetched, SDK already installed
- Stripe Identity integration: HIGH — official docs fetched, SDK already installed
- Iyzico sub-merchant: HIGH — official docs fetched, wrapper already in codebase
- Firebase Storage signed URLs: HIGH — official docs confirmed
- CSV import patterns: HIGH — papaparse + zod both installed, patterns verified
- API key hardening: HIGH — Node crypto built-in, well-documented
- Existing codebase gaps: HIGH — verified by direct file inspection

**Research date:** 2026-06-03
**Valid until:** 2026-09-03 (stable APIs; check Stripe SDK changelog if >30 days pass)
