# System Design Specification — Mercora Ad Platform & Technology Infrastructure

**Sprint 1-2 MVP Roadmap | 2026-05-23**

---

## Executive Summary

This System Design Specification addresses Mercora's two critical gaps:

1. **Missing CPC Ad Engine** (1.6/10 rating) — No reklam/promosyon altyapısı
2. **Weak Technology Infrastructure** (6.0/10 rating) — No CDN, bot protection, HTTP/3

The specification defines:
- Complete database schema (7 Firestore collections)
- Backend services architecture (4 core microservices)
- Real-time auction engine (GSP algorithm)
- Frontend components (search integration)
- Technology stack (Vercel Edge + Cloudflare)
- Sprint 1-2 MVP scope

---

## Key Documents

### 1. CPC Reklam Motoru — System Design (01-CPC-Ad-Engine-Architecture.md)

**Purpose:** Complete technical specification for sponsored product ads.

**Contains:**
- Firestore schema design (campaigns, ad groups, keywords, impressions, clicks)
- Backend services (`SponsoredProductService`, `AdAuctionEngine`, `AdAnalyticsService`, `AdBudgetService`)
- Real-time auction flow (GSP algorithm, budget checking, impression/click tracking)
- Frontend components (search integration, sponsored ad display)
- Sprint 1-2 MVP scope
- Technology stack

**Key Metrics:**
- **Database:** 7 Firestore collections, ~2KB per impression/click
- **Auction latency:** <10ms (in-memory ranking + budget check)
- **Write throughput:** 10,000+ ops/sec (sufficient for 100K+ daily searches)
- **Cache strategy:** 5-minute TTL for auction state

**MVP Scope (Sprint 1-2):**
- Core database schema
- Campaign creation + ad group management
- Keyword bidding (exact/phrase/broad match)
- Real-time auction engine (top 3 positions, GSP pricing)
- Daily budget enforcement
- Basic seller dashboard (view campaigns, pause/resume)
- Search results integration

**Out of Scope (Sprint 3+):**
- Automatic bidding
- ML-based bid optimization
- Retargeting / remarketing
- Brand advertising
- Google Ads integration

---

### 2. Technology Infrastructure — P0 Critical Gaps (02-Technology-Infrastructure-P0.md)

**Purpose:** Close critical technology gaps vs. competitors (Hepsiburada, Trendyol, Amazon TR).

**Contains:**
- Competitive analysis (Akamai vs. Cloudflare vs. AWS CloudFront)
- Recommended solution: Vercel Edge Network (native Next.js integration)
- Implementation plan:
  - Cache control headers (ISR, image optimization)
  - Security headers (CSP, HSTS 1-year, X-Frame-Options)
  - Middleware for dynamic cache strategies
  - Core Web Vitals optimization
- Bot protection (Cloudflare Bot Management + rate limiting)
- Monitoring & alerting setup

**Performance Impact:**
| Metric | Before | After | Improvement |
|--------|--------|-------|------------|
| TTFB | 800ms | 200ms | 4x faster |
| LCP (Largest Contentful Paint) | 4.5s | 1.8s | 60% faster |
| FID (First Input Delay) | 200ms | 60ms | 70% faster |
| CLS (Cumulative Layout Shift) | 0.15 | 0.05 | Stable |

**Implementation Effort:**
- Vercel Edge Network: 3-5 days (setup + caching rules)
- Cloudflare Bot Management: 1-2 days (DNS migration + rules)
- Security headers: 1 day (middleware + config)
- Monitoring: 1 day (Vercel Analytics + Cloudflare dashboards)

**Expected SEO Impact:**
- Core Web Vitals improvement → +3-5 positions in Google Search results
- Faster load time → Lower bounce rate, higher conversion rate
- HSTS preload → Trust signal for SSL certificate

---

### 3. Database Schema Diagrams (03-Database-Schema-Diagrams.md)

**Purpose:** Detailed ER diagram, Firestore collection hierarchy, and TypeScript interfaces.

**Contains:**
- Complete ERD (Entity-Relationship Diagram)
- Firestore collection structure (campaigns → ad groups → keywords)
- TypeScript data type definitions
- Composite & single-field indexes
- GSP auction data flow walkthrough
- Firestore security rules (seller access control)
- Quotas & scaling strategy

**Collection Summary:**
```
firestore/
├── adCampaigns/ (campaigns + daily budgets)
│   └── adGroups/ (product-specific bids)
│       └── keywords/ (exact/phrase/broad match)
├── adImpressions/ (search events + positions)
├── adClicks/ (click cost tracking + conversion data)
├── adBudgetLogs/ (hourly aggregation)
├── adBudgetTracking/ (daily budget enforcement)
└── searchAuctionState/ (5-min cache for auctions)
```

---

## Competitive Gap Analysis

### Mercora vs. Competitors

| Feature | Mercora | Hepsiburada | Trendyol | Amazon TR |
|---------|---------|------------|----------|-----------|
| **CDN** | ❌ None | ✅ Akamai | ✅ Cloudflare | ✅ CloudFront |
| **Bot Protection** | ❌ None | ✅ Akamai Bot Mgr | ✅ Cloudflare Bot Mgr | ✅ AWS WAF |
| **HTTP/3 (QUIC)** | ❌ No | ✅ Via Akamai | ✅ Via Cloudflare | ✅ Alt-Svc: h3 |
| **HSTS** | ⚠️ Basic | ✅ 1-year preload | ⚠️ 6-month | ✅ 1.5-year |
| **CPC Ad Engine** | ❌ None | ✅ Hepsiburada Ads | ✅ Trendyol Ads | ✅ Amazon Ads |
| **Seller Dashboard** | ❌ None | ✅ Full analytics | ✅ Campaign builder | ✅ SP-API |
| **Ad Raporlama** | ❌ None | ✅ ACOS, ROAS | ✅ Detailed reports | ✅ Comprehensive |
| **Keyword Hedefleme** | ❌ None | ✅ Exact/phrase/broad | ✅ Advanced matching | ✅ Full matching |

### Mercora's Technology Strengths

- ✅ Next.js 16 (modern, fast, SEO-optimized)
- ✅ Firebase (serverless, scales automatically)
- ✅ Gemini AI (content generation, visual search)
- ✅ PWA support (mobile experience)
- ✅ 40+ backend services (rich functionality)

### Mercora's Technology Weaknesses

- ❌ No CDN (40-60% performance penalty)
- ❌ No bot protection (vulnerable to scraping)
- ❌ No HTTP/3 (mobile users disadvantaged)
- ❌ No ad platform (revenue model incomplete)
- ❌ No API Gateway (integration limited)
- ❌ No mobile app (PWA-only strategy)

---

## Sprint Timeline

### Sprint 1 (2 weeks)

**Goal:** Ad engine foundation + Vercel Edge Network

**Deliverables:**
- Firestore schema for ads (campaigns, ad groups, keywords)
- `SponsoredProductService` basic CRUD
- `AdAuctionEngine` GSP algorithm
- Search results integration (display sponsored ads)
- Seller dashboard: view campaigns, pause/resume
- Vercel Edge caching + security headers
- **Velocity:** ~40 story points

### Sprint 2 (2 weeks)

**Goal:** Budget enforcement + real-time tracking

**Deliverables:**
- `AdBudgetService` (daily enforcement, hourly checks)
- Click cost tracking + revenue calculation
- Keyword performance reporting
- Search term report
- Bot protection (Cloudflare or self-hosted rate limiting)
- Core Web Vitals optimization
- **Velocity:** ~40 story points

### Sprint 3-4 (4 weeks)

**Goal:** Full seller dashboard + analytics

**Deliverables:**
- Seller dashboard (create campaigns, manage keywords, set budgets)
- Campaign builder wizard
- Advanced analytics (ACOS, ROAS, CTR trends)
- Export metrics (CSV)
- Negative keyword management
- Automatic bid suggestions (machine learning ready)

---

## Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **GSP auction latency** | Search results slowdown | Cache auction state 5min; use in-memory ranking |
| **Firestore cost explosion** | Monthly bill spike | Archive impressions/clicks to BigQuery after 90d |
| **Budget enforcement race condition** | Overscharge sellers | Firestore transactions (atomic operations) |
| **CDN misconfiguration** | Cache poisoning | Stage changes in preview; test thoroughly |
| **Bot traffic spike** | Service degradation | Cloudflare rate limiting + IP reputation |

---

## Success Metrics

### Business KPIs

- **Ad revenue (ARPU):** Target +500% within 6 months (sellers willing to spend 500 TL/month per product)
- **Seller adoption:** Target 30% of sellers running ads within 3 months
- **ACOS:** Target <40% (sellers see positive ROI)
- **Click volume:** 10,000+ daily ad clicks within 6 months

### Technical KPIs

- **Auction latency:** <10ms (p99)
- **Page load time:** LCP <1.8s
- **Core Web Vitals:** 100/100 Lighthouse score
- **Uptime:** 99.99% (SLA)
- **Errors:** <0.1% of requests

---

## Technology Decisions

### Why Firestore Over Relational DB?

- ✅ Existing Firebase setup (Mercora already uses it)
- ✅ Automatic scaling (no provisioning)
- ✅ Real-time listeners (for notifications)
- ✅ Serverless (no ops overhead)
- ❌ Limited complex queries (but auction is simple ranking)
- ❌ Writes are eventually consistent (acceptable for ads)

### Why Vercel Over Cloudflare?

- ✅ Native Next.js integration (1-command deploy)
- ✅ Zero cold starts (prefork + warm pools)
- ✅ Included DDoS protection
- ✅ Integrated analytics
- ❌ Less advanced WAF than Cloudflare Enterprise
- ❌ Higher compute costs at scale

### Why GSP (Generalized Second Price) Over FCB?

- ✅ Industry standard (used by Google Ads, Amazon Ads)
- ✅ Truthful bidding incentive (dominant strategy is true bid)
- ✅ Simpler implementation (sort by bid, assign second price)
- ❌ Sellers may bid lower than they should (safer)

---

## Appendix: Document References

- **Competitor Analysis Report (07-reklam-promosyon.md)**
  - CPC Reklam Motoru P0 gaps
  - Rakip karşılaştırması (Hepsiburada, Trendyol, Amazon)
  - Stratejik yol haritası (Sprint 1-8)

- **Technology Infrastructure Report (08-teknoloji-seo-reklam.md)**
  - CDN karşılaştırması (Akamai vs. Cloudflare vs. AWS)
  - Bot koruması gaps
  - Core Web Vitals analizi

- **Master Competitive Analysis (00-competitor-analysis-master-report.md)**
  - Genel puanlama (Mercora: 3.9/10)
  - 27/29 madde durum (kapsamlı action plan)

---

## Next Steps

1. **Code Review:** Present this spec to engineering leads (backend, frontend, devops)
2. **Approval:** Get sign-off from product + CTO
3. **Sprint Planning:** Break down into tickets (Firestore schema, service stubs, tests)
4. **Infrastructure:** Provision Vercel + Cloudflare (in parallel)
5. **Kickoff:** Sprint 1 starts Monday

---

**Document Version:** 1.0  
**Date:** 2026-05-23  
**Owner:** System Architecture Team  
**Status:** Ready for Code Review

**Related Documents:**
- `/docs/competitor-analysis/07-reklam-promosyon.md` (Ad platform gaps)
- `/docs/competitor-analysis/08-teknoloji-seo-reklam.md` (Tech infrastructure gaps)
- `/docs/system-design/01-CPC-Ad-Engine-Architecture.md` (Detailed ad engine spec)
- `/docs/system-design/02-Technology-Infrastructure-P0.md` (CDN + bot protection)
- `/docs/system-design/03-Database-Schema-Diagrams.md` (Firestore ERD)
