---
quick_id: 261102-vhw
status: complete
date: 2026-11-02
commits: [58456d9, db336d9, a7feff3]
---

# Summary — CI type-check green

## Outcome

All CI steps pass locally: tsc 0 errors (was 136), lint 0 errors (50 pre-existing warnings),
vitest 36 files / 319 tests passed, build OK.

## Production bugs found (were hidden behind the "type errors")

| Bug                                                            | Impact                                                                                          | Since                |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------- |
| `searchService` called removed `getFacetedFiltersFallback`     | Every Firestore product search threw, was swallowed by catch → **search always returned empty** | 02215a8 (2026-07-11) |
| `AdminDashboard` KPICard read parent-scoped `sparkline`        | ReferenceError on render of admin dashboard KPI row                                             | —                    |
| `SellerApplication` success screen read undeclared `storeSlug` | Crash right after a seller submits an application                                               | —                    |
| `SellerStore` passed `ogImage` to SEO (prop is `image`)        | Store OG image silently dropped                                                                 | —                    |

## Changes

- 58456d9 fix: the four bugs above
- db336d9 chore: removed `src/store/*` (11 zustand stores, zustand not a dependency), `AdminAI.tsx`,
  `SellerProductUpload.tsx` — no importers, not routed
- a7feff3 test: AuthContext mock missing `onIdTokenChanged`; DataStates rendered without LanguageProvider
  (now mocks useLanguage); priceValidator was a standalone tsx script → now 10 real vitest cases

## Deviations

- Executed inline (no planner/executor spawn) — small, fully-scoped task.
- Test-suite repairs were not in the todo but were required for CI to pass.
