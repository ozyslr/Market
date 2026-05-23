# PHASE 1 SPRINT BREAKDOWN — DETAILED EXECUTION PLAN
**Weeks 1-8 | Target Score: 4.8 → 6.0/10**

---

## SPRINT 1-2: WEEKS 1-4 — FOUNDATION LAYER

### Parallel Work Streams (Assign 1 Tech Lead Per Stream)

#### STREAM A: Payment Gateway Expansion [2 Developers]
**Owner**: Payment Lead | **Dependency**: Vendor contracts signed

| Task | Week | Dev-Weeks | Success Criteria | Risks |
|------|:----:|:---------:|-----------------|-------|
| Stripe integration (base) | 1-2 | 1.0 | Card processing, webhooks | Rate limiting |
| Apple Pay integration | 2 | 0.5 | iOS mobile + web | OAuth setup |
| Google Pay integration | 2 | 0.5 | Android + web | Merchant account |
| Cash on Delivery (COD) UX | 2-3 | 1.5 | Order creation, seller fulfillment | Pickup logistics |
| PayU fallback integration | 3 | 0.5 | Failover chain, retry logic | Third-party SLA |
| Testing + documentation | 3-4 | 0.5 | 95%+ success rate, docs | - |

**Definition of Done**:
- [ ] All 4 payment methods live in checkout
- [ ] <0.5% gateway failure rate
- [ ] Merchant settlements automated
- [ ] Customer support runbook
- [ ] Load testing: 1000 concurrent orders

---

#### STREAM B: Checkout Optimization [2 Developers]
**Owner**: Frontend Lead | **Dependency**: Auth (Stream E)

| Task | Week | Dev-Weeks | Success Criteria | Risks |
|------|:----:|:---------:|-----------------|-------|
| Guest checkout flow | 1-2 | 1.5 | 3-step (cart → shipping → payment) | Session expiry |
| Phone number login | 2 | 1.0 | SMS OTP verification | SMS delivery SLA |
| Social login integration | 2-3 | 0.5 | Facebook/Google OAuth | Provider API changes |
| Form validation + recovery | 3 | 1.0 | Inline errors, retry logic | UX complexity |
| Abandoned cart email | 3 | 0.5 | Segment, send, track clicks | Email deliverability |
| Mobile optimization | 4 | 0.5 | <3 sec load time, responsive | Device fragmentation |

**Definition of Done**:
- [ ] Guest checkout: 18%+ conversion rate (vs 12% baseline)
- [ ] Auth diversity: 10%+ via social/phone
- [ ] Checkout time: <180 seconds p95
- [ ] Mobile conversion: >15%
- [ ] Cart recovery email: >8% click-through

---

#### STREAM C: Reliability & Security [1.5 Developers]
**Owner**: DevOps Lead | **Dependency**: None

| Task | Week | Dev-Weeks | Success Criteria | Risks |
|------|:----:|:---------:|-----------------|-------|
| Error page design (403, 500, 503) | 1 | 0.5 | Brand consistency, helpful guidance | - |
| Silent error handling (5xx fallback) | 1-2 | 1.0 | Observability, no user blockage | Alert fatigue |
| Vercel Firewall + bot rules | 2 | 0.5 | DDoS mitigation, <0.1% false positive | Over-blocking |
| CDN optimization (Edge caching) | 2-3 | 0.5 | <100ms p95 latency, 90%+ hit rate | Cache invalidation |
| Rate limiting + abuse detection | 3 | 0.5 | 429 on suspicious behavior | Legitimate users |
| Monitoring dashboards | 3-4 | 0.5 | Real-time uptime, error rates | Slack integration |

**Definition of Done**:
- [ ] 99.9%+ uptime
- [ ] <100ms p95 latency
- [ ] Zero DDoS incidents
- [ ] Errors logged + alerting <5min response

---

#### STREAM D: Seller Subscription Model [3 Developers] — **CRITICAL REVENUE**
**Owner**: Product Lead | **Dependency**: Database + Payment (Streams A, Backend)

| Task | Week | Dev-Weeks | Success Criteria | Risks |
|------|:----:|:---------:|-----------------|-------|
| Database schema design | 1 | 0.5 | Seller > subscription (1:M), billing_cycle | Migrations |
| Stripe subscription API integration | 1-2 | 1.5 | Create, cancel, upgrade/downgrade | Webhook handling |
| Tier benefits matrix | 1-2 | 1.0 | 3 tiers (Std/Pro/Ent), feature flags | Scope creep |
| Seller onboarding wizard | 2-3 | 1.5 | Tier selection, payment, verification | UX complexity |
| Invoice generation + history | 3 | 0.5 | PDF downloads, email receipts | Tax compliance |
| Trial offer campaigns | 3-4 | 0.5 | 30-day Pro trial, email sequences | Activation rate |

**Tier Details**:
```
STANDARD (Free)
├── Max 10 products
├── Manual inventory updates
├── Basic seller dashboard
└── Standard commission

PRO ($9.99/month)
├── Max 100 products
├── Inventory sync API
├── Advanced analytics
├── Featured listings
├── Featured badge
└── Priority support (email)

ENTERPRISE ($49.99/month)
├── Unlimited products
├── Full API access
├── Dedicated account manager
├── White-label options
├── Custom integrations
└── Priority phone support (24/7)
```

**Definition of Done**:
- [ ] 20%+ of sellers on Pro tier (target: 50 paid sellers)
- [ ] <2% monthly churn
- [ ] $5k/month recurring revenue
- [ ] ARPU: $100/seller/month
- [ ] NPS: >50

---

#### STREAM E: Auth Expansion [1 Developer]
**Owner**: Auth Lead | **Dependency**: None

| Task | Week | Dev-Weeks | Success Criteria | Risks |
|------|:----:|:---------:|-----------------|-------|
| Twilio SMS OTP integration | 1-2 | 1.0 | 95%+ delivery, <2min verify time | SMS SLA, costs |
| Facebook social auth | 2 | 0.5 | OAuth, account linking | API changes |
| Google social auth (cleanup) | 2 | 0.25 | Ensure current implementation solid | - |
| Account linking UI | 2-3 | 0.5 | Multi-auth per user, preference selection | Confusion |
| Session + token security | 3 | 0.5 | Refresh tokens, CSRF protection | Token leaks |

**Definition of Done**:
- [ ] 10%+ new users via social/phone
- [ ] Zero auth-related security incidents
- [ ] Account linking: >5% multi-auth users

---

### SPRINT 1-2 REVIEW (End of Week 4)

**Acceptance Criteria**:
- [ ] Checkout conversion: 12% → 18%
- [ ] Guest checkout: 3-step flow live
- [ ] Payment methods: 4 live (card, Apple, Google, COD)
- [ ] Auth: Phone + 2 social providers
- [ ] Seller subscriptions: 50 paying sellers, $5k/month
- [ ] Site uptime: 99.9%
- [ ] Mercora score: 4.8 → 5.2/10

---

## SPRINT 3-4: WEEKS 5-8 — MONETIZATION LAYER

### Parallel Work Streams (Assign 1 Tech Lead Per Stream)

#### STREAM F: CPC Ad Engine MVP [4 Developers] — **HIGHEST PRIORITY**
**Owner**: Ad Tech Lead | **Dependency**: Seller subscriptions (Stream D)

| Task | Week | Dev-Weeks | Success Criteria | Risks |
|------|:----:|:---------:|-----------------|-------|
| Ad auction schema design | 5 | 0.5 | Bid, CTR, relevance, quality score | Complexity |
| Seller ad creation UI | 5-6 | 1.5 | Campaign form, targeting, budget | Form validation |
| Bid management backend | 5-6 | 1.5 | Real-time bid updates, pause/resume | Concurrency |
| Ad placement logic | 6 | 1.0 | Search results, product detail, home | Testing scale |
| Ad metrics dashboard | 6-7 | 1.5 | Impressions, clicks, CPC, ROAS, ROI | Real-time updates |
| Click fraud detection | 7 | 0.5 | IP filters, velocity checks, anomalies | False positives |
| Stripe ad credits integration | 7 | 0.5 | Payment, billing, invoices | Reconciliation |

**Ad Auction Algorithm**:
```
Quality Score = (CTR_historical × 0.3) + (Relevance × 0.3) + (SellerRating × 0.2) + (LandingPageQuality × 0.2)
Rank = (Bid × Quality Score) / (AvgCPC + 0.01)
CPC = (NextRank / CurrentQuality) + $0.01
```

**Definition of Done**:
- [ ] 100+ sellers running ads
- [ ] 10k+ impressions/day
- [ ] CTR: 1.5%+
- [ ] $10k/month revenue
- [ ] Zero click fraud incidents
- [ ] Seller onboarding: <15 minutes to first campaign

---

#### STREAM G: Buyer Loyalty Program (MVP) [2 Developers]
**Owner**: Loyalty Lead | **Dependency**: None

| Task | Week | Dev-Weeks | Success Criteria | Risks |
|------|:----:|:---------:|-----------------|-------|
| Points system schema | 5 | 0.5 | Earn, balance, expiration, redemption | Inflation |
| Tier progression UI | 5-6 | 1.0 | Copper/Silver/Gold badges, status page | Engagement |
| Point redemption (discount) | 6 | 1.0 | Cart discount calculation, checkout UX | Edge cases |
| Email campaigns + push | 6-7 | 0.5 | Tier unlock, expiration, special offers | Frequency |
| Analytics: CLV, churn prediction | 7 | 0.5 | Cohort analysis, retention curves | Data completeness |

**Loyalty Mechanics**:
```
EARN: 1 point per 1000 Rupiah spent (1% earn rate)
BALANCE: Max 1000 points/member at any time
EXPIRATION: 1 year (warn at 90 days)
REDEEM: 100 points = 10k discount, or gift card

TIERS:
├── Copper (0-500 lifetime points) → 0.5% bonus earn
├── Silver (500-2000 lifetime points) → 1% bonus earn
└── Gold (2000+ lifetime points) → 1.5% bonus earn + exclusive offers
```

**Definition of Done**:
- [ ] 30% buyer enrollment
- [ ] 2% monthly redemption rate
- [ ] $5k/month in redeemed points
- [ ] Tier migration: 10% → Silver, 2% → Gold
- [ ] Churn prediction model trained

---

#### STREAM H: Review Automation [1.5 Developers]
**Owner**: Trust & Safety Lead | **Dependency**: Email service (existing)

| Task | Week | Dev-Weeks | Success Criteria | Risks |
|------|:----:|:---------:|-----------------|-------|
| Auto-request review flow | 5-6 | 1.0 | Email post-delivery, SMS option | Spam complaints |
| AI moderation (OpenAI API) | 6 | 1.0 | Toxicity scoring, auto-hide | Cost/latency |
| Seller rating dashboard | 6-7 | 0.5 | Avg rating, trends, response rate | Bugs |

**Definition of Done**:
- [ ] 80% of deliveries get review requests
- [ ] 40% completion rate
- [ ] AI moderation: 95% accuracy (vs manual baseline)
- [ ] <1% false positive deletions

---

#### STREAM I: Price Comparison / Buybox [2 Developers]
**Owner**: Search Lead | **Dependency**: None

| Task | Week | Dev-Weeks | Success Criteria | Risks |
|------|:----:|:---------:|-----------------|-------|
| Multi-seller aggregation | 6 | 1.0 | Price, shipping, rating per seller | Data freshness |
| Buybox algorithm | 6-7 | 1.0 | Score = price + rating + ship time + tier | Seller complaints |
| Buybox UI | 7 | 0.5 | Featured badge, price match indicator | Design |

**Buybox Scoring**:
```
Score = (MaxPrice - CurrentPrice) / MaxPrice × 30 (price)
       + (SellerRating / 5) × 40 (quality)
       + (ShipTime_Max - CurrentShipTime) / ShipTime_Max × 20 (speed)
       + SellerTier × 10 (trust)
```

**Definition of Done**:
- [ ] Buybox on 80% of multi-seller products
- [ ] 5% lift in conversion on buybox products
- [ ] Seller feedback: 80%+ approval of algorithm

---

### SPRINT 3-4 REVIEW (End of Week 8)

**Acceptance Criteria**:
- [ ] CPC ads: 100+ sellers, $10k/month revenue
- [ ] Loyalty program: 30% enrollment, 2% redemption rate
- [ ] Review requests: 80% delivery, 40% completion
- [ ] Buybox: Live on 80% of products, 5% conversion lift
- [ ] Overall Mercora score: 5.2 → 6.0/10

---

## DEPENDENCIES & BLOCKERS

### Critical Path (Must Not Slip)
1. **Database schema** (Week 1) → Blocks all monetization
2. **Stripe integration** (Week 2) → Blocks payments + subscriptions
3. **Seller subscription model** (Week 3) → Blocks CPC dependency
4. **CPC auction algorithm** (Week 6) → Blocks $10k/month revenue

### Optional Dependencies
- Phone auth can proceed independently
- Loyalty program independent from ads
- Review automation independent from checkout

---

## SUCCESS METRICS (Weekly Tracking)

### Week 4 (End of S1-2)
- Checkout conversion: 18% (from 12%)
- Guest orders: 8% of total
- Seller subscriptions: 50 active Pro accounts
- Payment success: 95%+
- Uptime: 99.9%

### Week 8 (End of S3-4)
- CPC ad impressions: 10k/day
- CPC ad revenue: $10k/month
- Loyalty members: 30% of active users
- Review completion: 40% of requests
- Mercora score: 6.0/10

---

## BUDGET ALLOCATION

| Stream | Salaries | Tools/Services | Total |
|--------|:--------:|:---------------:|:-----:|
| A: Payments | $20k | $5k (Stripe/PayU) | $25k |
| B: Checkout | $20k | $2k (Hotjar) | $22k |
| C: Reliability | $15k | $3k (Vercel/Cloudflare) | $18k |
| D: Subscriptions | $25k | $1k (Stripe sub mgmt) | $26k |
| E: Auth | $12k | $0.5k (Twilio SMS) | $12.5k |
| F: CPC Ads | $30k | $2k (Google DFP library) | $32k |
| G: Loyalty | $18k | $1k (email/push) | $19k |
| H: Reviews | $12k | $2k (OpenAI API) | $14k |
| I: Buybox | $15k | $0.5k | $15.5k |
| **Total** | **$167k** | **$17k** | **$184k** |

*Note: Phase 1 total $150k estimate includes overhead.*

---

## RISK REGISTER

| Risk | Probability | Impact | Mitigation | Contingency |
|------|:----------:|:------:|-----------|------------|
| Payment gateway integration delays | Medium | High | Stripe-first, parallel PayU setup | Use Stripe only for MVP |
| CPC auction complexity | High | High | Use Google DFP library, simplify MVP | Start with manual bidding |
| Seller subscription churn >10% | Medium | High | 30-day free trial, benefits clarity | Lower Pro price to $4.99 |
| Loyalty program abuse (point inflation) | Low | Medium | Cap 100 points/order, audit trail | Manual verification queue |
| Review moderation false positives | Medium | Medium | OpenAI API + human review queue | Temporary manual moderation |

---

**Version**: 1.0 | **Owner**: Engineering Lead | **Approved by**: CEO  
**Questions?** Refer to `/docs/01-strategic-roadmap-ceo.md` for strategic context.
