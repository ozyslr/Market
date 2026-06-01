# EK A: Teknik Implementasyon Detayları

**Hedef:** Developers, Engineering Leads, Technical Decision Makers  
**Referans:** CFO_EXECUTIVE_BRIEF.md Faza 2-3 başlatılabilir

---

## 1. PHASE 2A: PAYOUT AUTOMATION (8 HAFTA)

### 1.1 Geçerli Durum Analizi

**Mevcut Kod:**
```typescript
// src/services/sellerPayoutService.ts - Line 60-83
export async function requestPayout(
  sellerId: string,
  amount: number,
  method: PayoutMethod,
  destination: string
): Promise<string> {
  // Manual request creation
  const fee = Math.max(5, amount * 0.01);
  const ref = await addDoc(collection(db, PAYOUT_COL), {
    sellerId,
    amount,
    fee,
    netAmount: amount - fee,
    status: 'pending',
    method,
    destination,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}
```

**Sorunlar:**
- ❌ Manual request only
- ❌ No scheduling
- ❌ No automatic processing
- ❌ No batch optimizations
- ❌ No tax withholding logic
- ❌ No integration with payment gateways

### 1.2 Hedef Tasarım

```
Flow:
User Sells Product
  ↓
Order Placed & Paid (Stripe processes)
  ↓
Commission Deducted (commissionService.ts - EXIST)
  ↓
Amount Added to SellerBalance.availableBalance
  ↓
[NEW] Cloud Function: Weekly Payout Trigger
  ↓
[NEW] Auto-create PayoutRequest (status: 'processing')
  ↓
[NEW] Process via Gateway (Stripe Connect or Bank API)
  ↓
[NEW] Mark status: 'completed'
  ↓
Seller sees in Dashboard: Payout processed
```

### 1.3 Implementation Checklist

**Backend (Firebase Cloud Functions):**

```typescript
// functions/src/payoutScheduler.ts (NEW FILE)
import * as functions from 'firebase-functions';
import { db } from './firebase';
import { collection, getDocs, query, where, updateDoc, doc, addDoc } from 'firebase/firestore';

// Trigger: Every Tuesday at 2 PM UTC
export const weeklyPayoutProcessor = functions.pubsub
  .schedule('0 14 ? * TUE')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Starting weekly payout processor...');
    
    try {
      // 1. Get all sellers with availableBalance > minimum
      const balanceSnap = await getDocs(
        query(
          collection(db, 'sellerBalances'),
          where('availableBalance', '>=', 50)
        )
      );

      for (const doc of balanceSnap.docs) {
        const balance = doc.data();
        const sellerId = balance.sellerId;
        
        // 2. Create payout request
        const fee = Math.max(5, balance.availableBalance * 0.01);
        const netAmount = balance.availableBalance - fee;
        
        const payoutId = await createPayoutRequest(
          sellerId,
          balance.availableBalance,
          fee,
          netAmount,
          balance.payoutMethod, // Stored in seller profile
          balance.bankAccount    // Stored in seller profile
        );

        // 3. Process payment via gateway
        const result = await processPaymentGateway(
          payoutId,
          balance.payoutMethod,
          netAmount,
          balance.bankAccount,
          balance.currency
        );

        // 4. Update payout status
        if (result.success) {
          await updatePayoutStatus(payoutId, 'processing', 'system');
          await updateSellerBalance(sellerId, 0); // Clear available
        } else {
          await updatePayoutStatus(payoutId, 'failed', 'system');
          console.error(`Payout failed for seller ${sellerId}: ${result.error}`);
        }
      }

      console.log(`Processed ${balanceSnap.docs.length} payouts`);
      return null;
    } catch (error) {
      console.error('Payout processor error:', error);
      throw error;
    }
  });

async function createPayoutRequest(
  sellerId: string,
  amount: number,
  fee: number,
  netAmount: number,
  method: string,
  destination: string
): Promise<string> {
  const ref = await addDoc(collection(db, 'payoutRequests'), {
    sellerId,
    amount,
    fee,
    netAmount,
    status: 'pending',
    method,
    destination,
    processedBy: 'system',
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

async function processPaymentGateway(
  payoutId: string,
  method: string,
  amount: number,
  destination: string,
  currency: string
): Promise<{ success: boolean; error?: string }> {
  // Implementation depends on payment method
  
  if (method === 'stripe') {
    return await processStripeConnect(payoutId, amount, destination, currency);
  } else if (method === 'bank_transfer') {
    return await processBankTransfer(payoutId, amount, destination, currency);
  } else if (method === 'iyzico') {
    return await processIyzicoPayment(payoutId, amount, destination, currency);
  }
  
  return { success: false, error: 'Unknown method' };
}

async function processStripeConnect(
  payoutId: string,
  amount: number,
  destination: string, // Stripe Account ID
  currency: string
): Promise<{ success: boolean; error?: string }> {
  // Assuming STRIPE_SECRET_KEY is set
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  try {
    const payout = await stripe.payouts.create(
      {
        amount: Math.round(amount * 100), // Stripe expects cents
        currency: currency.toLowerCase(),
        destination: destination,
      },
      {
        stripeAccount: destination,
      }
    );

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
}

async function processBankTransfer(
  payoutId: string,
  amount: number,
  destination: string, // IBAN
  currency: string
): Promise<{ success: boolean; error?: string }> {
  // Integration with bank API (e.g., Wise API, local bank)
  // This is a placeholder
  
  try {
    // Call bank transfer API
    console.log(`Processing bank transfer: ${amount} ${currency} to ${destination}`);
    // TODO: Implement actual bank integration
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
}

async function processIyzicoPayment(
  payoutId: string,
  amount: number,
  destination: string, // iyzico wallet ID
  currency: string
): Promise<{ success: boolean; error?: string }> {
  // Integration with iyzico payout API
  // Placeholder
  
  try {
    console.log(`Processing iyzico payout: ${amount} ${currency}`);
    // TODO: Implement iyzico API integration
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
}

async function updatePayoutStatus(
  payoutId: string,
  status: string,
  processedBy: string
): Promise<void> {
  await updateDoc(doc(db, 'payoutRequests', payoutId), {
    status,
    processedBy,
    processedAt: new Date().toISOString(),
  });
}

async function updateSellerBalance(sellerId: string, newAvailable: number): Promise<void> {
  const q = query(collection(db, 'sellerBalances'), where('sellerId', '==', sellerId));
  const snap = await getDocs(q);
  
  if (!snap.empty) {
    const balanceDoc = snap.docs[0];
    await updateDoc(balanceDoc.ref, {
      availableBalance: newAvailable,
      pendingBalance: newAvailable,
      totalPaidOut: (balanceDoc.data().totalPaidOut || 0) + newAvailable,
      updatedAt: new Date().toISOString(),
    });
  }
}
```

**Frontend Updates:**

```typescript
// src/pages/SellerDashboard.tsx (ADD section)
import { getSellerBalance, getPayoutHistory } from '@/services/sellerPayoutService';

export function SellerPayoutWidget() {
  const [balance, setBalance] = useState<SellerBalance | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRequest[]>([]);
  const [autoPayoutEnabled, setAutoPayoutEnabled] = useState(true);

  useEffect(() => {
    const seller = getCurrentSeller(); // from auth context
    if (seller) {
      // Refresh every 5 minutes to show updated balance
      const timer = setInterval(async () => {
        const bal = await getSellerBalance(seller.id);
        const history = await getPayoutHistory(seller.id);
        setBalance(bal);
        setPayoutHistory(history);
      }, 300000); // 5 min

      return () => clearInterval(timer);
    }
  }, []);

  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h2 className="text-xl font-bold mb-4">Ödeme & Denge</h2>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border-l-4 border-green-500 pl-4">
          <p className="text-sm text-gray-600">Mevcut Bakiye</p>
          <p className="text-2xl font-bold">
            {balance?.availableBalance.toFixed(2)} {balance?.currency}
          </p>
        </div>
        <div className="border-l-4 border-blue-500 pl-4">
          <p className="text-sm text-gray-600">Beklemede</p>
          <p className="text-2xl font-bold">
            {balance?.pendingBalance.toFixed(2)} {balance?.currency}
          </p>
        </div>
        <div className="border-l-4 border-purple-500 pl-4">
          <p className="text-sm text-gray-600">Toplam Kazanç</p>
          <p className="text-2xl font-bold">
            {balance?.totalEarned.toFixed(2)} {balance?.currency}
          </p>
        </div>
      </div>

      {/* Auto-Payout Toggle */}
      <div className="flex items-center justify-between mb-6 p-4 bg-green-50 border border-green-200 rounded">
        <div>
          <p className="font-semibold text-green-900">Otomatik Haftalık Ödeme</p>
          <p className="text-sm text-green-700">Her Salı otomatik olarak ödeme yap</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={autoPayoutEnabled} 
            onChange={(e) => setAutoPayoutEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
        </label>
      </div>

      {/* Payout History */}
      <div>
        <h3 className="font-semibold mb-3">Son Ödemeler</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Tarih</th>
              <th className="text-left py-2">Tutar</th>
              <th className="text-left py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {payoutHistory.slice(0, 5).map((payout) => (
              <tr key={payout.id} className="border-b hover:bg-gray-50">
                <td className="py-2">
                  {new Date(payout.createdAt).toLocaleDateString('tr-TR')}
                </td>
                <td className="py-2 font-semibold">
                  {payout.netAmount.toFixed(2)} ₺
                </td>
                <td className="py-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                    payout.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    payout.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payout.status === 'completed' && 'Tamamlandı'}
                    {payout.status === 'processing' && 'İşleniyor'}
                    {payout.status === 'failed' && 'Başarısız'}
                    {payout.status === 'pending' && 'Beklemede'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Database Schema Updates:**

```typescript
// Firestore: sellerBalances collection
{
  sellerId: "seller_123",
  totalEarned: 15000,
  totalCommission: -1500,  // Deducted amounts
  totalFees: -525,         // Payout fees
  totalPaidOut: 11000,     // Already paid
  pendingBalance: 1975,    // Held (30-day buffer)
  availableBalance: 0,     // Ready for payout
  currency: "TRY",
  payoutMethod: "stripe",  // NEW FIELD
  bankAccount: "TR63 0006 1001 5800 7311 6457", // IBAN or Stripe ID
  payoutFrequency: "weekly", // NEW FIELD
  updatedAt: "2026-05-24T10:00:00Z"
}

// Firestore: payoutRequests collection (updated schema)
{
  id: "payout_123",
  sellerId: "seller_123",
  amount: 2000,
  fee: 20,
  netAmount: 1980,
  status: "completed", // pending → processing → completed/failed
  method: "stripe",
  destination: "acct_stripe_id_123",
  notes: "Automatic weekly payout",
  processedBy: "system", // or admin_id
  processedAt: "2026-05-21T14:30:00Z",
  createdAt: "2026-05-21T14:00:00Z",
  
  // NEW FIELDS for tracking
  gatewayTransactionId: "tr_1234567890", // Stripe payout ID
  gatewayResponse: { ... }, // Full gateway response
  retryCount: 0,
  lastRetryAt: null,
}
```

**Testing Plan:**

```typescript
// tests/payoutScheduler.test.ts
import { weeklyPayoutProcessor } from '../src/payoutScheduler';
import { db } from '../src/firebase';

describe('Weekly Payout Processor', () => {
  test('should process payout for seller with available balance', async () => {
    // Setup: Create seller with balance
    // Execute: Call weeklyPayoutProcessor
    // Assert: PayoutRequest created with correct amount
    // Assert: SellerBalance.availableBalance = 0
    // Assert: SellerBalance.totalPaidOut increased
  });

  test('should skip seller below minimum balance', async () => {
    // Setup: Create seller with balance < 50
    // Execute: Call weeklyPayoutProcessor
    // Assert: No PayoutRequest created
  });

  test('should retry failed payments', async () => {
    // Setup: Stripe fails on first attempt
    // Execute: Retry logic
    // Assert: Payment succeeds on retry
  });

  test('should handle gateway errors gracefully', async () => {
    // Setup: Mock Stripe API error
    // Execute: Call weeklyPayoutProcessor
    // Assert: Status = 'failed', error logged
  });
});
```

---

## 2. PHASE 2B: FRAUD DETECTION MVP (8 HAFTA - PARALEL)

### 2.1 Geçerli Durum

**Mevcut Kod:**
```typescript
// src/pages/AdminDashboard.tsx - Fraud Detection section sadece UI
// src/services/ - Fraud detection logic YOKTUR
```

### 2.2 Hedef MVP

```
Detections:
1. Card Velocity → Same card, multiple transactions in <5 min
2. Geographic Anomaly → Transaction from unexpected country
3. Amount Spike → Transaction 3x+ normal user average
4. Device Fingerprint → New device + high-value purchase
5. Refund Pattern → >50% refund rate
```

### 2.3 Implementation

```typescript
// src/services/fraudDetectionService.ts (NEW FILE)
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

export interface FraudScore {
  userId: string;
  orderId: string;
  score: number; // 0-100 (>70 = suspicious)
  signals: {
    cardVelocity?: number;
    geographicAnomaly?: number;
    amountSpike?: number;
    deviceFingerprint?: number;
    refundPattern?: number;
  };
  recommendation: 'approve' | 'review' | 'block';
  createdAt: string;
}

export async function calculateFraudScore(
  userId: string,
  orderData: {
    orderId: string;
    amount: number;
    paymentMethodId: string;
    deviceId: string;
    userLocation: { country: string; ip: string };
  }
): Promise<FraudScore> {
  const signals = {
    cardVelocity: await checkCardVelocity(orderData.paymentMethodId),
    geographicAnomaly: await checkGeographicAnomaly(userId, orderData.userLocation),
    amountSpike: await checkAmountSpike(userId, orderData.amount),
    deviceFingerprint: await checkDeviceFingerprint(userId, orderData.deviceId),
    refundPattern: await checkRefundPattern(userId),
  };

  // Calculate composite score (weighted average)
  const weights = {
    cardVelocity: 0.25,
    geographicAnomaly: 0.20,
    amountSpike: 0.25,
    deviceFingerprint: 0.20,
    refundPattern: 0.10,
  };

  let score = 0;
  let signalCount = 0;
  
  for (const [key, value] of Object.entries(signals)) {
    if (value !== undefined) {
      score += value * weights[key as keyof typeof weights];
      signalCount++;
    }
  }

  const recommendation =
    score >= 75 ? 'block' :
    score >= 50 ? 'review' :
    'approve';

  return {
    userId,
    orderId: orderData.orderId,
    score: Math.round(score),
    signals,
    recommendation,
    createdAt: new Date().toISOString(),
  };
}

async function checkCardVelocity(paymentMethodId: string): Promise<number> {
  // Check if same card used >2 times in last 5 minutes
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const recentOrders = await getDocs(
    query(
      collection(db, 'orders'),
      where('paymentMethodId', '==', paymentMethodId),
      where('createdAt', '>=', fiveMinAgo),
      orderBy('createdAt', 'desc')
    )
  );

  // Return risk score (0-100)
  if (recentOrders.size > 3) return 95; // Highly suspicious
  if (recentOrders.size > 2) return 70; // Suspicious
  if (recentOrders.size > 1) return 35; // Medium
  return 0; // Normal
}

async function checkGeographicAnomaly(
  userId: string,
  currentLocation: { country: string; ip: string }
): Promise<number> {
  // Get user's last 10 transactions
  const userOrders = await getDocs(
    query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(10)
    )
  );

  if (userOrders.empty) return 0; // New user, can't assess

  const locations = userOrders.docs.map(d => d.data().userLocation);
  const normalCountries = new Set(locations.map(l => l.country));

  if (!normalCountries.has(currentLocation.country)) {
    // Calculate distance (simplified - just different country)
    return 65; // Suspicious
  }

  return 0;
}

async function checkAmountSpike(userId: string, currentAmount: number): Promise<number> {
  // Get average order value for this user
  const userOrders = await getDocs(
    query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
  );

  if (userOrders.size < 3) return 0; // Not enough history

  const amounts = userOrders.docs.map(d => d.data().total);
  const average = amounts.reduce((a, b) => a + b) / amounts.length;

  const spike = currentAmount / average;
  
  if (spike > 5) return 95;   // 5x spike = very suspicious
  if (spike > 3) return 70;   // 3x spike = suspicious
  if (spike > 1.5) return 35; // 1.5x spike = medium
  return 0;
}

async function checkDeviceFingerprint(userId: string, currentDeviceId: string): Promise<number> {
  // Get user's known devices
  const userOrders = await getDocs(
    query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    )
  );

  const knownDevices = new Set(userOrders.docs.map(d => d.data().deviceId));

  if (knownDevices.has(currentDeviceId)) {
    return 0; // Known device
  }

  // New device
  if (knownDevices.size === 0) return 0; // First purchase
  if (knownDevices.size < 3) return 40; // Few purchases, might be normal
  return 75; // Established user, new device = suspicious
}

async function checkRefundPattern(userId: string): Promise<number> {
  // Get user's completed orders and refunds
  const userOrders = await getDocs(
    query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(30)
    )
  );

  const completedOrders = userOrders.docs.filter(d => d.data().status === 'delivered');
  const returnRequests = await getDocs(
    query(
      collection(db, 'returnRequests'),
      where('userId', '==', userId)
    )
  );

  if (completedOrders.length < 5) return 0; // Not enough history

  const refundRate = returnRequests.size / completedOrders.length;

  if (refundRate > 0.5) return 90;  // 50%+ refund = very suspicious
  if (refundRate > 0.3) return 70;  // 30%+ refund = suspicious
  if (refundRate > 0.1) return 40;  // 10%+ refund = medium
  return 0;
}

export async function logFraudScore(score: FraudScore): Promise<void> {
  // Store score for analysis
  await addDoc(collection(db, 'fraudScores'), score);

  // Alert if high risk
  if (score.score >= 70) {
    console.warn(`High fraud score for user ${score.userId}:`, score);
    // TODO: Send to Sentry or monitoring service
    // TODO: Send alert to fraud team
  }
}
```

**Frontend Integration:**

```typescript
// src/pages/AdminDashboard.tsx - Add Fraud Detection section
import { FraudScore, calculateFraudScore } from '@/services/fraudDetectionService';

export function FraudDetectionDashboard() {
  const [fraudScores, setFraudScores] = useState<FraudScore[]>([]);
  const [filter, setFilter] = useState('high'); // 'all', 'high', 'review'

  useEffect(() => {
    // Load fraud scores
    const loadScores = async () => {
      const scores = await getDocs(
        query(
          collection(db, 'fraudScores'),
          orderBy('createdAt', 'desc'),
          limit(50)
        )
      );
      setFraudScores(scores.docs.map(d => d.data() as FraudScore));
    };

    loadScores();
    const timer = setInterval(loadScores, 60000); // Refresh every minute
    return () => clearInterval(timer);
  }, []);

  const filtered = fraudScores.filter(s => {
    if (filter === 'high') return s.score >= 70;
    if (filter === 'review') return s.score >= 50 && s.score < 70;
    return true;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Fraud Detection Dashboard</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card title="Total Scores" value={fraudScores.length.toString()} />
        <Card 
          title="High Risk" 
          value={fraudScores.filter(s => s.score >= 70).length.toString()} 
          color="red"
        />
        <Card 
          title="Under Review" 
          value={fraudScores.filter(s => s.score >= 50 && s.score < 70).length.toString()} 
          color="yellow"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {['all', 'high', 'review'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Fraud Scores Table */}
      <table className="w-full border-collapse bg-white rounded-lg shadow">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-3 px-4">Order ID</th>
            <th className="text-left py-3 px-4">User</th>
            <th className="text-left py-3 px-4">Amount</th>
            <th className="text-center py-3 px-4">Fraud Score</th>
            <th className="text-left py-3 px-4">Signals</th>
            <th className="text-center py-3 px-4">Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(score => (
            <tr key={score.orderId} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4 font-mono text-sm">{score.orderId}</td>
              <td className="py-3 px-4">{score.userId}</td>
              <td className="py-3 px-4">...</td>
              <td className="py-3 px-4 text-center">
                <span className={`text-xl font-bold ${
                  score.score >= 70 ? 'text-red-600' :
                  score.score >= 50 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {score.score}/100
                </span>
              </td>
              <td className="py-3 px-4 text-sm">
                {Object.entries(score.signals)
                  .filter(([_, v]) => v !== undefined && v > 30)
                  .map(([k, v]) => (
                    <span key={k} className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded mr-1 text-xs">
                      {k}: {v}
                    </span>
                  ))}
              </td>
              <td className="py-3 px-4 text-center">
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 3. PHASE 2C: FINANSAL RAPORLAMA (8 HAFTA)

### 3.1 KDV Raporu

```typescript
// src/services/taxReportService.ts (NEW FILE)
export interface KDVReport {
  period: { startDate: string; endDate: string };
  grossSales: number;
  kdvAmount: number;
  returns: number;
  netSales: number;
  customsCharges: number;
}

export async function generateKDVReport(
  startDate: string,
  endDate: string
): Promise<KDVReport> {
  // Query orders by date range
  // Calculate KDV on each order
  // Deduct returns
  // Generate report
}
```

### 3.2 Kategori Analizi

```typescript
export interface CategoryAnalysis {
  category: string;
  totalSales: number;
  avgOrderValue: number;
  commissionRate: number;
  commissionAmount: number;
  orderCount: number;
  refundRate: number;
}

export async function getCategoryAnalytics(sellerId: string): Promise<CategoryAnalysis[]> {
  // Group orders by category
  // Calculate metrics
}
```

### 3.3 PDF Export

```typescript
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export function exportFinancialReport(data: FinancialData): void {
  const doc = new jsPDF();
  
  doc.text('Finansal Rapor', 20, 20);
  doc.autoTable({
    head: [['Tarih', 'İşlem', 'Tutar']],
    body: data.transactions.map(t => [t.date, t.description, t.amount.toString()]),
  });

  doc.save(`financial-report-${new Date().toISOString().split('T')[0]}.pdf`);
}
```

---

## 4. MOCK DATA VE TEST FIXTURES

```typescript
// tests/fixtures/payoutMockData.ts
export const mockSellerBalance = {
  sellerId: 'seller_123',
  totalEarned: 15000,
  totalCommission: -1500,
  totalFees: -525,
  totalPaidOut: 11000,
  pendingBalance: 1975,
  availableBalance: 2000,
  currency: 'TRY',
  payoutMethod: 'stripe',
  bankAccount: 'acct_1234567890',
};

export const mockPayoutRequest = {
  id: 'payout_456',
  sellerId: 'seller_123',
  amount: 2000,
  fee: 20,
  netAmount: 1980,
  status: 'completed',
  method: 'stripe',
  destination: 'acct_1234567890',
  createdAt: '2026-05-21T14:00:00Z',
};
```

---

## 5. DEPLOYMENT CHECKLIST

- [ ] Cloud Functions deployed (payout scheduler)
- [ ] Stripe Connect integration tested
- [ ] Bank API integration ready
- [ ] Fraud detection scores logged
- [ ] Admin dashboard updated
- [ ] Seller dashboard updated
- [ ] Database schema migrated
- [ ] Monitoring & alerts set up
- [ ] Documentation updated
- [ ] QA testing completed

---

## NEXT STEPS

1. **Week 1-2:** Backend Cloud Functions development
2. **Week 3-4:** Payment gateway integrations
3. **Week 5-6:** Fraud detection algorithms
4. **Week 7-8:** Integration testing & deployment

---

**Technical Lead Review:** _____________________  
**Date:** ___________

**QA Sign-Off:** _____________________  
**Date:** ___________
