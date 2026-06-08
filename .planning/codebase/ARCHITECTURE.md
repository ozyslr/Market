<!-- refreshed: 2026-06-08 -->

# Architecture

**Analysis Date:** 2026-06-08

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Browser / PWA (React 19 SPA)                         │
│  Buyer Flow         Seller Panel          Admin Panel                        │
│  `src/pages/`       `src/pages/Seller*`   `src/pages/Admin*`                │
└──────────┬──────────────────┬─────────────────────┬───────────────────────-─┘
           │ Direct Firestore │ REST API calls        │ REST API + Firestore
           │ SDK calls         │ fetch() / axios       │
           ▼                  ▼                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                   Express Server — `server.ts` (port 3000)                   │
│  Routes: Stripe, Iyzico, Orders, Reviews, Commission, Payouts, Finance,      │
│          Email, Refund, CSV, Shipping, Returns, Gemini, Seller API v1,       │
│          FxRates, Typesense Sync, Carrier Webhook/Poll                        │
│  `server/routes/*.ts`                                                        │
│  Auth: Firebase custom claims via `src/lib/authMiddleware.ts`                │
└──────────┬───────────────────────────────┬───────────────────────────────────┘
           │ firebase-admin SDK             │ stripe / iyzipay SDKs
           ▼                               ▼
┌──────────────────────┐    ┌─────────────────────────────┐
│   Firebase Firestore │    │   Stripe / Iyzico           │
│   Firebase Auth      │    │   (Payment Processing)      │
│   Firebase Storage   │    └─────────────────────────────┘
│   (Source of truth)  │
└──────────────────────┘
           ▲
           │ firebase client SDK (browser-direct reads/writes)
           │
┌──────────────────────────────────────────────────────────────────────────────┐
│  Service Layer — `src/services/*.ts`                                         │
│  ~70 modules wrapping Firestore SDK: productService, orderService,           │
│  reviewService, sellerStoreService, couponService, fraudDetectionService…    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component            | Responsibility                                                             | File                                  |
| -------------------- | -------------------------------------------------------------------------- | ------------------------------------- |
| Express Server       | HTTP entry point, API routes, Vite middleware in dev                       | `server.ts`                           |
| React Entry          | DOM root creation, Sentry init, analytics init, SW registration            | `src/main.tsx`                        |
| App Root             | Provider hierarchy + React Router configuration                            | `src/App.tsx`                         |
| AuthContext          | Firebase Auth state, anonymous auth, token refresh                         | `src/context/AuthContext.tsx`         |
| CartContext          | Cart state, Firestore persistence with debounce                            | `src/context/CartContext.tsx`         |
| LanguageContext      | i18n (TR/EN/DE/AR), RTL support, localStorage persistence                  | `src/context/LanguageContext.tsx`     |
| ThemeContext         | Dark/light mode toggle                                                     | `src/context/ThemeContext.tsx`        |
| CurrencyContext      | Active currency, FX rate lookup                                            | `src/context/CurrencyContext.tsx`     |
| WishlistContext      | Wishlist items, Firestore persistence                                      | `src/context/WishlistContext.tsx`     |
| FollowsContext       | Seller follow state                                                        | `src/context/FollowsContext.tsx`      |
| NotificationContext  | In-app notification state                                                  | `src/context/NotificationContext.tsx` |
| LocationContext      | User location for delivery filtering                                       | `src/context/LocationContext.tsx`     |
| productService       | Firestore CRUD for product catalog                                         | `src/services/productService.ts`      |
| orderService         | Order creation, status, Firestore transactions                             | `src/services/orderService.ts`        |
| reviewService        | Reviews, real-time subscription via onSnapshot                             | `src/services/reviewService.ts`       |
| authMiddleware       | Express role-based guard factory (buyer/seller/admin)                      | `src/lib/authMiddleware.ts`           |
| firebase.ts (client) | Firebase SDK init, `db`, `auth`, `storage` exports, `handleFirestoreError` | `src/lib/firebase.ts`                 |
| firebase-admin.ts    | Firebase Admin SDK init, `adminDb`, `adminAuth` exports                    | `src/lib/firebase-admin.ts`           |
| serverValidators     | Pure validation helpers, idempotency signature                             | `src/lib/serverValidators.ts`         |
| stripe routes        | All Stripe endpoints + raw-body webhook                                    | `server/routes/stripe.ts`             |
| iyzico routes        | Turkish market payment init/check                                          | `server/routes/iyzico.ts`             |
| sellerApi routes     | API-key-authenticated `/api/v1/*` REST API                                 | `server/routes/sellerApi.ts`          |
| paymentProvider      | `IPaymentProvider` interface, `IyzicoProvider`, `StripeConnectProvider`    | `server/services/paymentProvider.ts`  |
| logger               | Pino-based structured logger + pino-http Express middleware                | `server/logger.ts`                    |

## Pattern Overview

**Overall:** Layered Monolith — Single Express server serves both the React SPA and REST APIs, backed by Firebase as the sole data store.

**Key Characteristics:**

- React SPA with route-level code-splitting via `React.lazy` and `Suspense`
- Direct client-to-Firestore reads (browser SDK) for most catalog/user data
- Server API layer for payment-sensitive and privileged operations
- Context API (no Redux/Zustand) for all client-side global state
- Firebase custom claims for role checks — zero Firestore reads per auth guard

## Layers

**Presentation Layer:**

- Purpose: UI rendering, routing, user interactions
- Location: `src/pages/`, `src/components/`
- Contains: 70+ lazy-loaded page components, domain-grouped UI components
- Depends on: Context layer, Service layer, React Router
- Used by: Browser / PWA

**Context / State Layer:**

- Purpose: Global client-side state management
- Location: `src/context/`
- Contains: 9 React Context providers (Auth, Cart, Wishlist, Follows, Notification, Language, Currency, Theme, Location)
- Depends on: Service layer, Firebase client SDK
- Used by: All page and component code

**Service Layer (Client):**

- Purpose: Encapsulate all Firestore read/write operations from the browser
- Location: `src/services/`
- Contains: ~70 service modules, each domain-focused
- Depends on: `src/lib/firebase.ts` (db/storage), `src/types.ts`
- Used by: Context providers and page components

**Library / Shared Utilities:**

- Purpose: Cross-cutting concerns (auth, validation, error handling, analytics, i18n data)
- Location: `src/lib/`
- Contains: `firebase.ts`, `firebase-admin.ts`, `authMiddleware.ts`, `serverValidators.ts`, `sentry.ts`, `analytics.ts`, `gemini.ts`, `utils.ts`, `taxEngine.ts`, `rateLock.ts`
- Depends on: External SDKs
- Used by: Services, server routes, context providers

**API / Server Layer:**

- Purpose: Privileged operations requiring server-side secrets (payments, admin tasks, webhooks)
- Location: `server/routes/`, `server/services/`, `server/lib/`
- Contains: 18 route modules, server-side services (ledger, payout, KYC, commission, email)
- Depends on: `firebase-admin` SDK, Stripe SDK, Iyzico SDK
- Used by: React frontend via `fetch()` / `axios`

**Mobile Layer:**

- Purpose: React Native companion app (Expo)
- Location: `mobile/`
- Contains: Screens, navigation, Firebase client, Zustand-based cart store
- Depends on: Same Firebase project as web; standalone auth and API calls

## Data Flow

### Typical Read Flow (catalog data)

1. Page component mounts, calls service function (`getProducts(options)`) — `src/services/productService.ts`
2. Service executes Firestore query via client SDK (`getDocs`, `query`, `where`, `orderBy`) — `src/lib/firebase.ts` → `db`
3. Result typed against `Product` interface from `src/types.ts`
4. Page component stores result in local `useState`, renders

### Typical Write Flow (placing an order)

1. `CheckoutPage` collects cart + address + payment method — `src/pages/Checkout.tsx`
2. Payment intent created via `POST /api/create-payment-intent` with Firebase ID token in `Authorization` header
3. `verifyFirebaseToken` middleware decodes token — `src/lib/authMiddleware.ts`
4. Server route creates Stripe PaymentIntent, validates prices against Firestore — `server/routes/stripe.ts`
5. On Stripe confirmation, `POST /api/webhook` fires (raw body); server creates order documents in Firestore via Admin SDK
6. Client reads updated order from Firestore via `src/services/orderService.ts`

### Real-time Subscription Flow

1. Component calls `subscribeToProductReviews(productId, callback)` — `src/services/reviewService.ts`
2. Firestore `onSnapshot` listener attaches; any write to the reviews collection triggers callback
3. Component updates state and re-renders
4. Cleanup: unsubscribe function returned and called in `useEffect` cleanup

### Seller API Flow (external integrations)

1. Third-party system sends `GET /api/v1/products` with `Authorization: Bearer bo_<key>`
2. `sellerApi` router extracts key, hashes with SHA-256, compares against Firestore `apiKeys` collection — `server/routes/sellerApi.ts`
3. Firestore-backed rate limit checked per permission bucket
4. Response returns seller's own products/orders only (scoped by `sellerId`)

**State Management:**

- React Context API is the sole client state mechanism
- No Redux, Zustand, or Jotai in the web frontend (mobile uses Zustand for cart — `mobile/src/context/cartStore.ts`)
- Firestore is the source of truth; contexts sync on auth change or explicit refresh

## Key Abstractions

**IPaymentProvider:**

- Purpose: Abstraction over Stripe and Iyzico for unified checkout
- Examples: `server/services/paymentProvider.ts`
- Pattern: Interface `IPaymentProvider` with `initCheckout()` / `checkPayment()` methods; `IyzicoProvider` and `StripeConnectProvider` are concrete implementations

**handleFirestoreError:**

- Purpose: Translate raw Firestore errors into structured `FirestoreError` with `OperationType` context
- Examples: `src/lib/firebase.ts` (exported), used in all service modules
- Pattern: `try/catch` in every service function, calls `handleFirestoreError(error, OperationType.X, collectionPath)`, then re-throws or returns fallback

**AuthMiddlewares factory:**

- Purpose: Create Express middleware set for role-based route protection using Firebase custom claims
- Examples: `src/lib/authMiddleware.ts`
- Pattern: `createAuthMiddlewares(adminAuth)` returns `{ verifyFirebaseToken, verifyAdmin, verifySeller, verifyBuyer, verifyCronSecret, requireAdminRole }`

**named() / defaultPage() lazy loaders:**

- Purpose: Route-level code splitting while preserving named exports (React.lazy requires default exports)
- Examples: `src/App.tsx` lines 39-45
- Pattern: `named(() => import('./pages/Foo'), 'Foo')` wraps named export in default for lazy loading

**Route guards:**

- Purpose: Protect seller/admin/moderator routes at the React Router level
- Examples: `src/components/auth/AdminRoute.tsx`, `SellerRoute.tsx`, `ModeratorRoute.tsx`
- Pattern: Component wraps children, checks `user.role` from AuthContext, redirects if unauthorized

## Entry Points

**Server Entry:**

- Location: `server.ts` (project root)
- Triggers: `tsx server.ts` (dev) / `node server.js` (prod)
- Responsibilities: Creates Express app, registers all route modules, attaches Vite dev middleware in development, serves static dist in production, listens on port 3000

**Build Entry:**

- Location: `vite.config.ts` (project root)
- Triggers: `vite build`
- Responsibilities: Bundles React SPA with manual chunk splitting (vendor-react, vendor-firebase, vendor-firebase-firestore, vendor-charts, vendor-motion, vendor-stripe, vendor-dnd, vendor-three, vendor-ui, vendor-utils)

**React Entry:**

- Location: `src/main.tsx`
- Triggers: Browser loads `index.html`
- Responsibilities: `initSentry()`, `initAnalytics()`, `registerSW()`, creates React DOM root in StrictMode

**App Root:**

- Location: `src/App.tsx`
- Triggers: Rendered by `src/main.tsx`
- Responsibilities: Nested provider hierarchy + `BrowserRouter` + `Routes` configuration

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop. No worker threads. Heavy computation (CSV import, price analysis) is synchronous in the request/response cycle.
- **Global state:** Module-level singletons — `db`, `auth`, `storage` in `src/lib/firebase.ts`; `adminDb`, `adminAuth` in `src/lib/firebase-admin.ts`; lazy iyzico SDK `iyzicoSdk` in `server.ts`. `useComparison` hook uses module-level variable + listener set.
- **Circular imports:** `src/lib/firebase.ts` is imported by virtually every service. Services must not import from pages or components.
- **Client-direct Firestore:** Browser writes directly to Firestore for many operations (cart, wishlist, reviews). Firestore security rules (`firestore.rules`) are the enforcement layer — server rules are not a substitute.
- **Stripe webhook ordering:** `registerStripeWebhook` (raw body parser) must be called before `express.json()` middleware in `server.ts`. This is enforced by registration order.
- **Iyzico SDK CJS compatibility:** `server/iyzico.cjs` is a CommonJS wrapper loaded lazily via dynamic `import()` to maintain ESM compatibility throughout the rest of the codebase.

## Anti-Patterns

### Mock Data in Production Code

**What happens:** `src/services/productService.ts` imports `MOCK_PRODUCTS` and `CATEGORIES` from `src/mockData` and falls back to them when Firestore is unavailable.
**Why it's wrong:** Mock data can appear in production if Firestore connectivity fails, causing confusing UX and inconsistent product IDs.
**Do this instead:** Return an empty array and surface an error state to the UI. Remove the mock fallback from `productService.ts`.

### Duplicate Route Definitions

**What happens:** `/seller/coupons` is registered twice in `src/App.tsx` (lines 215 and 223) — once for `SellerCouponsPage` (CouponManager) and once for `SellerCoupons`.
**Why it's wrong:** React Router uses the first match; the second route is dead code and causes confusion.
**Do this instead:** Use distinct paths (`/seller/coupons` and `/seller/promotions`) or remove the duplicate.

### Admin SDK in Shared Validator Path

**What happens:** `src/lib/serverValidators.ts` is imported by both `server.ts` (Node) and indirectly through shared types. The file itself is clean, but it lives under `src/lib/` alongside client-only Firebase config.
**Why it's wrong:** Mixing server-only utilities and client-only utilities in the same `src/lib/` directory creates import confusion.
**Do this instead:** Keep `server/lib/` for all server-exclusive utilities. `src/lib/serverValidators.ts` should move to `server/lib/serverValidators.ts`.

## Error Handling

**Strategy:** Try/catch at service boundaries; structured error propagation; Sentry for production crash reporting.

**Patterns:**

- Service functions: `try/catch` → `handleFirestoreError(error, OperationType, path)` → re-throw or return empty/fallback — `src/lib/firebase.ts`
- Express routes: `try/catch` → `res.status(400|500).json({ error: error.message })`
- Stripe webhook: `try/catch` → `console.error` + `res.status(400).json({ error })`
- Client rendering: `Sentry.ErrorBoundary` at `App.tsx` root (no other error boundaries)
- Token errors: `onIdTokenChanged` in `AuthContext` surfaces token failures as `tokenError` string, displayed by `TokenErrorBanner` component

## Cross-Cutting Concerns

**Logging:** Pino structured logger (`server/logger.ts`) for server; `console.*` for client. HTTP requests logged via `pino-http` middleware.
**Validation:** Zod schemas in `server/lib/schemas.ts` + pure validators in `src/lib/serverValidators.ts`. Client-side form validation is ad-hoc per component.
**Authentication:** Firebase Auth (Google OAuth + email/password + anonymous). Server routes verified via Bearer token + `verifyFirebaseToken`. Role enforcement via Firebase custom claims.
**i18n:** Four locale JSON files in `src/i18n/` (tr.json, en.json, de.json, ar.json). `LanguageContext` resolves keys. RTL layout toggled for Arabic.
**SEO:** `react-helmet-async` in page components; `SEO` utility component in `src/components/common/SEO.tsx`; sitemap generated by `scripts/generate-sitemap.mjs`.
**Analytics:** Google Analytics / custom analytics via `src/lib/analytics.ts`; consent-gated in `MainLayout`.
**PWA:** Workbox service worker via `vite-plugin-pwa`; offline banner via `src/services/offlineService.tsx`.

---

_Architecture analysis: 2026-06-08_
