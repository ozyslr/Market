# Technology Stack

**Last updated:** 2026-05-31

---

## Overview

Full-stack TypeScript e-commerce marketplace ("Benim Olan"). Single-package repo with SSR-less Express backend serving a React SPA bundled via Vite.

---

## Primary Language & Runtime

| Aspect | Detail |
|---|---|
| Language | **TypeScript** 5.8.2 (strict mode, ES2022 target) |
| Module system | ESM (`"type": "module"` in package.json) |
| JSX mode | `react-jsx` (automatic runtime) |
| Dev server runner | **tsx** 4.22.3 (transpiles TS on the fly) |
| Node.js range | >=22 (inferred from `@types/node` 22.14, tsx requirements) |

**Key `tsconfig.json` settings:** `moduleResolution: "bundler"`, `isolatedModules: true`, path alias `@/* -> ./src/*`.

---

## Frontend

| Layer | Technology | Version |
|---|---|---|
| UI library | **React** | 19.2.6 |
| DOM renderer | **react-dom** | 19.2.6 |
| Router | **react-router-dom** | 7.15.1 |
| Build tool | **Vite** | 6.2.0 |
| React plugin | **@vitejs/plugin-react** | 5.0.4 |
| PWA support | **vite-plugin-pwa** (Workbox) | 1.3.0 |

### Key Frontend Libraries

| Library | Version | Purpose |
|---|---|---|
| lucide-react | 0.546.0 | Icon set |
| motion | 12.40.0 | Animations / Framer Motion |
| recharts | 3.8.1 | Charts (seller analytics dashboard) |
| @dnd-kit/core / sortable / utilities | 6.3.1 / 10.0.0 / 3.2.2 | Drag-and-drop (inventory, CMS) |
| @google/model-viewer | 4.2.0 | 3D product viewer |
| react-helmet-async | 3.0.0 | SEO / meta tags |
| papaparse | 5.5.3 | CSV import/export (seller inventory) |
| axios | 1.16.1 | HTTP client |
| clsx / tailwind-merge | 2.1.1 / 3.6.0 | Class name utilities |

---

## Backend

| Layer | Technology | Version |
|---|---|---|
| HTTP framework | **Express** | 4.21.2 |
| Security headers | **helmet** | 8.2.0 |
| CORS | **cors** | 2.8.6 |
| Rate limiting | **express-rate-limit** | 8.5.2 |
| Environment | **dotenv** | 17.2.3 |
| Stripe SDK (server) | **stripe** | 22.1.1 |
| Stripe (client) | **@stripe/stripe-js** + **@stripe/react-stripe-js** | 9.6.0 / 6.4.0 |
| iyzico SDK | **iyzipay** | 2.0.67 (via CJS wrapper) |
| Firebase Admin | **firebase-admin** | 13.10.0 |
| Firebase Client | **firebase** | 12.13.0 |
| Gemini AI | **@google/genai** | 1.29.0 |

The Express server (`server.ts`) also embeds Vite in middleware mode for development, eliminating the need for a separate dev-server process.

---

## Database & ORM

| Component | Technology |
|---|---|
| Primary database | **Firebase Firestore** (NoSQL document store) |
| Client SDK | `firebase/firestore` |
| Admin SDK | `firebase-admin/firestore` |
| File storage | **Firebase Storage** (`firebase/storage`) |
| Authentication | **Firebase Auth** (`firebase/auth` server-side via `firebase-admin/auth`) |
| ORM | None — raw Firestore SDK calls throughout |

---

## CSS / Styling

| Technology | Version | Notes |
|---|---|---|
| **Tailwind CSS** | 4.3.0 | v4 with Vite plugin (`@tailwindcss/vite`) |
| autoprefixer | 10.4.21 | PostCSS vendor prefixing |
| No `tailwind.config.ts` | — | Tailwind v4 uses CSS-based configuration (`@theme` directives in `index.css`) |

---

## Build Tooling & Configuration

| Step | Tool |
|---|---|
| Bundler | **Vite 6** |
| TypeScript | **tsc** (type-check only: `tsc --noEmit`) |
| Linting | **ESLint** 10.4.0 |
| Unit tests | **Vitest** 4.1.7 + **jsdom** 29.1.1 + **@testing-library/react** 16.3.2 |
| E2E tests | **Playwright** 1.60.0 |
| Performance | **Lighthouse CI** (lhci) 4.1.2 |
| Bundle analysis | **rollup-plugin-visualizer** 7.0.1 |
| Sitemap | Custom Node script (`scripts/generate-sitemap.mjs`) |
| PWA build | vite-plugin-pwa generates Workbox service worker |

---

## Project Structure

```
O:\AI\E-tic 2026\
  server.ts              — Express entry + Vite dev middleware
  vite.config.ts         — Vite config (React, Tailwind, PWA, visualizer)
  tsconfig.json          — TypeScript config
  firebase-applet-config.json  — Firebase client credentials
  src/
    main.tsx             — React entry point
    App.tsx              — Root component (Router + context providers)
    index.css            — Tailwind v4 base + @theme customisations
    lib/                 — Shared utilities (firebase, auth middleware, sentry, gemini, analytics, etc.)
    services/            — 35+ service modules (Firestore CRUD, external APIs)
    context/             — React context providers (Language, Auth, Cart, Wishlist, etc.)
    components/          — UI components
    pages/               — Route page components
    types/               — TypeScript type definitions
  server/
    routes/
      stripe.ts          — Stripe payment endpoints + webhook
      iyzico.ts          — iyzico payment endpoints + callback
      sellerApi.ts       — Seller REST API (/api/v1)
    iyzico.cjs           — iyzico CommonJS wrapper
```

---

## Monorepo Status

**Not a monorepo.** Single `package.json` at root. The `tsconfig.json` explicitly excludes `mobile`, `mercora-next`, and `functions` directories (unrelated projects co-located in the same parent).

---

## Testing Stack

| Category | Tool | Config |
|---|---|---|
| Unit / Component | **Vitest** + **@testing-library/react** | `tsconfig` paths resolved, jsdom environment |
| E2E | **Playwright** | `playwright.config.ts` at root |
| Coverage | Vitest `--coverage` | — |
| CI | Lighthouse CI | `lhci autorun` |
