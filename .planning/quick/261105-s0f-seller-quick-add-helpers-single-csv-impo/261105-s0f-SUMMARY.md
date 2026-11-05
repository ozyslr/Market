---
quick_id: 261105-s0f
slug: seller-quick-add-helpers-single-csv-import
date: 2026-11-05
status: complete
---

# Summary — Seller quick-add helpers

1. **One CSV path (server).** Inventory's `CSVImportPanel` now uploads the file to
   `/api/products/csv-import` (was: browser `createProduct` per row, no category check). Dead legacy
   parser in SellerInventory removed (`cat-1-audio` default gone). Server fixes: accepts template columns
   (`categoryId`, `images`) and Turkish aliases; category by id/slug/name → stores the real doc id;
   images stored as public URLs (were storage paths → broken images); seller/admin role required (any
   signed-in user incl. anonymous could import); Turkish-aware unique slugs; sku/oldPrice/tags/currency.
2. **Import Center rules:** `sellers/{uid}/{importJobs|fieldMappings|feedConfigs}` owner-only.
3. **Image compression:** `uploadImage` downsizes to 1600 px JPEG q0.85 (skips <300 KB, gif/svg,
   falls back to original).
4. **Inline price/stock:** already existed (bulk edit mode); fixed display ($ → ₺, units → adet).
5. **Fotoğraftan doldur:** first photo → Gemini vision → title, description, category (validated
   against our ids), brand, tags; auto when the title is empty, fills only empty fields; button to re-run.
6. Copy product: `featured: false` (rules rejected copies of featured products).

Verification: tsc clean; vitest 39 files / 330 tests (new parsePhotoDraft test); rules 38/38 via Rules API.

Follow-ups: Shopify/WooCommerce connectors call platform admin APIs from the browser (CORS will block) →
move to a server proxy. XML feed URL is stored but never fetched on a schedule. Not tried with a real
seller account / real CSV in prod (Cloud Run SA needs Storage write for CSV images — unverified).
