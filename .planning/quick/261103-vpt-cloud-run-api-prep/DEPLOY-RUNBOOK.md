# Runbook — Express API → Cloud Run (`benimolan-api`, europe-west1)

Run from the repo root in **Git Bash** after `gcloud init` (account ozyslr@gmail.com, project market-ecommerce-app).
Steps 1–4 are one-time. Never paste secret values into chat or commit them.

## 1. Enable APIs

```bash
gcloud config set project market-ecommerce-app
gcloud config set run/region europe-west1
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com cloudscheduler.googleapis.com
```

## 2. Dedicated runtime service account (least privilege — not the Editor-level default)

```bash
SA=benimolan-api@market-ecommerce-app.iam.gserviceaccount.com
gcloud iam service-accounts create benimolan-api --display-name="Benim Olan API runtime"
for ROLE in roles/datastore.user roles/firebaseauth.admin roles/secretmanager.secretAccessor roles/logging.logWriter; do
  gcloud projects add-iam-policy-binding market-ecommerce-app --member="serviceAccount:$SA" --role="$ROLE" --condition=None
done
gcloud storage buckets add-iam-policy-binding gs://market-ecommerce-app.firebasestorage.app \
  --member="serviceAccount:$SA" --role=roles/storage.objectAdmin
```

On Cloud Run the server uses this identity (ADC, `K_SERVICE` branch in src/lib/firebase-admin.ts) —
**no service-account key secret is needed**.

## 3. Secrets (values read from local .env / generated — never echoed)

```bash
set -a; . ./.env; set +a
printf '%s' "$STRIPE_SECRET_KEY" | gcloud secrets create STRIPE_SECRET_KEY --data-file=-
printf '%s' "$GEMINI_API_KEY"    | gcloud secrets create GEMINI_API_KEY    --data-file=-
openssl rand -hex 32 | tr -d '\n' | gcloud secrets create CRON_SECRET --data-file=-
# STRIPE_WEBHOOK_SECRET is created in step 6 (new endpoint → new signing secret).
```

Not configured anywhere yet (features stay off until added): IYZICO*API_KEY / IYZICO_SECRET_KEY / IYZICO_BASE_URL,
RESEND_API_KEY, TWILIO*_, EASYPOST*WEBHOOK_SECRET, EDEVLET_API_KEY, GIB*_, SENTRY_DSN.

## 4. Deploy (Cloud Build builds the Dockerfile remotely — no local Docker needed)

```bash
gcloud run deploy benimolan-api --source . \
  --service-account="$SA" --allow-unauthenticated \
  --min-instances=0 --max-instances=3 --memory=1Gi --timeout=60 \
  --set-env-vars="NODE_ENV=production,APP_URL=https://market-ecommerce-app.web.app,TRUST_PROXY_HOPS=1" \
  --set-secrets="STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,CRON_SECRET=CRON_SECRET:latest"
URL=$(gcloud run services describe benimolan-api --format='value(status.url)')
curl -s "$URL/api/health"            # expect {"status":"ok","environment":"production"}
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$URL/api/admin/set-claims"   # expect 401
```

`--allow-unauthenticated` is required: Firebase Hosting forwards public traffic. Every sensitive route
does its own Firebase-token / admin / cron-secret check (verified locally: 401 without token).

## 5. Route /api/\*\* through Hosting (only AFTER step 4 succeeded — hosting deploy fails if the service is missing)

In firebase.json `hosting.rewrites`, put this **before** the `**` catch-all:

```json
{ "source": "/api/**", "run": { "serviceId": "benimolan-api", "region": "europe-west1" } },
```

The GitHub deploy service account (firebase-adminsdk-fbsvc@…) must be able to read the Cloud Run service,
or the hosting deploy fails with a 403:

```bash
gcloud run services add-iam-policy-binding benimolan-api \
  --member="serviceAccount:firebase-adminsdk-fbsvc@market-ecommerce-app.iam.gserviceaccount.com" --role=roles/run.viewer
```

Commit + push → GitHub Actions deploys hosting. Verify:
`curl -s https://market-ecommerce-app.web.app/api/health` returns JSON (not HTML).

**Proxy hops check:** via Hosting there may be two proxies (Hosting CDN + Cloud Run front end). Make a request,
then in Cloud Run logs compare the rate-limit key / `req.ip` with your real IP. If it shows a Google/Fastly IP,
`gcloud run services update benimolan-api --update-env-vars=TRUST_PROXY_HOPS=2`.

## 6. Stripe webhook cutover

1. Stripe Dashboard → Developers → Webhooks → **Add endpoint**: `https://market-ecommerce-app.web.app/api/webhook`
   with the same events as the existing endpoint (if any).
2. Copy its signing secret, then:
   `printf '%s' 'whsec_…' | gcloud secrets create STRIPE_WEBHOOK_SECRET --data-file=-` (type it in your terminal, not chat)
3. `gcloud run services update benimolan-api --update-secrets=STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest`
4. Stripe → endpoint → **Send test event** → expect 200.
5. Only then disable the old endpoint. Without the secret the server answers 503, so Stripe keeps retrying
   (up to 3 days) — no events are lost during the switch. Missed ones can be resent from the Stripe dashboard.

## 7. Cron jobs (Cloud Scheduler → header `x-cron-secret`)

```bash
CRON=$(gcloud secrets versions access latest --secret=CRON_SECRET)
job() { gcloud scheduler jobs create http "$1" --location=europe-west1 --schedule="$2" \
  --uri="$URL$3" --http-method=POST --headers="x-cron-secret=$CRON" --time-zone="Europe/Istanbul"; }
job abandoned-cart   "0 * * * *"   /api/abandoned-cart/check
job payouts          "0 3 * * *"   /api/process-scheduled-payouts
job fx-rates         "0 */6 * * *" /api/fx-rates/refresh
job carrier-delays   "30 * * * *"  /api/carrier/check-delays
job entegi-poll      "*/30 * * * *" /api/carrier/entegi/poll
```

## 8. Acceptance

- Live `/api/health` JSON via Hosting domain.
- Admin panel: approve a test seller → no "API sunucusuna ulaşılamadı" → seller adds product → lands `pending`.
- Stripe test-mode checkout completes; webhook delivery shows 200.

## Rollback

Remove the `/api/**` rewrite from firebase.json and push (site returns to static-only, as before).
`gcloud run services delete benimolan-api` if needed.
