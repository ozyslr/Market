# Mercora UX Priority Matrix
## P0/P1 Issues Ranked by Impact & Effort

**Goal:** Clear guidance for Sprint 1-2 task assignment  
**Format:** Priority matrix with effort estimates and dependencies

---

## P0 — CRITICAL (Do First)

Must complete in Sprint 1. These block user trust and platform reliability.

### P0-1: Silent Error Swallowing (Effort: 4h, Impact: CRITICAL)

**What:** Replace all `.catch(() => {})` with user-facing error handling

**Files affected:**
| File | Lines | Pattern | Complexity |
|------|-------|---------|-----------|
| `AdminSellers.tsx` | 64-68 | `.catch(() => setSellers(MOCK_SELLERS))` | Low |
| `SellerSettings.tsx` | 73 | `.catch(() => {/* silent */})` | Low |
| `SellerImportCenter.tsx` | 152 | `.catch(() => setImported(false))` | Medium |
| `OrderTracking.tsx` | 45 | `.catch(() => {})` | Low |
| Full codebase scan | TBD | Unknown silent catches | Medium |

**Fix approach:**
1. Audit all files: `grep -r "\.catch.*=>.*{}.*}" src/`
2. Add Toast context
3. Replace each with proper handler
4. Add Sentry logging
5. Test error flows

**Acceptance Criteria:**
- [ ] 0 silent `.catch()` blocks remain
- [ ] Each error shows toast to user
- [ ] Error details logged to Sentry
- [ ] All 4 identified files fixed
- [ ] No regression in existing functionality

**Owner:** Backend-integrated Frontend Dev  
**Blocker for:** P0-4, P0-5

---

### P0-2: Toast/Snackbar System (Effort: 6h, Impact: CRITICAL)

**What:** Global notification system for error/success/warning feedback

**Deliverables:**
- [ ] `ToastContext` + `useToast()` hook
- [ ] `Toast.tsx` component with 4 variants
- [ ] `ToastContainer` in App root
- [ ] Styling for all states
- [ ] Keyboard dismissal (Escape)
- [ ] ARIA labels + roles

**Implementation sequence:**
1. Create types/interfaces
2. Build context provider
3. Create Toast component (30 min)
4. Add to App root
5. Manual testing with 5+ scenarios

**Acceptance Criteria:**
- [ ] Errors auto-appear on API failure
- [ ] Success auto-dismisses after 3s
- [ ] All 4 type variants styled correctly
- [ ] Accessible (ARIA, keyboard, color)
- [ ] Responsive (mobile/desktop)

**Owner:** Frontend Lead  
**Dependencies:** None  
**Dependency for:** P0-1, P0-4, P0-5, P1-6, P1-7

---

### P0-3: 403 Forbidden Page (Effort: 2h, Impact: HIGH)

**What:** Dedicated page for unauthorized access + middleware protection

**Deliverables:**
- [ ] `src/pages/Forbidden.tsx` (React Router)
- [ ] `mercora-next/src/app/forbidden/page.tsx` (Next.js)
- [ ] Middleware to redirect on 403
- [ ] Link to support + home navigation

**Design:**
```
┌─────────────────────────────────┐
│ Shield Icon + Red 403           │
│ "Erişim Reddedildi"            │
│ "This page requires admin..."   │
│ [Ana Sayfaya Dön] [Destek]     │
└─────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Page renders at `/403` and `/forbidden`
- [ ] Admin middleware redirects unauthorized users
- [ ] Links work (home, support)
- [ ] Mobile responsive
- [ ] Accessible

**Owner:** UX/Frontend Junior  
**Dependencies:** None  
**Effort:** Low, high signal

---

### P0-4: Search Empty State (Effort: 3h, Impact: HIGH)

**What:** Special UI when search returns 0 results (not just blank page)

**Requirements:**
- [ ] "Sonuç Bulunamadı" heading + icon
- [ ] Original query display
- [ ] 3+ suggestions (spelling tips)
- [ ] "Did you mean?" alternatives
- [ ] 3 category shortcuts
- [ ] CTA: [Tüm Ürünleri Gör]

**Files affected:**
- `SearchResults.tsx` (integrate empty state logic)
- `SearchEmptyState.tsx` (new component)

**Acceptance Criteria:**
- [ ] Renders when `results.length === 0`
- [ ] Displays user's search query
- [ ] Shows alternatives + categories
- [ ] Mobile responsive
- [ ] Improves user engagement (metric: retry searches)

**Owner:** Frontend Mid-level  
**Dependencies:** None  
**Dependency for:** Better search UX

---

### P0-5: Enhanced ErrorBoundary (Effort: 3h, Impact: HIGH)

**What:** Replace basic error page with helpful 500 error handler

**From:** Simple fallback  
**To:** Error ID + auto-redirect countdown + debug details

**Requirements:**
- [ ] Error reference ID (ERR_20250523_8K2J9 format)
- [ ] 10-second countdown to auto-redirect home
- [ ] "Try these fixes" tips
- [ ] Sentry logging with error ID
- [ ] Development mode shows stack trace
- [ ] Support contact link

**Acceptance Criteria:**
- [ ] Triggers on any unhandled error
- [ ] Error ID sent to Sentry
- [ ] Auto-redirects to home after 10s
- [ ] "Tekrar Dene" button works
- [ ] User can copy error ID

**Owner:** Platform/Stability Engineer  
**Dependencies:** Sentry integration  
**Dependency for:** Production reliability

---

## P1 — IMPORTANT (Do Week 2)

High-value improvements to form experience and accessibility.

### P1-6: Inline Form Validation (Effort: 8h, Impact: HIGH)

**What:** Real-time validation feedback on form fields

**Scope:**
1. Create `FormField.tsx` component with validation states
2. Create `validators.ts` library
3. Create `useFormValidation()` hook
4. Apply to 3+ key forms:
   - `SellerSettings.tsx`
   - `SellOnMercora.tsx` (seller application)
   - `Checkout.tsx` (if exists)

**Features per field:**
- Pristine (no validation shown)
- Focused (no error overlay)
- Valid (green checkmark)
- Invalid (red border + error message)
- Validating (spinner for async)

**Validators to include:**
- `required`
- `email`
- `phone` (Turkish 10-digit)
- `minLength(n)`
- `asyncEmailUnique`

**Acceptance Criteria:**
- [ ] All form fields show real-time errors
- [ ] Green checkmark on valid fields
- [ ] Red border + message on invalid
- [ ] Async validators debounced (500ms)
- [ ] Form submit blocked if errors exist
- [ ] Accessibility tested (screen reader, keyboard)

**Owner:** Frontend Lead + Mid-level pair  
**Dependencies:** Toast system (P0-2)  
**Effort:** Highest in P1, high ROI

---

### P1-7: Maintenance Mode Page (Effort: 2h, Impact: MEDIUM)

**What:** Special page shown when `SiteSettings.maintenanceMode` is true

**Requirements:**
- [ ] Animated wrench icon
- [ ] ETA countdown from `maintenanceEndTime`
- [ ] Email notification signup
- [ ] Contact support link
- [ ] Only admins can bypass

**Design:**
```
┌──────────────────┐
│  🔧 (spinning)   │
│  Bakım Modu      │
│  "Back at 22:30" │
│ [İletişim] [ETA] │
└──────────────────┘
```

**Middleware:**
```typescript
if (siteSettings.maintenanceMode && !isAdmin(user)) {
  return redirect('/maintenance');
}
```

**Acceptance Criteria:**
- [ ] Shows when flag enabled
- [ ] Updates ETA every 10s
- [ ] Wrench icon animates
- [ ] Email signup works
- [ ] Admin can bypass (cookie/flag)

**Owner:** Frontend Junior  
**Dependencies:** SiteSettings integration  
**Effort:** Low, medium impact

---

### P1-8: Network Status Component (Effort: 2.5h, Impact: MEDIUM)

**What:** Persistent banner when user goes offline/online

**States:**
1. **Offline:** "Çevrimdışısınız" (red, stays visible, [Tekrar Dene])
2. **Reconnecting:** "Bağlantı kuruluyor..." (yellow, auto-dismiss on success)
3. **Degraded:** "Yavaş bağlantı" (info, optional)

**Technical:**
- Listen to `navigator.onLine`
- Monitor fetch latency
- Show banner at top of page
- Hide when back online

**Acceptance Criteria:**
- [ ] Detects offline state (disable WiFi test)
- [ ] Displays appropriate message
- [ ] [Tekrar Dene] refreshes page
- [ ] Auto-hides on reconnect
- [ ] Keyboard accessible

**Owner:** Frontend Junior  
**Dependencies:** None  
**Effort:** Low, nice-to-have early warning

---

### P1-9: Theme Consistency (Effort: 5h, Impact: MEDIUM)

**What:** Unify color system between `src/` and `mercora-next/`

**Current mismatch:**
- `src/`: `bg-brand-primary`, `text-accent`
- `mercora-next/`: `bg-zinc-950`, `text-emerald-400`

**Solution:**
- Centralize CSS variables in `globals.css`
- Update both `tailwind.config.js` files
- Ensure same palette both places

**Acceptance Criteria:**
- [ ] One color palette across both apps
- [ ] CSS variables defined in globals.css
- [ ] No direct hex colors in components
- [ ] All pages render consistently
- [ ] No visual regressions

**Owner:** Design Lead  
**Dependencies:** None  
**Effort:** Medium, high polish impact

---

## P2 — Nice-to-Have (Post-Sprint)

Low effort, lower impact. Do if time permits.

| Issue | Effort | Impact | Notes |
|-------|--------|--------|-------|
| 404 page with maskot | 2h | Low | Trendyol-style fun element |
| Skeleton → content transition | 2h | Low | Smooth animation, polish |
| Empty cart special state | 1h | Low | Illustration + CTA |
| Empty favorites state | 1h | Low | Similar to cart |
| ARIA audit | 4h | Medium | a11y foundation |
| PWA support | 6h | Low | Offline mode |

---

## Dependency Graph

```
P0-2 (Toast)
  ├─ P0-1 (Silent errors) ← Can't ship without this
  ├─ P0-4 (Search empty state)
  ├─ P0-5 (ErrorBoundary)
  ├─ P1-6 (Form validation)
  └─ P1-7 (Maintenance)

P0-3 (403 page)
  └─ Independent

P0-5 (ErrorBoundary)
  └─ Sentry setup (pre-requisite)

P1-6 (Form validation)
  ├─ P0-2 (Toast)
  └─ Independent otherwise

P1-9 (Theme consistency)
  └─ Independent (can do anytime)
```

---

## Sprint 1 Recommended Load

**Team of 3 Frontend Devs** (2 weeks)

### Week 1 (Days 1-5)
- **Dev 1:** P0-2 (Toast system) → 6h + testing 2h = 8h
- **Dev 2:** P0-1 (Silent errors cleanup) → 4h + testing 2h = 6h
- **Dev 3:** P0-3 (403 page) → 2h + P0-4 start (Search empty) → 1.5h = 3.5h

### Week 2 (Days 6-10)
- **Dev 1:** P1-6 (Form validation) → 8h (first 3h, refine based on P0 feedback)
- **Dev 2:** P0-5 (ErrorBoundary) → 3h + P1-7 (Maintenance) → 2h = 5h
- **Dev 3:** P0-4 finish (Search empty) → 1.5h + P1-8 (Network) → 2.5h = 4h

**Testing/QA:** 1 dev-day end of each week

---

## Success Metrics

**End of Sprint 1:**
- Silent error count: 0
- Toast coverage: 100% of API errors
- Page coverage: 4/4 pages (403, Maintenance, 500, Search empty)

**End of Sprint 2:**
- Form validation: 3+ forms with inline validation
- Accessibility: WCAG AA on all new components
- UX score target: 5.5 → 6.5+/10

**Post-Sprint:**
- Error reduction in Sentry: 30% improvement
- User satisfaction (form errors): +2 NPS points
- Search retry rate: +15%

---

## File Locations Cheat Sheet

```
New files to create:
  src/types/toast.ts
  src/context/ToastContext.tsx
  src/hooks/useToast.ts
  src/components/common/Toast.tsx
  src/components/common/NetworkStatus.tsx
  src/components/errors/Forbidden.tsx
  src/components/errors/Maintenance.tsx
  src/components/errors/SearchEmptyState.tsx
  src/validators/formValidators.ts
  src/hooks/useFormValidation.ts
  src/components/common/FormField.tsx

Files to modify:
  App.tsx (add Toast/Network providers)
  Router/Routes (add 403, Maintenance routes)
  src/pages/AdminSellers.tsx (fix catch blocks)
  src/pages/SellerSettings.tsx (fix catch blocks)
  src/pages/SearchResults.tsx (add empty state)

Next.js files:
  mercora-next/src/app/forbidden/page.tsx
  mercora-next/src/app/maintenance/page.tsx
  mercora-next/src/app/error.tsx (enhance)
```

---

**Last Updated:** 2026-05-23  
**Sprint Duration:** 2 weeks  
**Owner:** Engineering Manager  
**Review Cadence:** Daily standup + Friday retro
