# Next.js 15 vs Remix — Karşılaştırma Raporu

**Tarih:** 19 Mayıs 2026
**Hazırlayan:** Araştırma Ajanı (arastirmaci)

---

## Proje Profili (Mevcut Durum)

| Boyut | Değer |
|---|---|
| Sayfa sayısı | 30+ |
| Servis modülü | 26 adet |
| Context provider | 8 adet |
| Routing | react-router-dom v7 |
| State yönetimi | Context API |
| Veri katmanı | Firebase Firestore (doğrudan frontend çağrıları) |
| Backend | Express.js (74 satır, 2 endpoint) |
| UI | Tailwind CSS 4 + Motion |
| Bileşen | ~90+ TSX/TS dosyası |

---

## Kriter Bazında Karşılaştırma

### 1. Kod Taşıma Kolaylığı

| Kriter | Next.js 15 | Remix |
|---|---|---|
| Routing | Düşük uyum. react-router-dom nested routes → App Router dosya tabanlı routing. Tüm route yapısı değişir. | Orta uyum. Remix react-router'un yaratıcılarından. V7 API'si Remix'e daha yakın. |
| Context API | 'use client' yönergesi eklemek gerekir | Doğrudan çalışır |
| Servis katmanı | Doğrudan çalışır | Doğrudan çalışır |
| Motion animasyonları | 'use client' ile çalışır, 250+ noktaya etiket eklenmeli | Client-side'da çalışır |
| Helmet (SEO) | Next.js built-in Head veya metadata export | Meta + Links ile native çözüm |

### 2. SSR/SSG/ISR Desteği

| Özellik | Next.js 15 | Remix |
|---|---|---|
| SSR | dynamic = 'force-dynamic' | Varsayılan (her şey SSR) |
| SSG | generateStaticParams() | loader ile cache kontrolü |
| ISR | revalidate ile **native** | Yok |
| Streaming | React 19 Suspense ile native | Yok |
| Edge Runtime | Var | Cloudflare Workers var |

**E-ticaret için kritik:** Next.js'in **ISR** özelliği, ürün sayfaları gibi sık değişmeyen ama anlık güncellenmesi gereken sayfalar için idealdir. Remix'te bu yok.

### 3. Firebase Entegrasyonu

| Kriter | Next.js 15 | Remix |
|---|---|---|
| Firestore (client) | 'use client' ile aynı | Aynı |
| Firestore (server) | Admin SDK ile | loader'larda Admin SDK ile |
| SSR ile auth | Orta (cookie/session elle) | Daha kolay |

### 4. E-Ticaret Uygunluğu

| Özellik | Next.js 15 | Remix |
|---|---|---|
| ISR (ürün sayfası) | **Var** (en büyük avantaj) | Yok |
| Kategori sayfaları | ISR + generateStaticParams | SSR ile yeterli |
| SEO metadata | generateMetadata() | meta() export |
| Görsel optimizasyonu | next/image ile **built-in** | Manuel |
| Stripe entegrasyonu | API Routes ile kolay | Action fonksiyonları ile kolay |

### 5. Topluluk ve Ekosistem

| Metrik | Next.js 15 | Remix |
|---|---|---|
| GitHub yıldız | ~135K+ | ~31K+ |
| npm haftalık indirme | ~8M+ | ~500K+ |
| Enterprise adoption | Çok yüksek (Vercel) | Shopify bünyesinde |

### 6. Performans ve SEO

| Özellik | Next.js 15 | Remix |
|---|---|---|
| SEO | generateMetadata + next/image + ISR → **En iyi** | meta() export ile yeterli |
| Core Web Vitals | Otomatik resim optimizasyonu | Manuel optimizasyon |
| Bundle size | PPR ile çok iyi | Loader-based code splitting ile iyi |
| TTFB | ISR ile çok hızlı | SSR her zaman server hesap bekler |

### 7. Migration Zorluğu

**Next.js 15:**
- Tüm react-router-dom route yapısı → app/ dizini
- 90+ dosyaya 'use client' eklenmeli
- Express.js server kalkar → API Routes
- Helmet → generateMetadata()
- **Tahmini süre: 2-4 hafta**

**Remix:**
- Daha az route değişikliği
- Servis katmanı loader'lara taşınmalı
- **Tahmini süre: 1.5-3 hafta**

---

## Skor Tablosu (1-10)

| Kriter | Next.js 15 | Remix |
|---|---|---|
| Kod taşıma kolaylığı | 5 | 7 |
| SSR/SSG/ISR | **10** | 6 |
| Firebase entegrasyonu | 7 | **8** |
| E-ticaret uygunluğu | **9** | 6 |
| Topluluk/ekosistem | **10** | 5 |
| Performans/SEO | **10** | 7 |

**Genel Skor: Next.js 15: 8.0 / Remix: 6.4**

---

## Tavsiye: Next.js 15 (App Router)

**Gerekçeler:**
1. **ISR** e-ticaret için kritik
2. **next/image** ile otomatik görsel optimizasyonu (Core Web Vitals)
3. **Topluluk** 10 kat büyük
4. **generateMetadata()** ile typesafe SEO
5. **Vercel ekosistemi** ile büyüme potansiyeli

**Migration Stratejisi:**
1. Firebase Admin SDK ile server-side Firestore erişimi ekleme
2. Ürün/kategori sayfalarında server-side veri çekme
3. Client-side Firebase çağrılarını kademeli server-side'a taşıma
4. ISR ile statik sayfa üretimi + güncelleme

**Hemen geçilmesi gerekmiyor.** Mevcut Vite + React çalışıyor. Ancak SEO önemliyse Next.js 15 en mantıklı tercih.
