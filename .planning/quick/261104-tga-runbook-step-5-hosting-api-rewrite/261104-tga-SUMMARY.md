---
quick_id: 261104-tga
slug: runbook-step-5-hosting-api-rewrite
date: 2026-11-04
status: complete
---

# Summary — Cloud Run live + Hosting /api/\*\* rewrite

Plan: run DEPLOY-RUNBOOK (261103-vpt) steps 1–5.

- Steps 1–4 done in GCP: APIs enabled; runtime SA `benimolan-api` (datastore.user, firebaseauth.admin,
  secretmanager.secretAccessor, logging.logWriter, storage.objectAdmin on bucket); secrets STRIPE_SECRET_KEY,
  GEMINI_API_KEY, CRON_SECRET (user-created); service `benimolan-api` (europe-west1) deployed with
  APP_URL=https://benimolan.com (runbook said .web.app — wrong: CORS, email links and Stripe return URLs use it).
- Verified on run.app: /api/health → `{"status":"ok","environment":"production"}`; set-claims, payouts,
  abandoned-cart → 401 without auth; no ERROR logs.
- Step 5: firebase-adminsdk-fbsvc granted roles/run.viewer on the service; firebase.json `/api/**` → Cloud Run
  rewrite before the `**` catch-all. Frontend calls relative `/api` (VITE_API_URL unset); SW denylists /api/.

Stripe keys are LIVE (sk_live/pk_live). STRIPE_WEBHOOK_SECRET not set yet → /api/webhook answers 503 until step 6.
