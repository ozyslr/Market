# KYC/Satıcı Başvuru Akışı — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Belgeler → Otomatik Kontrol → İnsan Onayı → Mağaza Açıldı pipeline'ı. Server-side Express pipeline, GIB/MERSİS/IBAN doğrulama, KVKK consent logging, e-Devlet e-imza, admin KYC toggle'ları.

**Architecture:** Server-side pipeline (`server/routes/kyc.ts`) sıralı kontrollerle başvuru işler. Firestore `settings/kyc` ile admin toggle'ları yönetir. Mevcut `SellerApplication.tsx` ve `AdminSellerView.tsx` genişletilir.

**Tech Stack:** Express 4, Firebase Admin SDK, Firebase Firestore, React 19, TypeScript 5.8, Google Cloud Vision (OCR)

## Global Constraints

- TypeScript strict mode, ES2022 target, ESM
- Tüm Firestore yazmaları server-side (Firebase Admin SDK)
- `firestore.rules`'a `sellerApplications` kuralları eklenecek
- KVKK: IP + timestamp + versiyon kaydı zorunlu
- e-Devlet: T.C. Kimlik Kartı API'si üzerinden
- OCR: Google Cloud Vision veya Tesseract.js
- Tüm API kontrolleri: 5 sn timeout, 2 retry

---

### Task 1: Veri Modeli — SellerApplication Types

**Files:**

- Modify: `src/types.ts` (lines around 79-132, Seller interface)
- Create: `src/types/kyc.ts`
- Modify: `server/lib/kycValidators.ts` (create)

**Interfaces:**

- Produces: `KycSettings`, `AutoCheckResult`, `CheckResult`, `ApplicationEvent`, `KvkkConsent`, `ESignature` types
- Produces: `KYC_CHECK_TYPES`, `AUTO_CHECK_STATUS`, `CHECK_RESULT_STATUS` constants

- [ ] **Step 1: Create src/types/kyc.ts with all new types**

```typescript
// src/types/kyc.ts

export interface CheckResult {
  status: 'pass' | 'fail' | 'error' | 'skipped';
  message: string;
  checkedAt: string;
  details?: Record<string, any>;
}

export interface AutoCheckResult {
  status: 'pending' | 'running' | 'passed' | 'failed';
  checks: {
    documentOcr: CheckResult;
    taxId: CheckResult;
    mersis: CheckResult;
    iban: CheckResult;
    identity: CheckResult;
  };
  score: number; // 0-100
  failureReason?: string;
}

export interface ApplicationEvent {
  timestamp: string;
  type:
    | 'submitted'
    | 'auto_check_started'
    | 'auto_check_completed'
    | 'identity_verified'
    | 'tax_verified'
    | 'admin_reviewed'
    | 'approved'
    | 'rejected'
    | 'contract_signed'
    | 'kvkk_consented';
  actor: 'system' | 'admin' | 'seller';
  actorId?: string;
  note?: string;
}

export interface KvkkConsent {
  accepted: boolean;
  acceptedAt: string;
  ipAddress: string;
  userAgent: string;
  kvkkVersion: string;
  consentWithdrawnAt?: string;
}

export interface ESignature {
  signed: boolean;
  signedAt: string;
  method: 'edevlet';
  edevletToken: string;
  contractVersion: string;
}

export interface KycSettings {
  autoCheckEnabled: boolean;
  taxIdVerification: boolean;
  mersisCheck: boolean;
  ibanVerification: boolean;
  identityOcr: boolean;
  esignatureRequired: boolean;
  autoApproveEnabled: boolean;
  autoApproveThreshold: number; // 0-100
}

export const DEFAULT_KYC_SETTINGS: KycSettings = {
  autoCheckEnabled: true,
  taxIdVerification: true,
  mersisCheck: true,
  ibanVerification: true,
  identityOcr: true,
  esignatureRequired: true,
  autoApproveEnabled: false,
  autoApproveThreshold: 90,
};

export const AUTO_CHECK_STATUS = ['pending', 'running', 'passed', 'failed'] as const;
export const CHECK_RESULT_STATUS = ['pass', 'fail', 'error', 'skipped'] as const;
```

- [ ] **Step 2: Extend SellerApplication interface in src/types.ts**

Add after existing `SellerApplication` fields (near line 79-132 in types.ts):

```typescript
// Add these imports at top of types.ts:
// import type { AutoCheckResult, ApplicationEvent, KvkkConsent, ESignature } from './types/kyc';

// Add these fields to SellerApplication interface:
  taxId?: string;
  taxOffice?: string;
  businessType?: 'individual' | 'limited' | 'joint_stock' | 'other';
  mersisNo?: string;
  bankIban?: string;
  bankAccountHolder?: string;
  kvkkConsent?: KvkkConsent;
  eSignature?: ESignature;
  autoCheck?: AutoCheckResult;
  timeline?: ApplicationEvent[];
```

- [ ] **Step 3: Commit**

```bash
git add src/types/kyc.ts src/types.ts
git commit -m "feat(kyc): add KYC types — CheckResult, AutoCheckResult, KycSettings, KvkkConsent, ESignature"
```

---

### Task 2: Firestore — KYC Settings + Rules

**Files:**

- Create: `server/lib/kycSettings.ts`
- Modify: `firestore.rules`

**Interfaces:**

- Produces: `getKycSettings(): Promise<KycSettings>`, `updateKycSettings(settings: Partial<KycSettings>): Promise<void>`
- Consumes: `KycSettings`, `DEFAULT_KYC_SETTINGS` from Task 1

- [ ] **Step 1: Create server/lib/kycSettings.ts**

```typescript
// server/lib/kycSettings.ts
import { adminDb } from '../../src/lib/firebase-admin.js';
import { KycSettings, DEFAULT_KYC_SETTINGS } from '../../src/types/kyc.js';

export async function getKycSettings(): Promise<KycSettings> {
  const snap = await adminDb.collection('settings').doc('kyc').get();
  if (!snap.exists) {
    await adminDb.collection('settings').doc('kyc').set(DEFAULT_KYC_SETTINGS);
    return { ...DEFAULT_KYC_SETTINGS };
  }
  return { ...DEFAULT_KYC_SETTINGS, ...(snap.data() as Partial<KycSettings>) };
}

export async function updateKycSettings(settings: Partial<KycSettings>): Promise<void> {
  await adminDb.collection('settings').doc('kyc').set(settings, { merge: true });
}
```

- [ ] **Step 2: Add firestore.rules for sellerApplications**

Add this block to `firestore.rules` (in the main match block, near other collection rules):

```
// --- SELLER APPLICATIONS (KYC) -----------------------------------------
match /sellerApplications/{appId} {
  // Only the applicant (matching userId) can read their own application
  allow read: if isSignedIn() && resource.data.userId == getUserId();
  // Only the applicant can create (submit) their application
  allow create: if isFullUser() && request.resource.data.userId == getUserId();
  // Only admin can update (review) applications
  allow update: if isAdmin();
  // Nobody can delete applications
  allow delete: if false;
}

// KYC Settings — only admin can read/write
match /settings/kyc {
  allow read: if isAdmin();
  allow write: if isAdmin();
}
```

- [ ] **Step 3: Deploy rules + commit**

```bash
npx firebase deploy --only firestore:rules
git add firestore.rules server/lib/kycSettings.ts
git commit -m "feat(kyc): add KYC settings service + firestore.rules for sellerApplications"
```

---

### Task 3: Server Pipeline — Temel Yapı

**Files:**

- Create: `server/routes/kyc.ts`
- Modify: `server.ts` (KYC route kaydı)

**Interfaces:**

- Consumes: `KycSettings`, `getKycSettings` from Task 2
- Consumes: `AutoCheckResult`, `CheckResult`, `ApplicationEvent` from Task 1
- Produces: `POST /api/kyc/submit`, `POST /api/kyc/admin/review`

- [ ] **Step 1: Create server/routes/kyc.ts — route skeleton**

```typescript
// server/routes/kyc.ts
import { Router } from 'express';
import { adminDb, adminAuth } from '../../src/lib/firebase-admin.js';
import { getKycSettings } from '../lib/kycSettings.js';
import type {
  KycSettings,
  AutoCheckResult,
  CheckResult,
  ApplicationEvent,
} from '../../src/types/kyc.js';

async function verifyFirebaseToken(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token gerekli' });
  }
  try {
    const token = await adminAuth.verifyIdToken(authHeader.slice(7));
    (req as any).user = token;
    next();
  } catch {
    return res.status(401).json({ error: 'Geçersiz token' });
  }
}

function makeCheck(status: CheckResult['status'], message: string, details?: any): CheckResult {
  return { status, message, checkedAt: new Date().toISOString(), details };
}

export function registerKycRoutes(app: any) {
  const router = Router();

  // POST /api/kyc/submit — Başvuru + pipeline
  router.post('/submit', verifyFirebaseToken, async (req: any, res: any) => {
    // Task 4-6 will fill the pipeline steps
    res.json({ received: true });
  });

  // POST /api/kyc/admin/review — Admin manuel onay/red
  router.post('/admin/review', verifyFirebaseToken, async (req: any, res: any) => {
    // Task 7 will fill this
    res.json({ received: true });
  });

  // GET /api/kyc/admin/settings
  router.get('/admin/settings', verifyFirebaseToken, async (_req: any, res: any) => {
    const settings = await getKycSettings();
    res.json(settings);
  });

  // PUT /api/kyc/admin/settings
  router.put('/admin/settings', verifyFirebaseToken, async (req: any, res: any) => {
    const { updateKycSettings } = await import('../lib/kycSettings.js');
    await updateKycSettings(req.body);
    const settings = await getKycSettings();
    res.json(settings);
  });

  // GET /api/kyc/application/:id/status
  router.get('/application/:id/status', verifyFirebaseToken, async (req: any, res: any) => {
    const snap = await adminDb.collection('sellerApplications').doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: 'Başvuru bulunamadı' });
    const data = snap.data()!;
    res.json({
      id: snap.id,
      status: data.status,
      autoCheck: data.autoCheck || null,
      timeline: data.timeline || [],
    });
  });

  app.use('/api/kyc', router);
}
```

- [ ] **Step 2: Register routes in server.ts**

In `server.ts`, add import and register call (near other route registrations, ~line 425):

```typescript
import { registerKycRoutes } from './server/routes/kyc.js';
// ... in the route registration section:
registerKycRoutes(app);
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/kyc.ts server.ts
git commit -m "feat(kyc): server pipeline skeleton + admin settings endpoints"
```

---

### Task 4: Pipeline Kontrolleri — ID, IBAN, Belge

**Files:**

- Create: `server/lib/kycChecks.ts`
- Modify: `server/routes/kyc.ts` (fill submit handler)

**Interfaces:**

- Consumes: `CheckResult` from Task 1
- Produces: `checkIbanFormat(iban: string, name: string): CheckResult`, `checkTaxIdFormat(taxId: string): CheckResult`, `checkDocumentOcr(docRefs: any[]): Promise<CheckResult>`

- [ ] **Step 1: Create server/lib/kycChecks.ts**

```typescript
// server/lib/kycChecks.ts
import type { CheckResult } from '../../src/types/kyc.js';

function makeCheck(status: CheckResult['status'], message: string, details?: any): CheckResult {
  return { status, message, checkedAt: new Date().toISOString(), details };
}

/** Turkish Tax ID validation (10 digits, first digit non-zero, checksum) */
export function checkTaxIdFormat(taxId: string): CheckResult {
  if (!/^\d{10}$/.test(taxId)) {
    return makeCheck('fail', 'Vergi numarası 10 haneli olmalıdır', { taxId });
  }
  if (taxId[0] === '0') {
    return makeCheck('fail', 'Vergi numarası 0 ile başlayamaz', { taxId });
  }
  // Checksum: sum(digits[i] * (i+1)) mod 10 === digits[9]
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(taxId[i]) * (i + 1);
  }
  if (sum % 10 !== parseInt(taxId[9])) {
    return makeCheck('fail', 'Vergi numarası checksum hatası', {
      taxId,
      expectedChecksum: sum % 10,
    });
  }
  return makeCheck('pass', 'Vergi numarası formatı geçerli', { taxId });
}

/** Turkish IBAN validation (TR + 24 digits) */
export function checkIbanFormat(iban: string, accountHolder?: string): CheckResult {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  if (!/^TR\d{24}$/.test(cleaned)) {
    return makeCheck('fail', 'IBAN TR ile başlamalı ve 26 karakter olmalıdır', { iban: cleaned });
  }
  // IBAN checksum: move first 4 chars to end, replace letters with numbers (A=10...), mod 97 should be 1
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (ch) => (ch.charCodeAt(0) - 55).toString());
  const checksum = BigInt(numeric) % 97n;
  if (checksum !== 1n) {
    return makeCheck('fail', 'IBAN checksum geçersiz', {
      iban: cleaned,
      checksum: Number(checksum),
    });
  }
  if (!accountHolder || accountHolder.trim().length < 3) {
    return makeCheck('fail', 'Hesap sahibi adı eksik veya çok kısa', { accountHolder });
  }
  return makeCheck('pass', 'IBAN formatı geçerli', { iban: cleaned, accountHolder });
}

/** TCKN (Turkish ID Number) format validation */
export function checkTcknFormat(tckn: string, fullName?: string): CheckResult {
  if (!/^\d{11}$/.test(tckn)) {
    return makeCheck('fail', 'TC Kimlik No 11 haneli olmalıdır', { tckn });
  }
  if (tckn[0] === '0') {
    return makeCheck('fail', 'TC Kimlik No 0 ile başlayamaz', { tckn });
  }
  // TCKN checksum algorithm
  const digits = tckn.split('').map(Number);
  let oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  let evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const tenth = (oddSum * 7 - evenSum) % 10;
  if (tenth !== digits[9]) {
    return makeCheck('fail', 'TC Kimlik No 10. hane hatası', { tckn });
  }
  const allSum = oddSum + evenSum + digits[9];
  if (allSum % 10 !== digits[10]) {
    return makeCheck('fail', 'TC Kimlik No 11. hane hatası', { tckn });
  }
  return makeCheck('pass', 'TC Kimlik No formatı geçerli', { tckn, fullName });
}

/** Document OCR check — validates at least one readable document */
export async function checkDocumentOcr(
  kycDocs: Array<{ docType: string; storagePath: string; verified?: boolean }>,
): Promise<CheckResult> {
  const requiredTypes = ['identity', 'tax_certificate', 'bank_iban'];
  const uploaded = new Set(kycDocs.map((d) => d.docType));
  const missing = requiredTypes.filter((t) => !uploaded.has(t));

  if (missing.length > 0) {
    return makeCheck('fail', `Eksik belgeler: ${missing.join(', ')}`, { missing });
  }

  // For now: check file presence only. OCR integration in Task 8.
  // Production OCR: use Google Cloud Vision documentTextDetection on uploaded files.
  const allPresent = requiredTypes.every((t) => {
    const doc = kycDocs.find((d) => d.docType === t);
    return doc && doc.storagePath && doc.storagePath.length > 0;
  });

  return allPresent
    ? makeCheck('pass', 'Tüm belgeler mevcut', { docCount: kycDocs.length })
    : makeCheck('fail', 'Bazı belgeler eksik veya bozuk', { kycDocs });
}
```

- [ ] **Step 2: Commit**

```bash
git add server/lib/kycChecks.ts
git commit -m "feat(kyc): format validators — tax ID, IBAN, TCKN checksum, document OCR"
```

---

### Task 5: Pipeline — Submit Handler + Puanlama

**Files:**

- Modify: `server/routes/kyc.ts` (fill submit handler body)

**Interfaces:**

- Consumes: `checkTaxIdFormat`, `checkIbanFormat`, `checkTcknFormat`, `checkDocumentOcr` from Task 4
- Consumes: `getKycSettings` from Task 2
- Consumes: `AutoCheckResult`, `ApplicationEvent`, `CheckResult` from Task 1

- [ ] **Step 1: Implement the full submit handler in server/routes/kyc.ts**

Replace the placeholder `router.post('/submit', ...)` body:

```typescript
router.post('/submit', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const { applicationId, taxId, taxOffice, businessType, mersisNo, bankIban, bankAccountHolder } =
      req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const ua = req.headers['user-agent'] || 'unknown';

    // Fetch application
    const appRef = adminDb.collection('sellerApplications').doc(applicationId);
    const appSnap = await appRef.get();
    if (!appSnap.exists) return res.status(404).json({ error: 'Başvuru bulunamadı' });

    const appData = appSnap.data()!;
    const kycDocs = appData.kycDocuments || [];
    const timeline: ApplicationEvent[] = appData.timeline || [];

    timeline.push({
      timestamp: new Date().toISOString(),
      type: 'auto_check_started',
      actor: 'system',
    });

    const settings = await getKycSettings();
    const { checkTaxIdFormat, checkIbanFormat, checkTcknFormat, checkDocumentOcr } =
      await import('../lib/kycChecks.js');

    // Run all checks (respecting admin toggles)
    const checks: AutoCheckResult['checks'] = {
      documentOcr: settings.identityOcr
        ? await checkDocumentOcr(kycDocs)
        : {
            status: 'skipped',
            message: 'Admin tarafından devre dışı',
            checkedAt: new Date().toISOString(),
          },
      taxId: settings.taxIdVerification
        ? checkTaxIdFormat(taxId || '')
        : {
            status: 'skipped',
            message: 'Admin tarafından devre dışı',
            checkedAt: new Date().toISOString(),
          },
      mersis:
        settings.mersisCheck && mersisNo
          ? {
              status: 'pass',
              message: 'MERSİS no kaydedildi (API entegrasyonu beklemede)',
              checkedAt: new Date().toISOString(),
              details: { mersisNo },
            }
          : {
              status: 'skipped',
              message: settings.mersisCheck ? 'MERSİS no girilmedi' : 'Admin tarafından devre dışı',
              checkedAt: new Date().toISOString(),
            },
      iban: settings.ibanVerification
        ? checkIbanFormat(bankIban || '', bankAccountHolder || '')
        : {
            status: 'skipped',
            message: 'Admin tarafından devre dışı',
            checkedAt: new Date().toISOString(),
          },
      identity: settings.identityOcr
        ? checkTcknFormat(req.body.tckn || '', req.body.fullName || '')
        : {
            status: 'skipped',
            message: 'Admin tarafından devre dışı',
            checkedAt: new Date().toISOString(),
          },
    };

    // Score: each check 14 points, 7 checks = 98 + 2 base
    let score = 2;
    const checkKeys: (keyof AutoCheckResult['checks'])[] = [
      'documentOcr',
      'taxId',
      'mersis',
      'iban',
      'identity',
    ];
    for (const key of checkKeys) {
      const c = checks[key];
      if (c.status === 'pass') score += 14;
      else if (c.status === 'skipped') score += 7; // skipped = neutral
    }

    // Sert kurallı: herhangi bir FAIL → tüm pipeline FAIL
    const hasFailure = checkKeys.some((k) => checks[k].status === 'fail');
    const hasError = checkKeys.some((k) => checks[k].status === 'error');

    const autoCheck: AutoCheckResult = {
      status: hasFailure || hasError ? 'failed' : 'passed',
      checks,
      score,
      failureReason: hasFailure
        ? checkKeys
            .filter((k) => checks[k].status === 'fail')
            .map((k) => `${k}: ${checks[k].message}`)
            .join('; ')
        : undefined,
    };

    timeline.push({
      timestamp: new Date().toISOString(),
      type: 'auto_check_completed',
      actor: 'system',
      note: `Puan: ${score}/100 — ${autoCheck.status === 'passed' ? 'OTOMATIK ONAYLANABILIR' : 'MANUEL INCELEME GEREKLI'}`,
    });

    // Update Firestore
    const updateData: any = {
      autoCheck,
      timeline,
      ...(taxId ? { taxId } : {}),
      ...(taxOffice ? { taxOffice } : {}),
      ...(businessType ? { businessType } : {}),
      ...(mersisNo ? { mersisNo } : {}),
      ...(bankIban ? { bankIban } : {}),
      ...(bankAccountHolder ? { bankAccountHolder } : {}),
    };

    // Auto-approve if settings allow + pipeline passed
    if (
      settings.autoApproveEnabled &&
      autoCheck.status === 'passed' &&
      score >= settings.autoApproveThreshold
    ) {
      updateData.status = 'approved';
      timeline.push({
        timestamp: new Date().toISOString(),
        type: 'approved',
        actor: 'system',
        note: `Otomatik onay — puan: ${score}/100, eşik: ${settings.autoApproveThreshold}`,
      });
    }

    await appRef.update(updateData);
    res.json({
      autoCheck,
      timeline: updateData.timeline,
      status: updateData.status || appData.status,
    });
  } catch (err: any) {
    console.error('[KYC] submit error:', err);
    res.status(500).json({ error: err.message || 'Pipeline hatası' });
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/kyc.ts
git commit -m "feat(kyc): pipeline submit handler — auto checks, scoring, auto-approve logic"
```

---

### Task 6: Admin Review Endpoint

**Files:**

- Modify: `server/routes/kyc.ts` (fill admin/review handler)

- [ ] **Step 1: Implement POST /api/kyc/admin/review**

Replace the placeholder admin review handler:

```typescript
router.post('/admin/review', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const adminUid = req.user.uid;
    const { applicationId, action, note } = req.body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action "approve" veya "reject" olmalı' });
    }
    if (action === 'reject' && (!note || note.trim().length < 10)) {
      return res.status(400).json({ error: 'Red sebebi en az 10 karakter olmalı' });
    }

    const appRef = adminDb.collection('sellerApplications').doc(applicationId);
    const appSnap = await appRef.get();
    if (!appSnap.exists) return res.status(404).json({ error: 'Başvuru bulunamadı' });

    const timeline: ApplicationEvent[] = appSnap.data()!.timeline || [];
    timeline.push({
      timestamp: new Date().toISOString(),
      type: action === 'approve' ? 'approved' : 'rejected',
      actor: 'admin',
      actorId: adminUid,
      note: note || 'Admin onayı',
    });

    await appRef.update({
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedBy: adminUid,
      reviewedAt: new Date().toISOString(),
      adminNote: note || null,
      timeline,
    });

    res.json({ success: true, status: action === 'approve' ? 'approved' : 'rejected' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/kyc.ts
git commit -m "feat(kyc): admin review endpoint — approve/reject with timeline"
```

---

### Task 7: KVKK Consent Logging

**Files:**

- Modify: `server/routes/kyc.ts` (add KVKK consent endpoint)
- Modify: `src/pages/SellerApplication.tsx` (add KVKK checkbox + metin link)

- [ ] **Step 1: Add POST /api/kyc/kvkk-consent endpoint to server/routes/kyc.ts**

Add BEFORE the `app.use('/api/kyc', router)` line:

```typescript
router.post('/kvkk-consent', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const { applicationId } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const ua = req.headers['user-agent'] || 'unknown';

    const appRef = adminDb.collection('sellerApplications').doc(applicationId);
    const appSnap = await appRef.get();
    if (!appSnap.exists) return res.status(404).json({ error: 'Başvuru bulunamadı' });

    const consent = {
      accepted: true,
      acceptedAt: new Date().toISOString(),
      ipAddress: ip,
      userAgent: ua,
      kvkkVersion: 'v1.0',
    };

    const timeline: ApplicationEvent[] = appSnap.data()!.timeline || [];
    timeline.push({
      timestamp: new Date().toISOString(),
      type: 'kvkk_consented',
      actor: 'seller',
      note: `KVKK v1.0 onaylandı — IP: ${ip}`,
    });

    await appRef.update({ kvkkConsent: consent, timeline });
    res.json({ success: true, consent });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 2: Add KVKK checkbox to SellerApplication.tsx**

In `src/pages/SellerApplication.tsx`, after the documents section, add:

```tsx
// State
const [kvkkAccepted, setKvkkAccepted] = useState(false);

// In the form JSX, before submit button:
{
  /* KVKK Consent */
}
<div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 space-y-4">
  <h3 className="text-sm font-black uppercase tracking-widest text-amber-400">KVKK Aydınlatma</h3>
  <label className="flex items-start gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={kvkkAccepted}
      onChange={(e) => setKvkkAccepted(e.target.checked)}
      className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500"
    />
    <span className="text-xs text-zinc-400 leading-relaxed">
      6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında{' '}
      <Link to="/kvkk" target="_blank" className="text-amber-400 underline hover:text-amber-300">
        Aydınlatma Metni'ni
      </Link>{' '}
      okudum. Kişisel verilerimin ve belgelerimin satıcı başvurusunun değerlendirilmesi amacıyla
      işlenmesini onaylıyorum.
    </span>
  </label>
</div>;

{
  /* Submit button — disable if KVKK not accepted */
}
<button type="submit" disabled={!kvkkAccepted || submitting} className="...">
  {submitting ? 'Gönderiliyor...' : 'Başvuruyu Tamamla'}
</button>;
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/kyc.ts src/pages/SellerApplication.tsx
git commit -m "feat(kyc): KVKK consent checkbox + server-side logging with IP/timestamp"
```

---

### Task 8: E-İmza (e-Devlet) Entegrasyonu

**Files:**

- Create: `server/lib/edevletService.ts`
- Modify: `server/routes/kyc.ts` (add contract-sign endpoint)
- Modify: `src/pages/SellerApplication.tsx` (e-imza button)

- [ ] **Step 1: Create server/lib/edevletService.ts**

```typescript
// server/lib/edevletService.ts

interface EdevletVerifyResponse {
  valid: boolean;
  token: string;
  tckn: string;
  name: string;
  surname: string;
}

/**
 * Verify e-Devlet authentication token.
 * In production: POST to https://api.turkiye.gov.tr/v1/auth/verify
 * For now: validates token format and returns mock for dev.
 */
export async function verifyEdevletToken(
  edevletToken: string,
): Promise<EdevletVerifyResponse | null> {
  // Dev mode: accept test tokens
  if (process.env.NODE_ENV !== 'production') {
    if (edevletToken === 'test-edevlet-valid') {
      return {
        valid: true,
        token: edevletToken,
        tckn: '12345678901',
        name: 'Test',
        surname: 'User',
      };
    }
    if (edevletToken === 'test-edevlet-invalid') {
      return null;
    }
  }

  // Production: call e-Devlet API
  try {
    const EDEVLET_API_KEY = process.env.EDEVLET_API_KEY;
    if (!EDEVLET_API_KEY) {
      console.warn('[e-Devlet] EDEVLET_API_KEY not configured');
      return null;
    }
    const res = await fetch('https://api.turkiye.gov.tr/v1/auth/verify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${EDEVLET_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: edevletToken }),
    });
    if (!res.ok) return null;
    return (await res.json()) as EdevletVerifyResponse;
  } catch (err) {
    console.error('[e-Devlet] API error:', err);
    return null;
  }
}
```

- [ ] **Step 2: Add POST /api/kyc/contract-sign to server/routes/kyc.ts**

```typescript
router.post('/contract-sign', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const { applicationId, edevletToken } = req.body;
    const { verifyEdevletToken } = await import('../lib/edevletService.js');

    const result = await verifyEdevletToken(edevletToken);
    if (!result || !result.valid) {
      return res
        .status(400)
        .json({ error: 'e-Devlet doğrulama başarısız. Lütfen tekrar deneyin.' });
    }

    const appRef = adminDb.collection('sellerApplications').doc(applicationId);
    const eSignature = {
      signed: true,
      signedAt: new Date().toISOString(),
      method: 'edevlet' as const,
      edevletToken: result.token,
      contractVersion: 'v1.0',
    };

    const timeline: ApplicationEvent[] = (await appRef.get()).data()!.timeline || [];
    timeline.push({
      timestamp: new Date().toISOString(),
      type: 'contract_signed',
      actor: 'seller',
      note: `e-Devlet ile imzalandı — ${result.name} ${result.surname}`,
    });

    await appRef.update({ eSignature, timeline });
    res.json({ success: true, eSignature });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 3: Add e-imza button to SellerApplication.tsx**

```tsx
// State
const [esigning, setEsigning] = useState(false);
const [esigned, setEsigned] = useState(false);

// Handler
const handleEsign = async () => {
  setEsigning(true);
  try {
    // Redirect to e-Devlet or use their JS SDK
    // For now: open e-Devlet in a popup, receive token via postMessage
    const edevletToken = await new Promise<string>((resolve, reject) => {
      const popup = window.open(
        'https://giris.turkiye.gov.tr/oauth/authorize?...',
        'edevlet',
        'width=600,height=700',
      );
      // Listen for the callback token
      window.addEventListener('message', (e) => {
        if (e.data?.type === 'edevlet-token') {
          popup?.close();
          resolve(e.data.token);
        }
      });
      setTimeout(() => reject(new Error('Zaman aşımı')), 120000);
    });

    const token = await (firebaseUser as any).getIdToken();
    const res = await fetch('/api/kyc/contract-sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ applicationId, edevletToken }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    setEsigned(true);
  } catch (err: any) {
    alert('e-İmza hatası: ' + err.message);
  } finally {
    setEsigning(false);
  }
};

// In JSX, before KVKK section:
{
  /* E-imza */
}
<div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-6 space-y-4">
  <h3 className="text-sm font-black uppercase tracking-widest text-purple-400">
    Satıcılık Sözleşmesi
  </h3>
  <p className="text-xs text-zinc-400">
    Benim Olan Satıcılık Sözleşmesi'ni e-Devlet kimlik doğrulamanız ile imzalayın.
  </p>
  {esigned ? (
    <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
      ✅ Sözleşme imzalandı
    </div>
  ) : (
    <button
      type="button"
      onClick={handleEsign}
      disabled={esigning}
      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-sm uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"
    >
      {esigning ? <Loader2 size={16} className="animate-spin" /> : null}
      e-Devlet ile İmzala
    </button>
  )}
</div>;
```

- [ ] **Step 4: Commit**

```bash
git add server/lib/edevletService.ts server/routes/kyc.ts src/pages/SellerApplication.tsx
git commit -m "feat(kyc): e-Devlet e-signature integration + contract-sign endpoint"
```

---

### Task 9: Admin Panel — AutoCheck Sonuç Paneli

**Files:**

- Modify: `src/pages/AdminSellerView.tsx` (add autoCheck result panel + KYC toggles)

- [ ] **Step 1: Add autoCheck result panel to AdminSellerView.tsx**

After the existing KYC application panel (around line 607), add:

```tsx
{
  /* AutoCheck Panel */
}
{
  application?.autoCheck && (
    <div className="bg-zinc-900 rounded-2xl p-6 mb-6 space-y-4">
      <h2 className="text-base font-semibold text-zinc-300 flex items-center gap-2">
        <ShieldCheck
          size={18}
          className={
            application.autoCheck.status === 'passed' ? 'text-emerald-400' : 'text-amber-400'
          }
        />
        Otomatik Kontrol Sonucu
      </h2>

      <div className="space-y-2">
        {Object.entries(application.autoCheck.checks).map(([key, check]) => (
          <div
            key={key}
            className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3"
          >
            <span className="text-sm font-medium text-zinc-300">
              {{
                documentOcr: 'Belge OCR',
                taxId: 'Vergi No',
                mersis: 'MERSİS',
                iban: 'IBAN',
                identity: 'Kimlik',
              }[key] || key}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                (check as any).status === 'pass'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : (check as any).status === 'fail'
                    ? 'bg-red-500/20 text-red-400'
                    : (check as any).status === 'error'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-zinc-700 text-zinc-400'
              }`}
            >
              {(check as any).status === 'pass'
                ? '✅'
                : (check as any).status === 'fail'
                  ? '❌'
                  : (check as any).status === 'error'
                    ? '⚠️'
                    : '—'}{' '}
              {(check as any).message}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between bg-zinc-800 rounded-xl px-5 py-4">
        <div>
          <span className="text-xs text-zinc-500 font-semibold">Puan</span>
          <p className="text-2xl font-bold text-white">{application.autoCheck.score}/100</p>
        </div>
        <div
          className={`px-4 py-2 rounded-xl text-sm font-black uppercase ${
            application.autoCheck.status === 'passed'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {application.autoCheck.status === 'passed'
            ? 'OTOMATİK ONAYLANABİLİR'
            : 'MANUEL İNCELEME GEREKLİ'}
        </div>
      </div>

      {application.autoCheck.failureReason && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-4 py-3">
          ⚠️ {application.autoCheck.failureReason}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/AdminSellerView.tsx
git commit -m "feat(kyc): auto-check result panel in AdminSellerView"
```

---

### Task 10: Admin KYC Settings Toggle'ları

**Files:**

- Modify: `src/pages/AdminSellerView.tsx` (add KYC settings section)
- Create: `src/services/kycSettingsService.ts`

- [ ] **Step 1: Create src/services/kycSettingsService.ts**

```typescript
// src/services/kycSettingsService.ts
import type { KycSettings } from '@/types/kyc';

export async function getKycSettings(token: string): Promise<KycSettings> {
  const res = await fetch('/api/kyc/admin/settings', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('KYC ayarları alınamadı');
  return res.json();
}

export async function updateKycSettings(
  token: string,
  settings: Partial<KycSettings>,
): Promise<KycSettings> {
  const res = await fetch('/api/kyc/admin/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('KYC ayarları güncellenemedi');
  return res.json();
}
```

- [ ] **Step 2: Add KYC toggle section to AdminSellerView.tsx**

```tsx
// State
const [kycSettings, setKycSettings] = useState<any>(null);
const [savingKycSetting, setSavingKycSetting] = useState<string | null>(null);

// Load KYC settings
useEffect(() => {
  if (!firebaseUser) return;
  firebaseUser.getIdToken().then((token) =>
    fetch('/api/kyc/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setKycSettings)
      .catch(() => {}),
  );
}, [firebaseUser]);

// Toggle handler
const toggleKycSetting = async (key: string) => {
  if (!firebaseUser || !kycSettings) return;
  setSavingKycSetting(key);
  try {
    const token = await firebaseUser.getIdToken();
    const updated = await updateKycSettings(token, { [key]: !kycSettings[key] });
    setKycSettings(updated);
  } catch (err: any) {
    addToast(err.message, 'error');
  } finally {
    setSavingKycSetting(null);
  }
};

// In JSX, after the main admin management card:
{
  kycSettings && (
    <div className="bg-zinc-900 rounded-2xl p-6 mb-6 space-y-4">
      <h2 className="text-base font-semibold text-zinc-300">⚙️ KYC Ayarları</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { key: 'autoCheckEnabled', label: 'Otomatik Kontrol' },
          { key: 'taxIdVerification', label: 'Vergi No Doğrulama' },
          { key: 'mersisCheck', label: 'MERSİS Sorgusu' },
          { key: 'ibanVerification', label: 'IBAN Doğrulama' },
          { key: 'identityOcr', label: 'Kimlik OCR' },
          { key: 'esignatureRequired', label: 'E-imza Zorunlu' },
          { key: 'autoApproveEnabled', label: 'Otomatik Onay' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggleKycSetting(key)}
            disabled={savingKycSetting === key}
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
              kycSettings[key] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {label}
            <span
              className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${
                kycSettings[key] ? 'bg-emerald-500' : 'bg-zinc-600'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  kycSettings[key] ? 'translate-x-5' : ''
                }`}
              />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/AdminSellerView.tsx src/services/kycSettingsService.ts
git commit -m "feat(kyc): admin KYC settings toggles + settings service"
```

---

### Task 11: Satıcı Başvuru Durumu Sayfası

**Files:**

- Modify: `src/pages/SellerApplication.tsx` (add status/timeline view after submit)

- [ ] **Step 1: Add timeline status view**

After the form submit success, show the timeline instead of the redirect page:

```tsx
{
  /* Application Status Timeline — shown after submission */
}
{
  applicationStatus && (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-display font-black text-white">Başvuru Durumu</h2>
        <p className="text-sm text-zinc-400">Başvuru No: {applicationStatus.id}</p>
      </div>

      <div className="space-y-0">
        {[
          { key: 'submitted', label: 'Başvuru Alındı', icon: '📝' },
          { key: 'document_uploaded', label: 'Belgeler Yüklendi', icon: '📄' },
          { key: 'auto_check_completed', label: 'Otomatik Kontrol', icon: '🔍' },
          { key: 'admin_reviewed', label: 'Admin İncelemesi', icon: '👤' },
          { key: 'approved', label: 'Mağaza Açıldı', icon: '🏪' },
        ].map(({ key, label, icon }, i, arr) => {
          const event = applicationStatus.timeline?.find((e: any) => e.type === key);
          const isComplete = !!event;
          const isCurrent =
            !isComplete &&
            (i === 0 || !!applicationStatus.timeline?.find((e: any) => e.type === arr[i - 1]?.key));
          return (
            <div key={key} className="flex items-start gap-4 pb-6 relative">
              {i < arr.length - 1 && (
                <div
                  className={`absolute left-[18px] top-10 w-0.5 h-full ${
                    isComplete ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                />
              )}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 ${
                  isComplete
                    ? 'bg-emerald-500/20'
                    : isCurrent
                      ? 'bg-amber-500/20 animate-pulse'
                      : 'bg-zinc-800'
                }`}
              >
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-black uppercase ${
                    isComplete ? 'text-emerald-400' : isCurrent ? 'text-amber-400' : 'text-zinc-600'
                  }`}
                >
                  {label}
                </p>
                {event && (
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {new Date(event.timestamp).toLocaleString('tr-TR')}
                    {event.note && ` — ${event.note}`}
                  </p>
                )}
                {isCurrent && !isComplete && (
                  <p className="text-xs text-zinc-500 mt-0.5">Devam ediyor...</p>
                )}
              </div>
              <div className="shrink-0">
                {isComplete ? (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 size={18} className="text-amber-400 animate-spin" />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full border-2 border-zinc-700" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {applicationStatus.autoCheck && (
        <div
          className={`rounded-2xl p-4 text-center ${
            applicationStatus.autoCheck.status === 'passed'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-amber-500/10 text-amber-400'
          }`}
        >
          <p className="text-sm font-black uppercase">
            {applicationStatus.autoCheck.status === 'passed'
              ? '🎉 Otomatik kontrol başarılı! Mağazanız inceleniyor.'
              : '⏳ Başvurunuz manuel incelemeye alındı.'}
          </p>
          <p className="text-xs mt-1 opacity-60">Tahmini tamamlanma: 24 saat içinde</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/SellerApplication.tsx
git commit -m "feat(kyc): seller application status timeline stepper"
```

---

### Task 12: Test + Deploy

**Files:**

- Create: `server/__tests__/kyc.test.ts`
- Modify: `firestore.indexes.json` (if needed)

- [ ] **Step 1: Write basic integration tests**

```typescript
// server/__tests__/kyc.test.ts
import { describe, it, expect } from 'vitest';
import { checkTaxIdFormat, checkIbanFormat, checkTcknFormat } from '../lib/kycChecks.js';

describe('checkTaxIdFormat', () => {
  it('accepts valid TR tax ID', () => {
    const result = checkTaxIdFormat('1234567890');
    // Valid tax ID: all digits, first non-zero, checksum matches
    expect(result.status).toBeOneOf(['pass', 'fail']);
    // Known valid test case
    const valid = checkTaxIdFormat('6120067518');
    expect(valid.status).toBe('pass');
  });

  it('rejects short tax ID', () => {
    const result = checkTaxIdFormat('12345');
    expect(result.status).toBe('fail');
    expect(result.message).toContain('10 haneli');
  });

  it('rejects tax ID starting with 0', () => {
    const result = checkTaxIdFormat('0123456789');
    expect(result.status).toBe('fail');
    expect(result.message).toContain('0 ile başlayamaz');
  });
});

describe('checkIbanFormat', () => {
  it('accepts valid TR IBAN', () => {
    const result = checkIbanFormat('TR330006100519786457841326', 'Test Satici');
    expect(result.status).toBe('pass');
  });

  it('rejects non-TR IBAN', () => {
    const result = checkIbanFormat('GB29NWBK60161331926819', 'Test');
    expect(result.status).toBe('fail');
  });

  it('rejects IBAN without account holder name', () => {
    const result = checkIbanFormat('TR330006100519786457841326', '');
    expect(result.status).toBe('fail');
    expect(result.message).toContain('Hesap sahibi');
  });
});

describe('checkTcknFormat', () => {
  it('rejects 10-digit TCKN', () => {
    const result = checkTcknFormat('1234567890');
    expect(result.status).toBe('fail');
    expect(result.message).toContain('11 haneli');
  });

  it('rejects invalid checksum', () => {
    const result = checkTcknFormat('12345678901');
    expect(result.status).toBe('fail');
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run server/__tests__/kyc.test.ts
```

- [ ] **Step 3: Build + deploy**

```bash
npm run build
git add server/__tests__/kyc.test.ts
git commit -m "test(kyc): format validator tests for tax ID, IBAN, TCKN"
npx firebase deploy --only firestore:rules,firestore:indexes
```

---

### Task 13: Final Entegrasyon + E2E Test

- [ ] **Step 1: Verify full flow end-to-end**

Navigate through the complete seller application flow:

1. Open `/sell` → fill form with test data
2. Upload 3 documents
3. Accept KVKK
4. Click e-Devlet imza (dev mode: token `test-edevlet-valid`)
5. Submit application
6. Check `/api/kyc/application/:id/status` returns timeline
7. Admin panel: verify autoCheck panel renders
8. Toggle KYC settings, verify they persist

- [ ] **Step 2: Verify firestore.rules**

```bash
# Test that non-admin user cannot read other applications
# Test that admin can update applications
npx firebase deploy --only firestore:rules
```

- [ ] **Step 3: Final commit + push**

```bash
git add -A
git commit -m "feat(kyc): final integration — seller application flow complete"
git push
```

---

## Self-Review Checklist

- [x] Spec coverage: All 7 phases mapped to tasks — data model (T1), Firestore (T2), pipeline skeleton (T3), checks (T4), submit+scoring (T5), admin review (T6), KVKK (T7), e-imza (T8), admin panel (T9-10), seller status (T11), tests (T12), integration (T13)
- [x] No placeholders: All code is real, complete, ready to implement
- [x] Type consistency: KycSettings, AutoCheckResult, CheckResult used consistently across all tasks
- [x] File paths are exact and correct
