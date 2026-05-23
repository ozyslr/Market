# Mercora Satıcı Ekosistemi — Uygulama Yol Haritası

**Statüsü:** Sprint Planning  
**Hedef:** P0 eksiklikleri 12 haftada kapatmak

---

## Faz Yapısı

### FAZE 1: PUBLIC REST API (Sprint 1-2, 4 hafta)

#### Hafta 1-2: Infrastructure & Auth
```
Task                          Owner    Points  Dependencies
─────────────────────────────────────────────────────────────
Firebase API key schema       Backend   5     Firebase setup
API middleware (auth, CORS)   Backend   8     Firestore indexes
JWT token generation          Backend   5     -
Swagger/OpenAPI setup         Backend   5     -
──────────────────────────────────────────────────────────────
Subtotal                                23
```

**Deliverable:** `/api/v1/auth/token` endpoint working, Swagger docs

#### Hafta 3: Core Endpoints
```
Task                          Owner    Points  Dependencies
─────────────────────────────────────────────────────────────
Products CRUD endpoints       Backend   13    API middleware
Orders read endpoints         Backend   8     Orders collection
Inventory stock endpoints     Backend   10    Inventory sync
─────────────────────────────────────────────────────────────
Subtotal                                31
```

**Deliverable:** GET/POST products, orders, inventory working

#### Hafta 4: Rate Limiting & Analytics
```
Task                          Owner    Points  Dependencies
─────────────────────────────────────────────────────────────
Rate limiter middleware       Backend   8     API middleware
API audit logging             Backend   8     Firestore
Usage dashboard (frontend)    Frontend  8     API analytics
Integration tests             QA        8     All endpoints
─────────────────────────────────────────────────────────────
Subtotal                                32
```

**Deliverable:** API v1.0 Production Ready

---

### FAZE 2: SELLER MOBILE APP (Sprint 3-4, 4 hafta)

#### Hafta 5-6: Mobile Foundation
```
Task                          Owner    Points  Dependencies
─────────────────────────────────────────────────────────────
React Native setup            Mobile   8     -
Firebase Auth integration     Mobile   5     Public API
Dashboard screen (KPIs)       Mobile   8     Orders/Products API
Push notification setup (FCM) Mobile   8     Firebase
──────────────────────────────────────────────────────────────
Subtotal                                29
```

**Deliverable:** App bootable, Dashboard showing real data

#### Hafta 7-8: Core Features
```
Task                          Owner    Points  Dependencies
─────────────────────────────────────────────────────────────
Orders list + detail          Mobile   10    Orders API
Quick actions (ship, cancel)  Mobile   8     Orders API
Stock update UI               Mobile   8     Inventory API
Messaging template system     Mobile   8     Products API
──────────────────────────────────────────────────────────────
Subtotal                                34
```

**Deliverable:** iOS/Android beta, internal testing

---

### FAZE 3: AD DASHBOARD (Sprint 5-6, 4 hafta)

#### Hafta 9-10: Campaign Management
```
Task                          Owner    Points  Dependencies
─────────────────────────────────────────────────────────────
Ad campaign schema            Backend   8     Firestore
Campaign CRUD endpoints       Backend   13    API v1
Keyword bidding logic         Backend   8     -
Campaign frontend (create)    Frontend  8     API
────────────────────────────────────────────────────────────
Subtotal                                37
```

**Deliverable:** Campaigns can be created, bid management working

#### Hafta 11-12: Analytics & Optimization
```
Task                          Owner    Points  Dependencies
─────────────────────────────────────────────────────────────
Ad analytics aggregation      Backend   10    Campaign schema
ACOS/ROAS calculation         Backend   8     Analytics data
Dashboard (charts + filters)  Frontend  10    Analytics API
Gemini keyword suggestions    Backend   5     Gemini API
──────────────────────────────────────────────────────────────
Subtotal                                33
```

**Deliverable:** Analytics dashboard live, keyword auto-suggest

---

## Database Migration Path

```
Current State (Firestore):
├─ products (title, sku, price, stock)
├─ orders (userId, items, status)
├─ sellers (storeName, rating)
└─ users (role, profile)

Target State:
├─ products (+ variants, images, specifications)
├─ orders (+ tracking, fulfillment, returns)
├─ sellers (+ certificates, performance metrics)
├─ users (+ addresses, preferences)
├─ api_keys (NEW — key management)
├─ api_audit_logs (NEW — usage tracking)
├─ ad_campaigns (NEW — CPC ads)
├─ ad_keywords (NEW — bid management)
├─ ad_analytics (NEW — performance data)
├─ notifications (NEW — real-time alerts)
└─ seller_performance (NEW — Account Health dashboard)
```

### Migration Script (Hafta 1)
```typescript
// scripts/migrate-to-v2.ts
async function migrateCollections() {
  // 1. Create new indexes
  // 2. Add missing fields to existing docs
  // 3. Copy/transform data
  // 4. Verify integrity
  // 5. Enable new queries
}

// Run: firebase firestore:migrateV1ToV2
```

---

## Component Dependency Tree

```
Public REST API
├─ services/apiService.ts (key validation, audit logging)
├─ middleware/auth.ts (JWT, CORS)
├─ middleware/rateLimit.ts (quota enforcement)
└─ controllers/
    ├─ productController.ts (GET/POST /products)
    ├─ orderController.ts (GET /orders)
    ├─ inventoryController.ts (PUT /inventory/stock)
    └─ adController.ts (GET/POST /campaigns)

Mobile App (React Native)
├─ screens/
│  ├─ DashboardScreen.tsx (KPIs, quick stats)
│  ├─ OrdersListScreen.tsx (paginated orders)
│  ├─ ProductsScreen.tsx (quick edit stock/price)
│  └─ MessagingScreen.tsx (customer questions)
├─ services/
│  ├─ apiClient.ts (REST calls + retry)
│  ├─ authService.ts (Firebase Auth)
│  └─ pushService.ts (FCM listener)
└─ redux/slices/ (orders, products, ui state)

Ad Dashboard (Next.js)
├─ pages/seller/ad-campaigns/
│  ├─ page.tsx (campaign list)
│  ├─ [campaignId]/page.tsx (campaign editor)
│  └─ new/page.tsx (create campaign)
├─ pages/seller/ad-analytics/page.tsx (performance dashboard)
├─ components/
│  ├─ CampaignForm.tsx
│  ├─ KeywordBidTable.tsx
│  └─ PerformanceChart.tsx
└─ services/adService.ts (campaign CRUD, analytics)
```

---

## Critical Path (Critical Dependencies)

```
Public API v1.0 ← GATE 1 ← Mobile Foundation ← Mobile Features
                            ↓
                         Ad Dashboard
                            ↓
                    Account Health Dashboard
```

**Risk:** Public API gecikmesi tüm fazları etkiler. **Mitigation:** Sprint 1'de 3 dev paralel çalıştır.

---

## Testing Strategy

### Unit Tests (Sprint 4)
- API endpoint unit tests (Jest)
- Rate limiter logic
- ACOS/ROAS calculations

### Integration Tests (Sprint 4)
- API + Firestore flows
- Mobile app → API integration
- Push notification delivery

### E2E Tests (Sprint 6)
- Full campaign creation → analytics flow
- Mobile order update → notification → dashboard refresh

### Load Testing (Sprint 6)
- API: 1000 req/s (rate limiter test)
- Ad dashboard: 100 concurrent sellers
- Mobile: 500 simultaneous push notifications

---

## Success Metrics

| Metrik | Hedef | Ölçüm |
|--------|-------|--------|
| API Uptime | 99.5% | CloudWatch |
| API Response Time (p95) | <500ms | Latency dashboard |
| Mobile Install Rate | 1000+ | App stores |
| Ad Campaign CTR | >2% | Campaign analytics |
| ACOS Accuracy | ±5% | vs Manual calculation |
| Seller Adoption | 30%+ using API | Usage logs |

---

## Resource Allocation

### Backend (3 devs)
- 1: API Core (Sprint 1-4)
- 1: Ad Service (Sprint 5-6)
- 1: Database/Infra

### Frontend (2 devs)
- 1: Mobile (Sprint 3-6)
- 1: Dashboard UI (Sprint 1-6)

### QA (1 dev)
- Testing strategy, automation

### DevOps (0.5 dev)
- CI/CD pipelines, monitoring

**Total:** 6.5 FTE

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Firestore quota exceeded | Medium | High | Pre-scale indexes, read replica |
| Mobile app store review delays | Medium | Medium | Submit early, follow guidelines |
| ACOS calculation accuracy bugs | Low | High | Unit + integration tests, beta |
| API adoption slow | Medium | Medium | Seller education, webhooks example |
| Performance under load | Low | High | Load test Sprint 4, optimize queries |

---

## Sign-Off Checklist

- [ ] Public API v1.0 live with 50+ partner tests
- [ ] Mobile app beta with 100 internal sellers
- [ ] Ad analytics within 5% of actual spend
- [ ] Documentation complete (API docs, mobile SDK, seller guide)
- [ ] Seller onboarding workflow designed
- [ ] Performance meets SLA targets
