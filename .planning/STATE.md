---
gsd_state_version: 1.0
milestone: v6.0
milestone_name: Admin Satıcı Denetim Merkezi
status: planning
last_updated: '2026-06-08T22:30:30.072Z'
last_activity: 2026-06-08
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 6
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-08)

**Core value:** Satıcıların KYC onayıyla mağaza açabildiği ve müşterilerin güvenli alışveriş yapabildiği eksiksiz pazar yeri deneyimi
**Current focus:** v6.0 — Admin Satıcı Denetim Merkezi (Phases 30–35)

## Current Position

Phase: 30 (Foundation & Shared) — Not started
Plan: —
Status: Roadmap defined, ready to plan Phase 30
Last activity: 2026-06-08 — Milestone v6.0 roadmap created

```
Progress: ░░░░░░░░░░░░░░░░░░░░ 0% (0/6 phases)
```

## Performance Metrics

**Velocity:**

- v1.1: 4 faz (8-11), 16 plan, 59 commit, 87 dosya, tek günde tamamlandı (2026-06-05)

**By Phase (v1.1):**

| Phase                             | Plans | Duration |
| --------------------------------- | ----- | -------- |
| 08-admin-access-control           | 3     | —        |
| 09-performance                    | 4     | —        |
| 10-seller-add-flow-ux             | 4     | —        |
| 11-purchase-funnel-guest-checkout | 5     | —        |

## Accumulated Context

### Decisions

See .planning/PROJECT.md Key Decisions for full log.

**v6.0 Scoping Decisions:**

- Ban policy: suspend + permanent ban (typed-confirmation, irreversible)
- performanceScore placeholder: fix in Phase 35 with "placeholder data" warning
- trustScoreAdjustment ceiling: ±20
- tierOverride: permanent until manually removed + optional expiry (no cron; checked at read time)
- complaints.sellerId: forward-only (no backfill of existing complaints)
- GİB e-fatura: deferred from Finance tab
- System A (sellerBalances/payoutRequests): left as-is; System B (ledger) shown in Finance tab only
- Second-admin ban confirmation: typed store name dialog is sufficient (solo dev setup)

### Pending Todos

- Phase 30: Verify shared component inventory before building new ones
- Phase 33: Confirm iyzico route deps type signature before enforcing verifyAdmin non-optional

### Blockers/Concerns

- Live UAT sign-off (BUY-05): checklist created, Playwright E2E specs written, manual verification pending on production-like env.
- Phase 04 (search-discovery) plans 04-01..04-04 are **Typesense-based and on hold**. Revisit in v2.

### Quick Tasks Completed

| #                                  | Description                                                                                                                     | Date       | Commit    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------- |
| 260604-e5f                         | Firestore-only search improvement: best-selling sort, sort options, faceted filtering, client-side search polish (no Typesense) | 2026-06-04 | 60d9b63   |
| 260604-gxl                         | Firebase Anonymous Auth for guest analytics events + firestore.rules hardening                                                  | 2026-06-04 | 1c0f94f   |
| 20260605-authcontext-test-mock-fix | Mock signInAnonymously in AuthContext.test.tsx                                                                                  | 2026-06-05 | (pending) |

## Deferred Items

| Category | Item                                                        | Status                                             |
| -------- | ----------------------------------------------------------- | -------------------------------------------------- |
| feature  | Multi-Currency (CUR-01..04)                                 | Deferred to v2                                     |
| feature  | Typesense search (SRC-01, SRC-05)                           | Deferred to v2                                     |
| feature  | Cross-Border Compliance (CROSS-01..04)                      | Deferred to v2                                     |
| uat      | v1.0 live UAT — payments/3DS, shipping, reviews photo + Q&A | Checklist done, manual verification pending        |
| feature  | GİB e-fatura Finance tab display                            | Deferred until real GİB credentials                |
| feature  | System A balance migration/freeze                           | Deferred; System B read-only in v6.0               |
| feature  | complaints.sellerId backfill migration                      | Forward-only chosen; old complaints join-dependent |
| bug      | Commission client/server fee divergence (3.5%)              | Deferred; separate accounting-accuracy work        |
| bug      | Invoice in-memory counter (multi-instance duplicate risk)   | Deferred                                           |

## Session Continuity

Last session: 2026-06-08
Stopped at: Roadmap created, ready to begin Phase 30
Resume file: None
