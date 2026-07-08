# Architecture Research — v2.0 Trust & Scale

## New Components

### Services

| Service                   | File                                      | Purpose                   |
| ------------------------- | ----------------------------------------- | ------------------------- |
| TypesenseService          | src/services/typesenseService.ts          | Search index sync + query |
| FxRateService             | src/services/fxRateService.ts             | Daily FX rate cache       |
| InvoiceService            | src/services/invoiceService.ts            | PDF invoice generation    |
| FraudDetectionService     | src/services/fraudDetectionService.ts     | Rule-based fraud flags    |
| ComplaintService          | src/services/complaintService.ts          | Dispute management        |
| ProductApprovalService    | src/services/productApprovalService.ts    | Approval queue            |
| SellerVerificationService | src/services/sellerVerificationService.ts | Phone + tax ID verify     |
| EmailService              | src/services/emailService.ts              | Transactional emails      |

### Context Providers

| Context         | File                            | Purpose                    |
| --------------- | ------------------------------- | -------------------------- |
| CurrencyContext | src/context/CurrencyContext.tsx | Active currency + FX rates |

### Server Routes

| Route                | File                            | Purpose                     |
| -------------------- | ------------------------------- | --------------------------- |
| /api/typesense/sync  | server/routes/typesenseSync.ts  | Firestore→Typesense webhook |
| /api/fx-rates        | server/routes/fxRates.ts        | FX rate endpoint            |
| /api/complaints      | server/routes/complaints.ts     | Complaint CRUD              |
| /api/admin/approvals | server/routes/adminApprovals.ts | Product approval management |

## Modified Components

| Component             | Changes                                   |
| --------------------- | ----------------------------------------- |
| Checkout.tsx          | Currency selector, EUR price, tax display |
| ProductDetail.tsx     | EUR/TRY toggle, HS code                   |
| ProductForm.tsx       | GPSR upload, HS code selector             |
| SellerApplication.tsx | Phone verify, tax ID validation           |
| AdminDashboard.tsx    | Fraud flags, approval queue widgets       |
| AdminProducts.tsx     | Approval queue table                      |
| CartContext.tsx       | Currency-aware totals                     |
| stripe route          | Presentment currency, auto tax            |

## New Firestore Collections

| Collection       | Purpose               |
| ---------------- | --------------------- |
| fxRates          | Daily FX rate cache   |
| complaints       | Buyer disputes        |
| productApprovals | Approval queue        |
| hsCodes          | HS code master data   |
| fraudFlags       | Automated fraud flags |
| invoices         | Invoice records       |

## Data Flows

### Typesense Sync

Product write → Firestore onWrite → webhook → typesenseService → Typesense Cloud → InstantSearch UI

### Multi-Currency Checkout

User selects currency → CurrencyContext → CartContext computes → Stripe PaymentIntent with presentment_currency → auto-settlement

### Fraud Detection

New product → fraudDetectionService.analyze() → rule check (new seller? high discount? stock images?) → score > threshold? → admin review queue

## Build Order (Recommended Phases)

12: BUG + Typesense (foundation)
13: Multi-Currency (touches pricing everywhere)
14: Cross-Border (builds on multi-currency)
15: Seller Trust & Fraud Prevention
16: Automations (invoices, emails)
17: UAT Closure (final sign-off)

## Constraints

- All new data → Firestore (Typesense for search index only)
- Auth stays Firebase (phone via Twilio, not auth provider)
- Monorepo stays — no microservices
- Frontend stays SPA — Typesense queried via Express proxy
