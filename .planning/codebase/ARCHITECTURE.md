# Benim Olan -- Architecture Overview

**Date:** 2026-05-31
**Project:** Benim Olan (Global Artisan Marketplace)

---

## 1. Overall Architectural Pattern

This is a **client-server SPA (Single Page Application)** with **server-side rendering support via Vite middleware** during development. The architecture uses a **monolithic server** that serves both the API and the frontend build output from the same Express process.

- **Frontend:** React 19 SPA built with Vite 6, delivered by the Express server.
- **Backend:** Express.js (Node.js) running on port 3000.
- **Database:** Firebase Firestore (NoSQL) accessed both from the client (via `firebase` SDK) and the server (via `firebase-admin` SDK).
- **Authentication:** Firebase Auth (Google OAuth + email/password).
- **Payments:** Stripe (primary, full PCI-compliant) + Iyzico (Turkish market, sandbox).
- **i18n:** Multi-language (TR, EN, DE, AR) with RTL support for Arabic.

---

## 2. Frontend-Backend Communication

Two communication patterns coexist:

### Pattern A: Direct Firestore Access (Client-Side)
The React app reads/writes Firestore directly using the `firebase` client SDK (`src/lib/firebase.ts`). This is used for most data operations: products, reviews, cart, user profiles, seller data. All service files in `src/services/` use this pattern:

```
React Component --> src/services/xxxService.ts --> Firebase Firestore SDK --> Firestore
```

### Pattern B: Server REST API (Express Routes)
The server exposes RESTful JSON endpoints mounted under `/api/`. These handle operations requiring server-side secrets or processing:

| Endpoint | Purpose |
|---|---|
| `POST /api/create-payment-intent` | Stripe payment creation |
| `POST /api/create-setup-intent` | Stripe card saving setup |
| `POST /api/setup-payment-method` | Attach Stripe card to customer |
| `POST /api/one-click-checkout` | One-click checkout using saved card |
| `GET /api/payment-methods` | List saved Stripe cards |
| `DELETE /api/payment-methods/:id` | Remove saved card |
| `PATCH /api/payment-methods/default` | Set default card |
| `POST /api/webhook` | Stripe webhook (raw body) |
| `POST /api/iyzico/init` | Iyzico payment init |
| `POST /api/iyzico/check` | Iyzico payment check |
| `POST /api/abandoned-cart/check` | Abandoned cart email cron |
| `POST /api/send-push` | Push notification sending |
| `POST /api/process-scheduled-payouts` | Seller payout processing |
| `GET /api/health` | Health check |
| `GET /api/v1/*` | Seller REST API (API-key auth) |
| `GET /api/v1/` | Seller API info |

The React services layer uses **Axios** (`axios` library) to call these endpoints when server-side processing is needed (typically in `src/services/` files or directly from components).

### Pattern C: Seller REST API
Third-party/automated seller access via `GET /api/v1/*` with API key authentication (`Bearer bo_<api_key>`). Supports product CRUD, inventory batch updates, and order queries with per-endpoint rate limiting.

---

## 3. Architectural Layers

### Presentation Layer
- **Pages** (`src/pages/`): 65+ page components each mapping to a React Router route. Covers buyer (Home, ProductDetail, Cart, Checkout, etc.), seller (Dashboard, Inventory, Orders, Finance, etc.), and admin (Dashboard, Products, Users, CMS, etc.) flows.
- **Components** (`src/components/`): Reusable UI components organized by domain:
  - `layout/` -- Navbar, Footer, MobileMenu, MegaMenu, SearchBar, AuthModal, etc.
  - `location/` -- DeliveryLocationSelector with province/district cascade.
  - `commerce/` -- ProductCard, ProductCarousel, FilterPanel, ComparisonBar, StoryBar, ARViewer, etc.
  - `product/` -- ProductGallery, ReviewCard, RatingSummary, DeliveryBox, InstallmentTable, etc.
  - `checkout/` -- IyzicoPayment, ManualPayment, PaymentMethodSelector, OneClickSuccessModal.
  - `common/` -- SEO, Breadcrumb, OptimizedImage, ScrollToTop, CookieConsent, SkipToContent.
  - `home/` -- Hero component.
  - `ai/` -- ShoppingAssistant (AI chat integration).
  - `chat/` -- LiveChatWidget.
  - `profile/` -- ProfileSettings, ReturnRequestModal, SavedPaymentMethod.
  - `seller/` -- ProductForm, CSVImportPanel, BulkEditBar, CategorySelect, etc.
  - `seo/` -- JsonLd structured data, schema.org types.
  - `ui/` -- Skeleton loaders.
  - `marketing/` -- CampaignBanner.

### Business Logic / State Management Layer
- **React Contexts** (`src/context/`): 8 context providers manage global state:
  1. `AuthContext` -- user session, Firebase Auth integration, user profile CRUD
  2. `CartContext` -- shopping cart with Firestore persistence and debounced saves
  3. `WishlistContext` -- wishlist/favorites
  4. `FollowsContext` -- seller following
  5. `NotificationContext` -- in-app notifications
  6. `LanguageContext` -- i18n + RTL direction + translations
  7. `ThemeContext` -- visual theming
  8. `LocationContext` -- user location/delivery region
- **Providers** are nested in `App.tsx` in a specific order: SentryErrorBoundary > ThemeProvider > AuthProvider > CartProvider > WishlistProvider > FollowsProvider > NotificationProvider > LanguageProvider > LocationProvider > Router.
- **Hooks** (`src/hooks/`): Custom React hooks (`useComparison`, `useExchangeRate`, `useOneClickCheckout`).

### Data Access / Service Layer
- **Services** (`src/services/`): ~55 service modules encapsulating Firestore read/write operations:
  - `productService.ts` -- product CRUD, search, filtering
  - `orderService.ts` -- order lifecycle
  - `reviewService.ts` -- reviews and ratings
  - `cartService.ts` -- cart persistence
  - `adService.ts` -- CPC advertising engine
  - `searchService.ts` -- product search
  - `campaignService.ts` -- campaign management
  - `sellerService.ts` -- seller operations
  - Plus: finance, cargo, notification, email, invoice, loyalty, blockchain, coupon, commission, dynamic pricing, CSV import, etc.
- **Lib** (`src/lib/`): Shared utilities and configurations:
  - `firebase.ts` -- Firebase client SDK initialization + custom `FirestoreError` class
  - `firebase-admin.ts` -- Server-side Firebase Admin SDK (lazy loaded, base64-encoded service account)
  - `authMiddleware.ts` -- Express middleware for Firebase token verification + admin check
  - `serverValidators.ts` -- `isFiniteNumber`, `isNonEmptyString`, `itemsSignature` helpers
  - `analytics.ts` -- Google Analytics integration
  - `sentry.ts` -- Sentry error tracking
  - `gemini.ts` -- Google Gemini AI integration
  - `taxEngine.ts` -- VAT/customs/handling fee calculation
  - `turkeyLocations.ts` -- Turkish province/district data
  - `csvTemplate.ts` -- CSV import templates
  - `storage.ts` -- Firebase Storage helper
  - `utils.ts` -- `cn()` class merge utility
- **Server Lib** (`server/lib/`): Validation utilities:
  - `validate.ts` -- Zod-based request body validation middleware factory
  - `schemas.ts` -- Shared Zod schemas for payment, auth, and seller API validation

---

## 4. State Management Approach

The project uses **React Context exclusively** for state management (no Redux, Zustand, or other external state libraries). Each context:

- Provides its own `Provider` component wrapping children in `App.tsx`.
- Exports a custom `useXxx()` hook that wraps `useContext(XxxContext)`.
- Persists state to Firestore where appropriate (CartContext debounces saves to Firestore; AuthContext reads user profile from Firestore).
- Uses `localStorage` for lightweight persistence (language preference via `LanguageContext`).

---

## 5. Routing Structure

### React Router (Client-Side)
Defined in `src/App.tsx` using `react-router-dom` v7:

- **Seller Layout Route Group** (`/seller/*`): Uses `SellerLayout` component (no Navbar/Footer), nested routes:
  - `/seller/dashboard`, `/seller/inventory`, `/seller/orders`, `/seller/finance`, `/seller/settings`, `/seller/import`, `/seller/pricing`, `/seller/analytics`, `/seller/certificates`, `/seller/coupons`, `/seller/performance`, `/seller/invoices`, `/seller/price-analysis`, `/seller/api-keys`

- **Main Layout Route Group** (uses `MainLayout` wrapping children with Navbar + Footer):
  - `/` -- Home
  - `/product/:slug` -- Product Detail
  - `/cart` -- Cart
  - `/checkout` -- Checkout
  - `/moderator` -- Moderator Dashboard
  - `/seller/:id` -- Seller Store
  - `/search` -- Search Results
  - `/category/:id` -- Category Page
  - `/collection/:type` -- Collection Page
  - `/profile` -- User Profile
  - `/admin` -- Admin Dashboard
  - `/admin/categories` -- Admin Categories
  - `/admin/seller/:sellerId` -- Admin Seller View
  - `/sell` -- Sell On Benim Olan
  - `/sell/apply` -- Seller Application
  - `/wishlist` -- Wishlist
  - `/order-tracking` -- Order Tracking
  - `/product-verification` -- Product Verification
  - `/support` -- User Support
  - `/visual-search` -- Visual Search
  - `*` -- 404 NotFound

### Server-Side Catch-All
Express serves all unmatched routes (`app.get('*')`) with the SPA's `index.html`, enabling client-side routing.

---

## 6. Data Flow Patterns

### Typical Read Flow
```
React Component → useXxx() hook → Context Provider → xxxService → Firebase Firestore (read)
                                                    ↕ (optional)
                                                Axios → Express API → firebase-admin → Firestore
```

### Typical Write Flow (e.g., placing an order)
```
Checkout Page → CartContext → cartService (reads cart)
             → Payment component → Express API → Stripe/Iyzico SDK
             → orderService → Firestore (writes order)
```

### Real-time Updates
- Firebase `onAuthStateChanged` listener in `AuthContext` for session persistence.
- Notifications and chat may use Firebase real-time listeners (not fully verified).

---

## 7. Entry Points

| Entry | File | Purpose |
|---|---|---|
| **Server** | `server.ts` (root) | Express server, loads Vite middleware, registers all API + webhook routes. Started via `tsx server.ts`. |
| **Build Entry** | `vite.config.ts` (root) | Vite build configuration with React, Tailwind CSS v4, PWA plugins. |
| **React Entry** | `src/main.tsx` | React DOM root creation. Calls `initSentry()`, `initAnalytics()`, `registerSW()`. |
| **App Root** | `src/App.tsx` | Provider hierarchy and router configuration. |

---

## 8. Key Abstractions and Shared Modules

### Server-Side Validators (`src/lib/serverValidators.ts`)
Lightweight validation utilities (`isFiniteNumber`, `isNonEmptyString`, `itemsSignature`) used across Express route handlers to sanitize request bodies.

### Auth Middleware (`src/lib/authMiddleware.ts`)
Generates `verifyFirebaseToken` and `verifyAdmin` Express middleware functions that decode Firebase ID tokens from the `Authorization` header and attach `req.uid`.

### Firestore Error Handling (`src/lib/firebase.ts`)
Custom `FirestoreError` class with `FirestoreErrorInfo` interface, sanitizing error messages in production while preserving debug info internally.

### Seller API Authentication
API keys (prefixed `bo_`) validated against the `apiKeys` Firestore collection with per-permission rate limiting (`products:read`, `products:write`, etc.).

### Payment Abstractions
- `server/routes/stripe.ts` -- All Stripe endpoints + webhook handling in one module. Exports `registerStripeWebhook` (raw body, must register first) and `registerStripeRoutes` (JSON body).
- `server/routes/iyzico.ts` -- Iyzico Turkish payment gateway endpoints.
- `server/iyzico.cjs` -- Lazy-loaded Iyzico SDK wrapper.

---

## 9. Key Technologies

| Technology | Version | Usage |
|---|---|---|
| React | 19.2 | UI framework |
| React Router | 7.15 | Client-side routing |
| Vite | 6.2 | Build tool + dev server |
| Express | 4.21 | HTTP server + API |
| Firebase | 12.13 | Auth + Firestore + Storage |
| Firebase Admin | 13.10 | Server-side Firestore access |
| Stripe | 22.1 | Payment processing |
| Tailwind CSS | 4.3 | Utility-first CSS |
| TypeScript | 5.8 | Type safety |
| Sentry | 10.53 | Error monitoring |
| Google Gemini | 1.29 | AI features |
| Vitest | 4.1 | Unit testing |
| Playwright | 1.60 | E2E testing |
| Recharts | 3.8 | Charts (seller analytics) |
| Lucide React | 0.54 | Icon library |
| Motion (Framer Motion) | 12.40 | Animations |
| DnD Kit | 6.3 | Drag-and-drop |
