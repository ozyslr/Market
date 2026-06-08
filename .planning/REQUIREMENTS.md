# Requirements — Milestone v6.0: Admin Satıcı Denetim Merkezi (Admin Seller Control Center)

**Defined:** 2026-06-08
**Source:** `.planning/research/v6-SUMMARY.md` (6-agent research synthesis)
**Goal:** Mevcut `AdminSellers.tsx` + `AdminSellerView.tsx` sayfalarını, bir admin'in bir satıcının her boyutunu (profil, KYC, ürün, sipariş, finans, trust/tier, uyuşmazlık) tek ekrandan görüp müdahale edebileceği, sunucu-korumalı ve audit-loglu gelişmiş bir denetim merkezine dönüştürmek.

> "User" = admin (super-admin / support / finance rolleri). Tüm yazma aksiyonları `verifyAdmin` korumalı sunucu endpoint'lerinden geçer ve audit kaydı yazar.

---

## v6.0 Requirements

### A. Foundation & Shared (ACC)

- [ ] **ACC-01**: Admin, satıcı liste ve detay ekranlarında tek tutarlı tema görür (light marka teması; dark/light uyumsuzluğu yok).
- [ ] **ACC-02**: Satıcı ekranları paylaşılan admin bileşenlerini (stat kartı, durum rozeti, onay diyaloğu/banner, toast) yeniden kullanır.
- [ ] **ACC-03**: Satıcı ekranları hiçbir koşulda mock/fallback veri göstermez; yükleme hatasında admin açık bir hata durumu + yeniden dene görür.
- [ ] **ACC-04**: Satıcı liste ve detay verisi, re-render döngüsünü önleyen özel hook'lar üzerinden yüklenir (router param'ları `useMemo` ile sabitlenir; türetilmiş diziler memoize edilir; modül-seviye mutable state yok).

### B. Seller List + Bulk Actions (LST)

- [ ] **LST-01**: Admin, satıcı listesini durum çiplerine göre filtreler (Tümü / Pending KYC / Aktif / Askıda / Banlı).
- [ ] **LST-02**: Admin, debounce'lu arama ile satıcı arar ve filtreler paylaşılabilir URL parametrelerine yansır.
- [ ] **LST-03**: Admin, satıcı başına anahtar kolonları görür: 30 günlük GMV ve satır-içi düzenlenebilir komisyon dahil.
- [ ] **LST-04**: Admin, birden fazla satıcıyı seçip toplu aksiyon uygular (KYC onayla, askıya al, komisyon değiştir, dışa aktar).
- [ ] **LST-05**: Liste, skeleton yükleme gösterir ve rozet/sayaçlar sunucu-tarafı `getCountFromServer` ile hesaplanır (tüm dokümanları çekmeden).

### C. Seller Detail Core (DET)

- [ ] **DET-01**: Admin, bir satıcıyı tek bir sekmeli iki-kolonlu ekranda görür (sticky header + aksiyon sidebar + 6 sekme: Genel Bakış, KYC, Ürünler, Siparişler, Finans, Aktivite).
- [ ] **DET-02**: Header satıcı kimliğini, KYC + ödeme durumunu, menşei ve katılım tarihini, ve 4 stat kartını (GMV, performans, bakiye, komisyon) gösterir.
- [ ] **DET-03**: Her sekme verisini ilk açılışta tembel (lazy) yükler; tüm liste sorguları `limit` ile sınırlıdır.
- [ ] **DET-04**: Genel Bakış sekmesi son ürünleri ve son siparişleri; Aktivite sekmesi satıcının audit zaman çizelgesini (son 50 olay) gösterir.

### D. KYC & Intervention (INT)

- [ ] **INT-01**: Admin, detay görünümünden KYC onaylar/reddeder ve her onay/red bir audit kaydı (before/after) yazar.
- [ ] **INT-02**: KYC onayı, başvuru durumunu sunucu endpoint'i içinde atomik günceller (client-side split-brain yazma yok); sağlayıcı (Stripe Connect / Iyzico) provizyonu başarısızsa durum değişmez.
- [ ] **INT-03**: Admin, bir KYC başvurusunda "değişiklik iste" yapabilir (yeni `changes_requested` durumu) ve satıcı yeniden gönderebilir.
- [ ] **INT-04**: Admin, bir satıcıyı gerekçeyle askıya alır; askı uygulanır (panel girişi, ürün oluşturma ve payout engellenir) ve satıcının auth token'ları anında iptal edilir (`revokeRefreshTokens`).
- [ ] **INT-05**: Admin, askıdaki satıcıyı gerekçe/notla yeniden aktifleştirir; payout yeniden etkinleşir; audit yazılır.
- [ ] **INT-06**: Admin, bir satıcıyı yazılı-onay (mağaza adını yaz) ile kalıcı banlar; ban ödeme hesabını reddeder (`stripe.accounts.reject()` / Iyzico) ve audit yazar. Ban geri alınamaz.
- [ ] **INT-07**: Tüm müdahale aksiyonları (approve/reject/request-changes/suspend/reactivate/ban) `verifyAdmin` korumalı sunucu endpoint'inden geçer ve audit kaydı yazar.

### E. Finance Oversight (FIN)

- [ ] **FIN-01**: Admin, Finans sekmesinde satıcının bakiyesini ve ledger'ını (yalnızca System B) görür; System A bakiyesi yalnızca etiketli "legacy" notu olarak gösterilir.
- [ ] **FIN-02**: Admin, satıcının payout geçmişini görür ve finance rolüyle manuel payout tetikler; aksiyon audit'lenir.
- [ ] **FIN-03**: Admin, satıcının geçerli komisyon kurallarını görür ve per-seller/kategori oranını before/after önizleme + onay ile düzenler.
- [ ] **FIN-04**: Her komisyon kuralı oluşturma/güncelleme/silme işlemi, before/after oran anlık görüntüsüyle bir audit kaydı yazar.

### F. Trust/Tier & Disputes (TRD)

- [ ] **TRD-01**: Admin, satıcının trust skorunu ve performans skorunu gerçek sipariş/yorum verisinden hesaplanmış görür (placeholder/`Math.random` değer yok); trust skoru Firestore'da persist edilir.
- [ ] **TRD-02**: Admin, satıcının tier'ını gerekçe + opsiyonel bitiş tarihiyle override edebilir ve sınırlı (±20) bir trust-skoru düzeltmesi uygulayabilir; ikisi de `verifyAdmin` endpoint'inden geçer ve audit'lenir.
- [ ] **TRD-03**: Admin, satıcı bazlı uyuşmazlık panelinde şikayetleri (artık `sellerId` taşıyan) ve iade taleplerini (gerçek `returnRequests` lifecycle'ı) görür ve audit ile çözer/günceller.
- [ ] **TRD-04**: Admin, satıcının ürünlerini, ürün dokümanını doğru güncelleyen moderasyon yolu üzerinden moderate eder (onayla/reddet/değişiklik iste).

### G. Security & Data Integrity (SEC)

- [ ] **SEC-01**: Firestore kuralları admin'e `returns` + `returnRequests` okuma izni verir ve açık bir `sellerApplications` bloğu ekler; yeni/değişen her kural bloğu için `@firebase/rules-unit-testing` testi yazılır.
- [ ] **SEC-02**: `verifyAdmin` tüm admin/seller endpoint'lerinde zorunludur (opsiyonel değil); iyzico approval dahil — eksikse uygulama başlangıçta fail-fast verir.

---

## Future Requirements (Deferred)

- GİB e-fatura verisinin Finans sekmesinde gösterimi — gerçek GİB kimlik bilgileri yapılandırılana kadar ertelendi (`sendToGib` mock).
- System A (`sellerBalances` / `payoutRequests`) dondurma veya ledger'a migrasyon — şimdilik olduğu gibi bırakıldı.
- `complaints.sellerId` geçmiş veri backfill migrasyonu — forward-only seçildi; eski şikayetler join-bağımlı kalır.
- Komisyon client/server ücret ıraksaması (3.5% platform fee) birleştirme — finans denetiminden ayrı bir hesap-doğruluğu işi.
- Invoice numarası in-memory counter düzeltmesi (multi-instance duplicate riski).

## Out of Scope

- **Geri alınabilir ban / ban kaldırma** — ban kalıcı/irreversible olarak seçildi.
- **İki-admin onay kuyruğu (ban için)** — solo dev; yazılı-onay diyaloğu yeterli kabul edildi.
- **System A balance migrasyon scripti** — bu milestone ledger'ı (System B) yalnız okur.
- **Yeni satıcı/müşteri uçtan uca özellikleri** — bu milestone admin denetim tarafına odaklı.

---

## Decision Log (milestone scoping)

| Karar                        | Seçim                                                       |
| ---------------------------- | ----------------------------------------------------------- |
| Kapsam grupları              | A, B, C (omurga) + D, E, F (hepsi dahil)                    |
| Ban politikası               | Suspend + kalıcı Ban (yazılı-onay, irreversible)            |
| performanceScore placeholder | v6'da gerçek veriyle düzelt + trust skoru persist           |
| GİB e-fatura                 | Finans sekmesinden ertele                                   |
| System A                     | Olduğu gibi bırak; yalnız System B göster                   |
| trust adjustment tavanı      | ±20                                                         |
| tier override süresi         | Kalıcı + opsiyonel bitiş tarihi (cron yok, okurken kontrol) |
| complaints.sellerId          | Forward-only (backfill yok)                                 |

---

## Traceability

_(Roadmap tarafından doldurulacak — her REQ-ID tam olarak bir faza eşlenir.)_

| REQ-ID | Phase |
| ------ | ----- |
| —      | —     |
