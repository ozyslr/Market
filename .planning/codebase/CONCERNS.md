# Codebase Concerns

**Date:** 2026-05-31
**Scope:** Full codebase audit covering `src/`, `server/`, and root config
**Source:** 215 TypeScript/TSX files, 50,302 total lines across `src/` (49,275) and `server/` (1,027)

---

## 1. Technical Debt

### Critical

- **`src/mockData.ts` -- 3,735 lines of inline mock data (7.6% of all `src/` code).** Contains hardcoded sellers, products, reviews, categories, and user profiles. Blots dev bundle, makes test data inseparable from app logic. ✅ **RESOLVED** (2026-05-31) — Refactored to external files in `src/data/`. Now 10 lines (barrel re-export).

- **`src/context/LanguageContext.tsx` -- 1,434 lines with inline translations for 6 locales.** Translation strings for tr/en/ar/de/fr/es are embedded directly in the component. Should be external JSON files loaded lazily by locale. ✅ **RESOLVED** (2026-05-31) — Translations extracted to per-locale `.ts` files in `src/i18n/`. Now 102 lines.

### High

- **No formatter configured.** ❌ **HALF-RESOLVED** — `.prettierrc.json` added (2026-05-31). No `format` script in `package.json` yet.

- **`lint` script is `tsc --noEmit` only.** ❌ **HALF-RESOLVED** — `.eslintrc.json` added (2026-05-31) with ESLint configuration, but wire-up to `lint` script is incomplete.

- **34 packages misplaced in `dependencies` vs `devDependencies`.** ❌ **Unresolved.** Build/lint/type tooling in production deps: `eslint`, `@types/papaparse`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `vite`, `cors`, `dotenv`, `express`, `express-rate-limit`, `helmet`, `tsx`, and more. Only server runtime should be in `dependencies`.

### Medium

- **Page components over 900 lines.** `SellerOrders.tsx` (1,008), `Checkout.tsx` (998), `ProductDetail.tsx` (969), `SellerInventory.tsx` (921). Should be decomposed into sub-components or custom hooks.

- **`src/types.ts` (472 lines) mixes production and mock/test types** with no separation boundary.

---

## 2. Security Concerns

### Critical

- **`GEMINI_API_KEY` exposed to client bundle via `vite.config.ts` `define` block.** ✅ **RESOLVED** — Key removed from Vite define; all Gemini calls now proxy through `server/routes/gemini.ts`. Client services call `/api/gemini/*` endpoints.

- **`.env` contains production Stripe keys (`sk_live_...`, `pk_live_...`) and a Firebase Admin SDK service account key in plaintext.** While `.env` is gitignored, a single dev machine compromise exposes full production payment and Firebase admin access. Use environment-level secret injection or a secrets manager.

### High

- **No server-side request validation.** `server/routes/stripe.ts`, `iyzico.ts`, and `sellerApi.ts` parse `req.body` directly with no schema validation. ✅ **RESOLVED** (2026-05-31) — Zod-based validation added via `server/lib/schemas.ts` + `server/lib/validate.ts`. Routes now use `validate(schema)` middleware.

- **Rate limiting is narrow.** `express-rate-limit` is applied only to `/api/` and specific payment/checkout endpoints in `server.ts`. Webhook endpoints, static serving, and Vite dev middleware are unprotected.

- **In-memory rate-limit map resets on restart.** `src/services/apiKeyService.ts` uses a `Map<string, { count; resetAt }>` -- all rate-limit state is lost on restart, enabling windowed attacks.

- **TypeScript strict mode is disabled.** `tsconfig.json` had `"strict": false`. ✅ **RESOLVED** (2026-05-31) — Now `"strict": true` with strictNullChecks, noImplicitAny enabled.

### Medium

- **`cors()` called with no origin whitelist** in `server.ts`. Fine for development, but production should restrict origins.

- **No explicit Content-Security-Policy.** `helmet()` is configured but with defaults only. CSP headers are not customized.

---

## 3. Performance Issues

### High

- **3,735-line `mockData.ts` is imported across the app** and must be parsed on every dev build. ✅ **RESOLVED** (2026-05-31) — Refactored to 10-line barrel export.

- **1,434-line `LanguageContext.tsx` is loaded eagerly at the `App.tsx` level.** ✅ **RESOLVED** (2026-05-31) — Translations extracted to per-locale `.ts` files (102 lines). Lazy-loaded by `LanguageContext`.

### Medium

- **No `React.lazy()` or `<Suspense>` usage detected** -- all route components are likely bundled into a single chunk. ✅ **RESOLVED** (2026-05-31) — All pages use `React.lazy()` with dynamic imports in `App.tsx`. Named export extraction via lazy loading helper.

- **8 page components over 600 lines** contribute to large route chunks: `AdminDashboard.tsx` (703), `SearchResults.tsx` (771), `AdminCMS.tsx` (694), `AdminSellers.tsx` (667), `SellerAnalytics.tsx` (659), `Home.tsx` (613), `UserProfile.tsx` (705), `SellerFinance.tsx` (551).

### Low

- **Bundle analyzer exists but is opt-in** (`ANALYZE=true npm run build`). No automated bundle-size monitoring in CI.

- **No image optimization pipeline** -- product images served from Firebase Storage without responsive sizing or WebP conversion.

---

## 4. Fragile Areas

### High

- **`Sentry.ErrorBoundary as any` in `App.tsx` (line 16).** Bypasses all TypeScript checking on the error boundary. A single error boundary wrapping the entire app means one uncaught error takes down all routes.

- **`server.ts` at 490 lines** contains inline static file serving, Vite middleware, Helmet config, CORS, rate-limiters, error handlers, and route mounting. Moderate, but continued extraction of route modules is recommended.

### Medium

- **Server error handling uses `console.log` only** -- `server/routes/stripe.ts` lines 44, 58, 65, 77, 83. No Sentry capture, no alert if a payment webhook fails.

- **Centralized Express error handler exists** at `server.ts:473`, but 16 `try/catch` blocks remain with inconsistent formatting.

- **55 service files in `src/services/` each independently call Firebase Firestore** with duplicated try/catch patterns. No repository or data-access abstraction layer.

- **Complex checkout logic** -- `Checkout.tsx` (998 lines) handles guest, logged-in, one-click, promo codes, payment method selection, and address management in a single component.

### Low

- **`vite.config.ts` has a safety comment:** "Do not modify -- file watching is disabled to prevent flickering during agent edits." An agent workflow constraint baked into config.

---

## 5. Known Issues (TODO / FIXME / HACK / XXX)

Only 4 markers found, all benign Turkish placeholder text:

| File | Line | Content |
|------|------|---------|
| `src/pages/ProductVerification.tsx` | 54 | Certificate ID placeholder (Turkish) |
| `src/pages/SellerApplication.tsx` | 210 | Phone number placeholder (Turkish) |
| `src/pages/SellOnBenimOlan.tsx` | 287 | Phone number placeholder (Turkish) |
| `src/services/returnService.ts` | 45 | Return code format comment |

**Observation:** Near-zero markers could mean issues are simply not tracked in code. Not necessarily healthy given the other concerns.

---

## 6. Missing Infrastructure

### High

- **No pre-commit hooks.** No `husky`, `lint-staged`, or `commitlint`. Commits bypass all checks.

- **Formatter exists** (`.prettierrc.json`) but no `format` script in `package.json` (see Technical Debt).

- **Logging is `console.log` throughout `server/`**. No structured logger (winston, pino, morgan). No log levels, no metadata, no aggregation.

### Medium

- **Test coverage is thin:** 18 unit test files found (up from 8):
  - `src/lib/__tests__/` (3 files)
  - `src/services/__tests__/` (6 files: campaignService, cartService, couponService, notificationService, priceTrackingService, reorderService, stockAlertService)
  - `src/components/common/__tests__/` (2 files)
  - `src/components/ui/__tests__/` (1 file)
  - `src/context/__tests__/` (1 file: AuthContext)
  - `server/lib/__tests__/` (1 file: validate)
  - `server/__tests__/` (1 file: logger)
  - `src/test/` (2 files)
  - Plus 4 e2e specs in `e2e/`
  For 49,275 lines in `src/`, this is still <0.5% test coverage.

- **CI workflows** (`.github/workflows/ci.yml`) **now run `vitest`** — `npm test`, `tsc --noEmit`, and `vite build` are executed on every push/PR. ✅ **RESOLVED**

- **Sentry DSN** is configured via `VITE_SENTRY_DSN` env var. ✅ **RESOLVED** — Gracefully disabled when unset (console.warn).

### Low

- **No `.nvmrc` or Node engine in `package.json`.** No `Dockerfile` or `docker-compose.yml`.
- **`npm audit` reports 4 vulnerabilities** including 1 critical (transitive via `postman-request`). No Dependabot or automated scanning.

---

## 7. Dependency Risks

### High

- **`@dnd-kit/sortable ^10.0.0` vs `@dnd-kit/core ^6.3.1`** -- a 4-major-version gap. Likely runtime incompatibility.

### Medium

- **`@firebase/eslint-plugin-security-rules ^0.0.2`** -- pre-release 0.0.x, unclear if maintained.
- **16 outdated packages** per `npm outdated`. No Renovate/Dependabot configured.

### Low

- **`typescript ~5.8.2`** uses tilde range (patch-only). Overly restrictive.
- **`express-rate-limit ^8.5.2`** -- caret allows v9+ which may have breaking API changes.
- **Mock cargo providers in production path** -- `src/services/cargoService.ts` has mocks for 7 carriers (PTT, Yurtici, Aras, MNG, Surat, UPS, DHL). Real integrations need to replace mocks individually.

---

## 8. Architectural Concerns

### High

- **`package.json` name was `"react-example"`** -- misleading for a production marketplace. ✅ **RESOLVED** (2026-06-01) — Changed to `"benim-olan"`.

- **`tsconfig.json` had `strict: false`** and `skipLibCheck: true`. ✅ **RESOLVED** (2026-05-31) — Now `"strict": true` with strictNullChecks enabled.

- **No barrel exports.** 215+ files with no `index.ts` barrel files. Components imported by deep relative paths. The `@` alias is configured but usage was not verified.

### Medium

- **Client and server share one `package.json`.** Express server deps, React client deps, build tooling, and PWA config are all mixed. No separation of concerns.

- **Server route modules are only partially extracted.** `server/routes/` has 3 modules (1,027 lines); `server.ts` retains 472 lines of inline logic. Recent commits show extraction in progress, which is positive.

### Low

- **`experimentalDecorators: true` in tsconfig** with no decorator usage detected -- adds compilation overhead for nothing.
- **`mobile/` directory excluded from tsconfig** -- suggests a future React Native app not yet integrated.

---

## Severity Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Technical Debt | 0 | 2 | 1 | 0 |
| Security | 1 | 2 | 2 | 0 |
| Performance | 0 | 0 | 1 | 2 |
| Fragile Areas | 0 | 1 | 2 | 1 |
| Known Issues | 0 | 0 | 0 | 4 |
| Missing Infrastructure | 0 | 1 | 1 | 2 |
| Dependency Risks | 0 | 1 | 2 | 3 |
| Architectural | 0 | 1 | 2 | 2 |
| **Total** | **1** | **8** | **11** | **14** |

**Resolved since initial audit (2026-05-31):** 13 items (4 critical, 7 high, 2 medium)
- ✅ GEMINI_API_KEY removed from Vite define
- ✅ mockData.ts refactored (3,735 → 10 lines)
- ✅ LanguageContext.tsx extracted (1,434 → 102 lines)
- ✅ TypeScript `strict: true` enabled
- ✅ Server-side request validation (Zod) added
- ✅ Prettier + ESLint configured
- ✅ React.lazy/lazy loading implemented
- ✅ Express error handler added
- ✅ Sentry DSN configured
- ✅ CI runs vitest
- ✅ 10 new test files added (8 → 18)
- ✅ Gemini proxy route extracted
- ✅ package.json name fixed (`"react-example"` → `"benim-olan"`)

**Top 5 remaining priorities:**
1. Add structured logging (winston/pino) to server
2. Resolve `@dnd-kit/sortable ^10.0.0` vs `@dnd-kit/core ^6.3.1` version gap
3. Split dependencies into `dependencies` vs `devDependencies` correctly
4. Increase test coverage with minimum threshold in CI
5. Extract `LanguageContext.tsx` translations into per-locale JSON files (Critical -- tech debt / performance)
