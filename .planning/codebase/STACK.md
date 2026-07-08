# Technology Stack

**Analysis Date:** 2026-06-08

## Languages

**Primary:**

- TypeScript 5.8.2 — all frontend (`src/`) and backend (`server/`) code; strict mode, ES2022 target, ESM modules
- JavaScript (CJS) — `server/iyzico.cjs` only (Iyzico SDK compatibility wrapper)

**Secondary:**

- CSS — Tailwind v4 via `@theme` directives in `src/index.css`; no `tailwind.config.ts`

## Runtime

**Environment:**

- Node.js >=22 (inferred from `@types/node` 22.14 and tsx requirements)

**Package Manager:**

- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**

- React 19.2.6 — UI library; functional components only, no class components
- Express 4.21.2 — HTTP server and REST API; serves both API and Vite-built SPA
- react-router-dom 7.15.1 — client-side routing (BrowserRouter, Routes, Route)

**Testing:**

- Vitest 4.1.7 — unit and component tests; jsdom environment; globals: true
- Playwright 1.60.0 — E2E tests; Chromium only; baseURL `http://localhost:4173`
- @testing-library/react 16.3.2 — component rendering and interaction utilities
- @testing-library/user-event 14.6.1 — simulated user events

**Build/Dev:**

- Vite 6.2.0 — frontend bundler and dev server; manual chunk splitting configured
- tsx 4.22.3 — runs TypeScript server directly (`tsx server.ts`) without pre-compilation
- Tailwind CSS 4.3.0 — via `@tailwindcss/vite` plugin (v4 CSS-first config)
- vite-plugin-pwa 1.3.0 — Workbox service worker, PWA manifest
- @sentry/vite-plugin 5.3.0 — Sentry source maps upload on build

## Key Dependencies

**Critical:**

- firebase 12.13.0 — client-side Firestore, Auth, Storage SDK
- firebase-admin 13.10.0 — server-side Firestore and Auth admin SDK
- stripe 22.1.1 — server-side Stripe SDK (API version `2025-03-31.basil`)
- @stripe/stripe-js 9.6.0 — client-side Stripe.js loader
- @stripe/react-stripe-js 6.4.0 — React Stripe Elements components
- iyzipay 2.0.67 — Turkish payment gateway SDK (loaded via CJS wrapper)
- zod 4.4.3 — runtime schema validation (server routes and forms)

**Infrastructure:**

- helmet 8.2.0 — security headers middleware
- cors 2.8.6 — CORS handling; production origin locked to `https://benimolan.com`
- express-rate-limit 8.5.2 — rate limiting on API endpoints
- dotenv 17.2.3 — environment variable loading
- pino 10.3.1 + pino-http 11.0.0 — structured JSON logging
- husky 9.1.7 + lint-staged 16.4.0 — pre-commit hooks

**UI / Presentation:**

- lucide-react 0.546.0 — icon library
- motion 12.40.0 — animations (Framer Motion v12 via `motion/react`)
- recharts 3.8.1 — charts (seller analytics dashboard)
- @dnd-kit/core 6.3.1 / sortable 10.0.0 / utilities 3.2.2 — drag-and-drop
- @google/model-viewer 4.2.0 — 3D product viewer (Web Component)
- three 0.184.0 — Three.js (3D rendering, used alongside model-viewer)
- react-helmet-async 3.0.0 — SEO meta tags
- papaparse 5.5.3 — CSV import/export for seller inventory
- clsx 2.1.1 + tailwind-merge 3.6.0 — class name utilities (`cn()` in `src/lib/utils.ts`)
- axios 1.16.1 — HTTP client (select services)
- libphonenumber-js 1.13.6 — phone number validation (seller KYC)

**Backend Services:**

- resend 6.12.4 — transactional email sending
- nodemailer 8.0.10 — email (also referenced in types; Resend is primary)
- twilio 6.0.2 — SMS / OTP verification (seller phone verification)
- @google/genai 1.29.0 — Google Gemini AI SDK
- typesense 3.0.6 — search index client
- typesense-instantsearch-adapter 3.0.2 — Typesense InstantSearch adapter
- pdfkit 0.18.0 — PDF generation (invoices, shipping labels)
- @sentry/react 10.53.1 — error monitoring and performance tracing

## Configuration

**Environment:**

- `.env` file at project root (not committed); template at `.env.example` and `.env.production.example`
- Client-side vars prefixed `VITE_` (exposed to browser bundle)
- Server-side vars without prefix (Node.js `process.env`)
- Key required vars: `STRIPE_SECRET_KEY`, `FIREBASE_SERVICE_ACCOUNT_B64`, `GEMINI_API_KEY`, `APP_URL`, `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `RESEND_API_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_FIREBASE_*`
- Optional vars: `VITE_SENTRY_DSN`, `VITE_GA4_MEASUREMENT_ID`, `VITE_META_PIXEL_ID`, `VITE_TIKTOK_PIXEL_ID`, `TYPESENSE_*`, `EFATURA_API_URL`, `EFATURA_API_KEY`, `CRON_SECRET`, `TWILIO_*`

**Build:**

- `vite.config.ts` — Vite build config; `@/` alias → `./src`; manual chunk splitting for react, firebase, stripe, motion, three, dnd-kit, recharts, utils
- `tsconfig.json` — TypeScript config; excludes `mobile/`, `mercora-next/`, `functions/`
- `vitest.config.ts` — Vitest config; coverage thresholds: 2% statements/functions/lines, 1% branches
- `playwright.config.ts` — E2E config; Chromium only; `http://localhost:4173`
- `eslint.config.js` — ESLint 10 flat config
- `.prettierrc.json` — Prettier formatting rules

## Platform Requirements

**Development:**

- Node.js >=22
- `npm install` then `npm run dev` (starts `tsx server.ts` on port 3000)
- Firebase project with Firestore, Auth, Storage enabled
- `.env` file with at minimum Firebase client config and Firebase Admin credentials

**Production:**

- Target: Google Cloud Run (inferred from `APP_URL` injection pattern in `.env.example`)
- Single process: Express serves both API (`/api/*`) and Vite-built SPA (catch-all)
- Port: 3000 (hardcoded in `server.ts`)
- Build: `npm run build` → Vite bundles to `dist/`; server serves `dist/` as static assets

**Mobile (separate app):**

- React Native 0.78.0 with React 19 in `mobile/` subdirectory
- Excluded from root `tsconfig.json`
- Uses `@react-navigation/native` v7, Zustand 5 for state, `@stripe/stripe-react-native`

---

_Stack analysis: 2026-06-08_
