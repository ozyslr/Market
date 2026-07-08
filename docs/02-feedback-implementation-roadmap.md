# Feedback UX Specification - Implementation Roadmap

**Project:** Mercora Platform  
**Component:** Feedback & Rating Systems  
**Specification Version:** 1.0  
**Created:** 2026-05-23  
**Sprint Target:** Sprint 1-2 Delivery

---

## Executive Summary

This specification delivers **4 P0 feedback system enhancements** that raise Mercora's feedback infrastructure from 5.0/10 to 8.0/10 maturity, matching competitors (Hepsiburada, Trendyol, Amazon TR).

**Impact:** +3-5x review volume, +%40 user engagement, -%80 moderation workload, +buyer trust

---

## Documents Overview

### 1. **02-feedback-ux-specification.md** (3-4 pages)
**Purpose:** Strategic roadmap with screens, user flows, and technical architecture

**Contents:**
- Current Mercora feedback system analysis (5.0/10 score breakdown)
- P0 gaps: video reviews, AI moderation, auto-requests, seller ratings page
- 4 detailed feature specs with:
  - User journey flows
  - Screen mockups (ASCII diagrams)
  - Component integration points
  - Service layer modifications
  - Database schema additions
- Sprint 1-2 task breakdown (workload estimates)
- Moderation workflow diagram
- Technical stack requirements

**Key Artifacts:**
- ReviewForm video upload UI
- ReviewCard video player integration
- moderationService Claude API implementation
- Cloud Scheduler review request automation
- /seller/:id/reviews page spec

---

### 2. **02-feedback-component-integration.md** (2-3 pages)
**Purpose:** Implementation guide with code samples, interfaces, and state management

**Contents:**
- Component props interfaces (TypeScript)
- State management patterns
- Validation utilities (video constraints)
- Video processing helpers
- Claude API moderation integrations
- Component directory structure
- Firestore indices and schema
- CSS/styling guide for video player and seller reviews page

**Key Artifacts:**
- ReviewFormProps & ReviewWithVideo interfaces
- VideoPlayer component with controls
- ReviewCard updated with video playback
- ModerationCheckResult types
- SellerReviewService with stats caching
- Directory structure for new components

---

### 3. **02-feedback-implementation-roadmap.md** (This doc)
**Purpose:** Navigation guide linking specs to implementation, task tracking, and dependencies

---

## P0 Feature Breakdown

### P0-1: Video Yorum Destegi (Video Review Support)
**Status:** Specification Complete  
**Effort:** 9 days  
**Sprint:** 1 (Week 1-2)

**Files to Modify:**
- `src/components/product/ReviewForm.tsx` (video upload section)
- `src/components/product/ReviewCard.tsx` (video player)
- `src/services/reviewService.ts` (storage + metadata)
- `src/types.ts` (ReviewWithVideo interface)

**New Files:**
- `src/components/product/VideoPlayer.tsx` (reusable component)
- `src/utils/videoValidation.ts` (validation helpers)

**Key Decisions:**
- Max 30 seconds, MP4/WebM, 50MB limit
- Firebase Storage for video files
- Firestore metadata (videoUrl, videoDuration)
- Inline video player on ReviewCard

**Spec Reference:** 02-feedback-ux-specification.md Section 2

---

### P0-2: AI Yorum Moderasyonu (AI Moderation)
**Status:** Specification Complete  
**Effort:** 10 days  
**Sprint:** 1 (Week 1-2)

**Files to Modify:**
- `src/services/reviewService.ts` (moderation gate)
- Admin dashboard (flagged reviews UI)

**New Files:**
- `src/services/moderationService.ts` (main orchestrator)
- `src/services/claudeModeration.ts` (Claude API calls)
- `src/pages/AdminModerationDashboard.tsx` (UI)

**Key Decisions:**
- Claude Haiku for real-time moderation (fast + cheap)
- 4-check strategy: spam, profanity, fraud, relevance
- Score-based decision: >=0.8 auto-approve, 0.5-0.8 flag, <0.5 reject
- Admin dashboard for human review of flagged items
- PII redaction in storage

**Spec Reference:** 02-feedback-ux-specification.md Section 3

---

### P0-3: Otomatik Yorum İsteme (Auto Review Requests)
**Status:** Specification Complete  
**Effort:** 7 days  
**Sprint:** 2 (Week 3-4)

**Files to Modify:**
- Order completion workflow (trigger)
- Notification service (email + push)

**New Files:**
- `src/services/reviewRequestService.ts` (automation)
- Firebase Cloud Function + Cloud Scheduler config

**Key Decisions:**
- Trigger: 3 days after delivery status
- Channels: Email + Push notification + in-app badge
- Cloud Scheduler (daily 9 AM) for reliability
- Idempotent: skip if review already exists
- User tracking (reviewRequests collection)

**Spec Reference:** 02-feedback-ux-specification.md Section 4

---

### P0-4: Satici Puanlama Sayfasi (Seller Ratings Page)
**Status:** Specification Complete  
**Effort:** 9 days  
**Sprint:** 2 (Week 3-4)

**Files to Modify:**
- Seller profile layout routing

**New Files:**
- `mercora-next/src/app/seller/[id]/reviews/page.tsx` (route)
- `src/components/seller/SellerReviewsPage.tsx` (orchestrator)
- `src/components/seller/SellerRatingSummary.tsx` (stats card)
- `src/components/seller/SellerPerformanceMetrics.tsx` (metrics)
- `src/components/seller/SellerReviewFilters.tsx` (filters UI)
- `src/services/sellerReviewService.ts` (aggregations + caching)

**Key Decisions:**
- URL: `/seller/:sellerId/reviews`
- Aggregated stats: cached daily (Firestore subcollection)
- Star distribution chart + performance metrics
- Same filters as product reviews (sort, rating, verified, images)
- Pagination: 10 reviews/page
- Query indices: Firestore composite indices for filtering

**Spec Reference:** 02-feedback-ux-specification.md Section 5

---

## Implementation Sequence

### Sprint 1: Core Feedback Features (9+10 = 19 days)

**Week 1:**
```
Day 1-2:   P0-1 ReviewForm video UI + validation
Day 3-4:   P0-1 Firebase Storage integration
Day 5:     P0-1 ReviewCard video player component
Day 6-9:   P0-2 moderationService (spam/profanity/fraud/relevance checks)
Day 10:    P0-2 Claude API integration + prompt tuning
```

**Week 2:**
```
Day 11-13: P0-2 Admin dashboard for flagged reviews
Day 14:    P0-2 Notification workflow (approved/rejected)
Day 15-19: Testing, bug fixes, performance optimization
```

**Deliverables:**
- Video reviews shown on product pages (40% engagement lift)
- Auto-moderation catching 80% of spam/fraud (admin workload -80%)
- Seamless review submission-to-display workflow

---

### Sprint 2: Engagement & Trust Features (7+9 = 16 days)

**Week 3:**
```
Day 1-3:   P0-3 reviewRequestService + Cloud Scheduler
Day 4:     P0-3 Email/push notification templates
Day 5-7:   P0-4 Seller reviews page component structure
Day 8-9:   P0-4 SellerRatingSummary aggregation + caching
```

**Week 4:**
```
Day 10-12: P0-4 SellerPerformanceMetrics + filters UI
Day 13-14: P0-4 Firestore indices + query optimization
Day 15-16: Testing, QA, performance tuning
```

**Deliverables:**
- Auto review requests 3 days post-delivery (+3-5x review volume)
- Seller ratings page with trust metrics (boosts buyer confidence)
- All 4 P0 features production-ready

---

## Database Schema Changes

### Firestore Collections Modified

```javascript
// reviews/{reviewId}
{
  ...existingFields,
  videoUrl: "gs://bucket/reviews/...",       // NEW
  videoDuration: 28.5,                        // NEW (seconds)
  status: "approved|flagged|rejected",        // CHANGED: added flagged
  moderationResults: [                        // NEW
    {
      id: "check_spam",
      category: "spam",
      score: 0.95,
      approved: true,
      reasons: []
    }
  ],
  moderatedAt: Timestamp,                     // NEW
  moderatedBy: "system|admin_name"            // NEW
}

// sellers/{sellerId}/stats/reviews
{
  sellerId: "seller_123",
  totalReviews: 2341,
  averageRating: 4.5,
  ratingDistribution: { 5: 1404, 4: 585, 3: 234, 2: 70, 1: 48 },
  avgShipSpeed: 2.1,
  compliance: 98.5,
  responseRate: 95,
  lastUpdated: Timestamp
}

// reviewRequests/{requestId}
{
  userId: "user_123",
  orderId: "order_456",
  productId: "product_789",
  sentAt: Timestamp,
  status: "sent|clicked|reviewed"
}
```

### Composite Indices Required

```yaml
# Firestore Composite Indices
- collectionName: reviews
  fields:
    - name: sellerId
      direction: ASCENDING
    - name: status
      direction: ASCENDING
    - name: createdAt
      direction: DESCENDING

- collectionName: reviews
  fields:
    - name: sellerId
      direction: ASCENDING
    - name: rating
      direction: ASCENDING
    - name: status
      direction: ASCENDING

- collectionName: reviews
  fields:
    - name: sellerId
      direction: ASCENDING
    - name: verifiedPurchase
      direction: ASCENDING
    - name: createdAt
      direction: DESCENDING
```

---

## External Dependencies

| Service | Purpose | Cost | Notes |
|---------|---------|------|-------|
| Claude API (Haiku) | Real-time moderation | ~$0.50/1K reviews | Fast inference, cost-effective |
| Firebase Storage | Video file hosting | ~$0.02/GB | Scalable, CDN integrated |
| Cloud Functions | Review request scheduler | ~$0.40/1M invocations | Minimal cost at scale |
| Cloud Scheduler | Cron jobs | Free (1st 3 free, then $0.10/job) | Daily 9 AM run |
| SendGrid (optional) | Email delivery | ~$20-40/mo | Or Firebase email service |

---

## Testing Strategy

### Unit Tests
- Video validation helpers (duration, size, format)
- Moderation score aggregation
- Stats calculation (avg rating, distribution)

### Integration Tests
- ReviewForm → Storage → Firestore flow
- moderationService → Claude API
- Review request scheduler trigger
- Seller stats aggregation + caching

### End-to-End Tests
- User submits video review → moderation → display
- Order marked delivered → 3-day delay → review request sent
- Navigate to /seller/123/reviews → stats + reviews load

### Performance Tests
- Video upload (target: <2s for 30MB)
- Moderation API latency (target: <1s)
- Seller stats query (target: <500ms with cache)

---

## Rollout Strategy

### Canary Rollout (Week 1-2)
- 10% of users get video review capability
- Monitor: upload success rate, video playback errors, moderation accuracy
- Threshold: 99% success rate before wider rollout

### Full Rollout (Week 3-4)
- 100% video review feature enabled
- Auto review requests start for all users (3 days post-delivery)
- Seller reviews page available for all sellers

### Monitoring
- CloudWatch metrics: video uploads, moderation decisions, review request delivery
- Admin dashboard: flagged review queue, stats freshness
- User feedback: survey sellers and buyers on new features

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Video upload failures | Retry logic + fallback to image-only reviews |
| Claude API rate limits | Queue system with batch processing |
| Moderation false positives | Human review queue + user appeal mechanism |
| Scheduler missing deliveries | Retry logic + email alert if queue backlog |
| Stats calculation lag | Cache + background aggregation job |

---

## Success Metrics

| Metric | Target | Baseline |
|--------|--------|----------|
| Video review upload rate | >15% of reviews | 0% |
| Moderation accuracy | >95% precision | 0% (manual only) |
| Auto-approved reviews | >80% | 0% |
| Review volume increase | +300% | Current rate |
| Seller ratings page engagement | >20% of product visitors | N/A (new feature) |
| Time to first review | <7 days (from 14 days) | 14 days |

---

## Next Steps (Action Items)

1. **Design Review** (1 day)
   - Stakeholder sign-off on screens + flows
   - Confirm Claude API budget

2. **Setup Phase** (1-2 days)
   - Create Firestore indices
   - Set up Claude API access + rate limits
   - Configure Cloud Scheduler

3. **Sprint 1 Development** (10 days)
   - Video review feature
   - AI moderation pipeline

4. **Sprint 2 Development** (8 days)
   - Auto review requests
   - Seller ratings page

5. **QA + Launch** (3-5 days)
   - Canary testing
   - Full rollout

---

## Document References

**Core Specifications:**
- **02-feedback-ux-specification.md** — Feature specs, screens, user flows
- **02-feedback-component-integration.md** — Implementation details, code samples, styling

**Existing Code Base:**
- `src/services/reviewService.ts` — Review CRUD operations
- `src/components/product/ReviewForm.tsx` — Current form UI
- `src/components/product/ReviewCard.tsx` — Current review display
- `src/services/notificationService.ts` — Push/email integration

**Configuration:**
- `.env` — Add ANTHROPIC_API_KEY for Claude
- `firebase.json` — Cloud Function configuration
- `firestore.indexes.json` — Composite indices

---

**Owner:** UX/UI Tasarımcısı 2  
**Approval:** PM, Engineering Lead  
**Last Updated:** 2026-05-23  
**Status:** Ready for Sprint Planning
