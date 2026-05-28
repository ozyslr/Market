# Benim Olan vs Trendyol vs Hepsiburada — Satıcı Platformu Karşılaştırması

> **Tarih:** 2026-05-28 | **Kapsam:** Satıcı paneli, ürün yönetimi, admin kontrolü, sistem senkronizasyonu

---

## 1. Ürün Yönetimi (Product Management)

| Özellik | Benim Olan | Trendyol | Hepsiburada |
|---|---|---|---|
| **Tekil ürün ekleme** | Var — `SellerInventory.tsx` + `ProductForm.tsx` | Var — gelişmiş form | Var — gelişmiş form |
| **Varyant yönetimi** | Var — SKU, fiyat, stok, özellik bazlı | Var — renk/beden depo kodu | Var — renk/beden depo kodu |
| **Toplu CSV import** | Var — PapaParse + alan eşleştirme + AI mapping | Var — Excel/CSV şablonlu | Var — Excel/CSV şablonlu |
| **XML/API feed** | Var — `SellerImportCenter.tsx` AI destekli | Var — Trendyol API entegrasyonu | Var — Hepsiburada API entegrasyonu |
| **Toplu ürün güncelleme** | Kısmi — batch approve/reject var, toplu fiyat/stok güncelleme yok | Var — toplu fiyat/stok güncelleme | Var — toplu fiyat/stok güncelleme |
| **Ürün onay moderasyonu** | Var — AdminProducts approve/reject | Var — otomatik + manuel | Var — otomatik + manuel |
| **Dijital ürün desteği** | Yok | Var (hediye kartı vb.) | Var (hediye kartı, kod) |
| **Ürün kopyalama** | Yok | Var | Var |
| **Görsel yönetimi** | Temel — tek görsel yükleme | Gelişmiş — çoklu görsel, video, 360° | Gelişmiş — çoklu görsel, video |

**Skor:** Benim Olan: 5/9 | Trendyol: 9/9 | Hepsiburada: 9/9

---

## 2. Sipariş Yönetimi (Order Management)

| Özellik | Benim Olan | Trendyol | Hepsiburada |
|---|---|---|---|
| **Sipariş listesi/filtreleme** | Var — `SellerOrders.tsx` durum filtreli | Var | Var |
| **Sipariş durum güncelleme** | Var — pending/shipped/delivered | Var — detaylı durum akışı | Var — detaylı durum akışı |
| **Toplu sipariş işleme** | Yok | Var — toplu kargo onayı | Var — toplu kargo onayı |
| **Kargo entegrasyonu** | Manuel — kargo firması seçimi + takip no | Otomatik — Trendyol Express, entegre kargo | Otomatik — HepsiJet, entegre kargo |
| **Fatura kesme** | Yok — sadece sipariş emaili | Var — e-fatura entegrasyonu | Var — e-fatura entegrasyonu |
| **İptal/İade yönetimi** | Var — `SellerOrders.tsx` return onay/red | Var — otomatik iade kodu | Var — otomatik iade kodu |
| **Kısmi iptal/iade** | Yok | Var | Var |
| **Sipariş notları** | Yok | Var — satıcı/admin notları | Var — satıcı/admin notları |

**Skor:** Benim Olan: 4/8 | Trendyol: 8/8 | Hepsiburada: 8/8

---

## 3. Fiyatlandırma & Promosyon (Pricing & Promotions)

| Özellik | Benim Olan | Trendyol | Hepsiburada |
|---|---|---|---|
| **Sabit fiyatlandırma** | Var | Var | Var |
| **Dinamik fiyatlandırma** | Var — `SellerPricing.tsx` stok/zaman/talep bazlı kurallar | Var — rakip fiyat takibi + otomatik | Var — rakip fiyat takibi + otomatik |
| **Kampanya yönetimi** | Var — `AdminCampaigns.tsx` indirim/tarih/hedef | Var — çok gelişmiş | Var — çok gelişmiş |
| **Kupon/kod yönetimi** | Var — `AdminCoupons.tsx` % veya sabit indirim | Var | Var |
| **Flash indirim** | Var — CMS üzerinden | Var — "Fırsat Ürünleri" | Var — "Bugün Ne Alınır" |
| **Sepet kampanyaları** | Yok | Var — sepette indirim, hediye ürün | Var — sepette indirim |
| **Sadakat programı** | Yok | Var — Trendyol Elite | Var — Hepsiburada Premium |
| **Satıcı bazlı komisyon** | Var — `AdminSellers.tsx` komisyon kuralları | Var — kategori bazlı % | Var — kategori bazlı % |
| **Satıcı kuponu oluşturma** | Yok — sadece admin | Var | Var |

**Skor:** Benim Olan: 5/9 | Trendyol: 9/9 | Hepsiburada: 9/9

---

## 4. Kargo & Lojistik (Shipping & Logistics)

| Özellik | Benim Olan | Trendyol | Hepsiburada |
|---|---|---|---|
| **Kargo firması seçimi** | Var — PTT/Yurtici/Aras/MNG/Surat/FedEx/UPS | Otomatik | Otomatik |
| **Otomatik kargo atama** | Yok | Var — Trendyol Express | Var — HepsiJet |
| **Depo/fulfillment** | Yok | Var — Trendyol Depo | Var — Hepsiburada Depo |
| **Kargo takip** | Manuel — takip numarası | Otomatik — anlık takip | Otomatik — anlık takip |
| **Teslimat süresi tahmini** | Manuel — `SellerSettings.tsx` metin alanı | Otomatik — AI tahmin | Otomatik — AI tahmin |
| **Kargo şablonları** | Yok | Var — bölge bazlı | Var — bölge bazlı |
| **Satıcı kargo profili** | Var — `SellerStore.tsx` fulfillment health | Var | Var |

**Skor:** Benim Olan: 3/7 | Trendyol: 7/7 | Hepsiburada: 7/7

---

## 5. Mağaza Yönetimi (Store Management)

| Özellik | Benim Olan | Trendyol | Hepsiburada |
|---|---|---|---|
| **Mağaza sayfası** | Var — `SellerStore.tsx` genel vitrin | Var — özelleştirilebilir | Var — özelleştirilebilir |
| **Mağaza logosu/banner** | Var | Var | Var |
| **Mağaza açıklaması** | Var | Var | Var |
| **Takipçi sistemi** | Var — `FollowsContext` | Var | Var |
| **Satıcı puanı/rozet** | Var — `sellerRatingService.ts` bronze/silver/gold/platinum | Var — altın/platin rozet | Var — rozet sistemi |
| **Mağaza özelleştirme** | Yok — sabit tasarım | Var — banner, vitrin düzeni | Var — banner, vitrin düzeni |
| **Satıcı sertifikaları** | Var — `SellerCertificates.tsx` blockchain | Yok | Yok |

**Skor:** Benim Olan: 6/7 | Trendyol: 6/7 | Hepsiburada: 6/7

> Blockchain sertifikası ile **benzersiz farklılaşma** — rakiplerde yok.

---

## 6. Analitik & Raporlama (Analytics & Reporting)

| Özellik | Benim Olan | Trendyol | Hepsiburada |
|---|---|---|---|
| **Dashboard (KPI)** | Var — `SellerDashboard.tsx` gelir/sipariş/görüntüleme/dönüşüm | Var | Var |
| **Detaylı analitik** | Var — `SellerAnalytics.tsx` grafikler, segmentasyon | Var — çok gelişmiş | Var — çok gelişmiş |
| **Dönem filtreleme** | Var — 7g/30g/90g/1y | Var | Var |
| **Ürün performansı** | Var — gelir/adet/görüntüleme sıralı | Var | Var |
| **Müşteri analizi** | Var — tekil müşteri, tekrar oranı, iade oranı | Var | Var |
| **Rakip analizi** | Yok | Var — fiyat/pozisyon | Var — fiyat/pozisyon |
| **CSV export** | Var — `AdminReports.tsx` | Var | Var |
| **Cihaz kırılımı** | Var — mobil/masaüstü/tablet | Var | Var |

**Skor:** Benim Olan: 7/8 | Trendyol: 8/8 | Hepsiburada: 8/8

---

## 7. Finans & Ödeme (Financial)

| Özellik | Benim Olan | Trendyol | Hepsiburada |
|---|---|---|---|
| **Ciro takibi** | Var — `SellerFinance.tsx` | Var | Var |
| **İşlem geçmişi** | Var | Var | Var |
| **Ödeme talebi** | Var — banka/iyzico/stripe | Otomatik — haftalık | Otomatik — haftalık |
| **Otomatik ödeme** | Yok — manuel talep | Var | Var |
| **Komisyon görüntüleme** | Var — `AdminFinance.tsx` hesaplama | Var — şeffaf | Var — şeffaf |
| **Fatura geçmişi** | Yok | Var — e-fatura | Var — e-fatura |
| **Vergi hesaplama** | Yok | Var — otomatik KDV | Var — otomatik KDV |

**Skor:** Benim Olan: 4/7 | Trendyol: 7/7 | Hepsiburada: 7/7

---

## 8. Satıcı Destek & Araçlar (Seller Support & Tools)

| Özellik | Benim Olan | Trendyol | Hepsiburada |
|---|---|---|---|
| **Canlı destek** | Var — `AdminChat.tsx` real-time chat | Var | Var |
| **Destek talebi** | Var — `AdminSupport.tsx` ticket sistemi | Var | Var |
| **Satıcı başvuru** | Var — `SellerApplication.tsx` çok adımlı | Var | Var |
| **Satıcı mobil uygulaması** | Yok | Var — Trendyol Satıcı | Var — Hepsiburada Satıcı |
| **API erişimi** | Yok — UI-only | Var — REST API | Var — REST API |
| **Feed yönetimi** | Var — XML/CSV/API feed + AI mapping | Var | Var |
| **Eğitim/dokümantasyon** | Yok | Var — Trendyol Akademi | Var — Hepsiburada Akademi |
| **Blockchain doğrulama** | Var — benzersiz | Yok | Yok |
| **Satıcı performans puanı** | Var — `sellerRatingService.ts` | Var | Var |

**Skor:** Benim Olan: 6/9 | Trendyol: 8/9 | Hepsiburada: 8/9

---

## 9. Admin Kontrol Paneli Aktiflik Değerlendirmesi

| Admin Sayfası | Durum | Gerçek Zamanlı? | Açıklama |
|---|---|---|---|
| **AdminDashboard** | Aktif | Hayır — mount'ta fetch | Ana KPI + grafikler |
| **AdminSellers** | Aktif | Hayır | Satıcı onay/red/askıya alma |
| **AdminSellerView** | Aktif | Hayır | Tek satıcı detay + performans |
| **AdminOrders** | Aktif | Hayır — manuel refresh | Sipariş durum güncelleme |
| **AdminProducts** | Aktif | Hayır | Ürün onay/red + öne çıkarma |
| **AdminCategories** | Aktif | Hayır | Kategori ağacı CRUD |
| **AdminFinance** | Aktif | Hayır | Platform cirosu/komisyon |
| **AdminUsers** | Aktif | Hayır | Kullanıcı yönetimi/ban |
| **AdminChat** | Aktif | **Evet — onSnapshot** | Canlı sohbet |
| **AdminCMS** | Aktif | Hayır | Anasayfa bölüm editorü |
| **AdminCoupons** | Aktif | Hayır | Kupon CRUD |
| **AdminCampaigns** | Aktif | Hayır | Kampanya CRUD |
| **AdminAnalytics** | Aktif | Hayır | Event bazlı analitik |
| **AdminReports** | Aktif | Hayır | CSV export |
| **AdminReturns** | Aktif | Hayır | İade onay/red |
| **AdminReviews** | Aktif | Hayır | Yorum moderasyonu |
| **AdminPayments** | Aktif | Hayır | Ödeme sağlayıcı konfigürasyonu |
| **AdminLanguages** | Aktif | Hayır | Çoklu dil yönetimi |
| **AdminSettings** | Aktif | Hayır | Site ayarları |
| **AdminSupport** | Aktif | Hayır — mount'ta fetch | Ticket yönetimi |

**Admin Paneli Özeti:**
- **20 admin sayfası** aktif olarak çalışıyor
- **Kapsam:** Satıcı yönetimi, ürün moderasyonu, sipariş, finans, kullanıcı, CMS, kupon/kampanya, analitik, iade, yorum, ödeme, dil, ayarlar, destek
- **Gerçek zamanlı:** Sadece `AdminChat` Firestore `onSnapshot` ile canlı
- **Eksikler:** Toplu işlem onayı, bildirim merkezi (admin için), log/audit takibi

---

## 10. Sistem Senkronizasyon Analizi

### Mevcut Durum

| Katman | Senkronizasyon Yöntemi | Değerlendirme |
|---|---|---|
| **Veritabanı** | Firestore (tek kaynak) | Tüm veriler Firestore'da — tek tutarlılık noktası |
| **Kimlik doğrulama** | Firebase Auth | Token bazlı, auth state listener ile senkron |
| **Sohbet** | `onSnapshot` gerçek zamanlı | Admin-satıcı chat CANLI |
| **Dashboard** | `setInterval` polling | Periyodik yenileme — gerçek zamanlı değil |
| **Siparişler** | İstek bazlı (mount'ta fetch) | Manuel refresh butonu var |
| **Ürünler** | İstek bazlı | Değişiklikler anında yansımaz |
| **Bildirimler** | İstek bazlı (mount'ta fetch) | Push notification yok — pull model |
| **Ödeme durumu** | Polling (IyzicoPayment) | 3DS sonucu için polling |

### Sync Eksiklikleri

| Eksik | Etki | Öncelik |
|---|---|---|
| Siparişlerde gerçek zamanlı güncelleme yok | Satıcı yeni siparişi sayfayı yenilemeden göremez | Yüksek |
| Stok senkronizasyonu anlık değil | Eş zamanlı satışlarda oversell riski | Yüksek |
| Bildirimler push değil | Kullanıcı anlık bilgilendirilmez | Orta |
| Admin dashboard'u canlı değil | Anlık metrik takibi yok | Düşük |
| WebSocket/PubSub yok | Gerçek zamanlı senkronizasyon altyapısı eksik | Yüksek |

### Sync Mimarisi Önerisi

```
Mevcut:  Firestore (tek kaynak) + onSnapshot (sadece chat) + polling (dashboard)
Hedef:   Firestore (tek kaynak) + onSnapshot (tüm kritik koleksiyonlar) + Cloud Messaging (push)
```

---

## 11. Detaylı Teknik Karşılaştırma (API & Altyapı)

| Özellik | Benim Olan | Trendyol | Hepsiburada |
|---|---|---|---|
| **REST API** | Yok — UI-only | Var — Basic Auth, 1000 ürün/istek, cursor pagination | Var — merchantId auth, IP whitelist |
| **Webhook desteği** | Yok | Var — full CRUD (create/update/delete/activate) | Belirsiz |
| **Rate limit (ürün)** | N/A | 1,000 req/dk | Belirsiz |
| **Rate limit (stok/fiyat)** | N/A | Limitsiz | Belirsiz |
| **Satıcı kademeleri** | Yok | 50K/75K/150K/350K/sınırsız SKU | Belirsiz |
| **Test ortamı (stage)** | Yok | Var — stage ortamı, test siparişleri | Yok |
| **Gerçek zamanlı bildirim** | Yok (sadece chat onSnapshot) | Var — webhook + anlık stok/fiyat | Kısmi |
| **Buybox/Öne çıkma** | Var — CMS feature toggles | Var — buybox API, rakip fiyat görünürlüğü | Var |
| **Batch işlem takibi** | Yok | Var — batch ID ile 4 saatlik sorgu penceresi | Yok |
| **E-fatura** | Yok | Var — sendInvoiceLink, uploadInvoiceFile | Var — e-fatura/e-arşiv |
| **Satıcı finansmanı** | Yok | Var — supplier financing, labor cost tracking | Yok |
| **Mikro ihracat** | Yok | Var — Mikro Ihracat programı | Var — Hepsiglobal |

### Trendyol Komisyon Yapısı (Referans)

| Kategori | Komisyon |
|---|---|
| Tekstil/Moda | %20-25 |
| Elektronik | %5-15 |
| Kozmetik/Kişisel Bakım | %10-20 |
| Ev & Yaşam | %15-20 |
| Spor & Outdoor | %12-18 |

**Ödeme vadesi:** Trendyol 14-45 gün | Hepsiburada ~30 gün | Benim Olan: manuel talep

### Sipariş Akışı Karşılaştırması

```
Trendyol:    Created → Picking → Invoiced → Shipped → Delivered
Hepsiburada: New → Picking → Invoiced → Packaged → Shipped → Delivered
             (Hepsiburada kargo etiketini oluşturur, satıcı sadece paketler)
Benim Olan:  pending → shipped → delivered
             (Satıcı manuel kargo seçimi + takip no girişi)
```

---

## 12. Genel Skor Tablosu

| Kategori | Benim Olan | Trendyol | Hepsiburada |
|---|---|---|---|
| Ürün Yönetimi | 5/9 (%56) | 9/9 (%100) | 9/9 (%100) |
| Sipariş Yönetimi | 4/8 (%50) | 8/8 (%100) | 8/8 (%100) |
| Fiyatlandırma & Promosyon | 5/9 (%56) | 9/9 (%100) | 9/9 (%100) |
| Kargo & Lojistik | 3/7 (%43) | 7/7 (%100) | 7/7 (%100) |
| Mağaza Yönetimi | 6/7 (%86) | 6/7 (%86) | 6/7 (%86) |
| Analitik & Raporlama | 7/8 (%88) | 8/8 (%100) | 8/8 (%100) |
| Finans & Ödeme | 4/7 (%57) | 7/7 (%100) | 7/7 (%100) |
| Satıcı Destek & Araçlar | 6/9 (%67) | 8/9 (%89) | 8/9 (%89) |
| Admin Kontrol Paneli | 18/20 (%90) | — | — |
| Gerçek Zamanlı Sync | 1/5 (%20) | 5/5 (%100) | 5/5 (%100) |
| **TOPLAM** | **49/84 (%58)** | **67/69 (%97)** | **67/69 (%97)** |

---

## 13. Kritik Eksikler & Aksiyon Planı

### P0 — Hemen Yapılmalı (Rekabet için şart)

| # | Eksik | Rakipler | Çözüm | Efor |
|---|---|---|---|---|
| 1 | **Gerçek zamanlı sipariş bildirimi** | Trendyol webhook ile anlık | `onSnapshot` ile canlı sipariş takibi | 2 gün |
| 2 | **Stok senkronizasyonu (atomic)** | Trendyol stok/fiyat limitsiz API | Firestore transaction + `increment` | 1 gün |
| 3 | **Toplu sipariş işleme** | Trendyol 1000'li batch | Toplu durum güncelleme UI + batch write | 2 gün |
| 4 | **Otomatik ödeme döngüsü** | Trendyol 14-45 gün, HB 30 gün | Scheduled cloud function ile haftalık payout | 2 gün |

### P1 — Bu Ay Yapılmalı

| # | Eksik | Rakipler | Çözüm | Efor |
|---|---|---|---|---|
| 5 | **Toplu ürün güncelleme (fiyat/stok)** | Trendyol 1000 SKU/istek | UI tablo + batch Firestore write | 2 gün |
| 6 | **Kargo API entegrasyonu** | HepsiJet/TEX otomatik | PTT/Yurtici/Aras API adaptörü | 5 gün |
| 7 | **E-fatura entegrasyonu** | Her ikisinde de var | E-fatura API (yasal zorunluluk) | 5 gün |
| 8 | **Satıcı kuponu oluşturma** | Her ikisinde de var | `SellerCoupons.tsx` + satıcı yetkisi | 2 gün |
| 9 | **İade/iade kodu otomasyonu** | Trendyol createClaim API | Otomatik iade kodu üretimi | 2 gün |
| 10 | **Satıcı performans dashboard** (satıcıya göster) | Trendyol/HB seller score | Mevcut `sellerRatingService` verisini UI'a taşı | 1 gün |

### P2 — Rekabet Avantajı İçin

| # | Eksik | Rakipler | Çözüm | Efor |
|---|---|---|---|---|
| 11 | **Satıcı REST API'si** | Trendyol tam API, HB kısmi | REST API endpoint'leri + API key yönetimi | 10 gün |
| 12 | **Webhook altyapısı** | Trendyol full CRUD webhook | Webhook kayıt + event tetikleme | 5 gün |
| 13 | **Sepet kampanyaları** | Her ikisinde de var | Sepet tutarına göre indirim/hediye kuralları | 3 gün |
| 14 | **Rakip fiyat analizi** | Trendyol buybox API | Kategori bazlı fiyat karşılaştırma raporu | 5 gün |
| 15 | **Satıcı mobil uygulaması** | Her ikisinde de var | Mevcut PWA'yı optimize et (offline-first) | 3 gün |
| 16 | **Satıcı kademe sistemi** | Trendyol 50K-sınırsız SKU | SKU/ciro bazlı kademelendirme | 3 gün |

---

## 14. Benzersiz Avantajlarımız (Rakiplerde Olmayan)

1. **Blockchain ürün sertifikası** (`SellerCertificates.tsx`) — sahteciliğe karşı
2. **AI destekli ürün feed eşleştirme** (`SellerImportCenter.tsx` Gemini entegrasyonu)
3. **AI görsel arama** (`visualSearchService.ts`) — fotoğrafla ürün bulma
4. **Dinamik fiyatlandırma motoru** (`SellerPricing.tsx`) — stok/zaman/talep bazlı
5. **Modern teknoloji yığını** — React + Firebase + Gemini AI
