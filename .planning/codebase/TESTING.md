# Testing Patterns

**Analysis Date:** 2026-06-08

## Test Framework

**Runner:**

- Vitest 4.1.7
- Config: `vitest.config.ts` at project root
- JSdom environment (simulates browser DOM)
- Setup file: `src/test/setup.ts` (imports `@testing-library/jest-dom`)

**Assertion Library:**

- Vitest built-in `expect` + `@testing-library/jest-dom` matchers

**Run Commands:**

```bash
npm run test              # Run all tests once (vitest run)
npm run test:watch        # Interactive watch mode (vitest)
npm run test:coverage     # Coverage report (vitest run --coverage)
npm run test:e2e          # Playwright E2E tests
npm run test:e2e:ui       # Playwright with interactive UI
```

## Test File Organization

**Location:**

- Services: `src/services/__tests__/serviceName.test.ts` — co-located in `__tests__/` subdirectory
- Components: `src/components/domain/__tests__/ComponentName.test.tsx`
- Context: `src/context/__tests__/ContextName.test.tsx`
- Lib utilities: `src/lib/__tests__/utilName.test.ts`
- Integration/service tests: `src/test/serviceName.test.ts`
- E2E tests: `e2e/*.spec.ts`

**Naming:**

- Unit/component/service: `*.test.ts` or `*.test.tsx`
- E2E: `*.spec.ts`

**Structure:**

```
src/
├── components/
│   ├── common/__tests__/Breadcrumb.test.tsx
│   └── ui/__tests__/Skeleton.test.tsx
├── context/__tests__/AuthContext.test.tsx
├── lib/__tests__/
│   ├── utils.test.ts
│   ├── authMiddleware.test.ts
│   └── serverValidators.test.ts
├── services/__tests__/
│   ├── cartService.test.ts
│   ├── couponService.test.ts
│   ├── campaignService.test.ts
│   ├── priceTrackingService.test.ts
│   ├── stockAlertService.test.ts
│   ├── reorderService.test.ts
│   └── notificationService.test.ts
└── test/
    ├── setup.ts
    ├── oneClickCheckoutService.test.ts
    └── types.test.ts
e2e/
├── home.spec.ts
├── product.spec.ts
├── seo.spec.ts
├── checkout-guest.spec.ts
├── checkout-authenticated.spec.ts
├── checkout-address-book.spec.ts
└── rtl-mobile-menu.spec.ts
```

## Test Structure

**Suite Organization:**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// All vi.mock() calls hoisted — place at top of file
// Use vi.hoisted() for mock values referenced in vi.mock() factories

describe('functionName', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // or vi.resetAllMocks()
  });

  it('describes the expected behavior in plain English', async () => {
    // Arrange
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ items: [] }) });

    // Act
    const result = await getCart('user1');

    // Assert
    expect(result).toEqual([]);
  });
});
```

**Patterns:**

- `beforeEach(() => vi.clearAllMocks())` — standard reset between tests
- `vi.resetAllMocks()` used in some test files — clears all mock state including return values
- `afterEach(() => vi.unstubAllGlobals())` — used when `vi.stubGlobal` is called
- One `describe` block per exported function (not one per file)

## Mocking

**Framework:** Vitest `vi` mock utilities

**Critical rule — hoisting:**

```typescript
// REQUIRED: vi.mock() is hoisted to top of file by Vitest
// Mock values used inside vi.mock() factory MUST be declared with vi.hoisted():

const { mockGetDocs, mockSetDoc } = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockSetDoc: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  // ... other exports
}));
```

**Standard Firebase mock pattern (services):**

```typescript
vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  increment: vi.fn((n: number) => n),
}));

vi.mock('../../lib/firebase', () => ({
  db: {},
  handleFirestoreError: mockHandleFirestoreError,
  OperationType: {
    GET: 'GET',
    WRITE: 'WRITE',
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    LIST: 'list',
  },
  auth: { currentUser: null },
}));
```

**Mocking `fetch` (API service tests):**

```typescript
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// In test:
(global.fetch as any).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ clientSecret: 'seti_xxx' }),
});
```

**Mocking Firebase Auth (context tests):**

```typescript
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((_auth, cb) => {
    cb(null); // simulate no user
    return vi.fn(); // return unsubscribe fn
  }),
  signOut: vi.fn(),
  // ... other auth functions
}));
```

**What to Mock:**

- All Firebase SDK calls (`firebase/firestore`, `firebase/auth`, `../../lib/firebase`)
- `fetch` / `global.fetch` for REST API service functions
- Inter-service dependencies (e.g. `notificationService` when testing `priceTrackingService`)
- Firebase Admin SDK in server-side tests

**What NOT to Mock:**

- Pure utility functions under test (`cn`, `isFiniteNumber`, `itemsSignature`)
- The module under test itself
- React Testing Library's render utilities

## Fixtures and Factories

**Factory helper pattern (used in service tests):**

```typescript
// Declare at module level, above describe blocks
function makeCoupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    id: 'c1',
    code: 'SAVE10',
    discountType: 'percentage',
    discountValue: 10,
    usedCount: 0,
    isActive: true,
    createdAt: '2026-01-01',
    ...overrides,
  };
}

// Use in tests:
mockGetDocs.mockResolvedValue({
  empty: false,
  docs: [{ id: 'c1', data: () => makeCoupon({ expiresAt: '2027-12-31' }) }],
});
```

**Mock Firestore document shape:**

```typescript
// Snapshot doc pattern
{ id: 'docId', data: () => ({ /* fields */ }) }

// Snapshot collection pattern
{ empty: false, docs: [{ id: 'id', data: () => ({...}) }] }

// Non-existent document
{ exists: () => false }

// Existing document
{ exists: () => true, data: () => ({ items: [] }) }
```

**Location:**

- Inline factories in each test file — no shared fixture directory
- Mock Firebase user: `{ getIdToken: vi.fn().mockResolvedValue('mock-token'), uid: 'test-user-123' } as any`

## Coverage

**Requirements:**

- Vitest thresholds (intentionally low — codebase is still growing coverage):
  - Statements: 2%
  - Branches: 1%
  - Functions: 2%
  - Lines: 2%
- Provider: v8

**View Coverage:**

```bash
npm run test:coverage     # Generates text + json + html reports
# HTML report at: coverage/index.html
```

**Coverage scope:**

- Includes: `src/**/*.{ts,tsx}`, `server/**/*.ts`
- Excludes: `src/test/**`, `src/**/*.d.ts`, `server/declarations.d.ts`, `server/iyzico.cjs`

## Test Types

**Unit Tests (Vitest — `src/**/**tests**/`, `src/test/`):\*\*

- Scope: Individual service functions, utility functions, React components, context providers
- All Firebase/external dependencies mocked
- Fast, no network, no DOM for pure service tests
- DOM tests use jsdom environment via Testing Library

**Component Tests (Vitest + @testing-library/react):**

- `render()` + `screen.getBy*()` queries
- Wrapper helpers for router-dependent components: `renderWithRouter(ui)`
- Tests accessibility attributes (`aria-label`), DOM structure, class names
- Example: `src/components/common/__tests__/Breadcrumb.test.tsx`

**Type Tests (Vitest `expectTypeOf`):**

- `src/test/types.test.ts` — verifies TypeScript type shapes without runtime values
- Pattern: `expectTypeOf<UserProfile['field']>().toEqualTypeOf<string | undefined>()`

**Integration Tests (Vitest — `src/test/`):**

- Service-level tests that verify end-to-end behavior with mocked network/DB
- Example: `src/test/oneClickCheckoutService.test.ts` — verifies full request/response cycle

**E2E Tests (Playwright — `e2e/*.spec.ts`):**

- Framework: Playwright 1.60 — Chromium only (desktop Chrome)
- Base URL: `http://localhost:4173` (Vite preview) — set via `BASE_URL` env var
- Tests run against built app (`npm run build && npm run preview`)
- Coverage: home page, product listing, checkout (guest + authenticated + address book), SEO, RTL mobile menu

## Common Patterns

**Async Testing:**

```typescript
it('returns cart items when cart exists', async () => {
  mockGetDoc.mockResolvedValue({
    exists: () => true,
    data: () => ({ items }),
  });

  const result = await getCart('user1');
  expect(result).toEqual(items);
});
```

**Error path testing:**

```typescript
it('returns empty array and handles error on failure', async () => {
  const err = new Error('Firestore down');
  mockGetDoc.mockRejectedValue(err);

  const result = await getCart('user1');
  expect(result).toEqual([]);
  expect(mockHandleFirestoreError).toHaveBeenCalledWith(err, 'GET', 'carts/user1');
});
```

**Throw testing:**

```typescript
it('throws on Firestore error and calls handleFirestoreError', async () => {
  const err = new Error('Permission denied');
  mockSetDoc.mockRejectedValue(err);

  await expect(createCoupon(validData)).rejects.toThrow('Permission denied');
  expect(mockHandleFirestoreError).toHaveBeenCalledWith(err, 'create', 'coupons');
});
```

**React component testing with required providers:**

```typescript
function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

// For context-dependent components, wrap with the required provider
render(
  <AuthProvider>
    <TestConsumer />
  </AuthProvider>
);
```

**Testing that hooks throw outside provider:**

```typescript
it('throws when used outside AuthProvider', () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  function BadComponent() { useAuth(); return null; }
  expect(() => render(<BadComponent />)).toThrow('useAuth must be used within an AuthProvider');
  spy.mockRestore();
});
```

**E2E — data-testid usage:**

- Components expose `data-testid="product-card"` and `data-testid="add-to-cart"` for E2E targeting
- E2E tests use `page.locator('[data-testid="..."]')` for stable element selection

---

_Testing analysis: 2026-06-08_
