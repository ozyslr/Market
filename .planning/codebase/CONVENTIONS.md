# Coding Conventions

**Analysis Date:** 2026-06-08

## Naming Patterns

**Files:**

- Components: PascalCase `.tsx` — `ProductCard.tsx`, `ComparisonModal.tsx`, `Breadcrumb.tsx`
- Services: camelCase `.ts` — `productService.ts`, `orderService.ts`, `couponService.ts`
- Hooks: camelCase `.ts` — `useComparison.ts`, `useExchangeRate.ts`, `useOneClickCheckout.ts`
- Types: camelCase `.ts` — `src/types.ts` (root), `src/types/order.ts` (domain-specific)
- Tests: Co-located in `__tests__/` subdirectory or `src/test/` for integration-style

**Functions:**

- Components: PascalCase — `export function Breadcrumb(...)`, `export function ProductCard(...)`
- Hooks: camelCase with `use` prefix — `useComparison`, `useExchangeRate`
- Service functions: camelCase, verb-first — `getCart`, `saveCart`, `clearCart`, `createCoupon`, `validateCoupon`
- Internal helpers: camelCase, plain verbs — `generateSlug`, `applyClientFilters`, `ensureProductHasSlug`

**Variables:**

- camelCase throughout — `cartItems`, `sellerId`, `firebaseUser`
- Boolean flags: adjective or `is`/`has` prefix — `isActive`, `hasDiscount`, `isTrending`

**Types/Interfaces:**

- PascalCase — `UserProfile`, `ProductVariant`, `CartItem`, `OrderSet`
- Props: `Props` (local, preferred) or `ComponentNameProps`
- Context type suffix: `XxxContextType` — `AuthContextType`, e.g. in `src/context/AuthContext.tsx`
- Server-side enum: `OperationType` in `src/lib/firebase.ts`

## Code Style

**Formatting (Prettier — `.prettierrc.json`):**

- Semicolons: always
- Quotes: single quotes
- Trailing commas: `all`
- Print width: 100 characters
- Tab width: 2 spaces
- Arrow parens: always — `(x) => x`
- Bracket spacing: enabled
- End of line: `lf`

**Linting (ESLint 10 — `eslint.config.js`):**

- TypeScript ESLint recommended rules applied
- React hooks exhaustive-deps: `warn` (not error)
- `@typescript-eslint/no-unused-vars`: `off` (codebase debt acknowledged)
- `@typescript-eslint/no-explicit-any`: `off` (used freely in tests and wrappers)
- `react-hooks/rules-of-hooks`: `warn`
- Firebase security rules plugin: `@firebase/eslint-plugin-security-rules` (flat/recommended)
- Run linting: `npm run lint` — runs `eslint src/ server/ && tsc --noEmit`

## Import Organization

**Order (observed pattern):**

1. External library imports — `import React from 'react'`, `import { collection } from 'firebase/firestore'`
2. Internal lib/config imports — `import { db, handleFirestoreError, OperationType } from '../lib/firebase'`
3. Type imports — `import { Product, Category } from '../types'`
4. Relative service/component imports — `import { recordPrice } from './priceHistoryService'`

**Path Aliases:**

- `@/` maps to `./src` — defined in `vite.config.ts` and `vitest.config.ts`
- Example: `import { cn } from '@/lib/utils'`, `import type { Coupon } from '@/types'`
- Use `@/` for cross-tree imports; relative paths for same-directory or parent imports

**Type-only imports:**

- Use `import type` for type-only imports: `import type { ProductCertificate } from '@/services/blockchainService'`
- Test files freely mix `import type` with value imports

## Error Handling

**Service layer (Firestore):**

- Wrap all Firestore calls in `try/catch`
- On error: call `handleFirestoreError(error, OperationType.GET|WRITE|etc, 'collection/docId')` — defined in `src/lib/firebase.ts`
- After calling `handleFirestoreError`, the function **throws** (for write operations) or returns a graceful fallback (for reads)
- Read fallbacks: return `[]` or `null` — never throw from `getXxx` functions
- Write operations: re-throw after `handleFirestoreError`

```typescript
// Read: graceful fallback
export async function getCart(userId: string): Promise<CartItem[]> {
  try {
    const snap = await getDoc(doc(db, 'carts', userId));
    if (!snap.exists()) return [];
    return snap.data().items ?? [];
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `carts/${userId}`);
    return [];
  }
}

// Write: re-throw
export async function createCoupon(data: Omit<Coupon, 'id'>): Promise<Coupon> {
  try {
    // ...
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'coupons');
    throw error;
  }
}
```

**Server (Express routes):**

- `try/catch` blocks with `res.status(400|500).json({ error: error.message })`
- Stripe webhooks: `try/catch` with `console.error` logging then `res.status(400).json({ error })`

**React components:**

- No React Error Boundaries in codebase (Sentry via `src/lib/sentry.ts` handles crash reporting)
- Optional chaining `?.` and nullish coalescing `??` used throughout for safe property access

## Logging

**Framework:** `pino` (server-side) + `console` (client-side)

**Patterns:**

- Service errors: `console.error('[serviceName] error description:', error)` — e.g. `[orderService] subscribeOrdersBySeller error:`
- Service warnings: `console.warn('[productService] Some filters could not be pushed to Firestore...')`
- Firebase connection: `console.log('Firebase connection established.')` in `src/lib/firebase.ts`
- No structured logging from React components; rely on Sentry for error capture

## Comments

**When to Comment:**

- JSDoc `/** ... */` blocks on exported service functions explaining intent — e.g. `productService.ts` documents Firestore vs client-side filter split
- Inline section dividers using `// ── Section Name ──────` (em-dash style) in test files
- `// NOTE:` prefix for known limitations and deferred work — e.g. composite index warnings
- Block comments for non-obvious query constraints and their tradeoffs

**JSDoc/TSDoc:**

- Used selectively on exported service functions, not on every function
- Focus on "why" (Firestore constraints, tradeoffs) rather than "what"

## Function Design

**Size:** Service functions are typically 20–50 lines. No strict limit enforced.

**Parameters:** Options objects with optional fields preferred for multi-param functions — e.g. `GetProductsOptions` interface in `src/services/productService.ts`.

**Return Values:**

- Async service functions: `Promise<T>` for writes, `Promise<T | T[]>` for reads
- Boolean predicates: return `boolean` directly — `isFiniteNumber`, `isNonEmptyString`
- Unsubscribe pattern: real-time subscriptions return `() => void` — e.g. `subscribeOrdersBySeller`

## Module Design

**Exports:**

- Named exports dominant: `export function`, `export interface`, `export type`
- Default exports rare and discouraged — only present in `SellerLayout`, `SellerAnalytics`
- No barrel `index.ts` files — import components and services by full path

**Component props:**

- Local `interface Props` declared immediately above the component
- Destructured in the function signature: `export function Breadcrumb({ items, className, light = false }: Props)`

## TypeScript Patterns

**Strict mode:** Enabled in `tsconfig.json`

**Interface vs Type:**

- `interface` for object shapes and props
- `type` for unions, aliases, and complex/computed types

**Enums:**

- `enum OperationType` in `src/lib/firebase.ts` — used throughout all service files

**`any` usage:**

- `any` is used in test mocks, Express request type augmentation, and Firebase wrapper parameters
- ESLint `no-explicit-any` is turned off — not enforced

**Module system:** ESM (`"type": "module"` in `package.json`); CJS wrapper only for iyzico via `server/iyzico.cjs`

## State Management Patterns

**React Context API — standard pattern (`src/context/`):**

```typescript
// 1. Type the context
interface AuthContextType {
  user: UserProfile | null;
  loading: boolean; /* ... */
}

// 2. Create context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Provider component with named export
export function AuthProvider({ children }: { children: React.ReactNode }) {
  /* ... */
}

// 4. Custom hook that throws if used outside provider
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
```

**Module-level singleton state (alternative to Context):**

- Used in `src/hooks/useComparison.ts` for comparison feature
- Module-level `let items` + `Set<() => void>` listener pattern
- `forceUpdate` via `useState(0)` counter to trigger re-renders
- Appropriate for cross-component state that doesn't need React tree lifecycle

---

_Convention analysis: 2026-06-08_
