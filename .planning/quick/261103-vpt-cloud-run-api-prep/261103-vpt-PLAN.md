---
quick_id: 261103-vpt
slug: cloud-run-api-prep
date: 2026-11-03
source_todo: .planning/todos/pending/2026-11-02-express-api-canlida-barindir.md
---

# Plan — Prepare Express API for Cloud Run (code only, no deploy)

Decision (2026-11-02): Cloud Run, project on Blaze. gcloud not yet installed → deploy is a later, user-run step.

## Tasks

1. server.ts: `PORT` from env; dynamic `import('vite')` (devDependency) only in dev; `trust proxy` hops via
   `TRUST_PROXY_HOPS` (default 1 on Cloud Run); API-only 404 JSON when `dist/` is absent.
2. firebase-admin: Application Default Credentials on Cloud Run (no key secret); default storage bucket.
3. Dockerfile + .dockerignore (no secrets in image).
4. Verify locally with the exact container file set in production mode.
5. Runbook for one-time GCP setup, deploy, Hosting rewrite, Stripe webhook cutover, Scheduler crons, rollback.

Hosting `/api/**` rewrite is NOT committed now: a hosting deploy fails while the Cloud Run service doesn't exist.
