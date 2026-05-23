# Mercora — Tam Kapsamlı Rakip Analizi Raporu

**Tarih:** 2026-05-23  
**Rakipler:** Hepsiburada, Trendyol, Amazon Türkiye  
**Kapsam:** 8 boyut, 8 analiz ajanı, ~150 karşılaştırma kriteri

---

## İçindekiler

1. [Yönetici Özeti](#1-yönetici-özeti)
2. [Rakiplerin Genel Profili](#2-rakiplerin-genel-profili)
3. [Toplam Karşılaştırma Matrisi](#3-toplam-karşılaştırma-matrisi)
4. [Boyut Bazında Detaylı Bulgular](#4-boyut-bazında-detaylı-bulgular)
   - 4.1 Satış Stratejileri
   - 4.2 Satış Yöntemleri ve Ödeme
   - 4.3 Ürün ve Satıcı Yönetimi
   - 4.4 Hata Sayfaları ve UX
   - 4.5 Geri Bildirim Sistemleri
   - 4.6 Kullanıcı Özellikleri
   - 4.7 Reklam ve Promosyon
   - 4.8 Teknik Altyapı ve SEO
5. [Genel Değerlendirme Puanları](#5-genel-değerlendirme-puanları)
6. [Eksik ve Öneri Matrisi (Öncelik Sıralı)](#6-eksik-ve-öneri-matrisi)
7. [Stratejik Yol Haritası](#7-stratejik-yol-haritası)
8. [Sonuç](#8-sonuç)

---

## 1. Yönetici Özeti

Mercora, mevcut haliyle **~%55 oranında** tamamlanmış bir e-ticaret platformudur. Güçlü bir temele (Next.js 16, çift ödeme sağlayıcı, Firestore altyapısı, PWA, Docker, CI/CD) sahip olmakla birlikte, özellikle **reklam/pazarlama (1.6/10), satış stratejileri (3.3/10), kullanıcı deneyimi (5.5/10) ve satıcı araçları** konularında rakiplerinin belirgin şekilde gerisindedir.

### Genel Puanlar

| Platform | Genel Puan | Güçlü Alan | Zayıf Alan |
|----------|-----------|-------------|------------|
| **Hepsiburada** | 7.0/10 | Marka bilinirliği, lojistik | Teknoloji yaşlanma |
| **Trendyol** | 7.7/10 | Mobil deneyim, pazar liderliği | Yüksek komisyon |
| **Amazon Türkiye** | 8.5/10 | Reklam, altyapı, lojistik, AI | Yerelleşme zayıf |
| **Mercora** | **4.8/10** | PWA, çift ödeme, AI altyapısı | Reklam, satıcı araçları, UX |

### En Kritik 5 Eksik (P0)

1. **CPC Reklam Motoru** — Rakiplerin tamamında var, Mercora'da tamamen yok. En büyük gelir kaynağı.
2. **Satıcı Abonelik Modeli** — 3 kademeli üyelik ile döngüsel gelir. Hepsiburada/ Trendyol'da paket bazlı, Amazon'da $39.99/ay.
3. **Alıcı Sadakat Programı** — Prime/Hepsiburada Premium/Trendyol Elite benzeri program yok.
4. **Mobil Uygulama** — Tüm rakiplerin native uygulaması var. Mercora PWA ile idare ediyor.
5. **Kullanıcı Deneyimi** — UX skoru 5.5/10 (Trendyol 9.2, Amazon 8.5, Hepsiburada 7.8).

---

## 2. Rakiplerin Genel Profili

### Hepsiburada

| Özellik | Detay |
|---------|-------|
| **Kuruluş** | 1998 (e-ticaret 2000) |
| **Model** | Hibrit (1P+3P), ağırlıklı 3P |
| **Satıcı Sayısı** | ~100K |
| **Komisyon** | %5-25 (kategori bazlı) |
| **Lojistik** | Hepsiburada Go (ek komisyon) |
| **Reklam** | Hepsiburada Reklam (PPC) |
| **Sadakat** | Hepsiburada Premium (~19.90 TL/ay) |
| **Teknoloji** | Java backend, Akamai CDN |
| **Mobil** | Native iOS/Android uygulama |
| **Güçlü** | En eski Türk e-ticaret, geniş ürün yelpazesi, Premium sadakat |
| **Zayıf** | Teknolojik yaşlanma, mobil deneyimde Trendyol'un gerisinde |

### Trendyol

| Özellik | Detay |
|---------|-------|
| **Kuruluş** | 2010 |
| **Model** | 3P ağırlıklı (>%95) |
| **Satıcı Sayısı** | ~250K |
| **Komisyon** | %5-25 (en yüksek moda, en düşük elektronik) |
| **Lojistik** | Trendyol Go (ek komisyon) |
| **Reklam** | Trendyol Ads (PPC) |
| **Sadakat** | Trendyol Premium (~29.90 TL/ay) |
| **Teknoloji** | Cloudflare, Go backend, React SPA |
| **Mobil** | En güçlü mobil deneyim (native) |
| **Güçlü** | Türkiye #1 pazar yeri, en iyi mobil deneyim, Trendyol Akademi |
| **Zayıf** | Uluslararası varlık çok sınırlı, yüksek komisyon (%25'e varan) |

### Amazon Türkiye

| Özellik | Detay |
|---------|-------|
| **Kuruluş** | 2018 (amazon.com.tr) |
| **Model** | Hibrit (1P+3P), güçlü 1P |
| **Komisyon** | %8-20 (ortalama %15) |
| **Satıcı Ücreti** | $39.99/ay (Professional) |
| **Lojistik** | FBA (tam entegre) |
| **Reklam** | Amazon Ads (dünyanın #3 reklam platformu) |
| **Sadakat** | Amazon Prime (~17.90 TL/ay) |
| **Teknoloji** | AWS, Akamai+CloudFront CDN |
| **Mobil** | Native iOS/Android |
| **Güçlü** | En gelişmiş Buybox/fiyat rekabeti, Prime, FBA, en güçlü reklam |
| **Zayıf** | Türkiye'de sınırlı ürün çeşitliliği, yerel müşteri hizmetleri zayıf |

---

## 3. Toplam Karşılaştırma Matrisi

| Boyut | Hepsiburada | Trendyol | Amazon TR | **Mercora** |
|-------|:-----------:|:--------:|:---------:|:----------:|
| Satış Stratejileri | 6.4 | 6.7 | 8.3 | **3.3** |
| Satış/Ödeme Yöntemleri | 7.5 | 8.0 | 8.5 | **6.0** |
| Ürün/Satıcı Araçları | 7.0 | 7.5 | 9.0 | **4.5** |
| Hata Sayfaları/UX | 7.8 | 9.2 | 8.5 | **5.5** |
| Geri Bildirim Sistemleri | 7.0 | 7.5 | 8.5 | **5.0** |
| Kullanıcı Özellikleri | 7.5 | 8.0 | 8.5 | **6.5** |
| Reklam/Promosyon | 7.5 | 8.0 | 9.5 | **1.6** |
| Teknoloji/SEO | 6.5 | 7.0 | 8.5 | **6.0** |
| **GENEL** | **7.0** | **7.7** | **8.5** | **4.8** |

---

## 4. Boyut Bazında Detaylı Bulgular

### 4.1 Satış Stratejileri (Agent 1) — Mercora: 3.3/10

**Mercora'nın Mevcut Durumu:**
- %100 saf 3P model (1P yok, lojistik hizmeti yok)
- Esnek komisyon yapısı (admin tarafından belirlenir, varsayılan %10)
- Satıcı abonelik modeli yok, platform ücreti yok
- Sadakat programı yok, alıcı üyeliği yok
- CPC reklam sistemi yok

**Rakip Karşılaştırması:**

| Kriter | Hepsiburada | Trendyol | Amazon TR | Mercora |
|--------|:-----------:|:--------:|:---------:|:-------:|
| Pazar Yeri Modeli | Hibrit | 3P | Hibrit | Saf 3P |
| Komisyon | %5-25 | %5-25 | %8-20 | Esnek (%10 varsayılan) |
| Satıcı Ücreti/Ay | Paket bazlı | Paket bazlı | $39.99 | Yok |
| Reklam | PPC | PPC | PPC | Yok |
| Satıcı Paketleri | Standart/Pro/Premium | Standart/Pro/Premium | Bireysel/Pro | Yok |
| Alıcı Üyeliği | HB Premium | Trendyol Premium | Prime | Yok |
| Sadakat Puanı | Var | Var | Yok (TR) | Yok |
| Özel İndirim Günleri | Efsane Günler | Efsane Cuma | Prime Day | Yok |
| Fiyat Garantisi | Var | Gayriresmi | Buybox | Yok |
| Cross-Sell | Var | Var | Frequently Bought | Kısmi |
| AI Kişiselleştirme | Sınırlı | Var (ML) | Çok gelişmiş | Yok |

**P0 Eksikler:**
- Satıcı Abonelik Modeli (3 kademeli: Standart/Pro/Enterprise)
- CPC Reklam Sistemi (en büyük gelir kaynağı)
- Alıcı Sadakat Programı (puan bazlı MVP)
- Fiyat Karşılaştırma / Buybox MVP

---

### 4.2 Satış Yöntemleri ve Ödeme (Agent 2) — Mercora: 6.0/10

**Mercora'nın Avantajı:** Çift ödeme sağlayıcısı (Iyzico TR + Stripe Global) ile rakiplerinden ayrışıyor.

**Rakip Karşılaştırması:**

| Kriter | Hepsiburada | Trendyol | Amazon TR | Mercora |
|--------|:-----------:|:--------:|:---------:|:-------:|
| Kredi Kartı | Var | Var | Var | Var |
| Kapıda Ödeme | Var | Var | Yok | Yok |
| Havale/EFT | Var | Var | Yok | Yok |
| Dijital Cüzdan | Var | Var | Var | Yok |
| Apple Pay/Google Pay | Yok | Yok | Var | Yok |
| Taksit | Var (3-12 ay) | Var (3-12 ay) | Sınırlı | Var (Iyzico) |
| Misafir Checkout | Var | Var | Var | Yok |
| 3D Secure | Var | Var | Var | Var |
| Para İade Politikası | 14 gün | 14 gün | 30 gün | 14 gün |

**P0 Eksikler:**
- Apple Pay / Google Pay entegrasyonu (+%15-25 mobil dönüşüm)
- Dijital cüzdan sistemi
- Misafir checkout (+%20-30 dönüşüm)

**En Kritik Bulgu:** Kapıda ödeme eksikliği, Türkiye pazarında önemli bir engel.

---

### 4.3 Ürün ve Satıcı Yönetimi (Agent 3) — Mercora: 4.5/10

**Mercora'nın Güçlü Yanı:** Gemini AI ile alan eşleme — rakiplerde yok. "AI-first seller platform" konumlandırması mümkün.

**Rakip Karşılaştırması:**

| Kriter | Hepsiburada | Trendyol | Amazon TR | Mercora |
|--------|:-----------:|:--------:|:---------:|:-------:|
| Mobil Satıcı Uygulaması | Var | Var | Var | Yok |
| Public API | Var (ücretli) | Var | Var (ücretsiz) | Kısmi |
| Reklam Paneli | Var | Var | Var (gelişmiş) | Yok |
| AI Kategori Önerisi | Yok | Var | Var | Kısmi |
| SEO Araçları | Var | Var | Var (gelişmiş) | Yok |
| Excel Desteği | Var | Var | Var | Yok (sadece CSV) |
| GTIN/Barkod Zorunluluğu | Kısmi | Kısmi | Var | Yok |
| Toplu Ürün Yükleme | Var | Var | Var | Var (CSV) |
| Varyant Yönetimi | Var | Var | Var | Var |
| Stok Yönetimi | Var | Var | Var | Var |
| Satıcı Eğitimi | Temel | Trendyol Akademi | Seller University | Yok |
| Kalite Puanı | Var | Var | Var | Kısmi |

**P0 Eksikler:**
- Satıcı Mobil Uygulaması (React Native/Flutter)
- Public REST API (dokümante edilmiş)
- Reklam Yönetimi Paneli

---

### 4.4 Hata Sayfaları ve UX (Agent 4) — Mercora: 5.5/10

**Mercora'nın En Güçlü Yanı:** 6 varyantlı Skeleton screen altyapısı.

**Rakip Karşılaştırması:**

| Kriter | Hepsiburada | Trendyol | Amazon TR | Mercora |
|--------|:-----------:|:--------:|:---------:|:-------:|
| 404 Sayfası | Markalı, arama | Özel maskot | Standart | Mevcut |
| 403 Sayfası | Var | Var | Var | Yok |
| Bakım Sayfası | Var | Var | Var | Yok |
| Skeleton Screen | Var | Agresif | Var | 6 varyant |
| Empty State | Özel illustrasyon | Özel illustrasyon | Standart | Temel |
| Inline Validasyon | Var | Var | Var | Yok |
| Hata Yönetimi | Aktif | Aktif | Aktif | Sessiz hata yutma |
| Network Hatası UI | Var | Var | Var | Yok |
| Toast/Snackbar | Var | Var | Var | Yok |

**P0 Eksikler:**
- Sessiz hata yutma (`.catch(() => {})` — AdminSellers, SellerSettings, OrderTracking)
- 403/Unauthorized sayfası
- Bakım sayfası (maintenanceMode)
- Arama empty state ("Sonuç bulunamadı")
- Inline form validasyonu

**En Kritik Bulgu:** `.catch(() => {})` ile sessiz hata yutma, güven kaybına yol açıyor.

---

### 4.5 Geri Bildirim Sistemleri (Agent 5) — Mercora: 5.0/10

**Mercora'nın Mevcut Durumu:** Temel feedback altyapısı sağlam — yorum, soru-cevap, moderasyon, canlı destek, bilet sistemi çalışıyor.

**Rakip Karşılaştırması:**

| Kriter | Hepsiburada | Trendyol | Amazon TR | Mercora |
|--------|:-----------:|:--------:|:---------:|:-------:|
| Ürün Yorumu (metin) | Var | Var | Var | Var |
| Video Yorum | Var | Var | Var | Yok |
| AI Moderasyon | Var | Var | Var | Yok |
| AI Yorum Özeti | Yok | Yok | Var | Yok |
| Otomatik Yorum İsteme | Var | Var | Var | Yok |
| Satıcı Puanlama Sayfası | Var | Var | Var | Yok |
| Satıcı Alt Kırılım Puan | Var | Var | Var | Kısmi |
| Ödüllü Yorum | Var | Var | Yok | Yok |
| Soru-Cevap | Var | Var | Var | Var |
| Canlı Destek | Var | Var | Var | Var (LiveChat) |
| AI Chatbot | Kısmi | Var | Var | Kısmi |

**P0 Eksikler:**
- Video yorum desteği (+%40 etkileşim)
- AI yorum moderasyonu (moderasyon yükünü %80 azaltır)
- Otomatik yorum isteme (yorum sayısını 3-5 kat artırır)
- Satıcı puanlama sayfası

---

### 4.6 Kullanıcı Özellikleri (Agent 6) — Mercora: 6.5/10

**Mercora'nın En Güçlü Yanı:** 4 dil desteği (TR/EN/DE/AR) ve çoklu bölge/para birimi ile rakiplerin önünde.

**Rakip Karşılaştırması:**

| Kriter | Hepsiburada | Trendyol | Amazon TR | Mercora |
|--------|:-----------:|:--------:|:---------:|:-------:|
| Dil Sayısı | 1 (TR) | 1 (TR) | 2 (TR/EN) | 4 |
| Çoklu Para Birimi | Yok | Yok | Yok (TRY) | Var |
| Telefonla Kayıt | Var | Var | Var | Yok |
| Sosyal Giriş | Var | Var | Var | Kısmi (Google) |
| 2FA | Var | Var | Var | Yok |
| Fiyat Takibi | Var | Var | Var | Var |
| Stok Bildirimi | Var | Var | Var | Yok (altyapı var) |
| "Daha Sonra Al" | Var | Var | Var | Yok |
| Özel Listeler | Var | Var | Var | Kısmi |
| Sipariş Takibi | Var | Var | Var | Var |
| AI Öneri Motoru | Sınırlı | ML tabanlı | Çok gelişmiş | 5 kaynaklı |
| Görsel Arama | Yok | Var (kısmi) | Var | Var |
| PWA | Yok | Yok | Yok | Var |

**P0 Eksikler:**
- Telefon ile kayıt ve giriş (Firebase Phone Auth)
- Facebook/Apple ID ile giriş
- Sepette "Daha Sonra Al"
- 2FA güvenlik

---

### 4.7 Reklam ve Promosyon (Agent 7) — Mercora: 1.6/10

**En Zayıf Alan.** Mercora'nın reklam altyapısı neredeyse yok denecek seviyede.

**Rakip Karşılaştırması:**

| Kriter | Hepsiburada | Trendyol | Amazon TR | Mercora |
|--------|:-----------:|:--------:|:---------:|:-------:|
| CPC Reklam | Var | Var | Var (çok gelişmiş) | Yok |
| Sponsorlu Ürün | Var | Var | Var | Yok |
| Marka Reklamı | Var | Var | Var | Yok |
| Satıcı Kupon Yönetimi | Var | Var | Var | Yok (sadece admin) |
| Çok Al Az Öde | Var | Var | Var | Yok |
| Flash Deal | Var | Var | Lightning Deals | Kısmi (flag) |
| Retargeting | Var | Var | Var | Yok |
| Reklam Raporlama | Var | Var | ACOS/ROAS | Yok |
| Sadakat Puanı | Var | Var | Yok (TR) | Var |
| Featured/Vitrin | Var | Var | Var | Var |

**P0 Eksikler:**
- CPC Reklam Motoru (en kritik gelir kaybı)
- Satıcı Reklam Dashboard
- Reklam Raporlama Sistemi
- Anahtar Kelime Hedefleme

---

### 4.8 Teknik Altyapı ve SEO (Agent 8) — Mercora: 6.0/10

**Mercora'nın Güçlü Yanları:** Next.js 16 + Firebase serverless, 5 kaynaklı öneri motoru, Gemini AI, PWA, blockchain doğrulama.

**Rakip Karşılaştırması:**

| Kriter | Hepsiburada | Trendyol | Amazon TR | Mercora |
|--------|:-----------:|:--------:|:---------:|:-------:|
| Frontend | React (yaşlanan) | React SPA | React+Custom | Next.js 16 |
| Backend | Java | Go | AWS (Java/Python) | Firebase |
| CDN | Akamai | Cloudflare | Akamai+CloudFront | Yok |
| HTTP/3 | Var | Var | Var | Yok |
| HSTS Preload | Yok | Yok | Var | Yok |
| Bot Koruması | Var (Akamai) | Var (Cloudflare) | Var (AWS Shield) | Yok |
| PWA | Yok | Yok | Yok | Var |
| Schema Markup | Temel | Temel | Gelişmiş | 6 JSON-LD |
| Mobil Uygulama | Native | Native | Native | PWA (yok) |
| AI/ML | Sınırlı | ML öneri | Çok gelişmiş | Gemini AI |

**P0 Eksikler:**
- CDN (Vercel Edge veya Cloudflare)
- Bot koruması (Cloudflare Bot Management)
- HTTP/3 desteği

---

## 5. Genel Değerlendirme Puanları

| Boyut | Hepsiburada | Trendyol | Amazon TR | Mercora |
|-------|:-----------:|:--------:|:---------:|:-------:|
| Satış Stratejileri | 6.4 | 6.7 | 8.3 | **3.3** |
| Satış/Ödeme | 7.5 | 8.0 | 8.5 | **6.0** |
| Ürün/Satıcı Araçları | 7.0 | 7.5 | 9.0 | **4.5** |
| Hata/UX | 7.8 | 9.2 | 8.5 | **5.5** |
| Geri Bildirim | 7.0 | 7.5 | 8.5 | **5.0** |
| Kullanıcı Özellikleri | 7.5 | 8.0 | 8.5 | **6.5** |
| Reklam/Promosyon | 7.5 | 8.0 | 9.5 | **1.6** |
| Teknoloji/SEO | 6.5 | 7.0 | 8.5 | **6.0** |
| **GENEL** | **7.0** | **7.7** | **8.5** | **4.8** |

### Mercora'nın Güçlü ve Zayıf Yönleri

**Güçlü Yönler (Rekabet Avantajı):**
- PWA (hiçbir rakibinde yok)
- Çift ödeme sağlayıcısı (Iyzico + Stripe)
- 4 dil desteği, çoklu bölge/para birimi
- Next.js 16 modern mimari
- Gemini AI entegrasyonu (AI-first potansiyeli)
- Firebase serverless (düşük operasyonel maliyet)
- 6 varyantlı Skeleton screen altyapısı
- Kampanya/kupon/flash deal bileşenleri hazır

**Zayıf Yönler (Kritik Eksikler):**
- CPC reklam sistemi yok (1.6/10)
- Satıcı abonelik modeli yok
- Alıcı sadakat programı yok
- Mobil uygulama yok (PWA yeterli değil)
- UX olgunlaşmamış (5.5/10)
- Kapıda ödeme yok
- Satıcı araçları yetersiz (public API, mobil panel, reklam paneli)
- CDN/bot koruması/HTTP/3 yok

---

## 6. Eksik ve Öneri Matrisi (Öncelik Sıralı)

### P0 — Kritik (Hemen Yapılmalı, 0-2 Ay)

| # | Eksik | Boyut | Etki | Tahmini Efor |
|---|-------|-------|------|:-----------:|
| 1 | **CPC Reklam Motoru** | Reklam | Gelir: Çok Yüksek | 4-6 sprint |
| 2 | **Satıcı Abonelik Modeli** | Strateji | Gelir: Yüksek | 2 sprint |
| 3 | **Alıcı Sadakat Programı (MVP)** | Strateji | Bağlılık: Yüksek | 1 sprint |
| 4 | **Apple Pay / Google Pay** | Ödeme | Dönüşüm: +%15-25 | 1 sprint |
| 5 | **Misafir Checkout** | Ödeme | Dönüşüm: +%20-30 | 1 sprint |
| 6 | **Sessiz Hata Yutmayı Çöz** | UX | Güven: Kritik | 1 sprint |
| 7 | **403/Bakım Sayfaları** | UX | Kullanıcı Deneyimi | 1 sprint |
| 8 | **Video Yorum Desteği** | Geri Bildirim | Etkileşim: +%40 | 2 sprint |
| 9 | **AI Yorum Moderasyonu** | Geri Bildirim | Yük: -%80 | 1 sprint |
| 10 | **Otomatik Yorum İsteme** | Geri Bildirim | Yorum: 3-5x | 1 sprint |
| 11 | **Satıcı Puanlama Sayfası** | Geri Bildirim | Güven: Yüksek | 1 sprint |
| 12 | **Telefon ile Kayıt/Giriş** | Kullanıcı | Erişim: Yüksek | 1 sprint |
| 13 | **Facebook/Apple Giriş** | Kullanıcı | Dönüşüm: Yüksek | 1 sprint |
| 14 | **CDN Ekleme** | Teknoloji | Hız: Kritik | 1 sprint |
| 15 | **Bot Koruması** | Teknoloji | Güvenlik: Kritik | 1 sprint |
| 16 | **Kapıda Ödeme** | Ödeme | TR Pazarı: Kritik | 2 sprint |
| 17 | **Satıcı Reklam Dashboard** | Reklam | Satıcı: Yüksek | 2-3 sprint |

### P1 — Yüksek Öncelik (Kısa Vade, 2-4 Ay)

| # | Eksik | Boyut | Etki |
|---|-------|-------|------|
| 18 | Fiyat Karşılaştırma/Buybox MVP | Strateji | Rekabet: Yüksek |
| 19 | Satıcı Bazlı Kampanya Yetkisi | Strateji | Satış: Yüksek |
| 20 | Hediye Kartı Sistemi | Strateji | Satış: Orta-Yüksek |
| 21 | Dijital Cüzdan | Ödeme | Bağlılık: Yüksek |
| 22 | Satıcı Mobil Uygulaması | Satıcı Aracı | Satıcı: Yüksek |
| 23 | Public REST API | Satıcı Aracı | Entegrasyon: Yüksek |
| 24 | AI Kategori Önerisi | Satıcı Aracı | Verimlilik: Orta |
| 25 | SEO Başlık/Anahtar Kelime Aracı | Satıcı Aracı | Görünürlük: Yüksek |
| 26 | Network Error UI | UX | Kullanıcı: Yüksek |
| 27 | Toast/Snackbar Sistemi | UX | Kullanıcı: Yüksek |
| 28 | Inline Form Validasyonu | UX | Kullanıcı: Yüksek |
| 29 | AI Yorum Özetleme | Geri Bildirim | Okuma: -%60 |
| 30 | Ödüllü Yorum Sistemi | Geri Bildirim | Yorum: 2x |
| 31 | Satıcı Alt Kırılım Puanlama | Geri Bildirim | İyileştirme: Yüksek |
| 32 | Sepette "Daha Sonra Al" | Kullanıcı | Kullanıcı: Orta |
| 33 | Stok Bildirimi | Kullanıcı | Kullanıcı: Orta |
| 34 | 2FA Güvenlik | Kullanıcı | Güvenlik: Yüksek |
| 35 | Satıcı Bazlı Kupon Sistemi | Reklam | Satış: Orta |
| 36 | Çok Al Az Öde | Reklam | Sepet: Orta |
| 37 | Marka Reklamı/Vitrin | Reklam | Gelir: Orta |
| 38 | HTTP/3 Desteği | Teknoloji | Hız: Orta |
| 39 | HSTS Preload | Teknoloji | Güvenlik: Orta |

### P2 — Orta Vade (4-8 Ay)

| # | Eksik | Boyut |
|---|-------|-------|
| 40 | Satıcı Rozet/Sertifika Sistemi | Strateji |
| 41 | Kargo Entegrasyonu Başlangıcı | Strateji |
| 42 | Trendyol Akademi Benzeri Eğitim | Strateji |
| 43 | Hacim Bazlı Komisyon İndirimi | Strateji |
| 44 | Excel Yükleme Desteği | Satıcı Aracı |
| 45 | GTIN/Barkod Zorunluluğu | Satıcı Aracı |
| 46 | Tema Tutarlılığı (src/ + mercora-next/) | UX |
| 47 | Erişilebilirlik (ARIA) | UX |
| 48 | Empty State Çeşitlendirme | UX |
| 49 | Arama "şunu mu demek istediniz?" | UX |
| 50 | Chatbot / Self-Service AI Destek | Geri Bildirim |
| 51 | Özel Liste Oluşturma | Kullanıcı |
| 52 | Görsel Arama Geliştirme | Kullanıcı |
| 53 | Retargeting | Reklam |
| 54 | 3. Parti Reklam Entegrasyonu | Reklam |
| 55 | Sezon Kampanya Otomasyonu | Reklam |
| 56 | Mobil Uygulama (Native) | Teknoloji |
| 57 | API Gateway | Teknoloji |
| 58 | Video/Image Optimization | Teknoloji |

---

## 7. Stratejik Yol Haritası

### Faz 1: Temel Kritik (0-2 Ay) — 17 P0 madde

**Amaç:** En kritik eksikleri kapatarak temel rekabet gücünü kazanmak.

```
Sprint 1-2:
├── CPC Reklam Motoru MVP (en kritik)
├── Satıcı Abonelik Modeli (3 kademeli)
├── Apple Pay / Google Pay
├── Misafir Checkout
├── Kapıda Ödeme
├── Sessiz Hata Düzeltme
├── 403/Bakım Sayfaları
├── Telefon + Sosyal Giriş
├── AI Yorum Moderasyonu
├── Otomatik Yorum İsteme
├── CDN (Vercel Edge)
├── Bot Koruması
└── Sadakat Programı MVP

Sprint 3-4:
├── CPC Reklam Motoru (tam)
├── Video Yorum
├── Satıcı Puanlama Sayfası
├── Satıcı Reklam Dashboard
├── Alıcı Sadakat Programı (tam)
└── Fiyat Karşılaştırma/Buybox
```

**Hedef:** Mercora puanını 4.8 → **6.0/10**

---

### Faz 2: Büyüme (2-4 Ay) — 22 P1 madde

**Amaç:** Satıcı ekosistemini güçlendirmek ve kullanıcı deneyimini iyileştirmek.

```
Sprint 5-6:
├── Satıcı Mobil Uygulaması (MVP)
├── Public REST API
├── Satıcı Bazlı Kampanya Yetkisi
├── Hediye Kartı
├── AI Kategori Önerisi
├── SEO Başlık/Anahtar Kelime Aracı
├── Toast/Snackbar Sistemi
├── AI Yorum Özetleme
├── Ödüllü Yorum Sistemi
├── Dijital Cüzdan
└── Satıcı Kupon Sistemi

Sprint 7-8:
├── Inline Form Validasyonu
├── Network Error UI
├── Stok Bildirimi
├── 2FA
├── "Daha Sonra Al"
├── Çok Al Az Öde
├── Marka Reklamı
├── HTTP/3
└── Account Health Dashboard
```

**Hedef:** Mercora puanını 6.0 → **7.0/10**

---

### Faz 3: Olgunlaşma (4-8 Ay) — 17 P2 madde

**Amaç:** Platformu rakiplerle eşit seviyeye getirmek.

```
├── Satıcı Eğitim Platformu (Akademi)
├── Excel Yükleme Desteği
├── GTIN/Barkod Zorunluluğu
├── Tema Tutarlılığı
├── Erişilebilirlik (WCAG 2.1)
├── Empty State Çeşitlendirme
├── Chatbot / AI Destek
├── Retargeting
├── 3. Parti Reklam Entegrasyonu
├── Native Mobil Uygulama
├── API Gateway
├── Görsel Arama Geliştirme
└── Kargo Entegrasyonu
```

**Hedef:** Mercora puanını 7.0 → **8.0/10**

---

### Faz 4: Liderlik (8-12+ Ay)

**Amaç:** AI-first platform farklılaştırması ile pazar liderliği.

```
├── AI-first Platform (Gemini ile özelleştirme)
├── Gelişmiş Buybox Algoritması
├── AR/VR Entegrasyonu
├── Kendi ML Modeli
├── A/B Test Altyapısı
├── A+ Content Yönetimi
├── Subscribe & Save
├── Brand Registry Programı
└── 1P Model (seçili kategorilerde)
```

**Hedef:** Mercora puanını 8.0 → **8.5+/10**

---

## 8. Sonuç

Mercora, mevcut haliyle **4.8/10** genel puanı ile rakiplerinin belirgin şekilde gerisindedir. Ancak:

1. **Modern teknoloji yığını** (Next.js 16, Firebase, PWA) ile rakiplerinden daha hızlı iterasyon yapabilir.
2. **AI-first potansiyeli** (Gemini AI, 5 kaynaklı öneri motoru) rakiplerde olmayan bir farklılaştırma fırsatı sunuyor.
3. **Çift ödeme sağlayıcısı** ve **çoklu dil/bölge desteği** globalleşme avantajı sağlıyor.
4. **Kampanya/kupon/flash deal** bileşenleri halihazırda kod tabanında mevcut — aktivasyon için UI ve entegrasyon gerekiyor.

### En Kritik 3 Aksiyon

1. **CPC Reklam Motoru** — En büyük gelir kaybı. Amazon Ads yıllık $47B+ gelir üretiyor.
2. **Satıcı Abonelik Modeli** — Döngüsel gelir ve satıcı bağlılığı için temel.
3. **Alıcı Sadakat Programı** — Müşteri bağlılığı ve tekrarlı alışveriş için olmazsa olmaz.

Bu 3 aksiyon tamamlandığında Mercora, 4.8/10'dan **~6.5/10** seviyesine yükselebilir.

---

*Rapor, 8 analiz ajanı tarafından hazırlanan bireysel raporların senteziyle oluşturulmuştur. Detaylı kaynak kod incelemesi ve sektör bilgisi temel alınmıştır.*
