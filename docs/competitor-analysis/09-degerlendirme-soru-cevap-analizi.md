# Mercora — Ürün Sayfası Değerlendirme, Yıldız Dağılımı ve Soru-Cevap Sistemi Rakip Analiz Raporu

**Tarih:** 2026-05-23  
**Kapsam:** Ürün Değerlendirme Puanları, Yıldız Dağılımları, Yorum Filtreleme ve Sıralama, Soru-Cevap Modülü  
**Karşılaştırılan Platformlar:** Hepsiburada, Trendyol, Amazon Türkiye  

---

## 1. Giriş ve Sektör Standardı

E-ticarette dönüşüm oranlarını (CR) etkileyen en kritik iki unsur **sosyal kanıt (social proof)** ve **bilgi eksikliğinin giderilmesidir**. Alıcıların %93'ü bir ürünü satın almadan önce yorumları okumakta ve soru-cevap geçmişini incelemektedir. Trendyol, Hepsiburada ve Amazon bu alanlarda kullanıcı deneyimini (UX) en üst seviyeye taşımışlardır.

Bu raporda, Mercora platformunun mevcut Vite ve Next.js kod tabanlarındaki değerlendirme ve soru-cevap modülleri analiz edilmiş, rakiplerle kıyaslanarak "rakip firmalarla aynı seviyede" bir yapı kurmak için gereken mimari ve arayüz geliştirmeleri planlanmıştır.

---

## 2. Mercora Mevcut Durum Analizi (Kod Tabanı İncelemesi)

### 2.1 Vite Projesi (`src/`)
Vite projesinde, değerlendirme ve soru-cevap özellikleri son derece modüler bir yapıda (`src/components/product/`) geliştirilmiştir:
- **`RatingSummary.tsx`:** Genel puanı ve dinamik olarak hesaplanan yıldız dağılımı (5, 4, 3, 2, 1 yıldız) ile kırılımlı ortalama puanları (Kalite, Kargo, Açıklamaya Uygunluk) gösterir.
- **`ReviewFilters.tsx`:** Kullanıcıların yorumları sıralamasına ("En Yeni", "En Yararlı", "En Yüksek", "En Düşük") ve filtrelemesine ("Fotoğraflı", "Onaylı Alıcı", Yıldız Sayısı) izin verir.
- **`ReviewForm.tsx` & `ReviewCard.tsx`:** Yıldız seçimi, 3 kategori kırılımlı puanlama, metin yorumu, base64 resim yükleme (maks. 3 adet), yararlı butonu (helpful count) ve satıcı yanıtı (sellerResponse) özelliklerini destekler.
- **`QASection.tsx` & `QuestionCard.tsx`:** Soru sorma, satıcının/adminin yanıt vermesi ve "Sorular içinde arama" özelliklerini destekler.

### 2.2 Next.js Projesi (`mercora-next/`)
Next.js projesinde, ürün detay sayfası (`ProductDetailContent.tsx`) şu anda **büyük bir eksiklik içerir**:
- Yorumlar, Değerlendirmeler ve Soru-Cevap sekmeleri Next.js arayüzünde **hiç bulunmamaktadır**.
- Vite tarafındaki veri yapıları ve servisler (`reviewService.ts`, `productQuestionService.ts`) tam olarak Next.js'e taşınmamış veya entegre edilmemiştir.

---

## 3. Rakip Karşılaştırma Matrisi

| Kriter | Trendyol | Hepsiburada | Amazon TR | Mercora (Vite) | Mercora (Next.js) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Puan & Dağılım Grafiği** | ✅ Gelişmiş | ✅ Gelişmiş | ✅ Gelişmiş | ✅ Dinamik (Temel) | ❌ Yok |
| **Kategori Detay Puanları** | ✅ Var | ✅ Var | ❌ Yok | ✅ Var (Kalite/Hız) | ❌ Yok |
| **Yorum Sıralama Seçenekleri** | En Yararlı, En Yeni | En Yararlı, En Yeni | En Yararlı, En Yeni | En Yeni, Yararlı, Puan | ❌ Yok |
| **Gelişmiş Yorum Filtreleri** | Yıldız, Fotoğraflı, Satıcı | Yıldız, Fotoğraflı, Satıcı | Yıldız, Fotoğraflı, Onaylı | Yıldız, Foto, Onaylı | ❌ Yok |
| **Yorum İçi Arama** | ❌ Yok | ❌ Yok | ✅ Var | ❌ Yok | ❌ 🚀 Planlanıyor |
| **Yorum Fotoğrafları Galerisi** | ✅ Var (Toplu) | ✅ Var (Toplu) | ✅ Var (Toplu) | ❌ Tekil Lightbox | ❌ Yok |
| **Video Yorum** | ✅ Var | ✅ Var | ✅ Var | ❌ Yok | ❌ 🚀 Planlanıyor |
| **Yararlı Yorum Oylaması** | ✅ Var | ✅ Var | ✅ Var | ✅ Var | ❌ Yok |
| **Soru-Cevap Arama** | ❌ Yok | ❌ Yok | ✅ Var | ✅ Var | ❌ Yok |
| **Soru-Cevap Kategorileri** | ✅ Beden, Kargo, Stok | ✅ Kargo, Özellik | ✅ Konu bazlı | ❌ Yok | ❌ 🚀 Planlanıyor |
| **Soru Faydalı/Beğenme** | ❌ Yok | ❌ Yok | ✅ Var | ✅ Var | ❌ Yok |

---

## 4. Rakip Seviyesine Ulaşmak İçin Eksikler ve Hedef Özellikler

Rakiplerle aynı seviyede, pürüzsüz ve dönüşüm odaklı bir kullanıcı deneyimi oluşturmak için aşağıdaki özellikleri entegre etmemiz gerekmektedir:

### 4.1 Yıldızlar ve Oran Bölümü (Parite Hedefi)
- **Trendyol/Hepsiburada Seviyesi:** Sayfanın sol üstünde veya yorum sekmesinde büyük bir oran kartı. Yıldız kırılımları (5★ - 1★) tıklanarak o yıldıza sahip yorumları anında listelemelidir (Vite'ta bu filtreleme mantığı var, Next.js'e taşınmalı).
- **Yorum Görselleri Galerisi (Media Hub):** Yorum yazanların yüklediği tüm fotoğrafları yorumların en üstünde yan yana sıralayan bir galeri. Kullanıcı herhangi bir fotoğrafa tıkladığında o fotoğrafın ait olduğu yorum detayına odaklanan lightbox açılmalıdır.

### 4.2 Yorum Listeleme ve Gelişmiş Filtreleme (Parite Hedefi)
- **Yorum Arama Barı:** Kullanıcılar binlerce yorum arasında arama yapabilmelidir (Örn: "boyut", "dar", "hızlı kargo"). Amazon'un en popüler özelliğidir.
- **Onaylı Alıcı Otomasyonu:** Şu an koda manuel eklenen `verified` değeri, kullanıcının sipariş geçmişi kontrol edilerek otomatik atanmalıdır (Kullanıcı ürünü gerçekten satın aldıysa yorumunda yeşil onay rozeti çıkmalı).

### 4.3 Soru-Cevap Sistemi Geliştirmesi (Parite Hedefi)
- **Konu Etiketleri/Kategoriler:** Sorular sorulurken veya listelenirken "Beden/Ölçü", "Kargo/Teslimat", "Stok", "Teknik Özellik" kategorilerine ayrılmalıdır.
- **Soru-Cevap Arama:** Kullanıcılar daha önce sorulmuş soruları kelime bazlı arayabilmeli, eğer aradıkları cevap zaten varsa satıcıya mükerrer soru sormak yerine anında bilgiye ulaşmalıdır.

---

## 5. Next.js Mimari ve Porting Planı

Mevcut Vite bileşenlerini Next.js standartlarına (TypeScript, Tailwind CSS, Lucide icons, Framer Motion) uygun bir biçimde `mercora-next` projesine aktaracak ve zenginleştireceğiz.

### Adım 1: Klasör Yapısının Oluşturulması
Next.js tarafında `src/components/product/` dizinini oluşturup şu alt bileşenleri taşıyacağız:
- `ReviewSection.tsx`
- `RatingSummary.tsx`
- `ReviewFilters.tsx`
- `ReviewCard.tsx`
- `ReviewForm.tsx`
- `QASection.tsx`
- `QuestionCard.tsx`

### Adım 2: Next.js Uyumlu Refactoring (API ve İmaj Entegrasyonları)
- `<img />` etiketleri Next.js `<Image />` bileşenine dönüştürülecektir.
- Yönlendirmeler için `react-router-dom` yerine `next/navigation` ve `next/link` kullanılacaktır.
- Firebase Firestore bağlantıları Next.js servis katmanına (`src/services/reviewService.ts` ve `src/services/productQuestionService.ts`) taşınacak ve `useAuth` hook'u ile entegre edilecektir.

### Adım 3: Yeni Rakip Seviyesi Özelliklerinin Geliştirilmesi
1. **Yorum İçi Arama:** `ReviewFilters` bileşenine kelime filtreleme girdisi eklenecektir.
2. **Toplu Yorum Fotoğrafları Şeridi:** `RatingSummary` altında, ürüne ait fotoğraflı yorumların resimlerini toplayan yatay kaydırılabilir şerit.
3. **Soru-Cevap Konu Etiketleri:** Soruları kategorize etmek için `category` alanı eklenecektir.

---

## 6. Sonuç ve Yol Haritası

Bu çalışma ile Mercora'nın Next.js sürümü, rakipleri Trendyol, Hepsiburada ve Amazon ile **aynı UX zenginliğine ve sosyal kanıt olgunluğuna** ulaşacaktır.
- **Hemen Sonraki Aşama:** Kullanıcının onayına sunulan bu rapora paralel olarak, Next.js porting ve geliştirme işlerini içeren `implementation_plan.md` dosyası oluşturulacaktır.
