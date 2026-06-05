# Roadmap: Benim Olan (Mercora) — Global Artisan Marketplace

## Shipped Milestones

- ✅ **v1.0 — Marketplace Core** (shipped 2026-06-05): Foundation/compliance, dual-provider payments, seller KYC onboarding, Firestore search, shipping & returns, reviews & trust. 44/50 v1 requirements complete (5 awaiting live UAT), 6 deferred to v2. → [Archive](./milestones/v1.0-ROADMAP.md) · [Audit](./v1.0-MILESTONE-AUDIT.md)

## Current Milestone

_None active._ Start the next milestone with `/gsd-new-milestone` (defines fresh requirements + roadmap).

## Deferred to v2

- **Multi-Currency** (Phase 6 / CUR-01..04) — EUR display, FX rate-locking, TRY/EUR toggle; Trendyol-style per-country currency + localized routing.
- **Typesense search** (SRC-01 typo-tolerant full-text, SRC-05 event-driven index) — v1 ships Firestore search.
- **Cross-Border Compliance** (Phase 8 / CROSS-01..04) — HS codes, customs docs, total landed cost, EU GPSR.

## Carried tech debt (from v1.0 audit)

- Live UAT sign-off: payments/3DS, shipping flows, reviews photo UX + Q&A (see `.planning/v1.0-MILESTONE-AUDIT.md`).
- Deeper cross-phase E2E pass before production sign-off.
