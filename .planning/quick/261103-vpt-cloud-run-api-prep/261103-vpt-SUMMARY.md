---
quick_id: 261103-vpt
status: complete
date: 2026-11-03
---

# Summary — Cloud Run API prep (code ready, deploy pending gcloud)

## Bugs found while running the server in production mode for the first time

| Bug                                                                                   | Impact                                                                                                      |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `server/logger.ts` set `formatters.bindings: undefined` when `NODE_ENV=production`    | **Server crashed on startup in production** ("formatter is not a function") — it had never run in prod mode |
| Static top-level `import 'vite'` (devDependency)                                      | Would crash any production install without devDependencies                                                  |
| `initializeApp` had no `storageBucket`; KYC + CSV import call `getStorage().bucket()` | KYC document storage and CSV import threw "bucket name not specified"                                       |
| Stripe webhook without `STRIPE_WEBHOOK_SECRET` answered 200                           | Stripe marked events delivered → silently lost; now 503 in production so Stripe retries                     |

## Changes

- server.ts: `PORT` env, dynamic vite import, `TRUST_PROXY_HOPS`, API-only JSON 404 when no `dist/`
- server/logger.ts: prod formatter fix + Cloud Logging `severity`
- src/lib/firebase-admin.ts: ADC on Cloud Run (`K_SERVICE`), default bucket from web config / `FIREBASE_STORAGE_BUCKET`
- server/routes/stripe.ts: unsigned webhook → 503 in production
- Dockerfile, .dockerignore (excludes .env, `*adminsdk*.json`, keys)
- DEPLOY-RUNBOOK.md: GCP setup, least-privilege runtime SA, Secret Manager, deploy, Hosting rewrite,
  webhook cutover, Scheduler crons, acceptance, rollback

## Verification

- Container file set staged in scratchpad, `NODE_ENV=production PORT=8089`, no .env:
  `/api/health` 200 JSON; unknown `/api/*` 404 JSON; `/api/admin/seller/x/grant-access` and
  `/api/admin/set-claims` 401 without token; `/api/webhook` 503 without secret.
- Repo with .env in prod mode: "Firebase Admin initialized successfully" (key path + JSON import OK).
- tsc 0 errors; vitest 36 files / 319 tests passed.

## Not verified (needs GCP)

- Docker build (no local Docker — Cloud Build builds it), ADC path, Hosting → Cloud Run proxy hop count.

## Next

User installs gcloud → run DEPLOY-RUNBOOK.md steps 1–8 together.
