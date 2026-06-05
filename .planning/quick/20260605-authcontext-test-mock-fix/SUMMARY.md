---
type: quick-summary
slug: authcontext-test-mock-fix
status: complete
completed: 2026-06-05
---

# Summary: AuthContext.test.tsx anonymous-auth mock fix

Added `signInAnonymously: vi.fn(() => Promise.reject(...))` to the `firebase/auth`
mock in `src/context/__tests__/AuthContext.test.tsx`. The rejection drives
`AuthContext`'s no-user path through `signInAnonymously(auth).catch(() => setLoading(false))`,
so `loading` resolves and the consumer renders "No user".

- **Files:** `src/context/__tests__/AuthContext.test.tsx` (test-only)
- **Verify:** `npx vitest run src/context/__tests__/AuthContext.test.tsx` → 3/3 pass, no unhandled rejections
- **Scope:** no change to `AuthContext` runtime behavior

## Self-Check: PASSED
