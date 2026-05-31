# Codebase Concerns

**Date:** 2026-05-31
**Scope:** Full codebase audit covering `src/`, `server/`, and root config
**Source:** 215 TypeScript/TSX files, 50,302 total lines across `src/` (49,275) and `server/` (1,027)

---

## 1. Technical Debt

### Critical

- **`src/mockData.ts` -- 3,735 lines of inline mock data (7.6% of all `src/` code).** Contains hardcoded sellers, products, reviews, categories, and user profiles. Blots dev bundle, makes test data inseparable from app logic. Replace with fixture JSON files or a factory pattern.

- **`src/context/LanguageContext.tsx` -- 1,434 lines with inline translations for 6 locales.** Translation strings for tr/en/ar/de/fr/es are embedded directly in the component. Should be external JSON files loaded lazily by locale. No `useMemo`/`useCallback` -- context value object is recreated on every render, forcing all consumers to re-render.

### High

- **No formatter configured.** No `.prettierrc`, `.editorconfig`, or `biome.json`. `package.json` has no `format` script. Style is enforced only by convention across 215+ files.

- **`lint` script is `tsc --noEmit` only.** `eslint ^10.4.0` is in `dependencies` but never wired in -- no `.eslintrc*` at project root. Type errors are caught, but no stylistic or logical lint rules are enforced.

- **34 packages misplaced in `dependencies` vs `devDependencies`.** Build/lint/type tooling in production deps: `eslint`, `@types/papaparse`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `vite`, `cors`, `dotenv`, `express`, `express-rate-limit`, `helmet`, `tsx`, and more. Only server runtime should be in `dependencies`.

### Medium

- **Page components over 900 lines.** `SellerOrders.tsx` (1,008), `Checkout.tsx` (998), `ProductDetail.tsx` (969), `SellerInventory.tsx` (921). Should be decomposed into sub-components or custom hooks.

- **`src/types.ts` (472 lines) mixes production and mock/test types** with no separation boundary.

---

## 2. Security Concerns

### Critical

- **`GEMINI_API_KEY` exposed to client bundle via `vite.config.ts` `define` block:**
  ```ts
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
  ```
  Vite's `define` performs string replacement at build time, baking the key into client-side JS. Anyone inspecting the built source can extract it. Route through the Express server instead.

- **`.env` contains production Stripe keys (`sk_live_...`, `pk_live_...`) and a Firebase Admin SDK service account key in plaintext.** While `.env` is gitignored, a single dev machine compromise exposes full production payment and Firebase admin access. Use environment-level secret injection or a secrets manager.

### High

- **No server-side request validation.** `server/routes/stripe.ts` (571 lines), `iyzico.ts` (221 lines), and `sellerApi.ts` (235 lines) parse `req.body` directly with no schema validation (no Zod, Joi, Yup).

- **Rate limiting is narrow.** `express-rate-limit` is applied only to `/api/` and specific payment/checkout endpoints in `server.ts` (lines 136-150). Webhook endpoints, static serving, and Vite dev middleware are unprotected.

- **In-memory rate-limit map resets on restart.** `src/services/apiKeyService.ts` (line 205) uses a `Map<string, { count; resetAt }>` -- all rate-limit state is lost on restart, enabling windowed attacks.

- **TypeScript strict mode is disabled.** `tsconfig.json` has `"strict": false`. No `strictNullChecks`, `noImplicitAny`, or `strictFunctionTypes`. 50+ `as any` assertions compile without error.

### Medium

- **`cors()` called with no origin whitelist** in `server.ts`. Fine for development, but production should restrict origins.

- **No explicit Content-Security-Policy.** `helmet()` is configured but with defaults only. CSP headers are not customized.

---

## 3. Performance Issues

### High

- **3,735-line `mockData.ts` is imported across the app** and must be parsed on every dev build.

- **1,434-line `LanguageContext.tsx` is loaded eagerly at the `App.tsx` level.** With 6 locales inline, most translation data is parsed but never used on any given page.

### Medium

- **No `React.lazy()` or `<Suspense>` usage detected** -- all route components are likely bundled into a single chunk.

- **8 page components over 600 lines** contribute to large route chunks: `AdminDashboard.tsx` (703), `SearchResults.tsx` (771), `AdminCMS.tsx` (694), `AdminSellers.tsx` (667), `SellerAnalytics.tsx` (659), `Home.tsx` (613), `UserProfile.tsx` (705), `SellerFinance.tsx` (551).

### Low

- **Bundle analyzer exists but is opt-in** (`ANALYZE=true npm run build`). No automated bundle-size monitoring in CI.

- **No image optimization pipeline** -- product images served from Firebase Storage without responsive sizing or WebP conversion.

---

## 4. Fragile Areas

### High

- **`Sentry.ErrorBoundary as any` in `App.tsx` (line 16).** Bypasses all TypeScript checking on the error boundary. A single error boundary wrapping the entire app means one uncaught error takes down all routes.

- **`server.ts` at 472 lines** contains inline static file serving, Vite middleware, Helmet config, CORS, 7 rate-limiters, error handlers, and route mounting. Recent refactoring (last 5 commits) extracted payment routes, but much remains.

### Medium

- **Server error handling uses `console.log` only** -- `server/routes/stripe.ts` lines 44, 58, 65, 77, 83. No Sentry capture, no alert if a payment webhook fails.

- **No centralized Express error-handling middleware.** 16 `try/catch` blocks in `server.ts` with 3 `res.status(500)` calls, each formatted differently. No `(err, req, res, next)` handler at the end of the chain.

- **40+ service files in `src/services/` each independently call Firebase Firestore** with duplicated try/catch patterns. No repository or data-access abstraction layer.

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

- **No formatter** (see Technical Debt).

- **Logging is `console.log` throughout `server/`** (1,027 total lines). No structured logger (winston, pino, morgan). No log levels, no metadata, no aggregation.

### Medium

- **Test coverage is extremely thin:** only 8 unit test files found:
  - `src/components/common/__tests__/Breadcrumb.test.tsx`
  - `src/components/common/__tests__/OptimizedImage.test.tsx`
  - `src/components/ui/__tests__/Skeleton.test.tsx`
  - `src/lib/__tests__/authMiddleware.test.ts`
  - `src/lib/__tests__/serverValidators.test.ts`
  - `src/lib/__tests__/utils.test.ts`
  - `src/test/oneClickCheckoutService.test.ts`
  - `src/test/types.test.ts`
  - Plus 4 e2e specs in `e2e/`
  For 49,275 lines in `src/`, this is <0.1% test coverage.

- **CI workflows exist** (`.github/workflows/ci.yml`, `deploy.yml`, `e2e.yml`) **but do not run `vitest`** -- only `tsc --noEmit` and `vite build`. Test regressions are only caught locally.

- **Sentry DSN is not configured** despite `@sentry/react` and `@sentry/vite-plugin` being installed. Errors are not reported to any monitoring service.

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

- **`package.json` name is `"react-example"`** -- misleading for a production marketplace. No monorepo tooling (pnpm workspaces, turborepo) despite separate client, server, admin concerns.

- **`tsconfig.json` has `strict: false`** and `skipLibCheck: true`. No strict null checks means `null`/`undefined` bugs are runtime discoveries.

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
| Technical Debt | 2 | 3 | 2 | 0 |
| Security | 2 | 4 | 2 | 0 |
| Performance | 0 | 2 | 2 | 2 |
| Fragile Areas | 0 | 2 | 3 | 1 |
| Known Issues | 0 | 0 | 0 | 4 |
| Missing Infrastructure | 0 | 3 | 3 | 2 |
| Dependency Risks | 0 | 1 | 2 | 3 |
| Architectural | 0 | 3 | 2 | 2 |
| **Total** | **4** | **18** | **16** | **14** |

**Top 5 priorities:**
1. Remove production secrets from `.env` (use secret injection) and remove `GEMINI_API_KEY` from Vite `define` (Critical -- security)
2. Enable TypeScript `strict: true` incrementally (High -- fragility)
3. Extract `mockData.ts` into external fixture files (Critical -- tech debt)
4. Extract `LanguageContext.tsx` translations into per-locale JSON files (Critical -- tech debt / performance)
5. Add structured logging and Sentry DSN to server (High -- missing infrastructure)
