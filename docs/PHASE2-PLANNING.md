# Phase 2 Planning
**Mercora E-commerce Platform - Growth & Intelligence Layer**
**Estimated Timeline:** 2-3 weeks

---

## Strategic Focus

Phase 1 delivered **revenue infrastructure** (subscriptions, payments, checkout, auth).  
Phase 2 delivers **growth intelligence** and **conversion optimization**.

**Key Objectives:**
1. Support traditional email/password authentication (user fallback)
2. Track user behavior → analytics dashboards
3. Enable A/B testing and feature flags
4. Optimize performance (images, code splitting)
5. Support international expansion (multi-currency, localization)

---

## STREAM F: Email Authentication

**Impact:** Traditional auth backup + account linking for social users

### Scope:
- Email/password registration and login
- Email verification (link-based, 24-hour expiry)
- Password reset flow (via email)
- Account linking (connect email to phone/social auth)
- Password strength validation

### Deliverables:
1. `src/services/emailAuthService.ts` — Email auth with verification
2. `src/components/auth/EmailLoginForm.tsx` — Login form
3. `src/components/auth/EmailRegisterForm.tsx` — Registration form
4. `src/components/auth/ForgotPasswordForm.tsx` — Password reset
5. `src/app/api/auth/email/signup/route.ts` — Registration endpoint
6. `src/app/api/auth/email/login/route.ts` — Login endpoint
7. `src/app/api/auth/email/verify/route.ts` — Email verification
8. `src/app/api/auth/email/reset-password/route.ts` — Password reset
9. `src/app/auth/verify-email/page.tsx` — Email verification page

### Database:
- `users/{userId}` — Add `email`, `passwordHash`, `emailVerified`, `emailVerifiedAt`
- `email_verification_tokens/{tokenId}` — Email verification tracking
- `password_reset_tokens/{tokenId}` — Password reset tracking

---

## STREAM G: Advanced Analytics

**Impact:** Data-driven decision making + conversion insights

### Scope:
- Event tracking (pageviews, clicks, conversions)
- User session tracking (duration, path, device)
- Funnel analysis (checkout, payment completion)
- Cohort segmentation (by signup date, tier, region)
- Retention metrics
- Revenue attribution

### Deliverables:
1. `src/services/analyticsService.ts` — Event tracking API
2. `src/lib/analytics/eventTracker.ts` — Client-side event capturing
3. `src/lib/analytics/funnelAnalytics.ts` — Funnel tracking (signup → checkout → payment)
4. `src/app/api/analytics/events/route.ts` — Event collection endpoint
5. `src/app/api/analytics/dashboard/route.ts` — Dashboard data aggregation
6. `src/components/analytics/FunnelChart.tsx` — Funnel visualization
7. `src/components/analytics/CohortAnalysis.tsx` — Cohort retention chart
8. `src/pages/dashboard/analytics.tsx` — Analytics dashboard (seller)

### Events to Track:
- **User Events:** signup, login, logout, profile_update, account_delete
- **Product Events:** product_view, search, add_to_cart, remove_from_cart
- **Checkout Events:** checkout_started, address_filled, payment_selected, order_completed
- **Payment Events:** payment_initiated, payment_success, payment_failed, refund_issued
- **Subscription Events:** subscription_created, tier_changed, subscription_cancelled
- **Seller Events:** product_created, product_updated, product_deleted, review_received

### Database:
- `analytics_events/{eventId}` — All tracked events
- `user_sessions/{sessionId}` — Session tracking
- `funnel_steps/{funnelId}` — Funnel progression
- `cohort_analysis/{cohortId}` — Pre-computed cohorts

---

## STREAM H: Performance & Feature Flags

**Impact:** Faster pages + ability to A/B test features

### Scope:
- Feature flags (enable/disable features per user/region)
- A/B testing framework (split traffic, track conversion)
- Image optimization (lazy loading, responsive images)
- Code splitting (reduce initial bundle size)
- Performance monitoring dashboard

### Deliverables:
1. `src/services/featureFlagService.ts` — Feature flag evaluation
2. `src/lib/featureFlags.ts` — Client-side flag evaluation
3. `src/services/abTestingService.ts` — A/B test assignment
4. `src/components/ImageOptimized.tsx` — Lazy-loaded image component
5. `src/app/api/feature-flags/evaluate/route.ts` — Flag evaluation endpoint
6. `src/app/api/ab-tests/assign/route.ts` — Test assignment endpoint
7. `src/pages/dashboard/performance.tsx` — Performance monitoring dashboard
8. `next.config.js` — Bundle analysis & code splitting config

### Feature Flags:
- `checkout_guest_only` — Show/hide account creation in checkout
- `payment_installments` — Enable/disable installment plans
- `seller_analytics_dashboard` — New analytics features
- `new_search_algorithm` — A/B test search changes
- `premium_notifications` — Push notification system

### A/B Tests:
- Checkout flow variations (3-step vs 4-step)
- Payment method ordering (card first vs installments first)
- Call-to-action copy testing
- Seller onboarding flow variations

---

## STREAM I: International Support

**Impact:** Global expansion readiness (multi-currency, localization)

### Scope:
- Multi-currency pricing and payment
- i18n localization (Turkish, English, German, French minimum)
- Regional compliance (GDPR, local payment methods)
- Timezone handling
- Regional pricing strategy

### Deliverables:
1. `src/services/currencyService.ts` — Currency conversion & formatting
2. `src/lib/i18n.ts` — Localization framework
3. `src/contexts/LocalizationContext.tsx` — i18n context provider
4. `src/hooks/useLocalization.ts` — useLocalization hook
5. `public/locales/{lang}/common.json` — Translation files
6. `src/app/api/localization/currencies/route.ts` — Currency data endpoint
7. `src/components/LocalizationSelector.tsx` — Language/currency selector
8. `src/app/settings/localization/page.tsx` — Localization settings page

### Supported Languages:
- Turkish (tr-TR) — Primary market
- English (en-US) — International
- German (de-DE) — EU expansion
- French (fr-FR) — EU expansion

### Multi-Currency:
- Turkey: TRY (Turkish Lira)
- US/Global: USD (US Dollar)
- EU: EUR (Euro)
- UK: GBP (British Pound)

### Regional Rules:
- **Turkey:** Iyzico for local payments, installments, Turkish support
- **EU:** GDPR compliance, iDEAL/Bancontact, EU seller regulations
- **UK:** Post-Brexit regulations, GBP pricing
- **US:** State sales tax, US seller regulations

---

## Implementation Strategy

### Phase 2.1: Email Auth (Week 1)
1. Email/password registration form
2. Email verification flow
3. Login with email
4. Password reset
5. Account linking (email ↔ phone/social)

### Phase 2.2: Analytics (Week 1-2)
1. Event tracking infrastructure
2. Event collection endpoint
3. Session tracking
4. Funnel analysis
5. Analytics dashboard for sellers

### Phase 2.3: Performance & Flags (Week 2)
1. Feature flag system
2. A/B testing framework
3. Image optimization
4. Code splitting & bundle analysis
5. Performance dashboard

### Phase 2.4: International (Week 2-3)
1. i18n setup (Turkish, English, German, French)
2. Multi-currency support
3. Regional payment methods
4. Localization selector UI
5. Regional compliance helpers

---

## Success Metrics

### Email Auth
- Email signup rate: Target >30% of new users
- Email login conversion: Target >90%
- Email verification rate: Target >85%

### Analytics
- Event tracking coverage: 100% of critical funnels
- Dashboard load time: <2s
- Real-time event latency: <5s

### Performance
- LCP: <2.5s (with images optimized)
- First Byte: <600ms
- Bundle size reduction: -20% target
- Feature flag evaluation: <10ms

### International
- Translation coverage: 100% of UI
- Multi-currency accuracy: ±0.1%
- Regional conversion: Parity across markets

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Email deliverability | Low signup | Use transactional email service (Sendgrid, Mailgun) |
| Analytics data volume | High costs | Implement data sampling, retention policies |
| Feature flag complexity | Bugs | Start with simple flags, auto-test all variations |
| Translation quality | Poor UX | Use professional translators for key phrases |
| Performance regressions | User churn | Monitor Core Web Vitals continuously |

---

## Dependencies

### External Services:
- Email delivery: SendGrid or Mailgun
- Analytics: Firebase Analytics or custom tracking
- Feature flags: LaunchDarkly or custom service
- i18n: next-i18next or custom implementation
- Currency: OpenExchangeRates or ECB API

### Internal Dependencies:
- Phase 1 auth system (user creation, sessions)
- Phase 1 payment system (currency handling)
- Firestore collections (user, sessions, events)

---

## Resource Allocation

**Estimated Effort:**
- Email Auth: 2-3 days
- Analytics: 3-4 days
- Performance & Flags: 3 days
- International: 2-3 days
- **Total: 10-13 days** (~2 weeks)

**Team:**
- 2 Backend engineers (Email auth, Analytics, API endpoints)
- 1 Frontend engineer (UI components, dashboards)
- 1 DevOps (Email service setup, monitoring)

---

**Status:** Ready for Phase 2 approval ✅
