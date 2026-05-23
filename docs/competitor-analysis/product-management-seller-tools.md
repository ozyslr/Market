# Rakip Analizi: Urun Yonetimi ve Satici Araclari

## 1. Etsy — Urun Yonetimi Ozeti

### Urun Listeleme
- **Fotograf:** Minimum 1, maksimum 10 fotograf. 2000px onerilen genislik, 72 DPI. Beyaz fon onerilir. Video destegi (5-15 sn, MP4/MOV, 100MB max).
- **Varyantlar:** 2 ozellige kadar (ornegin renk ve beden). Her varyant icin fiyat, stok ve SKU ayri belirtilebilir.
- **SEO:** 140 karakter baslik, 13 etiket (20 karakter), kategori + alt kategori. Attribute-based filtreleme.
- **Listeleme kalite puani (Listing Quality Score):** Fotograf kalitesi, SEO uyumu, teslimat suresi, iade politikasina gore puanlama.

### Toplu Yukleme
- **CSV:** Etsy dahili CSV sablonu, "CSV Import" sayfasindan yuklenir. Hata raporu satir satir gosterir.
- **API:** Etsy Open API v3 ile tam entegrasyon (listing, inventory, shipping).
- **Varyant bulk:** CSV'de variant_sku, variant_price, variant_quantity kolonlari ile.
- **Yazilim entegrasyonu:** 3. parti araclar (Shopify, Linnworks, etc.) ile entegre calisir.

### Kategori ve SEO
- 300+ kategoriden olusan 3 seviyeli hiyerarsi.
- Tags (13 adet, 20 karakter) ve attributes (renk, malzeme, vb.) ile filtrasyon.
- Otomatik etiket onerisi (yapay zeka destekli).

### Satici Onboarding
- **Basvuru:** E-posta, sifre, magaza adi, ulke, para birimi.
- **Hesap dogrulama:** E-posta + telefon dogrulama.
- **Bilgi formu:** Kisisel bilgiler, banka hesabi ( Stripe / PayPal ), vergi numarasi (ABD icin SSN/ITIN).
- **Magaza acilisi:** Logo, banner, hakkimizda, iade politikasi, kargo politikalari.
- **Sure:** 1-3 gun (onay genelde 24 saat icinde).

### Satici Dashboard
- **Ana sayfa:** Siparisler, goruntulenmeler, favoriler, kazanc ozeti, grafikler.
- **Siparisler:** Filtreleme, yazdirma, kargo etiketi olusturma.
- **Istatistikler (Stats):** Goruntulenme, favori, satis sayisi, donusum orani, trafik kaynagi.
- **Reklam (Etsy Ads):** Butce belirleme, tiklama basina odeme.
- **Pattern (Kisisel Web Sitesi):** Etsy Pattern ile kendi domaininde magaza.
- **Finans:** Odemeler, ucretler, vergi raporlari.

### Stok ve Envanter
- Her varyant icin ayri stok. Dusuk stok uyarisi.
- "Sold out" durumunda otomatik gizleme.
- Stok senkronizasyonu (API ile 3. parti sistemler).

---

## 2. Amazon Handmade — Urun Yonetimi Ozeti

### Urun Listeleme
- **Fotograf:** Minimum 1, maksimum 9 (A+ Content ile 16). 1000px+ onerilen. Beyaz fon ZORUNLU (ana goruntu). 360 derece gorsel ve video destegi.
- **A+ Content:** Moduler icerik (metin, gorsel, karsilastirma tablosu). Markali hikaye anlatimi.
- **Varyasyon (Variations):** 2 boyuta kadar (renk, beden). Her varyasyon icin fiyat, stok, resim ayri.
- **Flat File:** Amazon Excel tabanli toplu yukleme.
- **Bulut yukleme (Cloud Upload):** FTP/HTTP ile toplu gorsel yukleme.

### Toplu Yukleme
- **Flat File (Excel):** Kategoriye ozel Excel sablonu (.xlsx). Hatasiz satirlari isler, hatali satirlari raporlar.
- **Feed API:** Amazon Marketplace Web Service (MWS) / SP-API ile otomatik feed gonderimi.
- **Inventory Loader:** Stok ve fiyat guncellemeleri icin ayri dosya.
- **Hata yonetimi:** Processing report (her feed icin ayri hata raporu, satir bazinda).

### Kategori ve Dogrulama
- **Handmade (El Yapimi) Dogrulama:** Basvuru asamasinda urunlerin fotograflari, yapim sureci aciklamasi, malzeme listesi.
- **Brand Registry:** Marka tescil zorunlulugu (ABD patent ofisi). Marka basvurusu onaylanmali.
- **Kategori Agaci:** Browse Tree Guide (BTG) ile derin kategori hiyerarsisi. Her kategori icin node ID.
- **Kisitli kategoriler:** Kuyum, yiyecek, icecek ek dogrulama gerektirir.

### Satici Onboarding
- **Amazon Handmade Basvuru:** Mevcut Amazon hesabi ile giris yapilir. "El yapimi" tanimina uygunluk beyani.
- **Uyelik ucreti:** $39.99/ay (Professional). Aylik ucretsiz (Individual) secenegi de var — urun basina $0.99 komisyon.
- **Dogrulama:** Kimlik (ehliyet/pasaport), vergi bilgileri, banka hesabi. 2-5 is gunu.
- **Brand Registry:** Marka tescil belgesi gerekiyor (opsiyonel ama onerilen).

### Satici Dashboard (Seller Central)
- **Ana sayfa:** Siparis, satis, kar ozeti, uyarilar, performans metrikleri.
- **Envanter yonetimi:** Manage Inventory, Manage FBA Inventory, Inventory Reports.
- **FBA (Fulfillment by Amazon):** Amazon deposuna urun gonderme, Amazon tarafindan kargolama. Depo stok seviyesi, nakliye etiketi, kabul durumu.
- **Reklam:** Sponsored Products, Sponsored Brands, Sponsored Display.
- **Performans:** Order Defect Rate (<%1), Cancellation Rate (<%2.5), Late Shipment Rate (<%4).
- **Business Reports:** Detayli satis ve trafik analizleri.

### Stok ve Envanter
- **FBA:** Amazon depolarinda stok. Otomatik yeniden stoklama uyarisi. Depo bolgesine gore stok dagilimi.
- **FBM:** Satici kendisi kargolar. Stok takibi Seller Central'da.
- **Low Inventory Fee (2024+):** Dusuk stoklu urunler icin ek ucret.
- **Remove/Discontinue:** Stok fazlasi veya durdurulan urunler icin imha/iade secenekleri.

---

## 3. Trendyol — Urun Yonetimi Ozeti

### Urun Listeleme
- **Urun girisi:** 1 ana gorsel + en az 1 yan gorsel. Onerilen cozunurluk 800x800px. JPEG/PNG, maksimum 5MB.
- **Ozel urun formati:** Giyimde renk/beden, elektrikte marka/model, vs.
- **Varyant:** Renk + beden birlikte kullanilabilir. Her varyasyon icin ayri stok, fiyat, barkod.
- **Barkod zorunlulugu:** Her urun icin GLOBAL Trade Item Number (GTIN / barkod).

### Toplu Yukleme
- **Excel:** Kategori bazli Excel sablonu (.xls/.xlsx). 24 saat icinde islenir, e-posta ile hata raporu.
- **API:** Trendyol Public API ile tam entegrasyon (urun, siparis, etiket, kargo).
- **Entegrator:** Pazaryeri entegratorleri (Iyzico, Ticimax, Softdata, vs.) ile tek panelden Trendyol + diger pazaryerleri yonetimi.
- **Tedarikci Panel:** Doblo, Excel ve API secenekleri.
- **Hata yonetimi:** Excel'de satir bazli hata aciklamasi (Turkce). Red sebebi ve duzeltme onerisi.

### Kategori ve Barkod
- **Kategori agaci:** 4 seviyeli hiyerarsi. Her kategori icin zorunlu ozellikler (marka, olcu, malzeme, vs.).
- **Barkod sistemi:** Her urun benzersiz GTIN/barkod. barkod + kategor = esiz urun tanimi.
- **Kategori atama:** Trendyol AI ile otomatik kategori onerisi.

### Satici Onboarding
- **Basvuru:** Trendyol'a satici basvurusu (online form). Vergi levhasi, imza sirkusu, iban.
- **Sozlesme:** Elektronik sozlesme imzalanir.
- **Magaza aktivasyonu:** Kategori secimi, logo, magaza adi.
- **Akademi (Egitim):** Trendyol Akademi — saticilar icin video egitimleri, webinarlar, dokumanlar.
- **Entegrasyon kurulumu:** API/entegrator baglantisi. Test ortaminda urun gonderimi.
- **Sure:** Vergi belgesi ve sozlesme sonrasi 3-7 gun.

### Satici Dashboard
- **Ana sayfa:** Siparis ozeti, satis grafigi, teslimat performansi, musteri memnuniyeti.
- **Urunler:** Urun listesi, toplu duzenleme, yeni urun ekle, varyant yonetimi.
- **Siparisler:** Filtreleme, kargo etiketi olusturma, toplu siparis isleme.
- **Entegrasyon:** API anahtari yonetimi, entegrator yonetimi, log goruntuleme.
- **Raporlar:** Satis raporu, stok raporu, urun performansi, PPC raporlari.
- **Pazaryeri reklam:** Trendyol Reklam (PPC). Butce, anahtar kelime, teklif yonetimi.
- **Finans:** Hesap ekstresi, komisyon raporlari, havale takibi.

### Stok ve Envanter
- **Gercek zamanli stok:** Her varyasyon bazinda stok. API ile anlik guncelleme.
- **Planli stok guncelleme:** XML/Excel ile periyodik guncelleme.
- **Stok uyarisi:** Dusuk stok bildirimi (e-posta, panel).
- **Coklu depo:** Birden fazla depodan stok yonetimi.

---

## 2. Karsilastirma Tablolari

### 2.1 Bulk Upload Karsilastirmasi

| Ozellik | Mercora | Etsy | Amazon Handmade | Trendyol |
|---------|---------|------|-----------------|----------|
| **Format destegi** | CSV, XML | CSV | Excel (Flat File) | Excel, API |
| **Satir sayisi** | Limitsiz (Firestore) | 10,000'e kadar | 50,000'e kadar | Excel 50K, API limitsiz |
| **Varyant destegi** | Variant kolonlari | CSV'de variant kolonu | ayrı flat file | Excel'de varyant satirlari |
| **AI esleme** | Gemini AI alan esleme | - | - | AI kategori onerisi |
| **XML feed** | Var (periyodik senkron) | API uzerinden | Feed API | XML + API |
| **Hata raporu** | Satir bazli hata listesi | Detayli hata raporu | Processing Report | E-posta ile hata raporu |
| **Otomatik senkron** | 15dk / 30dk / 1sa / Gunluk | API uzerinden | Scheduled Feed | Entegrator ile |
| **Sablon** | 22 sutunlu CSV | Etsy CSV sablonu | Kategori bazli Excel | Kategori bazli Excel |

### 2.2 Varyant Yonetimi Karsilastirmasi

| Ozellik | Mercora | Etsy | Amazon Handmade | Trendyol |
|---------|---------|------|-----------------|----------|
| **Varyant boyutu** | Sinirsiz (attributes) | 2 ozellik | 2 boyut | 2 ozellik (renk+beden) |
| **Fiyat farki** | Var (bagimsiz fiyat) | Var | Var - Price Variation | Var |
| **Stok farki** | Var | Var | Var | Var |
| **Gorsel farki** | imageIndex ile | Var | Var | Var |
| **Barkod** | barcode alani var | - | UPC/EAN zorunlu | GTIN zorunlu |
| **SKU** | Var | Var | Var | Var |
| **Varyant matrisi** | Sozluk tabanli (flexible) | Basit | Basit | Renk + Beden |

### 2.3 Kategori ve Filtreleme

| Ozellik | Mercora | Etsy | Amazon Handmade | Trendyol |
|---------|---------|------|-----------------|----------|
| **Kategori derinligi** | 3 seviye | 3 seviye | Derin (BTG) | 4 seviye |
| **Filtre attribute** | Evet (dynamic) | Attribute-based | Browse tree | Zorunlu attribute |
| **AI kategori** | - | - | - | Evet |
| **Alt grup** | Evet (subGroups) | Alt kategoriler | Node ID | Alt kategori + ozellik |

### 2.4 Satici Onboarding Karsilastirmasi

| Ozellik | Mercora | Etsy | Amazon Handmade | Trendyol |
|---------|---------|------|-----------------|----------|
| **Basvuru formu** | 2 asamali (kisisel + isletme) | Basit (eposta + magaza) | Profesyonel hesap | Vergi + sozlesme |
| **KYC/KYB** | KYC status alani (pending/verified/rejected) | E-posta + telefon | Kimlik + vergi | Vergi levhasi + imza |
| **Isletme bilgisi** | taxId, businessRegistration, website | Vergi bilgisi (ABD) | Vergi + banka hesabi | Vergi levhasi + IBAN |
| **Kategori secimi** | 12 kategori checkbox | Manuel | BTG secimi | Kategori bazli |
| **Deneyim bilgisi** | 4 seviye | - | - | - |
| **Satis hedefi** | 4 seviye ciro | - | - | - |
| **Admin onay** | Admin panelinde (approve/reject) | 24 saat otomatik | 2-5 gun | 3-7 gun |
| **Onboarding suresi** | 1-2 gun | 1-3 gun | 2-5 gun | 3-7 gun |

### 2.5 Satici Dashboard Karsilastirmasi

| Ozellik | Mercora | Etsy | Amazon | Trendyol |
|---------|---------|------|--------|----------|
| **Genel bakis** | KPI kartlari (satis, siparis, ziyaret) | Satis + trafik ozeti | Performans ozeti | Siparis + ciro |
| **Siparis yonetimi** | Var | Var | Var | Var |
| **Urun yonetimi** | Var (Inventory) | Var | Var (Manage Inventory) | Var |
| **Analitik** | Var (grafikli) | Stats | Business Reports | Rapor modulu |
| **Finans** | Var (odeme, bakiye) | Payments | Revenue + Expenses | Hesap ekstresi |
| **Reklam** | Promosyon status alani | Etsy Ads | Sponsored Products | Trendyol Reklam |
| **Kargo yonetimi** | Delivery info | Kargo etiketi | FBA/FBM | Kargo entegrasyonu |
| **Iade/Return** | Return policy alani | Var | Var | Var |
| **Urun kalite puani** | - | Listing Quality Score | - | Trendyol Puan |
| **Satici egitimi** | - | Seller Handbook | Seller University | Trendyol Akademi |
| **Toplu yukleme** | CSV + XML | CSV | Flat File + API | Excel + API |

---

## 3. Mercora ile Karsilastirma — Guclu ve Zayif Yonler

### Mercora'nin Guclu Yonleri
1. **Esnek urun modeli:** `attributes`, `variants`, `specifications` alanlariyla oldukca esnek. Sozluk tabanli varyant sistemi rakiplerden daha ozgur.
2. **CSV + XML + AI esleme:** Uc farkli yukleme yontemi. Gemini AI ile alan esleme rakiplerde yok.
3. **22 sutunlu CSV sablonu:** Teslimat, iade, HS kodu, SEO gibi ileri duzey alanlar rakiplerden daha kapsamli.
4. **XML feed ile periyodik senkron:** Planli feed guncellemesi Etsy ve Amazon'da benzeri olmayan ozellik.
5. **Kategori sistemi:** parentId/level tabanli, 3 seviyeli hiyerarsi, dynamic filterAttributes.

### Mercora'nin Eksikleri ve One Cikan Rakip Ozellikleri

| Eksik Ozellik | Rakip | Onem |
|---------------|-------|------|
| **Urun kalite puani / Listing quality score** | Etsy | CRITICAL |
| **Satici egitim platformu** | Trendyol Akademi | HIGH |
| **Video urun gosterme** | Etsy, Amazon | HIGH |
| **Reklam yonetimi paneli** | Amazon Sponsored, Etsy Ads | HIGH |
| **AI kategori onerisi** | Trendyol | HIGH |
| **A+ Content / Zengin urun icerigi** | Amazon | MEDIUM |
| **Barkod/GTIN zorunlulugu** | Trendyol, Amazon | MEDIUM |
| **360 derece urun gorseli** | Amazon | MEDIUM |
| **Coklu depo stok yonetimi** | Trendyol | MEDIUM |
| **API dokumantasyonu** | Etsy API v3, Amazon SP-API | MEDIUM |
| **Stok uyarisi/notification** | Trendyol | MEDIUM |
| **Otomatik etiket onerisi** | Etsy | LOW |
| **Etsy Pattern (kisisel magaza sitesi)** | Etsy | LOW |

---

## 4. Eksikler ve Oncelikli Oneriler

### PRIORITY 1 — Hizla Ekle (1-2 sprint)
1. **Listing Quality Score sistemi** — Urun kalite metrigi (gorsel kalitesi, SEO tamligi, teslimat politikasi). Etsy'den ilham al, saticilara dogru yonlendirme.

2. **AI kategori onerisi** — Trendyol ve Mercora mevcut Gemini altyapisiyla kolay entegre. Urun adi/aciklamasindan kategori tahmini.

3. **Video urun gosterme** — MP4 yukleme/depolama destegi. Etsy ve Amazon'da standart.

### PRIORITY 2 — Rekabet Avantaji (3-4 sprint)
4. **Trendyol Akademi benzeri satici egitim modulu** — Video egitimler, dokumanlar, webinarlar. Satici basarisini dogrudan artirir.

5. **Reklam yonetimi paneli** — Saticilarin butce belirleyip PPC kampanyasi yonetecegi arayuz. `promotionStatus` alani mevcut ama panel yok.

6. **Barkod/GTIN zorunlulugu** — Urun esizligini ve katalog kalitesini artirir. Trendyol ve Amazon standarti.

### PRIORITY 3 — Orta Vade (5-6 sprint)
7. **A+ Content (zengin urun icerigi)** — Moduler icerik (gorsel, metin, tablo) ile premium urun deneyimi.

8. **Coklu depo stok yonetimi** — Stok dagilimi ve toplam stok goruntuleme.

9. **Stok uyarisi sistemi** — Dusuk stok bildirimleri (panel + e-posta + push).

10. **API dokumantasyonu ve public API** — 3. parti entegrasyonlar icin dokumante edilmis REST API.

### PRIORITY 4 — Uzun Vadeli
11. **360 derece urun gorseli** — premium kategori (kuyum, elektronik) icin farklilasma.

12. **Otomatik etiket onerisi** — Gemini AI ile mevcut altyapi uzerine kolay eklenir.

13. **Kisisel magaza web sitesi (Etsy Pattern benzeri)** — Farklilastirici, ama dusuk oncelik.

---

## Ozet Degerlendirme

Mercora, basit bulk upload (CSV/XML/AI), esnek varyant modeli ve kapsamli CSV sablonuyla rakiplerine karsi **iyi bir temel** olusturmus durumda. Ancak:

- **Listing Quality Score**, **video destegi** ve **AI kategori onerisi** gibi "olmazsa olmaz" ozellikler eksik.
- **Satici egitim platformu**, **reklam yonetimi** ve **barkod zorunlulugu** orta vadede gerekiyor.
- En buyuk eksik: **Listing Quality Score** (Etsy'deki gibi). Bu, saticilara dogru yonlendirme yaparak hem satici basarisini hem de platform kalitesini artirir.

Kaynak: Mercora kaynak kodu analizi (src/types.ts, src/pages/SellerImportCenter.tsx, src/pages/SellerInventory.tsx, src/pages/AdminCategories.tsx, src/pages/SellerApplication.tsx, src/lib/csvTemplate.ts, src/services/sellerApplicationService.ts vs.)
