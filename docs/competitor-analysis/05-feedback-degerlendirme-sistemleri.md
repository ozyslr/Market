# Geri Bildirim ve Degerlendirme Sistemleri Karsilastirmasi
## Agent 5 — Feedback & Review Systems Analysis

**Tarih:** 2026-05-21
**Rakip 1:** Etsy
**Rakip 2:** Amazon
**Rakip 3:** Trendyol

---

## 1. Mercora Mevcut Durum (Kod Analizi)

Mercora asagidaki geri bildirim bilesenlerine sahiptir:

| Bilesen | Dosya | Durum |
|---|---|---|
| Urun yorumu (Review) | `src/services/reviewService.ts` | Mevcut — 1-5 yildiz, metin, fotografli yorum, kategori bazli puanlama (kalite/kargo/aciklama) |
| Admin yorum onayi | `src/pages/AdminReviews.tsx` | Mevcut — onayla/sil, bildirim gonderiliyor |
| Urun sorusu-cevap | `src/services/productQuestionService.ts` | Mevcut — soru sor, yanitla, faydali oylamasi |
| Destek bileti | `src/services/supportService.ts` + `src/pages/AdminSupport.tsx` | Mevcut — kategorili, oncelikli, mesajlasmali, admin paneli |
| Iade talebi | `src/services/returnService.ts` + `src/pages/AdminReturns.tsx` | Mevcut — durum takibi, para iadesi yonetimi |
| Satici performans puani | `src/services/sellerRatingService.ts` | Mevcut — 0-100 skor, bronz/gumus/altin/platin level |
| Bildirim sistemi | `src/services/notificationService.ts` | Mevcut — order_status, review_approved, payout, moderation |
| Yorum faydali oylamasi | `reviewService.ts` `voteReviewHelpful()` | Mevcut |
| Satici yaniti | `reviewService.ts` `addSellerResponse()` | Mevcut |
| Dogrulanmis alisveris (verified) | `Review.verified` flag | Mevcut ama verified atamasi otomatik degil |
| Kategori bazli puanlama | `Review.categoryRatings` | Mevcut — kalite, kargo hizi, aciklama dogrulugu |
| Satici degerlendirmesi | `Review.sellerId` | Koda eklenmis ama kullanim sinirli |

---

## 2. Rakip Feedback Sistemi Ozetleri

### Etsy

**Puanlama Sistemi:**
- 5 yildizli derecelendirme (1-5)
- Yorum metni + fotograf yukleme imkani
- Satici degerlendirmesi ayri bir bolum (Item review vs Seller review)
- Private feedback (sadece saticinin gorebildigi ozel yorum) — satis sonrasi anket
- Star seller programi (aylik satici kalite degerlendirmesi)

**Dogrulama ve Moderasyon:**
- Sadece satin alan musteri yorum yapabilir (verified purchase)
- Yorumu degistirme/silme imkani (2 gun icinde)
- Otomatik moderasyon + kullanici raporlama
- Etsy'nin review politikasi cok katidir: urunle alakasiz yorum, reklam icerikli yorum, kisisel bilgi iceren yorum kaldirilir

**Iade/Uyusmazlik:**
- Etsy's Purchase Protection: 250 USD'ye kadar alici korumasi
- Case system: dogrudan Etsy'ye uyusmazlik basvurusu
- Saticiyle iletisim zorunlu (case acmadan once)
- Iade politikasi satici bazli (zorunlu degil ama tesvik edilir)
- "Not as described" durumunda Etsy korumasi devreye girer

**Musteri Destek:**
- E-posta destek, yardim merkezi makaleleri
- Etsy Community forumlari
- Chat destegi sinirli (otomatik)
- Saticilar icin Etsy Support ayrilmis portala sahip

---

### Amazon

**Puanlama Sistemi:**
- 1-5 yildiz (detayli fragmentasyon: 5-star, 4-star vs.)
- Metin yorumu + fotograf + video yukleme
- "Yararli" (helpful) oylamasi — en yararli yorumlar one cikar
- Customer Q&A (urun soru-cevap)
- Yorum siralamasi: "Most recent", "Top reviews", "Most helpful"
- Amazon Vine programi: guvenilir yorumculardan ucretsiz urun karsiligi yorum
- AI ozetli yorum (yapay zeka ile yorum ozeti cikarma)

**Dogrulama ve Moderasyon:**
- **Verified Purchase rozeti** — gercekten satin almis kullanicilar yesil rozet alir
- Vine rozeti — Vine programi uyeleri icin ayri etiket
- Yapay zeka destekli sahte yorum tespiti
- Incentivized review yasagi (para karsiligi yorum yasak)
- Ayni musteri ayni urune sadece 1 yorum birakabilir
- Amazon, sahte yorum tespit ettiginde toplu yorum silme yapar

**Iade/Uyusmazlik (A-to-Z Guarantee):**
- Amazon A-to-Z Guarantee: satin alinan urun gelmezse veya beklenenden farkliysa koruma
- 30 gun icinde A-to-Z talebi
- Satici once musteriyle iletisime gecmek zorunda
- Amazon kararinda musteri ve saticiya itiraz hakki
- Amazon, anlasmazlikta genellikle musteri lehine karar verir
- Para iadesi: 3-5 is gunu icinde
- Iade: Amazon FBA urunlerinde ucretsiz, FBM satici bazli

**Satici Degerlendirmesi:**
- Ayri bir seller feedback system (urun yorumundan bagimsiz)
- Yildiz bazli satici puani
- Yanit suresi, siparis dogrulugu, kargo hizi metrikleri
- Satici Feedback Manager'da detayli istatistikler

---

### Trendyol

**Puanlama Sistemi:**
- 1-5 yildiz puanlama
- Gorselli yorum (fotograf/video ekleme)
- Satici degerlendirmesi (siparis bazli puan)
- "Bu yorum faydali mi?" butonu
- Satici yorum yanitlama ozelligi
- Puan bazli siralamada yorum etkisi

**Dogrulama ve Moderasyon:**
- Sadece satin alan musteri yorum yapabilir
- Otomatik moderasyon sistemi
- "Trendyol Onayli" rozeti
- Yorum politikasi: hakaret, reklam, ozel bilgi iceren yorumlar kaldirilir
- Yorum silme talebi musteri hizmetleri uzerinden

**Iade/Uyusmazlik (Trendyol Garantisi):**
- **Trendyol Garantisi:** 30 gun icinde ucretsiz iade
- Anlasmazlik durumunda Trendyol musteri hizmetleri devreye girer
- Iade sureci: cagri merkezi + mobil uygulama uzerinden
- Aninda iade: bazi durumlarda iade beklenmeden para iadesi
- 500 TL alti urunlerde kargo ucretsiz iade
- Hatali urun durumunda kargo ucreti Trendyol'a ait

**Musteri Destek:**
- 7/24 canli destek (chat)
- Telefon destegi (0850...)
- E-posta destek (musteri hizmetleri kayit)
- Trendyol mobil uygulama uzerinden supurge
- Sosyal medya destek (Twitter/X DM)
- "Yardim" merkezi (makale tabanli)

---

## 3. Karsilastirma Tablosu: Degerlendirme/Review Yapisi

| Ozellik | Etsy | Amazon | Trendyol | Mercora |
|---|---|---|---|---|
| **Yildiz puani** | 1-5 | 1-5 (detayli) | 1-5 | 1-5 |
| **Fotograf** | Evet | Evet | Evet | Evet (Review.photos) |
| **Video** | Hayir | Evet | Evet | Hayir |
| **Kategori puanlama** | Hayir | Hayir | Hayir | **Evet** (kalite/kargo/aciklama) |
| **Verified Purchase** | Var (otomatik) | Var (otomatik + rozet) | Var (otomatik) | Var (manüel) |
| **Satici puani** | Ayri sistem | Ayri sistem | Siparis bazli | Integre (sellerRatingService) |
| **Yorum faydali mi** | Hayir | Evet | Evet | Evet |
| **Satici yaniti** | Evet | Evet | Evet | Evet |
| **Urun soru-cevap** | Hayir | Evet (Q&A) | Hayir | Evet |
| **AI yorum ozeti** | Hayir | Evet | Hayir | Hayir |
| **Programli yorum** | Star Seller | Vine programi | Trendyol Onayli | Hayir |
| **Video yorum** | Hayir | Evet | Evet | Hayir |
| **Moderasyon** | Otomatik | AI destekli | Otomatik | Admin onayli (manuel) |
| **Yorum degistirme** | 2 gun | Sinirsiz | Sinirsiz | Belirtilmemis |

**Mercora'nin guclu yonleri:**
- Kategori bazli puanlama (kalite/kargo/aciklama) rakiplerde yok
- Urun soru-cevap sistemi mevcut (Amazon'da var, Etsy/Trendyol'da yok)
- Yorum faydali oylamasi mevcut
- Satici yaniti mekanizmasi mevcut

**Mercora'nin eksikleri:**
- Verified Purchase otomatik atanmiyor (manuel onayla gosteriliyor)
- Video yorum destegi yok
- AI destekli moderasyon yok
- AI yorum ozeti yok
- Programli yorum sistemi (Vine/Star Seller benzeri) yok

---

## 4. Karsilastirma Tablosu: Iade ve Uyusmazlik Sistemleri

| Ozellik | Etsy | Amazon | Trendyol | Mercora |
|---|---|---|---|---|
| **Iade politikasi** | Satici bazli | Urun bazli (30 gun) | 30 gun (garanti) | Mevcut (returnService) |
| **Koruma programi** | Purchase Protection (250$) | A-to-Z Guarantee | Trendyol Garantisi | Yok |
| **Uyusmazlik cozumu** | Case system | A-to-Z Claim | Musteri hizmetleri | Destek bileti uzerinden |
| **Aninda iade** | Hayir | Hayir | Evet (bazi durumlar) | Hayir |
| **Iade durum akisi** | 3-5 adim | 4-5 adim | 4 adim | **7 adim** (requested > approved > pickup_scheduled > received > refunded > closed) |
| **Iade fotografi** | Evet | Evet | Evet | Evet (ReturnRequest.images) |
| **Para iadesi suresi** | Satici bazli | 3-5 is gunu | 3-7 is gunu | Belirtilmemis |
| **Kargo ucreti** | Alici/Satici | Amazon karsilar (FBA) | Trendyol karsilar (500TL alti) | Belirtilmemis |

**Mercora'nin guclu yonleri:**
- Detayli iade durum akisi (7 adim ile en kapsamli)
- Fotograf yukleme destegi
- Admin paneli uzerinden tam yonetim

**Mercora'nin eksikleri:**
- Alici koruma programi (Purchase Protection/A-to-Z/Trendyol Garantisi) yok
- Aninda iade mekanizmasi yok
- Satici bazli iade politikasi yok (sablon), her satici kendisi belirleyemiyor
- Uyusmazlik icin ayri bir case/dispute sistemi yok (sadece destek bileti)
- Kargo ucreti politikasi net degil

---

## 5. Karsilastirma Tablosu: Musteri Destek Kanallari

| Ozellik | Etsy | Amazon | Trendyol | Mercora |
|---|---|---|---|---|
| **Destek bileti/ticket** | Evet | Evet | Evet | **Evet** (robust) |
| **Canli chat** | Sinirli | Evet | **7/24** | **Evet** (LiveChatWidget) |
| **Telefon** | Hayir | Evet | **Evet** (0850) | Hayir |
| **E-posta** | Evet | Evet | Evet | Belirtilmemis |
| **AI asistan** | Sinirli | Evet (chatbot) | Evet | **Evet** (ShoppingAssistant) |
| **Yardim merkezi** | Evet | Evet | Evet | Belirtilmemis |
| **Sosyal medya** | Community | Hayir | Evet (Twitter) | Hayir |
| **Topluluk forumu** | Evet | Evet | Hayir | Hayir |
| **Admin paneli** | Evet | Evet | Evet | **Evet** (AdminSupport) |
| **Oncelik sistemi** | Yok | Var | Var | **Evet** (low/medium/high/urgent) |
| **Kategori sistemi** | Yok | Var | Var | **Evet** (order/payment/account/seller/technical) |
| **Mesaj gecmisi** | Evet | Evet | Evet | **Evet** (ticket+messages) |

**Mercora'nin guclu yonleri:**
- Ticket sistemi en kapsamlilardan (kategori, oncelik, durum, mesajlasma)
- Canli chat widget mevcut
- AI Shopping Assistant mevcut
- Admin paneli uzerinden tam destek yonetimi

**Mercora'nin eksikleri:**
- Telefon destegi yok
- Topluluk forumu yok
- Self-servis yardim merkezi (makale tabanli) yok
- Sosyal medya destegi yok

---

## 6. Mercora Icin Eksikler ve Öneriler

### Kritik Eksikler (Hemen cozulmeli)

| # | Eksik | Etki | Cozum Onerisi |
|---|---|---|---|
| 1 | **Alici koruma programi yok** | Guven eksikligi, uluslararasi alicilarin platformdan cekinmesi | Purchase Protection sistemi gelistirilmeli (order status + returnStatus uzerine insa edilebilir) |
| 2 | **Iade politikasi satici bazli degil** | Saticilar kendi politikalarini belirleyemiyor | Seller.returnPolicy alani kullanima acilmali, checkout'ta gosterilmeli |
| 3 | **Video yorum destegi yok** | Rakip platformlarda standart | Review.photos 'a video URL eklenmeli, oynatici bileseni yazilmali |
| 4 | **Verified Purchase manuel** | Dogrulama guvenilirligini azaltiyor | Order tamamlandiginda otomatik verified=true atanmali |

### Onemli Eksikler (Kisa vadede)

| # | Eksik | Cozum Onerisi |
|---|---|---|
| 5 | **Satici degerlendirmesi urun yorumuyla ic ice** | Ayri bir sellerReview sistemi olusturulmali (satici detayina ozel) |
| 6 | **Ayri uyusmazlik/dispute sistemi yok** | SupportTicket uzerine insa edilmeli, status akisi dispute-specific olmali |
| 7 | **Yorum isteme stratejisi yok** | Siparis teslimati sonrasi otomatik e-posta/bildirim ile yorum isteme |
| 8 | **AI moderasyon yok** | Admin onayina gerek kalmadan otomatik moderasyon (kufur, spam, reklam tespiti) |
| 9 | **Telefon destegi yok** | Cagri merkezi entegrasyonu (Twilio vb.) |
| 10 | **Self-servis yardim merkezi yok** | Statik makale sistemi (FAQ, iade rehberi, nasil yapilir) |

### Stratejik Eksikler (Uzun vadede)

| # | Eksik | Cozum Onerisi |
|---|---|---|
| 11 | **AI yorum ozeti** | Amazon benzeri AI ozetli yorum gosterimi (top 5 yorum ozeti) |
| 12 | **Programli yorum sistemi** | Star Seller / Vine benzeri guvenilir yorumcu programi |
| 13 | **Topluluk forumu** | Kullanicilarin birbirine yardim ettigi community area |
| 14 | **Aninda iade** | Trendyol benzeri iade onayi beklemeden para iadesi (guvenilir musterilere) |
| 15 | **Sosyal medya destek** | Twitter, Instagram DM uzerinden ticket acma |
| 16 | **Coklu dil destegi** | Yorumlarin otomatik cevirisi (kulturlerarasi alisverislerde kritik) |

---

## 7. Oncelikli Eylem Plani

| Oncelik | Eylem | Tahmini Sure | Beklenen Etki |
|---|---|---|---|
| **P0** | Alici koruma programi olustur | 2 hafta | Guven artisi, donusum orani yukselir |
| **P0** | Verified Purchase otomasyonu | 3 gun | Yorum guvenilirligi artar |
| **P1** | Video yorum destegi | 1 hafta | Rakip esitlemesi |
| **P1** | Satici bazli iade politikasi | 1 hafta | Satici memnuniyeti |
| **P1** | Satici degerlendirmesi ayristirma | 1 hafta | Satici profili zenginlesir |
| **P2** | Yorum isteme otomasyonu | 3 gun | Yorum sayisi artar (3-5x) |
| **P2** | AI moderasyon entegrasyonu | 2 hafta | Admin yuku azalir |
| **P3** | AI yorum ozeti | 1 hafta | Kullanici deneyimi iyilesir |
| **P3** | Topluluk forumu | 2 hafta | Musteri destek yuku azalir |

---

## 8. Kaynak Kod Referanslari (Mercora)

| Dosya | Icindekiler |
|---|---|
| `src/types.ts` | Review, ProductQuestion, ReturnRequest, Seller arayuzleri |
| `src/types/order.ts` | Order, OrderStatus (return_requested, refunded) |
| `src/services/reviewService.ts` | Review CRUD, onay/red, faydali oylamasi, satici yaniti |
| `src/services/returnService.ts` | Iade talebi CRUD, 7 adimli durum akisi |
| `src/services/sellerRatingService.ts` | Satici performans skoru (0-100, level sistemi) |
| `src/services/productQuestionService.ts` | Urun soru-cevap, faydali oylamasi |
| `src/services/supportService.ts` | Destek bileti sistemi (kategori, oncelik, mesaj) |
| `src/services/moderationService.ts` | Urun moderasyonu (status onayi) |
| `src/services/notificationService.ts` | Bildirimler (review_approved, order_status, payout) |
| `src/pages/AdminReviews.tsx` | Admin yorum yonetimi paneli |
| `src/pages/AdminReturns.tsx` | Admin iade talepleri paneli |
| `src/pages/AdminSupport.tsx` | Admin destek bileti paneli |
| `src/pages/OrderTracking.tsx` | Siparis takip (iade durumu gosterimi) |
| `src/services/emailService.ts` | E-posta bildirimleri (yorum isteme icin kullanilabilir) |

---

## 9. Ozet Degerlendirme

**Guclu Yanlar:** Mercora'nin feedback sistemi temelde saglamdir. Review CRUD, kategori bazli puanlama, faydali oylamasi, satici yaniti, urun soru-cevap, destek bileti ve iade yonetimi gibi temel bilesenlerin cogu mevcuttur. Admin paneli tum bu alanlari kapsamaktadir. Satici performans skoru (bronz/platine kadar) rakiplerde olmayan bir detaydir.

**Zayif Yanlar:** En kritik eksik, alici koruma programinin olmamasidir (Etsy Purchase Protection, Amazon A-to-Z, Trendyol Garantisi). Bu, ozellikle uluslararasi alicilar icin bir guven sorunudur. Ikinci kritik eksik, Verified Purchase rozetinin otomatik atanmamasidir. Video yorum desteginin olmamasi da gorsel icerik caginda onemli bir eksikliktir.

**Rekabet Avantaji Icin:** Alici koruma programi ve AI destekli ozellikler (yorum ozeti, moderasyon) Mercora'yi rakiplerinden ayirabilir. Satici level sistemi (bronz/platinum) iyi bir farklilastiricidir ve satin alma kararlarinda kullanilabilir.
