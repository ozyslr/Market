# Requirements: Benim Olan (Mercora) — v3.0 "Go Live & Scale"

**Defined:** 2026-06-07
**Milestone:** v3.0 (follows v2.0 Trust & Scale)

## v3.0 Requirements

### Live UAT & Go Live (UAT)

- [ ] **UAT-01**: BUY-05 UAT checklist tamamlandı — tüm manuel doğrulamalar yapıldı
- [ ] **UAT-02**: Typesense sunucusu provision edildi ve production'a bağlandı
- [ ] **UAT-03**: E-fatura (Paraşüt/Logo) API anahtarları yapılandırıldı
- [ ] **UAT-04**: Stripe production moduna geçiş — canlı anahtarlar yapılandırıldı
- [ ] **UAT-05**: Playwright E2E testleri staging'de çalıştı ve geçti

### ML Fraud Detection (MLF)

- [ ] **MLF-01**: Rule-based fraud detection'ın yanına ML anomaly detection eklendi
- [ ] **MLF-02**: Satıcı davranış analizi — normal dışı fiyat/indirim/stok pattern'leri tespiti
- [ ] **MLF-03**: ML model eğitimi için Firestore'dan fraud event veri seti oluşturma
- [ ] **MLF-04**: Admin panelde ML fraud alert dashboard'u

### Native Mobile App (MOB)

- [ ] **MOB-01**: React Native projesi kurulumu + mevcut Firebase auth ile entegrasyon
- [ ] **MOB-02**: Ana sayfa, ürün listeleme, ürün detayı — temel alışveriş akışı
- [ ] **MOB-03**: Sepet + checkout (Stripe/Iyzico) — mobil ödeme akışı
- [ ] **MOB-04**: Satıcı dashboard (mobil) — sipariş yönetimi, envanter görüntüleme
- [ ] **MOB-05**: Push notification altyapısı (Firebase Cloud Messaging)

## Deferred to v4

- WMS / depo yönetimi
- Dinamik fiyatlandırma
- Gerçek zamanlı mesajlaşma (chat)

## Out of Scope (v3.0)

| Feature                 | Reason              |
| ----------------------- | ------------------- |
| WMS / warehouse         | Uzak hedef          |
| Canlı chat / mesajlaşma | Düşük öncelik       |
| Dinamik fiyatlandırma   | Sabit fiyat yeterli |

## Traceability

| Requirement | Phase    | Status  |
| ----------- | -------- | ------- |
| UAT-01      | Phase 18 | Pending |
| UAT-02      | Phase 18 | Pending |
| UAT-03      | Phase 18 | Pending |
| UAT-04      | Phase 18 | Pending |
| UAT-05      | Phase 18 | Pending |
| MLF-01      | Phase 19 | Pending |
| MLF-02      | Phase 19 | Pending |
| MLF-03      | Phase 19 | Pending |
| MLF-04      | Phase 19 | Pending |
| MOB-01      | Phase 20 | Pending |
| MOB-02      | Phase 20 | Pending |
| MOB-03      | Phase 20 | Pending |
| MOB-04      | Phase 20 | Pending |
| MOB-05      | Phase 20 | Pending |

\***\*Coverage:** 14 requirements, 14 mapped to phases (0 unmapped)
