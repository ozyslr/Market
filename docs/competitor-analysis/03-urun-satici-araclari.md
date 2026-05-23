# Urun Yonetimi ve Satici Araclari Analizi
## Hepsiburada, Trendyol, Amazon Turkiye vs Mercora

**Tarih:** 2026-05-23
**Ajand No:** 3
**Kapsam:** Urun yukleme arayuzleri, varyant yonetimi, satici paneli, urun optimizasyonu, envanter yonetimi, kategori yonetimi, performans metrikleri, mobil uygulamalar, kalite kontrol

---

## 1. Giris

Bu rapor, Turkiye'nin en buyuk uc e-ticaret platformu olan **Hepsiburada**, **Trendyol** ve **Amazon Turkiye**'nin satici araclari ve urun yonetimi ozelliklerini Mercora ile karsilastirmaktadir. Amac, Mercora'nin mevcut durumunu rakipleri karsisinda konumlandirmak ve oncelikli gelistirme alanlarini belirlemektir.

---

## 2. Her Rakip icin Satici Araci Profili

### 2.1 Hepsiburada

**Urun Yukleme:**
- **Toplu Yukleme:** Excel (.xlsx) sablonu ile toplu urun yukleme destegi. Kategoriye ozel Excel sablonlari sunulur. Maksimum 10.000 satir.
- **API:** Hepsiburada Public API ile tam entegrasyon (urun, siparis, kargo, stok). REST tabanli, JSON formatinda.
- **Entegratorler:** Iyzico, Ticimax, Shopio, ikas gibi 20+ pazaryeri entegratoru ile dogrudan baglanti.
- **XML Feed:** XML feed destegi mevcut, periyodik guncelleme imkani.

**Varyant Yonetimi:**
- En fazla 3 varyant boyutu (renk, beden, ozellik).
- Her varyasyon icin ayri stok, fiyat ve barkod zorunlulugu.
- GTIN/Barkod zorunlulugu cogu kategoride.

**Satici Paneli (Hepsiburada Satis Ortagim):**
- **Dashboard:** Gunluk siparis, satis, ziyaret ve donusum metrikleri.
- **Urun Yonetimi:** Urun ekleme, duzenleme, toplu guncelleme, varyant yonetimi.
- **Siparis Yonetimi:** Filtreleme, kargo etiketi, toplu siparis isleme, irsaliye olusturma.
- **HBI Reklam:** PPC reklam yonetimi (butce, anahtar kelime, teklif).
- **Raporlar:** Satis raporu, stok raporu, musteri memnuniyeti, PPC performansi.
- **Finans:** Komisyon raporlari, havale takibi, KDV raporlari.

**Urun Optimizasyon Araclari:**
- **SEO Baslik Onerisi:** AI destekli baslik onerisi mevcut.
- **Anahtar Kelime:** PPC kampanyalari icin anahtar kelime arastirma araci.
- **Urun Kalite Skoru:** Gorsel kalitesi, baslik uygunlugu, kategori dogrulugu bazli puanlama.

**Envanter ve Stok:**
- Gercek zamanli stok guncelleme (API ile).
- Dusuk stok uyarisi (e-posta, panel bildirimi).
- Coklu depo destegi.
- Hepsiburada Lojistik (HbL) ile depo stok yonetimi.

**Kategori ve Esleme:**
- 5 seviyeli kategori hiyerarsisi.
- AI destekli otomatik kategori atama.
- Barkod bazli urun esleme (mevcut urunu bulma ve birebir esleme).
- Marka dogrulama ve Brand Registry.

**Satici Performans Metrikleri:**
- **Satis Performans:** Aylik siparis adedi, toplam ciro, birim fiyat ortalamasi.
- **Lojistik Performans:** Zamaninda kargolama orani, teslimat hizi.
- **Musteri Memnuniyeti:** Satici puanlamasi (1-5), yorum sayisi, iade orani.
- **Kalite Metrikleri:** Iptal orani, urun iade orani, musteri sikayet orani.
- **Seviye Sistemi:** Altin, Gumus, Bronz seviyeleri (komisyon avantaji saglar).

**Mobil Satici Uygulamasi:**
- Hepsiburada Satis Ortagim mobil uygulamasi (iOS/Android):
  - Siparis bildirimleri ve yonetimi.
  - Urun ekleme ve duzenleme.
  - Stok takibi ve guncelleme.
  - Anlik mesaj bildirimleri.
  - QR kod ile kargo takibi.

**Kalite Kontrol ve Moderasyon:**
- AI destekli otomatik urun moderasyonu (yasakli icerik, kalitesiz gorsel tespiti).
- Insan moderator ekibi ile catismali durumlarda manuel inceleme.
- 24 saat icinde inceleme taahhudu.
- Red sebebi ve duzeltme onerisi ile geri bildirim.

---

### 2.2 Trendyol

**Urun Yukleme:**
- **Toplu Yukleme:** Kategoriye ozel Excel sablonlari (.xlsx). 24 saat icinde islenir, e-posta ile hata raporu.
- **API:** Trendyol Public API (REST, JSON). Urun, siparis, kargo, etiket, iade islemleri.
- **Entegrator Pazaryeri:** Iyzico, Ticimax, Softdata, Shopio, ikas, Ideasoft gibi 30+ entegrator.
- **Tedarikci Panel:** Dogrudan panelden urun girisi, Excel ve API secenekleri.
- **XML Feed:** Sinirli XML destegi (genelde API tercih edilir).

**Varyant Yonetimi:**
- Renk + Beden birlikte kullanilabilir.
- Her varyasyon icin ayri stok, fiyat, barkod (GTIN zorunlu).
- Ozel urun formati: Giyimde renk/beden, elektronikte marka/model zorunlu attribute.
- **Varyant Grubu:** Ayni urunun farkli varyasyonlari tek urun altinda gruplanir.

**Satici Paneli (Trendyol Tedarikci Panel):**
- **Dashboard:** Siparis ozeti, satis grafigi, teslimat performansi, musteri memnuniyeti skoru.
- **Urunler:** Urun listesi, toplu duzenleme, yeni urun ekle, varyant yonetimi, urun kopyalama.
- **Siparisler:** Filtreleme (duruma gore), kargo etiketi olusturma, toplu siparis isleme, irsaliye.
- **Entegrasyon:** API anahtari yonetimi, entegrator yonetimi, log goruntuleme, hata ayiklama.
- **Raporlar:** Satis raporu, stok raporu, urun performansi, PPC raporlari, iade raporu.
- **Reklam:** Trendyol Reklam (PPC). Butce yonetimi, anahtar kelime, teklif, performans analizi.
- **Finans:** Hesap ekstresi, komisyon raporu, havale takibi, KDV raporu.
- **Akademi:** Trendyol Akademi (video egitimler, webinarlar, dokumanlar, canli destek).

**Urun Optimizasyon Araclari:**
- **AI Kategori Onerisi:** Urun adi ve aciklamasindan otomatik kategori atama.
- **SEO Baslik:** AI destekli baslik iyilestirme onerileri.
- **Anahtar Kelime:** Trendyol Reklam icin anahtar kelime aracı.
- **Trendyol Puan:** Urun ve satici bazinda kalite puani.

**Envanter ve Stok:**
- Gercek zamanli stok guncelleme (API, panel, Excel).
- Planli stok guncelleme (gunluk/haftalik Excel yuklemesi).
- Dusuk stok bildirimi (e-posta, panel bildirimi).
- Coklu depo yonetimi.
- Trendyol Lojistik (TL) entegrasyonu ile depo stoku.

**Kategori ve Esleme:**
- 4 seviyeli kategori hiyerarsisi.
- AI destekli otomatik kategori onerisi.
- Barkod ile eslesmis urun tespiti ve teklif verme imkani.
- Zorunlu kategorik attribute'lar (marka, olcu, malzeme vb.).

**Satici Performans Metrikleri:**
- **Trendyol Puan:** 0-100 arasi satici puani.
- **Musteri Memnuniyeti:** Siparis sonrasi musteri anketi (1-5).
- **Zamaninda Kargolama:** Geciken siparis orani.
- **Iade Orani:** Kategori bazinda karsilastirmali iade istatistigi.
- **Iptal Orani:** Satici kaynakli iptal orani.
- **Seviye Sistemi:** A+, A, B, C seviyeleri (komisyon avantaji, one cikarma).

**Mobil Satici Uygulamasi:**
- **Trendyol Tedarikci Mobil** (iOS/Android):
  - Anlik siparis bildirimleri.
  - Urun ekleme/duzenleme.
  - Stok guncelleme.
  - QR kod ile hizli kargo islemleri.
  - PPC kampanya yonetimi.
  - Mobil bildirimlerle uyarilar.

**Kalite Control ve Moderasyon:**
- AI + insan moderator hibrit sistemi.
- Otomatik gorsel kalite kontrolu (cozunurluk, fon, logo denetimi).
- Yasakli icerik taramasi (AI destekli).
- Maksimum 24 saat inceleme suresi.
- Acik red sebebi ve duzeltme yonlendirmesi.
- **Tekrar denetim:** Reddedilen urunlerin duzeltilip tekrar gonderimi.

---

### 2.3 Amazon Turkiye

**Urun Yukleme:**
- **Toplu Yukleme:** Kategoriye ozel Excel flat file (.xlsx/.xls/txt). Maksimum 50.000 satir.
- **API:** Amazon SP-API (Selling Partner API). REST tabanli, JSON/XML.
- **Feed API:** Planli feed gonderimi (stok, fiyat, urun bilgisi).
- **Flat File:** Inventory Loader, Price Loader, Listing Loader ayri dosyalar.
- **XML:** XML feed destegi (Amazon MWS uzerinden).
- **SKU zorunlulugu:** Her urun icin esiz satici SKU.

**Varyant Yonetimi:**
- Varyasyon (Variation Theme): 2 boyuta kadar (renk, beden, boyut).
- Her varyasyon icin ayri fiyat, stok, resim, UPC/EAN.
- **Varyasyon Matrisi:** Ayni urunun tum varyasyonlari tek listing altinda.
- **Parent-Child iliskisi:** Parent SKU (gosterilemez) + Child SKU'lar.

**Satici Paneli (Seller Central):**
- **Dashboard:** Siparis, satis, kar ozeti, uyarilar, performans metrikleri.
- **Envanter Yonetimi:** Manage Inventory, Manage FBA Inventory, Inventory Reports, Fix Stranded Inventory.
- **Siparis Yonetimi:** Filtreleme, kargo etiketi, toplu islem, iade yonetimi.
- **Reklam:** Sponsored Products, Sponsored Brands, Sponsored Display. Butce, anahtar kelime, teklif, ASIN targeting.
- **Raporlar:** Business Reports (satis, trafik, donusum), Inventory Reports, Tax Reports, Returns Reports.
- **Finans:** Revenue, expenses, FBA fees, advertising costs, tax documents.
- **A+ Content:** Moduler urun icerigi (gorsel, metin, karsilastirma tablosu). Premium A+ da var.
- **Brand Registry:** Marka tescili olan satıcilara ozel araclar (A+ Content, Sponsored Brands, Brand Analytics).

**Urun Optimizasyon Araclari:**
- **Listing Quality:** A+ Content onerileri, eksik alan uyarilari.
- **Anahtar Kelime:** Sponsored Products icin anahtar kelime onerisi, Search Query Performance.
- **Brand Analytics:** Rakiplik anahtar kelime analizi, demografik veriler.
- **Manage Experiments:** A/B test (baslik, gorsel) ile donusum optimizasyonu.
- **Automated Pricing:** Rakiplik fiyatlandirma (Buy Box kazanma stratejisi).

**Envanter ve Stok:**
- **FBA (Fulfillment by Amazon):** Amazon depolarinda stok, otomatik yeniden stoklama uyarisi.
- **FBM (Fulfillment by Merchant):** Satıci kendisi kargolar.
- **IPI Score:** Inventory Performance Index (depo kapasitesini belirler).
- **Low Inventory Fee (2024+):** Dusuk stoklu urunler icin ek ucret.
- **Remove/Discontinue:** Stok fazlasi urunler icin imha/iade secenekleri.
- **Multi-Channel Fulfillment:** FBA stogunu diger kanallardan satmak.

**Kategori ve Esleme:**
- Amazon Browse Tree Guide (BTG) ile derin kategori hiyerarsisi.
- Kategori Node ID sistemi.
- **Brand Registry:** Marka tescili zorunlu (bazi kategorilerde).
- **UPC/EAN/GTIN:** Cogunlukla zorunlu barkod.
- **Kisitli Kategoriler:** Kuyum, ilac, yiyecek ek dogrulama gerektirir.

**Satici Performans Metrikleri:**
- **Order Defect Rate (ODR):** %1'den dusuk olmali. (Musteri sikayetleri, kredi karti itirazlari, iade talepleri.)
- **Pre-fulfillment Cancel Rate:** %2.5'ten dusuk.
- **Late Shipment Rate:** %4'ten dusuk.
- **Valid Tracking Rate:** Kargo takip numarasi girme orani.
- **Customer Service Response Time:** 24 saat icinde yanit.
- **Feedback Manager:** Musteri yorumlari ve geri bildirim yonetimi.
- **Account Health Dashboard:** Tum metriklerin tek panelde goruntulenmesi. Yesil/sari/kirmizi uyarilar.

**Mobil Satici Uygulamasi:**
- **Amazon Seller App** (iOS/Android):
  - Anlik siparis bildirimleri.
  - Urun goruntuleme ve fiyat guncelleme.
  - Stok goruntuleme.
  - Musteri mesajlarina yanit verme.
  - FBA stok seviyesi ve sevkiyat goruntuleme.
  - Reklam kampanyasi yonetimi.

**Kalite Control ve Moderasyon:**
- AI destekli otomatik urun incelemesi (yasakli urun, telif hakki, kalite).
- ASIN bazli moderasyon (mevcut ASIN ile eslesme, kalite kontrol).
- **Image Compliance:** Ana gorsel beyaz fon zorunlulugu, 1000px+ cozunurluk.
- **Suppressed Listings:** Eksik bilgi nedeniyle bastirilmis listingler (gorunmez olur).
- **Appeal Process:** Reddedilen urunler icin itiraz mekanizmasi.
- **Transparency Program:** Urun takip ve sahtecilik onleme kodu.

---

## 3. Karsilastirma Matrisi

### 3.1 Urun Yukleme ve Bulk Upload

| Ozellik | Hepsiburada | Trendyol | Amazon TR | Mercora |
|---------|-------------|----------|-----------|---------|
| **CSV Yukleme** | Yok (Excel) | Yok (Excel) | Yok (Excel/txt) | **Var** |
| **Excel Yukleme** | Var | Var | Var (Flat File) | Yok |
| **XML Yukleme** | Var | Sinirli | Var (MWS) | **Var** |
| **API** | Hepsiburada API | Trendyol API | SP-API | Yok (Taslak) |
| **AI Alan Esleme** | Yok | Yok | Yok | **Var (Gemini)** |
| **Otomatik Senkron** | API ile | API/Entegrator | Feed API | 15dk/30dk/1sa/Gunluk |
| **Entegrator Destei** | 20+ | 30+ | Amazon Appstore | **4 "Yakinda"** |
| **Sablon** | Kategori bazli Excel | Kategori bazli Excel | Kategori bazli Flat File | 22 sutunlu CSV + XML |
| **Satir Siniri** | 10.000 | 50.000 (Excel) | 50.000 | Max 500 oneri |
| **Hata Raporu** | Satir bazli | E-posta ile | Processing Report | **Satir bazli anlik** |

### 3.2 Varyant Yonetimi

| Ozellik | Hepsiburada | Trendyol | Amazon TR | Mercora |
|---------|-------------|----------|-----------|---------|
| **Varyant Boyutu** | 3 ozellik | 2 ozellik (renk+beden) | 2 ozellik | **Sinirsiz** |
| **Bagimsiz Fiyat** | Var | Var | Var | Var |
| **Bagimsiz Stok** | Var | Var | Var | Var |
| **Gorsel Farki** | Var | Var | Var | Var (imageIndex) |
| **Barkod (GTIN)** | **Zorunlu** | **Zorunlu** | **Zorunlu (cogu)** | Opsiyonel |
| **SKU** | Zorunlu | Zorunlu | **Zorunlu** | Opsiyonel |
| **Parent-Child** | Var | Var (Varyant Grubu) | Var | Yok (esnek) |

### 3.3 Satici Paneli Ozellikleri

| Ozellik | Hepsiburada | Trendyol | Amazon TR | Mercora |
|---------|-------------|----------|-----------|---------|
| **Dashboard** | Var | Var | Var (Account Health) | Var (basit) |
| **Urun Yonetimi** | Var | Var | Var | Var (Import Center) |
| **Siparis Yonetimi** | Var | Var | Var | Var |
| **Kargo Etiketi** | Var | Var | Var (FBA/FBM) | Var (manuel) |
| **Toplu Siparis** | Var | Var | Var | Var (planli) |
| **Raporlar** | Kapsamli | Kapsamli | **Cok kapsamli** | Basit (mock) |
| **Reklam Yonetimi** | **Var (HBI)** | **Var** | **Var (Sponsored)** | **Yok** |
| **A+ Content** | Sinirli | Sinirli | **Var** | **Yok** |
| **Akademi/Egitim** | Hepsiburada Akademi | **Trendyol Akademi** | Seller University | **Yok** |
| **Finans** | Hesap ekstresi | Hesap ekstresi | Kapsamli | Bakiye + odenmis |

### 3.4 Urun Optimizasyon Araclari

| Ozellik | Hepsiburada | Trendyol | Amazon TR | Mercora |
|---------|-------------|----------|-----------|---------|
| **AI Kategori Onerisi** | Var | **Var** | Yok | **Yok** |
| **SEO Baslik Onerisi** | Var | **Var** | Sinirli | **Yok** |
| **Anahtar Kelime Araci** | Var (PPC) | Var (PPC) | **Var** (kapsamli) | **Yok** |
| **Urun Kalite Puani** | Var | **Var (Trendyol Puan)** | Listing Quality | **Yok** |
| **A/B Test** | Yok | Yok | **Var** | **Yok** |
| **Otomatik Fiyatlandirma** | Yok | Yok | **Var** | **Yok** |
| **Brand Analytics** | Sinirli | Sinirli | **Var** | **Yok** |

### 3.5 Envanter ve Stok Yonetimi

| Ozellik | Hepsiburada | Trendyol | Amazon TR | Mercora |
|---------|-------------|----------|-----------|---------|
| **Gercek Zamanli Stok** | Var (API) | Var (API) | Var (API) | Var (Firestore) |
| **Dusuk Stok Uyarisi** | Var | Var | **Var (+ ucret)** | **Yok** |
| **Coklu Depo** | **Var** | **Var** | **Var** (FBA) | **Yok** |
| **Lojistik Hizmeti** | HbL | TL | **FBA** | **Yok** |
| **Stok Raporu** | Var | Var | Var | **Yok** |
| **Toplu Stok Guncelleme** | Excel/API | Excel/API | Flat File/API | CSV/XML |

### 3.6 Kategori Yonetimi ve Urun Esleme

| Ozellik | Hepsiburada | Trendyol | Amazon TR | Mercora |
|---------|-------------|----------|-----------|---------|
| **Kategori Derinligi** | 5 seviye | 4 seviye | **Derin (BTG)** | 3 seviye |
| **AI Kategori Atama** | Var | **Var** | Yuksek (manuel) | **Yok** |
| **Barkod Esleme** | **Var** | **Var** | **Var** | **Yok** |
| **Marka Dogrulama** | Var | Var | **Brand Registry** | **Yok** |
| **Zorunlu Attribute** | Kategoriye gore | Kategoriye gore | **Kategoriye gore** | Tanimli degil |

### 3.7 Satici Performans Metrikleri

| Ozellik | Hepsiburada | Trendyol | Amazon TR | Mercora |
|---------|-------------|----------|-----------|---------|
| **Genel Puan** | 1-5 yildiz | **0-100 Puan** | **Account Health** | Bronze/Silver/Gold/Platinum |
| **Iptal Orani** | Var | Var | **%2.5 sinir** | Var (hesaplanir) |
| **Gecikme Orani** | Var | Var | **%4 sinir** | Var (hesaplanir) |
| **Iade Orani** | Var | Var | Var | Var (placeholder) |
| **Musteri Memnuniyeti** | Var | Var | **ODR <%1** | Var (yanit suresi) |
| **Seviye Sistemi** | Altin/Gumus/Bronz | A+/A/B/C | Yok (hesap health) | 4 seviyeli |
| **Account Health Dashboard** | Yok | Yok | **Var** | **Yok** |

### 3.8 Mobil Satici Uygulamalari

| Ozellik | Hepsiburada | Trendyol | Amazon TR | Mercora |
|---------|-------------|----------|-----------|---------|
| **Mobil Uygulama** | **Var (iOS/Android)** | **Var** | **Var** (Seller App) | **Yok** |
| **Siparis Bildirimi** | Var | Var | Var | Yok |
| **Urun Duzenleme** | Sinirli | Var | Var | Yok |
| **Stok Takibi** | Var | Var | Var | Yok |
| **Kargo QR** | Var | Var | Var | Yok |
| **Reklam Yonetimi** | Yok | Var | Var | Yok |

### 3.9 Urun Kalite Kontrol ve Moderasyon

| Ozellik | Hepsiburada | Trendyol | Amazon TR | Mercora |
|---------|-------------|----------|-----------|---------|
| **AI Otomatik Mod.** | Var | Var | **Var** | Kismi (status) |
| **Insan Moderator** | Var | Var | Var | Admin paneli |
| **Sure Siniri** | 24 saat | 24 saat | 24-48 saat | Bilinmiyor |
| **Image Compliance** | Var | Var | **Var (1000px, beyaz fon)** | **Yok** |
| **Red Sebebi Aciklama** | Var | **Var** | Var | Kismi |
| **Itiraz/Appeal** | Var | Var | Var | **Yok** |
| **Suppressed List.** | Yok | Yok | **Var** | **Yok** |

---

## 4. Mercora'nin Mevcut Durumu

### Mevcut Ozellikler (Kod Tabanindan Tespit Edilenler)

| Alan | Mevcut Durum | Detay |
|------|-------------|-------|
| **CSV Yukleme** | Tam | PapaParse ile CSV ayristirma, dogrulama, chunk-based upload (5'li gruplar) |
| **XML Feed** | Tam (temel) | XML feed URL, periyodik senkron (15dk/30dk/1sa/gunluk), feed opsiyonlari |
| **AI Alan Esleme** | Var | Gemini AI ile feed alani - sistem alani esleme |
| **Heuristic Esleme** | Var | 70+ alias ile otomatik eslestirme |
| **CSV Sablonu** | Var | 22 sutunlu kapsamli CSV sablonu |
| **XML Sablonu** | Var | Standart Mercora XML feed formati |
| **Dogrulama** | Var | Zorunlu alan kontrolu (title, price, stock, categoryId, description) |
| **Siparis Yonetimi** | Var | Filtreleme, kargoya verme (kargo firma secimi, takip no), sayfalama |
| **Iade Yonetimi** | Var | Iade onay/ret, durum takibi (requested-approve/reject-received-refunded) |
| **Satici Ayarlari** | Var | Magaza bilgisi, kargo/iade politikasi, teslimat suresi, odeme yontemi |
| **Admin Satici Yonetimi** | Var | KYC onay/ret, komisyon duzenleme, durum degistirme, basvuru yonetimi |
| **Admin Satici Detay** | Var | Performans puani, finansal metrikler, urun/siparis listesi |
| **Satici Basvurusu** | Var | Online basvuru formu, KYC status (pending/verified/rejected) |
| **Performans Puani** | Var | Bronze/Silver/Gold/Platinum, 0-100 weighted score |
| **Komisyon Sistemi** | Var | Kural tabanli komisyon, kategori override, seller override |
| **Odeme/Bakiye** | Var | Bakiye goruntuleme, para cekme talebi (bank transfer/PayPal) |
| **Bildirimler** | Var | Siparis durumu, moderasyon, odeme bildirimleri |
| **Urun Tipleri** | Var | `ProductVariant` tipi ile esnek varyant (sozluk tabanli attribute) |

### Eksik Olan Kritik Ozellikler

| Eksik Ozellik | Rakiplerde Durum | Etki |
|---------------|-----------------|------|
| **Excel yukleme** | Tum rakiplerde var | Yuksek - saticilar Excel kullanmaya aliskin |
| **Public API** | Tum rakiplerde var | Yuksek - entegrasyon icin olmazsa olmaz |
| **Reklam yonetimi paneli** | Tum rakiplerde var | Yuksek - satici geliri dogrudan etkiler |
| **Mobil uygulama** | Tum rakiplerde var | Yuksek - anlik bildirim ve yonetim |
| **Urun kalite puani** | Hepsiburada, Trendyol, Amazon'da var | Yuksek - satici davranisini yonlendirir |
| **AI kategori onerisi** | Hepsiburada, Trendyol'da var | Yuksek - onboarding deneyimini iyilestirir |
| **SEO baslik/anahtar kelime araci** | Tum rakiplerde var | Yuksek - urun gorunurlugu icin kritik |
| **Account Health Dashboard** | Amazon'da var | Orta - satici farkindaligi icin |
| **Coklu depo stok** | Tum rakiplerde var (kendi lojistik) | Orta - olceklendirme icin |
| **Barkod zorunlulugu/GTIN** | Tum rakiplerde var | Orta - katalog kalitesi icin |
| **Entegrator ekosistemi** | Tum rakiplerde 20+ entegrator | Orta - onboarding kolayligi |
| **A+ Content** | Amazon'da var | Dusuk - premium farklilastirma |
| **A/B Test** | Amazon'da var | Dusuk - ileri duzey optimizasyon |
| **Satici Akademisi** | Hepsiburada, Trendyol, Amazon'da var | Orta - satici basarisi icin |

---

## 5. Eksikler ve Oneriler

### P0 — Kritik (Hemen Eklenmeli)

#### 1. Satici Mobil Uygulamasi
**Gerekce:** Tum rakiplerde mevcut. Saticilarin anlik bildirim, hizli stok guncelleme, siparis takibi icin mobil erisme ihtiyaci kritik.
**Yapilacaklar:**
- React Native veya Flutter ile iOS/Android uygulamasi
- Anlik push notification (siparis, stok, iade)
- QR kod ile hizli kargo islemi
- Mobil urun ekleme ve stok guncelleme

#### 2. Public REST API
**Gerekce:** Entegrasyon olmadan olcekleme mumkun degil. Rakiplerin API'lari olmazsa olmaz.
**Yapilacaklar:**
- Dokumante edilmis REST API (urun, siparis, stok, kargo, iade endpoint'leri)
- API anahtari yonetimi paneli
- Rate limiting ve log goruntuleme
- Swagger/OpenAPI dokumantasyonu

#### 3. Reklam Yonetimi Paneli
**Gerekce:** Satici gelirini dogrudan etkiler. `promotionStatus` alani mevcut ama panel yok.
**Yapilacaklar:**
- Satici butce yonetimi (gunluk/aylik limit)
- PPC kampanya olusturma (urun bazli)
- Anahtar kelime oneri ve yonetimi
- Kampanya performans raporlari

### P1 — Yuksek Oncelik (Kisa Vade)

#### 4. AI Kategori Onerisi
**Gerekce:** Gemini altyapisi mevcut, kolay entegre edilir. Trendyol ve Hepsiburada'da var.
**Yapilacaklar:**
- Urun adi/aciklamasindan kategori tahmini
- Kategori oneri guven skoru gosterme
- Toplu yuklemede otomatik kategori atama

#### 5. SEO Baslik ve Anahtar Kelime Optimizasyon Araci
**Gerekce:** Urun gorunurlugu icin kritik. Tum rakiplerde mevcut.
**Yapilacaklar:**
- AI destekli baslik iyilestirme onerisi
- Anahtar kelime doluluk ve yogunluk analizi
- Eksik alan uyarilari (title uzunlugu, description kalitesi)

#### 6. Excel Yukleme Destei
**Gerekce:** Turkiye'de saticilar Excel kullanmaya aliskin. CSV yerine Excel tercih edilir.
**Yapilacaklar:**
- .xlsx/.xls dosya yukleme
- SheetReader ile sayfa bazli okuma
- Excel'den CSV'ye donusturme (mevcut altyapiyi kullan)

#### 7. Barkod/GTIN Zorunlulugu ve Esleme
**Gerekce:** Urun esizligi ve katalog kalitesi icin. Tum rakiplerde en azindan bir kategoride zorunlu.
**Yapilacaklar:**
- GTIN/Barkod alanini belirli kategorilerde zorunlu yapma
- Barkod bazli eslesmis urun tespiti
- Mevcut urune teklif verme sistemi

### P2 — Orta Vade

#### 8. Satici Akademisi / Egitim Platformu
**Gerekce:** Satici basarisini dogrudan etkiler. Tum rakiplerde mevcut.
**Yapilacaklar:**
- Video egitimler (onboarding, urun yukleme, optimizasyon)
- Webinar takvimi ve kayitlari
- Yardim merkezi / dokumantasyon
- Satici toplulugu forumu

#### 9. Account Health Dashboard
**Gerekce:** Satici farkindaligi ve proaktif duzeltme icin. Amazon'da en guclu ozelliklerden biri.
**Yapilacaklar:**
- Performans metrikleri tek panelde (yesil/sari/kirmizi)
- Hedef sinirlara ulasildiginda uyari
- Iyilestirme onerileri
- Trend grafikleri (7/30/90 gun)

#### 10. Urun Kalite Puani Sistemi
**Gerekce:** Satici davranisini yonlendirir. Trendyol Puan ve Etsy Listing Quality Score benzeri.
**Yapilacaklar:**
- Gorsel kalitesi, SEO tamligi, teslimat politikasina gore puan
- Satici bazinda kalite ortalamasi
- Iyilestirme onerileri ile yonlendirme
- Yuksek puanli urunlere arama avantaji

#### 11. Entegrator Programi
**Gerekce:** 3. parti entegrasyonlar olmadan olcekleme zor.
**Yapilacaklar:**
- Entegrator basvuru ve kayit sistemi
- API dokumantasyonu ve SDK
- Test ortami (sandbox)
- Entegrator log goruntuleme

#### 12. Coklu Depo ve Lojistik Entegrasyonu
**Gerekce:** Olceklenebilir satici operasyonu icin.
**Yapilacaklar:**
- Depo tanimi ve stok dagilimi
- Mercora Lojistik programi (opsiyonel)
- Stok transfer yonetimi

### P3 — Uzun Vade

#### 13. A/B Test Sistemi (Amazon Manage Experiments)
**Gerekce:** Ileri duzey urun optimizasyonu.

#### 14. A+ Content / Zengin Urun Icerigi
**Gerekce:** Premium urun deneyimi farklilastirmasi.

#### 15. Otomatik Fiyatlandirma (Buy Box Yarisi)
**Gerekce:** Buy Box mekanizmasi icin gerekli.

#### 16. Brand Registry Programi
**Gerekce:** Markali ureticiler icin one cikarma.

#### 17. Satici Pazaryeri (Appstore / Entegrator Market)
**Gerekce:** Ekosistem olusturmak icin.

---

## 6. Sonuc

Mercora, mevcut haliyle **Temel Seviye (Level 1)** bir satici platformu olarak degerlendirilebilir. CSV/XML yukleme, AI alan esleme, temel siparis ve iade yonetimi, performans puanlama gibi ozellikler iyi bir temel olusturuyor. Ancak rakiplerle rekabet edebilmek icin:

- **Kisa vadede (P0):** Mobil uygulama, public API ve reklam paneli eklenmeli. Bunlar olmadan satici kazanimi ve elde tutma mumkun degil.
- **Orta vadede (P1):** AI kategori onerisi, SEO araclari, Excel destegi ve barkod zorunlulugu ile katalog kalitesi ve satici deneyimi iyilestirilmeli.
- **Uzun vadede (P2-P3):** Satici akademisi, Account Health Dashboard, kalite puani sistemi ve entegrator programi ile platform olgunlastirilmali.

### Rakiplere Gore Mercora'nin Konumu

| Boyut | Mercora | Hepsiburada | Trendyol | Amazon TR |
|-------|---------|-------------|----------|-----------|
| **Yukleme Cesitliligi** | Orta (CSV+XML) | Yuksek | Yuksek | Yuksek |
| **AI Kullanimi** | Yuksek (Gemini) | Orta | Orta | Dusuk |
| **Satici Paneli** | Basit | Kapsamli | Kapsamli | **Cok Kapsamli** |
| **Optimizasyon Araclari** | Cok az | Orta | Orta | **Cok iyi** |
| **Mobil** | **Yok** | Var | Var | Var |
| **API/Entegrasyon** | **Yok** | Var | Var | Var |
| **Reklam** | **Yok** | Var | Var | Var |
| **Egitim** | **Yok** | Var | **Var** | Var |
| **Envanter** | Temel | Gelsmis | Gelsmis | **Cok Gelsmis** |

Mercora'nin en guclu yani **AI kullanimi** (Gemini ile alan esleme). Bu yetenek rakiplerde kapsamli olarak bulunmuyor. Bu avantaj, AI kategori onerisi, SEO baslik iyilestirme ve kalite puani gibi alanlarda da kullanilarak "AI-first seller platform" konumlandirmasi yapilabilir.

---

*Kaynak: Mercora kaynak kodu analizi (SellerImportCenter.tsx, SellerOrders.tsx, SellerSettings.tsx, AdminSellers.tsx, AdminSellerView.tsx, types.ts, sellerRatingService.ts, sellerPayoutService.ts, commissionService.ts, orderService.ts, returnService.ts, sellerApplicationService.ts) + sektor bilgisi.*
