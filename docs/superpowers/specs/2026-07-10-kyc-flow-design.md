# KYC/Satıcı Başvuru Akışı — Design Spec

**Tarih:** 2026-07-10
**Durum:** Onaylandı
**Hedef:** Belgeler → Otomatik Kontrol → İnsan Onayı → Mağaza Açıldı

---

## Mimari

Server-side pipeline (`server/routes/kyc.ts`). Başvuru submit → Express endpoint tüm kontrolleri sırayla çalıştırır → puanlama → karar.

```
POST /api/kyc/submit
  ├── 1. Belge format + OCR
  ├── 2. Vergi No doğrulama (GIB API)
  ├── 3. MERSİS sorgusu
  ├── 4. IBAN format + isim kontrolü
  ├── 5. TCKN/Kimlik doğrulama (OCR + format)
  ├── 6. KVKK kaydı (IP + timestamp + versiyon)
  └── 7. E-imza (e-Devlet)
      ↓
  Sert kurallı puanlama
      ↓
  ┌─ Geçti (%100 kritikler) → Otomatik ONAY → Provision → Mağaza Açıldı
  └─ Kaldı → Admin incelemesi
```

## Yeni Endpoint'ler

| Endpoint                              | Amaç                         |
| ------------------------------------- | ---------------------------- |
| `POST /api/kyc/submit`                | Başvuru + pipeline tetikleme |
| `POST /api/kyc/verify-tax-id`         | GIB vergi no sorgulama       |
| `POST /api/kyc/verify-mersis`         | MERSİS sorgulama             |
| `POST /api/kyc/verify-iban`           | IBAN doğrulama               |
| `POST /api/kyc/contract-sign`         | e-Devlet e-imza              |
| `GET /api/kyc/application/:id/status` | Başvuru durumu               |
| `POST /api/kyc/admin/review`          | Admin manuel onay/red        |
| `GET /api/kyc/admin/settings`         | KYC ayarlarını oku           |
| `PUT /api/kyc/admin/settings`         | KYC ayarlarını güncelle      |

## Veri Modeli

**SellerApplication (yeni alanlar):**

- `kvkkConsent`: { accepted, acceptedAt, ipAddress, userAgent, kvkkVersion, consentWithdrawnAt? }
- `eSignature`: { signed, signedAt, method: 'edevlet', edevletToken, contractVersion }
- `autoCheck`: { status, checks: { documentOcr, taxId, mersis, iban, identity }, score, failureReason? }
- `timeline`: ApplicationEvent[]

**KycSettings (yeni koleksiyon: `settings/kyc`):**

- autoCheckEnabled, taxIdVerification, mersisCheck, ibanVerification
- identityOcr, esignatureRequired, autoApproveEnabled, autoApproveThreshold

## Puanlama (Sert Kurallı)

| Kriter                       | Kritik?                  | Hata → Sonuç   |
| ---------------------------- | ------------------------ | -------------- |
| Belge OCR (3/3 okunabilir)   | Evet                     | Fail → Manuel  |
| Vergi No GIB eşleşmesi       | Evet                     | Fail → Manuel  |
| MERSİS aktif kayıt           | Evet                     | Fail → Manuel  |
| IBAN format + isim eşleşmesi | Evet                     | Fail → Manuel  |
| Kimlik TCKN + OCR eşleşmesi  | Evet                     | Fail → Manuel  |
| KVKK onayı                   | Evet                     | Eksik → Manuel |
| E-imza                       | Evet (config edilebilir) | Eksik → Manuel |

Tüm kritikler PASS → Otomatik onay. Herhangi biri FAIL → Admin'e düşer.

## UI

### Satıcı Başvuru Formu (`SellerApplication.tsx` genişletme)

- 4 bölüm: İşletme Bilgileri, Belgeler (OCR anlık feedback), KVKK checkbox + metin linki, E-imza (e-Devlet butonu)
- "Başvuruyu Tamamla" → pipeline'ı tetikler

### Admin Onay Sayfası (`AdminSellerView.tsx` genişletme)

- Otomatik kontrol sonuç paneli (her check ✅/❌)
- Skor + karar (OTOMATİK ONAYLANABİLİR / MANUEL İNCELEME GEREKLİ)
- KYC ayarları toggle'ları (admin paneli içinde)

### Başvuru Durumu (satıcı tarafı)

- Timeline stepper: Başvuru → Belgeler → Otomatik Kontrol → Admin → Mağaza
- Tahmini süre, başvuru numarası

## Mevcut Kod Entegrasyonu

- `sellerApplicationService.ts` → server-side pipeline'ı çağıracak şekilde güncelle
- `firestore.rules` → `sellerApplications` için güvenlik kuralları ekle
- `AdminSellerView.tsx` → pipeline sonuç paneli + KYC settings toggle'ları

## Implementasyon Fazları

1. **Veri modeli + Firestore** — yeni alanlar, settings/kyc, firestore.rules
2. **Server-side pipeline** — `server/routes/kyc.ts`, OCR, GIB, MERSİS, IBAN validasyonları
3. **KVKK + e-İmza** — consent kaydı, e-Devlet entegrasyonu
4. **Başvuru formu UI** — yeni bölümler, OCR anlık feedback
5. **Admin panel UI** — pipeline sonuçları, KYC toggle'ları
6. **Satıcı durum sayfası** — timeline stepper
7. **Test + deploy**

## Notlar

- MERSİS ve GIB API'leri için sandbox/test endpoint'leri araştırılacak
- OCR için Google Cloud Vision veya Tesseract.js kullanılabilir
- e-Devlet entegrasyonu T.C. Kimlik Kartı API'si üzerinden
- KVKK metni versiyonlu — `kvkkVersion: "v1.0"` değiştikçe yeniden onay istenir
- Tüm kontroller timeout/retry mekanizmalı (5 sn timeout, 2 retry)
