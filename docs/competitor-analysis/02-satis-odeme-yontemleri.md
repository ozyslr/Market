# Satis Yontemleri ve Odeme Sistemleri Analizi

**Tarih:** 2026-05-23
**Ajan:** 2/8
**Rakipler:** Hepsiburada, Trendyol, Amazon Turkiye
**Karsilastirilan:** Mercora (mevcut durum)

---

## 1. Giris

Bu rapor, Turkiye e-ticaret pazarindaki uc buyuk rakip (Hepsiburada, Trendyol, Amazon Turkiye) ile Mercora'nin satis yontemleri ve odeme sistemlerini karsilastirmaktadir. Analiz, odeme yontemleri, taksit secenekleri, dijital cuzdan, para iade politikalari, guvenlik onlemleri ve satcilara odeme modellerini kapsamaktadir.

Mercora su anda **Iyzico** (Turkiye) ve **Stripe** (Global) olmak uzere iki odeme saglayicisi ile calismakta, ayrica manuel havale/EFT destegi sunmaktadir. Bilesik odeme altyapisi, rakiplerin cogundan daha esnek bir temel sunmakla birlikte, bircok modern odeme yontemi ve musteri deneyimi ozelligi eksiktir.

---

## 2. Her Rakip icin Odeme Altyapisi Profili

### 2.1 Hepsiburada

| Boyut | Detay |
|-------|-------|
| **Kredi Karti** | Visa, MasterCard, Amex, Troy |
| **Banka Karti (Debit)** | Var |
| **Kapida Odeme** | Var (nakit + kredi karti POS) |
| **Havale/EFT** | Var |
| **Hepsipay Cuzdan** | Var -- iade bakiyesi, kredi karti yukleme, market alisverisi |
| **Hediye Kartı** | Var (Hepsiburada Hediye Kartı) |
| **Apple Pay / Google Pay** | Var |
| **Taksit** | 2-12 ay arasi, bankaya gore degisir |
| **Taksit Yapılandırma** | Sepette otomatik taksit hesaplama, banka secimi |
| **Odeme Saglayicisi** | Kendi altyapisi (Hepsipay) + entegre bankalar |
| **3DS** | Zorunlu (3DS 2.0) |
| **Fraud Detection** | Hepsipay AI tabanli fraud engelleme |
| **Para Iade** | 7-14 is gunu, karta iade veya Hepsipay Cuzdan |
| **Iptal Politikası** | Kargolanmadiysa aninda iptal, kargodaysa iade akisi |
| **Saticiya Odeme** | Haftalik / aylik periyot, kesinti sonrasi |
| **Mobil Odeme** | Hepsipay mobil uygulama, tek dokunus |
| **Misafir Checkout** | Yok (uyelik zorunlu) |

### 2.2 Trendyol

| Boyut | Detay |
|-------|-------|
| **Kredi Karti** | Visa, MasterCard, Troy |
| **Banka Karti (Debit)** | Var |
| **Kapida Odeme** | Var -- nakit (~15-25 TL ek ucret) ve kredi karti POS (~30-40 TL ek ucret) |
| **Havale/EFT** | Var (manuel bildirim) |
| **Trendyol Cuzdan** | Var -- iade bakiyesi, kredi karti yukleme, bankaya transfer |
| **Hediye Kartı** | Var (Trendyol Hediye Kartı) |
| **Apple Pay / Google Pay** | Var |
| **Taksit** | 2-12 ay (secili bankalarda), 3-6 ay yaygin |
| **Taksit Yapılandırma** | Kategori bazli farkli taksit limiti, bankaya gore degisir |
| **Odeme Saglayicisi** | PayTR, Iyzico, kendi odeme altyapisi |
| **3DS** | Zorunlu |
| **Fraud Detection** | AI tabanli dolandiricilik tespiti |
| **Para Iade** | 3-7 is gunu, Trendyol Cuzdan'a otomatik veya karta iade |
| **Iptal Politikası** | 30 dk icinde ucretsiz iptal, sonrasi satici onayi |
| **Saticiya Odeme** | Haftada 2-3 kez, musteri teslim alinca |
| **Mobil Odeme** | Trendyol mobil uygulama, Google/Apple Pay, biyometrik onay |
| **Misafir Checkout** | Yok (hizli kayit: Google/Apple ile) |

### 2.3 Amazon Turkiye

| Boyut | Detay |
|-------|-------|
| **Kredi Karti** | Visa, MasterCard, Amex |
| **Banka Karti (Debit)** | Var |
| **Kapida Odeme** | Yok |
| **Havale/EFT** | Yok |
| **Hediye Kartı** | Var (Amazon.com.tr Hediye Ceki) |
| **Apple Pay / Google Pay** | Apple Pay var, Google Pay sinirli |
| **Taksit** | Amazon Monthly Payments (secili urunlerde 5-12 ay) |
| **Taksit Yapılandırma** | Amazon yonetimli, bankalar uzerinden |
| **Odeme Saglayicisi** | Kendi kuresel altyapisi |
| **3DS** | Zorunlu (SCA uyumlu) |
| **Fraud Detection** | Amazon AI (kuresel olcekte en gelismis) |
| **Para Iade** | Aninda veya 3-5 is gunu |
| **Iptal Politikası** | Kargolanmadiysa aninda iptal, Prime'da ucretsiz iade |
| **Saticiya Odeme** | 7-14 gun, teslimat sonrasi |
| **Mobil Odeme** | Amazon mobil app, 1-Click, Amazon Pay |
| **Misafir Checkout** | Yok (Amazon hesabi zorunlu) |

---

## 3. Karsilastirma Matrisi

### 3.1 Odeme Yontemleri Karsilastirmasi

| Odeme Yontemi | Hepsiburada | Trendyol | Amazon TR | **Mercora** |
|---------------|:-----------:|:--------:|:---------:|:-----------:|
| **Kredi Kartı** | Var | Var | Var | **Var** |
| **Banka Kartı (Debit)** | Var | Var | Var | **Var (Stripe)** |
| **Kapıda Ödeme (Nakit)** | Var | Var | Yok | **Yok** |
| **Kapıda Ödeme (KK POS)** | Var | Var | Yok | **Yok** |
| **Havale / EFT** | Var | Var | Yok | **Var (manuel)** |
| **Apple Pay** | Var | Var | Var | **Yok** |
| **Google Pay** | Var | Var | Sinirli | **Yok** |
| **Dijital Cuzdan** | Hepsipay | Trendyol Cuzdan | Hediye Ceki | **Yok** |
| **Hediye Kartı** | Var | Var | Var | **Yok** |
| **PayPal** | Yok | Yok | Yok | **Yok** |
| **BNPL (Klarna/Afterpay)** | Yok | Yok | Yok | **Yok** |

### 3.2 Taksit Secenekleri Karsilastirmasi

| Ozellik | Hepsiburada | Trendyol | Amazon TR | **Mercora** |
|---------|:-----------:|:--------:|:---------:|:-----------:|
| **Taksit Imkani** | 2-12 ay | 2-12 ay | 5-12 ay (secili) | **Var (iyzico ile)** |
| **Taksit Yapılandırma** | Sepette otomatik | Kategori bazli | Amazon yonetimli | **Manuel secim** |
| **Taksit + Para Puan** | Var | Var | Yok | **Yok** |
| **Taksit Hesaplama** | Otomatik | Otomatik | Otomatik | **Var (frontend)** |
| **Banka Sayisi** | 10+ banka | 10+ banka | Sinirli | **iyzico network** |

### 3.3 Satici Odeme Karsilastirmasi

| Ozellik | Hepsiburada | Trendyol | Amazon TR | **Mercora** |
|---------|:-----------:|:--------:|:---------:|:-----------:|
| **Odeme Periyodu** | Haftalik/Aylik | Haftada 2-3 | 7-14 gun | **Admin belirler** |
| **Odeme Baslangici** | Teslimat sonrasi | Teslimat sonrasi | Teslimat sonrasi | **Belirsiz** |
| **Kesinti Modeli** | Komisyon + hizmet | Komisyon | Komisyon + uyelik | **Komisyon** |
| **Pazar Yeri Hesap** | Var | Var | Var | **Yok** |
| **Otomatik Odeme** | Var | Var | Var | **Yok (manuel)** |
| **Pano / Raporlama** | Var | Var | Var | **Kismi** |

### 3.4 Guvenlik Karsilastirmasi

| Ozellik | Hepsiburada | Trendyol | Amazon TR | **Mercora** |
|---------|:-----------:|:--------:|:---------:|:-----------:|
| **3DS 2.0** | Var | Var | Var | **Var (iyzico/Stripe)** |
| **Fraud Detection** | AI tabanli | AI tabanli | Kuresel AI | **Stripe Radar** |
| **PCI DSS** | Level 1 | Level 1 | Level 1 | **Level 1 (Stripe)** |
| **Alıcı Koruması** | Hepsiburada Garantisi | Trendyol Garantisi | A-to-Z | **Yok** |
| **Escrow / Bloke** | Var | Var | Var | **Bilgisi var** |

---

## 4. Mercora'nin Mevcut Durumu

### 4.1 Odeme Altyapisi

Mercora uclu odeme modeliyle calismaktadir:

**1. Iyzico (Turkiye / TRY)**
- Kredi karti ve taksit odemeleri
- 3DS 2.0 guvenligi
- 2-12 ay taksit destegi
- iframe yonlendirmeli odeme sayfasi
- Taksit sorgulama API'si (/api/iyzico/installments)
- Odeme baslatma API'si (/api/iyzico/init)
- `paymentProviders` Firestore koleksiyonunda yapilandirma

**2. Stripe (Global / USD, GBP, EUR)**
- Kredi ve banka karti odemeleri
- EU/UK/US bolgeleri
- PaymentElement ile entegrasyon
- Stripe Radar fraud korumasi
- PCI DSS Level 1 uyumu

**3. Havale / EFT (Manuel)**
- Tum bolgeler icin
- Banka hesap bilgisi gosterimi (IBAN kopyalama)
- Kullanici onay mekanizmasi
- Manue onay akisi

### 4.2 Mevcut Kod Yapisi (Odeme Bilesenleri)

```
src/
  types/
    payment.ts          -- ProviderKey, InstallmentOption, PaymentProvider, PROVIDER_TEMPLATES
    order.ts            -- PaymentMethod, PaymentStatus, Order (stripePaymentIntentId, iyzicoPaymentToken)
  services/
    paymentProviderService.ts  -- CRUD: Firestore paymentProviders koleksiyonu
  components/checkout/
    PaymentMethodSelector.tsx  -- Bolge bazli odeme yontemi secimi
    IyzicoPayment.tsx          -- Taksit secimi + iyzico'ya yonlendirme
    ManualPayment.tsx          -- Havale/EFT banka bilgisi + bildirim
```

### 4.3 Guclu Yanlar

- **Cift odeme saglayici**: Iyzico (TR) + Stripe (Global) rakiplerin cogunda yok
- **Genisletilebilir saglayici modeli**: PayTR ve Sipay gibi saglayicilar icin template'ler hazir
- **Bolge tabanli yonlendirme**: `getActiveProvidersForRegion()` ile otomatik saglayici secimi
- **Taksit destegi**: Iyzico uzerinden 2-12 ay taksit
- **Esnek komisyon modeli**: Admin tarafindan satici bazinda ozellestirilebilir
- **Otomatik vergi hesaplama**: taxEngine ile
- **Escrow bilgisi**: Rakiplerde olmayan bir guven unsuru

### 4.4 Zayif Yanlar

| Zayiflik | Detay | Etki |
|----------|-------|------|
| Apple Pay / Google Pay | Stripe destekliyor ama aktif degil | Mobil donusum kaybi |
| Dijital cuzdan | Iade bakiyesi birikimi yok | Musteri bagliligi dusuk |
| Hediye karti | Hic yok | Satis kanali eksik |
| Kapida odeme | Hic yok (Turkiye'de kritik) | TR pazar kaybi |
| Satici odeme otomasyonu | Otomatik odeme aksi yok | Satici memnuniyeti |
| Misafir checkout | Buyuk ihtimal login zorunlu | Donusum kaybi |
| Fraud detection | Sadece Stripe Radar (yetersiz) | Risk |
| Sepet kurtarma | API var ama otomasyon yok | Kayip satislar |
| PayPal | Hic yok | ABD/AB pazarinda eksik |
| 1-Click checkout | Hic yok | Amazon'a karsi zayif |

---

## 5. Eksikler ve Oneriler

### P0 -- Kritik (Hemen, 0-2 Hafta)

| # | Eksik | Cozum | Etki | Zorluk |
|---|-------|-------|------|--------|
| 1 | **Apple Pay / Google Pay** | Stripe Dashboard'dan wallet payment'lari ac (ekstra kod yok) | Mobil donusum +%15-25 | **Cok Dusuk** |
| 2 | **Misafir Checkout** | Checkout akisinda login bypass, email + siparis kodu ile takip | Donusum +%20-30 | **Dusuk** |
| 3 | **Dijital Cuzdan** | Firestore'da `wallets` koleksiyonu, iade bakiyesi, kredi karti yukleme | Baglilik + geri donus | **Orta** |

### P1 -- Yuksek Oncelik (2-4 Hafta)

| # | Eksik | Cozum | Etki | Zorluk |
|---|-------|-------|------|--------|
| 4 | **Satici Odeme Otomasyonu** | Haftalik periyotlu otomatik odeme sistemi, Firestore `payouts` koleksiyonu | Satici memnuniyeti | **Orta** |
| 5 | **Kapida Odeme (TR)** | Kurye entegrasyonu ile nakit/kk POS (ek ucretli, sadece TR) | TR donusum +%10-15 | **Orta** |
| 6 | **Hediye Kartı** | `giftCards` koleksiyonu, checkout'ta kod girisi, bakiye sorgulama | Yeni musteri kazanimi | **Orta** |
| 7 | **Sepet Kurtarma Otomasyonu** | Firebase Cloud Functions: 24h/48h/72h hatirlatma (email+push) | Kayip satis kurtarma | **Dusuk** |

### P2 -- Orta Oncelik (1-2 Ay)

| # | Eksik | Cozum | Etki | Zorluk |
|---|-------|-------|------|--------|
| 8 | **BNPL (Klarna/Afterpay)** | Stripe PaymentMethodTypes'a Klarna ekle | Sepet ortalamasi +%20-40 | **Dusuk** |
| 9 | **PayPal** | Stripe alternatifi olarak PayPal butonu | ABD/AB pazar erisimi | **Dusuk** |
| 10 | **Pazar Yeri Hesap Sistemi** | Satici kazanc goruntuleme + odeme talebi | Satici guveni | **Orta** |
| 11 | **Taksit + Para Puan** | Iyzico uzerinden puan kullanimi | Musteri bagliligi | **Orta** |

### P3 -- Dusuk Oncelik (2+ Ay)

| # | Eksik | Cozum | Etki | Zorluk |
|---|-------|-------|------|--------|
| 12 | **1-Click Checkout** | Kayitli kullanici icin tek tikla odeme (Amazon benzeri) | UX iyilestirmesi | **Yuksek** |
| 13 | **Alıcı Koruma Programı** | Escrow + sigorta mekanizmasi | Platform guveni | **Yuksek** |
| 14 | **AI Fraud Detection** | Stripe Radar + ek ML modeli | Guvenlik | **Cok Yuksek** |
| 15 | **Canli Kargo Takibi (Harita)** | Kargo API entegrasyonu ile son 3 durak | Musteri memnuniyeti | **Yuksek** |

---

## 6. Stratejik Onceliklendirme

### En kritik 3 aksiyon:

1. **Apple Pay / Google Pay** (P0, Cok Dusuk zorluk) -- Stripe dashboard'da bir toggle ile hemen devreye alinabilir, mobil donusumda buyuk etki.

2. **Dijital Cuzdan** (P0, Orta zorluk) -- Trendyol Cuzdan ve Hepsipay'in en guclu musteri baglilik araci. Iade bakiyelerini sisteme hapseder, musteri geri donusunu artirir.

3. **Misafir Checkout** (P0, Dusuk zorluk) -- Etsy'nin en guclu donusum araci. Uyelik engelini kaldirarak satin alma oranini ciddi artirir.

### Hizli kazanimlar (1-2 gun):

| Aksiyon | Is | Gelir Etkisi |
|---------|----|-------------|
| Stripe wallet payments ac | 1 satir config | +%15-25 mobil donusum |
| Hesap zorunlulugunu kaldir | 1 hafta is | +%20-30 genel donusum |
| Klarna/Afterpay ekle | 1 gun (Stripe uzerinden) | +%20-40 sepet ortalamasi |

---

## 7. Sonuc

Mercora, **cift odeme saglayicisi** (Iyzico + Stripe) ve genisletilebilir saglayici modeli ile rakiplerine karsi guclu bir temele sahiptir. Ancak odeme yontemleri cesitliligi, musteri deneyimi ve satici odeme otomasyonu acisindan rakiplerin belirgin sekilde gerisindedir.

**En kritik eksikler:** Apple Pay/Google Pay (neredeyse sifir kodla cozulebilir), dijital cuzdan (musteri bagliligi icin), misafir checkout (donusum icin).

**Mercora'nin avantaji:** Iyzico ile taksit destegi, Stripe ile kuresel odeme, esnek saglayici modeli (PayTR/Sipay template'leri hazir), bolge tabanli yonlendirme.

**En buyuk risk:** Kapida odeme eksikligi (Turkiye pazarinda kritik bir tercih), satici odeme otomasyonu eksikligi (satici memnuniyeti icin), alici koruma programi eksikligi (guven icin).

Mercora, P0 oncelikli 3 aksiyonu (Apple Pay/Google Pay, dijital cuzdan, misafir checkout) tamamladiginda odeme sistemi puani 6/10'dan 8/10'a yukselecektir. P1 aksiyonlari (kapida odeme, hediye karti, satici odeme otomasyonu) ile birlikte 9/10 seviyesine ulasabilir.

---

## Ek: Rakiplerin Odeme Saglayicilari

| Platform | Birincil Saglayici | Ikincil Saglayici | Mobil Odeme |
|----------|-------------------|-------------------|-------------|
| **Hepsiburada** | Hepsipay (kendi) | Banka entegrasyonlari | Hepsipay mobil |
| **Trendyol** | PayTR + Iyzico | Kendi altyapisi | Trendyol app |
| **Amazon TR** | Amazon Payments (kendi) | Kuresel altyapi | Amazon app |
| **Mercora** | Iyzico (TR) | Stripe (Global) | Yok |
