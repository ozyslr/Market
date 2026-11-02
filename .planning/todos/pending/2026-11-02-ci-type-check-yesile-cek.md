---
created: 2026-11-02T22:32:44.163Z
title: CI type-check'i yeşile çek (136 TS hatası)
area: general
priority: 1
files:
  - src/store/*.ts
  - src/pages/AdminAI.tsx
  - src/pages/SellerProductUpload.tsx
  - src/pages/AdminDashboard.tsx
  - src/services/searchService.ts
  - src/pages/SellerStore.tsx
  - src/pages/SellerApplication.tsx
---

## Problem

GitHub Actions CI (`tsc --noEmit`) kırmızı: 136 hata, hepsi 261102-ra8'den önce de vardı.
Deploy'u engellemiyor ama CI hiçbir değişikliği doğrulamıyor — sıradaki API barındırma
işi (server kodu) için güvenlik ağı yok. Sıra: **1 (önce bu)**.

Dağılım (2026-11-02):

- 126 hata `src/store/use*Store.ts` (11 dosya) — `zustand` package.json'da yok.
  Bu store'ları sadece `AdminAI.tsx` ve route'lanmamış ölü kod `SellerProductUpload.tsx` import ediyor.
- AdminAI.tsx (4), searchService.ts `getFacetedFiltersFallback` (2), AdminDashboard sparkline (2),
  SellerStore SEOProps (1), SellerApplication storeSlug (1).

## Solution

1. AdminAI'nin store kullanımını incele; store'lar fiilen ölüyse `src/store/` + `SellerProductUpload.tsx`'i sil
   (zustand ekleme — proje kuralı: state = Context API). Gerekliyse ilgili Context/servise taşı.
2. Kalan 10 hatayı tek tek düzelt.
3. `npx tsc --noEmit` = 0, vitest geçsin, CI yeşil.
