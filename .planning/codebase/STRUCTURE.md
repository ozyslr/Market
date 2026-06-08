# Codebase Structure

**Analysis Date:** 2026-06-08

## Directory Layout

```
O:/AI/E-tic 2026/                 # Project root
├── server.ts                     # Express server entry point (ESM, tsx)
├── vite.config.ts                # Vite build config, PWA, chunk splitting
├── tsconfig.json                 # TypeScript config (strict, ES2022, react-jsx)
├── vitest.config.ts              # Vitest unit test config
├── playwright.config.ts          # Playwright E2E test config
├── eslint.config.js              # ESLint 10 flat config
├── firebase.json                 # Firebase project config
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Firestore composite indexes
├── storage.rules                 # Firebase Storage security rules
├── index.html                    # Vite HTML entry
├── package.json                  # Dependencies + npm scripts
│
├── src/                          # React SPA source
│   ├── main.tsx                  # React DOM root, Sentry/analytics/SW init
│   ├── App.tsx                   # Provider hierarchy + React Router routes
│   ├── index.css                 # Tailwind v4 @theme directives, global CSS
│   ├── types.ts                  # Core domain types (User, Product, Order, etc.)
│   ├── mockData.ts               # Mock data (dev/test fallbacks — not for prod use)
│   │
│   ├── pages/                    # Route-level page components (70+ files)
│   │   ├── Home.tsx              # Marketplace homepage
│   │   ├── ProductDetail.tsx     # Product detail with reviews, variants, 3D
│   │   ├── Cart.tsx              # Shopping cart
│   │   ├── Checkout.tsx          # Payment flow (Stripe + Iyzico)
│   │   ├── SearchResults.tsx     # Search results page
│   │   ├── CategoryPage.tsx      # Category browse
│   │   ├── OrderHistory.tsx      # Buyer order history
│   │   ├── SellerDashboard.tsx   # Seller panel home
│   │   ├── SellerInventory.tsx   # Seller product management
│   │   ├── SellerOrders.tsx      # Seller order management
│   │   ├── SellerFinance.tsx     # Seller earnings / payouts
│   │   ├── SellerAnalytics.tsx   # Recharts-based seller analytics
│   │   ├── AdminDashboard.tsx    # Admin panel home
│   │   ├── AdminProducts.tsx     # Product moderation
│   │   ├── AdminSellers.tsx      # Seller management / KYC
│   │   ├── AdminOrders.tsx       # Platform-wide orders
│   │   └── ...                   # (All other pages follow same pattern)
│   │
│   ├── components/               # Reusable UI components (domain-grouped)
│   │   ├── layout/               # Navbar, Footer, SellerLayout, MegaMenu
│   │   ├── auth/                 # AuthModal, AdminRoute, SellerRoute, ModeratorRoute
│   │   ├── product/              # ProductGallery, VariantSelector, ReviewSection, etc.
│   │   ├── checkout/             # StripePaymentForm, IyzicoPayment, OrderSummary, etc.
│   │   ├── seller/               # ProductForm, OrderStatsBar, FinanceDashboard, etc.
│   │   ├── commerce/             # ProductCard, ProductCarousel, ComparisonModal, etc.
│   │   ├── ai/                   # ShoppingAssistant, ARViewer, AuthenticityBadge
│   │   ├── home/                 # Hero, StoryBar
│   │   ├── chat/                 # LiveChatWidget
│   │   ├── search/               # Search-related UI
│   │   ├── orders/               # Order-related UI
│   │   ├── profile/              # User profile UI
│   │   ├── marketing/            # Campaign/promotion UI
│   │   ├── location/             # Location picker modal
│   │   ├── seo/                  # SEO-related components
│   │   ├── common/               # AnalyticsTracker, CookieConsent, SEO, Breadcrumb, etc.
│   │   └── ui/                   # Low-level primitives: Skeleton
│   │
│   ├── context/                  # React Context providers
│   │   ├── AuthContext.tsx       # Firebase Auth state
│   │   ├── CartContext.tsx       # Cart with Firestore persistence
│   │   ├── WishlistContext.tsx   # Wishlist
│   │   ├── FollowsContext.tsx    # Seller follows
│   │   ├── NotificationContext.tsx
│   │   ├── LanguageContext.tsx   # i18n (TR/EN/DE/AR)
│   │   ├── CurrencyContext.tsx   # Active currency
│   │   ├── ThemeContext.tsx      # Dark/light mode
│   │   └── LocationContext.tsx   # User location
│   │
│   ├── services/                 # Firestore + external API service layer (~70 files)
│   │   ├── productService.ts     # Product CRUD, search filters
│   │   ├── orderService.ts       # Order creation, status management
│   │   ├── reviewService.ts      # Reviews + onSnapshot subscription
│   │   ├── sellerStoreService.ts # Seller store profile
│   │   ├── couponService.ts      # Coupon validation
│   │   ├── fraudDetectionService.ts
│   │   ├── analyticsService.ts   # GA event helpers
│   │   ├── notificationService.ts
│   │   ├── recommendationService.ts
│   │   └── ...                   # (All other services follow same pattern)
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useComparison.ts      # Module-level product comparison state
│   │   ├── useExchangeRate.ts    # FX rate fetching
│   │   └── useOneClickCheckout.ts
│   │
│   ├── lib/                      # Shared utilities and SDK wrappers
│   │   ├── firebase.ts           # Firebase client init (db, auth, storage)
│   │   ├── firebase-admin.ts     # Firebase Admin init (adminDb, adminAuth)
│   │   ├── authMiddleware.ts     # Express auth middleware factory
│   │   ├── serverValidators.ts   # Pure input validators, idempotency helpers
│   │   ├── sentry.ts             # Sentry init + ErrorBoundary export
│   │   ├── analytics.ts          # Google Analytics helpers
│   │   ├── gemini.ts             # Gemini AI client
│   │   ├── utils.ts              # cn() class merge utility
│   │   ├── taxEngine.ts          # Tax calculation
│   │   ├── rateLock.ts           # Optimistic concurrency for price locks
│   │   ├── storage.ts            # Firebase Storage upload helpers
│   │   └── csvTemplate.ts        # CSV template generation
│   │
│   ├── types/                    # Domain-specific type files
│   │   ├── order.ts              # Order-specific types
│   │   ├── payment.ts            # Payment-specific types
│   │   └── returns.ts            # Return/refund types
│   │
│   ├── i18n/                     # Translation JSON files
│   │   ├── tr.json               # Turkish (default)
│   │   ├── en.json               # English
│   │   ├── de.json               # German
│   │   └── ar.json               # Arabic (RTL)
│   │
│   ├── config/                   # Feature flags
│   │   └── features.ts           # Boolean feature toggles
│   │
│   ├── data/                     # Static lookup data
│   │   └── hsCodes.ts            # Harmonized System tariff codes
│   │
│   └── test/                     # Shared test utilities / setup
│
├── server/                       # Express server modules
│   ├── routes/                   # Route registration functions
│   │   ├── stripe.ts             # Stripe endpoints + webhook
│   │   ├── iyzico.ts             # Iyzico TR payment endpoints
│   │   ├── sellerApi.ts          # /api/v1/* seller REST API
│   │   ├── orders.ts             # Order management routes
│   │   ├── reviews.ts            # Review moderation routes
│   │   ├── commission.ts         # Commission calculation routes
│   │   ├── payouts.ts            # Seller payout routes
│   │   ├── finance.ts            # Finance/ledger routes
│   │   ├── email.ts              # Email trigger routes
│   │   ├── refund.ts             # Refund processing routes
│   │   ├── returns.ts            # Return request routes
│   │   ├── csvImport.ts          # Product CSV import
│   │   ├── shipping.ts           # Shipping calculation routes
│   │   ├── carrierWebhook.ts     # Carrier status webhook
│   │   ├── carrierPoll.ts        # Carrier polling routes
│   │   ├── compliance.ts         # KVKK/GDPR compliance routes
│   │   ├── gemini.ts             # Gemini AI routes
│   │   ├── fxRates.ts            # FX rate sync routes
│   │   └── typesenseSync.ts      # Typesense index sync routes
│   │
│   ├── services/                 # Server-side business logic
│   │   ├── paymentProvider.ts    # IPaymentProvider, IyzicoProvider, StripeConnectProvider
│   │   ├── orderService.ts       # Server-side order processing
│   │   ├── ledgerService.ts      # Financial ledger entries
│   │   ├── payoutService.ts      # Seller payout disbursement
│   │   ├── commissionEngine.ts   # Category-based commission calculation
│   │   ├── kycService.ts         # KYC document upload/verify
│   │   ├── refundService.ts      # Refund processing
│   │   ├── stockService.ts       # Inventory stock management
│   │   ├── invoiceService.ts     # Invoice generation
│   │   ├── emailService.ts       # Transactional email sending
│   │   ├── emailTemplates.ts     # Email HTML templates
│   │   ├── complianceService.ts  # GDPR/KVKK compliance logic
│   │   └── transitionEngine.ts   # Order state machine transitions
│   │
│   ├── lib/                      # Server-only utilities
│   │   ├── schemas.ts            # Zod validation schemas for API inputs
│   │   ├── validate.ts           # Zod middleware helper
│   │   ├── auditLog.ts           # Audit event logging
│   │   └── priceValidator.ts     # Server-side price verification
│   │
│   ├── logger.ts                 # Pino structured logger + pino-http
│   ├── iyzico.cjs                # CJS wrapper for iyzipay SDK (ESM compat)
│   └── declarations.d.ts         # Module declarations for CJS imports
│
├── mobile/                       # React Native (Expo) companion app
│   ├── App.tsx                   # Expo root + navigation setup
│   ├── package.json              # Mobile-specific dependencies
│   ├── tsconfig.json
│   └── src/
│       ├── screens/              # HomeScreen, CartScreen, CheckoutScreen, etc.
│       ├── navigation/           # AppNavigator.tsx
│       ├── context/              # AuthContext.tsx, cartStore.ts (Zustand)
│       └── services/             # api.ts, firebase.ts, notifications.ts
│
├── e2e/                          # Playwright E2E test files
├── tests/                        # Additional integration tests
├── scripts/                      # Build and utility scripts
│   └── generate-sitemap.mjs      # Sitemap generator
├── public/                       # Static assets served directly
│   └── icons/                    # PWA icon set
├── docs/                         # Project documentation (non-committed artifacts)
├── .planning/                    # GSD planning artifacts
│   ├── STATE.md                  # Current project state
│   ├── ROADMAP.md                # High-level roadmap
│   ├── codebase/                 # Codebase map documents (this directory)
│   ├── milestones/               # Milestone requirements and roadmaps
│   └── phases/                   # Phase execution plans and summaries
└── .claude/                      # Claude AI configuration
    ├── settings.local.json
    └── hooks/
```

## Directory Purposes

**`src/pages/`:**

- Purpose: One file per route. Each page component handles data fetching and assembles domain components.
- Contains: 70+ `.tsx` files named after the feature (PascalCase)
- Key files: `Home.tsx`, `ProductDetail.tsx`, `Checkout.tsx`, `SellerDashboard.tsx`, `AdminDashboard.tsx`

**`src/components/`:**

- Purpose: Reusable UI components grouped by domain subdirectory
- Contains: Domain folders — `layout/`, `auth/`, `product/`, `checkout/`, `seller/`, `commerce/`, `ai/`, `common/`, `ui/`
- Key files: `layout/Navbar.tsx`, `layout/SellerLayout.tsx`, `commerce/ProductCard.tsx`, `checkout/StripePaymentForm.tsx`

**`src/context/`:**

- Purpose: All React Context providers. Each file exports a `Provider` component and a `useXxx()` hook.
- Key files: `AuthContext.tsx`, `CartContext.tsx`, `LanguageContext.tsx`

**`src/services/`:**

- Purpose: All Firestore SDK operations. Functions wrap queries/mutations; errors handled via `handleFirestoreError`.
- Key files: `productService.ts`, `orderService.ts`, `reviewService.ts`

**`src/lib/`:**

- Purpose: Shared utilities, SDK initializations, and cross-cutting helpers
- Key files: `firebase.ts` (client SDK init), `firebase-admin.ts` (server SDK init — imported in server code only), `authMiddleware.ts`, `utils.ts`

**`server/routes/`:**

- Purpose: Express route registration. Each file exports a `registerXxxRoutes(app, deps)` function.
- Key files: `stripe.ts`, `iyzico.ts`, `sellerApi.ts`, `orders.ts`

**`server/services/`:**

- Purpose: Server-side business logic that requires Admin SDK access or external payment APIs
- Key files: `paymentProvider.ts`, `commissionEngine.ts`, `ledgerService.ts`, `orderService.ts`

**`server/lib/`:**

- Purpose: Server-exclusive utilities (Zod schemas, validation middleware, audit log, price validation)
- Key files: `schemas.ts`, `validate.ts`, `auditLog.ts`

**`src/i18n/`:**

- Purpose: Static translation key-value JSON files for all four supported locales
- Key files: `tr.json` (primary), `en.json`, `de.json`, `ar.json`

**`src/types/`:**

- Purpose: Domain-specific extended types that complement `src/types.ts`
- Key files: `order.ts`, `payment.ts`, `returns.ts`

**`mobile/`:**

- Purpose: Standalone React Native (Expo) app sharing the same Firebase project
- Key files: `App.tsx`, `src/context/cartStore.ts`, `src/services/api.ts`

**`.planning/`:**

- Purpose: GSD workflow artifacts — roadmap, phase plans, codebase maps
- Generated: No
- Committed: Yes (all planning docs are version-controlled)

## Naming Conventions

**Files:**

- Pages and components: PascalCase, noun phrase — `ProductDetail.tsx`, `SellerLayout.tsx`
- Services: camelCase with `Service` suffix — `productService.ts`, `reviewService.ts`
- Hooks: camelCase with `use` prefix — `useComparison.ts`, `useExchangeRate.ts`
- Context files: PascalCase with `Context` suffix — `AuthContext.tsx`, `CartContext.tsx`
- Server routes: camelCase, domain noun — `stripe.ts`, `orders.ts`, `sellerApi.ts`
- Tests: `*.test.ts` or `*.test.tsx` co-located with source or in `__tests__/` sibling

**Directories:**

- Component domains: lowercase, no separator — `product/`, `checkout/`, `seller/`
- Test directories: `__tests__/` inside the module they test

## Where to Add New Code

**New buyer-facing feature:**

- Page component: `src/pages/NewFeature.tsx`
- Add lazy route in: `src/App.tsx` (use `named()` helper for named exports)
- Domain components: `src/components/<domain>/NewFeatureComponent.tsx`
- Firestore service: `src/services/newFeatureService.ts`
- Types: Add to `src/types.ts` (shared) or `src/types/newFeature.ts` (isolated)

**New seller panel page:**

- Page: `src/pages/SellerNewFeature.tsx`
- Register as nested route under `<Route path="/seller">` in `src/App.tsx`
- Seller-specific components: `src/components/seller/`

**New admin panel page:**

- Page: `src/pages/AdminNewFeature.tsx`
- Wrap in `<AdminRoute>` in `src/App.tsx`

**New server API endpoint:**

- If it fits an existing domain: add to `server/routes/<domain>.ts`
- New domain: create `server/routes/newDomain.ts` with `registerNewDomainRoutes(app, deps)` export
- Register in `server.ts` with the appropriate import and call

**New context/global state:**

- Create `src/context/NewFeatureContext.tsx` following existing pattern: `createContext` + `Provider` + `useNewFeature()` hook
- Add `<NewFeatureProvider>` to the provider chain in `src/App.tsx`

**New translation key:**

- Add to all four files: `src/i18n/tr.json`, `en.json`, `de.json`, `ar.json`
- Access via `t('key.path')` from `LanguageContext`

**Shared utility:**

- Pure functions with no Firebase/Express dependency: `src/lib/utils.ts`
- Server-only utilities: `server/lib/`
- Client Firebase helpers: `src/lib/firebase.ts`

**Tests:**

- Unit/component tests: `__tests__/` subdirectory next to the file being tested, or `*.test.ts(x)` co-located
- E2E tests: `e2e/` at project root

## Key File Locations

**Entry Points:**

- `server.ts`: Express server entry — all route registration happens here
- `src/main.tsx`: React DOM root
- `src/App.tsx`: Provider tree and all route definitions
- `index.html`: Vite HTML shell

**Configuration:**

- `vite.config.ts`: Build config, chunk splitting, PWA manifest
- `tsconfig.json`: TypeScript compiler options (strict, ESM, `@/` alias)
- `vitest.config.ts`: Unit test config
- `playwright.config.ts`: E2E config
- `eslint.config.js`: Linting rules
- `firestore.rules`: Firestore security rules (MUST deploy after changes)
- `firestore.indexes.json`: Composite index definitions

**Core Logic:**

- `src/lib/firebase.ts`: Client SDK — `db`, `auth`, `storage`, `handleFirestoreError`
- `src/lib/firebase-admin.ts`: Server SDK — `adminDb`, `adminAuth`
- `src/lib/authMiddleware.ts`: Express auth middleware factory
- `src/lib/serverValidators.ts`: Input validation helpers
- `server/services/paymentProvider.ts`: Payment abstraction
- `server/services/commissionEngine.ts`: Commission calculation logic
- `server/logger.ts`: Pino logger

**Types:**

- `src/types.ts`: All core domain types (User, Product, Order, Seller, Review, etc.)
- `src/types/order.ts`, `payment.ts`, `returns.ts`: Extended domain types

## Special Directories

**`node_modules/`:**

- Purpose: npm dependencies
- Generated: Yes
- Committed: No

**`dist/`:**

- Purpose: Vite production build output (served statically by Express)
- Generated: Yes
- Committed: No

**`.planning/codebase/`:**

- Purpose: GSD codebase map documents (ARCHITECTURE.md, STRUCTURE.md, STACK.md, etc.)
- Generated: Yes (by GSD map-codebase command)
- Committed: Yes

**`src/.venv/`:**

- Purpose: Python virtual environment for utility scripts
- Generated: Yes
- Committed: No (should be in .gitignore)

**`mobile/`:**

- Purpose: Standalone React Native (Expo) app — separate build pipeline
- Generated: No
- Committed: Yes

---

_Structure analysis: 2026-06-08_
