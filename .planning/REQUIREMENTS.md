# Requirements: Benim Olan (Mercora) — v1.1 "Stabilize & Sharpen"

**Defined:** 2026-06-05
**Milestone:** v1.1 (follows v1.0 Marketplace Core)
**Core Value:** v1.0'da kurulan pazar yerini sağlamlaştırmak — erişim kontrolü, performans, satıcı ekleme kolaylığı ve satın alma hunisini üretime hazır hale getirmek (yeni büyük özellik değil).

## v1.1 Requirements

### Admin Erişim Kontrolü (ADM)

- [x] **ADM-01**: Client route-level admin guard — admin olmayan kullanıcı `/admin/*` rotalarına erişemez (yönlendirme/403)
- [x] **ADM-02**: Granular admin rolleri (super-admin / support / finance) — bölüm bazlı erişim
- [x] **ADM-03**: Audit log tüm hassas admin aksiyonlarını kaydeder (KYC onay/red, iade, rol değişimi, CMS düzenleme) — aktör + zaman damgası
- [ ] **ADM-04**: Sunucu tarafı yetki paritesi — her admin API endpoint'i rolü doğrular (defense-in-depth)

### Performans (PERF)

- [ ] **PERF-01**: Vendor code-splitting (`manualChunks`) + bundle bütçesi; CI'da analiz raporu
- [ ] **PERF-02**: Lighthouse CI bütçesi — kilit sayfalarda zorunlu eşikler (LCP / CLS / TBT)
- [ ] **PERF-03**: Görsel optimizasyonu + CDN / responsive images (ürün medyası)
- [ ] **PERF-04**: Sıcak-yol Firestore sorgu/index gözden geçirmesi (liste + arama)

### Satıcı Ekleme UX (SLR)

- [ ] **SLR-01**: Hızlı-ekle / adımlı ürün oluşturma modu (azaltılmış-alan hızlı yol)
- [ ] **SLR-02**: Mobil-optimize ürün formu ergonomisi
- [ ] **SLR-03**: Toplu görsel yükleme + sürükle-sırala (ürün formunda)
- [ ] **SLR-04**: İlk-listeleme süresi ölçümü (satıcı onboarding hunisi)

### Satın Alma & Misafir Checkout (BUY)

- [ ] **BUY-01**: Misafir checkout uçtan uca tamamlanır (anonim → ödenmiş sipariş) — doğrulanmış
- [ ] **BUY-02**: Kayıtlı adres defteri / checkout'ta adres otomatik doldurma
- [ ] **BUY-03**: Express cüzdanlar (Apple Pay / Google Pay — Stripe Payment Request)
- [ ] **BUY-04**: Satın alma hunisi ölçümü (cart → checkout → paid dönüşüm analitiği)
- [ ] **BUY-05**: v1.0 canlı UAT kapanışı — ödeme/3DS, sipariş yaşam döngüsü, kargo, reviews/Q&A imzaları

## Deferred to v2 (carried)

- **CUR-01..04** — Multi-Currency (EUR display, FX rate-lock, TRY/EUR toggle, per-country routing)
- **SRC-01, SRC-05** — Typesense (typo-toleranslı tam-metin arama + event-driven index)
- **CROSS-01..04** — Cross-Border Compliance (HS code, gümrük evrakı, total landed cost, EU GPSR)

## Out of Scope (v1.1)

| Feature                                                         | Reason                                     |
| --------------------------------------------------------------- | ------------------------------------------ |
| Yeni büyük özellikler (multi-currency, Typesense, cross-border) | v2 kapsamı — v1.1 sertleştirme/cila odaklı |
| Native mobil uygulama                                           | Web öncelikli, PWA mevcut                  |
| B2B wholesale, WMS, reklam platformu                            | v1.0'da out-of-scope; değişmedi            |

## Traceability

| Requirement | Phase    | Status   |
| ----------- | -------- | -------- |
| ADM-01      | Phase 8  | Complete |
| ADM-02      | Phase 8  | Complete |
| ADM-03      | Phase 8  | Complete |
| ADM-04      | Phase 8  | Pending  |
| PERF-01     | Phase 9  | Pending  |
| PERF-02     | Phase 9  | Pending  |
| PERF-03     | Phase 9  | Pending  |
| PERF-04     | Phase 9  | Pending  |
| SLR-01      | Phase 10 | Pending  |
| SLR-02      | Phase 10 | Pending  |
| SLR-03      | Phase 10 | Pending  |
| SLR-04      | Phase 10 | Pending  |
| BUY-01      | Phase 11 | Pending  |
| BUY-02      | Phase 11 | Pending  |
| BUY-03      | Phase 11 | Pending  |
| BUY-04      | Phase 11 | Pending  |
| BUY-05      | Phase 11 | Pending  |

**Coverage:**

- v1.1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---

_Requirements defined: 2026-06-05 (v1.1 milestone). Informed by `.planning/research/vNext-current-state-report.md`._
