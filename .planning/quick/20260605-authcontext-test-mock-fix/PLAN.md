---
type: quick
slug: authcontext-test-mock-fix
created: 2026-06-05
---

# Quick Task: Fix AuthContext.test.tsx anonymous-auth mock

**Problem:** `src/context/__tests__/AuthContext.test.tsx` failed (pre-existing,
before Phase 7). `AuthContext` calls `signInAnonymously(auth)` on the no-user
path, but the test's `firebase/auth` mock didn't export `signInAnonymously` →
"No export defined" unhandled rejection, and the "No user" assertion failed
because `setLoading(false)` (only reached via that call's `.catch`) never ran.

**Fix (test-only):** add `signInAnonymously` to the `firebase/auth` mock returning
a rejected promise, so the AuthContext effect's `.catch(() => setLoading(false))`
runs and the no-user state renders. No runtime/AuthContext change.

**Verify:** `npx vitest run src/context/__tests__/AuthContext.test.tsx` → green.
