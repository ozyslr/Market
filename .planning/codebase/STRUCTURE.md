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
├── .prettierrc.json             # Prettier formatting configuration
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
│   ├── About.tsx                #   About us page
│   ├── Cart.tsx                 #   Shopping cart
│   ├── Campaigns.tsx            #   Campaign listing
│   ├── CategoryPage.tsx         #   Category listing
│   ├── Checkout.tsx             #   Checkout flow
│   ├── CollectionPage.tsx       #   Curated collection
│   ├── Contact.tsx              #   Contact page
│   ├── FAQ.tsx                  #   Frequently asked questions
│   ├── FollowedSellers.tsx      #   Followed sellers feed
│   ├── MessageCenter.tsx        #   Internal messaging inbox
│   ├── NotFound.tsx             #   404 page
│   ├── OrderHistory.tsx         #   Past orders list
│   ├── OrderTracking.tsx        #   Order tracking
│   ├── PriceAlerts.tsx          #   Price drop alerts
│   ├── ProductVerification.tsx  #   Product authenticity verification
│   ├── SearchResults.tsx        #   Search results
│   ├── SellOnBenimOlan.tsx      #   "Sell on our platform" landing
│   ├── SellerApplication.tsx    #   Seller application form
│   ├── UserProfile.tsx          #   User profile/settings
│   ├── UserSupport.tsx          #   User support/tickets
│   ├── VisualSearch.tsx         #   Image-based search
│   ├── Wishlist.tsx             #   User wishlist
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
│   ├── SellerAnalytics.tsx      #   Seller analytics dashboard
│   ├── SellerApiKeys.tsx        #   Seller API key management
│   ├── SellerCertificates.tsx   #   Seller certificates/credentials
│   ├── SellerCoupons.tsx        #   Seller coupon management
│   ├── SellerFinance.tsx        #   Seller financials
│   ├── SellerImportCenter.tsx   #   CSV product import
│   ├── SellerInventory.tsx      #   Seller product inventory
│   ├── SellerInvoices.tsx       #   Seller invoice management
│   ├── SellerMessages.tsx       #   Seller messaging
│   ├── SellerOrders.tsx         #   Seller order management
│   ├── SellerPerformance.tsx    #   Seller performance metrics
│   ├── SellerPriceAnalysis.tsx  #   Seller price analysis
│   ├── SellerPricing.tsx        #   Seller pricing tools
│   ├── SellerSettings.tsx       #   Seller store settings
│   ├── SellerStore.tsx          #   Public seller storefront
│   ├── AdCampaigns.tsx          #   Seller ad campaigns (CPC)
│   │
│   ├── ModeratorDashboard.tsx   #   Moderator panel
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
│   ├── location/                #   Delivery location components
│   │   └── DeliveryLocationSelector.tsx # Location picker with cascade
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
│   ├── profile/                 #   User profile components
│   │   ├── ProfileSettings.tsx  #     Profile settings form
│   │   ├── ReturnRequestModal.tsx #   Return request form
│   │   └── SavedPaymentMethod.tsx #  Saved payment card display
│   │
│   ├── seller/                  #   Seller panel components
│   │   ├── BatchShipModal.tsx   #     Batch shipping modal
│   │   ├── BulkEditBar.tsx      #     Bulk product edit bar
│   │   ├── CategorySelect.tsx   #     Category tree selector
│   │   ├── CSVImportPanel.tsx   #     CSV import panel
│   │   ├── OrderStatsBar.tsx    #     Order statistics bar
│   │   ├── ProductForm.tsx      #     Product add/edit form
│   │   ├── ProductFormModal.tsx #     Product form in modal
│   │   └── ReturnManagementSection.tsx # Return management
│   │
│   ├── seo/                     #   Structured data & SEO components
│   │   ├── JsonLd.tsx           #     JSON-LD structured data
│   │   └── schemas.ts           #     Schema.org type definitions
│   │
│   ├── ui/                      #   Generic UI primitives
│   │   ├── Skeleton.tsx         #     Loading skeleton placeholder
│   │   └── __tests__/           #     UI component tests
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
├── services/                    # Data access / business logic services (60 files)
│   ├── adService.ts             #   CPC advertising engine
│   ├── aiContentService.ts      #   AI-generated product content
│   ├── aiModerationService.ts   #   AI content moderation
│   ├── analyticsService.ts      #   Business analytics queries
│   ├── apiKeyService.ts         #   Seller API key management
│   ├── arService.ts             #   AR/3D model service
│   ├── auditLogService.ts       #   Admin audit logging
│   ├── behaviorService.ts       #   User behavior tracking
│   ├── blockchainService.ts     #   Blockchain authenticity records
│   ├── botService.ts            #   AI chatbot logic
│   ├── campaignService.ts       #   Campaign management
│   ├── cargoService.ts          #   Shipping/logistics tracking
│   ├── cartService.ts           #   Cart Firestore operations
│   ├── chatService.ts           #   Live support chat
│   ├── cmsService.ts            #   CMS/menu management
│   ├── commissionService.ts     #   Platform commission calculation
│   ├── couponService.ts         #   Coupon code validation
│   ├── dealService.ts           #   Featured deals management
│   ├── dynamicPricingService.ts #   Dynamic pricing rules
│   ├── emailService.ts          #   Transactional email sending
│   ├── featuredService.ts       #   Featured deals management
│   ├── financeService.ts        #   Seller payout + commission
│   ├── followService.ts         #   Follow/unfollow operations
│   ├── invoiceService.ts        #   Invoice generation
│   ├── loyaltyService.ts        #   Loyalty points system
│   ├── moderationService.ts     #   Content moderation
│   ├── notificationService.ts   #   Push + in-app notifications
│   ├── offlineService.tsx       #   Offline detection + banner
│   ├── oneClickCheckoutService.ts # One-click checkout logic
│   ├── orderService.ts          #   Order lifecycle management
│   ├── paymentProviderService.ts #   Payment provider abstraction
│   ├── priceAnalysisService.ts  #   Competitive price analysis
│   ├── priceHistoryService.ts   #   Price history records
│   ├── priceTrackingService.ts  #   Price tracking service
│   ├── priceTrackService.ts     #   User price alerts
│   ├── productQuestionService.ts # Product Q&A service
│   ├── productService.ts        #   Product CRUD + search + filtering
│   ├── pushNotificationService.ts # Push notification dispatch
│   ├── recommendationService.ts #   Product recommendation engine
│   ├── reorderService.ts        #   Reorder/past purchase
│   ├── returnService.ts         #   Return/refund processing
│   ├── reviewService.ts         #   Product reviews + moderation
│   ├── searchService.ts         #   Full-text product search
│   ├── seedService.ts           #   Database seeding
│   ├── sellerAnalyticsService.ts #   Seller analytics data
│   ├── sellerApplicationService.ts # Seller application processing
│   ├── sellerPayoutService.ts   #   Seller payout management
│   ├── sellerRatingService.ts   #   Seller rating calculation
│   ├── sellerService.ts         #   Seller profile + operations
│   ├── sellerTierService.ts     #   Seller tier management
│   ├── settingsService.ts       #   App settings
│   ├── stockAlertService.ts     #   Low stock alerts
│   ├── storageService.ts        #   Firebase Storage wrapper
│   ├── supportService.ts        #   User support tickets
│   ├── swRegistration.ts        #   Service worker registration
│   ├── userService.ts           #   User profile operations
│   ├── visualSearchService.ts   #   Image-based search
│   └── webhookService.ts        #   Webhook dispatch
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
│   ├── validate.ts              # Request body validation middleware factory
│   ├── schemas.ts               # Zod schemas for validation
│   └── __tests__/               # Validation tests
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
├── favicon.png                  # PNG favicon
├── favicon-16.png               # 16px favicon
├── favicon-32.png               # 32px favicon
├── favicon-48.png               # 48px favicon
├── apple-touch-icon.png         # iOS home screen icon
├── robots.txt                   # Search engine crawling rules
├── sitemap.xml                  # SEO sitemap
├── manifest.json                # PWA manifest
├── offline.html                 # PWA offline fallback page
├── firebase-messaging-sw.js     # Firebase push notification service worker
├── service-worker.js            # Service worker
├── og-image.png                 # Open Graph share image
├── logo.png                     # Site logo
├── brand-bag.png                # Brand shopping bag icon
├── modulus-pro-medium.otf       # Custom font
└── icons/                       # PWA app icons (192px, 512px)
    ├── icon-192.png
    └── icon-512.png
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
| `.prettierrc.json` | Prettier formatting rules |
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
| Data access services | `src/services/` (55 files) |
| Shared utilities | `src/lib/` (12 files + tests) |
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
