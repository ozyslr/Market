---
quick_id: 261102-vhw
slug: ci-type-check-green
date: 2026-11-02
source_todo: .planning/todos/pending/2026-11-02-ci-type-check-yesile-cek.md
---

# Plan — CI type-check'i yeşile çek

CI `tsc --noEmit` fails with 136 errors. Goal: every CI step (tsc, lint, test:coverage, build) green.

## Tasks

1. Fix the 10 non-store errors — several are undefined identifiers (runtime ReferenceErrors), not just types:
   AdminDashboard `sparkline`, SellerApplication `storeSlug`, searchService `getFacetedFiltersFallback`,
   SellerStore SEO prop, AdminAI implicit any.
2. Delete dead code: `src/store/*` (zustand not installed, 126 errors), `AdminAI.tsx`, `SellerProductUpload.tsx`
   — verify no importers / routes first.
3. Run the full CI pipeline locally; fix any test suites that block it.

## Verify

`npx tsc --noEmit` = 0, `npm run lint` exit 0, `npm run test:coverage` exit 0, `npm run build` exit 0.
