# External Integrations

**Last updated:** 2026-05-31

---

## Payment Gateways

### Stripe (Primary -- Live Keys Active)

| Detail | Value |
|---|---|
| SDK (server) | `stripe` npm 22.1.1, API version `2025-03-31.basil` |
| SDK (client) | `@stripe/stripe-js` 9.6, `@stripe/react-stripe-js` 6.4 |
| Mode | Production (live keys in .env) |
| Route module | `server/routes/stripe.ts` (25.7 KB) |

**Endpoints:**

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/create-payment-intent` | Create PaymentIntent for checkout |
| POST | `/api/create-setup-intent` | Create SetupIntent for card saving |
| POST | `/api/setup-payment-method` | Attach saved card to customer |
| GET | `/api/payment-methods` | List user's saved cards |
| PATCH | `/api/payment-methods/default` | Set default card |
| DELETE | `/api/payment-methods/:id` | Detach a saved card |
| POST | `/api/one-click-checkout` | Checkout with saved card |
| POST | `/api/refund` | Process a refund |

**Webhook events handled (`/api/webhook`):**
- `checkout.session.completed` -- marks order as paid in Firestore
- `payment_intent.succeeded` -- logs success
- `payment_intent.payment_failed` -- marks order as failed

**Env vars:** `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

### iyzico (Turkey -- Sandbox Default)

| Detail | Value |
|---|---|
| SDK | `iyzipay` npm 2.0.67 via CJS wrapper (`server/iyzico.cjs`) |
| Mode | Sandbox by default (`IYZICO_BASE_URL` defaults to `https://sandbox.iyzipay.com`) |
| Route module | `server/routes/iyzico.ts` (9.0 KB) |

**Endpoints:**

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/iyzico/init` | Initialize checkout form (returns token + payment page URL) |
| POST | `/api/iyzico/callback` | Server-to-server callback (raw body, signature verification) |
| GET | `/api/iyzico/callback` | Browser redirect after payment |
| GET | `/api/iyzico/installments` | Query installment options by BIN |

**Env vars:** `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL`

---

## Authentication

| Provider | Detail |
|---|---|
| **Firebase Auth** (primary) | Client: `firebase/auth` SDK. Server: `firebase-admin/auth` for token verification. |
| **Seller API Keys** | Custom `bo_`-prefixed keys. Hashed server-side, stored in Firestore `apiKeys` collection. Scoped permissions. |
| **Cron Secret** | `X-Cron-Secret` header verification against `CRON_SECRET` env var. |
| Admin override | Email `ozyslr@gmail.com` always treated as admin. |

**Auth middleware file:** `src/lib/authMiddleware.ts` -- factory `createAuthMiddlewares(adminAuth, adminDb)` producing `verifyFirebaseToken`, `verifyAdmin`, `verifyCronSecret`.

---

## External APIs

### Google Gemini AI

| Detail | Value |
|---|---|
| SDK | `@google/genai` 1.29.0 |
| Model | `gemini-3-flash-preview` |
| Source | `server/routes/gemini.ts` (server-side proxy) |
| Features | AI shopping assistant (Turkish), AI content generation, AI content moderation, visual search, AI recommendations |
| Env var | `GEMINI_API_KEY` (server-side only — never in client bundle) |

### Exchange Rate API

| Detail | Value |
|---|---|
| Provider | `exchangerate-api.com` |
| Usage | Live multi-currency conversion in footer/ticker |
| Env var | `VITE_EXCHANGE_RATE_API_KEY` |

---

## Analytics & Monitoring

### Google Analytics 4

| Detail | Value |
|---|---|
| ID env var | `VITE_GA4_MEASUREMENT_ID` (fallback: `VITE_GA_MEASUREMENT_ID`) |
| Loading | Consent-first via `src/lib/analytics.ts`. Script injected after user grants consent. |
| Tracks | Page views, product views, add-to-cart, checkout, purchases, searches, wishlist |

### Meta/Facebook Pixel

| Detail | Value |
|---|---|
| ID env var | `VITE_META_PIXEL_ID` |
| Event mapping | `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`, `Search`, `AddToWishlist` |
| Loading | Inline script in `index.html` + consent-gated dynamic loading |

### TikTok Pixel

| Detail | Value |
|---|---|
| ID env var | `VITE_TIKTOK_PIXEL_ID` |
| Events | `page`, `track` |
| Loading | Consent-gated dynamic script injection |

### Sentry (Error Monitoring)

| Detail | Value |
|---|---|
| SDK | `@sentry/react` 10.53.1 + `@sentry/vite-plugin` 5.3.0 |
| Source | `src/lib/sentry.ts` |
| Features | `browserTracingIntegration()`, `replayIntegration()` |
| Traces sample rate | 0.1 (production), 1.0 (development) |
| Env var | `VITE_SENTRY_DSN` |

---

## Email / SMS

| Service | Integration |
|---|---|
| **Firebase Trigger Email** | Order confirmations (iyzico flow), abandoned cart reminders. Emails triggered by writing to Firestore email collection. |
| **Push notifications** | `POST /api/send-push` endpoint. Firebase Cloud Messaging via PWA service worker. Tokens in Firestore `pushTokens` collection. |

---

## File Storage / CDN

| Service | Detail |
|---|---|
| **Firebase Storage** | All product images, user avatars, seller logos. |
| Client library | `firebase/storage` -- `uploadBytes` / `getDownloadURL` via `src/lib/storage.ts` |
| Image resizing | Client-side resize to 400px max before upload |
| CDN | Firebase Storage via Google's global CDN |
| Fonts CDN | Google Fonts (`fonts.googleapis.com`) -- Inter font family |

---

## Third-Party Embeds

All consent-gated via CookieConsent component:

| Script | Env Var | Mechanism |
|---|---|---|
| GA4 gtag | `VITE_GA4_MEASUREMENT_ID` | Dynamic script injection |
| Meta Pixel | `VITE_META_PIXEL_ID` | Inline + dynamic script |
| TikTok Pixel | `VITE_TIKTOK_PIXEL_ID` | Dynamic script injection |
| Google Fonts | -- | Preloaded link in head |

---

## Webhook Handlers

| Webhook | Route | Signature | Purpose |
|---|---|---|---|
| **Stripe** | `POST /api/webhook` | `stripe-signature` + `STRIPE_WEBHOOK_SECRET` | Payment lifecycle events |
| **iyzico callback** | `POST /api/iyzico/callback` | Raw body parsing | Payment result notification |
| **Scheduled payouts** | `POST /api/process-scheduled-payouts` | `X-Cron-Secret` | Weekly auto-payouts |
| **Abandoned cart** | `POST /api/abandoned-cart/check` | `X-Cron-Secret` | Cart recovery emails |
| **Event-driven webhook infra** | Configurable (service layer) | Trendyol-compatible | Real-time notifications |

---

## Seller REST API (`/api/v1`)

| Detail | Value |
|---|---|
| Auth | `Authorization: Bearer bo_<api_key>` (hashed server-side) |
| Route module | `server/routes/sellerApi.ts` (10.8 KB) |

**Endpoints:** `GET/POST /api/v1/products`, `GET/PUT /api/v1/products/:id`, `PUT /api/v1/products/stock`, `GET /api/v1/orders`, `GET /api/v1/orders/:id`.

---

## Shipping / Cargo Integration

| Detail | Value |
|---|---|
| Source | `src/services/cargoService.ts` (13.0 KB) |
| Pattern | Provider interface with mock implementations |
| Supported carriers | PTT, Yurtici, Aras, MNG, Surat, UPS, DHL |
| Current state | Mock providers -- real API keys can be swapped via env vars |

---

## Additional Service Integrations

| Service | File | Purpose |
|---|---|---|
| Blockchain | `src/services/blockchainService.ts` | Product authenticity verification |
| E-Fatura | `src/services/invoiceService.ts` | Turkish GIB-compliant UBL-TR e-invoice |
| Webhook infra | `src/services/webhookService.ts` | Event-driven notifications |
| Chat | `src/services/chatService.ts` | Buyer-seller messaging |
| Loyalty | `src/services/loyaltyService.ts` | Points/rewards system |
| AR (3D) | `src/services/arService.ts` | Augmented reality product viewing |
| AI Content | `src/services/aiContentService.ts` | AI-generated product descriptions |
| AI Moderation | `src/services/aiModerationService.ts` | Policy-violation screening |

---

## Environment Variables Summary

| Variable | Category | Required |
|---|---|---|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Payments | Yes |
| `STRIPE_SECRET_KEY` | Payments | Yes |
| `STRIPE_WEBHOOK_SECRET` | Payments | Yes |
| `IYZICO_API_KEY` | Payments | No (iyzico only) |
| `IYZICO_SECRET_KEY` | Payments | No (iyzico only) |
| `IYZICO_BASE_URL` | Payments | No (defaults to sandbox) |
| `GEMINI_API_KEY` | AI (server) | No (disables all AI features) |
| `VITE_EXCHANGE_RATE_API_KEY` | External API | No (disables currency ticker) |
| `VITE_GA4_MEASUREMENT_ID` | Analytics | No (consent-first) |
| `VITE_META_PIXEL_ID` | Analytics | No (consent-first) |
| `VITE_TIKTOK_PIXEL_ID` | Analytics | No (consent-first) |
| `VITE_SENTRY_DSN` | Monitoring | No (graceful disable) |
| `FIREBASE_SERVICE_ACCOUNT_B64` | Firebase | Yes (webhooks/payouts) |
| `CRON_SECRET` | Auth | Yes (cron endpoints) |
| `APP_URL` | Config | Yes (OAuth callbacks) |
| `VITE_FIREBASE_*` (6 vars) | Firebase | Yes (client config) |
