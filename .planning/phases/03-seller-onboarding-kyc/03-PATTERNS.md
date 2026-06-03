# Phase 3: Seller Onboarding & KYC - Pattern Map

**Mapped:** 2026-06-03
**Files analyzed:** 12 new/modified files
**Analogs found:** 11 / 12

## File Classification

| New/Modified File                                                | Role      | Data Flow                       | Closest Analog                                                 | Match Quality |
| ---------------------------------------------------------------- | --------- | ------------------------------- | -------------------------------------------------------------- | ------------- |
| `server/services/kycService.ts`                                  | service   | request-response                | `server/services/paymentProvider.ts`                           | role-match    |
| `server/routes/stripe.ts` (ADD Connect + Identity)               | route     | event-driven + request-response | `server/routes/stripe.ts` (existing)                           | exact         |
| `server/routes/iyzico.ts` (ADD sub-merchant approve)             | route     | request-response                | `server/routes/iyzico.ts` (existing)                           | exact         |
| `server/routes/sellerApi.ts` (HARDEN)                            | route     | request-response                | `server/routes/sellerApi.ts` (existing)                        | exact         |
| `server/services/paymentProvider.ts` (ADD StripeConnectProvider) | service   | request-response                | `server/services/paymentProvider.ts` (existing IyzicoProvider) | exact         |
| `server/lib/schemas.ts` (ADD CSV + KYC schemas)                  | utility   | transform                       | `server/lib/schemas.ts` (existing)                             | exact         |
| `src/services/sellerApplicationService.ts` (EXTEND)              | service   | CRUD                            | `src/services/sellerApplicationService.ts` (existing)          | exact         |
| `src/services/apiKeyService.ts` (HARDEN hash)                    | service   | CRUD                            | `src/services/apiKeyService.ts` (existing)                     | exact         |
| `src/pages/SellerApplication.tsx` (ADD doc upload + Identity)    | component | request-response                | `src/pages/SellerApplication.tsx` (existing)                   | exact         |
| `src/pages/AdminSellerView.tsx` (ADD signed URL + provisioning)  | component | request-response                | `src/pages/AdminSellerView.tsx` (existing)                     | exact         |
| `src/pages/SellerInventory.tsx` (ADD min-1-photo validation)     | component | CRUD                            | `src/pages/SellerApplication.tsx`                              | role-match    |
| `storage.rules` (NEW)                                            | config    | —                               | `firestore.rules`                                              | partial       |

---

## Pattern Assignments

### `server/services/kycService.ts` (service, request-response)

**Analog:** `server/services/paymentProvider.ts`

**Imports pattern** (`server/services/paymentProvider.ts` lines 1–4):

```typescript
// ─── Payment Provider Abstraction (D-02) ─────────────────────────────────────
// IPaymentProvider interface enabling future provider swap (TR→Iyzico, EU→Stripe).
// IyzicoProvider wraps the iyzico.cjs SDK with marketplace subMerchant splits.
```

**New file imports to use:**

```typescript
import { getStorage } from 'firebase-admin/storage';
import type { Firestore } from 'firebase-admin/firestore';
import type Stripe from 'stripe';
```

**Core pattern — signed URL generation** (from RESEARCH.md Pattern 5):

```typescript
// POST /api/kyc/upload-url — server generates write-signed URL for client upload
const bucket = getStorage().bucket();
const filePath = `kyc/${sellerId}/${docType}-${Date.now()}`;
const file = bucket.file(filePath);
const [uploadUrl] = await file.getSignedUrl({
  version: 'v4',
  action: 'write',
  expires: Date.now() + 10 * 60 * 1000,
  contentType: 'application/octet-stream',
});

// GET /api/kyc/signed-url/:docId — admin read URL (5 min TTL)
const [readUrl] = await file.getSignedUrl({
  version: 'v4',
  action: 'read',
  expires: Date.now() + 5 * 60 * 1000,
});
```

**GDPR delete pattern** (from RESEARCH.md Code Examples):

```typescript
export async function deleteKycDocuments(sellerId: string): Promise<void> {
  const bucket = getStorage().bucket();
  await bucket.deleteFiles({ prefix: `kyc/${sellerId}/` });
}
```

**Error handling pattern** — copy from `server/routes/iyzico.ts` lines 38–45:

```typescript
try {
  if (!adminDb) return res.status(503).json({ error: 'Database not configured' });
  // ... logic
} catch (err: any) {
  return res.status(500).json({ error: err.message });
}
```

---

### `server/routes/stripe.ts` — ADD Stripe Connect + Identity (route, event-driven)

**Analog:** `server/routes/stripe.ts` existing file (exact)

**Webhook switch block pattern** (`server/routes/stripe.ts` lines 59–76):

```typescript
switch (event.type) {
  case 'checkout.session.completed': {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId && adminDb) {
      await adminDb.collection('orders').doc(orderId).update({
        status: 'paid',
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stripePaymentIntentId: session.payment_intent as string,
      });
    }
    break;
  }
  // ADD new cases here following same pattern:
  case 'account.updated': { ... break; }
  case 'identity.verification_session.verified': { ... break; }
  case 'identity.verification_session.requires_input': { ... break; }
}
```

**New webhook cases to add** (from RESEARCH.md Patterns 2 & 3):

```typescript
case 'account.updated': {
  const account = event.data.object as Stripe.Account;
  if (account.payouts_enabled && account.charges_enabled) {
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
case 'identity.verification_session.verified': {
  const vs = event.data.object as Stripe.Identity.VerificationSession;
  const { applicationId } = vs.metadata;
  await adminDb.collection('sellerApplications').doc(applicationId).update({
    identityVerificationStatus: 'verified',
    identitySessionId: vs.id,
    updatedAt: new Date().toISOString(),
  });
  break;
}
```

**New JSON route pattern** — for `/api/kyc/identity-verify`, follow existing route structure from `server/routes/stripe.ts` line 37:

```typescript
app.post(
  '/api/kyc/identity-verify',
  verifyFirebaseToken,
  validate(identityVerifySchema),
  async (req, res) => {
    try {
      const session = await stripe.identity.verificationSessions.create({
        type: 'document',
        options: { document: { require_matching_selfie: true, require_live_capture: true } },
        metadata: { sellerId: req.uid, applicationId: req.body.applicationId },
      });
      return res.json({ verificationUrl: session.url, sessionId: session.id });
    } catch (err: any) {
      logger.error('stripe', 'Identity session creation failed', { error: err.message });
      return res.status(500).json({ error: err.message });
    }
  },
);
```

**Auth guard pattern** (`src/lib/authMiddleware.ts` lines 47–62):

```typescript
// verifyAdmin: checks decoded.role === 'admin' from Firebase custom claims
// verifyFirebaseToken: any authenticated user
// All KYC-admin routes use: verifyAdmin
// All KYC-seller routes use: verifyFirebaseToken
```

---

### `server/routes/iyzico.ts` — ADD sub-merchant approval route (route, request-response)

**Analog:** `server/routes/iyzico.ts` existing (exact)

**Deps injection pattern** (`server/routes/iyzico.ts` lines 20–31):

```typescript
export interface IyzicoRouteDeps {
  getIyzico: () => Promise<any>;
  iyzicoProvider?: IPaymentProvider;
  adminDb: Firestore | null;
  port: number;
  verifyFirebaseToken?: (req: any, res: any, next: any) => void;
}

export function registerIyzicoRoutes(app: Express, deps: IyzicoRouteDeps) {
  const { getIyzico, adminDb } = deps;
```

**New route to add** — `POST /api/admin/seller/:id/approve-tr`:

```typescript
app.post('/api/admin/seller/:id/approve-tr', verifyAdmin, async (req, res) => {
  try {
    if (!adminDb) return res.status(503).json({ error: 'Database not configured' });
    const { id: sellerId } = req.params;

    // Idempotency guard (Pitfall 1 from RESEARCH.md)
    const sellerSnap = await adminDb.collection('sellers').doc(sellerId).get();
    if (sellerSnap.data()?.iyzicoSubMerchantKey) {
      return res.json({ alreadyProvisioned: true });
    }

    const { subMerchantCreate } = await getIyzico();
    const result = await subMerchantCreate(iyzicoClient, request);
    if (result.status === 'success') {
      await adminDb.collection('sellers').doc(sellerId).update({
        iyzicoSubMerchantKey: result.subMerchantKey,
        iyzicoOnboardingStatus: 'complete',
        updatedAt: new Date().toISOString(),
      });
    }
    return res.json({ subMerchantKey: result.subMerchantKey });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
```

---

### `server/routes/sellerApi.ts` — HARDEN (route, request-response)

**Analog:** `server/routes/sellerApi.ts` existing (exact — replace in-place)

**Current broken hash** (`server/routes/sellerApi.ts` line 26) — REPLACE with:

```typescript
import { createHash, timingSafeEqual } from 'crypto';

function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey, 'utf8').digest('hex');
}

function verifyApiKey(rawKey: string, storedHash: string): boolean {
  const inputHash = Buffer.from(hashApiKey(rawKey));
  const stored = Buffer.from(storedHash);
  if (inputHash.length !== stored.length) return false;
  return timingSafeEqual(inputHash, stored);
}
```

**Current broken rate limit** (`server/routes/sellerApi.ts` line 18) — REPLACE `new Map()` with Firestore counter:

```typescript
// Firestore-backed rate limit: { count: number, resetAt: number }
// keyed by `apiRateLimits/${sellerId}:${permission}`
// Use FieldValue.increment(1) for atomic increment; check resetAt for window expiry
async function checkApiRateLimit(
  adminDb: Firestore,
  sellerId: string,
  permission: string,
): Promise<boolean> {
  const key = `${sellerId}:${permission}`;
  const ref = adminDb.collection('apiRateLimits').doc(key);
  const limit = API_RATE_LIMITS[permission] ?? { max: 100, windowMs: 60000 };
  // Firestore transaction: read → reset-or-increment → check
}
```

**UTF-8 fix:** Rewrite all Turkish string literals in the file using correct UTF-8 characters (e.g. `geçersiz API anahtarı` not mojibake). No logic change needed.

---

### `server/services/paymentProvider.ts` — ADD StripeConnectProvider (service, request-response)

**Analog:** `IyzicoProvider` class in `server/services/paymentProvider.ts` lines 74–110 (exact pattern)

**Class structure to follow:**

```typescript
// Copy IyzicoProvider class structure exactly:
interface StripeConnectProviderDeps {
  stripe: Stripe;
  adminDb: Firestore;
}

export class StripeConnectProvider {
  private readonly stripe: Stripe;
  private readonly adminDb: Firestore;
  constructor(deps: StripeConnectProviderDeps) { ... }

  async provisionAccount(sellerId: string, sellerEmail: string, country: string) {
    // Idempotency guard: check sellers/{sellerId}.stripeAccountId first
    const account = await this.stripe.accounts.create({
      type: 'express',
      country,
      email: sellerEmail,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    });
    await this.adminDb.collection('sellers').doc(sellerId).update({
      stripeAccountId: account.id,
      stripeOnboardingStatus: 'pending',
      updatedAt: new Date().toISOString(),
    });
    const accountLink = await this.stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.APP_URL}/seller/dashboard?connect=refresh`,
      return_url: `${process.env.APP_URL}/seller/dashboard?connect=complete`,
      type: 'account_onboarding',
    });
    return { accountId: account.id, onboardingUrl: accountLink.url };
  }
}
```

**Factory addition** — in `createPaymentProvider()` (line 226 of paymentProvider.ts), add:

```typescript
case 'stripe-connect':
  return new StripeConnectProvider({ stripe, adminDb });
```

---

### `server/lib/schemas.ts` — ADD CSV + KYC schemas (utility, transform)

**Analog:** `server/lib/schemas.ts` existing (exact — append new schemas)

**Existing pattern to copy** (`server/lib/schemas.ts` lines 1–31):

```typescript
import { z } from 'zod';

export const csvRowSchema = z.object({
  title: z.string().min(1, 'title required'),
  price: z.coerce.number().positive('price must be positive'),
  stock: z.coerce.number().int().nonnegative(),
  category: z.string().min(1, 'category required'),
  image_url: z.string().min(1, 'at least one image_url required'),
  description: z.string().optional(),
  brand: z.string().optional(),
});

export const identityVerifySchema = z.object({
  applicationId: z.string().min(1),
});

export const kycUploadUrlSchema = z.object({
  sellerId: z.string().min(1),
  docType: z.enum(['identity', 'tax_certificate', 'bank_iban']),
});

export const approveSellerSchema = z.object({
  adminNote: z.string().optional(),
});
```

---

### `src/services/sellerApplicationService.ts` — EXTEND (service, CRUD)

**Analog:** `src/services/sellerApplicationService.ts` existing (exact)

**Existing import + error pattern** (lines 1–3, 48–51):

```typescript
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { notifyAdmins } from './notificationService';
// ...
} catch (error) {
  handleFirestoreError(error, OperationType.WRITE, COL);
  throw error;
}
```

**Type extension** — replace `kycDocuments` field (line 17):

```typescript
// OLD (line 17): kycDocuments?: { name: string; url: string }[];
// NEW:
export interface KycDocument {
  docType: 'identity' | 'tax_certificate' | 'bank_iban';
  storagePath: string; // kyc/{sellerId}/{docId} — NOT a public URL
  uploadedAt: string;
  fileName: string;
}

// In SellerApplication interface, replace line 17 with:
kycDocuments?: KycDocument[];
identityVerificationStatus?: 'pending' | 'verified' | 'requires_input';
identitySessionId?: string;
```

**3-doc gate function** — add after existing functions:

```typescript
export function hasAllRequiredDocs(app: SellerApplication): boolean {
  const types = new Set(app.kycDocuments?.map((d) => d.docType) ?? []);
  return types.has('identity') && types.has('tax_certificate') && types.has('bank_iban');
}
```

**Slug uniqueness** — extend `submitApplication` before `setDoc`:

```typescript
// Check slug uniqueness before saving (Pitfall 8 from RESEARCH.md)
const slugSnap = await getDocs(query(collection(db, COL), where('slug', '==', data.slug)));
let slug = data.slug;
if (!slugSnap.empty) slug = `${data.slug}-${Date.now().toString(36)}`;
```

---

### `src/services/apiKeyService.ts` — HARDEN hash (service, CRUD)

**Analog:** `src/services/apiKeyService.ts` existing (exact — replace `hashKey` function)

**Current broken function** (lines 68–77) — REPLACE with server-side hash call:

```typescript
// NOTE: SHA-256 must be computed server-side (Node crypto).
// Client service should call POST /api/keys/create → server hashes and stores.
// For client display: show raw key once at creation, never store raw key in Firestore.
// Migration: invalidate all existing keys (old hash is incompatible) + notify sellers.
```

---

### `src/pages/SellerApplication.tsx` — ADD 3-doc upload + Identity redirect (component, request-response)

**Analog:** `src/pages/SellerApplication.tsx` existing (exact)

**Existing upload pattern** (lines 1–24, component structure):

```typescript
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

// Multi-step form: useState(step) pattern already in place
const [step, setStep] = useState(1);
```

**New doc upload section to add** — use existing `uploadImage` import, change upload target to signed URL:

```typescript
// Instead of direct Storage upload, call:
// POST /api/kyc/upload-url { sellerId, docType } → { uploadUrl, filePath }
// Then PUT uploadUrl with file binary
// Store { docType, storagePath: filePath, uploadedAt, fileName } in kycDocuments[]
```

**Identity redirect button** — add after all 3 docs uploaded:

```typescript
// POST /api/kyc/identity-verify { applicationId } → { verificationUrl }
// window.location.href = verificationUrl  (Stripe-hosted flow)
```

**3-doc gate UI** — disable submit until all 3 `docType` values present:

```typescript
const uploadedTypes = new Set(kycDocuments.map((d) => d.docType));
const allDocsUploaded =
  uploadedTypes.has('identity') &&
  uploadedTypes.has('tax_certificate') &&
  uploadedTypes.has('bank_iban');
```

---

### `src/pages/AdminSellerView.tsx` — ADD signed URL display + provisioning trigger (component, request-response)

**Analog:** `src/pages/AdminSellerView.tsx` existing (exact)

**Existing data-fetch pattern** (lines 27–47):

```typescript
useEffect(() => {
  if (!sellerId) return;
  Promise.all([getDoc(...), getProducts(...), ...])
    .then(([snap, prods, ...]) => { setSeller(...); setLoading(false); })
    .catch(() => setLoading(false));
}, [sellerId]);
```

**Signed URL fetch to add** — call on doc click (not on page load, short-lived):

```typescript
// GET /api/kyc/signed-url/:docId (with Authorization: Bearer <adminToken>)
// → { url } — open in new tab, do not persist
async function viewKycDoc(storagePath: string) {
  const docId = encodeURIComponent(storagePath);
  const res = await fetch(`/api/kyc/signed-url/${docId}`, {
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
  });
  const { url } = await res.json();
  window.open(url, '_blank');
}
```

**Payment provisioning trigger** — extend existing approve handler:

```typescript
// After reviewApplication() approve call:
// if (application.origin === 'TR') POST /api/admin/seller/:id/approve-tr
// if (application.origin !== 'TR') POST /api/admin/seller/:id/approve-eu → returns onboardingUrl
// Show onboardingUrl to admin to send to seller
```

---

### `src/pages/SellerInventory.tsx` — ADD min-1-photo + required category validation (component, CRUD)

**Analog:** `src/pages/SellerApplication.tsx` (multi-step form with validation gates)

**Client-side validation pattern** to add before product save:

```typescript
// Validate before submit — copy the step-gate pattern from SellerApplication.tsx
if (!formData.images || formData.images.length < 1) {
  setError('En az 1 ürün fotoğrafı zorunludur.');
  return;
}
if (!formData.categoryId) {
  setError('Kategori seçimi zorunludur.');
  return;
}
```

---

### `storage.rules` — NEW (config)

**Analog:** `firestore.rules` (partial — same Firebase rules DSL)

**Full file content** (from RESEARCH.md Pattern 5):

```
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

---

## Shared Patterns

### Authentication — `verifyAdmin` and `verifyFirebaseToken`

**Source:** `src/lib/authMiddleware.ts` lines 47–62
**Apply to:** All new KYC server routes

```typescript
// verifyAdmin: decoded.role === 'admin' from Firebase custom claims
// verifyFirebaseToken: any authenticated Firebase user
// Pattern: app.post('/route', verifyAdmin, validate(schema), async (req, res) => { ... })
```

### Zod Validation Middleware

**Source:** `server/lib/validate.ts` lines 15–31
**Apply to:** All new server route handlers

```typescript
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: [...] });
    }
    (req as any)[target] = result.data;
    next();
  };
}
```

### Firestore Service Error Handling

**Source:** `src/services/sellerApplicationService.ts` lines 48–51
**Apply to:** All new `src/services/` functions

```typescript
} catch (error) {
  handleFirestoreError(error, OperationType.WRITE, COL);
  throw error;  // re-throw after logging
}
// Reads: return [] or null on error (graceful degradation)
// Writes: always re-throw
```

### Express Route Error Handling

**Source:** `server/routes/iyzico.ts` lines 38–45
**Apply to:** All new server route handlers

```typescript
try {
  if (!adminDb) return res.status(503).json({ error: 'Database not configured' });
  // logic
} catch (err: any) {
  return res.status(500).json({ error: err.message });
}
```

### Logger Pattern

**Source:** `server/routes/stripe.ts` lines 9, 56–57
**Apply to:** All new server routes

```typescript
import { logger } from '../logger.js';
logger.info('kycService', 'Event description', { contextKey: value });
logger.error('kycService', 'Error description', { error: err.message });
```

### Dependency Injection (Route Deps Interface)

**Source:** `server/routes/stripe.ts` lines 26–32; `server/routes/iyzico.ts` lines 20–28
**Apply to:** Any new `registerXxxRoutes()` function

```typescript
export interface KycRouteDeps {
  stripe: Stripe;
  adminDb: Firestore | null;
  verifyFirebaseToken: Middleware;
  verifyAdmin: Middleware;
}
export function registerKycRoutes(app: Express, deps: KycRouteDeps) { ... }
```

### React Component Pattern (Pages)

**Source:** `src/pages/AdminSellerView.tsx` lines 1–47
**Apply to:** Any new/modified page component

```typescript
// Named export, functional component, local interface Props
// useState for all local state
// useEffect + Promise.all for parallel data fetching
// Loading state guard: if (loading) return <LoadingSpinner />
// Error state with setLoading(false) in catch
```

---

## No Analog Found

| File            | Role   | Data Flow | Reason                                                                                                                            |
| --------------- | ------ | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `storage.rules` | config | —         | No existing storage.rules in repo (confirmed by RESEARCH.md gap table A5); only `firestore.rules` DSL can be partially referenced |

---

## Metadata

**Analog search scope:** `server/routes/`, `server/services/`, `server/lib/`, `src/services/`, `src/pages/`, `src/lib/`
**Files scanned:** 10 source files read directly
**Pattern extraction date:** 2026-06-03
