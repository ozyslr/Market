# İade Sistemi Implementasyon Rehberi
## E-tic 2026 - Faz 1 Teknik Detayları (Ay 1-2)

**Versiyon:** 1.0  
**Yayın Tarihi:** 24 Mayıs 2026  
**Son Güncelleme:** [TBD]  
**Status:** APPROVED FOR IMPLEMENTATION  

---

## I. Genel Bakış & Mimarı

### Mevcut Sistem
```
Order Created
    ↓
Order Status: pending → paid → processing → shipped → delivered
    ↓
[MANUAL] AdminReturns.tsx: Admin "Onayla" veya "Reddet" butonu
    ↓
Order Status: refunded/cancelled
    ↓
[MANUAL] Email gönder (satıcı & müşteri)
```

### Yeni Sistem (Faz 1)
```
Order Delivered
    ↓
[NEW] User: "İade Iste" Click → ReturnRequestModal
    ↓
[NEW] returnRequests Collection (Firebase)
    ↓
[NEW] Approval Rules Engine (Auto/Manual)
    ↓
[NEW] Notification Service (SMS+Email+Push)
    ↓
[NEW] Admin Dashboard (Analytics)
    ↓
[FUTURE] Kargo Integration, Dispute System, Refund API
```

---

## II. Database Schema Design

### A. New Collections in Firestore

#### 1. `returnRequests` Collection
```typescript
// Path: /returnRequests/{returnRequestId}
export interface ReturnRequest {
  // IDs
  id: string;                                    // Auto-generated
  orderId: string;                               // From orders collection
  userId: string;                                // From auth
  sellerId: string;                              // From order.items[0].sellerId
  
  // Request Details
  reason: ReturnReason;                          // Enum
  description: string;                           // Max 500 chars
  photoUrls: string[];                           // Cloud Storage paths
  
  // Status & Timeline
  status: ReturnRequestStatus;                   // pending | approved | rejected | disputed | received | refunded
  statusHistory: {
    timestamp: string;
    status: ReturnRequestStatus;
    changedBy: string;                           // 'system' | userId | 'admin'
    metadata?: any;
  }[];
  
  // Approval Details
  approvalType?: 'auto' | 'manual';              // How it was approved
  approvedAt?: string;
  approvedBy?: string;                           // 'system' | adminId
  approvalReason?: string;                       // Why it was approved
  
  // Rejection Details
  rejectedAt?: string;
  rejectionReason?: string;                      // Reason for rejection (show to customer)
  rejectionInternalNotes?: string;               // Internal notes (admins only)
  
  // Shipping & Tracking
  shipmentDetails?: {
    carrier?: string;                            // 'aras' | 'mng' | etc (future)
    trackingNumber?: string;
    label?: {                                     // Future kargo integration
      url: string;
      type: 'pdf' | 'qr' | 'nfc';
      generatedAt: string;
    };
    shippedAt?: string;
    estimatedDelivery?: string;
  };
  
  // Receiving & Verification
  receivedAt?: string;
  receivedBy?: string;                           // 'seller' | 'system'
  conditionOnReceived?: string;                  // Malın durumu (future)
  
  // Refund Details
  refund?: {
    amount: number;
    originalPaymentMethod: PaymentMethod;
    status: 'pending' | 'processed' | 'failed';  // Status
    stripeRefundId?: string;
    processedAt?: string;
    failureReason?: string;
    retryCount: number;
  };
  
  // Dispute (Future)
  disputeId?: string;                            // Link to returnDisputes collection
  
  // Flags & Metadata
  flags?: {
    isFraud?: boolean;
    fraudScore?: number;
    requiresManualReview?: boolean;
    isHighValue?: boolean;                       // >5000₺
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Notification Tracking
  notifications?: {
    createdNotificationId?: string;
    approvedNotificationId?: string;
    shipmentNotificationId?: string;
    refundedNotificationId?: string;
  };
}

// Enums
type ReturnReason = 
  | 'defective'          // Ürün hatalı/arızalı
  | 'damaged'            // Kargoda hasar gördü
  | 'not_as_described'   // Açıklamaya uymuyor
  | 'wrong_item'         // Yanlış ürün gönderildi
  | 'wrong_size'         // Yanlış beden/ölçü
  | 'wrong_color'        // Yanlış renk
  | 'changed_mind'       // Fikrimi değiştirdim
  | 'other';             // Diğer (description gerekli)

type ReturnRequestStatus = 
  | 'pending'            // Müşteri tarafından oluşturuldu, onay bekleniyor
  | 'approved'           // Onaylandı, kargo bekleniyor
  | 'rejected'           // Reddedildi
  | 'disputed'           // İtiraz açıldı
  | 'shipped'            // Malı geri gönderildi
  | 'received'           // Satıcı tarafından alındı
  | 'refunded'           // Para iade edildi
  | 'cancelled';         // Müşteri tarafından iptal edildi
```

#### 2. `returnReasons` Collection (Configuration)
```typescript
// Path: /returnReasons/{reasonId}
interface ReturnReasonConfig {
  id: ReturnReason;
  labelKey: string;                              // i18n key (e.g., 'return.reason.defective')
  description: string;                           // Daha detaylı açıklama
  requiresProof?: boolean;                       // Fotoğraf istensin mi?
  requiresDescription?: boolean;                 // Açıklama istensin mi?
  autoApprovalAllowed: boolean;                  // Bu sebep otomatik onaylanabilir mi?
  approvalPriority: 'high' | 'medium' | 'low';  // Manual review sırasında
  refundPercentage: number;                      // %100 (default) vs %50 (changed_mind)
  maxApprovalTimeHours: number;                  // Onay için max süre
}
```

#### 3. `returnMetrics` Collection (Daily Snapshots)
```typescript
// Path: /returnMetrics/{YYYY-MM-DD}
interface ReturnMetricsSnapshot {
  date: string;                                  // YYYY-MM-DD
  
  // Volume Metrics
  totalCreated: number;
  totalApproved: number;
  totalRejected: number;
  totalDisputedCount: number;
  totalReceived: number;
  totalRefunded: number;
  
  // Timing Metrics
  avgApprovalTimeMinutes: number;
  medianApprovalTimeMinutes: number;
  p95ApprovalTimeMinutes: number;
  
  avgRefundTimeHours: number;                    // Malı alındı → Para iade
  
  // Breakdown by Reason
  reasonBreakdown: {
    [reason in ReturnReason]?: {
      count: number;
      approvalRate: number;                      // 0-1
      avgApprovalTimeMinutes: number;
    };
  };
  
  // Breakdown by Seller
  topSellersByReturnCount: Array<{
    sellerId: string;
    returnCount: number;
    approvalRate: number;
  }>;
  
  // Flags
  fraudFlagCount: number;
  manualReviewRequiredCount: number;
  
  // Financial
  totalRefundAmount: number;                     // ₺
  averageRefundAmount: number;
  
  // Calculations
  autoApprovalRate: number;                      // (approved - manual) / approved
  disputeRate: number;                           // disputed / total
  fraudRate: number;                             // flagged / total
}
```

#### 4. `approvalRules` Collection (Configuration)
```typescript
// Path: /approvalRules/config
interface ApprovalRulesConfig {
  id: 'config';
  
  rules: {
    // Rule 1: By Reason
    byReason: {
      [reason in ReturnReason]?: {
        autoApprove: boolean;
        requiresManualReview: boolean;
        maxPendingTimeHours: number;
      };
    };
    
    // Rule 2: By Price
    byPrice: {
      lowValue: {
        maxAmount: number;                      // e.g., 500
        autoApprove: boolean;
      };
      highValue: {
        minAmount: number;                      // e.g., 5000
        requiresManualReview: boolean;
      };
    };
    
    // Rule 3: By Seller
    bySeller: {
      minApprovalRateForAuto: number;           // e.g., 0.95 (95%)
      minReviewsForAuto: number;                // e.g., 100 reviews
    };
    
    // Rule 4: By Customer
    byCustomer: {
      maxReturnCountPerMonth: number;           // e.g., 5
      minDaysBetweenReturns: number;            // e.g., 7 (flag abuse)
    };
    
    // Rule 5: By Time
    byTime: {
      maxDaysSincePurchase: number;             // e.g., 30
      maxDaysSinceDelivery: number;             // e.g., 30
    };
  };
  
  // Escalation Rules
  escalation: {
    manualReviewMaxHours: number;               // SLA for manual review
    disputeMaxDays: number;                     // SLA for dispute resolution
  };
  
  // Notification Rules
  notifications: {
    notifySellerOnReturn: boolean;
    notifyAdminOnManualReview: boolean;
    notifyAdminOnFraudFlag: boolean;
  };
  
  updatedAt: string;
  updatedBy: string;
}
```

### B. Update Existing Collections

#### Order Type Updates
```typescript
// In /src/types/order.ts
export interface Order {
  // ... existing fields ...
  
  // NEW: Link to return requests (if any)
  returnRequestIds?: string[];                  // Array of returnRequest IDs
  latestReturnRequest?: {
    id: string;
    status: ReturnRequestStatus;
    createdAt: string;
  };
}

// Update OrderStatus to include new statuses
export type OrderStatus = 
  | 'pending' 
  | 'paid' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'return_requested'    // NEW: Customer initiated return
  | 'return_approved'     // NEW: Return was approved
  | 'return_rejected'     // NEW: Return was rejected
  | 'return_shipped'      // NEW: Item shipped back
  | 'return_received'     // NEW: Item received by seller
  | 'refunded'           // Updated meaning: Money refunded
  | 'cancelled' 
  | 'disputed';
```

---

## III. Backend Implementation

### A. Service Layer (`/src/services/returnService.ts`)

```typescript
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ReturnRequest, ReturnRequestStatus, ReturnReason } from '../types/return';
import { Order } from '../types/order';

const RETURNS_COLLECTION = 'returnRequests';
const METRICS_COLLECTION = 'returnMetrics';
const RULES_COLLECTION = 'approvalRules';

// ==================== CREATE ====================

/**
 * Create a return request from customer
 */
export async function createReturnRequest(
  orderId: string,
  userId: string,
  reason: ReturnReason,
  description: string,
  photoUrls?: string[]
): Promise<ReturnRequest> {
  try {
    // Validate: Order exists and user is owner
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists() || orderSnap.data().userId !== userId) {
      throw new Error('Order not found or not owned by user');
    }
    
    const orderData = orderSnap.data() as Order;
    if (orderData.status !== 'delivered') {
      throw new Error('Only delivered orders can be returned');
    }
    
    // Check if already returned
    if (orderData.returnRequestIds?.length) {
      const activeReturn = await checkActiveReturn(orderId);
      if (activeReturn) {
        throw new Error('Order already has an active return request');
      }
    }
    
    // Calculate seller ID from first item
    const sellerId = orderData.items[0].sellerId;
    
    // Create return request
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, RETURNS_COLLECTION), {
      orderId,
      userId,
      sellerId,
      reason,
      description,
      photoUrls: photoUrls || [],
      status: 'pending',
      statusHistory: [{
        timestamp: now,
        status: 'pending',
        changedBy: 'user',
      }],
      createdAt: now,
      updatedAt: now,
      notifications: {},
    } as Omit<ReturnRequest, 'id'>);
    
    // Update order with return request reference
    await updateDoc(orderRef, {
      returnRequestIds: [...(orderData.returnRequestIds || []), docRef.id],
      latestReturnRequest: {
        id: docRef.id,
        status: 'pending',
        createdAt: now,
      },
    });
    
    // Create notification for customer
    await createNotification(userId, 'return_created', 
      '✓ İade talebi alındı',
      'İade talebiniz sisteme kaydedildi. 24 saat içinde onay alacaksınız.',
      `/profile?tab=orders`
    );
    
    // Create notification for admin (queue for manual review)
    await createNotification('admin', 'return_queue',
      'Yeni İade Talebi',
      `Order #${orderId.slice(0, 8)} - ${reason}`,
      `/admin/returns?filter=pending`
    );
    
    return {
      id: docRef.id,
      orderId,
      userId,
      sellerId,
      reason,
      description,
      photoUrls: photoUrls || [],
      status: 'pending',
      statusHistory: [{
        timestamp: now,
        status: 'pending',
        changedBy: 'user',
      }],
      createdAt: now,
      updatedAt: now,
      notifications: {},
    };
    
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, RETURNS_COLLECTION);
    throw error;
  }
}

// ==================== READ ====================

/**
 * Get return request by ID
 */
export async function getReturnRequest(returnRequestId: string): Promise<ReturnRequest | null> {
  try {
    const snap = await getDoc(doc(db, RETURNS_COLLECTION, returnRequestId));
    return snap.exists() 
      ? ({ id: snap.id, ...snap.data() } as ReturnRequest) 
      : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${RETURNS_COLLECTION}/${returnRequestId}`);
    return null;
  }
}

/**
 * Get return requests for a user (pagination support)
 */
export async function getReturnRequestsByUser(
  userId: string,
  limit = 20,
  orderBy = 'createdAt'
): Promise<ReturnRequest[]> {
  try {
    const q = query(
      collection(db, RETURNS_COLLECTION),
      where('userId', '==', userId),
      orderBy(orderBy, 'desc')
    );
    // TODO: Add pagination with startAfter
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as ReturnRequest);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, RETURNS_COLLECTION);
    return [];
  }
}

/**
 * Get return requests for a seller
 */
export async function getReturnRequestsBySeller(
  sellerId: string,
  status?: ReturnRequestStatus
): Promise<ReturnRequest[]> {
  try {
    let q = query(
      collection(db, RETURNS_COLLECTION),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );
    if (status) {
      q = query(
        collection(db, RETURNS_COLLECTION),
        where('sellerId', '==', sellerId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as ReturnRequest);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, RETURNS_COLLECTION);
    return [];
  }
}

/**
 * Get all pending returns (for admin dashboard)
 */
export async function getPendingReturns(limit = 50): Promise<ReturnRequest[]> {
  try {
    const q = query(
      collection(db, RETURNS_COLLECTION),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.slice(0, limit).map(d => ({ id: d.id, ...d.data() }) as ReturnRequest);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, RETURNS_COLLECTION);
    return [];
  }
}

// ==================== UPDATE ====================

/**
 * Update return request status
 */
export async function updateReturnStatus(
  returnRequestId: string,
  newStatus: ReturnRequestStatus,
  metadata?: { approvedBy?: string; rejectionReason?: string; }
): Promise<void> {
  try {
    const returnRef = doc(db, RETURNS_COLLECTION, returnRequestId);
    const returnSnap = await getDoc(returnRef);
    
    if (!returnSnap.exists()) {
      throw new Error('Return request not found');
    }
    
    const returnData = returnSnap.data() as ReturnRequest;
    const now = new Date().toISOString();
    
    // Build update object
    const updateObj: Partial<ReturnRequest> = {
      status: newStatus,
      updatedAt: now,
      statusHistory: [
        ...returnData.statusHistory,
        {
          timestamp: now,
          status: newStatus,
          changedBy: metadata?.approvedBy || 'system',
          metadata,
        },
      ],
    };
    
    // Add status-specific fields
    if (newStatus === 'approved') {
      updateObj.approvedAt = now;
      updateObj.approvedBy = metadata?.approvedBy || 'system';
      updateObj.approvalType = metadata?.approvalType || 'manual';
    }
    
    if (newStatus === 'rejected') {
      updateObj.rejectedAt = now;
      updateObj.rejectionReason = metadata?.rejectionReason;
    }
    
    // Update return request
    await updateDoc(returnRef, updateObj);
    
    // Update corresponding order
    const orderRef = doc(db, 'orders', returnData.orderId);
    await updateDoc(orderRef, {
      'latestReturnRequest.status': newStatus,
      status: `return_${newStatus}`, // e.g., 'return_approved'
    });
    
    // Send notifications based on status
    await sendReturnStatusNotification(returnData, newStatus);
    
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${RETURNS_COLLECTION}/${returnRequestId}`);
    throw error;
  }
}

// ==================== APPROVAL LOGIC ====================

/**
 * Approval rules engine
 */
export async function evaluateApprovalRules(
  returnRequest: ReturnRequest,
  order: Order
): Promise<{ shouldAutoApprove: boolean; reason: string }> {
  try {
    // Get current rules
    const rulesSnap = await getDoc(doc(db, RULES_COLLECTION, 'config'));
    if (!rulesSnap.exists()) {
      return { shouldAutoApprove: false, reason: 'Rules not configured' };
    }
    
    const rules = rulesSnap.data();
    
    // Rule 1: Check by reason
    const reasonRule = rules.rules.byReason[returnRequest.reason];
    if (reasonRule && !reasonRule.autoApprove) {
      return { shouldAutoApprove: false, reason: `Reason "${returnRequest.reason}" requires manual review` };
    }
    
    // Rule 2: Check by price
    if (order.total > rules.rules.byPrice.highValue.minAmount) {
      if (rules.rules.byPrice.highValue.requiresManualReview) {
        return { shouldAutoApprove: false, reason: `High value order (₺${order.total})` };
      }
    }
    
    // Rule 3: Check seller reliability
    const sellerReturns = await getReturnRequestsBySeller(order.items[0].sellerId);
    const approvalRate = sellerReturns.filter(r => r.status === 'approved').length / sellerReturns.length;
    if (approvalRate < rules.rules.bySeller.minApprovalRateForAuto) {
      return { shouldAutoApprove: false, reason: `Seller approval rate too low: ${approvalRate.toFixed(2)}` };
    }
    
    // Rule 4: Check customer abuse
    const userReturns = await getReturnRequestsByUser(returnRequest.userId);
    const monthlyReturns = userReturns.filter(r => {
      const daysAgo = (new Date().getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    }).length;
    
    if (monthlyReturns > rules.rules.byCustomer.maxReturnCountPerMonth) {
      return { shouldAutoApprove: false, reason: `Customer exceeds monthly return limit` };
    }
    
    // Rule 5: Check timing
    const daysSinceDelivery = (new Date().getTime() - new Date(order.shippedAt || order.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > rules.rules.byTime.maxDaysSinceDelivery) {
      return { shouldAutoApprove: false, reason: `Too late for return (${daysSinceDelivery.toFixed(0)} days)` };
    }
    
    // All checks passed
    return { shouldAutoApprove: true, reason: 'All rules passed' };
    
  } catch (error) {
    console.error('Error evaluating approval rules:', error);
    return { shouldAutoApprove: false, reason: 'Error in rule evaluation' };
  }
}

/**
 * Process pending returns (run periodically or on-demand)
 */
export async function processApprovalQueue(): Promise<{ processed: number; errors: number }> {
  try {
    const pendingReturns = await getPendingReturns();
    let processed = 0;
    let errors = 0;
    
    for (const returnRequest of pendingReturns) {
      try {
        const order = await getOrderById(returnRequest.orderId);
        if (!order) continue;
        
        const { shouldAutoApprove } = await evaluateApprovalRules(returnRequest, order);
        
        if (shouldAutoApprove) {
          await updateReturnStatus(returnRequest.id, 'approved', {
            approvalType: 'auto',
            approvedBy: 'system',
          });
          processed++;
        }
      } catch (err) {
        console.error(`Error processing return ${returnRequest.id}:`, err);
        errors++;
      }
    }
    
    return { processed, errors };
    
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, RETURNS_COLLECTION);
    return { processed: 0, errors: 1 };
  }
}

// ==================== METRICS ====================

/**
 * Calculate and store daily metrics snapshot
 */
export async function recordDailyMetrics(date?: string): Promise<void> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  try {
    // Get all returns for the day
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const q = query(
      collection(db, RETURNS_COLLECTION),
      where('createdAt', '>=', `${targetDate}T00:00:00Z`),
      where('createdAt', '<', nextDay.toISOString())
    );
    
    const snap = await getDocs(q);
    const returns = snap.docs.map(d => d.data() as ReturnRequest);
    
    // Calculate metrics
    const metrics = {
      date: targetDate,
      totalCreated: returns.length,
      totalApproved: returns.filter(r => r.status === 'approved').length,
      totalRejected: returns.filter(r => r.status === 'rejected').length,
      // ... more metrics
    };
    
    // Store in metrics collection
    await setDoc(doc(db, METRICS_COLLECTION, targetDate), metrics);
    
  } catch (error) {
    console.error('Error recording metrics:', error);
  }
}

// ==================== HELPERS ====================

/**
 * Check if order has an active return
 */
async function checkActiveReturn(orderId: string): Promise<boolean> {
  const q = query(
    collection(db, RETURNS_COLLECTION),
    where('orderId', '==', orderId),
    where('status', 'in', ['pending', 'approved', 'shipped'])
  );
  const snap = await getDocs(q);
  return snap.size > 0;
}

/**
 * Send notification based on status change
 */
async function sendReturnStatusNotification(
  returnRequest: ReturnRequest,
  newStatus: ReturnRequestStatus
): Promise<void> {
  const messages: Record<ReturnRequestStatus, { title: string; message: string; link: string }> = {
    pending: { title: '', message: '', link: '' },
    approved: {
      title: '✓ İade Talebiniz Onaylandı',
      message: 'Malları geri göndermek için kargo şubelerine başvurun.',
      link: `/profile?tab=orders&returnId=${returnRequest.id}`,
    },
    rejected: {
      title: '✗ İade Talebiniz Reddedildi',
      message: returnRequest.rejectionReason || 'Lütfen müşteri hizmetlerine başvurun.',
      link: `/support`,
    },
    shipped: {
      title: '📦 Mallar Yolda',
      message: 'Geri gönderilen ürünler tarafımızla yolda.',
      link: `/profile?tab=orders&returnId=${returnRequest.id}`,
    },
    received: {
      title: '✓ Mallar Alındı',
      message: '24 saat içinde iade para süreci başlatılacak.',
      link: `/profile?tab=orders&returnId=${returnRequest.id}`,
    },
    refunded: {
      title: '💰 Para İade Edildi',
      message: 'İade paranız hesabınıza gönderildi.',
      link: `/profile?tab=orders&returnId=${returnRequest.id}`,
    },
    disputed: {
      title: '⚠️ İade İtiraz Açıldı',
      message: 'Sorunu çözmek için yardım ekibimiz çalışıyor.',
      link: `/support`,
    },
    cancelled: {
      title: '✗ İade İptal Edildi',
      message: 'İade talebi iptal edildi.',
      link: `/profile?tab=orders`,
    },
  };
  
  const msg = messages[newStatus];
  if (msg.title) {
    await createNotification(returnRequest.userId, 'return_status_changed', msg.title, msg.message, msg.link);
    
    // Also notify seller
    if (['approved', 'shipped', 'received'].includes(newStatus)) {
      await createNotification(returnRequest.sellerId, 'seller_return', msg.title, msg.message, `/seller/returns`);
    }
  }
}

// Export types for use in components
export type { ReturnRequest, ReturnReason, ReturnRequestStatus };
```

---

## IV. Frontend Implementation

### A. New Types (`/src/types/return.ts`)

```typescript
export type ReturnReason = 
  | 'defective'
  | 'damaged'
  | 'not_as_described'
  | 'wrong_item'
  | 'wrong_size'
  | 'wrong_color'
  | 'changed_mind'
  | 'other';

export type ReturnRequestStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'disputed'
  | 'shipped'
  | 'received'
  | 'refunded'
  | 'cancelled';

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  sellerId: string;
  reason: ReturnReason;
  description: string;
  photoUrls: string[];
  status: ReturnRequestStatus;
  approvalType?: 'auto' | 'manual';
  approvedAt?: string;
  rejectionReason?: string;
  shipmentDetails?: {
    carrier?: string;
    trackingNumber?: string;
  };
  refund?: {
    amount: number;
    status: 'pending' | 'processed' | 'failed';
  };
  createdAt: string;
  updatedAt: string;
}
```

### B. Return Request Modal Component (`/src/components/commerce/ReturnRequestModal.tsx`)

```typescript
import React, { useState } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { createReturnRequest } from '@/services/returnService';
import { ReturnReason } from '@/types/return';
import { cn } from '@/lib/utils';

interface ReturnRequestModalProps {
  orderId: string;
  userId: string;
  orderTotal: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const RETURN_REASONS: { value: ReturnReason; label: string; emoji: string }[] = [
  { value: 'defective', label: 'Ürün hatalı/arızalı', emoji: '⚠️' },
  { value: 'damaged', label: 'Kargoda hasar gördü', emoji: '📦' },
  { value: 'not_as_described', label: 'Açıklamaya uymuyor', emoji: '❌' },
  { value: 'wrong_item', label: 'Yanlış ürün gönderildi', emoji: '🔄' },
  { value: 'wrong_size', label: 'Yanlış beden/ölçü', emoji: '📏' },
  { value: 'wrong_color', label: 'Yanlış renk', emoji: '🎨' },
  { value: 'changed_mind', label: 'Fikrimi değiştirdim', emoji: '🤔' },
  { value: 'other', label: 'Diğer (açıklayınız)', emoji: '📝' },
];

export const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
  orderId,
  userId,
  orderTotal,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'reason' | 'details' | 'confirm' | 'loading' | 'success'>('reason');
  const [selectedReason, setSelectedReason] = useState<ReturnReason | null>(null);
  const [description, setDescription] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleReasonSelect = (reason: ReturnReason) => {
    setSelectedReason(reason);
    setStep('details');
    setError(null);
  };

  const handlePhotoUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      const file = files[0];
      
      // TODO: Upload to Firebase Storage
      // const storage = getStorage();
      // const fileRef = ref(storage, `returns/${orderId}/${Date.now()}`);
      // const snapshot = await uploadBytes(fileRef, file);
      // const url = await getDownloadURL(snapshot.ref);
      
      // For now, mock
      const url = URL.createObjectURL(file);
      setPhotoUrls([...photoUrls, url]);
    } catch (err) {
      setError('Fotoğraf yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('Lütfen bir sebep seçin');
      return;
    }
    
    if (!description.trim()) {
      setError('Lütfen açıklama giriniz');
      return;
    }

    setStep('loading');
    setError(null);

    try {
      await createReturnRequest(
        orderId,
        userId,
        selectedReason,
        description,
        photoUrls
      );
      
      setStep('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İade talebi oluşturulamadı');
      setStep('details');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A1033] to-accent p-6 flex justify-between items-center">
          <h2 className="text-2xl font-display font-black text-white">İade Talebi</h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 'reason' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <p className="text-sm font-medium text-[#1A1033]/60">
                Ürünü neden iade etmek istiyorsunuz?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {RETURN_REASONS.map(reason => (
                  <button
                    key={reason.value}
                    onClick={() => handleReasonSelect(reason.value)}
                    className="p-4 border-2 border-[#F8F8FA] rounded-2xl hover:border-accent hover:bg-accent/5 transition-all text-left"
                  >
                    <div className="text-2xl mb-1">{reason.emoji}</div>
                    <div className="text-xs font-bold text-[#1A1033]">{reason.label}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'details' && selectedReason && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div>
                <label className="text-sm font-bold text-[#1A1033] mb-2 block">
                  Detaylı Açıklama *
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Problemi detaylıca açıklayınız (min. 20 karakter)..."
                  className="w-full p-3 border border-[#F8F8FA] rounded-xl text-sm font-medium outline-none focus:border-accent resize-none"
                  rows={4}
                />
                <p className="text-[10px] text-[#1A1033]/40 mt-1">
                  {description.length}/500
                </p>
              </div>

              <div>
                <label className="text-sm font-bold text-[#1A1033] mb-2 block">
                  Fotoğraf Ekle (Opsiyonel)
                </label>
                <div className="border-2 border-dashed border-[#F8F8FA] rounded-2xl p-6 text-center hover:border-accent transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handlePhotoUpload(e.target.files || new FileList())}
                    disabled={uploading}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload size={24} className="text-accent mb-2" />
                    <p className="text-xs font-bold text-[#1A1033]">
                      {uploading ? 'Yükleniyor...' : 'Fotoğraf Seç'}
                    </p>
                  </label>
                </div>
                {photoUrls.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {photoUrls.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#F8F8FA]">
                        <img src={url} alt="preview" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setPhotoUrls(photoUrls.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100"
                        >
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('reason')}
                  className="flex-1 py-3 border border-[#1A1033]/20 rounded-xl font-bold text-sm hover:bg-[#F8F8FA]"
                >
                  Geri
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 bg-accent text-white rounded-xl font-bold text-sm hover:bg-accent/90"
                >
                  Gönder
                </button>
              </div>
            </motion.div>
          )}

          {step === 'loading' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium text-[#1A1033]/60">İade talebi oluşturuluyor...</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center">
              <div className="text-6xl mb-4">✓</div>
              <h3 className="text-xl font-bold text-[#1A1033] mb-2">İade Talebi Alındı</h3>
              <p className="text-sm text-[#1A1033]/60">
                Talebiniz sisteme kaydedildi. 24 saat içinde sonuç alacaksınız.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
```

### C. User Profile - Returns Tab Update (`/src/pages/UserProfile.tsx` - partial)

```typescript
// Add to returnRequest handling
const [showReturnModal, setShowReturnModal] = useState(false);
const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<Order | null>(null);

// In the orders tab render:
<div className="flex gap-2 mt-2">
  <button
    onClick={() => {
      setSelectedOrderForReturn(order);
      setShowReturnModal(true);
    }}
    className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase hover:bg-amber-200 transition-colors"
  >
    İade Iste
  </button>
</div>

// Add modal to render
{showReturnModal && selectedOrderForReturn && (
  <ReturnRequestModal
    orderId={selectedOrderForReturn.id}
    userId={firebaseUser?.uid || ''}
    orderTotal={selectedOrderForReturn.total}
    onClose={() => {
      setShowReturnModal(false);
      setSelectedOrderForReturn(null);
    }}
    onSuccess={() => {
      // Refresh orders
      if (firebaseUser) {
        getOrdersByUser(firebaseUser.uid).then(setOrders);
      }
    }}
  />
)}
```

### D. Admin Returns Dashboard Update (`/src/pages/AdminReturns.tsx` - revised)

```typescript
import React, { useState, useEffect } from 'react';
import { getPendingReturns, updateReturnStatus, getReturnRequest } from '@/services/returnService';
import { ReturnRequest } from '@/types/return';
import { CheckCircle, XCircle, Loader2, ChevronDown, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export function AdminReturns() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);

  useEffect(() => {
    loadReturns();
  }, [filter]);

  const loadReturns = async () => {
    setLoading(true);
    if (filter === 'pending') {
      const data = await getPendingReturns();
      setReturns(data);
    } else {
      // TODO: Get by status
      setReturns([]);
    }
    setLoading(false);
  };

  const handleApprove = async (returnId: string) => {
    setUpdating(returnId);
    try {
      await updateReturnStatus(returnId, 'approved', {
        approvedBy: 'admin', // TODO: Get actual admin ID
        approvalType: 'manual',
      });
      setReturns(prev => prev.map(r => r.id === returnId ? { ...r, status: 'approved' } : r));
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (returnId: string, reason: string) => {
    setUpdating(returnId);
    try {
      await updateReturnStatus(returnId, 'rejected', {
        rejectionReason: reason,
      });
      setReturns(prev => prev.map(r => r.id === returnId ? { ...r, status: 'rejected' } : r));
    } finally {
      setUpdating(null);
    }
  };

  const REASON_LABELS: Record<string, string> = {
    defective: 'Ürün Hatalı',
    damaged: 'Kargoda Hasar',
    not_as_described: 'Açıklamaya Uymuyor',
    wrong_item: 'Yanlış Ürün',
    wrong_size: 'Yanlış Beden',
    wrong_color: 'Yanlış Renk',
    changed_mind: 'Fikrimi Değiştirdim',
    other: 'Diğer',
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033] mb-4">
          İade Talepleri
        </h3>
        <div className="flex gap-2 mb-4">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-lg text-[10px] font-black uppercase',
                filter === f
                  ? 'bg-[#1A1033] text-white'
                  : 'bg-[#F8F8FA] text-[#1A1033]/40 hover:text-[#1A1033]'
              )}
            >
              {f === 'all' ? 'Tümü' : f === 'pending' ? 'Bekliyor' : f === 'approved' ? 'Onaylandı' : 'Reddedildi'}
            </button>
          ))}
        </div>
      </div>

      {returns.length === 0 ? (
        <p className="text-center py-8 text-[#1A1033]/30">İade talebi bulunmuyor</p>
      ) : (
        <div className="space-y-3">
          {returns.map(returnRequest => (
            <motion.div
              key={returnRequest.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white border border-[#F8F8FA] rounded-2xl p-4 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <p className="text-xs font-black text-[#1A1033]">
                    #{returnRequest.id.slice(0, 8).toUpperCase()} • {returnRequest.orderId.slice(0, 6)}
                  </p>
                  <p className="text-[10px] text-[#1A1033]/40 mt-0.5">
                    {new Date(returnRequest.createdAt).toLocaleDateString('tr-TR')} • {REASON_LABELS[returnRequest.reason]}
                  </p>
                  <p className="text-sm font-bold text-[#1A1033] mt-1">{returnRequest.description.slice(0, 60)}...</p>
                </div>
                <span className={cn(
                  'text-[10px] font-black uppercase px-2.5 py-1 rounded-full whitespace-nowrap',
                  returnRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  returnRequest.status === 'approved' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                )}>
                  {returnRequest.status}
                </span>
              </div>

              {/* Expandable Details */}
              {expandedId === returnRequest.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 pt-3 border-t border-[#F8F8FA]"
                >
                  {returnRequest.photoUrls.length > 0 && (
                    <div className="flex gap-2">
                      {returnRequest.photoUrls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt="return photo"
                          className="w-12 h-12 rounded-lg object-cover border border-[#F8F8FA]"
                        />
                      ))}
                    </div>
                  )}

                  {returnRequest.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(returnRequest.id)}
                        disabled={updating === returnRequest.id}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg text-[10px] font-black uppercase disabled:opacity-50 hover:bg-green-600 transition-colors"
                      >
                        {updating === returnRequest.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        Onayla
                      </button>
                      <button
                        onClick={() => handleReject(returnRequest.id, 'Policy uyuşmuyor')}
                        disabled={updating === returnRequest.id}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase disabled:opacity-50 hover:bg-red-600 transition-colors"
                      >
                        {updating === returnRequest.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                        Reddet
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              <button
                onClick={() => setExpandedId(expandedId === returnRequest.id ? null : returnRequest.id)}
                className="w-full mt-3 py-2 text-center text-[10px] font-black uppercase text-accent hover:bg-accent/10 rounded-lg transition-colors"
              >
                {expandedId === returnRequest.id ? 'Gizle' : 'Detaylar'}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## V. Firestore Rules Update

```javascript
// In firestore.rules - Add new rules for returnRequests

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ... existing rules ...

    // ==================== RETURN REQUESTS ====================
    match /returnRequests/{returnRequestId} {
      
      // Create: Customer can create for their own orders
      allow create: if isSignedIn() && 
        request.resource.data.userId == userId() &&
        exists(/databases/$(database)/documents/orders/$(request.resource.data.orderId)) &&
        get(/databases/$(database)/documents/orders/$(request.resource.data.orderId)).data.userId == userId();
      
      // Read: User can read their own, seller can read theirs, admin can read all
      allow read: if isSignedIn() && (
        resource.data.userId == userId() ||
        resource.data.sellerId == userId() ||
        isAdmin()
      );
      
      // Update: Only admin can update
      allow update: if isAdmin();
      
      // Delete: Only admin can delete
      allow delete: if isAdmin();
    }

    // ==================== RETURN METRICS ====================
    match /returnMetrics/{date} {
      allow read: if isAdmin();
      allow write: if isAdmin() || request.auth.token.email == 'system@etic.local';
    }

    // ==================== APPROVAL RULES ====================
    match /approvalRules/config {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
  }
}
```

---

## VI. Integration Checklist

### Backend Setup
- [ ] Create `returnService.ts` with all functions
- [ ] Create `return.ts` type definitions
- [ ] Update `order.ts` types with new statuses
- [ ] Create new Firestore collections (via console or functions)
- [ ] Update Firestore rules
- [ ] Create daily metrics cron job (Cloud Functions)
- [ ] Set up notification service (email, SMS, push)

### Frontend Setup
- [ ] Create `ReturnRequestModal.tsx` component
- [ ] Create `AdminReturns.tsx` redesigned component
- [ ] Update `UserProfile.tsx` with return tab
- [ ] Add return icon/button to order cards
- [ ] Create return status badge component
- [ ] Update i18n translations (EN, TR, FR, DE)
- [ ] Test responsive design (mobile, tablet, desktop)

### Testing
- [ ] Unit tests: ReturnRequest creation (valid/invalid)
- [ ] Unit tests: Approval rules engine
- [ ] Unit tests: Notification sending
- [ ] E2E tests: Customer flow (create → approve → refund)
- [ ] E2E tests: Admin flow (view → approve/reject)
- [ ] Performance tests: 1000+ returns in database
- [ ] Security tests: Firestore rules bypass attempts
- [ ] UAT with support team (5 test cases)

### Monitoring & Analytics
- [ ] Set up error tracking (Sentry/Firebase Crashlytics)
- [ ] Add custom events to Firebase Analytics
- [ ] Create admin dashboard for metrics
- [ ] Set up alerts (high error rate, approval queue backup)
- [ ] Daily metrics snapshot job

### Documentation
- [ ] API documentation (return endpoints)
- [ ] User guide (how to initiate return)
- [ ] Seller guide (how to accept returns)
- [ ] Support FAQ for common return issues
- [ ] Admin documentation (approval workflow)

---

## VII. Deployment & Rollout

### Phase
1. **Dev Environment** (Week 1)
   - Deploy to local + Firebase emulator
   - Internal testing
   
2. **Staging Environment** (Week 1-2)
   - Deploy to staging Firestore
   - Support team UAT
   - Load testing (100 concurrent users)
   
3. **Production - Soft Launch** (Week 2)
   - Deploy to 10% of users
   - Monitor error rates, performance
   - Gradual rollout to 100%
   
4. **Production - Full Launch** (Week 2-3)
   - 100% user base
   - Daily monitoring
   - Support team on-call

### Rollback Plan
- If error rate >2%: Disable return modal, fall back to support email
- If approval engine breaks: Set all returns to 'manual_review'
- If notification fails: Queue-based retry system

---

## VIII. Success Metrics

### Launch Goals (Week 1)
- ✅ Zero critical errors
- ✅ <500ms modal load time
- ✅ 90% form completion rate
- ✅ Support tickets -50%

### 30-Day Goals
- ✅ 500+ returns created via UI
- ✅ 70% auto-approval rate
- ✅ Avg approval time <24h
- ✅ Customer CSAT >3.5/5

---

## References & Resources

### Firestore Documentation
- [Cloud Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Cloud Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)

### React & TypeScript
- [React Hooks Best Practices](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### E-commerce Best Practices
- [Returns Management Systems](https://www.gartner.com/document/3981627)

---

**Version History:**
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 24-May-2026 | Initial implementation guide |

**Approval Sign-off:**
- Product Lead: ________________
- Engineering Lead: ________________
- Operations Lead: ________________
