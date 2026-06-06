# Benim Olan (Mercora) — Global Artisan Marketplace

## What This Is

Benim Olan, satıcıların kendi mağazalarını açıp ürünlerini sattığı, kategori bazlı değişken komisyonla çalışan çok dilli (TR/EN/DE/AR) bir online pazar yeridir. Trendyol benzeri bir modelle satıcı ve müşteriyi birleştirir. v1.0 ile temel pazar yeri kurulmuş, v1.1 ile üretime hazır hale getirilmiştir.

## Core Value

Satıcıların kendi mağazalarını KYC onayıyla açabildiği ve müşterilerin hızlı, güvenli alışveriş yapabildiği eksiksiz bir pazar yeri deneyimi. En kritik şey: güvenilir ödeme altyapısı ve satıcı güveni.

## Current State

**Shipped:** v1.0 Marketplace Core (Phases 1–7) + v1.1 Stabilize & Sharpen (Phases 8–11).
**Codebase:** 65+ sayfa, 55+ servis, 8 React Context, 263 unit test (green), 3 Playwright E2E spec.
**Live:** Sistem canlıda çalışıyor. Stripe/Iyzico entegre. Admin panel aktif. Satıcı onboarding KYC'li.

- **Archives:** `.planning/milestones/v1.0-ROADMAP.md` · `.planning/milestones/v1.0-REQUIREMENTS.md` · `.planning/milestones/v1.1-ROADMAP.md` · `.planning/milestones/v1.1-REQUIREMENTS.md`
- **Carried tech debt:** Live UAT sign-off (BUY-05 checklist + E2E specs yazıldı, manuel doğrulama bekliyor)

## Current Milestone — v2.0: Trust & Scale

**Goal:** Scale the marketplace globally (multi-currency, cross-border, Typesense search) while building seller trust through verification, fraud prevention, complaint handling, and workflow automations.

**Target features:**

- Multi-Currency: EUR display, FX rate-locking, TRY/EUR toggle, per-country routing
- Typesense Search: typo-tolerant full-text, event-driven index sync
- Cross-Border Compliance: HS codes, customs docs, total landed cost, EU GPSR
- Seller Trust & Fraud Prevention: phone verification, tax info, product approval workflows, complaint/dispute system, fake listing detection
- Automations: auto invoice generation (e-fatura), auto email notifications (order, shipping, approval)
- Bug Fix: Firebase Storage image upload permission for sellers
- UAT Closure: v1.0 live UAT sign-off (payments/3DS, shipping, reviews)

## Requirements

### Validated

- ✓ Ürün listeleme ve detay sayfaları (Firestore tabanlı) — v1.0
- ✓ Sepet ve wishlist yönetimi (React Context + Firestore) — v1.0
- ✓ Çok dilli UI (TR/EN/DE/AR, RTL Arapça desteği) — v1.0
- ✓ Firebase Auth (Google + email/şifre) + Anonymous Auth — v1.0
- ✓ Temel satıcı dashboard ve envanter yönetimi — v1.0
- ✓ Stripe + Iyzico çift ödeme entegrasyonu — v1.0
- ✓ Admin paneli (CMS, kategoriler, kullanıcı yönetimi) — v1.0
- ✓ Satıcı REST API (API key auth, rate limiting) — v1.0
- ✓ SEO (JSON-LD, sitemap, meta tag'ler) — v1.0
- ✓ Kategori bazlı değişken komisyon sistemi — v1.0
- ✓ Sipariş yaşam döngüsü (Pending → Processing → Shipped → Delivered) — v1.0
- ✓ Satıcı KYC onboarding portalı (belge yükleme, admin onay akışı) — v1.0
- ✓ Admin erişim kontrolü (route guard + granular roller + audit log) — v1.1
- ✓ Performans optimizasyonu (vendor chunks + Lighthouse CI + image/CDN) — v1.1
- ✓ Satıcı ekleme UX (quick-add + mobil form + bulk upload + funnel) — v1.1
- ✓ Guest checkout E2E + adres defteri + express wallets — v1.1
- ✓ Satın alma hunisi analitiği (cart → checkout → paid) — v1.1

### Active

- [ ] Multi-Currency tam desteği (EUR/TRY, FX rate-locking, per-country routing) — v2.0
- [ ] Typesense tam-metin arama (typo-tolerant + event-driven index) — v2.0
- [ ] Cross-Border Compliance (HS codes, customs docs, total landed cost, EU GPSR) — v2.0
- [ ] Satıcı güvenliği & dolandırıcılık önleme (telefon doğrulama, vergi bilgisi, ürün onay, şikayet sistemi) — v2.0
- [ ] Otomasyonlar (otomatik fatura, otomatik e-postalar) — v2.0
- [ ] Firebase Storage resim yükleme izin hatası düzeltmesi — v2.0
- [ ] Live UAT sign-off (BUY-05: payments/3DS, shipping, reviews/Q&A) — v2.0

### Out of Scope

- B2B wholesale modu — önce B2C pazar yeri sağlamlaşmalı
- WMS (Warehouse Management) — Amazon FBA benzeri depo yönetimi uzak hedef
- Dinamik fiyatlandırma — şimdilik sabit/indirimli fiyatlandırma yeterli
- Native mobil uygulama — PWA mevcut, web öncelikli

## Context

**Teknik altyapı:** Full-stack TypeScript — React 19 SPA (Vite 6), Express.js backend, Firebase Firestore NoSQL veritabanı, Firebase Auth + Storage. Tailwind CSS v4 ile stil. 65+ sayfa, 55+ servis modülü, 8 React Context provider. Vitest (263 test) + Playwright (3 E2E spec) ile test altyapısı mevcut.

**Mevcut durum:** v1.0 + v1.1 shipped. Sistem canlıda çalışıyor. Admin panel route/API korumalı, audit log aktif. Performans bütçesi CI'da zorunlu. Satıcı onboarding funnel'ı instrumented. Guest checkout + express wallets + funnel analytics hazır. UAT checklist ve E2E spec'ler yazıldı, manuel doğrulama bekliyor.

**İş modeli:** Kategori bazlı değişken komisyon (%5-20 arası). Satıcılar KYC onayından geçerek mağaza açar. Platform komisyonu otomatik kesilir, kalan bakiye satıcıya payout olarak aktarılır.

## Constraints

- **Ekip:** Solo developer + AI destekli geliştirme — tüm kodlama tek kişi tarafından yapılıyor
- **Pazar:** TR + Avrupa hedefleniyor (çoklu dil, çoklu para birimi, bölgesel regülasyonlar)
- **Mevcut stack:** Firebase, Express, React — radikal stack değişikliği yok; mevcut mimari üzerine inşa
- **Ödeme:** Stripe (Avrupa/global) + Iyzico (Türkiye) — çift ödeme sağlayıcı
- **Zaman:** 6 ayda tam kapsamlı pazar yeri deneyimine ulaşma hedefi

## Key Decisions

| Decision                                             | Rationale                                                  | Outcome    |
| ---------------------------------------------------- | ---------------------------------------------------------- | ---------- |
| Firebase Firestore (NoSQL)                           | Hızlı MVP, serverless ölçeklenme, gerçek zamanlı veri      | ✓ Good     |
| Çift ödeme sağlayıcı (Stripe + Iyzico)               | TR pazarı için Iyzico zorunlu, Avrupa için Stripe standart | ✓ Good     |
| React Context (Redux/Zustand yerine)                 | Hafif state yönetimi, MVP için yeterli                     | ✓ Good     |
| Onaylı satıcı modeli (KYC)                           | Güvenilir pazar yeri için satıcı doğrulama şart            | ✓ Good     |
| Kategori bazlı değişken komisyon                     | Esnek iş modeli, farklı kategorilerde farklı marj          | ✓ Good     |
| Tailwind CSS v4                                      | Hızlı UI geliştirme, utility-first yaklaşım                | ✓ Good     |
| Stripe Identity auto-verification (doc + selfie)     | Tüm satıcılar için otomatik KYC; webhook ile sonuç         | ✓ Good     |
| 3-doc gate (identity/tax/bank)                       | Submit disabled until all 3 uploaded                       | ✓ Good     |
| EU sellers → Stripe Connect Express                  | Admin onayında idempotent provision                        | ✓ Good     |
| TR sellers → Iyzico subMerchantCreate                | Admin onayında idempotent provision                        | ✓ Good     |
| AdminRole enum (super-admin \| support \| finance)   | Firebase custom claims ile granular yetki                  | ✓ Good     |
| AdminRoute client guard (redirect + toast)           | Non-admin /admin/\* → home yönlendirme                     | ✓ Good     |
| Audit log (KYC, refund, role, CMS, data-deletion)    | Aktör + zaman damgalı, compliance-ready                    | ✓ Good     |
| verifyAdmin on every admin API endpoint              | Defense-in-depth, client guard'dan bağımsız                | ✓ Good     |
| manualChunks vendor splitting + CI bundle budget     | Vite build pipeline entegre                                | ✓ Good     |
| Lighthouse CI thresholds (LCP/CLS/TBT)               | Home, product detail, checkout'ta zorunlu                  | ✓ Good     |
| OptimizedImage srcSet (3 breakpoints) + WebP audit   | CDN olmadan responsive images                              | ✓ Good     |
| Quick-add mode (25+ → 6 essential fields)            | Satıcı sürtünmesini azaltır, EMPTY_FORM defaults           | ✓ Good     |
| Mobile sticky save bar (ProductForm)                 | fixed bottom-0, sadece mobilde                             | ✓ Good     |
| Bulk image upload + dnd-kit sortable grid            | Per-file progress + sürükle-bırak                          | ✓ Good     |
| Seller funnel events (fire-and-forget)               | Mevcut events collection, idempotent                       | ✓ Good     |
| Guest checkout (localStorage cart + merge + upgrade) | Anonim → kayıtlı dönüşüm yolu                              | ✓ Good     |
| AddressType enum + HTML autocomplete                 | Browser-native autofill + kayıtlı kartlar                  | ✓ Good     |
| PaymentRequestButtonElement (Apple/Google Pay)       | Native wallet UX, graceful fallback                        | ✓ Good     |
| Funnel analytics (events + admin dashboard)          | Cart → checkout → paid dönüşüm takibi                      | ✓ Good     |
| UAT checklist + Playwright E2E                       | Manuel sign-off + otomatik regresyon                       | ✓ Good     |
| Firestore-only search (Typesense deferred)           | Maliyet kontrolü; katalog büyüyünce tekrar değerlendir     | ⚠️ Revisit |
| Multi-currency deferred to v2                        | TRY-only for now; EUR/FX v2'de                             | — Pending  |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-06-06 — v1.1 milestone archived; ready for v2.0 planning_
