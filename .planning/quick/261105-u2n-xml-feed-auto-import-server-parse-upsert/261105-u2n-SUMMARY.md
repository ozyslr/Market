---
quick_id: 261105-u2n
slug: xml-feed-auto-import-server-parse-upsert
date: 2026-11-05
status: complete
---

# Summary — XML feed auto-import, demo showcase, E2E CI

- **XML feeds** (`server/services/feedParser.ts`, `server/routes/feeds.ts`): Google Shopping RSS/Atom and
  urun/product exports; Turkish/English price formats; https images only; SSRF + 20 MB guards. New items →
  `pending` products (moderation kept; the "auto-publish, skip approval" option was removed), known items
  (feedId + SKU) → price/stock only, honouring the feed options. `POST /api/feeds/:id/run` (seller, also
  called right after saving in Import Center) and `POST /api/feeds/sync` (cron, hourly granularity —
  shortcut for 15m/30m). Results go to `sellers/{uid}/importJobs`. Default category select added.
  Dependency: fast-xml-parser.
- **Demo showcase:** user chose to publish the 197 seed products. They get `isDemo: true`; the server
  quote and one-click checkout refuse them (409 "vitrin örneğidir"), product page shows a notice and
  disables add-to-cart.
- **E2E CI:** failed on infra (ubuntu-latest = 26.04, unsupported by Playwright 1.60) → pinned
  ubuntu-24.04; webServer timeout 30 s → 240 s (build). Locally 21 pass / 7 fail: 5 because the home page
  had no approved products (fixed by the showcase), 2 critical-path (checkout page / seller store) to look
  at in the UI pass.

Verification: vitest 40 files / 334 tests (new feedParser + demo quote tests), tsc clean, modules load in tsx.
