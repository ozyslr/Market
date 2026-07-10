# Mağaza Özelleştirme — Design Spec

**Tarih:** 2026-07-10
**Hedef:** Trendyol seviyesinde satıcı mağaza deneyimi

---

## Kapsam (6 özellik)

### 1. Kurumsal Bilgiler

- `Seller` interface'e: `companyName`, `taxOffice`, `taxNumber`, `mersisNo`, `tradeRegistryNo`, `companyType`
- Store sayfasında "Kurumsal Bilgiler" sekmesi/tabı
- Settings sayfasında düzenleme formu
- Doğrulanmış bilgiler için ✅ rozeti (KYC onaylıysa)

### 2. Çoklu Banner/Carousel

- `StoreConfig`'a: `banners: Array<{imageUrl, link?, title?, order}>`
- Swiper/carousel ile otomatik geçiş (4sn)
- Settings sayfasında banner yönetimi (ekle/sil/sırala)
- Mobil uyumlu

### 3. Kategori Vitrini

- `StoreConfig`'a: `showcaseCategories: string[]` (kategori ID'leri)
- Store sayfasında seçili kategorileri kart grid'inde göster
- Her kart: kategori görseli + isim + ürün sayısı
- Settings'te çoklu seçim

### 4. Kampanya Alanı

- `StoreConfig`'a: `campaignBanner?: {title, description, imageUrl, link, active, endDate?}`
- Store sayfasında banner altına özel kampanya bölümü
- Aktif kampanya varsa göster, yoksa gizle
- Settings'te kampanya oluştur/düzenle

### 5. Video Embed

- `StoreConfig`'a: `videoUrl?: string` (YouTube/Vimeo URL)
- Store sayfasında "Tanıtım Videosu" bölümü
- iframe embed, 16:9 responsive

### 6. Hakkımızda Zenginleştirme

- `StoreConfig`'a: `aboutHtml?: string`, `certifications?: Array<{name, imageUrl}>`, `foundedYear?: number`
- Store sayfasında "Hakkımızda" sekmesini zenginleştir
- Timeline: kuruluş yılı, önemli kilometre taşları

---

## Veri Modeli

```typescript
// StoreConfig (storeConfigs/{sellerId}) eklenecekler:
interface StoreConfigExtended {
  // mevcut alanlar korunur
  banners?: { imageUrl: string; link?: string; title?: string; order: number }[];
  showcaseCategories?: string[];
  campaignBanner?: {
    title: string;
    description?: string;
    imageUrl: string;
    link?: string;
    active: boolean;
    endDate?: string;
  };
  videoUrl?: string;
  aboutHtml?: string;
  certifications?: { name: string; imageUrl: string }[];
  foundedYear?: number;
}

// Seller (sellers/{id}) eklenecekler:
interface SellerExtended {
  companyName?: string;
  taxOffice?: string;
  taxNumber?: string;
  mersisNo?: string;
  tradeRegistryNo?: string;
  companyType?: 'individual' | 'limited' | 'joint_stock' | 'other';
}
```

## UI Değişiklikleri

**SellerStoreSettings.tsx** — yeni sekmeler:

- Kurumsal Bilgiler (şirket bilgileri formu)
- Banner Yönetimi (ekle/sil/sırala)
- Kategori Vitrini (çoklu seçim)
- Kampanya (form + önizleme)
- Video (URL input)
- Hakkımızda (rich text + sertifikalar)

**SellerStore.tsx** — yeni bölümler:

- Hero: Carousel banner (çoklu ise) veya tek banner
- Kurumsal Bilgiler tabı
- Kategori Vitrini grid'i
- Kampanya banner'ı
- Video bölümü
- Zenginleştirilmiş Hakkımızda

## Implementasyon Planı

1. Types + Firestore fields
2. Settings UI (tüm formlar)
3. Store sayfası UI (tüm yeni bölümler)
4. Banner carousel component
5. Test + deploy
