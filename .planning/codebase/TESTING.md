# Testing

> Generated: 2026-05-31 | Source: codebase analysis

## Testing Framework

**Vitest** is the primary test runner, paired with **@testing-library/react** for component tests and **jsdom** as the DOM environment.

**Playwright** handles end-to-end (E2E) browser testing.

| Tool | Version | Purpose |
|------|---------|---------|
| vitest | ^3.1.1 | Unit + integration test runner |
| @testing-library/react | ^16.3.0 | React component rendering & queries |
| @testing-library/jest-dom | ^6.6.3 | DOM matchers (`toBeInTheDocument`, etc.) |
| jsdom | ^26.0.0 | Browser-like DOM environment for Node |
| @playwright/test | ^1.52.0 | E2E browser tests |
| @vitest/coverage-v8 | ^3.1.1 | Code coverage via V8 |

**Test scripts** (from `package.json`):
- `npm test` — `vitest run` (single run, no watch)
- `npm run test:watch` — `vitest` (watch mode)
- `npm run test:coverage` — `vitest run --coverage`
- `npm run test:e2e` — `playwright test`

## Test File Locations

**Convention: `__tests__/` directories**, co-located alongside source code.

```
src/lib/__tests__/
├── authMiddleware.test.ts
├── serverValidators.test.ts
└── utils.test.ts

src/components/common/__tests__/
├── Breadcrumb.test.tsx
└── OptimizedImage.test.tsx

src/components/ui/__tests__/
└── Skeleton.test.tsx

src/context/__tests__/
├── AuthContext.test.tsx
└── LanguageContext.test.tsx

server/lib/__tests__/
└── validate.test.ts

server/__tests__/
├── exchangeRate.test.ts
└── logger.test.ts

src/services/__tests__/
├── campaignService.test.ts
├── cartService.test.ts
├── couponService.test.ts
├── exchangeRate.test.ts
├── notificationService.test.ts
├── priceTrackingService.test.ts
├── reorderService.test.ts
└── stockAlertService.test.ts

e2e/__tests__/
├── homepage.spec.ts
├── mobile-menu.spec.ts
├── product-page.spec.ts
└── pwa.spec.ts
```

**9 `__tests__/` directories** across the codebase.

Additional test utilities live in:
- `src/test/setup.ts` — global test setup (jsdom, mocks, cleanup)
- `src/test/utils.tsx` — shared test utilities and wrappers

## Test Naming Patterns

- **Files:** `*.test.ts` or `*.test.tsx` — suffixed with `.test`
- **E2E files:** `*.spec.ts` — suffixed with `.spec`
- **Describe blocks:** Feature/function name, e.g. `describe('authMiddleware', ...)`
- **It blocks:** Behavior description, e.g. `it('returns 401 when no token provided', ...)`
- **Test utils:** `describe` + `it` + `expect` pattern consistently used

## Test Structure

Tests follow the standard AAA (Arrange-Act-Assert) pattern:

```typescript
describe('authMiddleware', () => {
  it('returns 401 when no token provided', async () => {
    // Arrange
    const req = mockRequest({ headers: {} });
    // Act
    const result = await authMiddleware(req, mockResponse, next);
    // Assert
    expect(result.status).toBe(401);
  });
});
```

- `beforeEach`/`afterEach` used for setup and cleanup (especially `vi.clearAllMocks()`)
- Tests are co-located with source, keeping related code together

## Mocking Approach

**`vi.fn()` and `vi.stubGlobal()`** are the primary mocking patterns (no MSW).

| Pattern | Usage |
|---------|-------|
| `vi.fn()` | Mock individual functions passed as props or dependencies |
| `vi.stubGlobal('fetch', ...)` | Mock global `fetch` for API-calling services |
| Inline factory functions | Create mock objects (e.g., mock product, mock user) |
| `vi.mock()` | Module-level mocking for imports |

No MSW (Mock Service Worker) is used — API calls are mocked at the function or global fetch level rather than at the network boundary.

## E2E Testing

**Playwright** configured at `playwright.config.ts`. Tests live in `e2e/__tests__/`.

**4 E2E spec files with 12 tests:**
| Spec | Tests | Coverage |
|------|-------|----------|
| `homepage.spec.ts` | ~3 | Homepage loads, navigation, basic rendering |
| `mobile-menu.spec.ts` | ~3 | Mobile menu open/close, RTL behavior |
| `product-page.spec.ts` | ~3 | Product detail page, interactions |
| `pwa.spec.ts` | ~3 | PWA manifest, service worker |

E2E test browser configuration supports multiple viewports and RTL testing (Arabic locale).

## CI Integration

**GitHub Actions** (`.github/workflows/`):
- **Type-check + build** run on every push/PR — `npm test` (vitest), `tsc --noEmit`, and `vite build`
- **Unit tests (vitest) run in CI** on every push/PR
- **E2E tests** scheduled on weekdays (not per-commit), using Playwright

## Coverage Configuration

V8 coverage provider configured in `vitest.config.ts`:
- **Provider:** v8 (native Node.js coverage)
- **Include:** `src/**/*.{ts,tsx}`
- **Reports:** text summary in terminal

No minimum coverage threshold is configured. Coverage is opt-in via `npm run test:coverage`.

## What's Tested

| Area | Tested | Files |
|------|--------|-------|
| Auth middleware | Yes | `src/lib/__tests__/authMiddleware.test.ts` |
| Server validators | Yes | `src/lib/__tests__/serverValidators.test.ts` |
| Utils | Yes | `src/lib/__tests__/utils.test.ts` |
| Breadcrumb | Yes | `src/components/common/__tests__/Breadcrumb.test.tsx` |
| OptimizedImage | Yes | `src/components/common/__tests__/OptimizedImage.test.tsx` |
| Skeleton | Yes | `src/components/ui/__tests__/Skeleton.test.tsx` |
| AuthContext | Yes | `src/context/__tests__/AuthContext.test.tsx` |
| Language context | Yes | `src/context/__tests__/LanguageContext.test.tsx` |
| Validate middleware | Yes | `server/lib/__tests__/validate.test.ts` |
| Server logger | Yes | `server/__tests__/logger.test.ts` |
| Exchange rate (server) | Yes | `server/__tests__/exchangeRate.test.ts` |
| Cart service | Yes | `src/services/__tests__/cartService.test.ts` |
| Campaign service | Yes | `src/services/__tests__/campaignService.test.ts` |
| Coupon service | Yes | `src/services/__tests__/couponService.test.ts` |
| Notification service | Yes | `src/services/__tests__/notificationService.test.ts` |
| Price tracking service | Yes | `src/services/__tests__/priceTrackingService.test.ts` |
| Reorder service | Yes | `src/services/__tests__/reorderService.test.ts` |
| Stock alert service | Yes | `src/services/__tests__/stockAlertService.test.ts` |
| Exchange rate (service) | Yes | `src/services/__tests__/exchangeRate.test.ts` |
| One-click checkout | Yes | `src/test/oneClickCheckoutService.test.ts` |
| Type definitions | Yes | `src/test/types.test.ts` |
| E2E critical flows | Yes | 4 specs in `e2e/__tests__/` |

**18 unit test files** across the full codebase.

## What's NOT Tested

| Area | Gap |
|------|-----|
| **~40 services untested** | `productService`, `orderService`, `reviewService`, `searchService`, `paymentService`, `returnService`, `adService`, and ~33 more — zero tests. 8 services newly tested |
| **All pages** | 65+ page components (`src/pages/`) — zero component tests |
| **Most context providers** | 6 of 8 contexts untested (AuthContext + LanguageContext tested) |
| **Custom hooks** | No dedicated hook tests |
| **Payment flows** | Stripe and Iyzico routes have no tests |
| **Firestore integration** | No integration tests for database operations |
| **Server routes** | Only logger and validate tested; stripe, iyzico, seller API routes untested |
| **Admin pages** | All admin pages — untested |

## Summary

- **Test count:** 18 unit test files + 4 E2E specs = ~40 total test cases
- **Test-to-source ratio:** Low — testing covers ~5% of source files
- **CI:** Unit tests (vitest) run on every push/PR via `npm test` ⚠️ Coverage not enforced
- **Coverage:** No minimum threshold, opt-in only
