# CPC Reklam Motoru — System Design Specification

**Mercora Ad Platform MVP | Sprint 1-2 Scope**

---

## 1. System Overview

Mercora's CPC (Cost-Per-Click) ad engine enables sellers to run sponsored product campaigns within search results. This document outlines the complete system architecture: database schema, backend services, real-time considerations, and frontend components.

**Key Constraints:**
- Firebase/Firestore backend (no relational DB)
- Next.js 16 frontend + existing component architecture
- Real-time auction engine (millisecond latency for search results)
- Multi-currency support (TL, EUR, USD, etc.)

---

## 2. Database Schema (Firestore Collections)

### 2.1 Campaign Management

```firestore
/adCampaigns/{campaignId}
  ├── id: string (auto-generated)
  ├── sellerId: string (FK -> users)
  ├── name: string
  ├── status: 'active' | 'paused' | 'ended'
  ├── targetingMode: 'automatic' | 'manual'
  ├── dailyBudget: number (in TL)
  ├── totalBudget: number (optional, optional spend cap)
  ├── startDate: timestamp
  ├── endDate: timestamp (optional)
  ├── currency: 'TL' | 'EUR' | 'USD' (defaults to TL)
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  ├── deletedAt: timestamp (soft delete)
  └── metadata: {
        totalSpent: number,
        totalClicks: number,
        totalImpressions: number,
        lastActivityDate: timestamp
      }

/adCampaigns/{campaignId}/adGroups/{adGroupId}
  ├── id: string
  ├── campaignId: string (parent ref)
  ├── productId: string (FK -> products)
  ├── productName: string (denormalized for dashboard)
  ├── defaultBid: number (CPC in TL)
  ├── status: 'active' | 'paused'
  ├── dailySpend: number (tracking)
  ├── createdAt: timestamp
  └── metadata: {
        impressions: number,
        clicks: number,
        conversions: number,
        spend: number
      }
```

### 2.2 Keyword Management

```firestore
/adCampaigns/{campaignId}/adGroups/{adGroupId}/keywords/{keywordId}
  ├── id: string
  ├── adGroupId: string (parent ref)
  ├── keyword: string (normalized: lowercase)
  ├── matchType: 'exact' | 'phrase' | 'broad'
  ├── bid: number (keyword-specific CPC override, optional)
  ├── isNegative: boolean (exclude this keyword)
  ├── status: 'active' | 'paused'
  ├── createdAt: timestamp
  └── stats: {
        impressions: number,
        clicks: number,
        spend: number,
        acos: number (cost / sales),
        lastClickDate: timestamp
      }
```

### 2.3 Impressions & Clicks (Immutable Logs)

```firestore
/adImpressions/{impressionId}
  ├── id: string (uuid)
  ├── adGroupId: string
  ├── keywordId: string (nullable, for automatic mode)
  ├── campaignId: string (denormalized)
  ├── productId: string
  ├── sellerId: string (denormalized)
  ├── searchQuery: string (what user actually typed)
  ├── position: number (1-3, rank in sponsored results)
  ├── userId: string (nullable, anonymous impressions)
  ├── userCountry: string
  ├── deviceType: 'mobile' | 'desktop' | 'tablet'
  ├── timestamp: timestamp (search time)
  └── source: 'search' | 'browse' | 'category'

/adClicks/{clickId}
  ├── id: string (uuid)
  ├── impressionId: string (FK -> adImpressions)
  ├── adGroupId: string
  ├── campaignId: string
  ├── productId: string
  ├── sellerId: string
  ├── userId: string (nullable)
  ├── cost: number (CPC charged to seller, in TL)
  ├── keyword: string (denormalized from keyword doc)
  ├── timestamp: timestamp (click time)
  ├── sessionId: string (track user session)
  └── conversionData: {
        converted: boolean,
        conversionTime: timestamp,
        orderValue: number,
        orderId: string
      }
```

### 2.4 Budget Tracking (Real-time)

```firestore
/adBudgetLogs/{budgetLogId}
  ├── campaignId: string
  ├── sellerId: string
  ├── date: string (YYYY-MM-DD)
  ├── hour: number (0-23)
  ├── spend: number (aggregated clicks)
  ├── clicks: number
  ├── impressions: number
  ├── timestamp: timestamp
  └── status: 'active' | 'budget_exhausted'

/adBudgetTracking/{sellerId}_{date}
  ├── sellerId: string
  ├── date: string
  ├── totalDailySpend: number
  ├── campaignSpends: {
        {campaignId}: number
      }
  ├── lastUpdated: timestamp
  └── budgetStatus: 'on_track' | 'approaching_limit' | 'exhausted'
```

### 2.5 Auction Metadata (Caching Layer)

```firestore
/searchAuctionState/{searchQueryHash}
  ├── query: string
  ├── lastAuctionTime: timestamp
  ├── activeBids: [
        {
          campaignId: string,
          adGroupId: string,
          bid: number,
          seller: string,
          position: number
        }
      ]
  ├── ttl: number (cache expiry in seconds)
  └── updatedAt: timestamp
```

---

## 3. Backend Services

### 3.1 SponsoredProductService (Core Auction Engine)

**Location:** `src/services/sponsoredProductService.ts`

```typescript
class SponsoredProductService {
  // Initialize campaign
  async createCampaign(sellerId: string, campaignData: CreateCampaignDTO): Promise<Campaign>
  async updateCampaign(campaignId: string, updates: Partial<Campaign>): Promise<Campaign>
  async pauseCampaign(campaignId: string): Promise<void>
  async deleteCampaign(campaignId: string): Promise<void>

  // Ad group management
  async createAdGroup(campaignId: string, productId: string, bid: number): Promise<AdGroup>
  async updateAdGroupBid(adGroupId: string, newBid: number): Promise<void>
  
  // Keyword management
  async addKeyword(adGroupId: string, keyword: string, matchType: 'exact' | 'phrase' | 'broad'): Promise<Keyword>
  async updateKeywordBid(keywordId: string, bid: number): Promise<void>
  async addNegativeKeyword(adGroupId: string, keyword: string): Promise<void>

  // Real-time auction
  async runAuction(searchQuery: string): Promise<SponsoredResult[]>
  
  // Click & impression tracking
  async recordImpression(auctionResult: AuctionResult, userId?: string): Promise<void>
  async recordClick(impressionId: string, userId: string): Promise<ClickData>
  
  // Budget enforcement
  async checkBudgetAvailable(campaignId: string): Promise<boolean>
  async deductCost(campaignId: string, cost: number): Promise<void>
}
```

### 3.2 AdAuctionEngine (Real-time Bidding)

**Location:** `src/services/adAuctionEngine.ts`

```typescript
class AdAuctionEngine {
  // Main auction algorithm: GSP (Generalized Second Price)
  async auctionBids(
    searchQuery: string,
    position: number,
    context: AuctionContext
  ): Promise<WinnerData[]> {
    // 1. Fetch all active bids for query + variants (broad/phrase/exact matches)
    const bids = await this.fetchActiveBids(searchQuery);
    
    // 2. Filter by budget available (daily/total)
    const feasibleBids = bids.filter(b => b.budgetAvailable);
    
    // 3. Sort by CPC (descending)
    feasibleBids.sort((a, b) => b.bid - a.bid);
    
    // 4. Assign top 3 positions (GSP: each pays second-price)
    const winners = feasibleBids.slice(0, 3).map((bid, idx) => ({
      position: idx + 1,
      campaignId: bid.campaignId,
      adGroupId: bid.adGroupId,
      keywordId: bid.keywordId,
      cost: feasibleBids[idx + 1]?.bid || 0.1  // second price or floor
    }));
    
    return winners;
  }

  // Batch auction for search results
  async auctionForSearchResults(
    searchQuery: string,
    results: ProductSearchResult[]
  ): Promise<SearchResultWithAds> {
    const sponsoredAds = await this.auctionBids(searchQuery, 3, {});
    
    return {
      sponsoredTop: sponsoredAds,
      organicResults: results,
      timestamp: Date.now()
    };
  }

  private async fetchActiveBids(query: string) {
    // Check cache first
    const cached = await this.auctionCache.get(query);
    if (cached && !this.isCacheExpired(cached)) {
      return cached.bids;
    }

    // Fetch from Firestore: exact + phrase + broad matches
    const [exactMatches, phraseMatches, broadMatches] = await Promise.all([
      this.db.collection('keywords')
        .where('matchType', '==', 'exact')
        .where('keyword', '==', query.toLowerCase())
        .where('status', '==', 'active')
        .get(),
      this.db.collection('keywords')
        .where('matchType', '==', 'phrase')
        .where('keyword', 'array-contains', query.toLowerCase())
        .get(),
      this.db.collection('keywords')
        .where('matchType', '==', 'broad')
        .get()
    ]);

    const allBids = [...exactMatches.docs, ...phraseMatches.docs, ...broadMatches.docs]
      .map(doc => ({ ...doc.data(), relevance: this.scoreRelevance(doc.data()) }))
      .sort((a, b) => b.relevance - a.relevance);

    // Cache for 5 minutes
    await this.auctionCache.set(query, { bids: allBids, ttl: 300 });

    return allBids;
  }
}
```

### 3.3 AdAnalyticsService (Reporting)

**Location:** `src/services/adAnalyticsService.ts`

```typescript
class AdAnalyticsService {
  // Campaign-level metrics
  async getCampaignMetrics(campaignId: string, startDate: Date, endDate: Date): Promise<CampaignMetrics> {
    return {
      impressions: number,
      clicks: number,
      ctr: number,        // clicks / impressions
      spend: number,
      acos: number,       // spend / sales (via order tracking)
      roas: number,       // sales / spend
      conversionRate: number,
      avgCpc: number      // spend / clicks
    };
  }

  // Keyword-level performance
  async getKeywordReport(adGroupId: string): Promise<KeywordPerformanceRow[]> {
    // Aggregate clicks + impressions from adClicks, adImpressions
  }

  // Search term report (what users actually searched)
  async getSearchTermReport(campaignId: string): Promise<SearchTermReportRow[]> {
    // Group by searchQuery, show impressions, clicks, spend, conversions
  }

  // Export to CSV
  async exportMetricsToCsv(campaignId: string, format: 'daily' | 'hourly'): Promise<Buffer> {
  }
}
```

### 3.4 AdBudgetService (Daily Enforcement)

**Location:** `src/services/adBudgetService.ts`

```typescript
class AdBudgetService {
  // Scheduled task (runs hourly)
  async enforceDailyBudgets() {
    const today = new Date().toISOString().split('T')[0];
    const campaigns = await this.db.collection('adCampaigns')
      .where('status', '==', 'active')
      .get();

    for (const campaign of campaigns.docs) {
      const dailySpend = await this.getDailySpend(campaign.id, today);
      const dailyBudget = campaign.data().dailyBudget;

      if (dailySpend >= dailyBudget) {
        // Pause campaign
        await this.db.collection('adCampaigns').doc(campaign.id).update({
          status: 'budget_exhausted'
        });
        // Notify seller
        await this.notificationService.send(campaign.data().sellerId, 
          `Campaign "${campaign.data().name}" has reached daily budget limit`);
      }
    }
  }

  async checkBudgetAvailable(campaignId: string): Promise<boolean> {
    const campaign = await this.db.collection('adCampaigns').doc(campaignId).get();
    const dailySpend = await this.getDailySpend(campaignId, new Date().toISOString().split('T')[0]);
    return dailySpend < campaign.data().dailyBudget;
  }

  private async getDailySpend(campaignId: string, date: string): Promise<number> {
    const clicks = await this.db.collection('adClicks')
      .where('campaignId', '==', campaignId)
      .where('timestamp', '>=', new Date(`${date}T00:00:00Z`))
      .where('timestamp', '<', new Date(`${date}T23:59:59Z`))
      .get();

    return clicks.docs.reduce((sum, doc) => sum + doc.data().cost, 0);
  }
}
```

---

## 4. Real-Time Auction Flow

```
User Search Query
  ↓
searchService.search(query)
  ├─ Fetch organic results
  └─ adAuctionEngine.auctionForSearchResults(query, results)
      ├─ fetchActiveBids(query) → check cache, fetch keywords
      ├─ filterByBudget() → only campaigns with budget left
      ├─ rankByBid() → GSP auction algorithm
      ├─ recordImpression() → async log to adImpressions
      └─ Return top 3 sponsored results
  ↓
Frontend renders: [Sponsored Ads] + [Organic Results]
  ↓
User clicks sponsored ad
  ↓
onClick → recordClick(impressionId, userId)
  ├─ deductCost(campaignId, cost)
  ├─ updateBudgetTracking(campaignId)
  ├─ Check if budget exhausted → pause if needed
  └─ Redirect to product
```

---

## 5. Frontend Components (Sprint 1-2 MVP)

### 5.1 Sponsored Results Display (Search Results Page)

**Location:** `src/components/SearchResults/SponsoredAdSlot.tsx`

```typescript
interface SponsoredAdSlotProps {
  ad: AuctionWinnerData;
  position: number;
  onImpressionSeen: (impressionId: string) => void;
}

export const SponsoredAdSlot: React.FC<SponsoredAdSlotProps> = ({ ad, position }) => {
  // Show "Sponsored" badge + product with CPC cost label (for seller only)
  return (
    <div className="sponsored-ad-slot">
      <Badge label="Reklam" color="blue" />
      <ProductCard product={ad.product} />
      <IntersectionObserver on:visible={() => onImpressionSeen(ad.impressionId)} />
    </div>
  );
};
```

### 5.2 Seller Ads Management (Sprint 3-4, referenced for context)

**Location:** `src/app/seller/ads/page.tsx` (future)

- Campaign list with budget/spend metrics
- Create campaign wizard
- Keyword manager (add/edit/remove)
- Performance dashboard (impressions, clicks, CTR, ACOS)

---

## 6. Sprint 1-2 MVP Scope

### 6.1 Must-Have (Sprint 1)

- [x] Database schema (Firestore collections)
- [x] Core `SponsoredProductService` (create campaign, add keywords, pause)
- [x] `AdAuctionEngine` (GSP auction, budget checking)
- [x] Real-time impression & click logging
- [x] Daily budget enforcement (scheduled task)
- [x] Search integration (render sponsored ads)
- [x] Basic seller dashboard (view campaigns, pause/resume)

### 6.2 Should-Have (Sprint 2)

- [ ] Search term report
- [ ] Keyword performance dashboard
- [ ] Negative keyword management
- [ ] Daily/hourly cost aggregation (analytics)
- [ ] Export metrics to CSV
- [ ] Mobile-optimized ad display

### 6.3 Out of Scope (Sprint 3+)

- Automatic bidding strategies
- Machine learning bid optimization
- Retargeting
- Brand advertising
- Cross-channel ads (Google Ads sync)

---

## 7. Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Next.js 16, TypeScript, TailwindCSS |
| **Backend** | Firebase Cloud Functions, Firestore |
| **Real-Time** | Firestore listeners (for budget tracking) |
| **Analytics** | BigQuery (future) or Firestore aggregation |
| **Caching** | Redis or Firestore in-memory cache |
| **Job Scheduling** | Cloud Scheduler + Cloud Functions (hourly budget check) |

---

## 8. Deployment Notes

- Firestore index required: `keywords` collection on `(matchType, keyword, status)`
- Cloud Function for `enforceDailyBudgets()` scheduled hourly at midnight + every 6 hours
- Auction cache TTL: 5 minutes (balance freshness vs. latency)
- Monitoring: Log all clicks + impressions for audit trail

---

**Document Version:** 1.0 | **Date:** 2026-05-23 | **Owner:** System Architecture Team
