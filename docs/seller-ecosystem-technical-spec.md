# Mercora Satıcı Ekosistemi — Teknik Özellikleme

**Tarih:** 23 Mayıs 2026  
**Seviye:** 4.5/10 (rakiplere kıyasla)  
**Kapsam:** P0 eksiklikleri (Satıcı Mobil Uygulaması, Public REST API, Reklam Dashboard)

---

## 1. Mevcut Durum Analizi

### Mercora'nın Mevcut Satıcı Paneli
- **Geliştirilen Modüller:**
  - Ürün Yönetimi (Import, Envanter, Fiyatlandırma)
  - Sipariş Yönetimi
  - Analytics (mock data)
  - Satıcı Profili & Sertifikalar
  - Finans (Bakiye, Ödenmişler)

- **Eksik Kritik Özellikler:**
  - Hepsiburada/Trendyol/Amazon'un sağladığı kapsamlı reklam sistemi (CPC ads, Sponsored Products)
  - Public REST API (entegratörlere, 3. taraf uygulamalara)
  - Mobil satıcı uygulaması (anında bildirimler, ürün güncellemeleri, mesajlaşma)
  - Account Health Dashboard (performans metrikleri, uyarılar)
  - Stok uyarıları sistemi

### Mercora'nın AI Avantajı
Google Gemini entegrasyonu ile **alan eşlemesi** ve kategori önerisi yapabilme — rakiplerde bu seviye yok. Bu, AI-first satıcı platformu konumlandırması için temel güç.

---

## 2. P0 Eksiklikleri — Teknik Tasarım

### 2.1 PUBLIC REST API

#### Amaç
Entegratörlere, 3. taraf ERP/WMS sistemlerine ve mobil uygulamaya veri erişimi sağlamak. Ölçeklenebilirlik ve ekosistem genişletme için gerekli.

#### Database Schema Değişiklikleri
```sql
-- API Keys Management
CREATE TABLE api_keys (
  id STRING PRIMARY KEY,
  sellerId STRING NOT NULL,
  name STRING,
  keyHash STRING UNIQUE NOT NULL,  -- SHA-256
  createdAt TIMESTAMP,
  lastUsedAt TIMESTAMP,
  revokedAt TIMESTAMP,
  scope ARRAY<STRING>,  -- ['products:read', 'orders:read', 'inventory:write']
  rateLimit INT DEFAULT 1000,  -- req/hour
  INDEX (sellerId)
);

-- API Usage Logs
CREATE TABLE api_audit_logs (
  id STRING PRIMARY KEY,
  apiKeyId STRING,
  endpoint STRING,
  method STRING,
  statusCode INT,
  responseTime INT,  -- ms
  timestamp TIMESTAMP,
  INDEX (apiKeyId, timestamp)
);
```

#### Core Endpoints (Fase 1)
```
Products
  GET    /api/v1/products
  GET    /api/v1/products/{id}
  POST   /api/v1/products
  PUT    /api/v1/products/{id}
  DELETE /api/v1/products/{id}
  GET    /api/v1/products/{id}/variants

Orders
  GET    /api/v1/orders
  GET    /api/v1/orders/{id}
  PUT    /api/v1/orders/{id}/status
  GET    /api/v1/orders/{id}/shipment

Inventory
  GET    /api/v1/inventory/stock
  PUT    /api/v1/inventory/stock
  GET    /api/v1/inventory/sync-status

Returns/Refunds
  GET    /api/v1/returns
  PUT    /api/v1/returns/{id}/status
```

#### Backend Implementation (Node.js/Firebase)
```typescript
// services/apiService.ts
export interface ApiKey {
  id: string;
  sellerId: string;
  keyHash: string;
  scope: string[];
  rateLimit: number;
  createdAt: Date;
}

export async function validateApiKey(key: string): Promise<ApiKey> {
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const doc = await db.collection('api_keys').where('keyHash', '==', hash).get();
  if (doc.empty) throw new Error('Invalid API key');
  return doc.docs[0].data();
}

export async function trackApiUsage(
  apiKeyId: string,
  endpoint: string,
  statusCode: number,
  responseTime: number
) {
  await db.collection('api_audit_logs').add({
    apiKeyId,
    endpoint,
    statusCode,
    responseTime,
    timestamp: FieldValue.serverTimestamp()
  });
}

// Middleware: Rate Limiting
export async function rateLimitCheck(apiKey: ApiKey): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const usage = await db.collection('api_audit_logs')
    .where('apiKeyId', '==', apiKey.id)
    .where('timestamp', '>=', new Date(today))
    .count()
    .get();
  
  if (usage.data().count >= apiKey.rateLimit) {
    throw new Error('Rate limit exceeded');
  }
}
```

#### Frontend: API Keys Management Panel
**Component:** `/seller/api-keys/page.tsx`
- Tüm keys listesi (created, last used, scope)
- Yeni key üretme
- Key revoke etme
- Usage logs görüntüleme
- Copy to clipboard

#### Dependencies
- `firebase-admin` (authentication, rate limiting)
- `joi` (validation)
- `swagger-ui-express` (OpenAPI docs)

---

### 2.2 SELLER MOBILE APP

#### Amaç
Satıcı, sipariş, satış ve stok bilgilerini cep telefonundan yönetebilsin. Anında bildirim sistemi.

#### Architecture
- **iOS/Android:** React Native veya Flutter (kod paylaşımı)
- **Backend API:** Yukarıdaki Public REST API kullan
- **Real-time:** Firebase Realtime Database (siparişler, mesajlar)

#### Core Features
1. **Dashboard**
   - Bugünün sipariş sayısı, kazanç, stok
   - Performans metrikleri (konversyon, rating)

2. **Sipariş Yönetimi**
   - Yeni siparişler bildirim
   - Hızlı state geçişleri (packed → shipped)
   - Kargo takip linki

3. **Ürün Yönetimi**
   - Stok güncellemesi (quick edit)
   - Fiyat değişikliği
   - Basit ürün fotograf yüklemesi

4. **Mesajlaşma**
   - Müşteri sorularına hızlı yanıt
   - Önceden ayarlanmış şablonlar (shipping time, return policy)

#### Data Flow
```
Mobile App
  ├─ Firebase Auth (OAuth2)
  ├─ REST API calls (/api/v1/...)
  ├─ WebSocket → orders (new order notification)
  └─ FCM Push Notifications
```

#### Tech Stack
- **React Native** (iOS + Android)
- **Redux** state management
- **Firebase Cloud Messaging** (push)
- **Axios** for HTTP

#### Database Requirements
```
// Firestore collections: Existing + notifications
notifications: {
  sellerId + timestamp
  type: 'new_order' | 'customer_message' | 'low_stock'
  data: {...}
  read: boolean
}
```

---

### 2.3 REKLAM DASHBOARD (CPC Ads)

#### Amaç
Satıcı, ürünlerini CPC (Cost Per Click) reklamlar ile promosyon yapabilsin. Amazon Sponsored Products, Hepsiburada HBI modeli.

#### Database Schema
```sql
CREATE TABLE ad_campaigns (
  id STRING PRIMARY KEY,
  sellerId STRING NOT NULL,
  name STRING,
  budget FLOAT,
  dailyBudget FLOAT,
  startDate TIMESTAMP,
  endDate TIMESTAMP,
  status ENUM('active', 'paused', 'finished'),
  targetingType ENUM('auto', 'manual'),
  createdAt TIMESTAMP,
  INDEX (sellerId, status)
);

CREATE TABLE ad_keywords (
  id STRING PRIMARY KEY,
  campaignId STRING NOT NULL,
  keyword STRING,
  matchType ENUM('exact', 'phrase', 'broad'),
  bid FLOAT,  -- CPC cost
  performance STRUCT<
    clicks INT,
    impressions INT,
    spend FLOAT,
    sales FLOAT,
    acos FLOAT  -- Advertising Cost of Sale
  >,
  INDEX (campaignId)
);

CREATE TABLE ad_analytics (
  id STRING PRIMARY KEY,
  campaignId STRING NOT NULL,
  date DATE,
  clicks INT,
  impressions INT,
  spend FLOAT,
  sales FLOAT,
  conversions INT,
  acos FLOAT,
  roas FLOAT,  -- Return on Ad Spend
  INDEX (campaignId, date)
);
```

#### Backend Service
```typescript
// services/adService.ts
export interface AdCampaign {
  id: string;
  sellerId: string;
  name: string;
  budget: number;
  dailyBudget: number;
  status: 'active' | 'paused' | 'finished';
  targeting: 'auto' | 'manual';
}

export async function createAdCampaign(sellerId: string, campaign: Partial<AdCampaign>) {
  return db.collection('ad_campaigns').add({
    ...campaign,
    sellerId,
    createdAt: FieldValue.serverTimestamp()
  });
}

export async function getAdAnalytics(campaignId: string, dateRange: DateRange) {
  const docs = await db.collection('ad_analytics')
    .where('campaignId', '==', campaignId)
    .where('date', '>=', dateRange.start)
    .where('date', '<=', dateRange.end)
    .orderBy('date')
    .get();
  return docs.docs.map(d => d.data());
}

export async function calculateAcos(campaignId: string): Promise<number> {
  const analytics = await getAdAnalytics(campaignId, {
    start: new Date(Date.now() - 30*24*60*60*1000),
    end: new Date()
  });
  const totalSpend = analytics.reduce((s, a) => s + a.spend, 0);
  const totalSales = analytics.reduce((s, a) => s + a.sales, 0);
  return totalSpend / totalSales;  // ACOS %
}
```

#### Frontend Components

**1. Campaign List** (`/seller/ad-campaigns/page.tsx`)
- Tüm kampanyalar
- Status toggle (active/paused)
- Budget spent, ACOS, ROAS göstergeleri
- New campaign button

**2. Campaign Editor**
```typescript
// /seller/ad-campaigns/[campaignId]/page.tsx
- Basic info (name, budget, date range)
- Targeting strategy (auto/manual keywords)
- Bid management
- Real-time performance metrics
```

**3. Analytics Dashboard** (`/seller/ad-analytics/page.tsx`)
- Tüm kampanyaların toplam metrics
- Tarih aralığı filtresi (7d, 30d, 90d)
- Çizgi grafik: Spend vs Sales
- Tablo: Campaign ACOS, ROAS, ROI
- Keyword-level breakdown

#### Integration Points
- **Product Suggestions:** Ürün upload sırasında otomatik keyword önerisi (Gemini)
- **Smart Bidding:** ACOS hedefine göre otomatik bid adjustment
- **Budget Alerts:** Günlük bütçe bittiyse uyarı

---

## 3. Sprint Planlama

### Sprint 1-2 (Haftalık): Foundation
- **P0.1:** Public REST API temel endpoints + key management
- **P0.2:** API audit logging, rate limiting
- **P0.3:** Swagger docs auto-generation

**Effort:** 60-80 story points  
**Çıktı:** Production-ready API v1.0

### Sprint 3-4: Mobile App Foundation
- **P0.4:** React Native project setup + Firebase Auth
- **P0.5:** Dashboard, Orders list, Notifications
- **P0.6:** FCM push integration

**Effort:** 80-100 story points

### Faz 2 (Mayıs-Haziran):
- **P0.7:** Ad Campaign CRUD, analytics dashboard
- **P0.8:** Mobile: Ürün yönetimi, mesajlaşma
- **P0.9:** Account Health Dashboard

---

## 4. Dependencies & Tech Debt

| Bağımlılık | Gerekli | Kullanım |
|-----------|---------|----------|
| `firebase-admin` | Public API | Auth, rate limiting, logs |
| `joi` | Public API | Request validation |
| `swagger-jsdoc` | Public API | Auto-docs |
| `react-native` | Mobile | iOS/Android |
| `firebase` (SDK) | Mobile | Real-time DB, messaging |
| `chart.js` / `recharts` | Ad Analytics | Performance charts |

### Tech Debt
- Mevcut `sellerAnalyticsService.ts` mock data'dan gerçek ad_analytics collection'a migrate
- `adService.ts` scaffold'ı production'a hazırla

---

## 5. Bağımlılık Ağı

```
Public REST API
  ├─ Products API (existing code reuse)
  ├─ Orders API (existing code reuse)
  ├─ Inventory API (new - real-time sync)
  └─ Analytics API (new - ad performance)
       ↓
Mobile App
  ├─ Push Notifications (FCM)
  ├─ Real-time Orders (Firestore)
  └─ API Key auth
       ↓
Ad Dashboard
  ├─ Campaign CRUD
  ├─ Keyword bidding engine
  └─ Analytics aggregation
```

---

## 6. Öneriler

1. **Sprint 1'e Public API başla** — tüm mobil ve entegrasyon senaryoları buna bağlı
2. **Gemini + Ad Keywords** — AI kategori önerisi gibi, CPC keywords'u de otomatik öner
3. **Account Health Dashboard** — Ad analytics + order metrics + seller rating + stock warnings tek panelde
4. **Competitive Edge:** Satıcı akademisi + automated pricing suggestions → P1

**Mercora'nın Konumu:** Rakiplere kıyasla API + AI desteği ile, entegrasyon ve otomasyon alanında lider olabilir.
