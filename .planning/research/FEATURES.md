# Features Research — v2.0 Trust & Scale

## 1. Multi-Currency (CUR)

**Table Stakes:**

- Display prices in EUR/TRY with toggle
- Geo-detect user country → default currency
- Store base prices in TRY, compute EUR from daily FX
- Stripe presentment_currency for EUR charges
- URL-based currency routing (/en→EUR, /tr→TRY)

**Differentiators:**

- FX rate-lock at checkout (15-min window)
- Seller dashboard shows revenue in both currencies

**Anti-features:**

- DO NOT let sellers set per-currency prices initially
- DO NOT support crypto or exotic currencies
- DO NOT do real-time FX streaming

**Complexity:** HIGH

## 2. Typesense Search (SRC)

**Table Stakes:**

- Typo-tolerant full-text (handles "ayfon"→"iPhone" in TR)
- Faceted filtering (category, price, brand, rating)
- Instant results (< 100ms)
- Multi-language analyzers (TR stemming, EN, DE, AR)
- Search analytics (top queries, no-results, CTR)

**Differentiators:**

- Synonym management in admin panel
- "Trending searches" widget

**Anti-features:**

- DO NOT try to match Algolia AI features
- DO NOT over-index admin-only fields

**Complexity:** MEDIUM

## 3. Cross-Border Compliance (CROSS)

**Table Stakes:**

- HS code assignment per product category
- Proforma/commercial invoice generation
- EU GPSR: authorized rep info, safety docs
- Stripe Tax for auto VAT calculation
- Product eligibility check per destination country

**Differentiators:**

- "Total landed cost" calculator (duties+taxes+shipping)

**Anti-features:**

- DO NOT attempt full customs brokerage integration
- DO NOT pre-calculate ALL countries (start DE, FR, NL)

**Complexity:** HIGH

## 4. Seller Trust & Fraud Prevention (FRD)

**Table Stakes:**

- Phone verification (SMS OTP) at registration
- Tax ID / VAT validation (VIES for EU, format for TR)
- Product approval queue (admin reviews new listings)
- Complaint/dispute system (buyer reports issues)
- Seller trust score on store page
- Duplicate listing detection via image hash

**Differentiators:**

- 3-tier approval: auto-approved→queue→blocked
- "Verified Seller" badge after N orders
- Seller appeal process

**Anti-features:**

- DO NOT implement full KYB yet
- DO NOT auto-ban sellers (human-in-the-loop)
- DO NOT use AI-only fraud (keep rules explainable)

**Complexity:** MEDIUM-HIGH

## 5. Automations (AUT)

**Table Stakes:**

- Auto invoice PDF on order completion
- Order confirmation email
- Shipping status emails
- Seller approval notification

**Differentiators:**

- E-fatura integration (TR legal requirement)
- Abandoned cart recovery (3-email series)
- Monthly seller statement

**Anti-features:**

- DO NOT build full email marketing platform
- DO NOT implement real-time email tracking yet

**Complexity:** MEDIUM

## 6. Image Upload Fix (BUG)

**Complexity:** LOW — Firebase Storage Rules change

## 7. UAT Closure (UAT)

**Complexity:** LOW-MEDIUM — manual + Playwright E2E

## Build Sequence (by dependency)

BUG→SRC→CUR→CROSS→FRD→AUT→UAT
