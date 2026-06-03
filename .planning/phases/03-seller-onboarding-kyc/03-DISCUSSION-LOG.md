# Phase 3: Seller Onboarding & KYC - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-03
**Phase:** 3-Seller Onboarding & KYC
**Areas discussed:** Payment account on approval, KYC verification & doc security, CSV import behavior

---

## Payment account on approval

### Which payment account gets provisioned on KYC approval?

| Option                               | Description                                             | Selected |
| ------------------------------------ | ------------------------------------------------------- | -------- |
| Iyzico sub-merchant only             | Consistent with Phase 2 (Iyzico-first); Stripe deferred |          |
| Region-based (Iyzico TR / Stripe EU) | TR → Iyzico sub-merchant; EU → Stripe Connect           | ✓        |
| Iyzico now + Connect stub            | Iyzico now; Stripe Connect interface stub only          |          |

**User's choice:** Region-based (Iyzico TR / Stripe EU)
**Notes:** Honors roadmap criterion #1 literally; pulls Stripe Connect onboarding into this phase.

### EU Stripe Connect flow alongside own KYC form

| Option                             | Description                                                | Selected |
| ---------------------------------- | ---------------------------------------------------------- | -------- |
| Stripe-hosted onboarding (Express) | Stripe owns EU KYC/AML; hosted UI; payouts_enabled webhook | ✓        |
| Your KYC form + Custom account     | Fully white-label, but AML liability on us                 |          |

**User's choice:** Stripe-hosted onboarding (Express)

### TR Iyzico sub-merchant creation timing

| Option                       | Description                                     | Selected |
| ---------------------------- | ----------------------------------------------- | -------- |
| On admin approval            | Sub-merchant created only after admin approves  | ✓        |
| On submit, gated by approval | Created at submit, selling gated until approval |          |

**User's choice:** On admin approval

---

## KYC verification & doc security

### KYC document storage

| Option                       | Description                                                   | Selected |
| ---------------------------- | ------------------------------------------------------------- | -------- |
| Private bucket + signed URLs | Admin-only read, short-lived signed URLs, GDPR/KVKK deletable | ✓        |
| Keep current public URLs     | Less work, but PII publicly fetchable                         |          |

**User's choice:** Private bucket + signed URLs

### Verification depth

| Option                       | Description                                     | Selected |
| ---------------------------- | ----------------------------------------------- | -------- |
| Manual admin review only     | Visual check + approve/reject reason            |          |
| Add automated identity check | Automated ID verification before admin confirms | ✓        |

**User's choice:** Add automated identity check

### Required documents

| Option                           | Description                                      | Selected |
| -------------------------------- | ------------------------------------------------ | -------- |
| ID + tax certificate + bank/IBAN | Matches roadmap criterion #1; all three required | ✓        |
| ID + bank only (tax optional)    | More lenient; diverges from roadmap              |          |

**User's choice:** ID + tax certificate + bank/IBAN

### Automated ID verification vendor

| Option                        | Description                                         | Selected |
| ----------------------------- | --------------------------------------------------- | -------- |
| Stripe Identity (all sellers) | Already adding Stripe; global incl. TR; doc+selfie  | ✓        |
| Pick during research          | Researcher compares Stripe Identity vs TR-local KYC |          |

**User's choice:** Stripe Identity (all sellers)

---

## CSV import behavior

### Behavior on invalid rows

| Option                        | Description                                                | Selected |
| ----------------------------- | ---------------------------------------------------------- | -------- |
| Partial import + error report | Import valid rows, skip invalid, downloadable error report | ✓        |
| All-or-nothing (atomic)       | Reject whole file if any row fails                         |          |

**User's choice:** Partial import + error report

### Image handling

| Option                         | Description                                               | Selected |
| ------------------------------ | --------------------------------------------------------- | -------- |
| Image URLs in CSV              | image_url column (pipe-separated); fetch → Storage; min 1 | ✓        |
| URLs now, upload pairing later | URLs now; defer SKU↔image ZIP pairing                     |          |

**User's choice:** Image URLs in CSV (ZIP pairing deferred)

### Category handling

| Option                               | Description                                         | Selected |
| ------------------------------------ | --------------------------------------------------- | -------- |
| Validate against existing categories | Unknown category fails the row; protects commission | ✓        |
| Validate + suggest closest           | Same, plus closest-match suggestion in error report |          |

**User's choice:** Validate against existing categories

---

## Claude's Discretion

- Seller REST API hardening specifics: crypto-strength key hash (SHA-256/HMAC, constant-time compare), persistent rate-limit store, UTF-8 encoding fix
- Store page slug/shareable URL structure; product validation enforced client + server
- Stripe Identity verification_session UX + webhook handling
- CSV error report format, file size limit, export column set
- Signed URL TTL (~5 min suggested)
- Whether to add closest-category suggestion

## Deferred Ideas

- SKU↔image ZIP bulk upload pairing
- Closest-category suggestion engine
- TR-local KYC/MASAK vendor (Stripe Identity chosen)
- Stripe Custom Connect account / white-label
- Custom domain store URLs (shareable slug only this phase)
- Product variant support depth
