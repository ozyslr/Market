# Requirements: Benim Olan (Mercora)

**Defined:** 2026-06-02
**Core Value:** Satıcıların KYC onayıyla mağaza açabildiği ve müşterilerin güvenli alışveriş yapabildiği eksiksiz pazar yeri

## v1 Requirements

### Ödeme ve Finans (PAY)

- [ ] **PAY-01**: Müşteri Iyzico ile TRY cinsinden 3D Secure ödeme yapabilir
- [ ] **PAY-02**: Müşteri Stripe ile EUR cinsinden 3D Secure ödeme yapabilir
- [ ] **PAY-03**: Platform ödemeyi escrow'da tutar, komisyon kesintisi sonrası satıcıya payout yapar
- [x] **PAY-04**: İade durumunda komisyon iadesi otomatik yapılır (reverse_transfer)
- [x] **PAY-05**: Webhook idempotency — aynı event tekrar gelirse çift işlem yapılmaz
- [x] **PAY-06**: Satıcı finansal dashboard — bakiye, bekleyen, ödenen tutarları görür

### Sipariş Yaşam Döngüsü (ORD)

- [ ] **ORD-01**: Sipariş durum makinesi: Pending → Processing → Shipped → Delivered (ve iptal/iade durumları)
- [ ] **ORD-02**: Çok satıcılı sepette siparişler OrderSet + SubOrder olarak bölünür
- [x] **ORD-03**: Satıcı sipariş durumunu güncelleyebilir (Processing → Shipped)
- [x] **ORD-04**: Müşteri siparişini canlı takip edebilir
- [x] **ORD-05**: Stok rezervasyonu — ödeme sırasında stok düşülür, iptalde geri eklenir
- [ ] **ORD-06**: Sipariş geçmişi ve detay sayfası

### Satıcı Yönetimi (SEL)

- [ ] **SEL-01**: Satıcı KYC onboarding — kimlik, vergi levhası, banka bilgisi yükleme
- [ ] **SEL-02**: Admin KYC inceleme ve onay/red paneli
- [ ] **SEL-03**: Satıcı mağaza sayfası — logo, banner, hakkında, ürünler
- [ ] **SEL-04**: Satıcı ürün yönetimi (ekleme, düzenleme, stok, fiyat)
- [ ] **SEL-05**: Satıcı CSV ile toplu ürün içe/dışa aktarma
- [ ] **SEL-06**: Satıcı REST API (mevcut) — geliştirilmiş endpoint'ler

### Komisyon ve Payout (COM)

- [ ] **COM-01**: Kategori bazlı değişken komisyon oranları (%5-20)
- [ ] **COM-02**: Komisyon motoru — satıcıya özel oran > kategori varsayılanı
- [ ] **COM-03**: Değişmez (immutable) işlem defteri — tüm komisyon ve payout kayıtları
- [x] **COM-04**: Otomatik payout zamanlaması (T+7 gün)
- [x] **COM-05**: Satıcı payout geçmişi ve bekleyen bakiye görüntüleme

### Hukuki Uyum (CMP)

- [ ] **CMP-01**: KVKK cookie consent banner — kategori bazlı onay (zorunlu/analitik/pazarlama)
- [ ] **CMP-02**: GDPR uyumluluk — EU kullanıcıları için ayrı consent akışı
- [ ] **CMP-03**: Kullanıcı veri silme talebi akışı (KVKK Madde 7)
- [ ] **CMP-04**: Gizlilik politikası ve kullanıcı sözleşmesi sayfaları
- [ ] **CMP-05**: VERBIS kayıt bilgisi ve KVKK aydınlatma metni
- [ ] **CMP-06**: Firestore security rules — yetkisiz erişim engelleme

### Arama ve Keşif (SRC)

- [ ] **SRC-01**: Typesense ile tam metin arama — yazım hatası toleranslı
- [ ] **SRC-02**: Filtreleme — fiyat aralığı, kategori, marka, puan, kargo seçeneği
- [ ] **SRC-03**: Sıralama — en yeni, en çok satan, fiyat artan/azalan, puana göre
- [ ] **SRC-04**: Arama sonuçlarında ürün kartları — fotoğraf, fiyat, puan, satıcı
- [ ] **SRC-05**: Event-driven index güncelleme (ürün ekleme/güncelleme/silme)

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

- [ ] **REV-01**: Doğrulanmış alıcı rozeti — sadece satın alanlar yorum yapabilir
- [ ] **REV-02**: Fotoğraflı ürün değerlendirmesi
- [ ] **REV-03**: Satıcı puanı ve değerlendirme özeti
- [ ] **REV-04**: Satıcıya soru-cevap bölümü

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

| Requirement | Phase   | Status        |
| ----------- | ------- | ------------- |
| PAY-01      | Phase 2 | Pending       |
| PAY-02      | Phase 2 | Pending       |
| PAY-03      | Phase 2 | Pending       |
| PAY-04      | Phase 2 | Complete      |
| PAY-05      | Phase 2 | Complete      |
| PAY-06      | Phase 2 | Complete      |
| ORD-01      | Phase 1 | Pending       |
| ORD-02      | Phase 1 | Pending       |
| ORD-03      | Phase 2 | Complete      |
| ORD-04      | Phase 2 | Complete      |
| ORD-05      | Phase 2 | Complete      |
| ORD-06      | Phase 1 | Pending       |
| SEL-01      | Phase 3 | Pending       |
| SEL-02      | Phase 3 | Pending       |
| SEL-03      | Phase 3 | Pending       |
| SEL-04      | Phase 3 | Pending       |
| SEL-05      | Phase 3 | Pending       |
| SEL-06      | Phase 3 | Pending       |
| COM-01      | Phase 1 | Pending       |
| COM-02      | Phase 1 | Pending       |
| COM-03      | Phase 1 | Pending       |
| COM-04      | Phase 2 | Complete      |
| COM-05      | Phase 2 | Complete      |
| CMP-01      | Phase 1 | Pending       |
| CMP-02      | Phase 1 | Pending       |
| CMP-03      | Phase 1 | Pending       |
| CMP-04      | Phase 1 | Pending       |
| CMP-05      | Phase 1 | Pending       |
| CMP-06      | Phase 1 | Pending       |
| SRC-01      | Phase 4 | Pending       |
| SRC-02      | Phase 4 | Pending       |
| SRC-03      | Phase 4 | Pending       |
| SRC-04      | Phase 4 | Pending       |
| SRC-05      | Phase 4 | Pending       |
| SHP-01      | Phase 5 | Complete      |
| SHP-02      | Phase 5 | Complete      |
| SHP-03      | Phase 5 | Complete      |
| SHP-04      | Phase 5 | Complete      |
| SHP-05      | Phase 5 | Complete      |
| CUR-01      | Phase 6 | Deferred (v2) |
| CUR-02      | Phase 6 | Deferred (v2) |
| CUR-03      | Phase 6 | Deferred (v2) |
| CUR-04      | Phase 6 | Deferred (v2) |
| REV-01      | Phase 7 | Pending       |
| REV-02      | Phase 7 | Pending       |
| REV-03      | Phase 7 | Pending       |
| REV-04      | Phase 7 | Pending       |
| NOT-01      | Phase 2 | Complete      |
| NOT-02      | Phase 2 | Complete      |
| NOT-03      | Phase 2 | Complete      |

**Coverage:**

- v1 requirements: 50 total
- Mapped to phases: 50
- Unmapped: 0 ✓

---

_Requirements defined: 2026-06-02_
_Last updated: 2026-06-02 after initial definition_
