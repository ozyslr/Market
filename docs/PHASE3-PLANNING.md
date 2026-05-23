# Phase 3 Planning
**Mercora E-commerce Platform - Maturation & Advanced Features**
**Estimated Timeline:** 3-4 weeks

---

## Strategic Focus

Phase 1 delivered **revenue infrastructure** (subscriptions, payments, checkout, auth).  
Phase 2 delivered **growth intelligence** and **conversion optimization**.  
Phase 3 delivers **content richness**, **advanced monetization**, **security hardening**, and **seller empowerment**.

**Key Objectives:**
1. Enable video reviews for higher conversion and trust
2. Introduce CPM brand advertising for additional revenue stream
3. Build advanced seller analytics and reporting
4. Implement 2FA for account security
5. Create seller insights dashboard for data-driven decisions

**Revenue Impact:** $85k/month target (+$40k/month from Phase 2)

---

## STREAM J: Video Reviews & Rich Content

**Impact:** Higher conversion (video reviews increase conversion 20-30%), increased trust signals

### Scope:
- Video upload and processing (MP4, WebM, max 30MB)
- Video transcoding to multiple bitrates (720p, 480p, 240p)
- Video thumbnail extraction
- Review video editing (trim, filters)
- Video moderation (automated + manual queue)
- Video analytics (views, helpful votes, watch time)
- Playback with adaptive bitrate streaming

### Deliverables:
1. `src/services/videoProcessingService.ts` — Video upload, transcoding, storage
2. `src/services/videoModerationService.ts` — Content moderation for videos
3. `src/components/review/VideoReviewUpload.tsx` — Video upload form with preview
4. `src/components/review/VideoPlayer.tsx` — HLS video player with adaptive bitrate
5. `src/components/review/VideoEditor.tsx` — Basic video trimming/filters
6. `src/app/api/reviews/video/upload/route.ts` — Video upload endpoint
7. `src/app/api/reviews/video/process/route.ts` — Async video processing
8. `src/app/api/reviews/video/moderate/route.ts` — Moderation queue endpoint
9. `src/app/admin/video-moderation/page.tsx` — Moderation dashboard

### Database:
- `reviews/{reviewId}` — Add `videoUrl`, `videoStatus`, `videoMetadata`, `videoDuration`
- `video_processing_jobs/{jobId}` — Track transcoding jobs (status, bitrates, duration)
- `video_moderation_queue/{videoId}` — Moderation task tracking
- `video_analytics/{videoId}` — Views, watch time, helpful votes per video

### Video Processing Flow:
1. User uploads video (max 30MB)
2. Store in Cloud Storage (Firestore max 1MB doc, use separate storage)
3. Trigger async transcoding job (720p, 480p, 240p)
4. Generate HLS playlist (.m3u8)
5. Extract thumbnail at 3-second mark
6. Queue for moderation (manual review if auto-flagged)
7. Publish when moderation complete

---

## STREAM K: Brand Advertising (CPM)

**Impact:** New revenue stream from brands, complementary to seller CPC ads

### Scope:
- Brand ad creation and management
- CPM (cost per mille) bidding
- Ad inventory management
- Placement options (homepage banner, category pages, search results)
- Brand analytics dashboard
- Ad approval workflow
- Budget management and pacing

### Deliverables:
1. `src/services/brandAdService.ts` — Brand ad management and bidding
2. `src/services/adInventoryService.ts` — Ad space inventory tracking
3. `src/services/adPerformanceService.ts` — Ad impression/click tracking
4. `src/components/ads/BrandAdBanner.tsx` — Ad banner display component
5. `src/components/ads/BrandAdManager.tsx` — Admin ad creation interface
6. `src/app/api/ads/brand/create/route.ts` — Create brand ad endpoint
7. `src/app/api/ads/brand/bid/route.ts` — Update CPM bid endpoint
8. `src/app/api/ads/inventory/check/route.ts` — Check ad availability
9. `src/app/admin/brand-ads/page.tsx` — Brand ad dashboard

### Database:
- `brand_ads/{adId}` — Ad metadata (title, image, link, CPM bid, status)
- `ad_placements/{placementId}` — Available ad slots (homepage, category, search)
- `ad_impressions/{impressionId}` — Track views (brand, placement, user segment)
- `ad_clicks/{clickId}` — Track clicks with conversion data
- `brand_budgets/{brandId}` — Daily/monthly spending and pacing

### Ad Placement Strategy:
- **Homepage Banner**: 3 slots, rotate CPM highest bidder
- **Category Pages**: 1 slot per category, relevant to category CPM highest
- **Search Results**: 2 top placements (above organic), branded keyword CPM
- **Product Pages**: Side banner (non-intrusive)

---

## STREAM L: Advanced Seller Analytics

**Impact:** Enables data-driven decision making, justifies Pro/Enterprise tiers

### Scope:
- Product performance metrics (views, clicks, adds to cart, conversions)
- Sales forecasting and trend analysis
- Customer segmentation by behavior
- Repeat purchase analysis
- Price elasticity insights
- Competitor benchmarking (anonymized)
- Inventory health scoring
- Attribution analysis (which promotions drive sales)

### Deliverables:
1. `src/services/sellerAnalyticsService.ts` — Advanced analytics aggregation
2. `src/services/forecastingService.ts` — Sales forecasting with time series
3. `src/services/competitorBenchmarkService.ts` — Anonymized competitor metrics
4. `src/components/seller/ProductPerformance.tsx` — Product-level metrics
5. `src/components/seller/SalesForecasting.tsx` — Forecast chart with ML
6. `src/components/seller/CustomerSegmentation.tsx` — Customer segment analysis
7. `src/components/seller/InventoryHealth.tsx` — Inventory scoring and alerts
8. `src/components/seller/CompetitorBenchmark.tsx` — Competitive positioning
9. `src/app/seller/analytics/advanced/page.tsx` — Advanced analytics hub

### Database:
- `seller_product_metrics/{sellerId}/{productId}` — Daily metrics rollup
- `seller_forecasts/{sellerId}/{productId}` — Forecast data (7d, 30d, 90d ahead)
- `customer_segments/{sellerId}/{segmentId}` — Seller's customer segments
- `inventory_health_scores/{sellerId}/{productId}` — Inventory scoring
- `competitor_benchmarks/{sellerId}` — Anonymized category benchmarks

### Metrics Tracked:
- **Product Level**: Views, CTR, add-to-cart rate, conversion rate, average order value
- **Customer Level**: Lifetime value, repeat purchase rate, segment membership, cohort
- **Sales Level**: Revenue by day/week/month, seasonality, category performance
- **Inventory**: Days to stockout, turnover rate, dead stock % 

---

## STREAM M: Two-Factor Authentication (2FA)

**Impact:** Security hardening, especially for high-value accounts (sellers, enterprise)

### Scope:
- TOTP (Time-based One-Time Password) via authenticator apps
- SMS OTP fallback
- Email verification code backup
- Device trust tokens (remember this device for 30 days)
- 2FA enforcement policies (optional for users, mandatory for sellers)
- Recovery codes (10 backup codes, single-use)
- 2FA audit log (login attempts, failed 2FA)

### Deliverables:
1. `src/services/twoFactorService.ts` — 2FA management and verification
2. `src/services/totp/index.ts` — TOTP generation and verification
3. `src/components/auth/TwoFactorSetup.tsx` — Initial 2FA setup flow
4. `src/components/auth/TwoFactorVerify.tsx` — 2FA verification during login
5. `src/components/auth/RecoveryCodes.tsx` — Recovery code display/download
6. `src/app/api/auth/2fa/setup/route.ts` — Enable 2FA endpoint
7. `src/app/api/auth/2fa/verify/route.ts` — Verify 2FA code endpoint
8. `src/app/api/auth/2fa/disable/route.ts` — Disable 2FA endpoint
9. `src/app/settings/security/2fa/page.tsx` — 2FA management page

### Database:
- `users/{userId}` — Add `twoFactorEnabled`, `twoFactorMethod`, `totp_secret`
- `two_factor_backup_codes/{userId}` — Encrypted backup codes (10 per user)
- `trusted_devices/{deviceId}` — Device tokens (fingerprint, last used, trust expiry)
- `auth_audit_log/{logId}` — 2FA events (setup, verify, disable, failed attempts)

### 2FA Enforcement Policy:
- **Users**: Optional, recommended during signup
- **Sellers (Pro+ tier)**: Mandatory after 30-day grace period
- **Admin users**: Mandatory immediately

---

## Implementation Strategy

### Phase 3.1: Video Reviews (Week 1-2)
1. Video upload form and preview
2. Async transcoding pipeline (Cloud Tasks or Bull queue)
3. HLS playlist generation
4. Video player with adaptive bitrate
5. Moderation queue and dashboard
6. Video analytics integration

### Phase 3.2: Brand Advertising (Week 2-3)
1. Ad creation and management interface
2. CPM bidding system
3. Ad placement and rotation logic
4. Impression/click tracking
5. Brand analytics dashboard
6. Budget and pacing controls

### Phase 3.3: Advanced Analytics (Week 2-4)
1. Product performance metrics aggregation
2. Sales forecasting model (Prophet/LSTM)
3. Customer segmentation engine
4. Competitor benchmarking anonymization
5. Inventory health scoring
6. Seller analytics dashboard pages

### Phase 3.4: 2FA Security (Week 3-4)
1. TOTP generation and verification
2. SMS OTP fallback
3. Recovery codes generation
4. Device trust mechanism
5. 2FA setup and management UI
6. Login flow integration

---

## Success Metrics

### Video Reviews
- Video review adoption rate: >15% of reviews include video
- Video watch time: avg 45+ seconds per video
- Video conversion lift: 20-30% higher conversion vs text-only
- Moderation queue completion: <24 hour turnaround

### Brand Advertising
- CPM rates: $2-5 per thousand impressions
- Monthly brand ad revenue: $20-30k
- Fill rate: >80% of available inventory sold
- Brand satisfaction score: 4.5+/5

### Advanced Analytics
- Seller dashboard adoption: >50% of Pro+ tier
- Forecast accuracy: >85% for 7-day forecasts
- Competitor benchmark usage: >30% of sellers check monthly
- Feature usage: >40% monthly active rate

### 2FA
- 2FA adoption rate: >25% of voluntary users
- Seller 2FA compliance: >90% within 30-day deadline
- Failed login recovery: >95% user can recover
- Support tickets related to 2FA: <2% of total

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Video transcoding costs | High | Implement quality tiers; use on-demand transcoding; set max file size |
| Video moderation scale | High | Use ML classifier + manual queue; implement batch processing |
| CPM auction complexity | Medium | Start with simple highest-bid winner; gradual optimization |
| Forecasting model accuracy | Medium | Use ensemble models; start with simpler models; human review |
| 2FA user friction | Medium | Optional initially; gradual enforcement; recovery mechanisms |
| Seller analytics complexity | Low | Start with high-impact metrics; dashboard customization phase 4 |

---

## Dependencies

### External Services:
- Video transcoding: Firebase Cloud Storage + Cloud Tasks, or ffmpeg worker
- TOTP: speakeasy or similar library
- SMS: Twilio or Vonage
- Forecasting: TensorFlow.js, Prophet.js, or API-based service
- Analytics: Aggregation via Firestore queries + Dataflow for scale

### Internal Dependencies:
- Phase 2 auth system (user sessions, login flow)
- Phase 2 analytics (event tracking infrastructure)
- Phase 1 payment system (brand budgets)
- Firestore collections (users, reviews, sellers)

---

## Database Schema Additions

### Video Reviews
```firestore
reviews/{reviewId}
  ├── videoUrl: string
  ├── videoStatus: 'uploading' | 'processing' | 'moderation_pending' | 'approved' | 'rejected'
  ├── videoMetadata:
  │   ├── duration: number
  │   ├── resolution: string
  │   ├── fileSize: number
  │   └── thumbnail: string
  └── videoDuration: number

video_processing_jobs/{jobId}
  ├── reviewId: string
  ├── status: 'queued' | 'transcoding' | 'generating_playlist' | 'complete'
  ├── bitrates: ['720p', '480p', '240p']
  ├── progress: number (0-100)
  └── createdAt: timestamp

video_analytics/{videoId}
  ├── views: number
  ├── helpfulVotes: number
  ├── avgWatchTime: number
  └── playbackQuality: { '720p': number, '480p': number, '240p': number }
```

### Brand Advertising
```firestore
brand_ads/{adId}
  ├── brandId: string
  ├── title: string
  ├── imageUrl: string
  ├── landingUrl: string
  ├── cpmBid: number
  ├── dailyBudget: number
  ├── status: 'draft' | 'active' | 'paused' | 'rejected'
  ├── placements: ['homepage', 'category', 'search']
  └── createdAt: timestamp

ad_impressions/{impressionId}
  ├── adId: string
  ├── userId: string
  ├── placement: string
  ├── segment: string
  └── timestamp: timestamp

ad_clicks/{clickId}
  ├── adId: string
  ├── userId: string
  ├── placement: string
  └── timestamp: timestamp
```

### 2FA
```firestore
users/{userId}
  ├── twoFactorEnabled: boolean
  ├── twoFactorMethod: 'totp' | 'sms' | 'email'
  ├── totp_secret: string (encrypted)
  └── twoFactorBackupCodesHash: [string] (hashed)

trusted_devices/{deviceId}
  ├── userId: string
  ├── deviceFingerprint: string
  ├── lastUsed: timestamp
  ├── trustedUntil: timestamp
  └── ipAddress: string

auth_audit_log/{logId}
  ├── userId: string
  ├── event: 'setup_2fa' | 'verify_2fa' | 'disable_2fa' | 'failed_2fa'
  ├── ipAddress: string
  └── timestamp: timestamp
```

---

## Resource Allocation

**Estimated Effort:**
- Video Reviews: 4-5 days (video processing, moderation, player)
- Brand Advertising: 3-4 days (bidding, inventory, tracking)
- Advanced Analytics: 4-5 days (metrics, forecasting, dashboard)
- 2FA Security: 3-4 days (TOTP, SMS, UI, enforcement)
- **Total: 14-18 days** (~3.5-4 weeks with integration)

**Team Structure:**
- 2 Backend engineers (video processing, analytics, ad system)
- 1 Frontend engineer (dashboards, UX components)
- 1 ML/Data engineer (forecasting, analytics)
- 1 DevOps (infrastructure for video, Cloud Tasks)

---

## Acceptance Criteria

### Video Reviews Feature
- [ ] Users can upload videos (max 30MB, MP4/WebM)
- [ ] Videos transcode to 3 bitrates within 5 minutes
- [ ] HLS player plays adaptive bitrate without buffering
- [ ] Moderation dashboard shows flagged videos within <24h
- [ ] Video metrics tracked (views, watch time, helpful votes)

### Brand Advertising
- [ ] Brands can create ads with title, image, link, CPM bid
- [ ] Ad slots rotate by CPM highest bidder
- [ ] Impressions and clicks tracked accurately
- [ ] Brand dashboard shows performance metrics
- [ ] Daily budget pacing enforced

### Advanced Analytics
- [ ] Seller sees product performance (views, conversions, revenue)
- [ ] Sales forecast calculated for 7/30/90 days ahead
- [ ] Customer segments auto-created by behavior
- [ ] Competitor benchmarks available (anonymized)
- [ ] Inventory health score calculated and displayed

### 2FA Security
- [ ] Users can enable TOTP via authenticator app
- [ ] SMS OTP sent as fallback method
- [ ] Recovery codes generated and downloadable
- [ ] Device trust tokens work (30-day expiry)
- [ ] Failed 2FA attempts logged to audit trail

---

**Status:** Ready for Phase 3 approval ✅
