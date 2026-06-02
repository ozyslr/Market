## gstack (REQUIRED — global install)

**Before doing ANY work, verify gstack is installed:**

```bash
test -d ~/.claude/skills/gstack/bin && echo "GSTACK_OK" || echo "GSTACK_MISSING"
```

If GSTACK_MISSING: STOP. Do not proceed. Tell the user:

> gstack is required for all AI-assisted work in this repo.
> Install it:
>
> ```bash
> git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
> cd ~/.claude/skills/gstack && ./setup --team
> ```
>
> Then restart your AI coding tool.

Do not skip skills, ignore gstack errors, or work around missing gstack.

Using gstack skills: After install, skills like /qa, /ship, /review, /investigate,
and /browse are available. Use /browse for all web browsing.
Use ~/.claude/skills/gstack/... for gstack file paths (the global path).

<!-- GSD:project-start source:PROJECT.md -->

## Project

**Benim Olan (Mercora) — Global Artisan Marketplace**

Benim Olan, satıcıların kendi mağazalarını açıp ürünlerini sattığı, kategori bazlı değişken komisyonla çalışan çok dilli (TR/EN/DE/AR) bir online pazar yeridir. Trendyol benzeri bir modelle satıcı ve müşteriyi birleştirir. Şu anda Technical MVP aşamasında canlıda çalışmakta olup, tam kapsamlı bir e-ticaret platformuna dönüştürülmektedir.

**Core Value:** Satıcıların kendi mağazalarını KYC onayıyla açabildiği ve müşterilerin hızlı, güvenli alışveriş yapabildiği eksiksiz bir pazar yeri deneyimi. En kritik şey: güvenilir ödeme altyapısı ve satıcı güveni.

### Constraints

- **Ekip:** Solo developer + AI destekli geliştirme — tüm kodlama tek kişi tarafından yapılıyor
- **Pazar:** TR + Avrupa hedefleniyor (çoklu dil, çoklu para birimi, bölgesel regülasyonlar)
- **Mevcut stack:** Firebase, Express, React — radikal stack değişikliği yok; mevcut mimari üzerine inşa
- **Ödeme:** Stripe (Avrupa/global) + Iyzico (Türkiye) — çift ödeme sağlayıcı
- **Zaman:** 6 ayda tam kapsamlı pazar yeri deneyimine ulaşma hedefi
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Overview

## Primary Language & Runtime

| Aspect            | Detail                                                     |
| ----------------- | ---------------------------------------------------------- |
| Language          | **TypeScript** 5.8.2 (strict mode, ES2022 target)          |
| Module system     | ESM (`"type": "module"` in package.json)                   |
| JSX mode          | `react-jsx` (automatic runtime)                            |
| Dev server runner | **tsx** 4.22.3 (transpiles TS on the fly)                  |
| Node.js range     | >=22 (inferred from `@types/node` 22.14, tsx requirements) |

## Frontend

| Layer        | Technology                    | Version |
| ------------ | ----------------------------- | ------- |
| UI library   | **React**                     | 19.2.6  |
| DOM renderer | **react-dom**                 | 19.2.6  |
| Router       | **react-router-dom**          | 7.15.1  |
| Build tool   | **Vite**                      | 6.2.0   |
| React plugin | **@vitejs/plugin-react**      | 5.0.4   |
| PWA support  | **vite-plugin-pwa** (Workbox) | 1.3.0   |

### Key Frontend Libraries

| Library                              | Version                | Purpose                              |
| ------------------------------------ | ---------------------- | ------------------------------------ |
| lucide-react                         | 0.546.0                | Icon set                             |
| motion                               | 12.40.0                | Animations / Framer Motion           |
| recharts                             | 3.8.1                  | Charts (seller analytics dashboard)  |
| @dnd-kit/core / sortable / utilities | 6.3.1 / 10.0.0 / 3.2.2 | Drag-and-drop (inventory, CMS)       |
| @google/model-viewer                 | 4.2.0                  | 3D product viewer                    |
| react-helmet-async                   | 3.0.0                  | SEO / meta tags                      |
| papaparse                            | 5.5.3                  | CSV import/export (seller inventory) |
| axios                                | 1.16.1                 | HTTP client                          |
| clsx / tailwind-merge                | 2.1.1 / 3.6.0          | Class name utilities                 |

## Backend

| Layer               | Technology                                          | Version                  |
| ------------------- | --------------------------------------------------- | ------------------------ |
| HTTP framework      | **Express**                                         | 4.21.2                   |
| Security headers    | **helmet**                                          | 8.2.0                    |
| CORS                | **cors**                                            | 2.8.6                    |
| Rate limiting       | **express-rate-limit**                              | 8.5.2                    |
| Environment         | **dotenv**                                          | 17.2.3                   |
| Stripe SDK (server) | **stripe**                                          | 22.1.1                   |
| Stripe (client)     | **@stripe/stripe-js** + **@stripe/react-stripe-js** | 9.6.0 / 6.4.0            |
| iyzico SDK          | **iyzipay**                                         | 2.0.67 (via CJS wrapper) |
| Firebase Admin      | **firebase-admin**                                  | 13.10.0                  |
| Firebase Client     | **firebase**                                        | 12.13.0                  |
| Gemini AI           | **@google/genai**                                   | 1.29.0                   |

## Database & ORM

| Component        | Technology                                                                |
| ---------------- | ------------------------------------------------------------------------- |
| Primary database | **Firebase Firestore** (NoSQL document store)                             |
| Client SDK       | `firebase/firestore`                                                      |
| Admin SDK        | `firebase-admin/firestore`                                                |
| File storage     | **Firebase Storage** (`firebase/storage`)                                 |
| Authentication   | **Firebase Auth** (`firebase/auth` server-side via `firebase-admin/auth`) |
| ORM              | None — raw Firestore SDK calls throughout                                 |

## CSS / Styling

| Technology              | Version | Notes                                                                         |
| ----------------------- | ------- | ----------------------------------------------------------------------------- |
| **Tailwind CSS**        | 4.3.0   | v4 with Vite plugin (`@tailwindcss/vite`)                                     |
| autoprefixer            | 10.4.21 | PostCSS vendor prefixing                                                      |
| No `tailwind.config.ts` | —       | Tailwind v4 uses CSS-based configuration (`@theme` directives in `index.css`) |

## Build Tooling & Configuration

| Step            | Tool                                                                    |
| --------------- | ----------------------------------------------------------------------- |
| Bundler         | **Vite 6**                                                              |
| TypeScript      | **tsc** (type-check only: `tsc --noEmit`)                               |
| Linting         | **ESLint** 10.4.0                                                       |
| Unit tests      | **Vitest** 4.1.7 + **jsdom** 29.1.1 + **@testing-library/react** 16.3.2 |
| E2E tests       | **Playwright** 1.60.0                                                   |
| Performance     | **Lighthouse CI** (lhci) 4.1.2                                          |
| Bundle analysis | **rollup-plugin-visualizer** 7.0.1                                      |
| Sitemap         | Custom Node script (`scripts/generate-sitemap.mjs`)                     |
| PWA build       | vite-plugin-pwa generates Workbox service worker                        |

## Project Structure

## Monorepo Status

## Testing Stack

| Category         | Tool                                    | Config                                       |
| ---------------- | --------------------------------------- | -------------------------------------------- |
| Unit / Component | **Vitest** + **@testing-library/react** | `tsconfig` paths resolved, jsdom environment |
| E2E              | **Playwright**                          | `playwright.config.ts` at root               |
| Coverage         | Vitest `--coverage`                     | —                                            |
| CI               | Lighthouse CI                           | `lhci autorun`                               |

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Code Style / Formatting

- **ESLint and Prettier configured.** `.eslintrc.json` (ESLint 10) and `.prettierrc.json` at project root. The `npm run lint` script runs `tsc --noEmit` for type-checking.
- **Vite build pipeline** uses `@vitejs/plugin-react` with `@tailwindcss/vite` for CSS. The `vite.config.ts` defines a `@/` path alias mapping to `./src`.
- **CSS approach:** Tailwind CSS v4 via the Vite plugin. The `cn()` utility (`src/lib/utils.ts`) wraps `clsx` and `tailwind-merge` for conditional class merging.
- **File extension convention:** Components — `.tsx`, pure logic/services — `.ts`, tests — `.test.tsx` or `.test.ts`.

## TypeScript Usage Patterns

- **tsconfig** (`O:/AI/E-tic 2026/tsconfig.json`):
- **Type vs Interface:** The codebase consistently uses `interface` for object shapes and props, and `type` for unions, aliases, and complex types. Examples:
- **`import type`** is used for type-only imports (e.g., `import type { ProductCertificate } from '@/services/blockchainService'` in `AuthenticityBadge.tsx`).
- **Type exports:** Core domain types live in `src/types.ts`. Domain-specific types in `src/types/` (e.g., `src/types/order.ts`).

## Component Patterns

- **Functional components only.** Every component is a function, no class components.
- **Named exports (preferred):** `export function ComponentName({ prop1, prop2 }: Props)`. This is the dominant pattern.
- **Default exports (rare):** A few exceptions exist (`SellerLayout`, `SellerAnalytics`). These are the minority.
- **Props typing:** A local `interface Props` (or `interface ComponentNameProps`) declared immediately above the component, destructured in the function signature.
- **File-per-component:** Each component gets its own `.tsx` file. No barrel exports from `index.ts` — components are imported by full path.
- **Composition:** Components import sub-components by `@/components/*` alias paths.

## Naming Conventions

| Category         | Convention                      | Example                                 |
| ---------------- | ------------------------------- | --------------------------------------- |
| Components       | PascalCase, noun phrase         | `ProductCard`, `ComparisonModal`        |
| Hooks            | camelCase, `use` prefix         | `useComparison`, `useExchangeRate`      |
| Services         | camelCase, function-based       | `addReview`, `getProductCertificate`    |
| Variables        | camelCase                       | `items`, `viewerRef`                    |
| Files            | PascalCase for components       | `ProductRecommendations.tsx`            |
| Files            | camelCase for services/hooks    | `productService.ts`, `useComparison.ts` |
| Types/Interfaces | PascalCase                      | `UserProfile`, `ProductVariant`         |
| Props interface  | `Props` or `ComponentNameProps` | `Props` (local), `ComparisonModalProps` |

## Error Handling Patterns

- **Service layer:** Every Firestore service function wraps logic in `try/catch`, calls `handleFirestoreError(error, OperationType, context)`, then **re-throws** or returns a fallback value:
- **Graceful degradation in reads:** `getCategories`, `getReviewsByProduct` return empty arrays (`[]`) or fallback data on error instead of throwing.
- **Server (Express):** Routes use `try/catch` with `res.status(400|500).json({ error: error.message })`.
- **Stripe webhooks:** Pattern of `try/catch` with `console.error` logging and `res.status(400).json({ error })`.
- **No React Error Boundaries** found in the codebase (Sentry integration exists in `src/lib/sentry.ts` for crash reporting).
- **Optional chaining** (`?.`) and nullish coalescing (`??`) are used throughout for safe property access.

## Import Organization

## React Patterns

- **Custom hooks:** Named with `use` prefix, placed in `src/hooks/`. Examples:
- **Context providers:** Defined in `src/context/`, following the pattern:
- **Module-level state:** `useComparison` uses module-level variables + listener set + `forceUpdate` pattern instead of Context, enabling cross-hook state sharing without nesting providers.
- **Animations:** `motion` (framer-motion v12 via `motion/react`) for transitions, `AnimatePresence` for mount/unmount animations.
- **Icons:** `lucide-react` for iconography.
- **Routing:** `react-router-dom` v7 (`BrowserRouter`, `Routes`, `Route`).
- **Helmet:** `react-helmet-async` for SEO meta tags.
- **PWA:** `vite-plugin-pwa` with Workbox for service worker and offline support.

## API Call Patterns

- **Firebase Firestore (primary):** Direct Firestore SDK calls (`collection`, `addDoc`, `getDocs`, `doc`, `updateDoc`, `deleteDoc`, `query`, `where`, `orderBy`, `limit`, `serverTimestamp`, `runTransaction`) wrapped in service modules under `src/services/`. Examples: `productService.ts`, `reviewService.ts`, `orderService.ts`.
- **REST API (secondary):** Some services use `fetch()` for backend API calls:
- **Server routes:** Express-based API in `server/`, e.g., `server/routes/stripe.ts`. Follows route registration pattern with dependency injection (deps object with `stripe`, `adminDb`, `verifyFirebaseToken`).
- **Realtime subscriptions:** Firestore `onSnapshot` used for live data (e.g., `subscribeToProductReviews` in `reviewService.ts`).

## State Management Conventions

- **React Context API** is the primary state management approach. No Redux, Zustand, or Jotai.
- **Auth state:** Firebase Auth via `AuthContext`.
- **Cart state:** `CartContext` with `addItem`, `removeItem` methods.
- **i18n:** `LanguageContext` holds language selection and translation key-value pairs.
- **Theme:** `ThemeContext` for dark/light mode.
- **Module-level singleton state:** `useComparison` hook manages shared state at the module level (not in Context) using a listener-notify pattern.
- **Server-side state:** Firebase Firestore is the source of truth for orders, products, reviews, categories, etc. — fetched on demand or subscribed to.

## File Structure

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## 1. Overall Architectural Pattern

- **Frontend:** React 19 SPA built with Vite 6, delivered by the Express server.
- **Backend:** Express.js (Node.js) running on port 3000.
- **Database:** Firebase Firestore (NoSQL) accessed both from the client (via `firebase` SDK) and the server (via `firebase-admin` SDK).
- **Authentication:** Firebase Auth (Google OAuth + email/password).
- **Payments:** Stripe (primary, full PCI-compliant) + Iyzico (Turkish market, sandbox).
- **i18n:** Multi-language (TR, EN, DE, AR) with RTL support for Arabic.

## 2. Frontend-Backend Communication

### Pattern A: Direct Firestore Access (Client-Side)

```

```

### Pattern B: Server REST API (Express Routes)

| Endpoint                              | Purpose                             |
| ------------------------------------- | ----------------------------------- |
| `POST /api/create-payment-intent`     | Stripe payment creation             |
| `POST /api/create-setup-intent`       | Stripe card saving setup            |
| `POST /api/setup-payment-method`      | Attach Stripe card to customer      |
| `POST /api/one-click-checkout`        | One-click checkout using saved card |
| `GET /api/payment-methods`            | List saved Stripe cards             |
| `DELETE /api/payment-methods/:id`     | Remove saved card                   |
| `PATCH /api/payment-methods/default`  | Set default card                    |
| `POST /api/webhook`                   | Stripe webhook (raw body)           |
| `POST /api/iyzico/init`               | Iyzico payment init                 |
| `POST /api/iyzico/check`              | Iyzico payment check                |
| `POST /api/abandoned-cart/check`      | Abandoned cart email cron           |
| `POST /api/send-push`                 | Push notification sending           |
| `POST /api/process-scheduled-payouts` | Seller payout processing            |
| `GET /api/health`                     | Health check                        |
| `GET /api/v1/*`                       | Seller REST API (API-key auth)      |
| `GET /api/v1/`                        | Seller API info                     |

### Pattern C: Seller REST API

## 3. Architectural Layers

### Presentation Layer

- **Pages** (`src/pages/`): 65+ page components each mapping to a React Router route. Covers buyer (Home, ProductDetail, Cart, Checkout, etc.), seller (Dashboard, Inventory, Orders, Finance, etc.), and admin (Dashboard, Products, Users, CMS, etc.) flows.
- **Components** (`src/components/`): Reusable UI components organized by domain:

### Business Logic / State Management Layer

- **React Contexts** (`src/context/`): 8 context providers manage global state:
- **Providers** are nested in `App.tsx` in a specific order: SentryErrorBoundary > ThemeProvider > AuthProvider > CartProvider > WishlistProvider > FollowsProvider > NotificationProvider > LanguageProvider > LocationProvider > Router.
- **Hooks** (`src/hooks/`): Custom React hooks (`useComparison`, `useExchangeRate`, `useOneClickCheckout`).

### Data Access / Service Layer

- **Services** (`src/services/`): ~55 service modules encapsulating Firestore read/write operations:
- **Lib** (`src/lib/`): Shared utilities and configurations:
- **Server Lib** (`server/lib/`): Validation utilities:

## 4. State Management Approach

- Provides its own `Provider` component wrapping children in `App.tsx`.
- Exports a custom `useXxx()` hook that wraps `useContext(XxxContext)`.
- Persists state to Firestore where appropriate (CartContext debounces saves to Firestore; AuthContext reads user profile from Firestore).
- Uses `localStorage` for lightweight persistence (language preference via `LanguageContext`).

## 5. Routing Structure

### React Router (Client-Side)

- **Seller Layout Route Group** (`/seller/*`): Uses `SellerLayout` component (no Navbar/Footer), nested routes:
- **Main Layout Route Group** (uses `MainLayout` wrapping children with Navbar + Footer):

### Server-Side Catch-All

## 6. Data Flow Patterns

### Typical Read Flow

```

```

### Typical Write Flow (e.g., placing an order)

```

```

### Real-time Updates

- Firebase `onAuthStateChanged` listener in `AuthContext` for session persistence.
- Notifications and chat may use Firebase real-time listeners (not fully verified).

## 7. Entry Points

| Entry           | File                    | Purpose                                                                                                 |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| **Server**      | `server.ts` (root)      | Express server, loads Vite middleware, registers all API + webhook routes. Started via `tsx server.ts`. |
| **Build Entry** | `vite.config.ts` (root) | Vite build configuration with React, Tailwind CSS v4, PWA plugins.                                      |
| **React Entry** | `src/main.tsx`          | React DOM root creation. Calls `initSentry()`, `initAnalytics()`, `registerSW()`.                       |
| **App Root**    | `src/App.tsx`           | Provider hierarchy and router configuration.                                                            |

## 8. Key Abstractions and Shared Modules

### Server-Side Validators (`src/lib/serverValidators.ts`)

### Auth Middleware (`src/lib/authMiddleware.ts`)

### Firestore Error Handling (`src/lib/firebase.ts`)

### Seller API Authentication

### Payment Abstractions

- `server/routes/stripe.ts` -- All Stripe endpoints + webhook handling in one module. Exports `registerStripeWebhook` (raw body, must register first) and `registerStripeRoutes` (JSON body).
- `server/routes/iyzico.ts` -- Iyzico Turkish payment gateway endpoints.
- `server/iyzico.cjs` -- Lazy-loaded Iyzico SDK wrapper.

## 9. Key Technologies

| Technology             | Version | Usage                        |
| ---------------------- | ------- | ---------------------------- |
| React                  | 19.2    | UI framework                 |
| React Router           | 7.15    | Client-side routing          |
| Vite                   | 6.2     | Build tool + dev server      |
| Express                | 4.21    | HTTP server + API            |
| Firebase               | 12.13   | Auth + Firestore + Storage   |
| Firebase Admin         | 13.10   | Server-side Firestore access |
| Stripe                 | 22.1    | Payment processing           |
| Tailwind CSS           | 4.3     | Utility-first CSS            |
| TypeScript             | 5.8     | Type safety                  |
| Sentry                 | 10.53   | Error monitoring             |
| Google Gemini          | 1.29    | AI features                  |
| Vitest                 | 4.1     | Unit testing                 |
| Playwright             | 1.60    | E2E testing                  |
| Recharts               | 3.8     | Charts (seller analytics)    |
| Lucide React           | 0.54    | Icon library                 |
| Motion (Framer Motion) | 12.40   | Animations                   |
| DnD Kit                | 6.3     | Drag-and-drop                |

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.

<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.

<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.

<!-- GSD:profile-end -->
