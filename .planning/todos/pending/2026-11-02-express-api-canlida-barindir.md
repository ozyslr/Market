---
created: 2026-11-02T22:32:44.163Z
title: Express API'yi canlıda barındır (/api/** rewrite)
area: api
priority: 2
files:
  - server.ts
  - server/routes/*.ts
  - firebase.json
  - src/services/sellerAccessService.ts
---

## Problem

Canlı ortam sadece Firebase Hosting (statik `dist`, rewrite `** → /index.html`).
Express sunucusu (server.ts) hiçbir yerde çalışmıyor; `/api/*` HTML + 200 dönüyor. Canlıda çalışmayanlar:

- Admin satıcı onayı / rol değişikliği (`/api/admin/seller/:uid/grant-access`, `/api/admin/set-claims`)
  → şimdilik çözüm: `npx tsx scripts/backfill-seller-claims.mjs --apply` yerelden
- Stripe (payment intent, kayıtlı kart, webhook), iyzico init/check
- KYC pipeline (`/api/kyc/*`), seller REST API (`/api/v1/*`), payout/abandoned-cart cron'ları

Sıra: **2 (CI yeşile çekildikten sonra)**.

## Solution

**KARAR (2026-11-02, kullanıcı): Cloud Run.** Proje Blaze planında. Gerekçe: 41 client çağrısı göreli `/api/...`
→ Hosting `/api/**` rewrite ile aynı origin, frontend değişmez; Render ayrı origin + CORS + uyuyan free tier.
Bilinen ihtiyaçlar: server.ts `PORT = 3000` sabit (Cloud Run `$PORT` veya container port 3000 ayarı);
prod'da `npm start` = `NODE_ENV=production tsx server.ts`; cron rotaları `verifyCronSecret` (CRON_SECRET) → Cloud Scheduler;
gcloud CLI yerelde kurulu değil (GitHub Actions ile deploy veya gcloud kurulumu).

Karar gerekli: Cloud Run (aynı GCP projesi, Hosting rewrite `{"source":"/api/**","run":{"serviceId":...}}`)
vs Render (kullanıcının Render hesabı açık — mevcut servis var mı kontrol et).
Adımlar: Dockerfile/başlatma (server.ts Vite middleware'i prod'da devre dışı), secret'lar
(STRIPE\_\*, FIREBASE_SERVICE_ACCOUNT_B64, GEMINI_API_KEY → Secret Manager), firebase.json'a
`/api/**` rewrite'ı catch-all'dan ÖNCE, Stripe webhook URL'i güncelle, cron'lar için Cloud Scheduler.
Doğrulama: canlıda `/api/health` JSON dönsün; admin panelinden test satıcı onayla → ürün ekle → `pending`.

Ek (mantik-yurutme incelemesi, 2026-11-02): ilk adım = host kararı + Stripe webhook cutover/rollback planı
(yeni endpoint'i Stripe'a ekle → test event → eskisini kaldır; geçiş sırasında kaçan event'leri Stripe
dashboard'dan yeniden gönder). Canlıya çıkmadan admin rotalarının auth'unu canlı istekle doğrula
(token'sız / buyer token'lı istek 401/403 dönmeli).
