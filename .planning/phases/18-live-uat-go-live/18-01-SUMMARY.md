---
phase: 18-live-uat-go-live
plan: 01
requirements_addressed: [UAT-01, UAT-02, UAT-03, UAT-04, UAT-05]
---

# Plan 18-01 Summary: Production Go-Live

## Completed

- Created `.env.production.example`: all production env vars documented (Stripe live, Typesense, e-fatura, Resend, Twilio, Sentry)
- Created `scripts/go-live-checklist.md`: 40+ item checklist covering payments, infrastructure, core flows, E2E, email, compliance, performance, security, sign-off
- Created `scripts/provision-typesense.mjs`: Typesense Cloud + self-hosted provisioning guide
- Playwright E2E tests exist (3 specs), require staging env to run

## Remaining Manual Steps

- [ ] Provision Typesense server + run bootstrap
- [ ] Configure e-fatura API keys (Paraşüt/Logo)
- [ ] Set Stripe production keys
- [ ] Run Playwright E2E on staging
- [ ] Complete go-live checklist

## Verification

- [x] tsc --noEmit passes
- [ ] Typesense server provisioned + bootstrap complete
- [ ] Playwright E2E tests pass on staging
- [ ] Go-live checklist signed off
