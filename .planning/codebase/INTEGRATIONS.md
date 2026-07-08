# External Integrations

**Analysis Date:** 2026-06-08

## APIs & External Services

**Payments:**

- Stripe — primary payment processor (EU/global); PaymentIntents, SetupIntents, one-click checkout, saved cards, webhooks, Stripe Tax
  - SDK: `stripe` (server) + `@stripe/stripe-js` + `@stripe/react-stripe-js` (client)
  - Auth: `STRIPE_SECRET_KEY` (server), `VITE_STRIPE_PUBLISHABLE_KEY` (client)
  - Webhook endpoint: `POST /api/webhook` (raw body, HMAC-SHA256 verified via `Stripe-Signature`)
  - API version: `2025-03-31.basil`
- Iyzico — Turkish market payment gateway; sandbox + production
  - SDK: `iyzipay` 2.0.67 loaded via `server/iyzico.cjs` (lazy-loaded CJS wrapper)
  - Auth: `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL`
  - Endpoints: `POST /api/iyzico/init`, `POST /api/iyzico/check`

**AI / Machine Learning:**

- Google Gemini — AI text generation, vision, and image features; API key kept server-side
  - SDK: `@google/genai` 1.29.0
  - Auth: `GEMINI_API_KEY` (server-side only; never exposed to client)
  - Proxy endpoints: `POST /api/gemini/text`, `POST /api/gemini/vision`, `POST /api/gemini/image`

**Search:**

- Typesense — typo-tolerant full-text product search; self-hosted or Typesense Cloud
  - SDK: `typesense` 3.0.6 + `typesense-instantsearch-adapter` 3.0.2
  - Auth: `TYPESENSE_API_KEY` (server), `VITE_TYPESENSE_API_KEY` (client read-only key)
  - Config: `TYPESENSE_HOST`, `TYPESENSE_PORT`, `TYPESENSE_PROTOCOL`, `TYPESENSE_SYNC_SECRET`
  - Sync webhook: `POST /api/typesense/sync/product`, `DELETE /api/typesense/sync/product/:id`
  - Client: `src/services/typesenseService.ts`

**Shipping / Carriers:**

- EasyPost — international shipping label creation and tracking webhooks
  - Integration: `src/services/cargoService.ts` (provider pattern; mock + real)
  - Webhook: `POST /api/carrier/easypost/webhook` (HMAC-SHA256 via `X-Hmac-Signature`)
- Turkish domestic carriers (PTT, Yurtici, Aras, MNG, Surat) — abstracted via `CargoProvider` interface in `src/services/cargoService.ts`; mock implementations with env-var-based swap to real APIs
  - Carrier routing: `routeCarrierByRegion()` selects carrier by destination country

**SMS / Phone Verification:**

- Twilio Verify — OTP/phone verification for seller KYC
  - SDK: `twilio` 6.0.2
  - Auth: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `VITE_TWILIO_VERIFY_SID`
  - Client: `src/services/sellerVerificationService.ts` (dev bypass: code `123456` always valid)

**Currency Exchange:**

- exchangerate.host — FX rates (TRY→EUR); polled server-side, cached in Firestore
  - Endpoint: `GET https://api.exchangerate.host/latest?base=TRY&symbols=EUR`
  - No auth key required (public API)
  - Cache refresh: `POST /api/fx-rates/refresh` (cron-protected with `CRON_SECRET`)
  - Client reads: `GET /api/fx-rates`

**E-Invoice (Turkish):**

- Paraşüt / Logo API — Turkish e-fatura (electronic invoice) compliance; stub, not yet active
  - Client: `src/services/efaturaService.ts`
  - Auth: `EFATURA_API_URL`, `EFATURA_API_KEY`
  - Status: returns error if not configured; stored for manual processing

## Data Storage

**Databases:**

- Firebase Firestore — primary NoSQL document database; all business data
  - Client connection: `src/lib/firebase.ts` (reads config from `firebase-applet-config.json`)
  - Admin connection: `src/lib/firebase-admin.ts` (reads `FIREBASE_SERVICE_ACCOUNT_B64` or `GOOGLE_APPLICATION_CREDENTIALS`)
  - No ORM — raw Firestore SDK calls in `src/services/*.ts`
  - Key collections: `products`, `orders`, `subOrders`, `users`, `sellers`, `reviews`, `categories`, `fxRates`, `emailConfig`, `processedWebhooks`

**File Storage:**

- Firebase Storage — product images, seller documents, KYC uploads
  - SDK: `firebase/storage`
  - Config: `VITE_FIREBASE_STORAGE_BUCKET`

**Caching:**

- Firestore used as cache layer for FX rates (`fxRates` collection, TTL ~1h via Cache-Control header)
- localStorage for consent preferences (`mcr_consent`), language selection
- Workbox (PWA) — service worker caches static assets, images (CacheFirst 30 days), Google Fonts

## Authentication & Identity

**Auth Provider:**

- Firebase Auth — primary authentication
  - Methods: Google OAuth, email/password, Firebase Anonymous Auth (guest users)
  - Server-side verification: `src/lib/authMiddleware.ts` — `createAuthMiddlewares()` returns `verifyFirebaseToken`, `verifyAdmin`, `verifySeller`, `verifyCronSecret`, `requireAdminRole`
  - Custom Claims: `{ role: "admin"|"seller"|"buyer", sellerId?: "..." }` set via `POST /api/admin/set-claims`
  - Client: `src/context/AuthContext.tsx`

## Monitoring & Observability

**Error Tracking:**

- Sentry — frontend error monitoring, performance tracing, session replay
  - SDK: `@sentry/react` 10.53.1
  - Init: `src/lib/sentry.ts` — `initSentry()` called in `src/main.tsx`
  - Config: `VITE_SENTRY_DSN`
  - Integrations: `browserTracingIntegration`, `replayIntegration`
  - Sample rates: 10% traces in production, 10% replays, 100% on error

**Analytics (consent-gated, GDPR/KVKK compliant):**

- Google Analytics 4 — page views, events, user identification
  - Config: `VITE_GA4_MEASUREMENT_ID` or `VITE_GA_MEASUREMENT_ID`
  - Loaded dynamically only after analytics consent
- Meta (Facebook) Pixel — marketing events (add to cart, purchase, etc.)
  - Config: `VITE_META_PIXEL_ID`
  - Loaded only after marketing consent
- TikTok Pixel — marketing events
  - Config: `VITE_TIKTOK_PIXEL_ID`
  - Loaded only after marketing consent
- All analytics: `src/lib/analytics.ts` — 3-tier consent model (mandatory / analytics / marketing)

**Logs:**

- Pino structured JSON logging (`server/logger.ts`) — all server-side logs
- Pattern: `logger.info(context, message, meta)` / `logger.error(context, message, meta)`
- HTTP request logging via `pino-http` middleware

**Performance:**

- Lighthouse CI (`lhci`) — automated performance audit on CI; `lhci autorun`
- Bundle analysis: `rollup-plugin-visualizer` — `npm run analyze` generates `dist/stats.html`

## Email

**Provider:**

- Resend — transactional email sending
  - SDK: `resend` 6.12.4
  - Auth: `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `Benim Olan <noreply@benimolan.com>`)
  - Client: `server/services/emailService.ts` — lazy-loaded, gracefully degrades if not configured
  - Triggers: order confirmation, shipping update, delivery confirmation, refund notification, seller new order, abandoned cart
  - Config stored in Firestore `emailConfig/triggers` (admin-toggleable per trigger type)

## CI/CD & Deployment

**Hosting:**

- Google Cloud Run (inferred from AI Studio injection pattern for `APP_URL` env var)
- Single Express process on port 3000 serves API + static SPA

**CI Pipeline:**

- No CI config file detected in root (GitHub Actions / Cloud Build not found)
- Lighthouse CI: `npm run ci:perf` (build + lhci autorun)
- Pre-commit hooks via Husky + lint-staged (ESLint fix + Prettier on staged TS/TSX files)

## Webhooks & Callbacks

**Incoming (server receives):**

- `POST /api/webhook` — Stripe payment events (raw body, registered before JSON middleware)
- `POST /api/carrier/easypost/webhook` — EasyPost shipping/tracking events (raw body, HMAC-SHA256)
- `POST /api/typesense/sync/product` — Typesense product sync (shared secret header `x-typesense-sync-secret`)
- `DELETE /api/typesense/sync/product/:id` — Typesense product deletion

**Outgoing (server calls):**

- Stripe API (`api.stripe.com`) — payment intents, setup intents, customer management
- Iyzico API (`sandbox.iyzipay.com` / `api.iyzipay.com`) — Turkish payments
- Resend API — transactional emails
- Twilio Verify API — OTP SMS verification
- Google Gemini API — AI generation
- exchangerate.host — FX rate polling
- EasyPost API — shipping label creation
- Typesense API — product index sync
- E-Fatura API (Paraşüt/Logo) — Turkish e-invoicing (stub, not yet active)

## Environment Configuration

**Required env vars (production):**

- `NODE_ENV=production`
- `APP_URL` — deployed service URL
- `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL`
- `FIREBASE_SERVICE_ACCOUNT_B64` or `GOOGLE_APPLICATION_CREDENTIALS`
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
- `RESEND_API_KEY`, `EMAIL_FROM`
- `GEMINI_API_KEY`
- `CRON_SECRET` — protects payout and FX refresh cron endpoints

**Optional env vars:**

- `VITE_SENTRY_DSN` — error monitoring
- `VITE_GA4_MEASUREMENT_ID` — Google Analytics 4
- `VITE_META_PIXEL_ID` — Meta Pixel
- `VITE_TIKTOK_PIXEL_ID` — TikTok Pixel
- `TYPESENSE_API_KEY`, `TYPESENSE_HOST`, `TYPESENSE_PORT`, `TYPESENSE_PROTOCOL`, `TYPESENSE_SYNC_SECRET`, `VITE_TYPESENSE_*`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `VITE_TWILIO_VERIFY_SID`
- `EFATURA_API_URL`, `EFATURA_API_KEY`
- `VITE_EXCHANGE_RATE_API_KEY`

**Secrets location:**

- `.env` file at project root (gitignored)
- `firebase-applet-config.json` at project root — Firebase client config (committed, non-secret)

---

_Integration audit: 2026-06-08_
