# Requirements: Benim Olan (Mercora)

**Defined:** 2026-06-02
**Core Value:** Satıcıların KYC onayıyla mağaza açabildiği ve müşterilerin güvenli alışveriş yapabildiği eksiksiz pazar yeri

## v1 Requirements

### Ödeme ve Finans (PAY)

- [x] **PAY-01**: Müşteri Iyzico ile TRY cinsinden 3D Secure ödeme yapabilir _(UAT pending)_
- [x] **PAY-02**: Müşteri Stripe ile EUR cinsinden 3D Secure ödeme yapabilir _(UAT pending)_
- [x] **PAY-03**: Platform ödemeyi escrow'da tutar, komisyon kesintisi sonrası satıcıya payout yapar _(UAT pending)_
- [x] **PAY-04**: İade durumunda komisyon iadesi otomatik yapılır (reverse_transfer)
- [x] **PAY-05**: Webhook idempotency — aynı event tekrar gelirse çift işlem yapılmaz
- [x] **PAY-06**: Satıcı finansal dashboard — bakiye, bekleyen, ödenen tutarları görür

### Sipariş Yaşam Döngüsü (ORD)

- [x] **ORD-01**: Sipariş durum makinesi: Pending → Processing → Shipped → Delivered (ve iptal/iade durumları)
- [x] **ORD-02**: Çok satıcılı sepette siparişler OrderSet + SubOrder olarak bölünür
- [x] **ORD-03**: Satıcı sipariş durumunu güncelleyebilir (Processing → Shipped)
- [x] **ORD-04**: Müşteri siparişini canlı takip edebilir
- [x] **ORD-05**: Stok rezervasyonu — ödeme sırasında stok düşülür, iptalde geri eklenir
- [x] **ORD-06**: Sipariş geçmişi ve detay sayfası

### Satıcı Yönetimi (SEL)

- [x] **SEL-01**: Satıcı KYC onboarding — kimlik, vergi levhası, banka bilgisi yükleme
- [x] **SEL-02**: Admin KYC inceleme ve onay/red paneli
- [x] **SEL-03**: Satıcı mağaza sayfası — logo, banner, hakkında, ürünler
- [x] **SEL-04**: Satıcı ürün yönetimi (ekleme, düzenleme, stok, fiyat)
- [x] **SEL-05**: Satıcı CSV ile toplu ürün içe/dışa aktarma
- [x] **SEL-06**: Satıcı REST API (mevcut) — geliştirilmiş endpoint'ler

### Komisyon ve Payout (COM)

- [x] **COM-01**: Kategori bazlı değişken komisyon oranları (%5-20)
- [x] **COM-02**: Komisyon motoru — satıcıya özel oran > kategori varsayılanı
- [x] **COM-03**: Değişmez (immutable) işlem defteri — tüm komisyon ve payout kayıtları
- [x] **COM-04**: Otomatik payout zamanlaması (T+7 gün)
- [x] **COM-05**: Satıcı payout geçmişi ve bekleyen bakiye görüntüleme

### Hukuki Uyum (CMP)

- [x] **CMP-01**: KVKK cookie consent banner — kategori bazlı onay (zorunlu/analitik/pazarlama)
- [x] **CMP-02**: GDPR uyumluluk — EU kullanıcıları için ayrı consent akışı
- [x] **CMP-03**: Kullanıcı veri silme talebi akışı (KVKK Madde 7)
- [x] **CMP-04**: Gizlilik politikası ve kullanıcı sözleşmesi sayfaları
- [x] **CMP-05**: VERBIS kayıt bilgisi ve KVKK aydınlatma metni
- [x] **CMP-06**: Firestore security rules — yetkisiz erişim engelleme

### Arama ve Keşif (SRC)

- [ ] **SRC-01** _(rescoped to v2 — 2026-06-05; Typesense deferred for cost, v1 uses Firestore search)_: Typesense ile tam metin arama — yazım hatası toleranslı
- [x] **SRC-02**: Filtreleme — fiyat aralığı, kategori, marka, puan, kargo seçeneği (v1: Firestore, quick task 260604-e5f)
- [x] **SRC-03**: Sıralama — en yeni, en çok satan, fiyat artan/azalan, puana göre (v1: Firestore, quick task 260604-e5f)
- [x] **SRC-04**: Arama sonuçlarında ürün kartları — fotoğraf, fiyat, puan, satıcı (v1: Firestore, quick task 260604-e5f)
- [ ] **SRC-05** _(rescoped to v2 — 2026-06-05; depends on the search engine)_: Event-driven index güncelleme (ürün ekleme/güncelleme/silme)

### Kargo ve Lojistik (SHP)

- [x] **SHP-01**: Entegi API entegrasyonu — TR kargo firmaları tek endpoint'ten
- [x] **SHP-02**: EasyPost API entegrasyonu — EU kargo firmaları tek endpoint'ten
- [x] **SHP-03**: Kargo takip numarası ve canlı durum görüntüleme
- [x] **SHP-04**: Teslimat onayı ve gecikme bildirimi
- [x] **SHP-05**: İade talebi oluşturma ve takip akışı

### Çoklu Para Birimi (CUR)

- [ ] **CUR-01** _(deferred to v2 — 2026-06-04, TRY-only for now)_: Ürün fiyatları TRY bazlı saklanır, görüntüleme anında çevrilir
- [ ] **CUR-02** _(deferred to v2)_: Checkout anında kur kilitlenir (gezinme anında değil)
- [ ] **CUR-03** _(deferred to v2)_: TRY ve EUR cinsinden fiyat gösterimi
- [ ] **CUR-04** _(deferred to v2)_: Satıcıya her zaman TRY cinsinden ödeme yapılır

### Değerlendirme ve Güven (REV)

- [x] **REV-01**: Doğrulanmış alıcı rozeti — sadece satın alanlar yorum yapabilir
- [x] **REV-02**: Fotoğraflı ürün değerlendirmesi _(UAT pending)_
- [x] **REV-03**: Satıcı puanı ve değerlendirme özeti
- [x] **REV-04**: Satıcıya soru-cevap bölümü _(UAT pending)_

### Eposta ve Bildirim (NOT)

- [x] **NOT-01**: İşlemsel epostalar — sipariş onayı, kargo, teslimat, iade
- [x] **NOT-02**: Sepet terk hatırlatma epostası (mevcut geliştirildi)
- [x] **NOT-03**: Satıcıya yeni sipariş bildirimi

## v2 Requirements

### Sınır Ötesi Uyum (CROSS)

- **CROSS-01**: HS code otomatik öneri (ürün kategorisine göre)
- **CROSS-02**: Gümrük evrakı otomatik oluşturma
- **CROSS-03**: Toplam tahmini maliyet (ürün + kargo + vergi) gösterimi
- **CROSS-04**: EU GPSR (General Product Safety Regulation) etiket gereksinimleri

## Out of Scope

| Feature                                    | Reason                                                 |
| ------------------------------------------ | ------------------------------------------------------ |
| Çok satıcılı tek sepet (multi-vendor cart) | P2 — yüksek karmaşıklık, per-seller checkout ile başla |
| B2B wholesale modu                         | İşletmeden işletmeye satış şimdilik erken              |
| WMS depo yönetimi                          | Amazon FBA benzeri — faz 9+                            |
| Dinamik fiyatlandırma                      | Henüz yeterli veri yok                                 |
| Native mobil uygulama                      | Web öncelikli, PWA mevcut                              |
| Yapay zeka alışveriş asistanı              | P2 — önce temel pazar yeri çalışsın                    |
| Reklam platformu (sponsored products)      | P2 — yeterli satıcı/trafik yok                         |
| Canlı sohbet / mesajlaşma                  | E-ticarette düşük öncelik, admin isteğe bağlı açabilir |

## Traceability

| Requirement | Phase   | Status                                      |
| ----------- | ------- | ------------------------------------------- |
| PAY-01      | Phase 2 | Complete (UAT)                              |
| PAY-02      | Phase 2 | Complete (UAT)                              |
| PAY-03      | Phase 2 | Complete (UAT)                              |
| PAY-04      | Phase 2 | Complete                                    |
| PAY-05      | Phase 2 | Complete                                    |
| PAY-06      | Phase 2 | Complete                                    |
| ORD-01      | Phase 1 | Complete                                    |
| ORD-02      | Phase 1 | Complete                                    |
| ORD-03      | Phase 2 | Complete                                    |
| ORD-04      | Phase 2 | Complete                                    |
| ORD-05      | Phase 2 | Complete                                    |
| ORD-06      | Phase 1 | Complete                                    |
| SEL-01      | Phase 3 | Complete                                    |
| SEL-02      | Phase 3 | Complete                                    |
| SEL-03      | Phase 3 | Complete                                    |
| SEL-04      | Phase 3 | Complete                                    |
| SEL-05      | Phase 3 | Complete                                    |
| SEL-06      | Phase 3 | Complete                                    |
| COM-01      | Phase 1 | Complete                                    |
| COM-02      | Phase 1 | Complete                                    |
| COM-03      | Phase 1 | Complete                                    |
| COM-04      | Phase 2 | Complete                                    |
| COM-05      | Phase 2 | Complete                                    |
| CMP-01      | Phase 1 | Complete                                    |
| CMP-02      | Phase 1 | Complete                                    |
| CMP-03      | Phase 1 | Complete                                    |
| CMP-04      | Phase 1 | Complete                                    |
| CMP-05      | Phase 1 | Complete                                    |
| CMP-06      | Phase 1 | Complete                                    |
| SRC-01      | Phase 4 | Deferred (v2)                               |
| SRC-02      | Phase 4 | Complete (Firestore, quick task 260604-e5f) |
| SRC-03      | Phase 4 | Complete (Firestore, quick task 260604-e5f) |
| SRC-04      | Phase 4 | Complete (Firestore, quick task 260604-e5f) |
| SRC-05      | Phase 4 | Deferred (v2)                               |
| SHP-01      | Phase 5 | Complete                                    |
| SHP-02      | Phase 5 | Complete                                    |
| SHP-03      | Phase 5 | Complete                                    |
| SHP-04      | Phase 5 | Complete                                    |
| SHP-05      | Phase 5 | Complete                                    |
| CUR-01      | Phase 6 | Deferred (v2)                               |
| CUR-02      | Phase 6 | Deferred (v2)                               |
| CUR-03      | Phase 6 | Deferred (v2)                               |
| CUR-04      | Phase 6 | Deferred (v2)                               |
| REV-01      | Phase 7 | Complete                                    |
| REV-02      | Phase 7 | Complete (UAT)                              |
| REV-03      | Phase 7 | Complete                                    |
| REV-04      | Phase 7 | Complete (UAT)                              |
| NOT-01      | Phase 2 | Complete                                    |
| NOT-02      | Phase 2 | Complete                                    |
| NOT-03      | Phase 2 | Complete                                    |

**Coverage (reconciled 2026-06-05):**

- v1 requirements: 50 total
- Complete: 44 (of which 5 await live UAT sign-off: PAY-01/02/03, REV-02/04)
- Deferred to v2: 6 (CUR-01..04, SRC-01, SRC-05)
- Pending/unsatisfied: 0
- "Complete (UAT)" = code-complete + verified; live end-to-end user acceptance not yet performed.

---

_Requirements defined: 2026-06-02_
_Last updated: 2026-06-05 — reconciled against phase VERIFICATION/SUMMARY status during v1.0 milestone audit gap-closure_
