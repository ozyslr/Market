# Mercora UX Design Summary
## P0 Component Library & Sprint Roadmap

**Prepared by:** UX/UI Designer 1  
**Date:** 2026-05-23  
**Target Audience:** Design + Product + Engineering  
**Document Chain:** UX-DESIGN-SPECIFICATION → UX-IMPLEMENTATION-GUIDE → UX-PRIORITY-MATRIX

---

## Overview

Mercora's UX maturity is **5.5/10** (vs Trendyol's 9.2/10, Amazon's 8.5/10). While skeleton screen infrastructure is strong, **critical gaps in error handling** are causing user trust erosion. This package provides:

1. **Component Library** (4 error pages, 2 feedback systems)
2. **Implementation Guides** (code examples, patterns)
3. **Sprint Roadmap** (5 P0 + 4 P1 tasks, 2-week timeline)

---

## Key Findings

### Critical Issues (P0)

| Issue | Impact | Why | Fix |
|-------|--------|-----|-----|
| **Silent errors** | CRITICAL | `.catch(() => {})` blocks swallow API failures | Replace with Toast notifications |
| **No 403 page** | HIGH | Users stuck on errors accessing admin | New page + middleware redirect |
| **No error feedback** | HIGH | Form errors only shown on submit | Add real-time inline validation |
| **Search empty state** | MEDIUM | 0 results = blank page, no guidance | Alternatives + categories + suggestions |
| **Weak error boundary** | HIGH | Generic "error occurred" → no actionable info | Error ID + auto-redirect + tips |

### Current Strengths to Preserve

- **Skeleton screens:** 6 variants (ProductCard, Grid, Detail, etc.) — Trendyol-level
- **404 page:** Markedited, multi-router support
- **Error boundary:** Sentry integration works, just needs UI enhancement

---

## Component Deliverables

### Core Error Pages (3)

```
403 Forbidden           404 Not Found              500 Server Error
┌──────────────┐      ┌──────────────┐          ┌──────────────┐
│ Shield Icon  │      │ 404 Large    │          │ 500 Large    │
│ "Erişim Red" │      │ "Sayfa Bulunamadı"     │ "Sunucu Hata" │
│ [Ana Sayfa]  │      │ [Ana Sayfa]  │         │ [Ana Sayfa]   │
└──────────────┘      └──────────────┘         └──────────────┘
```

**New:** 403, 500 enhanced  
**Existing:** 404 (refresh with new design)

### Feedback Systems (2)

```
Toast Notification        Network Status Banner
┌────────────────────┐   ┌───────────────────────┐
│ ✕ Hata Oluştu     │   │ ⚠ Çevrimdışısınız    │
│ "Yükleme başarısız │   │ [Tekrar Dene]        │
│ [Yenile] [Kapat]  │   └───────────────────────┘
└────────────────────┘
```

**Toast variants:** Error, Success, Warning, Info  
**Network states:** Offline, Reconnecting, Degraded

### Form Validation

```
Field States:
  Pristine (no validation)
  → Focused (cursor, no error)
  → Valid ✓ (green border)
  → Invalid ✗ (red border + message)
  → Validating ⟳ (async check)

Validators: required, email, phone, minLength, asyncEmailUnique
```

### Bonus: Maintenance Page

```
┌──────────────────┐
│ 🔧 (animated)    │
│ Bakım Modu       │
│ ETA: 22:30 (5m)  │
│ [İletişim] [ETA] │
└──────────────────┘
```

---

## Implementation Effort

| Component | Lines | Time | Complexity | Owner |
|-----------|-------|------|-----------|-------|
| Toast system | 150 | 6h | Low-Medium | Lead |
| Fix silent errors | 50 | 4h | Low | Any |
| 403 page | 40 | 2h | Low | Junior |
| Search empty state | 60 | 3h | Medium | Mid |
| ErrorBoundary enhance | 80 | 3h | Medium | Senior |
| Form validation | 200 | 8h | High | Lead+Mid |
| Maintenance page | 50 | 2h | Low | Junior |
| Network status | 40 | 2.5h | Low | Junior |
| **Total P0/P1** | **620** | **30.5h** | **Medium** | **3 devs** |

**Estimate:** 2 weeks with 3 frontend developers  
**Ideal team:** 1 lead (P0-2, P1-6) + 2 mid/junior (P0-1,3,4,5 + P1-7,8)

---

## File Manifest

### New Components
```
src/
├── components/
│   ├── common/
│   │   ├── Toast.tsx (100 lines)
│   │   ├── NetworkStatus.tsx (40 lines)
│   │   ├── FormField.tsx (80 lines)
│   │   └── ErrorFallback.tsx (80 lines)
│   └── errors/
│       ├── Forbidden.tsx (60 lines)
│       ├── Maintenance.tsx (50 lines)
│       └── SearchEmptyState.tsx (80 lines)
├── context/
│   └── ToastContext.tsx (50 lines)
├── hooks/
│   ├── useToast.ts (20 lines)
│   └── useFormValidation.ts (80 lines)
└── validators/
    └── formValidators.ts (40 lines)
```

### Modified Files
```
src/
├── App.tsx (add Toast + Network providers)
├── index.tsx or main.tsx (update providers)
├── pages/
│   ├── AdminSellers.tsx (fix .catch blocks)
│   ├── SellerSettings.tsx (fix .catch blocks)
│   ├── SearchResults.tsx (integrate empty state)
│   └── OrderTracking.tsx (fix .catch blocks)
└── components/
    ├── SellerImportCenter.tsx (fix .catch blocks)
    └── Checkout.tsx (add form validation)

mercora-next/src/app/
├── error.tsx (enhance fallback)
└── (new routes)
    ├── forbidden/page.tsx
    └── maintenance/page.tsx
```

**Total new files:** 9  
**Total modified files:** 8

---

## Rollout Timeline

### **Week 1: Foundation (P0 foundation)**

| Day | Task | Owner | Status |
|-----|------|-------|--------|
| 1 | Build Toast system | Lead | Blocks P0-1,4,5 |
| 1-2 | Fix silent errors (4 files) | Dev1 | Depends on Toast |
| 2 | 403 page | Junior | Independent |
| 2 | Start search empty state | Mid | Independent |
| 3-4 | ErrorBoundary enhance | Senior | Sentry required |
| 4-5 | Testing + refinement | QA | All P0 |

**Gate:** All P0 tasks completed with QA sign-off before Sprint 2

### **Week 2: Enhancement (P1 + finish P0)**

| Day | Task | Owner | Status |
|-----|------|-------|--------|
| 6 | Finish search empty state | Mid | From W1 |
| 6-7 | Form validation (3 forms) | Lead+Mid | P0 complete |
| 7 | Maintenance page | Junior | Independent |
| 8 | Network status component | Junior | Independent |
| 8-9 | Testing all P0+P1 | QA | Integration tests |
| 9-10 | Documentation + training | Lead | Developer guide |

**Gate:** All components QA'd, documentation complete, ready for feature freeze

---

## Design System Values

### Colors
- **Error:** #ef4444 (red-500)
- **Success:** #22c55e (green-500)
- **Warning:** #eab308 (yellow-500)
- **Info:** #3b82f6 (blue-500)

### Typography
- **Headings (error pages):** 24px bold
- **Body copy:** 16px regular
- **Field labels:** 14px semibold
- **Error messages:** 14px red-600

### Spacing
- Toast margin-top: 24px
- Form field margin-bottom: 16px
- Page padding: 24px (desktop) / 16px (mobile)

### Animations
- Toast slide-in: 300ms
- Skeleton shimmer: 1.5s infinite
- Field focus: 150ms subtle border color change

---

## Success Metrics

### Immediate (End of Sprint)
- [ ] Error tracking: 0 silent `.catch()` blocks
- [ ] Component coverage: 4/4 error pages
- [ ] Toast fired on every API error
- [ ] Forms show real-time validation

### 30-Day (Post-Sprint)
- [ ] Sentry error rate down 20%
- [ ] Form submission success rate up 5%
- [ ] Search retry rate down 10% (better empty state)
- [ ] Support tickets related to errors down 25%

### Long-Term (End of Q2)
- [ ] UX score: 5.5 → 7.0+ out of 10
- [ ] Mobile error rate < 2%
- [ ] User satisfaction (forms): +3 NPS points

---

## Testing Checklist

### Unit Tests
- [ ] Toast appears/disappears correctly
- [ ] Validators return correct errors
- [ ] Form state updates on change
- [ ] Network status toggles correctly

### Integration Tests
- [ ] API error → Toast appears
- [ ] Form submission blocks on errors
- [ ] 403 redirect on unauthorized access
- [ ] Maintenance page shows when flag enabled

### Manual Testing
- [ ] Disable WiFi → Network banner appears
- [ ] Submit invalid form → Errors highlight fields
- [ ] Trigger 500 error → Error boundary captures + shows
- [ ] Search with 0 results → Empty state appears

### Accessibility Testing
- [ ] Screen reader announces toasts
- [ ] Keyboard navigation works (Tab, Escape)
- [ ] Color contrast ≥ 4.5:1
- [ ] Focus visible on all controls

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Toast context not available | Low | Block other P0s | Prop-drill pattern + error boundary |
| Silent errors still missed | Medium | Incomplete fix | Code review + grep verification |
| Form validation breaks submission | Low | User blockers | Unit + integration test coverage |
| Theme mismatch persists | Medium | Visual regression | CSS variable audit + linting rule |
| Mobile layout breaks | Medium | Poor UX | Responsive testing on 3+ devices |

---

## Documentation Reference

**Full specifications:**
- `UX-DESIGN-SPECIFICATION.md` (wireframes, component details, messaging)
- `UX-IMPLEMENTATION-GUIDE.md` (code examples, patterns, testing)
- `UX-PRIORITY-MATRIX.md` (task breakdown, dependencies, team load)

**Quick links:**
- Toast usage: Search "Toast Usage" in Implementation Guide
- Form validation: Search "Form Validation Basics"
- Error handling: Search "Using Toast in Data Fetching"

---

## Handoff Checklist

Before handing to team:

- [ ] All 3 docs reviewed by engineering lead
- [ ] Team creates Jira epics + tasks from Priority Matrix
- [ ] Assign owners to each P0/P1 task
- [ ] Schedule design review (day 2)
- [ ] Set up daily standups (10m)
- [ ] Create testing spreadsheet
- [ ] Prepare demo script for stakeholders

---

## Sign-Off

- **Design Lead:** _______________  Date: _____
- **Engineering Manager:** _______________  Date: _____
- **Product Manager:** _______________  Date: _____

---

**Version:** 1.0  
**Status:** Ready for Implementation  
**Last Updated:** 2026-05-23  

**Next Steps:**
1. Review this summary with engineering team (30 min)
2. Assign tasks from Priority Matrix (1 hour)
3. Kickoff Sprint 1 standup (10 min daily)
4. Report progress Friday (retro)
