# Mercora Çoklu Ajan Uygulama Planı

**Tarih:** 19 Mayıs 2026
**Toplam Madde:** 29 (4 Faz)
**Ajan Sayısı:** 7 rol / ~12+ ajan

---

## Ajan Tanımları

| Rol | İsim | Görev | Araçlar |
|-----|------|-------|---------|
| 👑 CEO | strateji-ustasi | Stratejik kararlar, önceliklendirme, kalite onayı | Planlama, kod inceleme |
| 📋 Manager | is-koordinatörü | İş dağıtımı, takip, raporlama | TaskCreate, Agent dispatch |
| 🖥️ FE Uzmanı | frontend-ustasi | React/Next.js/UI komponentleri | Kod yazma, refactor |
| 🖥️ BE Uzmanı | backend-ustasi | Express/Firebase/Stripe/API | Kod yazma, entegrasyon |
| 🎨 Tasarım Uzmanı | tasarim-ustasi | UI/UX, A11Y, CSS, animasyon | Kod yazma, review |
| ⚙️ Sistem Op. | sistem-operatoru | Altyapı, monitoring, DevOps | Yapılandırma, deployment |
| 🔍 Araştırmacı | arastirmaci | Teknoloji araştırması, dokümantasyon | WebSearch, WebFetch |
| 📊 Rekabet Analisti | rekabet-analisti | Pazar araştırması, karşılaştırma | WebSearch, analiz |

---

## Faz 1: Production Temeli (7 madde)

### 1.1 Next.js/Remix SSR Geçişi
- **Ajanlar:** araştırmacı → frontend-ustasi + backend-ustasi
- **İşlem:**
  1. Araştırmacı: Next.js 15 vs Remix karşılaştırması, mevcut kod uyumluluğu
  2. FE Uzmanı: Next.js kurulumu, sayfaların taşınması
  3. BE Uzmanı: API route'ları, server components
- **Çıktı:** SSR çalışan Next.js uygulaması

### 1.2 Schema.org JSON-LD
- **Ajanlar:** araştırmacı → frontend-ustasi
- **İşlem:**
  1. Araştırmacı: Google'un yapısal veri kılavuzu
  2. FE Uzmanı: JSON-LD bileşenleri (Product, BreadcrumbList, Organization, WebSite, Review, FAQ)
- **Çıktı:** Tüm sayfalarda JSON-LD

### 1.3 Sitemap.xml + robots.txt
- **Ajanlar:** frontend-ustasi
- **İşlem:** Dinamik sitemap oluşturma, robots.txt yapılandırması

### 1.4 Arama Motoru (Typesense/Meilisearch)
- **Ajanlar:** araştırmacı → backend-ustasi
- **İşlem:**
  1. Araştırmacı: Typesense vs Meilisearch karşılaştırması
  2. BE Uzmanı: Entegrasyon, veri senkronizasyonu

### 1.5 Stripe Webhook
- **Ajanlar:** backend-ustasi
- **İşlem:** Express webhook endpoint, sipariş durumu otomatik güncelleme

### 1.6 Sentry Monitoring
- **Ajanlar:** sistem-operatoru
- **İşlem:** Sentry kurulumu, hata yakalama, source maps

### 1.7 handleFirestoreError Fix
- **Ajanlar:** backend-ustasi
- **İşlem:** Hata mesajlarından hassas veri temizleme

---

## Faz 2: UX ve Erişilebilirlik (8 madde)
## Faz 3: İş Geliştirme (8 madde)
## Faz 4: İnovasyon (6 madde)

*Detaylar her faza geçişte genişletilecek.*

---

## Çalışma Prensipleri

1. **Her madde için** bir task oluşturulur
2. **Paralel ajanlar** bağımsız işlerde eşzamanlı çalışır
3. **Her adımda** CEO kalite kontrolü yapar
4. **Her faz sonu** raporlama
5. **Commit** her tamamlanan madde sonrası
