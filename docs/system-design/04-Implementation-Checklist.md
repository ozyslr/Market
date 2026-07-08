# Implementation Checklist — CPC Ad Engine MVP

**Sprint 1-2 Task Breakdown | Ready for Jira/Asana**

---

## Phase 1: Database Setup (Sprint 1, Week 1)

### Firestore Collections & Indexes

- [ ] Create `adCampaigns` collection
  - [ ] Add documents: `{campaignId}` with fields: id, sellerId, name, status, dailyBudget, currency, metadata
  - [ ] Add Firestore index: `(status, sellerId)` for fast campaign list queries

- [ ] Create `adCampaigns/{campaignId}/adGroups` subcollection
  - [ ] Add documents: `{adGroupId}` with fields: campaignId, productId, defaultBid, status, metadata
  - [ ] Test subcollection queries

- [ ] Create `adCampaigns/{campaignId}/adGroups/{adGroupId}/keywords` subcollection
  - [ ] Add documents: `{keywordId}` with fields: keyword, matchType, bid, isNegative, status, stats
  - [ ] Add Firestore composite index: `(matchType, keyword, status)` for GSP auction

- [ ] Create root collection: `adImpressions`
  - [ ] Add documents: `{impressionId}` with fields: adGroupId, searchQuery, position, userId, timestamp, source
  - [ ] Add Firestore index: `(campaignId, timestamp)` for daily stats aggregation

- [ ] Create root collection: `adClicks`
  - [ ] Add documents: `{clickId}` with fields: impressionId, campaignId, cost, timestamp, conversionData
  - [ ] Add Firestore index: `(campaignId, timestamp)` for budget tracking

- [ ] Create root collection: `adBudgetTracking`
  - [ ] Add documents: `{sellerId}_{date}` with fields: totalDailySpend, campaignSpends, budgetStatus
  - [ ] Add Firestore index: `(sellerId, date)` for seller dashboard

- [ ] Create root collection: `searchAuctionState` (cache)
  - [ ] Add documents: `{searchQueryHash}` with fields: query, activeBids, ttl, updatedAt
  - [ ] Add TTL policy: auto-delete after 300 seconds

- [ ] Set up Firestore security rules
  - [ ] Restrict campaign access to seller only
  - [ ] Allow anonymous impressions/clicks
  - [ ] Read-only access to analytics

**Effort:** 2-3 days | **Owner:** Database Engineer

---

## Phase 2: Backend Services (Sprint 1, Week 1-2)

### SponsoredProductService

- [ ] Create file: `src/services/sponsoredProductService.ts`
- [ ] Implement `createCampaign(sellerId, campaignData)`
  - [ ] Validate dailyBudget > 0
  - [ ] Set status = 'active'
  - [ ] Return campaign object with ID
  
- [ ] Implement `updateCampaign(campaignId, updates)`
  - [ ] Only allow seller to update own campaign
  - [ ] Update metadata timestamp

- [ ] Implement `pauseCampaign(campaignId)`
  - [ ] Set status = 'paused'
  - [ ] Notify seller

- [ ] Implement `createAdGroup(campaignId, productId, bid)`
  - [ ] Validate bid > 0
  - [ ] Check campaign belongs to seller
  - [ ] Link to product

- [ ] Implement `updateAdGroupBid(adGroupId, newBid)`
  - [ ] Validate newBid > 0
  - [ ] Update in Firestore

- [ ] Implement `addKeyword(adGroupId, keyword, matchType)`
  - [ ] Normalize keyword to lowercase
  - [ ] Validate matchType in ['exact', 'phrase', 'broad']
  - [ ] Initialize stats = {impressions: 0, clicks: 0, spend: 0}

- [ ] Implement `updateKeywordBid(keywordId, bid)`
  - [ ] Validate bid > 0

- [ ] Implement `addNegativeKeyword(adGroupId, keyword)`
  - [ ] Set isNegative = true
  - [ ] Exclude from auction

**Unit Tests:**
- [ ] Campaign CRUD with seller validation
- [ ] Keyword creation with normalization
- [ ] Ad group linking to product

**Effort:** 2-3 days | **Owner:** Backend Engineer A

---

### AdAuctionEngine

- [ ] Create file: `src/services/adAuctionEngine.ts`

- [ ] Implement `auctionBids(searchQuery, position, context)`
  - [ ] Fetch active keywords matching query (exact/phrase/broad)
  - [ ] Filter by budget available
  - [ ] Sort by bid (descending)
  - [ ] Assign top 3 positions via GSP (winner pays second price)
  - [ ] Return winners with cost

- [ ] Implement `fetchActiveBids(query)`
  - [ ] Query Firestore for exact matches: `keyword == query`
  - [ ] Query Firestore for phrase matches: `keyword contains query words`
  - [ ] Query Firestore for broad matches: `matchType == 'broad'`
  - [ ] Check cache first (5-min TTL)
  - [ ] Cache result if not found

- [ ] Implement `isCacheExpired(auctionState)`
  - [ ] Check: (now - updatedAt) < ttl
  - [ ] Invalidate if query changed

- [ ] Implement `scoreRelevance(keyword)`
  - [ ] Exact match = 1.0
  - [ ] Phrase match = 0.8
  - [ ] Broad match = 0.5
  - [ ] Rank by relevance score

- [ ] Implement `auctionForSearchResults(query, organicResults)`
  - [ ] Call `auctionBids(query)`
  - [ ] Interleave sponsored ads with organic results (top positions)
  - [ ] Return mixed result set

**Unit Tests:**
- [ ] GSP auction algorithm (top 3, second-price)
- [ ] Cache hit/miss scenarios
- [ ] Keyword matching (exact/phrase/broad)
- [ ] Budget filtering (only active campaigns)

**Integration Tests:**
- [ ] Auction with 0 bids (empty)
- [ ] Auction with 1 bid (only position 1 filled)
- [ ] Auction with 5+ bids (top 3 selected)
- [ ] Budget exhausted (campaign filtered out)

**Performance Benchmarks:**
- [ ] Auction latency <10ms (p99)
- [ ] Throughput: 1000+ auctions/sec

**Effort:** 3-4 days | **Owner:** Backend Engineer B

---

### AdAnalyticsService

- [ ] Create file: `src/services/adAnalyticsService.ts`

- [ ] Implement `getCampaignMetrics(campaignId, startDate, endDate)`
  - [ ] Aggregate impressions from adImpressions collection
  - [ ] Aggregate clicks from adClicks collection
  - [ ] Calculate: CTR = clicks / impressions
  - [ ] Calculate: spend = SUM(adClicks.cost)
  - [ ] Calculate: ACOS (requires order linking, stub for now)
  - [ ] Calculate: avgCPC = spend / clicks

- [ ] Implement `getKeywordReport(adGroupId)`
  - [ ] Group clicks by keyword
  - [ ] Group impressions by keyword
  - [ ] Calculate per-keyword metrics (CTR, spend, ACOS)
  - [ ] Sort by spend (descending)

- [ ] Implement `getSearchTermReport(campaignId)`
  - [ ] Group impressions by searchQuery (user's actual query)
  - [ ] Identify branded vs. non-branded searches
  - [ ] Show which queries drive conversions

- [ ] Implement `exportMetricsToCsv(campaignId, format)`
  - [ ] Support 'daily' and 'hourly' formats
  - [ ] Return Buffer (CSV format)
  - [ ] Include headers: date, impressions, clicks, spend, ACOS

**Unit Tests:**
- [ ] Metrics calculation (CTR, CPC, ACOS)
- [ ] CSV export format validation
- [ ] Date range filtering

**Effort:** 1-2 days | **Owner:** Backend Engineer A

---

### AdBudgetService

- [ ] Create file: `src/services/adBudgetService.ts`

- [ ] Implement `enforceDailyBudgets()` (scheduled hourly)
  - [ ] Query all active campaigns
  - [ ] For each campaign, calculate dailySpend (SUM of today's clicks)
  - [ ] If dailySpend >= dailyBudget:
    - [ ] Set campaign.status = 'budget_exhausted'
    - [ ] Notify seller
  - [ ] Schedule to run at midnight + every 6 hours

- [ ] Implement `checkBudgetAvailable(campaignId)`
  - [ ] Get campaign's dailyBudget
  - [ ] Calculate dailySpend (today's clicks)
  - [ ] Return: dailySpend < dailyBudget

- [ ] Implement `deductCost(campaignId, cost)`
  - [ ] Update adBudgetTracking document
  - [ ] Increment totalDailySpend by cost
  - [ ] Check if budget exhausted (async)

- [ ] Implement `getDailySpend(campaignId, date)`
  - [ ] Query adClicks for campaignId on date
  - [ ] SUM cost column

**Scheduling Setup:**
- [ ] Create Cloud Scheduler job: `enforceDailyBudgets` at 00:00 UTC
- [ ] Create Cloud Scheduler job: `enforceDailyBudgets` at 06:00, 12:00, 18:00 UTC

**Unit Tests:**
- [ ] Budget enforcement with daily limit
- [ ] Budget exhaustion notification
- [ ] Cost deduction accuracy

**Integration Tests:**
- [ ] Run with real Firestore data
- [ ] Verify Cloud Scheduler triggers

**Effort:** 1-2 days | **Owner:** Backend Engineer A

---

## Phase 3: Frontend Integration (Sprint 1, Week 2)

### Search Results Integration

- [ ] Update `src/pages/SearchResults.tsx`
  - [ ] Import `AdAuctionEngine`
  - [ ] Before rendering organic results, call `auctionForSearchResults(query, organicResults)`
  - [ ] Store sponsored ads + impressions in state

- [ ] Create component: `src/components/SponsoredAdSlot.tsx`
  - [ ] Display "Reklam" badge in blue
  - [ ] Show product image + title
  - [ ] Track impression (call `recordImpression()`)
  - [ ] Handle click (navigate to product)

- [ ] Update search results layout
  - [ ] Insert sponsored ads at positions 1, 2, 3
  - [ ] Push organic results down (position 4+)
  - [ ] Mobile: stack vertically without ads (or show 1 ad at top)

- [ ] Impression tracking
  - [ ] Call `sponsoredProductService.recordImpression(auctionResult, userId)`
  - [ ] Use IntersectionObserver (impression = 50% visible for 1s)
  - [ ] Async log to adImpressions (don't block render)

- [ ] Click tracking
  - [ ] Intercept product link click
  - [ ] Call `sponsoredProductService.recordClick(impressionId, userId)`
  - [ ] Deduct cost from campaign budget
  - [ ] Redirect to product page

**Unit Tests:**
- [ ] Auction integration with search
- [ ] Impression visibility detection
- [ ] Click cost deduction

**E2E Tests:**
- [ ] Search → see sponsored ads → click → cost deducted
- [ ] Budget exhausted → ads disappear from results

**Effort:** 2-3 days | **Owner:** Frontend Engineer

---

## Phase 4: Seller Dashboard MVP (Sprint 1-2, Week 2-3)

### Campaign Management

- [ ] Create page: `src/app/seller/ads/page.tsx`
  - [ ] List seller's campaigns (with filters: active, paused, ended)
  - [ ] Show: campaign name, daily budget, total spend, status
  - [ ] Actions: Edit, Pause, Resume, Delete

- [ ] Create form: `src/components/CreateCampaignForm.tsx`
  - [ ] Input: Campaign name
  - [ ] Input: Daily budget (TL)
  - [ ] Input: Total budget (optional)
  - [ ] Select: Targeting mode (automatic/manual)
  - [ ] Date picker: Start date, End date (optional)
  - [ ] Submit button: Create campaign

- [ ] Create component: `src/components/AdGroupManager.tsx`
  - [ ] For each campaign, show ad groups (products being advertised)
  - [ ] Add ad group: select product + set default bid
  - [ ] Edit bid
  - [ ] Remove ad group

- [ ] Create component: `src/components/KeywordManager.tsx`
  - [ ] For each ad group, show keywords
  - [ ] Add keyword: input + select matchType (exact/phrase/broad)
  - [ ] Optional: set keyword-specific bid (override default)
  - [ ] Add negative keyword (exclude from auction)
  - [ ] Remove keyword

**Unit Tests:**
- [ ] Campaign CRUD operations
- [ ] Form validation (bid > 0, name not empty)
- [ ] Authorization (seller can only edit own campaigns)

**Effort:** 3-4 days | **Owner:** Frontend Engineer

---

### Performance Dashboard

- [ ] Create component: `src/components/CampaignPerformance.tsx`
  - [ ] Metrics: Impressions, Clicks, CTR, Spend, ACOS, AvgCPC
  - [ ] Date range picker (last 7 days, 30 days, custom)
  - [ ] Charts: Spend trend, Clicks trend, CTR trend
  - [ ] Load metrics from `adAnalyticsService.getCampaignMetrics()`

- [ ] Create component: `src/components/KeywordPerformanceTable.tsx`
  - [ ] Show all keywords with: impressions, clicks, spend, ACOS, avgCPC
  - [ ] Sortable columns (by spend, CTR, ACOS)
  - [ ] Export to CSV button

- [ ] Create component: `src/components/SearchTermReport.tsx`
  - [ ] Show actual user searches that triggered ads
  - [ ] Filter by branded/non-branded
  - [ ] Identify high-converting search terms

**Unit Tests:**
- [ ] Metrics calculation accuracy
- [ ] Chart rendering
- [ ] CSV export format

**Effort:** 2-3 days | **Owner:** Frontend Engineer

---

## Phase 5: Infrastructure Setup (Sprint 1-2, Parallel)

### Vercel Edge Network

- [ ] Enable Vercel deployment (if not already done)
  - [ ] `vercel link` (link project to Vercel org)
  - [ ] `vercel deploy --prod`

- [ ] Configure Next.js caching (`next.config.js`)
  - [ ] Add cache headers for ISR (product pages: 1h)
  - [ ] Add cache headers for search (10 min, stale-while-revalidate: 24h)
  - [ ] Cache static assets (1 year with hashing)
  - [ ] Don't cache user-specific pages (profile, cart)

- [ ] Add security headers (`vercel.json` or middleware)
  - [ ] HSTS: max-age=31536000; includeSubDomains; preload
  - [ ] CSP: default-src 'self'
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-Frame-Options: SAMEORIGIN

- [ ] Create middleware (`src/middleware.ts`)
  - [ ] Log cache behavior
  - [ ] Route-specific cache strategies

- [ ] Enable Vercel Analytics
  - [ ] Integrate Web Vitals reporting
  - [ ] Create dashboard: LCP, FID, CLS trends

**Deployment:**
- [ ] Test cache headers in staging
- [ ] Verify security headers with curl
- [ ] Run Lighthouse audit (target: 90+ score)

**Effort:** 2-3 days | **Owner:** DevOps Engineer

---

### Bot Protection (Sprint 2)

- [ ] **Option A: Cloudflare Bot Management (Recommended)**
  - [ ] Update DNS to Cloudflare nameservers
  - [ ] Enable Bot Management in Cloudflare dashboard
  - [ ] Create Firewall rules:
    - [ ] Block if `cf.bot_management.score < 30`
    - [ ] Allow verified bots
    - [ ] Challenge (CAPTCHA) if `cf.threat_score > 50`
  - [ ] Create rate limiting rules:
    - [ ] API: >10 req/sec → 429
    - [ ] Search: >50 req/sec → 429
    - [ ] General: >100 req/min → 429

- [ ] **Option B: Self-Hosted Rate Limiting (Fallback)**
  - [ ] Implement `RateLimitService` (Redis-based)
  - [ ] Add API middleware
  - [ ] Test with load generation (locust/k6)

**Testing:**
- [ ] Simulate bot traffic (requests without UA, no JS)
- [ ] Verify rate limiting triggers
- [ ] Test CAPTCHA UX

**Effort:** 1-2 days | **Owner:** DevOps Engineer

---

## Phase 6: Testing & QA (Sprint 2)

### Unit Tests

- [ ] Backend services: 80%+ coverage
  - [ ] SponsoredProductService
  - [ ] AdAuctionEngine
  - [ ] AdAnalyticsService
  - [ ] AdBudgetService

- [ ] Frontend components: 60%+ coverage
  - [ ] SponsoredAdSlot
  - [ ] CampaignForm
  - [ ] KeywordManager

**Test Runner:** Jest
**Commands:**
```bash
npm test -- --coverage
npm test:watch  # During development
```

### Integration Tests

- [ ] Campaign creation → ad group → keyword → auction
- [ ] Click tracking → budget deduction → campaign pause
- [ ] Search results with ads + organic
- [ ] Seller dashboard metrics loading

**Test Framework:** Cypress or Playwright
**Commands:**
```bash
npm run e2e:test
npm run e2e:headless
```

### Performance Tests

- [ ] Auction latency <10ms (load test: 1000 req/sec)
- [ ] Search page load <1.8s LCP
- [ ] Firestore read/write under quota

**Tool:** K6 or Locust
```bash
k6 run load-test/auction.js
```

### UAT Checklist

- [ ] Create campaign with budget
- [ ] Add ad group (select product)
- [ ] Add keywords (exact/phrase/broad)
- [ ] Search → see ads ranked by bid
- [ ] Click ad → cost deducted from budget
- [ ] View dashboard → impressions, clicks, spend
- [ ] Set daily budget → ads pause when exhausted
- [ ] Mobile: ads display correctly (no layout shift)

**Effort:** 2-3 days | **Owner:** QA Engineer

---

## Phase 7: Deployment & Monitoring (Sprint 2, Week 4)

### Staging Deployment

- [ ] Deploy to Vercel staging
- [ ] Run full E2E test suite
- [ ] Verify Core Web Vitals
- [ ] Check security headers

### Production Rollout

- [ ] Feature flag: `ads.enabled` (disable if critical issues)
- [ ] Canary deployment: 5% → 25% → 50% → 100%
- [ ] Monitoring dashboards:
  - [ ] Vercel Analytics (Core Web Vitals)
  - [ ] Cloudflare Analytics (bot traffic, cache hits)
  - [ ] Firestore metrics (reads, writes, latency)

### Post-Launch Monitoring

- [ ] Error rate <0.1% (check logs)
- [ ] Auction latency p99 <10ms
- [ ] Daily ad revenue tracking
- [ ] Seller satisfaction (support tickets)

**Alert Thresholds:**
- [ ] Error rate > 1% → Page incident
- [ ] Auction latency p99 > 50ms → Investigate
- [ ] Cache hit ratio < 70% → Review strategy
- [ ] Bot traffic > 50% → Escalate

**Effort:** 1-2 days | **Owner:** DevOps + On-call Engineer

---

## Time Estimate Summary

| Phase | Task | Sprint | Days | Owner |
|-------|------|--------|------|-------|
| 1 | Firestore setup | 1 | 2-3 | DB Eng |
| 2 | SponsoredProductService | 1 | 2-3 | BE-A |
| 2 | AdAuctionEngine | 1 | 3-4 | BE-B |
| 2 | AdAnalyticsService | 1 | 1-2 | BE-A |
| 2 | AdBudgetService | 1-2 | 1-2 | BE-A |
| 3 | Search integration | 1 | 2-3 | FE |
| 4 | Campaign dashboard | 2 | 3-4 | FE |
| 4 | Performance dashboard | 2 | 2-3 | FE |
| 5 | Vercel Edge | 1-2 | 2-3 | DevOps |
| 5 | Bot protection | 2 | 1-2 | DevOps |
| 6 | Testing & QA | 2 | 2-3 | QA |
| 7 | Deployment | 2 | 1-2 | DevOps |
| **Total** | | | **25-35 days** | **Team** |

---

## Dependencies & Blockers

| Task | Depends On | Blocker? |
|------|-----------|----------|
| Auction Engine | DB schema, Product schema | No (can stub) |
| Search integration | Auction Engine | No (can implement in parallel) |
| Seller dashboard | Services API | No (can mock) |
| Vercel Edge setup | Nothing | No |
| Bot protection | Domain DNS access | **YES** (need admin) |

---

## Appendix: Testing Scenarios

### Scenario 1: Happy Path (User Clicks Sponsored Ad)

```
1. User: search "laptop 15 inch"
2. System: run auction
   - Bid 1: 2.5 TL (Campaign A)
   - Bid 2: 1.8 TL (Campaign B)
   - Bid 3: 0.9 TL (Campaign C)
3. Result: show 3 sponsored ads + organic results
4. Impression logged: adImpressions/{impId} (timestamp, query, position)
5. User: click position 1 ad (Campaign A)
6. Click logged: adClicks/{clickId} (cost: 1.8 TL, campaignId: Camp-A)
7. Budget deducted: Camp-A dailySpend += 1.8
8. Redirect: → product page
✅ PASS: seller sees cost in dashboard
```

### Scenario 2: Budget Exhausted

```
1. Campaign A: dailyBudget = 100 TL
2. Time: 14:00 → dailySpend = 100 TL (10 clicks @ 10 TL each)
3. Hourly check: dailySpend >= dailyBudget?
4. Result: Campaign A status = 'budget_exhausted'
5. Auction: Campaign A filtered out (no longer bids)
6. Next search: only Campaign B, C show ads
✅ PASS: no more charges after budget exhausted
```

### Scenario 3: Negative Keywords

```
1. Campaign: keyword "laptop" (broad match)
2. Negative: "-gaming laptop"
3. Search: "gaming laptop 15 inch"
4. Auction: Check negative keywords
5. Result: Campaign filtered out (query matches negative)
6. User: doesn't see ad
✅ PASS: negative keywords exclude unwanted searches
```

---

**Document Version:** 1.0 | **Date:** 2026-05-23 | **Owner:** Project Manager
