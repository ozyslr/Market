# Rakip Analizi #4: Hata Sayfalari, UX ve Kullanici Deneyimi

**Tarih:** 2026-05-21
**Analist:** Ajan #4
**Rakipler:** Etsy, Amazon, Trendyol

---

## 1. Her Rakibin UX/Error Yaklasimi Ozeti

### Etsy (Skor: 8/10)
Etsy hata sayfalarinda maskot odakli, sicak ve yaratici bir yaklasim kullanir. 404 sayfasinda kendi mascot karakteri (quirky monster/creature) ile karsilama yapar, marka kisiligi hata aninda bile hissedilir. Bos durumlar (sepet, favori) illustrasyonlarla desteklenir, kullaniciya ozel oneriler sunulur. Loading pattern'lerinde skeleton screen + shimmer animasyonu kullanir. Form validasyonlari inline calisir, kirmizi sinir + hata metni + yardimci text uclemesiyle calisir. WCAG 2.1 AA hedeflidir.

### Amazon (Skor: 7/10)
Amazon'un 404'u "Dogpound" olarak bilinir, bir sheepdog illustrasyonu icerir. Oldukca minimalist ve utilitariandir: ozur mesaji, arama cubugu, ana sayfa ve musteri hizmetleri linki. 500 sayfasi da benzer sekilde minimaldir. Bos durumlar islevseldir (sepet bos, favori bos) ve sign-in CTA'si icerir. 1-Click UX'i endustri standardidir: sifir form doldurma, onceden kaydedilmis adres/odeme. Yukelemde skeleton placeholder kullanir, kritik icerigi once yukler. WCAG 2.1 AA (kismen) uyumludur.

### Trendyol (Skor: 7.5/10)
Trendyol 404 sayfasi Turk e-ticaret liderine uygun olarak dostane illustrasyon/ikon, "Sayfa Bulunamadi", ozur mesaji, arama cubugu, populer kategoriler grid'i ve ana sayfa linki icerir. Marka sesini hata sayfalarinda da korur. Bos durumlar illustrasyonlarla desteklenir: "Sepetiniz Bos" + favoriler + giris prompt'u. Loading'de markali animasyonlar kullanir (turuncu renk), skeleton kartlarla shimmer efekti uygular. Form validasyonlari Turkce locale uyumludur (telefon formati, TC kimlik). WCAG temel duzeydedir.

---

## 2. Hata Sayfalari Karsilastirma Tablosu

| Kriter | Etsy | Amazon | Trendyol | Mercora (Mevcut) |
|--------|------|--------|----------|-------------------|
| **404 Tasarimi** | Maskot illustrasyonu + marka tonu | Sheepdog illustrasyonu + minimal | Dostane ikon + populer kategoriler | Metin bazli, "Sayfa Bulunamadi" |
| **500/Error Sayfasi** | Markali hata mesaji | Minimal ozur + yonlendirme | Ozur + retry + iletisim | Hata ikonu + Tekrar Dene |
| **Yonlendirme** | Arama cubugu + kategoriler + ana sayfa | Arama + anasayfa + musteri hizmetleri | Kategori grid + arama + anasayfa | Ana Sayfaya Don + Geri Git |
| **Illustrasyon** | Var (maskot) | Var (sheepdog) | Var (ikon) | Yok (sadece ikon) |
| **Network Hatasi** | Retry butonu + mesaj | Retry + offline sayfasi | Retry + timeout uyarisi + yonlendirme | Yok |
| **Session Timeout** | Login redirect | Login redirect | Login redirect + mesaj | Yok |

---

## 3. Loading/Empty State Karsilastirmasi

| Kriter | Etsy | Amazon | Trendyol | Mercora (Mevcut) |
|--------|------|--------|----------|-------------------|
| **Loading Pattern** | Skeleton + shimmer | Skeleton placeholder | Markali skeleton + shimmer | Spinner (admin) |
| **Sepet Bos** | Illustrasyon + oneriler | Ikon + "Shop deals" CTA + sign-in | Illustrasyon + favoriler + giris | Yok |
| **Favori Bos** | Kalp ikonu + browse CTA | Kalp ikonu + oneriler | Kalp ikonu + browse CTA | Yok |
| **Arama Sonuc Yok** | Alternatif oneriler + kategoriler | "Did you mean?" + oneriler | Illustrasyon + alternatifler + kategoriler | Yok |
| **Siparis Gecmisi Bos** | Mesaj + CTA | Mesaj + "Start Shopping" | Mesaj + CTA | Yok |
| **Progressive Loading** | Var | Var (once kritik icerik) | Var (infinite scroll) | Yok |
| **PWA Offline Page** | Var | Var | Var | Yok |

---

## 4. Genel UX Kalitesi Degerlendirmesi (1-10)

| Kategori | Etsy | Amazon | Trendyol | Mercora |
|----------|------|--------|----------|---------|
| Hata Sayfalari | 8 | 7 | 7 | 5 |
| Loading/Empty States | 9 | 7 | 8 | 3 |
| Form Validasyonu | 8 | 8 | 7 | 4 |
| Erisilebilirlik (A11y) | 8 | 7 | 6 | 6 |
| Mobil UX | 9 | 7 | 8 | 5 |
| Onboarding/Ilk Deneyim | 6 | 7 | 7 | 3 |
| **Genel Skor** | **8.0** | **7.2** | **7.2** | **4.3** |

---

## 5. Mercora Icin Eksikler ve Oneriler

### Kritik Eksikler (Hemen Cozum)

1. **Empty State Bilesenleri Eksik** -- Sepet bos, favori bos, siparis yok, arama sonuc yok durumlari icin hicbir tasarim yok. Her bos durum: illustrasyon + aciklama + CTA + oneriler icermeli.

2. **Admin Loading Spinner** -- Sadece spinner kullaniliyor. Skeleton pattern'leri (shadcn/ui Skeleton) ile degistirilmeli. Grid/liste layout'unda placeholder kartlar gosterilmeli.

3. **Network Hata Yonetimi Yok** -- Fetch hatalari, timeout, session timeout, PWA offline sayfasi eksik. Her biri icin try/catch + kullanici dostu hata UI'i + retry mekanizmasi lazim.

4. **Form Validasyonu Eksik** -- Inline validation, field-level error, helper text pattern'i yok. Shadcn/ui Form bileseni (react-hook-form + zod) ile standartlastirilmali.

5. **404 Sayfasi Cok Basit** -- Illustrasyon/maskot, arama cubugu, populer kategoriler, marka tonu eksik. Sadece "Sayfa Bulunamadi" metni ve link yetersiz.

### Orta Oncelik (Kisa Vade)

6. **Onboarding Akisi Yok** -- Ilk kullanici deneyimi, hesap olusturma sonrasi yonlendirme, kategori secimi, bildirim izni alma akisi tasarlanmali.

7. **Hata Boundary'leri Genel Seviyede** -- Sadece global error.tsx var. Her ana bolum icin (urun listeleme, sepet, odeme, admin) ayri error boundary + Suspense boundary eklenmeli.

8. **PWA Offline Sayfasi** -- Service worker var ama offline durumunda kullaniciya gosterilecek ozel bir sayfa yok. network error ile offline ayrimi yapilmali.

9. **A11y Eksikleri** -- SkipToContent var ama focus management (modal, drawer), ARIA live regions (async guncellemeler), keyboard trap cozumu, renk kontrasti denetimi eksik.

### Dusuk Oncelik (Uzun Vade)

10. **Loading Animasyonu Markalasmasi** -- Spinner yerine Mercora marka renginde ozel loading animasyonu, pull-to-refresh indicator, skeleton shimmer efekti.

11. **404/500 Sayfa Illustrasyonlari** -- Ozgun Mercora maskotu veya illustrasyon seti. Hata sayfalari marka deneyiminin bir parcasi haline getirilmeli.

12. **404 Sayfasinda Arama + Kategoriler** -- Kaybolan kullaniciyi geri kazandirmak icin arama cubugu ve populer kategoriler grid'i eklenmeli.

### Uygulama Sirasi

1. Empty State bilesenleri (sepet, favori, siparis, arama) -- **1 hafta**
2. Form validasyonu standardizasyonu -- **1 hafta**
3. Admin loading skeleton + error boundary -- **3 gun**
4. Network error + offline sayfasi -- **3 gun**
5. 404/500 sayfa iyilestirmesi -- **2 gun**
6. A11y denetimi ve duzeltmeleri -- **1 hafta**
7. Onboarding akisi -- **2 hafta**
8. Markali loading animasyonlari -- **1 hafta**

---

*Rapor, web arastirmasi ve Mercora mevcut kod analizine dayanmaktadir. Rakip bilgileri genel kullanici deneyimi gozlemlerine dayanir.*
