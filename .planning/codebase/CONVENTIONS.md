# Coding Conventions

**Date:** 2026-05-31
**Project:** Benim Olan (Global Artisan Marketplace)

---

## Code Style / Formatting

- **No ESLint or Prettier configuration.** The project has no `.eslintrc*` or `.prettierrc*` files. The only lint-like check is `tsc --noEmit` (run via `npm run lint`), which performs TypeScript type-checking without emitting output.
- **Vite build pipeline** uses `@vitejs/plugin-react` with `@tailwindcss/vite` for CSS. The `vite.config.ts` defines a `@/` path alias mapping to `./src`.
- **CSS approach:** Tailwind CSS v4 via the Vite plugin. The `cn()` utility (`src/lib/utils.ts`) wraps `clsx` and `tailwind-merge` for conditional class merging.
- **File extension convention:** Components — `.tsx`, pure logic/services — `.ts`, tests — `.test.tsx` or `.test.ts`.

---

## TypeScript Usage Patterns

- **tsconfig** (`O:/AI/E-tic 2026/tsconfig.json`):
  - Target: `ES2022`
  - Module: `ESNext` with `bundler` resolution
  - JSX: `react-jsx`
  - `strict: true` is **not** set (no strict null checks, no strict function types, etc.)
  - `skipLibCheck: true`, `isolatedModules: true`
  - `noEmit: true`
  - Path alias: `@/*` mapped to `./src/*`
- **Type vs Interface:** The codebase consistently uses `interface` for object shapes and props, and `type` for unions, aliases, and complex types. Examples:
  - `interface Props { ... }` or `interface ComponentNameProps { ... }` for component props
  - `type UserRole = 'buyer' | 'seller' | 'admin' | 'moderator'` for string unions
  - `export type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected'`
- **`import type`** is used for type-only imports (e.g., `import type { ProductCertificate } from '@/services/blockchainService'` in `AuthenticityBadge.tsx`).
- **Type exports:** Core domain types live in `src/types.ts`. Domain-specific types in `src/types/` (e.g., `src/types/order.ts`).

---

## Component Patterns

- **Functional components only.** Every component is a function, no class components.
- **Named exports (preferred):** `export function ComponentName({ prop1, prop2 }: Props)`. This is the dominant pattern.
- **Default exports (rare):** A few exceptions exist (`SellerLayout`, `SellerAnalytics`). These are the minority.
- **Props typing:** A local `interface Props` (or `interface ComponentNameProps`) declared immediately above the component, destructured in the function signature.
- **File-per-component:** Each component gets its own `.tsx` file. No barrel exports from `index.ts` — components are imported by full path.
- **Composition:** Components import sub-components by `@/components/*` alias paths.

---

## Naming Conventions

| Category | Convention | Example |
|---|---|---|
| Components | PascalCase, noun phrase | `ProductCard`, `ComparisonModal` |
| Hooks | camelCase, `use` prefix | `useComparison`, `useExchangeRate` |
| Services | camelCase, function-based | `addReview`, `getProductCertificate` |
| Variables | camelCase | `items`, `viewerRef` |
| Files | PascalCase for components | `ProductRecommendations.tsx` |
| Files | camelCase for services/hooks | `productService.ts`, `useComparison.ts` |
| Types/Interfaces | PascalCase | `UserProfile`, `ProductVariant` |
| Props interface | `Props` or `ComponentNameProps` | `Props` (local), `ComparisonModalProps` |

---

## Error Handling Patterns

- **Service layer:** Every Firestore service function wraps logic in `try/catch`, calls `handleFirestoreError(error, OperationType, context)`, then **re-throws** or returns a fallback value:
  ```ts
  try { /* firestore op */ }
  catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'categories');
    throw error;  // or return [] / null for read operations
  }
  ```
- **Graceful degradation in reads:** `getCategories`, `getReviewsByProduct` return empty arrays (`[]`) or fallback data on error instead of throwing.
- **Server (Express):** Routes use `try/catch` with `res.status(400|500).json({ error: error.message })`.
- **Stripe webhooks:** Pattern of `try/catch` with `console.error` logging and `res.status(400).json({ error })`.
- **No React Error Boundaries** found in the codebase (Sentry integration exists in `src/lib/sentry.ts` for crash reporting).
- **Optional chaining** (`?.`) and nullish coalescing (`??`) are used throughout for safe property access.

---

## Import Organization

Import groups appear in this loose order (not enforced by tooling):

1. **React / React DOM** (or hooks from React)
2. **Third-party UI libraries** (lucide-react, motion, react-router-dom, @google/model-viewer)
3. **Project-internal modules** (sorted by `@/` alias):
   - `@/components/*`
   - `@/context/*`
   - `@/hooks/*`
   - `@/services/*`
   - `@/lib/*`
   - `@/types` or `@/types/*`
4. **CSS** (typically `'./index.css'` in `main.tsx`)

Relative imports (`../`) are used for sibling files within the same directory. Absolute `@/` imports are used for cross-module references.

There is no blank-line separation between groups enforced — imports are often clustered by proximity.

---

## React Patterns

- **Custom hooks:** Named with `use` prefix, placed in `src/hooks/`. Examples:
  - `useComparison()` — module-level shared state (pub/sub pattern without Context)
  - `useExchangeRate(pair)` — fetches exchange rates with mock fallback
- **Context providers:** Defined in `src/context/`, following the pattern:
  1. Create context: `const XxxContext = createContext<Type | undefined>(undefined)`
  2. Provider component: `export function XxxProvider({ children }: { children: ReactNode })`
  3. Consumer hook: `export function useXxx() { const ctx = useContext(XxxContext); if (!ctx) throw Error(...); return ctx; }`
  - Contexts used: `LanguageProvider`, `ThemeProvider`, `AuthProvider`, `CartProvider`, `LocationProvider`, `WishlistProvider`, `FollowsProvider`, `NotificationProvider`.
- **Module-level state:** `useComparison` uses module-level variables + listener set + `forceUpdate` pattern instead of Context, enabling cross-hook state sharing without nesting providers.
- **Animations:** `motion` (framer-motion v12 via `motion/react`) for transitions, `AnimatePresence` for mount/unmount animations.
- **Icons:** `lucide-react` for iconography.
- **Routing:** `react-router-dom` v7 (`BrowserRouter`, `Routes`, `Route`).
- **Helmet:** `react-helmet-async` for SEO meta tags.
- **PWA:** `vite-plugin-pwa` with Workbox for service worker and offline support.

---

## API Call Patterns

- **Firebase Firestore (primary):** Direct Firestore SDK calls (`collection`, `addDoc`, `getDocs`, `doc`, `updateDoc`, `deleteDoc`, `query`, `where`, `orderBy`, `limit`, `serverTimestamp`, `runTransaction`) wrapped in service modules under `src/services/`. Examples: `productService.ts`, `reviewService.ts`, `orderService.ts`.
- **REST API (secondary):** Some services use `fetch()` for backend API calls:
  - `src/services/oneClickCheckoutService.ts` — calls `/api/create-setup-intent`, `/api/setup-payment-method`, `/api/one-click-checkout`
  - Pattern: `const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(data) })`
- **Server routes:** Express-based API in `server/`, e.g., `server/routes/stripe.ts`. Follows route registration pattern with dependency injection (deps object with `stripe`, `adminDb`, `verifyFirebaseToken`).
- **Realtime subscriptions:** Firestore `onSnapshot` used for live data (e.g., `subscribeToProductReviews` in `reviewService.ts`).

---

## State Management Conventions

- **React Context API** is the primary state management approach. No Redux, Zustand, or Jotai.
- **Auth state:** Firebase Auth via `AuthContext`.
- **Cart state:** `CartContext` with `addItem`, `removeItem` methods.
- **i18n:** `LanguageContext` holds language selection and translation key-value pairs.
- **Theme:** `ThemeContext` for dark/light mode.
- **Module-level singleton state:** `useComparison` hook manages shared state at the module level (not in Context) using a listener-notify pattern.
- **Server-side state:** Firebase Firestore is the source of truth for orders, products, reviews, categories, etc. — fetched on demand or subscribed to.

---

## File Structure

```
src/
  App.tsx               — Root component, routing, context providers
  main.tsx              — Entry point, Sentry + Analytics init
  components/
    commerce/           — Product cards, recommendations, comparison, etc.
    common/             — Breadcrumb, OptimizedImage, SEO, CookieConsent, etc.
    layout/             — Navbar, Footer, SellerLayout
    ui/                 — Skeleton loaders, base UI primitives
    ai/                 — ShoppingAssistant
    chat/               — LiveChatWidget
    checkout/           — Payment components
  context/              — React Context providers
  hooks/                — Custom hooks
  lib/                  — Firebase init, sentry, analytics, utils, validators
  pages/                — Page-level components (Home, ProductDetail, Cart, etc.)
  services/             — Firebase data access layer (40+ service modules)
  test/                 — Test setup + miscellaneous tests
  types/                — Additional type definitions (order.ts, etc.)
  types.ts              — Core domain type definitions
```
