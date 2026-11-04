---
quick_id: 261104-tvf
slug: lock-gemini-proxy-remove-ai-image
date: 2026-11-04
status: complete
---

# Summary — Lock the Gemini proxy, remove AI product-image generation

Found after /api/\*\* went live (261104-tga): /api/gemini/text|vision|image had no auth, took a client-chosen
model and an unbounded prompt → anyone could spend our Gemini key.

- server/routes/gemini.ts: every route = verifyFirebaseToken (anonymous guests allowed) → per-uid limiter
  (30 / 15 min) → zod validation. Model fixed server-side (`GEMINI_MODEL`, default gemini-3-flash-preview).
- server/lib/schemas.ts: text prompt ≤ 12k chars; vision prompt ≤ 4k, image ≤ ~6 MB, jpeg/png/webp; `model` stripped.
- `/api/gemini/image` + ProductForm "AI Görsel Oluştur" removed (user decision: marketplace photos must be real).
- server.ts: `/api/gemini/vision` gets a 6 MB JSON limit — the global 100 kb default rejected every real photo,
  so visual search never worked.
- Client: `geminiFetch()` in src/lib/gemini.ts attaches the ID token; used by aiContentService,
  aiModerationService, recommendationService, visualSearchService, askShoppingAssistant.
- Test: server/routes/gemini.test.ts (auth first on every route, no image route, schema caps).

Takes effect only after Cloud Run redeploy (`gcloud run deploy benimolan-api --source . …`, same flags as runbook step 4).
