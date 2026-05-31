# Benim Olan -- Codebase Structure

**Date:** 2026-05-31
**Project Root:** `O:\AI\E-tic 2026`

---

## 1. Top-Level Directory Layout

```
O:\AI\E-tic 2026\
├── server.ts                    # Express server entry point (monolithic, 20KB)
├── package.json                 # Project metadata, scripts, dependencies
├── package-lock.json            # Locked dependency tree
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite build + PWA config
├── vitest.config.ts             # Vitest test runner configuration
├── playwright.config.ts         # Playwright E2E test configuration
├── .eslintrc.json               # ESLint configuration
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Environment variable template
│
├── src/                         # React application source code
├── server/                      # Server-side route modules
├── public/                      # Static assets (served as-is)
├── scripts/                     # Build/utility scripts
├── test-results/                # Playwright test output
├── docs/                        # Documentation and planning files
├── node_modules/                # Dependency packages
│
├── ROADMAP.md                   # Project roadmap
├── security_spec.md             # Security specification
├── README.md                    # Project introduction
│
├── firebase-applet-config.json  # Firebase client config
├── market-ecommerce-app-...json # Firebase admin service account
│
├── Logo.png                     # Brand assets
├── Logolar.png
├── yedek_logo.cdr
│
├── .claude/                     # Claude Code AI configuration
├── .planning/                   # Architecture/planning documents
│
├── ALIŞVERIŞ_AKIŞI_ANALİZİ.md  # Shopping flow analysis (Turkish)
├── APPENDIX_TECHNICAL_IMPLEMENTATION.md
├── CFO_EXECUTIVE_BRIEF.md
├── EXECUTIVE_BRIEF_1PAGER.txt
├── EXECUTIVE_SUMMARY_COMPETITIVE_ANALYSIS_ROADMAP.md
├── FINDINGS_SUMMARY.txt
├── KARGO_LOJISTIK_ANALIZ_RAPORU.md
├── PAYMENT_FINANCIAL_ANALYSIS.md
├── QUICK_REFERENCE_DASHBOARD.md
├── RETURN_IMPLEMENTATION_GUIDE.md
├── RETURN_REFUND_COMPARATIVE_REPORT.md
│
├── temp_close_divs.txt          # Temporary/legacy files
├── temp_divs.txt
```

---

## 2. `src/` -- React Application Source

```
src/
├── main.tsx                     # React DOM entry: render, Sentry init, Analytics init, SW register
├── App.tsx                      # Root component: providers, router, global layout
├── index.css                    # Global styles (Tailwind CSS)
│
├── pages/                       # Page-level components (one per route)
│   ├── Home.tsx                 #   Landing page
│   ├── ProductDetail.tsx        #   Product detail page
│   ├── Cart.tsx                 #   Shopping cart
│   ├── Checkout.tsx             #   Checkout flow
│   ├── SearchResults.tsx        #   Search results
│   ├── CategoryPage.tsx         #   Category listing
│   ├── CollectionPage.tsx       #   Curated collection
│   ├── UserProfile.tsx          #   User profile/settings
│   ├── Wishlist.tsx             #   User wishlist
│   ├── OrderTracking.tsx        #   Order tracking
│   ├── NotFound.tsx             #   404 page
│   ├── SellOnBenimOlan.tsx      #   "Sell on our platform" landing
│   ├── SellerApplication.tsx    #   Seller application form
│   ├── VisualSearch.tsx         #   Image-based search
│   ├── ProductVerification.tsx  #   Product authenticity verification
│   ├── UserSupport.tsx          #   User support/tickets
│   │
│   ├── AdminDashboard.tsx       #   Admin panel home
│   ├── AdminAnalytics.tsx       #   Admin analytics
│   ├── AdminAuditLog.tsx        #   Admin audit log
│   ├── AdminCampaigns.tsx       #   Admin campaign management
│   ├── AdminCategories.tsx      #   Admin category management
│   ├── AdminChat.tsx            #   Admin support chat
│   ├── AdminCMS.tsx             #   Admin CMS/menu management
│   ├── AdminCoupons.tsx         #   Admin coupon management
│   ├── AdminDeals.tsx           #   Admin featured deals
│   ├── AdminFinance.tsx         #   Admin finance panel
│   ├── AdminIntegrations.tsx    #   Admin integrations
│   ├── AdminLanguages.tsx       #   Admin translation studio
│   ├── AdminOrders.tsx          #   Admin order management
│   ├── AdminPayments.tsx        #   Admin payment management
│   ├── AdminProducts.tsx        #   Admin product management
│   ├── AdminReports.tsx         #   Admin reports
│   ├── AdminReturns.tsx         #   Admin return management
│   ├── AdminReviews.tsx         #   Admin review moderation
│   ├── AdminSellers.tsx         #   Admin seller management
│   ├── AdminSellerView.tsx      #   Admin single seller detail
│   ├── AdminSettings.tsx        #   Admin site settings
│   ├── AdminSupport.tsx         #   Admin support tickets
│   ├── AdminTiers.tsx           #   Admin tier configuration
│   ├── AdminUsers.tsx           #   Admin user management
│   ├── AdminWebhooks.tsx        #   Admin webhook configuration
│   │
│   ├── SellerDashboard.tsx      #   Seller panel home
│   ├── SellerInventory.tsx      #   Seller product inventory
│   ├── SellerOrders.tsx         #   Seller order management
│   ├── SellerFinance.tsx        #   Seller financials
│   ├── SellerSettings.tsx       #   Seller store settings
│   ├── SellerImportCenter.tsx   #   CSV product import
│   ├── SellerPricing.tsx        #   Seller pricing tools
│   ├── SellerAnalytics.tsx      #   Seller analytics dashboard
│   ├── SellerCertificates.tsx   #   Seller certificates/credentials
│   ├── SellerCoupons.tsx        #   Seller coupon management
│   ├── SellerPerformance.tsx    #   Seller performance metrics
│   ├── SellerInvoices.tsx       #   Seller invoice management
│   ├── SellerPriceAnalysis.tsx  #   Seller price analysis
│   ├── SellerApiKeys.tsx        #   Seller API key management
│   ├── SellerStore.tsx          #   Public seller storefront
│   ├── AdCampaigns.tsx          #   Seller ad campaigns (CPC)
│   │
│   ├── ModeratorDashboard.tsx   #   Moderator panel
│   └── SellerStore.tsx          #   Public seller storefront page
│
├── components/                  # Reusable UI components
│   ├── layout/                  #   Layout/shell components
│   │   ├── Navbar.tsx           #     Top navigation bar
│   │   ├── Footer.tsx           #     Site footer
│   │   ├── MobileMenu.tsx       #     Mobile navigation drawer (RTL-aware)
│   │   ├── MobileTabBar.tsx     #     Mobile bottom tab bar
│   │   ├── MegaMenu.tsx         #     Desktop mega menu dropdown
│   │   ├── SearchBar.tsx        #     Global search input
│   │   ├── TopTicker.tsx        #     Top announcement ticker
│   │   ├── AuthModal.tsx        #     Login/register modal
│   │   ├── LocationModal.tsx    #     Location selection modal
│   │   ├── NotificationsPanel.tsx #   Notification dropdown
│   │   └── SellerLayout.tsx     #     Seller panel layout (no nav/footer)
│   │
│   ├── commerce/                #   E-commerce specific components
│   │   ├── ProductCard.tsx      #     Product listing card
│   │   ├── ProductCarousel.tsx  #     Product carousel/slider
│   │   ├── ProductRecommendations.tsx # AI recommendations
│   │   ├── FilterPanel.tsx      #     Product filtering sidebar
│   │   ├── ComparisonBar.tsx    #     Product comparison bar
│   │   ├── ComparisonModal.tsx  #     Comparison detail modal
│   │   ├── StoryBar.tsx         #     Instagram-style stories
│   │   ├── ARViewer.tsx         #     3D/AR product viewer
│   │   ├── AuthenticityBadge.tsx #    Blockchain authenticity badge
│   │   ├── BotSalesEngine.tsx   #     AI sales chatbot
│   │   ├── InvoiceModal.tsx     #     Invoice display modal
│   │   └── StickyBuyBar.tsx     #     Sticky add-to-cart bar
│   │
│   ├── product/                 #   Product detail components
│   │   ├── ProductGallery.tsx   #     Image gallery/zoom
│   │   ├── ReviewCard.tsx       #     Single review display
│   │   ├── ReviewSection.tsx    #     Full review section
│   │   ├── RatingSummary.tsx    #     Star rating breakdown
│   │   ├── QASection.tsx        #     Q&A section
│   │   ├── QuestionCard.tsx     #     Single Q&A card
│   │   ├── DeliveryBox.tsx      #     Delivery info box
│   │   ├── InstallmentTable.tsx #     Installment payment table
│   │   ├── OtherSellers.tsx     #     Other sellers listing
│   │   ├── PriceHistoryChart.tsx #    Price history (Recharts)
│   │   ├── UnitPrice.tsx        #     Unit price display
│   │   ├── SocialProofBar.tsx   #     Social proof indicators
│   │   ├── AIProductInsights.tsx #    AI-generated insights
│   │   └── ProductFeatures.tsx  #     Features/specifications
│   │
│   ├── checkout/                #   Checkout-specific components
│   │   ├── IyzicoPayment.tsx    #     Iyzico payment form
│   │   ├── ManualPayment.tsx    #     Manual/offline payment
│   │   ├── PaymentMethodSelector.tsx # Card selection
│   │   └── OneClickSuccessModal.tsx # Fast checkout success
│   │
│   ├── common/                  #   Shared/generic components
│   │   ├── SEO.tsx              #     Meta tags (react-helmet-async)
│   │   ├── Breadcrumb.tsx       #     Breadcrumb navigation
│   │   ├── OptimizedImage.tsx   #     Lazy-loaded optimized image
│   │   ├── ScrollToTop.tsx      #     Route change scroll reset
│   │   ├── CookieConsent.tsx    #     GDPR cookie consent banner
│   │   ├── SkipToContent.tsx    #     Accessibility skip link
│   │   ├── AnalyticsTracker.tsx #     Page view tracking
│   │   └── __tests__/           #     Component tests
│   │       ├── Breadcrumb.test.tsx
│   │       └── OptimizedImage.test.tsx
│   │
│   ├── home/                    #   Homepage components
│   │   └── Hero.tsx             #     Hero carousel/slider
│   │
│   ├── ai/                      #   AI integration components
│   │   └── ShoppingAssistant.tsx #    AI shopping assistant chat
│   │
│   ├── chat/                    #   Live support components
│   │   └── LiveChatWidget.tsx   #     Live chat widget
│   │
│   └── marketing/               #   Marketing components
│       └── CampaignBanner.tsx   #     Campaign promotion banner
│
├── context/                     # React Context providers (state management)
│   ├── AuthContext.tsx          #   Firebase Auth + user profile
│   ├── CartContext.tsx          #   Shopping cart (Firestore backed)
│   ├── WishlistContext.tsx      #   Product wishlist/favorites
│   ├── FollowsContext.tsx       #   Seller following system
│   ├── NotificationContext.tsx  #   In-app notifications
│   ├── LanguageContext.tsx      #   i18n + RTL (101 lines, lazy-loads DE+AR)
│   ├── ThemeContext.tsx         #   Visual theme
│   └── LocationContext.tsx      #   User location/delivery region
│
├── hooks/                       # Custom React hooks
│   ├── useComparison.ts         #   Product comparison state
│   ├── useExchangeRate.ts       #   Currency exchange rate conversion
│   └── useOneClickCheckout.ts   #   One-click checkout flow
│
├── services/                    # Data access / business logic services
│   ├── productService.ts        #   Product CRUD + search + filtering
│   ├── orderService.ts          #   Order lifecycle management
│   ├── reviewService.ts         #   Product reviews + moderation
│   ├── cartService.ts           #   Cart Firestore operations
│   ├── adService.ts             #   CPC advertising engine
│   ├── searchService.ts         #   Full-text product search
│   ├── campaignService.ts       #   Campaign management
│   ├── sellerService.ts         #   Seller profile + operations
│   ├── userService.ts           #   User profile operations
│   ├── financeService.ts        #   Seller payout + commission
│   ├── cargoService.ts          #   Shipping/logistics tracking
│   ├── notificationService.ts   #   Push + in-app notifications
│   ├── emailService.ts          #   Transactional email sending
│   ├── invoiceService.ts        #   Invoice generation
│   ├── loyaltyService.ts        #   Loyalty points system
│   ├── blockchainService.ts     #   Blockchain authenticity records
│   ├── couponService.ts         #   Coupon code validation
│   ├── commissionService.ts     #   Platform commission calculation
│   ├── dynamicPricingService.ts #   Dynamic pricing rules
│   ├── aiContentService.ts      #   AI-generated product content
│   ├── aiModerationService.ts   #   AI content moderation
│   ├── analyticsService.ts      #   Business analytics queries
│   ├── behaviorService.ts       #   User behavior tracking
│   ├── auditLogService.ts       #   Admin audit logging
│   ├── apiKeyService.ts         #   Seller API key management
│   ├── followService.ts         #   Follow/unfollow operations
│   ├── featuredService.ts       #   Featured deals management
│   ├── offlineService.ts        #   Offline detection + banner
│   ├── swRegistration.ts        #   Service worker registration
│   └── appUpdateService.ts      #   PWA update notification
│
├── lib/                         # Shared utilities and configuration
│   ├── firebase.ts              #   Firebase client SDK init + error handling
│   ├── firebase-admin.ts        #   Firebase Admin SDK (server-side)
│   ├── authMiddleware.ts        #   Express middleware: verifyFirebaseToken, verifyAdmin
│   ├── serverValidators.ts      #   Request validation utilities
│   ├── analytics.ts             #   Google Analytics setup + events
│   ├── sentry.ts                #   Sentry error monitoring init
│   ├── gemini.ts                #   Gemini AI shopping assistant (server-proxied)
│   ├── taxEngine.ts             #   VAT/customs/duty calculation
│   ├── turkeyLocations.ts       #   Turkish province + district data
│   ├── csvTemplate.ts           #   CSV import template builder
│   ├── storage.ts               #   Firebase Storage helper
│   ├── utils.ts                 #   Generic utility functions
│   └── __tests__/               #   Lib unit tests
│
├── types.ts                     # Core TypeScript type definitions (490 lines)
│                               #   7 domain-organized sections:
│                               #   Auth, Marketplace, Catalog, Content, Commerce,
│                               #   Community, Advertising
│
├── data/                        # Domain-specific mock data fixtures
│   ├── mockSellers.ts           #   Mock seller profiles (150 lines)
│   ├── mockCategories.ts        #   Mock category tree (716 lines)
│   ├── mockProducts.ts          #   Mock product catalog (2,830 lines)
│   └── mockUser.ts              #   Mock user profile (37 lines)
│
├── i18n/                        # Per-locale translation files
│   ├── index.ts                 #   Lazy loader with cache
│   ├── tr.ts                    #   Turkish translations (340 keys)
│   ├── en.ts                    #   English translations (338 keys)
│   ├── de.ts                    #   German translations (338 keys)
│   └── ar.ts                    #   Arabic translations (338 keys)
│
├── mockData.ts                  # Barrel re-export for backward compat (7 lines)
│
├── .claude/                     # Claude Code AI configuration
│   ├── rules.md                 # Project rules for AI
│   ├── settings.local.json      # Local AI settings
│   ├── SKILL.md                 # Skill definitions
│   └── skills/                  # Loaded skills (ecom-cfo, ui-ux, etc.)
│
└── .venv/                       # Python virtual environment (unrelated tooling)
```

---

## 3. `server/` -- Server Route Modules

```
server/
├── iyzico.cjs                   # Iyzico SDK loader (CommonJS wrapper for ESM)
├── logger.ts                    # Structured JSON logger (zero-dependency)
├── declarations.d.ts            # Type declarations for packages missing @types/*
├── lib/
│   └── validate.ts              # Request body validation middleware factory
└── routes/
    ├── stripe.ts                # All Stripe endpoints + webhook handler
    ├── iyzico.ts                # Iyzico payment endpoints
    ├── sellerApi.ts             # Seller REST API (API-key auth, versioned)
    └── gemini.ts                # Gemini AI proxy (text, vision, image)
```

All route modules export `register*` functions that receive the Express `app` instance plus dependency injection (Firestore, Stripe SDK, middleware, etc.).

---

## 4. `public/` -- Static Assets

```
public/
├── favicon.ico                  # Favicon
├── apple-touch-icon.png         # iOS home screen icon
├── robots.txt                   # Search engine crawling rules
├── sitemap.xml                  # SEO sitemap
├── offline.html                 # PWA offline fallback page
├── firebase-messaging-sw.js     # Firebase push notification service worker
├── icons/                       # PWA app icons (192px, 512px)
│   ├── icon-192.png
│   └── icon-512.png
└── images/                      # Static image assets
```

---

## 5. `scripts/` -- Build and Utility Scripts

```
scripts/
├── generate-sitemap.mjs         # Dynamic sitemap generator (run during build)
└── pre-commit.sh                # Secret scanner pre-commit hook
```

---

## 6. Key Configuration Files

| File | Purpose |
|---|---|
| `vite.config.ts` | Vite + React + Tailwind + PWA + visualizer plugins, `@` path alias |
| `tsconfig.json` | TypeScript (JSX react-jsx, ESNext, strictNullChecks + noImplicitAny enabled) |
| `vitest.config.ts` | Unit test runner config (jsdom environment) |
| `playwright.config.ts` | E2E test runner config |
| `package.json` | `scripts.dev` = `tsx server.ts`, `scripts.build` = sitemap + vite build |

---

## 7. Naming Conventions

- **Files:** PascalCase for React components (`ProductCard.tsx`), camelCase for utilities/services (`productService.ts`, `firebase.ts`).
- **Exports:** Named exports for components (`export function Navbar`), default exports used sparingly.
- **Functions:** camelCase (`createPaymentIntent`, `getCart`).
- **Interfaces/ Types:** PascalCase (`UserProfile`, `CartItem`, `AdCampaign`).
- **TypeScript:** Strong typing throughout. Core types in `src/types.ts`, component-specific types in local files.
- **CSS:** Tailwind CSS utility classes (v4), no separate CSS modules.
- **Contexts:** `XxxProvider` + `useXxx` pattern per context file.

---

## 8. Where to Find Things

| What | Where |
|---|---|
| Server entry + all API routes | `server.ts` (root) |
| Route modules | `server/routes/` (4 files) |
| Server utilities | `server/lib/`, `server/logger.ts` |
| App routing + provider hierarchy | `src/App.tsx` (lazy-loaded pages) |
| Page components | `src/pages/` (55 files, React.lazy) |
| UI components by domain | `src/components/{domain}/` |
| Global state (React Context) | `src/context/` (8 providers) |
| Data access services | `src/services/` (30+ files) |
| Shared utilities | `src/lib/` (13 files) |
| Custom hooks | `src/hooks/` (3 files) |
| Type definitions | `src/types.ts` (7 domain sections) |
| Mock data fixtures | `src/data/` (4 domain files) |
| i18n translations | `src/i18n/` (4 locale files + loader) |
| Static assets | `public/` |
| Build configuration | `vite.config.ts` (root) |
| ESLint configuration | `.eslintrc.json` (root) |
| Tests | Co-located `__tests__/` dirs + `test-results/` |
| Pre-commit hooks | `scripts/pre-commit.sh` |
| Claude AI config | `src/.claude/` |
| Firebase client config | `firebase-applet-config.json` (root) |

---

## 9. Module Boundaries and Dependencies

```
src/main.tsx
  └── src/App.tsx
        ├── src/context/(Auth|Cart|Wishlist|Follows|Notification|Language|Theme|Location)Context.tsx
        │     └── src/services/xxxService.ts
        │           └── src/lib/firebase.ts (client-side Firestore)
        ├── src/pages/*.tsx
        │     ├── src/components/{domain}/*.tsx
        │     ├── src/hooks/use*.ts
        │     └── src/services/xxxService.ts
        └── src/components/common/*.tsx
              └── src/lib/analytics.ts

server.ts
  ├── server/routes/stripe.ts
  │     └── src/lib/firebase-admin.ts
  ├── server/routes/iyzico.ts
  │     └── server/iyzico.cjs
  ├── server/routes/sellerApi.ts
  │     └── src/lib/firebase-admin.ts
  ├── server/routes/gemini.ts
  │     └── @google/genai (server-side only)
  ├── server/logger.ts
  ├── server/lib/validate.ts
  ├── src/lib/authMiddleware.ts
  │     └── src/lib/firebase-admin.ts
  └── src/lib/serverValidators.ts
```
