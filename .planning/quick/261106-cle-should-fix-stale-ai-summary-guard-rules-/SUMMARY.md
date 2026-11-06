---
status: complete
date: 2026-11-06
---

# 261106-cle — Review "Should fix" items (f2a81fe)

## Done

- **Stale AI summary (finding 4):** `AIProductInsights` keeps the current title in a ref; a Gemini answer that arrives after the user moved to another product is dropped (result and error). Test: `src/components/product/__tests__/AIProductInsights.test.tsx` (fails without the fix, passes with it).
- **Rules tests in repo + CI (finding 5):** scratch `rules-test.mjs` → `scripts/test-rules.mjs`, `npm run test:rules` (token from `$TOKEN` or `gcloud auth print-access-token`). Added 5 `price_history` cases → 46/46 pass locally. New `rules` job in `.github/workflows/ci.yml` authenticates with the `FIREBASE_SERVICE_ACCOUNT` secret.

## Not done (Must fix, separate task)

- Coupon opt-in field (1), price_history owner check + `recordedAt == request.time` (2), per-seller coupon query (3). The "competitor writes fake price" rules case belongs with (2).
