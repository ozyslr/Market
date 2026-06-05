# Benim Olan (Mercora) — Global Artisan Marketplace

## What This Is

Benim Olan, satıcıların kendi mağazalarını açıp ürünlerini sattığı, kategori bazlı değişken komisyonla çalışan çok dilli (TR/EN/DE/AR) bir online pazar yeridir. Trendyol benzeri bir modelle satıcı ve müşteriyi birleştirir. Şu anda Technical MVP aşamasında canlıda çalışmakta olup, tam kapsamlı bir e-ticaret platformuna dönüştürülmektedir.

## Core Value

Satıcıların kendi mağazalarını KYC onayıyla açabildiği ve müşterilerin hızlı, güvenli alışveriş yapabildiği eksiksiz bir pazar yeri deneyimi. En kritik şey: güvenilir ödeme altyapısı ve satıcı güveni.

## Current State

**v1.0 — Marketplace Core — shipped 2026-06-05.** Phases 1–7 delivered (Foundation/compliance, dual-provider payments, seller KYC onboarding, Firestore search, shipping & returns, reviews & trust). 44/50 v1 requirements complete; 263 unit tests green; firestore.rules deployed.

- **Carried tech debt:** live UAT sign-off (payments/3DS, shipping, reviews photo + Q&A UI) and a deeper E2E pass — see `.planning/v1.0-MILESTONE-AUDIT.md`.
- Archive: `.planning/milestones/v1.0-ROADMAP.md` · `.planning/milestones/v1.0-REQUIREMENTS.md`.

## Active Milestone — v1.1: Stabilize & Sharpen (started 2026-06-05)

Harden v1.0 for production rather than ship new big features. 17 requirements across 4 phases (8–11): **Admin Access Control** (route guard + granular roles + audit), **Performance** (manualChunks + Lighthouse budget + image/CDN), **Seller Add-Flow UX** (quick-add/mobile/bulk images), **Purchase Funnel & Guest Checkout** (guest E2E + address book + express wallets + funnel analytics + v1.0 UAT closure). See `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, and `.planning/research/vNext-current-state-report.md`. Start execution with `/gsd-plan-phase 8`.

## Deferred to v2

- **Multi-Currency** (CUR-01..04): EUR display, FX rate-locking at checkout, TRY/EUR toggle; Trendyol-style per-country currency + localized routing (`/en`).
- **Typesense search** (SRC-01 typo-tolerant full-text, SRC-05 event-driven index) when catalog scale demands it.
- **Cross-Border Compliance** (CROSS-01..04): HS codes, customs docs, total landed cost, EU GPSR labels.

## Requirements

### Validated

- ✓ Ürün listeleme ve detay sayfaları (Firestore tabanlı) — mevcut
- ✓ Sepet ve wishlist yönetimi (React Context + Firestore) — mevcut
- ✓ Çok dilli UI (TR/EN/DE/AR, RTL Arapça desteği) — mevcut
- ✓ Firebase Auth (Google + email/şifre) — mevcut
- ✓ Temel satıcı dashboard ve envanter yönetimi — mevcut
- ✓ Kısmi Stripe + Iyzico ödeme entegrasyonu — mevcut
- ✓ Admin paneli (CMS, kategoriler, kullanıcı yönetimi) — mevcut
- ✓ Satıcı REST API (API key auth, rate limiting) — mevcut
- ✓ AI alışveriş asistanı (placeholder/ temel entegrasyon) — mevcut
- ✓ SEO (JSON-LD, sitemap, meta tag'ler) — mevcut

### Active

- [ ] Tam canlı ödeme altyapısı (Stripe production + Iyzico canlı)
- [ ] KVKK / GDPR hukuki uyum ve kişisel veri güvenliği
- [ ] Sipariş yaşam döngüsü (Pending → Processing → Shipped → Delivered)
- [ ] Satıcı KYC onboarding portalı (belge yükleme, admin onay akışı)
- [ ] Kategori bazlı değişken komisyon sistemi
- [ ] Gelişmiş arama ve filtreleme motoru
- [ ] Kargo entegrasyonu (canlı API takip)
- [ ] Çoklu para birimi tam desteği (TR + Avrupa)
- [ ] Satıcı finansal mutabakat ve payout takibi
- [ ] Mobil responsive tasarım optimizasyonu

### Out of Scope

- B2B wholesale modu — v2'ye ertelendi, önce B2C pazar yeri sağlamlaşmalı
- WMS (Warehouse Management) — Amazon FBA benzeri depo yönetimi uzak hedef
- Dinamik fiyatlandırma — şimdilik sabit/indirimli fiyatlandırma yeterli
- Mesajlaşma (chat) — e-ticarette düşük öncelik, admin isteğe bağlı açabilir

## Context

**Teknik altyapı:** Full-stack TypeScript — React 19 SPA (Vite 6), Express.js backend, Firebase Firestore NoSQL veritabanı, Firebase Auth + Storage. Tailwind CSS v4 ile stil. 65+ sayfa, 55+ servis modülü, 8 React Context provider. Vitest + Playwright ile test altyapısı mevcut.

**Mevcut durum:** Sistem canlıda çalışıyor. Stripe/Iyzico kısmen entegre ancak production'a tam geçiş yapılmamış. Satıcı onboarding'i manuel/admin tarafında. P0 maddeleri (ödeme, KVKK, sipariş yaşam döngüsü, auth güçlendirme) roadmap'te tanımlanmış ancak tamamlanmamış.

**İş modeli:** Kategori bazlı değişken komisyon (%5-20 arası). Satıcılar KYC onayından geçerek mağaza açar. Platform komisyonu otomatik kesilir, kalan bakiye satıcıya payout olarak aktarılır.

## Constraints

- **Ekip:** Solo developer + AI destekli geliştirme — tüm kodlama tek kişi tarafından yapılıyor
- **Pazar:** TR + Avrupa hedefleniyor (çoklu dil, çoklu para birimi, bölgesel regülasyonlar)
- **Mevcut stack:** Firebase, Express, React — radikal stack değişikliği yok; mevcut mimari üzerine inşa
- **Ödeme:** Stripe (Avrupa/global) + Iyzico (Türkiye) — çift ödeme sağlayıcı
- **Zaman:** 6 ayda tam kapsamlı pazar yeri deneyimine ulaşma hedefi

## Key Decisions

| Decision                               | Rationale                                                  | Outcome   |
| -------------------------------------- | ---------------------------------------------------------- | --------- |
| Firebase Firestore (NoSQL)             | Hızlı MVP, serverless ölçeklenme, gerçek zamanlı veri      | — Pending |
| Çift ödeme sağlayıcı (Stripe + Iyzico) | TR pazarı için Iyzico zorunlu, Avrupa için Stripe standart | — Pending |
| React Context (Redux/Zustand yerine)   | Hafif state yönetimi, MVP için yeterli                     | — Pending |
| Onaylı satıcı modeli (KYC)             | Güvenilir pazar yeri için satıcı doğrulama şart            | — Pending |
| Kategori bazlı değişken komisyon       | Esnek iş modeli, farklı kategorilerde farklı marj          | — Pending |
| Tailwind CSS v4                        | Hızlı UI geliştirme, utility-first yaklaşım                | ✓ Good    |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-06-04 — Phase 5 (Shipping & Fulfillment) complete: carrier integration (Entegi/EasyPost mocks), live tracking, returns workflow._
