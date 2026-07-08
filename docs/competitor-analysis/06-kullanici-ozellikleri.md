# Kullanici Ozellikleri Analizi

## GIRIS

Bu rapor, Hepsiburada, Trendyol ve Amazon Turkiye'nin kullanici ozelliklerini Mercora ile karsilastirmaktadir. Analiz, kayit/giris sureclerinden mobil uygulama ozelliklerine kadar 10 farkli boyutta yapilmistir.

---

## 1. HER RAKIP ICIN KULLANICI PROFILI

### 1.1 Hepsiburada

- **Kayit/Giris:** E-posta + sifre, Facebook, Google ile giris. Telefon ile de kayit mumkun.
- **Profil:** Kullanici adi, e-posta, telefon, dogum tarihi, cinsiyet bilgileri. Adres ve odeme yontemleri kaydedilebilir.
- **Favori Listesi:** "Favorilerim" adi altinda liste olusturma, urunleri listeye ekleme/cikarma.
- **Sepet:** Sepete ekleme, duzenleme, kaydetme (daha sonra al). Sepet uyari mesajlari.
- **Adres/Teslimat:** Birden fazla adres kaydetme, varsayilan adres belirleme. Teslimat saat araligi secme.
- **Siparis Takibi:** Siparis durumu goruntuleme, kargo takibi, gecmis siparisler.
- **Kisisellestirme:** Gecmis siparisler ve gezintilere gore urun onerileri, "Bunu alanlar sunlari da aldi" bolumu.
- **Mobil Uygulama:** iOS ve Android native uygulamalar. Bildirim destegi, QR ile urun arama.
- **Dil/ Bolge:** Sadece Turkiye'de hizmet, sadece Turkce dil destegi.
- **Erisilebilirlik:** Standart web erisilebilirligi. Gorusme/dokunmatik ekran uyumlulugu sinirli.

### 1.2 Trendyol

- **Kayit/Giris:** E-posta + sifre, Google, Facebook, Apple ID ile giris. Telefon ile kayit.
- **Profil:** Ad, soyad, e-posta, telefon, cinsiyet, dogum tarihi. Adresler, odeme yontemleri. "Trendyol Go" puan bilgisi.
- **Favori Listesi:** "Favorilerim" ve "Listelerim" (ozel liste olusturma, ozel isim verme).
- **Sepet:** Sepet yonetimi, "Daha Sonra Al" (save for later) ozelligi. Stok tukenme uyarisi.
- **Adres/Teslimat:** Adres ekleme/silme/duzenleme. Teslimat bilgilendirmesi, teslimat noktasi secimi (Trendyol Express).
- **Siparis Takibi:** Adim adim siparis durumu, kargo takip numarasi, teslimat zaman cizelgesi.
- **Kisisellestirme:** Kisisel oneriler, "Bunu alanlar sunlari da aldi", "Bu kategoride populer", ozel kampanya bildirimleri.
- **Mobil Uygulama:** iOS/Android native uygulamalar. Gorsel arama, push bildirim, Trendyol Go entegrasyonu.
- **Dil/ Bolge:** Turkce ve daha sonra eklenen Arapca. Trendyol Go icin Almanya'da hizmet.
- **Erisilebilirlik:** Ekran okuyucu uyumlulugu. Renk kontrasi. Sinirli erisilebilirlik testi.

### 1.3 Amazon Turkiye

- **Kayit/Giris:** E-posta + sifre, Amazon hesabi ile. Telefon dogrulama (2FA). "Amazon ile Giris Yap" butonu.
- **Profil:** Hesap bilgileri, adres defteri, odeme yontemleri. "Hesap ve Listeler" menusu. Amazon Child profilleri (Aile).
- **Favori Listesi:** "Alisveris Listesi" - birden fazla liste olusturma (Dugun Listesi, Hediye Listesi vb.), listeleri paylasma.
- **Sepet:** Sepet yonetimi. "Daha Sonra Icin Kaydet" ozelligi. Stok bildirimi. Birlikte alinabilecek urun onerileri.
- **Adres/Teslimat:** Coklu adres, varsayilan adres, is adresi/ev adresi ayrimi. Amazon Locker teslimat noktalari.
- **Siparis Takibi:** Gercek zamanli siparis takibi, harita uzerinden kargo takibi, teslimat gunu bilgisi.
- **Kisisellestirme:** En gelismis oneri motoru. "Buna bakanlar sunlari da aldi", "Sik birlikte alinan urunler", kisisel oneriler.
- **Mobil Uygulama:** iOS/Android. Gorsel arama, sesli arama (Alexa), 1-click siparis, bildirimler.
- **Dil/ Bolge:** Turkce web sitesi, hesap dili degistirilebilir (set language to English). Turkiye'ye ozel fiyatlandirma.
- **Erisilebilirlik:** Kapsamli erisilebilirlik - WCAG 2.1 uyumlulugu, ekran okuyucu destegi, yuksek kontras modu, klavye ile gezinti.

---

## 2. KARSILASTIRMA MATRISI

| Ozellik | Hepsiburada | Trendyol | Amazon TR | Mercora |
|---|---|---|---|---|
| **Kayit/Giris** | | | | |
| E-posta + sifre | Evet | Evet | Evet | Evet |
| Google ile giris | Evet | Evet | Evet | Evet |
| Facebook ile giris | Evet | Evet | Hayir | Hayir |
| Apple ID ile giris | Hayir | Evet | Hayir | Hayir |
| Telefon ile kayit | Evet | Evet | Evet (2FA) | Hayir |
| **Profil** | | | | |
| Profil fotografi | Evet | Evet | Evet | Evet (dicebear) |
| Kisisel bilgiler | Evet | Evet | Evet | Evet |
| Puan sistemi | Hepsipuan | Trendyol Go | Hayir | rewardPoints (UI) |
| Coklu profil | Hayir | Hayir | Amazon Aile | Hayir |
| **Favori/Liste** | | | | |
| Favori listesi | Evet | Evet | Evet | Evet (WishlistContext) |
| Ozel liste olusturma | Hayir | Evet | Evet | Hayir |
| Listeleri paylasma | Hayir | Hayir | Evet | Hayir |
| **Sepet** | | | | |
| Sepete ekle/cikar | Evet | Evet | Evet | Evet |
| Daha sonra al | Evet | Evet | Evet | Hayir |
| Stok uyarisi | Evet | Evet | Evet | Hayir |
| Firestore kaydetme | - | - | - | Evet |
| **Adres/Teslimat** | | | | |
| Coklu adres | Evet | Evet | Evet | Evet (ProfileSettings) |
| Varsayilan adres | Evet | Evet | Evet | Evet |
| Posta kodu arama | Evet | Evet | Evet | Evet (postcodes.io) |
| Teslimat noktasi | Hayir | Trendyol Express | Amazon Locker | Hayir |
| **Siparis Takibi** | | | | |
| Siparis durumu | Evet | Evet | Evet | Evet |
| Kargo takibi | Evet | Evet | Evet | Evet |
| Harita uzerinde takip | Hayir | Hayir | Evet | Hayir |
| Adim adim zaman cizgisi | Evet | Evet | Evet | Evet (step-based) |
| **Kisisellestirme** | | | | |
| Urun onerileri | Evet | Evet | Evet | Evet (UI) |
| AI destekli oneri | Sinirli | Sinirli | Evet | Evet (AI Insights) |
| Fiyat dusus alarmi | Evet | Evet | Evet | Evet (priceTrackService) |
| **Mobil Uygulama** | | | | |
| Native iOS | Evet | Evet | Evet | Hayir |
| Native Android | Evet | Evet | Evet | Hayir |
| PWA | Hayir | Hayir | Hayir | Responsive web |
| Gorsel arama | Evet | Evet | Evet | Evet (VisualSearch) |
| Push bildirim | Evet | Evet | Evet | NotificationContext |
| **Dil/ Bolge** | | | | |
| Turkce | Evet | Evet | Evet | Evet |
| Ingilizce | Hayir | Hayir | Opsiyonel | Evet |
| Almanca | Hayir | (Trendyol Go) | Hayir | Evet |
| Arapca | Hayir | Evet | Hayir | Evet |
| Coklu bolge | Hayir | Sinirli | Global | Evet (GB/TR/DE/US) |
| **Erisilebilirlik** | | | | |
| WCAG uyumlulugu | Sinirli | Sinirli | Evet | Sinirli (SkipToContent var) |
| Ekran okuyucu | Sinirli | Sinirli | Evet | Sinirli |
| Klavye gezintisi | Sinirli | Sinirli | Evet | Kismi |
| Renk kontrasi | Standart | Standart | Yuksek | Temaya bagli |

---

## 3. MERCORA'NIN MEVCUT DURUMU

Mercora asagidaki kullanici ozelliklerine sahiptir:

### Kayit ve Giris
- E-posta + sifre ile kayit (`registerWithEmail`) ve giris (`loginWithEmail`)
- Google ile giris (`signInWithPopup` + GoogleAuthProvider)
- Firebase Auth ile otomatik kullanici profili olusturma
- Kullanici rol sistemi: buyer, seller, admin, moderator

### Kullanici Profili
- `/profile` sayfasi (7 tab): Genel Bakis, Siparislerim, Favorilerim, Fiyat Takibi, Takip Edilen Magazalar, Adresler, Ayarlar
- Profil bilgileri: ad, e-posta, fotograf, rol
- Istatistikler: toplam harcama, aktif siparis, kaydedilenler, puan (UI'da gosteriliyor)
- Adres yonetimi: coklu adres, varsayilan adres, etiketleme

### Favori ve Liste
- WishlistContext ile favori/izleme listesi (Firestore'da `wishlists/{userId}` koleksiyonu)
- `/wishlist` sayfasi: urun listeleme, fiyat dususu gostergesi

### Sepet Yonetimi
- CartContext ile Firestore'da sepet yonetimi (debounced kaydetme)
- Urun ekleme, miktar guncelleme, cikarma, temizleme
- `/cart` ve `/checkout` sayfalari

### Adres ve Teslimat
- Adres ekleme, duzenleme, silme, varsayilan belirleme
- UK posta kodu arama (postcodes.io API)
- Adres bilgileri: etiket, ad soyad, satir 1/2, sehir, bolge, posta kodu, ulke, telefon

### Siparis Takibi
- `/orders/:orderId` sayfasinda adim adim zaman cizgisi (pending -> confirmed -> preparing -> shipped -> delivered)
- Kargo takip bilgisi (firma, takip numarasi, kargoya verilis tarihi)
- 5 kargo firmasi icin takip linki (PTT, Yurtici, Aras, MNG, Surat)
- Iptal/Iade durumu gostergesi

### Kisisellestirme
- Urun detay sayfasinda: "Bunlar da ilginizi cekebilir", "Buna bakanlarin aldiklari", "Birlikte alinanlar", "Populer urunler"
- AI Insights: profil sayfasinda AI destekli oneri (UI'da yer aliyor)
- Fiyat takibi: `priceTrackService` ile fiyat dususu alarmi

### Mobil Uygulama
- Responsive web tasarim (PWA degil, native uygulama yok)
- Gorsel arama: `/visual-search` sayfasi
- Push bildirim altyapisi: NotificationContext ile bildirim, okunmamis sayisi

### Dil ve Bolge
- 4 dil destegi: Turkce, Ingilizce, Almanca, Arapca
- 850+ ceviri anahtari ile tam ceviri altyapisi (LanguageContext)
- Coklu bolge/para birimi: UK/GBP, TR/TRY, DE/EUR, US/USD (LocationContext)
- Admin panelinde dil yonetimi ve ceviri studi

### Erisilebilirlik
- `SkipToContent` bileseni mevcut
- `main` etiketinde `role="main"` ve `tabIndex={-1}`
- Dark/light tema destegi (ThemeContext)
- responsive tasarim

---

## 4. EKSIKLER VE ONERILER

### P0 (Kritik - Hemen Yapilmali)

| # | Eksik | Oneri | Dosya/Modul |
|---|---|---|---|
| 1 | Telefon ile kayit ve giris | AuthContext'e phone auth ekle (Firebase Phone Auth) veya en azindan telefona dogrulama kodu | `context/AuthContext.tsx` |
| 2 | Facebook/Apple ID ile giris | AuthContext'e FacebookAuthProvider ve OAuthProvider (Apple) ekle | `context/AuthContext.tsx` |
| 3 | Sepette "Daha Sonra Al" ozelligi | CartContext'e saveForLater / moveToCart fonksiyonlari ekle. Ayri Firestore koleksiyonu | `context/CartContext.tsx` |
| 4 | Siparis onayi e-posta bildirimi | emailService calisiyor, ancak SMS bildirimi de eklenmeli. Push notification tetikleyicisi | `services/notificationService.ts` |
| 5 | 2FA/dogrulama | Hesap guvenligi icin 2FA ekle (email veya SMS kodu) | `context/AuthContext.tsx` |

### P1 (Onemli - Kisa Vadede Yapilmali)

| # | Eksik | Oneri | Dosya/Modul |
|---|---|---|---|
| 6 | Ozel liste olusturma | WishlistContext'e liste gruplama ekle: "Dugun Listesi", "Hediye Listesi" gibi. Birden fazla liste | `context/WishlistContext.tsx` |
| 7 | Listeleri paylasma | Liste detay sayfasina paylasma linki, WhatsApp/e-posta ile paylasma butonu | `pages/Wishlist.tsx` |
| 8 | Stok tukenme/uveye girme bildirimi | notificationService'de back_in_stock tipi var ancak UI'da kullanilmiyor. Urun detayina "Gelince Haber Ver" ekle | `services/notificationService.ts` |
| 9 | Musteri hizmetleri canli destek | `/support` sayfasi ve `LiveChatWidget` var ancak tam entegre degil | `pages/UserSupport.tsx` |
| 10 | AI oneri motoru gelistirme | AI Insights su an statik. Gercek kullanici davranisina gore dinamik oneri. ShoppingAssistant var | `components/ai/ShoppingAssistant.tsx` |
| 11 | PWA/mobil uygulama | Service worker + manifest.json ile PWA'ya donustur. Veya React Native'e gecis plani | Root yapilandirmasi |
| 12 | Gorsel arama gelistirme | `/visual-search` sayfasi var, ancak AI gorsel tanima ile desteklenmeli | `pages/VisualSearch.tsx` |

### P2 (Iyi Sahip Olmak Icin - Uzun Vadeli)

| # | Eksik | Oneri | Dosya/Modul |
|---|---|---|---|
| 13 | Teslimat noktasi secimi | Trendyol Express / Amazon Locker benzeri teslimat noktasi sistemi | `/pages/Checkout.tsx` |
| 14 | Harita uzerinde kargo takibi | Kargo takibine harita entegrasyonu (Google Maps API) | `pages/OrderTracking.tsx` |
| 15 | Amazon Aile / Child profilleri | Aile icin alt hesap olusturma, ebeveyn kontrolu | `context/AuthContext.tsx` |
| 16 | WCAG 2.1 erisilebilirlik denetimi | Kapsamli erisilebilirlik testi: renk kontrasi, klavye gezintisi, ekran okuyucu, ARIA etiketleri | Tum bilesenler |
| 17 | Yuksek kontras modu | ThemeContext'e "yuksek kontras" temasi ekle | `context/ThemeContext.tsx` |
| 18 | Bildirim tercihleri sayfasi | Hangi bildirimlerin alinacagi kullanici tarafindan secilebilir (push, email, SMS) | `components/profile/ProfileSettings.tsx` |
| 19 | Fiyat alarmi e-posta bildirimi | Fiyat dustugunde e-posta gonderimi | `services/priceTrackService.ts` |
| 20 | Urun karsilastirma | Birden fazla urunu karsilastirma sayfasi. Trendyol ve Hepsiburada'da var | Yeni sayfa |
| 21 | Son gezilen urunler | `product.recently_viewed` cevirisi var, ancak UI'da kullanilmiyor. localStorage'a kaydet | `pages/ProductDetail.tsx` |
| 22 | Birlikte alinan urunler | `product.bought_together` cevirisi var, ancak gercek veri ile calismiyor | `pages/ProductDetail.tsx` |
| 23 | Dil bazli bolge yonlendirmesi | Kullanici diline gore otomatik bolge/para birimi onerme | `context/LanguageContext.tsx` + `context/LocationContext.tsx` |
| 24 | Gecmis siparislerden tekrar siparis | Siparis kartinda "Tekrar Satin Al" butonu calisiyor ancak sepete eklemiyor | `pages/UserProfile.tsx` |

---

## 5. SONUC

### Genel Degerlendirme

Mercora, temel kullanici ozellikleri acisindan rakipleriyle rekabet edebilecek bir altyapiya sahiptir. Ozellikle:

- **Coklu dil destegi (4 dil):** Rakiplerin onunde. Amazon TR ve Hepsiburada sadece Turkce desteklerken, Mercora TR, EN, DE, AR dillerini desteklemektedir.
- **Coklu bolge/para birimi:** Rakiplerden net bir sekilde ayriliyor. Amazon global olsa da Amazon Turkiye sadece TRY ile calisir.
- **AI destegi:** ShoppingAssistant, BotSalesEngine, VisualSearch, AI Insights gibi bilesenlerle rakiplerin onunde bir AI altyapisi mevcut.
- **Firebase altyapisi:** Gercek zamanli sepet senkronizasyonu, bildirim yonetimi, adres yonetimi basarili.
- **Fiyat takibi:** Rakiplerle esit seviyede, hatta fiyat dususu gostergesi ile biraz onde.

### Kritik Eksikler

Mercora'nin en acil cozmesi gereken eksikler:

1. **Telefon ile kayit:** Rakiplerin tamami telefon ile kayit desteklerken Mercora'da yok.
2. **Sosyal medya girisi:** Trendyol 4 farkli yontem sunarken (email, Google, Facebook, Apple), Mercora sadece email ve Google sunuyor.
3. **"Daha sonra al" ozelligi:** Tum rakiplerde bulunan sepet ozelligi Mercora'da yok.
4. **Stok/haber bildirimi:** Rakiplerin standart ozelligi olan stok bildirimi Mercora'da eksik.
5. **Mobil uygulama:** Rakiplerin tamami native mobil uygulamaya sahipken, Mercora sadece responsive web.

### Rekabet Avantajlari

Mercora'nin kullanici ozellikleri acisindan rakiplerine karsi avantajli oldugu alanlar:

- Coklu dil ve bolge destegi (rakiplerin cogu sadece yerel)
- AI tabanli alisveris asistani ve bot satis motoru
- Escrow koruma sistemi (guven odakli)
- Esnek odeme yontemleri (Stripe, Iyzico, manual)
- Global vergi ve lojistik entegrasyonu

### Onerilen Yol Haritasi

1. **Hemen (P0 - 2 hafta):** Telefon kaydi, Facebook/Apple giris, "Daha Sonra Al", push bildirim
2. **Kisa vade (P1 - 2 ay):** Ozel listeler, stok bildirimi, PWA/mobil uygulama, canli destek entegrasyonu
3. **Uzun vade (P2 - 6 ay):** Teslimat noktalari, WCAG uyumlulugu, karsilastirma araci, harita uzerinde takip
