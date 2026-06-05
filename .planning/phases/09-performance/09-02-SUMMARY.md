---
phase: 09-performance
plan: 02
subsystem: ci
tags: [lighthouse, lhci, perf-budget, ci-gate]
requires: [manualChunks, bundle-budget-ci]
provides: [lhci-error-thresholds, ci-perf-gate]
affects: [lighthouserc.json, package.json]
tech-stack:
  added: []
  patterns: [lhci-error-assertions, ci-perf-script]
key-files:
  created: []
  modified:
    - lighthouserc.json
    - package.json
decisions:
  - 'D-PERF-03: Critical perf thresholds (performance/LCP/TBT/CLS) set to error — build fails on regression'
  - 'SEO downgraded from error to warn — checked elsewhere via sitemap generation'
  - '3 runs per URL for stable median scores — mitigates flaky CI failures (T-09-03)'
metrics:
  duration: null
  completed_date: 2026-06-05
---

# Phase 9 Plan 2: Lighthouse CI Thresholds Hardening Summary

Lighthouse CI thresholds upgraded from warn-only to error for critical performance metrics (performance 0.85, LCP 3000ms, TBT 200ms, CLS 0.05). Checkout page added to URL collection. CI perf gate script added for merge-gate integration.

## What Was Built

### Task 1: Hardened LHCI thresholds

Updated `lighthouserc.json`:

| Assertion                 | Before        | After                  |
| ------------------------- | ------------- | ---------------------- |
| categories:performance    | warn @ 0.8    | **error** @ 0.85       |
| largest-contentful-paint  | warn @ 4000ms | **error** @ 3000ms     |
| total-blocking-time       | warn @ 300ms  | **error** @ 200ms      |
| cumulative-layout-shift   | warn @ 0.1    | **error** @ 0.05       |
| categories:seo            | error @ 0.9   | warn @ 0.9             |
| first-contentful-paint    | warn @ 2500ms | warn @ 2000ms          |
| categories:accessibility  | warn @ 0.9    | warn @ 0.9 (unchanged) |
| categories:best-practices | warn @ 0.9    | warn @ 0.9 (unchanged) |
| unused-javascript         | warn @ 0.3    | warn @ 0.3 (unchanged) |

Also added `http://localhost:4173/checkout` to the URL list (now 4 URLs) and increased `numberOfRuns` from 2 to 3 for more stable median scores.

### Task 2: CI perf gate script

Added two scripts to `package.json`:

- `ci:perf` — `npm run build && npx lhci autorun` — full CI gate (build + Lighthouse)
- `perf:local` — `npx lhci autorun --collect.numberOfRuns=1` — quick local check

The `ci:perf` script can be wired into CI pipeline as a merge gate, addressing T-09-04.

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

- `lighthouserc.json` — valid JSON, 4 URLs, 4 error assertions, 3 runs
- `package.json` — `ci:perf` and `perf:local` scripts present and correct

## Self-Check

Files verified existing at completion:

- `lighthouserc.json` — modified with hardened thresholds
- `package.json` — `ci:perf` and `perf:local` scripts added

Commits verified:

- `252b8c2` — present in git log
- `f7fa03d` — present in git log

## Self-Check: PASSED
