# Phase 4: Search & Discovery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-04
**Phase:** 04-search-discovery
**Areas discussed:** Typesense hosting & client access, Index sync strategy, Search arch & fallback, Multilingual & typo tolerance

---

## Typesense Hosting

| Option                    | Description                                | Selected |
| ------------------------- | ------------------------------------------ | -------- |
| Typesense Cloud (managed) | No server ops, backups/scaling handled     | ✓        |
| Self-hosted (Docker/VPS)  | Full control, owns uptime/upgrades/backups |          |

**User's choice:** Typesense Cloud
**Notes:** Chosen for solo-dev operability.

## Client Access

| Option                                 | Description                                                | Selected |
| -------------------------------------- | ---------------------------------------------------------- | -------- |
| Direct from browser w/ search-only key | Frontend queries Typesense directly; admin key server-side | ✓        |
| Proxy all queries through Express      | Browser → /api/search → Typesense; extra hop               |          |

**User's choice:** Direct from browser with scoped search-only key
**Notes:** Admin/write key stays server-side only.

---

## Index Sync Strategy

| Option                                 | Description                                            | Selected |
| -------------------------------------- | ------------------------------------------------------ | -------- |
| Server write-through in productService | Writes also call Typesense via Express + admin key     | ✓        |
| Firebase Cloud Functions trigger       | onWrite trigger auto-syncs; adds CF infra + cold start |          |
| Polling / batch reconcile              | Scheduled re-sync; violates "within seconds"           |          |

**User's choice:** Server write-through
**Notes:** No new infra; control over sync.

## Backfill / Recovery

| Option                           | Description                                               | Selected |
| -------------------------------- | --------------------------------------------------------- | -------- |
| Admin-triggered reindex endpoint | Protected route bulk-imports all products; drift recovery | ✓        |
| One-off migration script         | Standalone script run manually once                       |          |

**User's choice:** Admin-triggered reindex endpoint

## Write Path (follow-up)

| Option                                              | Description                                          | Selected |
| --------------------------------------------------- | ---------------------------------------------------- | -------- |
| Client calls /api/search/sync after Firestore write | Keep client-side write, then authenticated sync POST | ✓        |
| Route product writes through Express                | Move writes server-side; larger refactor             |          |
| Firestore onWrite Cloud Function                    | Automatic regardless of writer; adds CF infra        |          |

**User's choice:** Client calls /api/search/sync after Firestore write
**Notes:** Surfaced because product writes currently go browser → Firestore directly; admin key must stay server-side. Endpoint verifies token + seller ownership.

---

## Search Architecture & Fallback

| Option                                    | Description                                            | Selected |
| ----------------------------------------- | ------------------------------------------------------ | -------- |
| Layer Typesense behind searchProducts()   | Primary engine inside existing interface; UI untouched | ✓        |
| Replace searchService with Typesense-only | Cleaner but outage = no search                         |          |

**User's choice:** Layer Typesense behind searchProducts()

## Fallback Lifetime

| Option                                  | Description                                   | Selected |
| --------------------------------------- | --------------------------------------------- | -------- |
| Keep as permanent resilience fallback   | Degrade to Firestore/MOCK on Typesense outage | ✓        |
| Transitional only — remove after stable | Delete fallback in later cleanup              |          |

**User's choice:** Keep as permanent resilience fallback

---

## Multilingual

| Option                                           | Description                                   | Selected |
| ------------------------------------------------ | --------------------------------------------- | -------- |
| Single index, search all language fields         | One collection; query across localized fields | ✓        |
| Per-language fields w/ active-language weighting | Boost current UI language at query time       |          |
| Separate index per language                      | Most control, 4× sync burden                  |          |

**User's choice:** Single index, search all language fields

## Typo & TR Handling

| Option                                           | Description                                   | Selected |
| ------------------------------------------------ | --------------------------------------------- | -------- |
| Typesense typo tolerance + TR synonyms           | Drop manual TR-normalization; add synonym set | ✓        |
| Keep TR-normalization + Typesense typo tolerance | Normalize on index & query; more custom code  |          |
| Typesense defaults only — no synonyms yet        | Defer synonyms to later tuning                |          |

**User's choice:** Rely on Typesense typo tolerance + add TR synonyms

---

## Claude's Discretion

- Typesense schema field definitions, types, `default_sorting_field`.
- Sort-field data sourcing (best-selling sales signal — existing field vs derived counter).
- Facet multi-select UX, facet-count display, pagination vs infinite scroll, autocomplete wiring.
- `/api/search/sync` retry/error semantics.
- Env var names + secret management for Typesense keys.

## Deferred Ideas

- TR-character normalization on the search path (dropped from Typesense path; keep `normalizeTR` for category matching elsewhere).
- Synonym expansion beyond initial TR/EN set.
- Multi-currency price display in results — Phase 6.
- Semantic / AI-powered search & recommendations — future phase.
