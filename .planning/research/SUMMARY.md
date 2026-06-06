# Research Summary — v2.0 Trust & Scale

## Stack Additions

- **typesense** (3.0.6) + typesense-instantsearch-adapter — hosted on Typesense Cloud (~/mo) or self-hosted
- **exchange-rates-api** — daily ECB FX rate fetch → Firestore cache
- **twilio** + **libphonenumber-js** — SMS OTP seller verification
- **nodemailer** — transactional emails
- **pdfkit** — invoice PDF generation
- **sharp** (existing) — perceptual image hashing for duplicate detection

## Feature Categories

| Category         | Complexity  | Key Decision                                          |
| ---------------- | ----------- | ----------------------------------------------------- |
| Typesense Search | MEDIUM      | Per-language collections; incremental Firestore sync  |
| Multi-Currency   | HIGH        | TRY base, EUR display; 15-min FX lock at checkout     |
| Cross-Border     | HIGH        | Stripe Tax for VAT; ProductIP for GPSR rep            |
| Seller Trust     | MEDIUM-HIGH | Rule-based fraud (not ML); human-in-the-loop for bans |
| Automations      | MEDIUM      | Paraşüt/Logo API for e-fatura (not direct e-Belge)    |
| Image Fix        | LOW         | Firebase Storage Rules UID check                      |
| UAT Closure      | LOW-MEDIUM  | Playwright E2E + manual checklist                     |

## Architecture Integration

- 8 new services, 1 new context, 4 new server routes
- 6 new Firestore collections
- Typesense as secondary index (Firestore remains source of truth)
- No new auth provider, no new database, no microservices

## Suggested Phases

| Phase | Name                            | Builds On |
| ----- | ------------------------------- | --------- |
| 12    | Search & Storage Fix            | —         |
| 13    | Multi-Currency                  | 12        |
| 14    | Cross-Border Compliance         | 13        |
| 15    | Seller Trust & Fraud Prevention | 14        |
| 16    | Automations                     | 15        |
| 17    | UAT Closure                     | 16        |

## Top Risks to Watch

1. **Over-blocking sellers** — human-in-the-loop mandatory
2. **FX rate mismatch** — rate-lock at checkout, not display
3. **GPSR liability** — 3rd-party compliance partner needed
4. **E-fatura complexity** — start with Paraşüt/Logo API
5. **VIES API downtime** — async validation, don't block registration
