# Mercora Satıcı Ekosistemi — Backend Mimarisi

---

## 1. Directory Structure (Next.js App Router)

```
mercora-next/
├── src/
│   ├── app/
│   │   ├── api/v1/                          # Public REST API
│   │   │   ├── auth/
│   │   │   │   └── token/route.ts           # JWT token generation
│   │   │   ├── products/
│   │   │   │   ├── route.ts                 # GET /products, POST /products
│   │   │   │   └── [id]/route.ts            # GET/PUT/DELETE /products/{id}
│   │   │   ├── orders/
│   │   │   │   ├── route.ts                 # GET /orders
│   │   │   │   └── [id]/route.ts            # GET /orders/{id}, PUT status
│   │   │   ├── inventory/
│   │   │   │   └── stock/route.ts           # PUT /inventory/stock
│   │   │   └── campaigns/
│   │   │       ├── route.ts                 # GET/POST /campaigns
│   │   │       └── [id]/route.ts            # GET/PUT /campaigns/{id}
│   │   ├── seller/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── api-keys/
│   │   │   │   ├── page.tsx                 # NEW: API key management UI
│   │   │   │   └── [keyId]/revoke/route.ts
│   │   │   ├── ad-campaigns/
│   │   │   │   ├── page.tsx                 # List campaigns
│   │   │   │   ├── new/page.tsx             # Create campaign
│   │   │   │   └── [campaignId]/page.tsx    # Edit campaign
│   │   │   └── ad-analytics/
│   │   │       └── page.tsx                 # NEW: Performance dashboard
│   │   └── ...
│   ├── services/
│   │   ├── apiService.ts                    # NEW: Key validation, audit logging
│   │   ├── adService.ts                     # Refactor: campaign CRUD
│   │   ├── productService.ts                # Existing: reuse for API
│   │   ├── orderService.ts                  # Existing: reuse for API
│   │   ├── inventoryService.ts              # NEW: real-time sync
│   │   └── sellerAnalyticsService.ts        # Refactor: ad analytics
│   ├── middleware/
│   │   ├── auth.ts                          # NEW: JWT validation
│   │   ├── rateLimit.ts                     # NEW: quota enforcement
│   │   └── errorHandler.ts                  # NEW: consistent error responses
│   ├── lib/
│   │   ├── firebase.ts                      # Firebase admin init
│   │   ├── swagger.ts                       # NEW: Swagger generator
│   │   └── crypto.ts                        # NEW: key hashing
│   └── types/
│       ├── api.ts                           # NEW: API request/response types
│       ├── ad.ts                            # NEW: Ad campaign types
│       └── index.ts                         # Existing: User, Product, Order
├── firebase.json
└── package.json
```

---

## 2. Core Service Layer

### 2.1 API Service (auth + audit)
**File:** `src/services/apiService.ts`

```typescript
import * as crypto from 'crypto';
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export interface ApiKey {
  id: string;
  sellerId: string;
  name: string;
  keyHash: string;        // SHA-256 hash
  publicKey: string;      // truncated for display
  scope: string[];        // permissions
  rateLimit: number;      // req/hour
  createdAt: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
}

export interface ApiAuditLog {
  id: string;
  apiKeyId: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  statusCode: number;
  responseTime: number;   // milliseconds
  requestSize: number;
  responseSize: number;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Generate new API key
export async function generateApiKey(
  sellerId: string,
  name: string,
  scope: string[]
): Promise<{ id: string; key: string; publicKey: string }> {
  const key = crypto.randomBytes(32).toString('hex');
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  const publicKey = key.substring(0, 8) + '...' + key.substring(key.length - 4);
  
  const docRef = await db.collection('api_keys').add({
    sellerId,
    name,
    keyHash,
    scope,
    rateLimit: 1000,  // default
    createdAt: FieldValue.serverTimestamp(),
    revokedAt: null
  });
  
  return {
    id: docRef.id,
    key,  // Only shown once
    publicKey
  };
}

// Validate API key on every request
export async function validateApiKey(key: string): Promise<ApiKey | null> {
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  const snapshot = await db.collection('api_keys')
    .where('keyHash', '==', keyHash)
    .where('revokedAt', '==', null)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  const apiKey = doc.data() as ApiKey;
  apiKey.id = doc.id;
  
  // Update last used
  await doc.ref.update({ lastUsedAt: FieldValue.serverTimestamp() });
  
  return apiKey;
}

// Revoke key
export async function revokeApiKey(keyId: string): Promise<void> {
  await db.collection('api_keys').doc(keyId).update({
    revokedAt: FieldValue.serverTimestamp()
  });
}

// Track API usage
export async function logApiUsage(log: Omit<ApiAuditLog, 'id' | 'timestamp'>): Promise<void> {
  await db.collection('api_audit_logs').add({
    ...log,
    timestamp: FieldValue.serverTimestamp()
  });
}

// Get usage stats
export async function getApiStats(sellerId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const snapshot = await db.collection('api_audit_logs')
    .where('apiKeyId', 'in', await getSellerKeys(sellerId))
    .where('timestamp', '>=', startDate)
    .get();
  
  const logs = snapshot.docs.map(d => d.data() as ApiAuditLog);
  
  return {
    totalRequests: logs.length,
    totalErrors: logs.filter(l => l.statusCode >= 400).length,
    avgResponseTime: logs.reduce((sum, l) => sum + l.responseTime, 0) / logs.length,
    byEndpoint: groupBy(logs, 'endpoint'),
    byStatusCode: groupBy(logs, 'statusCode')
  };
}

async function getSellerKeys(sellerId: string): Promise<string[]> {
  const snapshot = await db.collection('api_keys')
    .where('sellerId', '==', sellerId)
    .select('id')
    .get();
  return snapshot.docs.map(d => d.id);
}
```

### 2.2 Inventory Service (Real-time Sync)
**File:** `src/services/inventoryService.ts`

```typescript
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export interface InventoryUpdate {
  productId: string;
  sku: string;
  warehouseId?: string;  // optional for multi-warehouse
  quantityDelta: number;  // +10 or -5
  reason: 'sale' | 'return' | 'adjustment' | 'restock';
  reference?: string;     // order ID, return ID, etc
}

// Atomic inventory update
export async function updateInventory(update: InventoryUpdate): Promise<void> {
  const productRef = db.collection('products').doc(update.productId);
  
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(productRef);
    if (!doc.exists) throw new Error('Product not found');
    
    const currentStock = doc.data()?.stock || 0;
    const newStock = currentStock + update.quantityDelta;
    
    if (newStock < 0) throw new Error('Insufficient stock');
    
    // Update product stock
    transaction.update(productRef, { stock: newStock });
    
    // Log change
    await db.collection('inventory_logs').add({
      productId: update.productId,
      sku: update.sku,
      fromStock: currentStock,
      toStock: newStock,
      delta: update.quantityDelta,
      reason: update.reason,
      reference: update.reference,
      timestamp: FieldValue.serverTimestamp()
    });
    
    // Trigger low-stock alert if needed
    if (newStock < 20 && currentStock >= 20) {
      await createNotification(doc.data().sellerId, {
        type: 'low_stock',
        productId: update.productId,
        message: `Low stock alert: Only ${newStock} units left`
      });
    }
  });
}

// Get current stock
export async function getStock(productId: string): Promise<number> {
  const doc = await db.collection('products').doc(productId).get();
  return doc.data()?.stock || 0;
}

// Batch sync (for Excel import)
export async function syncInventoryBatch(updates: InventoryUpdate[]) {
  const batch = db.batch();
  
  for (const update of updates) {
    const productRef = db.collection('products').doc(update.productId);
    batch.update(productRef, { stock: FieldValue.increment(update.quantityDelta) });
  }
  
  await batch.commit();
}

async function createNotification(sellerId: string, data: any) {
  await db.collection('notifications').add({
    sellerId,
    read: false,
    ...data,
    timestamp: FieldValue.serverTimestamp()
  });
}
```

### 2.3 Ad Service (Campaigns & Analytics)
**File:** `src/services/adService.ts`

```typescript
import { db } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export interface AdCampaign {
  id: string;
  sellerId: string;
  name: string;
  budget: number;
  dailyBudget: number;
  spent: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'paused' | 'finished';
  targetingType: 'auto' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}

export interface AdKeyword {
  id: string;
  campaignId: string;
  keyword: string;
  matchType: 'exact' | 'phrase' | 'broad';
  bid: number;  // cost per click in USD
  dailyBudget?: number;
}

export interface AdMetrics {
  campaignId: string;
  date: string;  // YYYY-MM-DD
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  conversions: number;
  acos: number;    // spend / sales
  roas: number;    // sales / spend
}

// Create campaign
export async function createCampaign(
  sellerId: string,
  campaign: Omit<AdCampaign, 'id' | 'createdAt' | 'updatedAt' | 'spent'>
): Promise<string> {
  const docRef = await db.collection('ad_campaigns').add({
    ...campaign,
    sellerId,
    spent: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });
  
  return docRef.id;
}

// Add keyword
export async function addKeyword(campaignId: string, keyword: Omit<AdKeyword, 'id'>): Promise<string> {
  const docRef = await db.collection('ad_keywords').add({
    ...keyword,
    campaignId
  });
  
  return docRef.id;
}

// Get analytics (aggregated by day)
export async function getAnalytics(
  campaignId: string,
  startDate: Date,
  endDate: Date
): Promise<AdMetrics[]> {
  const snapshot = await db.collection('ad_analytics')
    .where('campaignId', '==', campaignId)
    .where('date', '>=', startDate.toISOString().split('T')[0])
    .where('date', '<=', endDate.toISOString().split('T')[0])
    .orderBy('date')
    .get();
  
  return snapshot.docs.map(d => d.data() as AdMetrics);
}

// Calculate ACOS (Advertising Cost of Sale)
export async function calculateAcos(campaignId: string, daysBack: number = 30): Promise<number> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  
  const metrics = await getAnalytics(campaignId, startDate, endDate);
  const totalSpend = metrics.reduce((sum, m) => sum + m.spend, 0);
  const totalSales = metrics.reduce((sum, m) => sum + m.sales, 0);
  
  return totalSales > 0 ? (totalSpend / totalSales) * 100 : 0;
}

// Suggest keywords using Gemini AI
export async function suggestKeywords(productTitle: string, category: string): Promise<string[]> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `
    Generate 10 CPC advertising keywords for this product:
    Title: ${productTitle}
    Category: ${category}
    
    Return ONLY a JSON array of keywords like: ["keyword1", "keyword2"]
  `;
  
  const response = await model.generateContent(prompt);
  const text = response.response.text();
  
  try {
    return JSON.parse(text.match(/\[.*\]/s)[0]);
  } catch {
    return [];
  }
}
```

---

## 3. Middleware Layer

### 3.1 Authentication Middleware
**File:** `src/middleware/auth.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/services/apiService';

export async function withApiAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const key = authHeader.substring(7);
  const apiKey = await validateApiKey(key);
  
  if (!apiKey) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 403 });
  }
  
  return { apiKey };
}

// Middleware for checking scopes
export function checkScopes(required: string[]) {
  return (apiKey: any) => {
    const hasScope = required.some(scope => apiKey.scope.includes(scope));
    if (!hasScope) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
  };
}
```

### 3.2 Rate Limiting Middleware
**File:** `src/middleware/rateLimit.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

const CACHE = new Map<string, { count: number; resetAt: number }>();

export async function withRateLimit(req: NextRequest, apiKey: any) {
  const now = Date.now();
  const hourStart = Math.floor(now / 3600000) * 3600000;  // start of hour
  const key = `${apiKey.id}:${hourStart}`;
  
  let record = CACHE.get(key);
  
  if (!record) {
    const snap = await db.collection('api_audit_logs')
      .where('apiKeyId', '==', apiKey.id)
      .where('timestamp', '>=', new Date(hourStart))
      .count()
      .get();
    
    record = { count: snap.data().count, resetAt: hourStart + 3600000 };
    CACHE.set(key, record);
  }
  
  if (record.count >= apiKey.rateLimit) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', resetAt: record.resetAt },
      { status: 429, headers: { 'Retry-After': Math.ceil((record.resetAt - now) / 1000).toString() } }
    );
  }
  
  record.count++;
  return { ok: true };
}
```

---

## 4. API Route Handlers

### 4.1 Products Endpoint
**File:** `src/app/api/v1/products/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { logApiUsage } from '@/services/apiService';
import { db } from '@/lib/firebase';

export async function GET(req: NextRequest) {
  const start = Date.now();
  
  try {
    const auth = await withApiAuth(req);
    if (auth instanceof NextResponse) return auth;
    
    const rateCheck = await withRateLimit(req, auth.apiKey);
    if (rateCheck instanceof NextResponse) return rateCheck;
    
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const snapshot = await db.collection('products')
      .where('sellerId', '==', auth.apiKey.sellerId)
      .offset(offset)
      .limit(limit)
      .get();
    
    const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    
    await logApiUsage({
      apiKeyId: auth.apiKey.id,
      endpoint: '/products',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - start,
      requestSize: req.headers.get('content-length') ? parseInt(req.headers.get('content-length')!) : 0,
      responseSize: JSON.stringify(products).length
    });
    
    return NextResponse.json({ data: products, total: snapshot.size });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 5. Firestore Indexes (Required)

```yaml
# firestore.indexes.yaml

indexes:
  - collection: api_keys
    fields:
      - name: sellerId
      - name: revokedAt
  
  - collection: api_audit_logs
    fields:
      - name: apiKeyId
      - name: timestamp
  
  - collection: ad_campaigns
    fields:
      - name: sellerId
      - name: status
  
  - collection: ad_analytics
    fields:
      - name: campaignId
      - name: date
  
  - collection: products
    fields:
      - name: sellerId
      - name: createdAt
      - name: stock

# Deploy: firebase deploy --only firestore:indexes
```

---

## 6. Environment Variables

```bash
# .env.local
FIREBASE_PROJECT_ID=mercora-prod
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
GOOGLE_GENERATIVE_AI_API_KEY=...
NEXT_PUBLIC_API_BASE_URL=https://api.mercora.com
```

---

## 7. Dependencies to Add

```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase": "^10.0.0",
    "joi": "^17.0.0",
    "swagger-jsdoc": "^6.2.0",
    "swagger-ui-express": "^5.0.0",
    "recharts": "^2.10.0"
  }
}
```

**Implementation Order:**
1. apiService.ts (Hafta 1)
2. Middleware (auth.ts, rateLimit.ts) (Hafta 1)
3. API routes (Hafta 2-3)
4. inventoryService.ts (Hafta 3)
5. adService.ts (Hafta 5)
