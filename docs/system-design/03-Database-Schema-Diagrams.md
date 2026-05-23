# Database Schema Diagrams — CPC Ad Engine

**Firestore Collections & Relationships**

---

## 1. Entity-Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CPC AD ENGINE SCHEMA                         │
└─────────────────────────────────────────────────────────────────────┘

                          ┌─────────────────┐
                          │   adCampaigns   │
                          │   {campaignId}  │
                          ├─────────────────┤
                          │ sellerId (FK)   │
                          │ name            │
                          │ status          │
                          │ dailyBudget     │
                          │ startDate       │
                          │ endDate         │
                          │ currency        │
                          │ metadata        │
                          └────────┬────────┘
                                   │
                        ┌──────────┴──────────┐
                        │                     │
          ┌─────────────▼───────────┐   ┌────▼──────────────┐
          │    adGroups             │   │ adBudgetTracking  │
          │  {campaignId}/{agId}    │   │ {sellerId}_{date} │
          ├─────────────────────────┤   ├───────────────────┤
          │ campaignId (FK)         │   │ sellerId          │
          │ productId (FK)          │   │ date              │
          │ defaultBid (CPC)        │   │ totalDailySpend   │
          │ status                  │   │ campaignSpends[]  │
          │ dailySpend              │   │ budgetStatus      │
          │ metadata                │   │ lastUpdated       │
          └────────┬────────────────┘   └───────────────────┘
                   │
        ┌──────────┴────────────┐
        │                       │
   ┌────▼──────────────┐   ┌───▼────────────────┐
   │   keywords        │   │  adImpressions     │
   │ {agId}/{keywordId}│   │    {impressionId}  │
   ├───────────────────┤   ├────────────────────┤
   │ adGroupId (FK)    │   │ adGroupId (FK)     │
   │ keyword           │   │ keywordId (FK)     │
   │ matchType         │   │ campaignId         │
   │ bid (override)    │   │ productId          │
   │ isNegative        │   │ sellerId           │
   │ status            │   │ searchQuery        │
   │ stats             │   │ position           │
   └───────┬───────────┘   │ userId             │
           │               │ userCountry        │
           │               │ deviceType         │
           │               │ timestamp          │
           │               │ source             │
           │               └──────┬─────────────┘
           │                      │
           │      ┌───────────────┴──────────────┐
           │      │                              │
      ┌────▼──────▼────────┐          ┌─────────▼───────┐
      │    adClicks        │          │ searchAuction   │
      │     {clickId}      │          │  State (cache)  │
      ├────────────────────┤          ├─────────────────┤
      │ impressionId (FK)  │          │ query           │
      │ adGroupId (FK)     │          │ lastAuctionTime │
      │ campaignId         │          │ activeBids[]    │
      │ productId          │          │ ttl             │
      │ sellerId           │          │ updatedAt       │
      │ userId             │          └─────────────────┘
      │ cost (CPC charged) │
      │ keyword            │
      │ timestamp          │
      │ sessionId          │
      │ conversionData     │
      └────────────────────┘
```

---

## 2. Collection Hierarchy (Firestore Document Structure)

```
ROOT COLLECTIONS:

firestore/
├── adCampaigns/                          [Top-level collection]
│   ├── {campaignId}/                     [Document]
│   │   ├── id: string
│   │   ├── sellerId: string
│   │   ├── name: string
│   │   ├── status: enum
│   │   ├── dailyBudget: number
│   │   ├── currency: enum
│   │   ├── metadata: {
│   │   │     totalSpent,
│   │   │     totalClicks,
│   │   │     totalImpressions,
│   │   │     lastActivityDate
│   │   │   }
│   │   │
│   │   └── adGroups/                     [Subcollection]
│   │       ├── {adGroupId}/
│   │       │   ├── campaignId: string
│   │       │   ├── productId: string
│   │       │   ├── defaultBid: number
│   │       │   ├── status: enum
│   │       │   │
│   │       │   └── keywords/              [Subcollection]
│   │       │       ├── {keywordId}/
│   │       │       │   ├── keyword: string
│   │       │       │   ├── matchType: enum
│   │       │       │   ├── bid: number
│   │       │       │   ├── isNegative: boolean
│   │       │       │   └── stats: {...}
│   │       │       │
│   │       │       └── {keywordId2}/
│   │       │           └── ...
│   │       │
│   │       └── {adGroupId2}/
│   │           └── ...
│   │
│   └── {campaignId2}/
│       └── ...
│
├── adImpressions/                        [Root collection]
│   ├── {impressionId}/
│   │   ├── adGroupId: string
│   │   ├── campaignId: string
│   │   ├── productId: string
│   │   ├── searchQuery: string
│   │   ├── position: number (1-3)
│   │   ├── userId: string | null
│   │   ├── timestamp: timestamp
│   │   └── source: enum
│   │
│   └── {impressionId2}/
│       └── ...
│
├── adClicks/                             [Root collection]
│   ├── {clickId}/
│   │   ├── impressionId: string (FK)
│   │   ├── adGroupId: string
│   │   ├── campaignId: string
│   │   ├── productId: string
│   │   ├── sellerId: string
│   │   ├── userId: string | null
│   │   ├── cost: number (TL)
│   │   ├── keyword: string
│   │   ├── timestamp: timestamp
│   │   ├── sessionId: string
│   │   └── conversionData: {
│   │         converted: boolean,
│   │         conversionTime: timestamp,
│   │         orderValue: number,
│   │         orderId: string
│   │       }
│   │
│   └── {clickId2}/
│       └── ...
│
├── adBudgetLogs/                         [Root collection]
│   ├── {budgetLogId}/
│   │   ├── campaignId: string
│   │   ├── sellerId: string
│   │   ├── date: string (YYYY-MM-DD)
│   │   ├── hour: number
│   │   ├── spend: number
│   │   ├── clicks: number
│   │   ├── impressions: number
│   │   └── timestamp: timestamp
│   │
│   └── {budgetLogId2}/
│       └── ...
│
├── adBudgetTracking/                     [Root collection]
│   ├── {sellerId}_{date}/
│   │   ├── sellerId: string
│   │   ├── date: string
│   │   ├── totalDailySpend: number
│   │   ├── campaignSpends: Map
│   │   ├── budgetStatus: enum
│   │   └── lastUpdated: timestamp
│   │
│   └── {sellerId}_{date2}/
│       └── ...
│
└── searchAuctionState/                   [Root collection]
    ├── {searchQueryHash}/
    │   ├── query: string
    │   ├── lastAuctionTime: timestamp
    │   ├── activeBids: Array
    │   ├── ttl: number
    │   └── updatedAt: timestamp
    │
    └── {searchQueryHash2}/
        └── ...
```

---

## 3. Data Type Definitions (TypeScript)

```typescript
// ============ CAMPAIGNS ============
export interface Campaign {
  id: string;
  sellerId: string;
  name: string;
  status: 'active' | 'paused' | 'ended' | 'budget_exhausted';
  targetingMode: 'automatic' | 'manual';
  dailyBudget: number;        // TL
  totalBudget?: number;       // Optional cap
  startDate: Timestamp;
  endDate?: Timestamp;
  currency: 'TL' | 'EUR' | 'USD';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;      // Soft delete
  metadata: {
    totalSpent: number;
    totalClicks: number;
    totalImpressions: number;
    lastActivityDate: Timestamp;
  };
}

// ============ AD GROUPS ============
export interface AdGroup {
  id: string;
  campaignId: string;
  productId: string;
  productName: string;        // Denormalized for dashboard
  defaultBid: number;         // CPC in TL
  status: 'active' | 'paused';
  dailySpend: number;
  createdAt: Timestamp;
  metadata: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
  };
}

// ============ KEYWORDS ============
export interface Keyword {
  id: string;
  adGroupId: string;
  keyword: string;            // Normalized (lowercase)
  matchType: 'exact' | 'phrase' | 'broad';
  bid?: number;               // Optional override
  isNegative: boolean;
  status: 'active' | 'paused';
  createdAt: Timestamp;
  stats: {
    impressions: number;
    clicks: number;
    spend: number;
    acos: number;             // spend / sales
    roas: number;             // sales / spend
    lastClickDate?: Timestamp;
  };
}

// ============ IMPRESSIONS ============
export interface AdImpression {
  id: string;
  adGroupId: string;
  keywordId?: string;         // Null for automatic mode
  campaignId: string;
  productId: string;
  sellerId: string;
  searchQuery: string;        // User-entered query
  position: number;           // 1-3 (rank in sponsored results)
  userId?: string;            // Anonymous impressions allowed
  userCountry: string;        // 2-letter code
  deviceType: 'mobile' | 'desktop' | 'tablet';
  timestamp: Timestamp;
  source: 'search' | 'browse' | 'category';
}

// ============ CLICKS ============
export interface AdClick {
  id: string;
  impressionId: string;
  adGroupId: string;
  campaignId: string;
  productId: string;
  sellerId: string;
  userId?: string;            // Nullable
  cost: number;               // CPC charged (TL)
  keyword: string;            // Denormalized
  timestamp: Timestamp;
  sessionId: string;
  conversionData: {
    converted: boolean;
    conversionTime?: Timestamp;
    orderValue?: number;
    orderId?: string;
  };
}

// ============ BUDGET TRACKING ============
export interface BudgetLog {
  id: string;
  campaignId: string;
  sellerId: string;
  date: string;               // YYYY-MM-DD
  hour: number;               // 0-23
  spend: number;
  clicks: number;
  impressions: number;
  timestamp: Timestamp;
  status: 'active' | 'budget_exhausted';
}

export interface BudgetTracking {
  id: string;                 // {sellerId}_{date}
  sellerId: string;
  date: string;
  totalDailySpend: number;
  campaignSpends: Map<string, number>;  // {campaignId: spend}
  budgetStatus: 'on_track' | 'approaching_limit' | 'exhausted';
  lastUpdated: Timestamp;
}

// ============ AUCTION (CACHE) ============
export interface SearchAuctionState {
  id: string;                 // Hash of query
  query: string;
  lastAuctionTime: Timestamp;
  activeBids: AuctionBid[];
  ttl: number;                // Seconds until cache expires
  updatedAt: Timestamp;
}

export interface AuctionBid {
  campaignId: string;
  adGroupId: string;
  keywordId?: string;
  bid: number;                // CPC
  seller: string;
  position: number;
}

// ============ ANALYTICS ============
export interface CampaignMetrics {
  campaignId: string;
  impressions: number;
  clicks: number;
  ctr: number;                // clicks / impressions
  spend: number;              // Total TL spent
  acos: number;               // spend / sales (requires order linking)
  roas: number;               // sales / spend
  conversions: number;
  conversionRate: number;
  avgCpc: number;             // spend / clicks
  period: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
}

export interface KeywordPerformanceRow {
  keyword: string;
  matchType: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  acos: number;
  avgCpc: number;
}

export interface SearchTermReportRow {
  searchTerm: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  conversions: number;
}
```

---

## 4. Firestore Indexes

### 4.1 Composite Indexes

```yaml
# Index: keywords by matchType + keyword + status
Collection: adCampaigns/{campaignId}/adGroups/{adGroupId}/keywords
Fields:
  - matchType (Ascending)
  - keyword (Ascending)
  - status (Ascending)
Query Plan: Fast lookup for GSP auction

# Index: adClicks by campaignId + timestamp
Collection: adClicks
Fields:
  - campaignId (Ascending)
  - timestamp (Descending)
Query Plan: Fast aggregation for daily budget enforcement

# Index: adImpressions by searchQuery + timestamp
Collection: adImpressions
Fields:
  - searchQuery (Ascending)
  - timestamp (Descending)
Query Plan: Fast search term report generation

# Index: adBudgetTracking by sellerId + date
Collection: adBudgetTracking
Fields:
  - sellerId (Ascending)
  - date (Descending)
Query Plan: Fast lookup for seller's daily budget
```

### 4.2 Single-Field Indexes

```
adCampaigns: status, sellerId, endDate
adGroups: campaignId, status
keywords: isNegative, status
adClicks: userId, conversionData.converted
adImpressions: userId, position
```

---

## 5. Data Flow Example: GSP Auction

```
User searches: "laptop 15 inch" at 14:30:22

1. IMPRESSION RECORDED (async, immediate)
   ─────────────────────────────────────
   query = "laptop 15 inch"
   
   INSERT adImpressions:
   {
     id: "imp_abc123",
     searchQuery: "laptop 15 inch",
     position: 1,
     timestamp: 14:30:22,
     userId: "user_xyz",
     deviceType: "mobile"
   }

2. AUCTION RUNS (in-memory, <10ms)
   ──────────────────────────────────
   Active keywords matching "laptop 15 inch":
   
   ┌─────────────────────────┬─────┬──────────┐
   │ Keyword (matchType)     │ Bid │ Status   │
   ├─────────────────────────┼─────┼──────────┤
   │ "laptop 15 inch" (exact)│ 2.5 │ active   │
   │ "laptop 15" (phrase)    │ 1.8 │ active   │
   │ "laptop" (broad)        │ 0.9 │ active   │
   └─────────────────────────┴─────┴──────────┘
   
   GSP Algorithm:
   1. Sort by bid: [2.5, 1.8, 0.9]
   2. Check budget: All have budget available
   3. Assign positions:
      Position 1: Bid 2.5, pays 1.8 (second price)
      Position 2: Bid 1.8, pays 0.9 (third price)
      Position 3: (empty, no more qualified bidders)

3. RESULT RETURNED
   ───────────────────
   Return top 3 ads:
   [
     { campaignId: "camp_aaa", position: 1, cost: 1.8 },
     { campaignId: "camp_bbb", position: 2, cost: 0.9 }
   ]

4. USER CLICKS POSITION 1 (at 14:30:25)
   ───────────────────────────────────
   
   INSERT adClicks:
   {
     id: "click_xyz789",
     impressionId: "imp_abc123",
     campaignId: "camp_aaa",
     cost: 1.8,    ← Charged to seller
     timestamp: 14:30:25
   }
   
   UPDATE adBudgetTracking {camp_aaa owner}_2026-05-23:
   {
     totalDailySpend: 1.8  ← Increment
   }
   
   Check: dailySpend >= dailyBudget? 
   If yes → PAUSE campaign

5. ANALYTICS AGGREGATED (hourly batch)
   ───────────────────────────────────
   
   SELECT SUM(cost), COUNT(*) FROM adClicks
   WHERE campaignId = 'camp_aaa'
   AND timestamp BETWEEN 14:00:00 AND 14:59:59
   
   Result:
   {
     spend: 45.60 TL,
     clicks: 20,
     position: "14:00-14:59",
     ctr: 0.15
   }
```

---

## 6. Firestore Quotas & Limits

| Metric | Limit | Notes |
|--------|-------|-------|
| **Document size** | 1 MB | Each impression/click doc ~2KB |
| **Write rate** | 10,000/sec | Sufficient for 100K+ daily searches |
| **Read rate** | 50,000/sec | Auction lookups = ~1M/day searches |
| **Transaction size** | 25 ops | Budget enforcement uses 1-2 ops |
| **Index size** | Unlimited | ~10 indexes needed |
| **Storage** | Pay-per-GB | ~500KB per daily search record |

**Scaling Strategy:**
- Shard `adBudgetTracking` by seller ID for write contention
- Archive impressions/clicks older than 90 days to BigQuery
- Use read replicas for analytics queries

---

## 7. Sample Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Campaigns: seller can read/edit own campaigns
    match /adCampaigns/{campaignId} {
      allow read: if request.auth.uid == resource.data.sellerId;
      allow create: if request.auth.uid == request.resource.data.sellerId;
      allow update, delete: if request.auth.uid == resource.data.sellerId;
      
      // Subcollections
      match /adGroups/{adGroupId} {
        allow read: if request.auth.uid == get(/databases/$(database)/documents/adCampaigns/$(campaignId)).data.sellerId;
        match /keywords/{keywordId} {
          allow read, write: if request.auth.uid == get(/databases/$(database)/documents/adCampaigns/$(campaignId)).data.sellerId;
        }
      }
    }

    // Impressions/Clicks: Read-only for sellers (analytics)
    match /adImpressions/{impressionId} {
      allow read: if request.auth.uid == resource.data.sellerId;
      allow create: if request.auth.token.firebase.identities.get('anonymous').contains(request.auth.uid);
    }

    match /adClicks/{clickId} {
      allow read: if request.auth.uid == resource.data.sellerId;
      allow create: if request.auth.token.firebase.identities.get('anonymous').contains(request.auth.uid);
    }

    // Budget tracking
    match /adBudgetTracking/{docId} {
      allow read: if request.auth.uid == resource.data.sellerId;
    }
  }
}
```

---

**Document Version:** 1.0 | **Date:** 2026-05-23 | **Owner:** Database Team
