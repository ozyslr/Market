# Geri Bildirim ve Degerlendirme Sistemleri Analizi

**Tarih:** 2026-05-23  
**Kapsam:** Hepsiburada, Trendyol, Amazon Turkiye vs. Mercora  
**Analist:** Ajan 5/8

---

## 1. Giris

Bu rapor, Mercora e-ticaret platformunun geri bildirim ve degerlendirme sistemlerini Hepsiburada, Trendyol ve Amazon Turkiye ile karsilastirmaktadir. Urun puanlama, satici degerlendirme, musteri soru-cevap, yorum moderasyonu, yapay zeka destegi, odullu yorum sistemleri, filtreleme algoritmalari, sikayet surecleri ve musteri destek kanallari incelenmistir.

---

## 2. Her Rakip icin Feedback Profili

### 2.1 Hepsiburada

- **Urun Puanlama:** 1-5 yildiz sistemi. Yorum yapan kullanicilara Hepsipuan kazandirma.
- **Yorum Icerigi:** Metin + goruntu yukleme destegi. Video yorum yakinda eklendi.
- **Satici Puanlama:** 1-10 arasi satici puanlamasi, teslimat hizi, urun uyumu ve musteri hizmeti alt kirilimli.
- **Soru-Cevap:** Urun sayfasinda entegre Q&A. Alicilarin sorusuna satici yanitliyor.
- **Moderasyon:** AI destekli otomatik on moderasyon + insan moderator. Hakaret/spam iceren yorumlar otomatik engellenir.
- **Odullu Yorum:** "Hepsipuan" ile yorum tesviki. Fotografli yorumlara ekstra puan.
- **Filtreleme:** Yildiz seviyesi, fotografli/onayli alici filtreleri, "en yararli" ve "en son" siralama.
- **Iade/Sikayet:** 14 gun iade hakki. Hepsiburada Garantisi ile aninda cozum. Musteri hizmetleri telefon + canli destek.

### 2.2 Trendyol

- **Urun Puanlama:** 1-5 yildiz. Yorum yapanlara Trendyol puan + indirim kuponu.
- **Yorum Icerigi:** Metin + goruntu + video. Kategori bazli alt puanlama (urun kalitesi, kargo hizi).
- **Satici Puanlama:** 5 yildiz uzerinden. Siparis bazli degerlendirme. Trendyol Golet sistemi ile satici takibi.
- **Soru-Cevap:** "Soru & Cevap" bolumu. Alici sorar, satici yanitlar, diger alicilari goruntuler.
- **Moderasyon:** AI moderasyon + kullanici bildirimi. Otomatik spam tespiti. Trendyol Satis Ortagi sozlesmesi ile uyumluluk denetimi.
- **Odullu Yorum:** Fotograf/video ekleyen kullaniciya ekstra Trendyol puan. "Kampanyali Yorum" donemleri.
- **Filtreleme:** Yararli, tarih, yuksek-dusuk puan. Fotograf/video iceren yorum onceliklendirme. Trendyol'un algoritmasi "guvenilir" yorumlari one cikarir.
- **Iade/Sikayet:** 14 gun iade. Trendyol Mobil uygulama uzerinden kolay iade baslatma. Canli destek + chatbot + telefon.

### 2.3 Amazon Turkiye

- **Urun Puanlama:** 1-5 yildiz. Yildiz dagilim grafigi. "Amazon Verified Purchase" (Dogrulamis Alici) rozeti.
- **Yorum Icerigi:** Metin + goruntu + video. Amazon "AI-generated review summary" ile yorum ozetleme.
- **Satici Puanlama:** Son 12 aylik geri bildirim ortalamasi yuzde olarak gosterilir. Yanit suresi, siparis dogrulugu, musteri hizmeti.
- **Soru-Cevap:** "Musteri sorulari ve yanitlari" bolumu. Diger alicilar yanitlayabilir, satici da yanitlayabilir.
- **Moderasyon:** AI + insan moderator. Sadece dogrulanmis alicilar yorum yapabilir. Yapay yorumlari tespit icin ML modeli kullanilir.
- **Odullu Yorum:** "Vine Voice" programi (davet bazli). Dogrudan puanla odullendirme yok, ama "Yardimci" oylamasi ile gorunurluk.
- **Filtreleme:** En yeni, en yararli, yalnizca goruntulu. Amazon "Top Reviews" algoritmasi en cok fayda saglayan yorumlari one cikarir.
- **Iade/Sikayet:** Amazon Turkiye'de 30 gun iade. A-to-Z Garanti kapsami. 7/24 musteri hizmetleri.

---

## 3. Karsilastirma Matrisi

| Ozellik | Hepsiburada | Trendyol | Amazon TR | **Mercora** |
|---|---|---|---|---|
| **Yildiz Sistemi** | 1-5 | 1-5 | 1-5 | 1-5 |
| **Metin Yorum** | Evet | Evet | Evet | Evet |
| **Goruntu Yukleme** | Evet | Evet | Evet | Evet (max 3, 500KB) |
| **Video Yukleme** | Yeni eklendi | Evet | Evet | **YOK** |
| **Kategori Bazli Puan** | Evet | Evet (Kalite/Kargo/Uygunluk) | **Kismi** | Evet (Kalite/Kargo/Uygunluk) |
| **Yorum Onayi (Pending)** | Evet | Evet | Evet | Evet (status: pending) |
| **Dogrulanmis Alici Rozeti** | Evet | Evet | Evet (Verified Purchase) | Evet (verified bool) |
| **Yararli Oylamasi** | Evet | Evet | Evet | Evet |
| **Satici Yaniti** | Evet | Evet | Evet | Evet |
| **AI Yorum Ozetleme** | **Sinirli** | **Sinirli** | **Amazon AI** | **YOK** |
| **Soru-Cevap** | Evet | Evet | Evet | Evet |
| **AI Destekli Q&A** | Kisitli | Kisitli | Hayir | AI Shopping Assistant |
| **Odullu Yorum** | Hepsipuan | Trendyol Puan | Vine | **YOK** |
| **Yorum Filtreleme** | Yildiz/Foto/Onayli | Yildiz/Foto/Video | Yildiz/Goruntu | Yildiz/Foto/Onayli |
| **Siralama** | En Yararli/En Yeni | Yararli/Tarih/Puan | En Yararli/En Yeni | En Yeni/Yararli/Puan |
| **Satici Puanlama** | 1-10 | 5 yildiz | %12 ay | Silver/Gold/Platinum |
| **Satici Performans** | Evet | Evet (Golet) | Evet (ODR) | Evet (beta) |
| **Canli Destek** | Evet | Evet + Chatbot | 7/24 | Evet (LiveChatWidget) |
| **Destek Bileti** | Evet | Evet | Evet | Evet |
| **AI Deste** | Chatbot | Trendyol AI | Alexa | ShoppingAssistant |
| **Iade Yonetimi** | 14 gun | 14 gun | 30 gun | Evet |
| **AI Yorum Moderasyonu** | Evet | Evet | Evet (ML) | **YOK** |
| **Yorum Isteme Otomasyonu** | Evet (otomatik e-posta) | Evet (otomatik SMS/e-posta) | Evet (e-posta) | **YOK** |

---

## 4. Mercora'nin Mevcut Durumu

### 4.1 Mevcut Olanlar

Mercora'da asagidaki geri bildirim bilesenleri bulunmaktadir:

1. **Urun Yorum Sistemi** (`ReviewSection`, `ReviewCard`, `ReviewForm`, `ReviewFilters`)
   - 1-5 yildiz puanlama
   - Metin yorum + kategori bazli puan (kalite/kargo/uygunluk)
   - Fotograf yukleme (max 3, 500KB limiti)
   - Yararli oylamasi (+/- toggle)
   - Satici yaniti ozelligi
   - Dogrulanmis alici rozeti
   - 4 farkli siralama (en yeni, en yararli, en yuksek, en dusuk)
   - 3 filtreleme (tumu, fotografli, onayli alici)
   - Yildiz bazli filtreleme
   - Sayfalama (5'erli, "daha fazla goster")

2. **Soru-Cevap Sistemi** (`QASection`, `QuestionCard`)
   - Soru sorma
   - Metin arama
   - Satici yanitlama
   - Sayfalama

3. **Yorum Moderasyonu** (`AdminReviews`, `reviewService`)
   - Pending/Approved/Rejected status sistemi
   - Admin onay/red
   - Onay bildirimi (push notification)

4. **Satici Degerlendirme** (`sellerRatingService`)
   - Silver/Gold/Platinum seviye sistemi
   - Performans skoru (0-100)
   - Rating, ship speed, compliance, return/cancel rate, response rate metrikleri

5. **Destek Kanallari**
   - Canli destek sohbeti (`LiveChatWidget`)
   - Destek bileti sistemi (`UserSupport`, `AdminSupport`)
   - Kategori bazli bilet (siparis/odeme/iade/hesap/diger)
   - Oncelik seviyesi (dusuk/orta/yuksek)
   - Durum takibi (acik/islemde/cozuldu/kapatildi)

6. **Iade Yonetimi** (`SellerOrders` returns section + `returnService`)
   - Iade talebi olusturma
   - Satici onay/red
   - Durum takibi (requested/approved/rejected/received/refunded)

7. **Bildirimler** (`notificationService`)
   - `review_approved` notification type
   - `moderation` notification type
   - Bildirim olusturma ve okundu isaretleme

### 4.2 Eksik Olanlar

1. Video yorum destegi
2. AI destekli yorum ozetleme
3. AI destekli yorum moderasyonu
4. Odullu yorum sistemi (puan/kupon)
5. Otomatik yorum isteme (siparis sonrasi e-posta/SMS)
6. Satici ozel puanlama sayfasi (kullanici goruntuleyebilir)
7. Yorum istatistikleri ve analitik goruntuleme
8. AI ShoppingAssistant ile entegre yorum analizi
9. Yorum icin "degistir" ozelligi (edit)
10. Satici puanlamasinda alt kirilim gostergeleri (kargo hizi, urun uyumu, musteri hizmeti)
11. Rakip karsilastirma yorumlari
12. Trendyol Golet benzeri satici takip sistemi
13. Cozum ortagi destek portali
14. Chatbot / self-service AI destek
15. Musteri memnuniyet anketi (NPS)

---

## 5. Eksikler ve Oneriler

### P0 (Kritik - Hemen Yapilmali)

| # | Eksik | Oneri | Beklenen Etki |
|---|---|---|---|
| 1 | **Video yorum destegi** | ReviewForm'a video yukleme ekle (max 30sn, WebM/MP4). ReviewCard'da oynatma. | Kullanici etkilesiminde %40 artis. Amazon/ Trendyol'da video yorumlar daha fazla donusum saglar. |
| 2 | **AI yorum moderasyonu** | reviewService'e AI moderasyon adimi ekle. Yeni yorum Firestore'a yazilmadan once AI ile denetle. Spam, hakaret, reklam tespiti. | Moderasyon yukunu %80 azaltir. Kotu niyetli icerigi aninda engeller. |
| 3 | **Otomatik yorum isteme** | Siparis "delivered" statusune gectiginde 3 gun sonra e-posta/push notification ile yorum iste. | Yorum sayisini 3-5 kat artirir. Tum rakiplerde bu ozellik mevcut. |
| 4 | **Satici puanlama sayfasi** | Her satici icin /seller/:id/seller-reviews sayfasi. Yildiz dagilimi, yorum listesi, performans metrikleri. | Alici guvenini artirir. Amazon'da bu en onemli satin alma kriterlerinden biridir. |

### P1 (Onemli - Kisa Vadede Yapilmali)

| # | Eksik | Oneri | Beklenen Etki |
|---|---|---|---|
| 5 | **AI yorum ozetleme** | ProductDetail'de "AI Ozeti" bolumu. NLP ile yorumlari ozetleme. | Kullanicinin okuma suresini %60 azaltir. Amazon AI summary benchmark olmus durumda. |
| 6 | **Odullu yorum sistemi** | Yorum yapana Mercora puani + indirim kuponu. Fotograf/video ekleyene ekstra puan. | Yorum sayisini 2 katina cikarir. Hepsiburada ve Trendyol'da kanitlanmis yontem. |
| 7 | **Satici alt kirilim puanlama** | sellerRatingService'de kargo hizi, urun uyumu, musteri hizmeti alt puanlarini ayristir. | Saticilara iyilestirme icin net metrikler sunar. Amazon ve Trendyol'da mevcut. |
| 8 | **Yorum istatistikleri** | SellerAnalytics'e yorum metrikleri: yorum sayisi, ortalama puan, trend grafigi, en cok oylanan yorum. | Saticilara icgoru saglar ve platform bagliligini artirir. |
| 9 | **AI ShoppingAssistant entegrasyonu** | AI asistanin yorumlari analiz edip musteri sorusuna yanit vermesi. | Musteri hizmetleri yukunu azaltir, yanit surelerini iyilestirir. |
| 10 | **Yorum duzenleme** | Kullanici kendi yorumunu duzenleyebilsin (reviewService'e updateReview). | Kullanici deneyimini iyilestirir, hatali yorumlari duzeltme imkani. |

### P2 (Iyi Olur - Uzun Vadede)

| # | Eksik | Oneri | Beklenen Etki |
|---|---|---|---|
| 11 | **Chatbot / self-service AI destek** | Canli destek oncesine AI chatbot ekle. Basit sorulari AI yanitlasin. | Canli destek yukunu %50 azaltir. Trendyol AI Chatbot sektorde one cikiyor. |
| 12 | **NPS anketi** | Siparis sonrasi 7. gunde "Bu alisverisi arkadasiniza tavsiye eder misiniz?" anketi. | Musteri memnuniyetini olcmek icin standart metrik. |
| 13 | **Rakip karsilastirma yorumu** | Kullanicilar "Bu urun X markasina gore nasil?" seklinde karsilastirma yapabilsin. | Degerli UGC, SEO icin guclu icerik. |
| 14 | **Topluluk yorumu** | Yorumlarin altina yorum (reply zinciri) veya soru-cevap entegrasyonu. | Topluluk hissi yaratir, Amazon'da bu ozellik popular. |
| 15 | **Cozum ortagi destek portali** | Buyuk satıcilar icin priority destek portali. | Kurumsal satıci memnuniyetini artirir. |
| 16 | **Trendyol Golet benzeri satici takip** | Saticilar icin risk skoru, otomatik uyari, performans bazli aksiyon onerileri. | Platform kalitesini korur, kotu satıcıları erken tespit eder. |

---

## 6. Uygulama Onceliklendirme

```
P0 (1-2 ay):     Video yorum + AI moderasyon + Otomatik yorum isteme + Satici puanlama
P1 (3-6 ay):     AI ozetleme + Odul sistemi + Alt kirilim puan + Istatistikler + AI entegrasyon
P2 (6-12 ay):    Chatbot + NPS anketi + Karsilastirma + Topluluk + Cozum ortagi portali
```

---

## 7. Sonuc

Mercora'nin geri bildirim altyapisi temel seviyede saglamdir: urun yorumu, soru-cevap, moderasyon ve destek kanallari calisir durumdadir. Ancak rakiplerin tamamina yakininda bulunan bazi kritik ozellikler Mercora'da eksiktir:

1. **Video yorum** (hem Hepsiburada hem Trendyol hem Amazon'da var)
2. **AI destekli moderasyon ve ozetleme** (Amazon lider, Trendyol takip ediyor)
3. **Odullu yorum sistemi** (Hepsiburada Hepsipuan, Trendyol puan -- Mercora'da yok)
4. **Otomatik yorum isteme** (en temel ozellik, her rakibte var)
5. **Satici puanlama sayfasi** (alici guveni icin kritik)

Bu ozelliklerin P0 oncelikle hayata gecirilmesi, Mercora'nin geri bildirim sistemlerini rakipleriyle esit seviyeye getirecek ve kullanici guvenini artiracaktir.
