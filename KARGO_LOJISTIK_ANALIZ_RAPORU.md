# Kargo & Lojistik Akış Analizi ve Karşılaştırması

**Tarih:** 24 Mayıs 2026  
**Kapsam:** Kargo şirketi entegrasyonu → Gönderim → Takip → Teslimat → Problemler  
**Analiz Platformları:** Trendyol | Hepsiburada | Amazon Türkiye | E-tic 2026

---

## 1. Kargo Şirketi Entegrasyonu

### Trendyol

**Entegre Şirketler:**
- Trendyol Express (TEX) - Default
- Aras Kargo
- PTT Kargo
- MNG Kargo
- Yurtiçi Kargo
- Sürat Kargo
- DHL eCommerce
- UPS
- Akman
- ByExpress
- CEVA
- Kolay Gelsin

**Otomasyon Seviyesi:** ✅ YÜKSEK
- Otomatik kargo kodu oluşturma
- Takip numarasının otomatik Trendyol'a yazılması
- API üzerinden kargo şirketi seçimi mümkün
- Massal label yazdırma desteği

**API Desteği:** ✅ GÜÇLÜ
- REST API tabanlı entegrasyon
- API Key ve Secret ile yetkilendirme
- Rate limiting ile korumalı
- Kargo firması listesi (getProviders) endpoint'i mevcut

**Fiyatlandırma Dinamikliği:** ✅ EVET
- 2026 Trendyol Express (TEX) başlangıç fiyatı: 77.54 TL (1 desi)
- PTT Kargo: 77.54 TL (1 desi)
- Aras Kargo: 83.93 TL + KDV (0-2 desi), 95.12 TL (3 desi)
- Desi/KG bazında dinamik fiyatlandırma
- Farklı kargo şirketi farklı fiyat seviyeleri

**E-tic 2026 Mevcut Durumu:**
- ⚠️ TAM UYGULAMA YOK
- Temel tracking numarası ve carrier bilgisi depolanabilir
- Massal kargo şirketi entegrasyonu eksik
- Dinamik fiyatlandırma sistemi yok

**Kritik Açıklar (GAP):**
1. Trendyol'un tüm kargo şirketi API'lerinin entegrasyonu gerekli
2. Otomatik kargo şirketi seçimi algoritması yok
3. Massal label yazdırma API'si uygulanmamış
4. Kargo maliyeti hesaplama ve dinamik fiyatlandırma sistemi yok
5. Müşteriye kargo seçeneği sunma mekanizması yok

---

### Hepsiburada

**Entegre Şirketler:**
- hepsiJET (Hepsiburada'nın kendi kargo hizmeti)
- Aras Kargo
- MNG Kargo
- Yurtiçi Kargo
- Sürat Kargo
- PTT Kargo
- Kolay Gelsin
- Sendeo

**Otomasyon Seviyesi:** ✅ YÜKSEK
- Fatura ve kargo etiketi otomatik oluşturma
- Tek seferde tekil/toplu yazdırma
- Sipariş durumu otomatik yönetimi (Paketlenecek → Gönderime Hazır → Kargoda → Teslim Edildi)
- Kargo barkodlarının toplu yazdırılması

**API Desteği:** ✅ GÜÇLÜ
- Developer API mevcuttur
- Sipariş entegrasyonu
- Kargo durumu güncelleme endpoint'leri
- Shipment creation otomasyonu

**Fiyatlandırma Dinamikliği:** ✅ EVET
- Desi bazında farklı fiyatlandırma
- Kargo şirketi bazında çeşitli ücretler
- 2026 fiyat listesi mevcuttur

**E-tic 2026 Mevcut Durumu:**
- ⚠️ TAM UYGULAMA YOK
- Temel tracking ve carrier bilgisi var
- Sipariş durumu yönetimi kısmen yapılır

**Kritik Açıklar (GAP):**
1. Hepsiburada API entegrasyonu uygulanmamış
2. Massal label yazdırma entegrasyonu yok
3. Otomatik durumu güncelleme mekanizması eksik
4. Müşteri tarafından kargo seçeneği sunma yok

---

### Amazon Türkiye

**Entegre Şirketler (Kolay Gönderi / Self-Ship):**
- MNG Kargo
- Kolay Gelsin
- **Desteklenen Şartlar:**
  - Maksimum 175cm kombinasyon (uzunluk+genişlik)
  - 30kg altı ürünler
  - Tehlikeli madde kategorisinde olamayan ürünler

**Otomasyon Seviyesi:** ✅ ORTA-YÜKSEK
- Amazon'un anlaşmalı fiyatlar
- Otomatik takip kodu oluşturma
- Sipariş durumu otomatik güncelleme
- Kolay Gelsin: Pickup time slot seçimi müşteriye sunulabilir

**API Desteği:** ✅ GÜÇLÜ
- Selling Partner API (SP-API)
- REST tabanlı
- Doğrudan Tüketiciye Kargo (DTK) yetkilendirmesi gerekli
- Vergi Faturalandırması rolü gerekli

**Fiyatlandırma Dinamikliği:** ✅ EVET
- Amazon'un anlaşmalı kargo fiyatları
- Desa-tabanlı hesaplama
- Kolay Gelsin ve MNG farklı fiyatlar

**E-tic 2026 Mevcut Durumu:**
- ❌ AMAZON ENTEGRASYONU HIÇBIR ŞEKILDE UYGULANMAMISH
- Marketplace olarak Amazon'a ihracat yapılmıyor

**Kritik Açıklar (GAP):**
1. Amazon SP-API entegrasyonu hiç yok
2. Kolay Gönderi entegrasyonu yok
3. MNG/Kolay Gelsin pickup scheduling yok
4. Amazon marketplace desteklenmiyor

---

### E-tic 2026 (Mevcut Durum)

**Entegre Kargo Şirketleri:** ❌ HIÇBIRI
- Sadece manuel olarak `carrier` ve `trackingNumber` bilgisi depolanabilir
- Gerçek kargo firması entegrasyonu yok

**Otomasyon Seviyesi:** ⚠️ ÇOOOOK DÜŞÜK (5% / 100)
- Kargo şirketi seçimi: Tamamen manuel
- Label yazdırma: Hiç otomatize yok
- Takip numarası: Manuel yazılması gerekli
- Durum güncelleme: Manuel güncelleme

**API Desteği:** ❌ YOK
- Hiçbir kargo firması API'si entegre değildir
- Kargo şirketi listesi sabit değildir

**Fiyatlandırma Dinamikliği:** ❌ YOK
- Sabit kargo fiyatı (36 TL gösterim örneği)
- Desi/KG bazında hesaplama yok
- Kargo şirketi bazında fiyatlandırma yok
- Müşteri seçiminde fiyat seçeneği yok

**Mevcut Sistem Yapısı:**
```typescript
interface Order {
  trackingNumber?: string;    // Manual girilecek
  carrier?: string;           // Manual seçilecek ("Aras", "PTT", etc.)
  shipping: number;           // Sabit fiyat (36 TL vb.)
  // ... diğer alanlar
}
```

**Aktif Taş Öğeler:**
1. OrderTracking.tsx - 5 kargo şirketi URL mapping'i var (PTT, Yurtiçi, Aras, MNG, Sürat)
2. AdminOrders.tsx - Sipariş yönetimi ama kargo yönetimi minimal

---

## 2. Gönderim Süreci & Otomasyonu

### Trendyol

**Özellikler:**
- Sipariş → Otomatik kargo fişi ve barkod oluşturma
- Depo personeli sadece paketler ve etiket yapıştırır
- Massal etiket yazdırma (batch label printing)
- Otomatik fatura oluşturma
- Farklı kargo şirketlerine otomatik yönlendirme

**İş Akışı:**
```
Sipariş Alındı → Otomatik Kargo Fişi → Barkod Yazdırılır → 
Paket Hazırlanır → Kargoya Verilir → Takip Numarası Otomatik Yazılır
```

**Minimum Kargo Şirketi Sayısı:** 3+ öneriş

---

### Hepsiburada

**Özellikler:**
- Paketlenecek → Gönderime Hazır → Kargoda → Teslim Edildi durumları
- Fatura ve etiket tek seferde yazdırılabilir
- Toplu barkod yazdırma
- E-arşiv/e-fatura otomatik

**İş Akışı:**
```
Sipariş Alındı → E-Fatura/E-Arşiv Otomatik → 
Paketlenecek Durumuna → Gönderime Hazır → 
Massal Label Yazdırma → Kargoya Verilir
```

---

### Amazon Türkiye

**Özellikler:**
- Seller Central üzerinden tamamen yönetilir
- Kolay Gelsin: Pickup slot seçimi ve otomatik pickup
- MNG: Manuel branch kontağı gerekli
- Otomatik takip kodu oluşturma

**İş Akışı:**
```
Sipariş Alındı → Seller Central'da Gönderim Oluştur → 
Kolay Gelsin: Pickup Slot Seç (otomatik) / MNG: Branch Ara → 
Takip Kodu Otomatik Oluştu → Teslimat Başladı
```

---

### E-tic 2026 (Mevcut)

**Özellikler:** ⚠️ MANUEL VE EKSIK
- Sipariş alındıktan sonra admin tarafından manuel olarak durumu güncellenir
- Kargo firması seçimi tamamen manuel
- Barkod yazdırma desteklenmiyor
- Otomatik fatura oluşturma yok

**İş Akışı:**
```
Sipariş Alındı → Admin Panelinde Durum Güncellenir (processing) → 
Admin Kargo Firması Seçer (manual) → Admin Tracking Numarası Girer → 
Admin Durum "shipped" olarak Günceller
```

**Sorunlar:**
1. İnsan hatası çok yüksek
2. Zaman alan manuel işlemler
3. Müşteriye otomatik bildirim sadece status değiştiğinde
4. Batch işlem hiç yok

---

## 3. Gerçek Zamanlı Takip (Real-Time Tracking)

### Trendyol

**Özellikleri:** ✅ GÜÇLÜ
- Müşteriler sitenin üzerinden takip yapabilir
- Takip numarası otomatik gönderilir (SMS/E-posta)
- Her kargo şirketi için farklı takip URL'ler
- Canlı GPS tracking (bazı kargo şirketleri)
- WhatsApp üzerinden takip (bazı durumlarda)

---

### Hepsiburada

**Özellikleri:** ✅ GÜÇLÜ
- Müşteri hesabında sipariş durumu canlı
- Entegre kargo şirketlerinden gerçek zamanlı bilgi
- Hepsiburada'nın kendi tracking sistemi
- Bildirim sistemi (SMS/E-posta/Push)

---

### Amazon Türkiye

**Özellikleri:** ✅ GÜÇLÜ
- Seller Central'da canlı durum
- Müşteriye otomatik takip linki gönderilir
- MNG/Kolay Gelsin'in tracking sayfası
- SMS bildirim (standart teslimat)
- Order status otomatik güncelleme

---

### E-tic 2026 (Mevcut)

**Özellikleri:** ⚠️ KISITLI
- Müşteri `/orders/{orderId}` sayfasında takip görebilir
- Tracking URL'ler hardcoded (PTT, Yurtiçi, Aras, MNG, Sürat)
- Takip numarası yoksa hiçbir link gösterilmez
- Gerçek zamanlı webhook desteği yok
- Kargo şirketi API'lerine canlı sorgu yok

**Yapı:**
```typescript
// OrderTracking.tsx içinde hardcoded URL'ler:
const map: Record<string, string> = {
  PTT: `https://gonderitakip.ptt.gov.tr/Track/Verify?q=${trackingNo}`,
  Yurtiçi: `https://www.yurticikargo.com/tr/online-islemler/gonderi-sorgula?code=${trackingNo}`,
  Aras: `https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${trackingNo}`,
  MNG: `https://www.mngkargo.com.tr/gonderi-sorgulama?trackNo=${trackingNo}`,
  Sürat: `https://www.suratkargo.com.tr/KargoTakip/index?trackingNo=${trackingNo}`,
};
```

**Açıklar:**
1. Kargo API'lerine canlı bağlantı yok
2. Webhook (webhook-push) desteklenmiyor
3. Sadece 5 kargo şirketi destekleniyor
4. Müşterinin tracking sayfasında canlı durum yok

---

## 4. Teslimat Seçenekleri & Müşteri Kontrolü

### Trendyol

**Müşteriye Sunulan Seçenekler:** ✅ YÜKSEK
- Kargo şirketi seçimi (ürün özellikleri bazında)
- Teslimat adresi seçimi
- Alternatif teslimat adresi (komşu, ofiş, kargo noktası)
- Teslimat gün ve saat tercihi (bazı kargo şirketleri)
- İmza gerekli mi gerekli değil mi seçimi
- Kargo noktasından teslim alma seçeneği (teslimat yöntemi)

**Dynamik Fiyatlandırma:**
- Seçilen kargo şirketi ve ürün ağırlığına göre fiyat değişir
- Müşteri farklı kargo seçeneklerini compare edebilir
- Fast shipping seçenekleri var

---

### Hepsiburada

**Müşteriye Sunulan Seçenekler:** ✅ YÜKSEK
- Kargo şirketi seçimi (bazı durumlarda)
- hepsiJET express seçeneği (hızlı teslimat)
- Teslimat adresi ve alternatif adres seçimi
- Teslimat gün/saat tercihi (mevcut ise)
- Randevulu teslimat seçeneği

**Dynamik Fiyatlandırma:**
- Seçilen kargo şirketi bazında değişir
- Express vs. Standard seçenekleri farklı fiyat
- Aynı gün teslimat (bazı şehirlerde)

---

### Amazon Türkiye

**Müşteriye Sunulan Seçenekler:** ✅ ORTA
- Kolay Gönderi: Pickup slot seçimi (Kolay Gelsin için)
- MNG: Branch pickup zamanı
- Teslimat adresi seçimi
- Prime vs. Standard teslimat (bazı durumlar)

**Dynamik Fiyatlandırma:**
- Ürün türüne göre shipping maliyeti
- Prime membership avantajları
- Ücretsiz kargo kuralları

---

### E-tic 2026 (Mevcut)

**Müşteriye Sunulan Seçenekler:** ⚠️ ÇOOOOK KISITLI
- ❌ Kargo şirketi seçimi YOK
- ❌ Teslimat gün/saat tercihi YOK
- ✅ Teslimat adresi seçimi VAR (ShippingAddress)
- ❌ Alternatif adres seçimi YOK
- ❌ Hızlı kargo seçeneği YOK

**Dynamik Fiyatlandırma:** ❌ YOK
- Sabit 36 TL kargo fiyatı
- Müşteri seçeneği hiç yok
- Ürün ağırlığı/desi bazında değişim yok

**Yapı:**
```typescript
interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;        // Alternatif adres sınırlı
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}
```

---

## 5. Problem Çözme & İade Kargo (Return Logistics)

### Trendyol

**İade Sistemi Özellikleri:** ✅ KAPSAMLI
- Otomatik iade talebine onay
- Iade kargo kodu otomatik gönderme
- Müşteri kendi cebinden iade etmeme (satıcı karşılıyor)
- Iade süreci tracking
- Hasar/Kayıp taleplerinin yönetimi
- Iade mallı ürünler otomatik stok güncelleme

**Sorun Yönetimi:** ✅ KAPSAMLI
- Hasar talebi: Müşteri fotoğraf gönderir, satıcı/Trendyol inceler
- Kayıp talephi: İade edilmediğini kargo şirketine sorgulanır
- Yanlış adrese gönderim: Iade süreçleri başlatılır
- Eksik ürün: Müşteri tarafı ve satıcı tarafı karşılaştırması
- Raporlama ve statistikler

---

### Hepsiburada

**İade Sistemi Özellikleri:** ✅ KAPSAMLI
- İade koşulları tanımlanabilir
- Müşteri iade başlatır, satıcı onaylar
- İade kargo bilgisi otomatik oluşturulur
- Geri dönüş tracking
- Iade tamamlandıktan sonra refund

**Sorun Yönetimi:** ✅ KAPSAMLI
- Hasar/Kayıp destek talepleri
- Müşteri hizmetleri tarafından mediation
- Satıcı-müşteri iş birliği
- Ödeme geri ödeme süreci

---

### Amazon Türkiye

**İade Sistemi Özellikleri:** ✅ KAPSAMLI
- Müşteri başlatır, 30 gün iade hakkı
- Üreticinin sorumluluk alanında (FBA için) vs. satıcı (merchant fulfilled)
- A-to-z güarantisi ile müşteri koruması
- Iade kargo bilgisi otomatik
- Iade takip sistemi

**Sorun Yönetimi:** ✅ KAPSAMLI
- A-to-z Guarantee claims
- Satıcı vs. Müşteri anlaşmazlıkları
- Amazon arbitration
- Refund otomasyonu

---

### E-tic 2026 (Mevcut)

**İade Sistemi:** ⚠️ ÇOOOOK EKSIK
- Status olarak `return_requested` ve `returned` var
- Otomatik iade kargo kodu YOK
- İade süreçleri manuel
- Müşteri-satıcı arasında iade müzakere mekanizması YOK
- Hasar/kayıp taleplerinin yönetimi YOK

**Sorun Yönetimi:** ❌ HIÇBIR SISTEM YOK
- Hasar talebi işlemesi yok
- Kayıp talephi işlemesi yok
- Yanlış adres yönetimi yok
- Kargo şirketi ile dispute yönetimi yok

**Mevcut Durum:**
```typescript
type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 
                   'delivered' | 'cancelled' | 'refunded' | 
                   'return_requested' | 'returned';
```

---

## 6. Lojistik Analytics & Raporlama

### Trendyol

**Raporlama Özellikleri:** ✅ YÜKSEK
- Kargo maliyeti raporları (şirkete göre)
- Teslimat süresi istatistikleri
- Hızlı kargo vs. Standard kargo karşılaştırması
- Müşteri memnuniyet skorları (kargo bazında)
- İade oranları
- Kargo şirketi başına masraf ve başarı oranları
- API üzerinden custom raporlar

---

### Hepsiburada

**Raporlama Özellikleri:** ✅ YÜKSEK
- Satıcı panelinde kargo masrafları
- hepsiJET vs. Diğer kargo şirketi karşılaştırması
- Teslimat başarı oranları
- İade istatistikleri
- Müşteri şikayetleri raporları

---

### Amazon Türkiye

**Raporlama Özellikleri:** ✅ ORTA
- Seller Central raporları
- Kargo maliyeti analizi
- Teslimat performans skoru
- A-to-z Guarantee claims analizi
- Return oranları

---

### E-tic 2026 (Mevcut)

**Raporlama Özellikleri:** ❌ HIÇBIR ŞEY YOK
- Kargo maliyeti analizi YOK
- Teslimat süresi takip YOK
- Kargo şirketi performans analizi YOK
- İade oranları YOK
- Müşteri memnuniyet bazı kargo YOK

---

## 7. Özet Karşılaştırma Tablosu

| **Özellik** | **Trendyol** | **Hepsiburada** | **Amazon TR** | **E-tic 2026** |
|-----------|------------|-------------|-----------|------------|
| **Kargo Şirketi Sayısı** | 12+ | 8+ | 2 (kolay gönderi) | 0 ✅ |
| **Otomasyonu** | ✅ Yüksek | ✅ Yüksek | ✅ Orta | ❌ Çok Düşük |
| **API Entegrasyonu** | ✅ Güçlü | ✅ Güçlü | ✅ Güçlü (SP-API) | ❌ Yok |
| **Massal Label Yazdırma** | ✅ Evet | ✅ Evet | ⚠️ Kısıtlı | ❌ Yok |
| **Gerçek Zamanlı Tracking** | ✅ Evet | ✅ Evet | ✅ Evet | ⚠️ Hardcoded Links |
| **Müşteri Kargo Seçimi** | ✅ Evet | ✅ Evet | ⚠️ Sınırlı | ❌ Hayır |
| **Dinamik Fiyatlandırma** | ✅ Evet | ✅ Evet | ✅ Evet | ❌ Sabit (36 TL) |
| **Ücretsiz Kargo Kuralları** | ✅ Evet | ✅ Evet | ✅ Evet | ❌ Hayır |
| **Hızlı Kargo Seçeneği** | ✅ Express | ✅ Express | ✅ Prime/Standard | ❌ Yok |
| **Alternatif Teslimat Adresi** | ✅ Evet | ✅ Evet | ⚠️ Sınırlı | ⚠️ Kısıtlı |
| **İade Otomasyonu** | ✅ Evet | ✅ Evet | ✅ Evet | ❌ Yok |
| **Hasar/Kayıp Yönetimi** | ✅ Evet | ✅ Evet | ✅ Evet (A-to-Z) | ❌ Yok |
| **Kargo Analytics** | ✅ Evet | ✅ Evet | ✅ Evet | ❌ Yok |
| **Satıcı Paneli Entegrasyonu** | ✅ Evet | ✅ Evet | ✅ Evet | ⚠️ Minimal |
| **Webhook/Canlı Güncellemeler** | ✅ Evet | ✅ Evet | ✅ Evet | ❌ Yok |

---

## 8. Mevcut Mimarisi Daha Derinli Analiz (E-tic 2026)

### Order Type Yapısı
```typescript
// src/types/order.ts
interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;           // Sabit 36 TL (hardcoded)
  tax: number;
  total: number;
  status: OrderStatus;        // pending → processing → shipped → delivered
  
  // KARGO KISMİ (çok eksik)
  trackingNumber?: string;    // Manuel girilecek
  carrier?: string;           // "Aras", "PTT", "MNG" vb. manuel
  shippedAt?: string;         // Manuel set
  
  // DİĞER
  shippingAddress: ShippingAddress;
  createdAt: string;
  updatedAt: string;
}

type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 
                   'delivered' | 'cancelled' | 'refunded' | 
                   'return_requested' | 'returned';
```

### Tracking Page'i
```typescript
// src/pages/OrderTracking.tsx
// - 5 kargo şirketi hardcoded URL
// - Müşteri sadece tracking linkini görür
// - Canlı durum sorgusu yok
```

### Admin Panel
```typescript
// src/pages/AdminOrders.tsx
// - Tüm siparişleri listeler
// - Status'ü dropdown'dan manuel olarak değiştirebilir
// - Kargo alanı yok (carrier, tracking vs.)
```

### Service Katmanı
```typescript
// src/services/orderService.ts
// - Firebase Firestore ile çalışır
// - updateOrderStatus() sadece status ve extra bilgisi günceller
// - Kargo-spesifik logic yok
```

---

## 9. Karşı Karşıya Olunan Sorunlar

### Operasyonel (İşletme) Sorunları

1. **Yüksek Manuel İş Yükü**
   - Kargo firması seçimi admin tarafından yapılmalı
   - Tracking numarası manual girilmeli
   - Status manuel güncellenebilir
   - Massal işlem imkansız

2. **Düşük Müşteri Deneyimi**
   - Müşteri kargo seçeneği sunamıyor
   - Teslimat gün/saat seçimi yok
   - Gerçek zamanlı tracking çok sınırlı
   - İade süreçleri hiç otomatize olmamış

3. **Maliyetlendirme Sorunu**
   - Sabit 36 TL kargo ücreti (realistik değil)
   - Ürün ağırlığı dikkate alınmıyor
   - Kargo şirketi bazında fiyat seçeneği yok
   - Müşteriye farklı kargo fiyatları sunulamıyor

4. **Performans ve İstatistik Eksikliği**
   - Kargo masrafları analiz edilemiyor
   - Teslimat başarı oranları takip yok
   - İade oranları bilinmiyor
   - Müşteri şikayetleri yönetilemiyor

### Teknik Sorunlar

1. **API Entegrasyonu Yok**
   - Trendyol, Hepsiburada, Amazon API'leri uygulanmamış
   - Kargo şirketi API'leri entegre edilmememiş
   - Webhook/webhook-push sistemi yok

2. **Veri Yapısı Eksikliği**
   - Kargo maliyeti detayları (desi, KG, mesafe vb.) yok
   - Kargo şirketi metadata yok
   - İade kargo bilgileri yok
   - Hasar/kayıp talep bilgileri yok

3. **UI/UX Eksikleri**
   - Müşteri checkout'ta kargo seçeneği yok
   - Admin kargo yönetimi interfacesi çok eksik
   - Tracking page çok temel
   - İade başlatma mekanizması yok

---

## 10. Öneriler (Prioritized Roadmap)

### FAZA 1 (Acil - 4 hafta) ⭐⭐⭐⭐⭐

**1. Temel Kargo Şirketi Entegrasyonu**
- [ ] Aras Kargo API entegrasyonu
- [ ] PTT Kargo API entegrasyonu
- [ ] MNG Kargo API entegrasyonu
- [ ] Yurtiçi Kargo API entegrasyonu

**2. Order Model Genişletme**
```typescript
interface CarrierOption {
  id: string;
  name: string;
  apiBaseUrl: string;
  estimatedDays: number;
  price: (weight: number, distance: string) => number;
  supportedRegions: string[];
}

interface OrderShipping {
  carrierId: string;
  trackingNumber: string;
  label?: string;          // PDF olarak depolanabilir
  weight: number;          // desi/KG
  estimatedDelivery: string;
  shippedAt?: string;
  deliveredAt?: string;
  carrierStatus?: string;  // Kargo şirketi tarafından retur
}
```

**3. Admin Kargo Paneli Oluşturma**
- [ ] Sipariş başına kargo şirketi seçimi
- [ ] Massal label yazdırma
- [ ] Tracking numarası otomatik alma
- [ ] Kargo durumu manuel güncelleme (fallback)
- [ ] Kargo takip history

**4. Müşteri Notification Sistemi**
- [ ] Kargo gönderildiğinde tracking numarası + link
- [ ] SMS/E-posta ile uyarı
- [ ] Push notification (PWA)
- [ ] WhatsApp integration (opsiyonel)

---

### FAZA 2 (Yüksek Öncelik - 6 hafta) ⭐⭐⭐⭐

**1. Checkout Dinamik Kargo Seçeneği**
- [ ] Müşteriye kargo şirketi seçimi sunma
- [ ] Ürün ağırlığına göre dinamik fiyat hesaplama
- [ ] Real-time fiyat gösterimi
- [ ] Teslimat süresi gösterimi
- [ ] Ücretsiz kargo kuralları uygulaması

**2. Advanced Tracking**
- [ ] Webhook/webhook-push altyapısı
- [ ] Kargo şirketlerinden gerçek zamanlı status sorgusu
- [ ] Tracking page'i zenginleştirme
- [ ] Müşteriye timeline gösterimi

**3. Return/İade Sistemi**
- [ ] İade talebinin başlatılması
- [ ] Otomatik iade kargo kodu oluşturma
- [ ] İade tracking
- [ ] Hasar/kayıp talep formu

**4. Admin Analytics Dashboard**
- [ ] Kargo maliyeti raporları
- [ ] Teslimat başarı oranları
- [ ] Kargo şirketi performans analizi
- [ ] İade istatistikleri

---

### FAZA 3 (Orta Öncelik - 8 hafta) ⭐⭐⭐

**1. Amazon Türkiye Entegrasyonu** (Eğer marketplace stratejine girmek planlanıyorsa)
- [ ] SP-API entegrasyonu
- [ ] Amazon Kolay Gönderi (MNG/Kolay Gelsin)
- [ ] Order senkronizasyonu
- [ ] Return handling

**2. Trendyol & Hepsiburada Marketplace Entegrasyonu**
- [ ] Trendyol API entegrasyonu (satıcı tarafı)
- [ ] Hepsiburada API entegrasyonu
- [ ] Order sync from marketplaces
- [ ] Inventory update
- [ ] Return/İade senkronizasyonu

**3. Advanced Features**
- [ ] Same-day delivery seçeneği (belirli şehirler)
- [ ] Scheduled delivery (gün+saat)
- [ ] Pickup point seçimi (kargo şirketi depo)
- [ ] Signature requirement
- [ ] Address change in-transit

**4. İade Otomasyonu Genişletme**
- [ ] Hasar değerleme formu
- [ ] Otomatik refund flow
- [ ] Return merchandise authorization (RMA)
- [ ] Reverse logistics tracking

---

### FAZA 4 (Gelecek - 10+ hafta) ⭐⭐

**1. AI-Powered Logistics**
- [ ] Otomatik kargo şirketi seçimi (ML algoritması)
- [ ] Maliyeti optimize etme
- [ ] Teslimat süresi tahminlemesi
- [ ] Hasar olasılığı tahminlemesi

**2. Lojistik Entegrasyon Platformu**
- [ ] 3PL (Third-Party Logistics) entegrasyonu
- [ ] Warehouse management sistemi
- [ ] Inventory forecasting
- [ ] Multi-warehouse support

**3. Sustainability**
- [ ] Carbon footprint tracking
- [ ] Eco-friendly shipping options
- [ ] Return packaging optimization

---

## 11. Teknik Implementasyon Notları

### Database Schema Genişletmesi
```typescript
// Kargo şirketi profili
db.collection('carriers').docs:
{
  id: 'aras_kargo',
  name: 'Aras Kargo',
  apiKey: '***',
  apiSecret: '***',
  isActive: true,
  regions: ['TR'],
  estimatedDays: 3,
  pricePerDesi: 8.50,
  minCharge: 15,
  supportedFeatures: ['webhook', 'label_api', 'tracking_api']
}

// Order shipping extension
db.collection('orders').docs:
{
  ...existing,
  shipping: {
    carrier: 'aras_kargo',
    price: 32.50,
    weight: 0.5,  // desi/KG
    trackingNumber: 'AR123456789',
    labelUrl: 'gs://...',  // PDF linki
    status: 'in_transit',
    history: [
      { status: 'picked_up', timestamp: '...', location: 'Istanbul' },
      { status: 'in_transit', timestamp: '...', location: 'Ankara' },
    ],
    estimatedDelivery: '2026-05-27',
    shippedAt: '2026-05-24',
    deliveredAt: null,
  }
}

// İade bilgileri
db.collection('returns').docs:
{
  id: 'RET123',
  orderId: 'ORD456',
  reason: 'damaged',
  requestedAt: '2026-05-25',
  approvedAt: '2026-05-25',
  returnCarrier: 'ptk_kargo',
  returnTrackingNumber: 'PT987654321',
  status: 'in_transit',  // pending, approved, shipped, received, refunded
  returnedAt: null,
  refundedAmount: 1299.00,
}
```

### API Service Katmanı
```typescript
// src/services/carrierService.ts
export async function getCarrierOptions(params: {
  weight: number;
  origin: string;
  destination: string;
  deadline?: string;
}): Promise<CarrierOption[]>

export async function createShipment(
  orderId: string,
  carrierId: string
): Promise<{ trackingNumber: string; labelUrl: string }>

export async function getTrackingStatus(
  carrier: string,
  trackingNumber: string
): Promise<TrackingEvent[]>

export async function createReturn(
  orderId: string,
  reason: string
): Promise<{ returnTrackingNumber: string }>
```

### UI Components
- `<CarrierSelector />` - Checkout'ta kargo seçimi
- `<ShippingCostEstimator />` - Fiyat gösterimi
- `<TrackingTimeline />` - Tracking page
- `<ReturnForm />` - İade başlatma
- `<CarrierAnalyticsDashboard />` - Admin analytics

---

## 12. Benchmark Metrikler (KPI)

| Metrik | Trendyol | Hepsiburada | Amazon | E-tic 2026 (Hedefe) |
|--------|----------|------------|--------|------------------|
| Kargo Entegrasyonu | 12+ | 8+ | 2 | 4+ → 8+ (Faza 2) |
| Otomasyonu | 90% | 85% | 80% | 5% → 80% (Faza 2) |
| Müşteri Teslimat Seçeneği | 100% | 95% | 70% | 0% → 90% (Faza 2) |
| Avg. Teslimat Süresi | 2-3 gün | 2-3 gün | 1-2 gün | 3-5 gün (optimize edilecek) |
| İade Başarı Oranı | 98% | 97% | 96% | 50% (manuel) → 95% (Faza 2) |
| Müşteri Memnuniyeti | 4.5/5 | 4.4/5 | 4.6/5 | 3.5/5 → 4.5/5 (hedef) |
| Kargo Masrafı Azalma | 15-20% | 12-18% | 10-15% | 0% → 20% (Faza 2) |

---

## 13. Risk ve Mitigasyon

| Risk | Olasılık | Etki | Mitigation |
|------|----------|------|------------|
| Kargo API'lerinin sınırlı/unstable olması | Yüksek | Yüksek | Fallback mekanizması, manual entry seçeneği |
| Kargo şirketinin fiyat listesi değişmesi | Yüksek | Orta | Weekly price sync, cache mechanism |
| Webhook'ları kaçırmak | Orta | Orta | Polling fallback, event re-delivery |
| Hatalı tracking data | Orta | Orta | Validation rules, manual verification |
| Hasar talepleri artması | Orta | Yüksek | Insurance partnerships, quality control |
| Müşteri şikayetleri | Yüksek | Orta | Support system, fast response |

---

## 14. Sonuç ve Özet

### E-tic 2026 Mevcut Durumu
- **Genel Lojistik Olgunluğu:** 5/100 (Çok Düşük)
- **Müşteri Deneyimi:** 3/100
- **Operasyonel Verimlilik:** 4/100
- **Veri ve Analytics:** 1/100

### İmmediat Action Items (Yapılması Gereken İlk İşler)

1. **Trendyol API entegrasyonu** - Pazardaki 30%+ kullanıcı
2. **Hepsiburada API entegrasyonu** - Pazardaki 25%+ kullanıcı
3. **Massal label yazdırma** - Operasyonel hız
4. **Müşteri kargo seçeneği** - Deneyim iyileştirme
5. **İade sistemi** - Customer satisfaction

### Beklenen Sonuçlar (Faza 2 Sonunda)
- Otomasyonu 5% → 80%
- Kargo entegrasyonu 0 → 4-8 şirkete
- Müşteri memnuniyet 3.5 → 4.2/5
- Kargo maliyetleri 15-20% azalma

### Tahmini Timeline
- **Faza 1 (Temel):** 4 hafta
- **Faza 2 (Yüksek Öncelik):** 6 hafta  
- **Faza 3 (Orta Öncelik):** 8 hafta
- **Faza 4 (Gelişmiş):** 10+ hafta

**Toplam:** ~24 hafta (6 ay) tam bitmesi için

---

## Kaynakça

1. [Trendyol Kargo Ücretleri 2026: Güncel Liste - Sentos](https://www.sentos.com.tr/trendyol-kargo-ucretleri-ve-kargo-entegrasyonu/)
2. [Entegrasyon Servislerine Genel Bakış - Developers Trendyol](https://developers.trendyol.com/docs/getting-started)
3. [Trendyol Entegrasyonu Nasıl Yapılır? 2026 API Rehberi - Moyduz](https://www.moyduz.com/blog/trendyol-entegrasyonu)
4. [Trendyol Kargo Şirketi Bilgileri - Developers Trendyol](https://developers.trendyol.com/en/urun-entegrasyonu/v2/trendyol-kargo-sirket-bilgileri)
5. [Hepsiburada Entegrasyonu - Sopyo](https://www.sopyo.com/blog/hepsiburada-api-entegrasyonu-nasil-yapilir)
6. [Hepsiburada Mağaza Entegrasyonu API Anahtarı - Shopside](https://shopside.io/hepsiburada-magaza-entegrasyonu-icin-api-anahtari/)
7. [Sipariş Entegrasyonu Önemli Bilgiler - Hepsiburada Developers](https://developers.hepsiburada.com/hepsiburada/reference/siparis-entegrasyonu-onemli-bilgiler)
8. [Amazon Self-Ship Süreçleri - Pobol API](https://pobolapi.com/destek-detay-Amazon-Self-Ship-Surecleri-Kargo-Entegrasyonu-ve-Otomasyon-Rehberi-130)
9. [Amazon Kolay Gönderi - Amazon Türkiye Satış](https://satis.amazon.com.tr/lojistik/kolay-gonderi)
10. [Amazon SP-API Entegrasyonu - Amazon Satış](https://satis.amazon.com.tr/ogrenin/satis-ortagi-api-entegrasyonu)
11. [Aras Kargo API Entegrasyonu - Full Entegre](https://fullentegre.com/tr/aras-kargo-api-entegrasyonu)
12. [Yurtiçi/MNG/Aras Kargo API Entegrasyonları - Ali Çınaroğlu](https://alicinaroglu.com/yurtici-mng-aras-kargo-api-entegrasyonlari/)
13. [E-Ticaret Kargo Entegrasyonu Rehberi 2026 - Kargo Entegrator](https://kargoentegrator.com/kargo-entegrasyonu-rehberi/)
14. [Kargo Takip Sistemi Nedir - Ticimax](https://www.ticimax.com/blog/kargo-takip-sistemi-nedir)
15. [E-Ticaret Kargo Yönetimi Rehberi - IDEASoft](https://www.ideasoft.com.tr/e-ticaret-icin-kargo-yonetimi-rehberi/)
16. [E-Ticarette Lojistik Süreçleri - Zeisoft](https://zeisoft.com/blog/e-ticarette-lojistik-surecleri/)
17. [E-Ticaret Kargo Problemleri ve Çözüm Süreçleri - CMR Soft](https://www.cmrsoft.com/e-ticaret-kargo-problemleri-ve-cozum-surecleri/)

---

**Rapor Hazırlayan:** Claude Code Agent  
**Tarih:** 24 Mayıs 2026  
**Versiyon:** 1.0  
**Durum:** Operasyonel Lojistik Ekibi İçin Hazır
