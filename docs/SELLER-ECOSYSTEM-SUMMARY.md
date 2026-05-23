# Mercora Satıcı Ekosistemi — Teknik Özet (2 Sayfa)

**Tarih:** 23 Mayıs 2026  
**Hazırlayan:** Software Engineer (Ürün & Satıcı Araçları)  
**Status:** Sprint Planning Aşaması

---

## Yönetici Özeti

Mercora'nın satıcı paneli rakiplere (Hepsiburada 7.5/10, Trendyol 7.5/10, Amazon 9.5/10) karşı **4.5/10** seviyesinde. Eksik 3 P0 özellik:

1. **Public REST API** — Entegratörlere, ERP/WMS sistemlerine veri erişimi
2. **Seller Mobile App** — iOS/Android, anında sipariş/stok yönetimi
3. **Ad Dashboard (CPC)** — Satıcı reklam yönetimi, budget & bid optimization

**Tavsiye:** Sprint 1-6 (12 hafta) ile P0'ları kapatır, Faz 2'de (Mayıs-Haziran) derinleştir.

---

## Mevcut Durum

### Var Olanlar
✓ Ürün Yönetimi (Upload, Inventory, Variants)  
✓ Sipariş Yönetimi (Basic flow)  
✓ Analytics Dashboard (mock data)  
✓ Satıcı Profili & Sertifikalar  
✓ **Google Gemini AI** (kategori eşlemesi, alan otomasyon)

### Eksikler
✗ Public REST API (keine Dokumentation, keine rate limiting)  
✗ Mobile App  
✗ Reklam Sistemi (CPC, bid management)  
✗ Account Health Dashboard  
✗ Stok Uyarıları  
✗ Multi-warehouse support  

---

## P0 İmplementasyon Planı

### FAZE 1: Public REST API (Sprint 1-2, 4 hafta)

**Architecture:**
```
Client
  ↓
API Gateway (rate limit, auth)
  ↓
Middleware (JWT validation, audit logging)
  ↓
Core Endpoints:
  • GET/POST /products
  • GET /orders
  • PUT /inventory/stock
  • GET/POST /campaigns
```

**Key Endpoints:**
```
Auth:  POST /api/v1/auth/token
Prod:  GET/POST /api/v1/products, /products/{id}, /products/{id}/variants
Order: GET /api/v1/orders, /orders/{id}, PUT /orders/{id}/status
Stock: PUT /api/v1/inventory/stock
Ad:    GET/POST /api/v1/campaigns, /campaigns/{id}
```

**Database Changes:**
- `api_keys` — API key management + scopes
- `api_audit_logs` — Request tracking (endpoint, status, latency)
- `seller_performance` — Metrics for Account Health

**Effort:** 60 story points / 3-4 backend devs  
**Deliverable:** v1.0 production-ready, Swagger docs, 50+ partner tests

---

### FAZE 2: Seller Mobile App (Sprint 3-4, 4 hafta)

**Stack:** React Native (iOS + Android), Firebase Auth, REST API calls, FCM push

**Core Screens:**
- Dashboard (KPIs: today's orders, revenue, stock)
- Orders List (filter, quick actions: ship, cancel)
- Product Management (quick edit stock/price)
- Messaging (customer Q&A templates)
- Notifications (real-time)

**Effort:** 80 story points / 1 mobile dev (outsource OK)  
**Deliverable:** Beta on both app stores, 100 internal sellers testing

---

### FAZE 3: Ad Dashboard (Sprint 5-6, 4 hafta)

**Backend:**
- Campaign CRUD (name, budget, start/end date)
- Keyword bidding (exact, phrase, broad match)
- Analytics aggregation (daily metrics)
- ACOS/ROAS calculation (accuracy ±5%)
- **Gemini keyword suggestions** (AI edge)

**Frontend (Next.js):**
- Campaign list with status toggle
- Campaign editor (budget, keywords, bids)
- Analytics dashboard (charts, filters, period selection)
- Smart bidding recommendations

**Effort:** 70 story points / 2 devs  
**Deliverable:** Live dashboard, ACOS within 5% of actual

---

## Technical Stack

| Katman | Tech |
|--------|------|
| **API Framework** | Next.js App Router |
| **Database** | Firebase Firestore + Realtime DB |
| **Auth** | Firebase Auth + JWT |
| **Mobile** | React Native |
| **Charts** | Recharts |
| **AI** | Google Gemini Pro |
| **Storage** | Firebase Storage (images) |
| **Messaging** | Firebase Cloud Messaging (FCM) |

---

## Risk & Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Firestore quota (high volume) | Medium | Pre-scale indexes, read replica, batch writes |
| Mobile app store review | Medium | Early submission, follow guidelines, legal review |
| ACOS accuracy | Low | Unit + integration tests, beta validation |
| API adoption slow | Medium | SDK examples, seller education, webhooks |

---

## Success Metrics

| Metrik | Target |
|--------|--------|
| API Uptime | 99.5% |
| API Latency (p95) | <500ms |
| Mobile Downloads | 1000+ (first month) |
| Seller API Usage | 30%+ of active sellers |
| Campaign ACOS Accuracy | ±5% |

---

## Resource Allocation

```
Backend (3 devs)
├─ API Core + Infrastructure
├─ Ad Service + Analytics
└─ Database + Performance

Frontend (2 devs)
├─ Mobile App (React Native)
└─ Dashboard UI

QA/DevOps (1.5 dev)
├─ Test automation
└─ CI/CD, monitoring

Total: 6.5 FTE, 12 weeks
```

---

## Competitive Advantage

**Mercora'nın Strengths:**
- **Gemini AI Integration** — Kategori önerisi, keyword önerisi, field mapping
- **Modern Stack** — Next.js + Firebase → fast, scalable
- **Real-time** — Firestore Realtime DB → instant updates

**Positioning:** "AI-first seller platform" — entegrasyon ve otomasyon ile Amazon'dan sonra en güçlü.

---

## Next Steps (Hafta 24-25)

1. Sprint Planning (API routes, schema validation)
2. Firestore index design + migration script
3. API middleware setup (auth, rate limit, logging)
4. Mobile app skeleton
5. Ad schema + Gemini integration prototype

**Go/No-Go Decision:** 25 Mayıs Cuma sonu

---

## Appendices

- **Technical Specification** → `seller-ecosystem-technical-spec.md` (3 sayfa)
- **Implementation Roadmap** → `seller-ecosystem-implementation-roadmap.md` (4 sayfa)
- **Backend Architecture** → `seller-ecosystem-backend-architecture.md` (5 sayfa)

**Total:** ~12 sayfa teknik dokümantasyon

---

## Referanslar

- Competitor Analysis: `docs/competitor-analysis/03-urun-satici-araclari.md`
- Current Status: Git branch `feature/product-rating-review-qa`
- Type Definitions: `mercora-next/src/types/index.ts`
- Existing Services: `mercora-next/src/services/`
