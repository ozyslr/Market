# Requirements: Benim Olan (Mercora) — v2.0 "Trust & Scale"

**Defined:** 2026-06-07
**Milestone:** v2.0 (follows v1.1 Stabilize & Sharpen)
**Core Value:** Pazar yerini global ölçeğe taşırken satıcı güvenliğini sağlamak — çoklu para birimi, sınır ötesi uyumluluk, gelişmiş arama ve dolandırıcılık önleme.

## v2.0 Requirements

### Arama & Depolama Düzeltmesi (SRC + BUG)

- [ ] **BUG-01**: Satıcı ürün eklerken Firebase Storage'a resim yükleyebilir (izin hatası düzeltilir)
- [ ] **BUG-02**: Yükleme hatasında kullanıcıya açık hata mesajı gösterilir
- [ ] **SRC-01**: Typo-tolerant tam metin arama — yazım hatası düzeltmesiyle tüm ürün alanlarında arama
- [ ] **SRC-02**: Fasetli filtreleme — kategori, fiyat aralığı, marka, puan
- [ ] **SRC-03**: Çok dilli arama — TR stemming, EN, DE, AR analyzer desteği
- [ ] **SRC-04**: Firestore → Typesense gerçek zamanlı senkronizasyon (onWrite trigger)
- [ ] **SRC-05**: Arama analitiği — en çok arananlar, sonuçsuz aramalar, CTR dashboard'u

### Çoklu Para Birimi (CUR)

- [ ] **CUR-01**: EUR/TRY para birimi seçici + kullanıcı ülkesine göre varsayılan tespit
- [ ] **CUR-02**: Günlük ECB kur çekimi + Firestore önbellek (`fxRates` koleksiyonu)
- [ ] **CUR-03**: TRY baz fiyattan EUR gösterim fiyatı hesaplama
- [ ] **CUR-04**: Ödeme adımında 15 dakikalık kur kilitleme
- [ ] **CUR-05**: EUR ödemelerde Stripe `presentment_currency` kullanımı + otomatik settlement
- [ ] **CUR-06**: Ülke bazlı URL yönlendirme (`/tr` → TRY, `/en` → EUR)

### Sınır Ötesi Uyumluluk (CROSS)

- [ ] **CROSS-01**: Kategori bazlı HS (Harmonized System) kodu ataması
- [ ] **CROSS-02**: Hedef ülkeye göre ürün gönderim uygunluğu kontrolü
- [ ] **CROSS-03**: Stripe Tax ile otomatik KDV hesaplama (alıcı ülkesine göre)
- [ ] **CROSS-04**: Uluslararası siparişler için proforma/ticari fatura PDF'i
- [ ] **CROSS-05**: EU GPSR uyumluluğu — yetkili temsilci bilgisi, güvenlik dokümanı yükleme

### Satıcı Güvenliği & Dolandırıcılık Önleme (FRD)

- [ ] **FRD-01**: KYC kaydı sırasında telefon SMS OTP doğrulaması
- [ ] **FRD-02**: Vergi no / KDV numarası doğrulaması (EU için VIES, TR için format)
- [ ] **FRD-03**: Ürün onay kuyruğu — admin yeni ilanları yayınlanmadan önce inceler
- [ ] **FRD-04**: Şikayet/itiraz sistemi — alıcı bildirimi → admin inceleme → çözüm
- [ ] **FRD-05**: Satıcı güven puanı (mağaza sayfasında görünür)
- [ ] **FRD-06**: Sahte/tekrar ilan tespiti (görsel hash + satıcı yaşı + indirim oranı kuralları)

### Otomasyonlar (AUT)

- [ ] **AUT-01**: Sipariş tamamlandığında otomatik fatura PDF'i
- [ ] **AUT-02**: Sipariş onayı + kargo durumu e-postaları
- [ ] **AUT-03**: Satıcı onay/red bildirimi e-postası
- [ ] **AUT-04**: E-fatura entegrasyonu (Paraşüt/Logo API)
- [ ] **AUT-05**: Terk edilmiş sepet kurtarma e-posta serisi (1s, 24s, 72s)

### Canlı UAT Kapanışı (UAT)

- [ ] **UAT-01**: v1.0 UAT checklist uygulaması (ödeme/3DS, kargo, iade)
- [ ] **UAT-02**: Playwright E2E checkout testleri koşumu
- [ ] **UAT-03**: Gerçek Stripe test kartlarıyla misafir checkout doğrulaması

## Deferred to v3

- ML tabanlı sahte ilan tespiti (v2'de kural tabanlı)
- Direkt e-Belge entegrasyonu (v2'de Paraşüt/Logo API)
- Gerçek zamanlı kur takibi (v2'de günlük ECB)
- Tam KYB (Business verification)
- E-posta pazarlama platformu

## Out of Scope (v2.0)

| Feature                 | Reason                        |
| ----------------------- | ----------------------------- |
| B2B wholesale           | Önce B2C global sağlamlaşmalı |
| Native mobil uygulama   | PWA mevcut                    |
| Dinamik fiyatlandırma   | Sabit fiyatlandırma yeterli   |
| WMS / depo yönetimi     | Uzak hedef                    |
| Canlı chat / mesajlaşma | Düşük öncelik                 |

## Traceability

| Requirement | Phase    | Status  |
| ----------- | -------- | ------- |
| BUG-01      | Phase 12 | Pending |
| BUG-02      | Phase 12 | Pending |
| SRC-01      | Phase 12 | Pending |
| SRC-02      | Phase 12 | Pending |
| SRC-03      | Phase 12 | Pending |
| SRC-04      | Phase 12 | Pending |
| SRC-05      | Phase 12 | Pending |
| CUR-01      | Phase 13 | Pending |
| CUR-02      | Phase 13 | Pending |
| CUR-03      | Phase 13 | Pending |
| CUR-04      | Phase 13 | Pending |
| CUR-05      | Phase 13 | Pending |
| CUR-06      | Phase 13 | Pending |
| CROSS-01    | Phase 14 | Pending |
| CROSS-02    | Phase 14 | Pending |
| CROSS-03    | Phase 14 | Pending |
| CROSS-04    | Phase 14 | Pending |
| CROSS-05    | Phase 14 | Pending |
| FRD-01      | Phase 15 | Pending |
| FRD-02      | Phase 15 | Pending |
| FRD-03      | Phase 15 | Pending |
| FRD-04      | Phase 15 | Pending |
| FRD-05      | Phase 15 | Pending |
| FRD-06      | Phase 15 | Pending |
| AUT-01      | Phase 16 | Pending |
| AUT-02      | Phase 16 | Pending |
| AUT-03      | Phase 16 | Pending |
| AUT-04      | Phase 16 | Pending |
| AUT-05      | Phase 16 | Pending |
| UAT-01      | Phase 17 | Pending |
| UAT-02      | Phase 17 | Pending |
| UAT-03      | Phase 17 | Pending |

**Coverage:** 31 requirements, 31 mapped to phases (0 unmapped)

---

_Requirements defined: 2026-06-07 (v2.0 milestone). Informed by .planning/research/ and user input._
