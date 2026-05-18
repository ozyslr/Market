# Mercora Omni-Channel: Strategic Product Roadmap & Industry Comparison

Bu belge, Mercora'nın günümüz küresel e-ticaret devleri (Amazon, Trendyol, Hepsiburada, Shopify) ile karşılaştırmasını ve Series A hedeflerine ulaşmak için gereken önceliklendirilmiş özellik listesini içerir.

---

## 1. Mevcut Durum vs. Sektör Standartları Karşılaştırması

| Özellik Grubu | Mercora Mevcut Durum (v0.8.0) | Sektör Standardı | Gereklilik / Fark |
| :--- | :--- | :--- | :--- |
| **Ödeme Altyapısı** | Stripe Simülasyonu (Client-side) | 3D Secure, CVC Check, Kayıtlı Kartlar | **P0 - Kritik**: API-tabanlı gerçek işlem yönetimi. |
| **Küresel Vergi** | Statik Vergi Motoru (UK/TR odaklı) | Dinamik HS Code tabanlı gümrük hesaplama | **P1 - Yüksek**: Tüm dünya ülkeleri için API entegrasyonu. |
| **Satıcı Paneli** | Dashboard & Envanter (Mock Veri) | SKU bazlı depo yönetimi, Payout takibi | **P1 - Orta**: Finansal mutabakat ve hakediş ekranları. |
| **Lojistik** | Manuel Takip (Mock Status) | API Tabanlı Kargo Takibi (DPD/UPS/Evri) | **P0 - Kritik**: Canlı kargo takip entegrasyonları. |
| **AI Yetenekleri** | AI Placeholder & Mock Öneriler | Kişiselleştirilmiş "Hyper-personalization" | **P2 - Yenilikçi**: Kullanıcı davranış analizi bazlı öneri motoru. |

---

## 2. Önceliklendirilmiş Özellik Matrisi (Prioritization Matrix)

### **P0: Launch Blockers (Piyasaya Çıkış İçin Zorunlu)**
1.  **Gerçek Kimlik Doğrulama (Auth)**: Simülasyon yerine JWT veya OAuth tabanlı gerçek kullanıcı girişi.
2.  **Canlı Ödeme Geçidi (Stripe Production)**: Backend üzerinden güvenli ödeme tamamlama.
3.  **Hukuki Uyum & KVKK / GDPR**: Çerez politikaları, kullanıcı sözleşmeleri ve PII (kişisel veri) güvenliği.
4.  **Sipariş Yaşam Döngüsü (Order States)**: 'Pending' -> 'Processing' -> 'Shipped' -> 'Delivered' akışının canlı DB ile senkronizasyonu.

### **P1: Operational Scalability (Operasyonel Büyüme)**
1.  **Gelişmiş Değerlendirme Sistemi (Review Logic)**: Fotoğraflı yorumlar, "Doğrulanmış Alıcı" rozetleri.
2.  **Satıcı Onboarding Portal**: Satıcıların KYC (Kimlik Bilgileri) belgelerini yükleyebildiği ve onay beklediği akış.
3.  **HS Code Otomasyonu**: Ürün kategorisine göre gümrük vergilerinin otomatik belirlenmesi.
4.  **Search & Filter Engine**: Elasticsearch veya Algolia benzeri yüksek hızlı arama ve çoklu filtreleme (Marka, Fiyat Aralığı, Kargo Hızı).

### **P2: Market Intelligence & Innovation (Rekabet Üstünlüğü)**
1.  **AI Shopping Assistant (Active)**: Kullanıcıyla sohbet eden, bütçesine göre ürün sepeti oluşturan aktif ajan.
2.  **Dinamik Fiyatlandırma**: Arz-talep ve stok durumuna göre fiyatların otomatik güncellenmesi.
3.  **B2B Wholesale Modu**: Kurumsal alıcılar için toplu alım ve KDV'siz işlem seçenekleri.
4.  **Warehouse Management (WMS)**: Satıcı stoklarının Mercora depolarında yönetilmesi (Amazon FBA benzeri).

---

## 3. Uygulama Planı (Roadmap Plan)

### **Aşama 1: Security & Transaction (Hafta 1-4)**
*   **Hedef**: Güvenli bir ödeme ve kullanıcı altyapısı kurmak.
*   **Aksiyonlar**: Express backend güçlendirmesi, Stripe Webhook entegrasyonu.

### **Aşama 2: Vendor Logistics (Hafta 5-8)**
*   **Hedef**: Kargo ve satıcı yönetimini otomatize etmek.
*   **Aksiyonlar**: Royal Mail/DPD API entegrasyonları, Dinamik Payout (Ödeme Dağıtım) sistemi.

### **Aşama 3: Intelligence & Global Scale (Hafta 9+)**
*   **Hedef**: AI ve çok dilli küresel büyümeyi tetiklemek.
*   **Aksiyonlar**: Gemini 1.5 Pro tabanlı alışveriş asistanı, Çoklu para birimi (Multi-currency) tam desteği.

---

**CEO Notu**: Mercora şu an "Technical MVP" aşamasındadır. P0 kalemlerinin tamamlanması, Series A yatırım turunda platformun rüştünü ispatlaması için en kritik adımdır.
