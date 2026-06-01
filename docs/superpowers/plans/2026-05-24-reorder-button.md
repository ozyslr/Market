# Reorder Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable repeat customers to reorder their last purchase with one tap, validating stock and preserving address/variants.

**Architecture:** Backend endpoint (`/api/last-order`) fetches the most recent confirmed order, validates item stock, and returns reorderable items. Frontend modal confirms address (defaulting to last order's address) and submits reorder, which clones items into the cart via existing cart service.

**Tech Stack:** React (Stripe Elements for payment, existing modal patterns), Express (Firebase Admin SDK), Firebase (Firestore orders + products), TypeScript

---

## File Structure

| File | Purpose | Status |
|------|---------|--------|
| `src/services/reorderService.ts` | **NEW** - Fetch last order, validate stock, submit reorder |
| `src/components/profile/ReorderModal.tsx` | **NEW** - Modal UI for address confirmation + item availability |
| `src/test/reorderService.test.ts` | **NEW** - Unit tests for reorder logic (stock validation, edge cases) |
| `server.ts` | **MODIFY** - Add `GET /api/last-order` and `POST /api/reorder` endpoints |
| `src/pages/UserProfile.tsx` | **MODIFY** - Add reorder button to Orders tab (~line 450) |
| `src/types.ts` | **MODIFY** - Add `ReorderResult`, `LastOrderResponse` types |

---

## Task 1: Add Backend Types & Endpoint to Fetch Last Order

**Files:**
- Modify: `src/types.ts`
- Modify: `server.ts` (add endpoint after line 750, after checkout endpoints)
- Create: `src/test/server-reorder.test.ts` (light integration test setup)

### Steps

- [ ] **Step 1: Add types to `src/types.ts`**

Find the end of the types file and append:

```typescript
export interface ReorderItem {
  productId: string;
  variantId?: string;
  quantity: number;
  name: string;
  price: number;
  image?: string;
  available: boolean;  // Stock check result
  reason?: string;     // Why unavailable (out of stock, discontinued)
}

export interface LastOrderResponse {
  orderId: string;
  items: ReorderItem[];
  shippingAddress: {
    id: string;
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  currency: string;
  createdAt: string;
  hasUnavailableItems: boolean;
  message?: string;  // "All items available" or "2/4 items unavailable"
}

export interface ReorderResult {
  success: boolean;
  cartCount?: number;
  unavailableItems?: string[];
  error?: string;
}
```

- [ ] **Step 2: Verify types are added**

Run: `npx tsc --noEmit`
Expected: No errors (types compile)

- [ ] **Step 3: Add `GET /api/last-order` endpoint to `server.ts`**

Add after the one-click-checkout endpoint (around line 750):

```typescript
// ─── Reorder: Fetch Last Order with Stock Validation ──────────────────────
app.get('/api/last-order', verifyFirebaseToken, async (req: any, res) => {
  if (!adminDb) return res.status(503).json({ error: 'DB not configured' });

  try {
    const uid: string = req.uid;

    // Fetch the most recent confirmed order
    const orderSnapshot = await adminDb
      .collection('orders')
      .where('userId', '==', uid)
      .where('status', '==', 'confirmed')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (orderSnapshot.empty) {
      return res.json({
        orderId: null,
        items: [],
        message: 'No previous orders found',
      } as Partial<LastOrderResponse>);
    }

    const orderDoc = orderSnapshot.docs[0];
    const orderData = orderDoc.data();
    const orderId = orderDoc.id;

    // Validate stock for each item
    const reorderItems: ReorderItem[] = [];
    let hasUnavailableItems = false;

    for (const item of orderData.items || []) {
      const productDoc = await adminDb.collection('products').doc(item.productId).get();
      const product = productDoc.data();

      if (!product) {
        reorderItems.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          name: item.name || 'Unknown Product',
          price: item.price,
          image: item.image,
          available: false,
          reason: 'Product no longer available',
        });
        hasUnavailableItems = true;
        continue;
      }

      // Check if product is still available and has stock
      if (product.stock < item.quantity) {
        reorderItems.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          name: product.name,
          price: item.price,
          image: item.image,
          available: false,
          reason: `Only ${product.stock} in stock (need ${item.quantity})`,
        });
        hasUnavailableItems = true;
      } else {
        reorderItems.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          name: product.name,
          price: item.price,
          image: item.image,
          available: true,
        });
      }
    }

    const availableCount = reorderItems.filter((i) => i.available).length;
    const totalCount = reorderItems.length;

    res.json({
      orderId,
      items: reorderItems,
      shippingAddress: orderData.shippingAddress,
      currency: orderData.currency || 'gbp',
      createdAt: orderData.createdAt,
      hasUnavailableItems,
      message:
        availableCount === totalCount
          ? 'All items available'
          : `${availableCount}/${totalCount} items available`,
    } as LastOrderResponse);
  } catch (error: any) {
    console.error('last-order error:', error);
    res.status(500).json({ error: 'Failed to fetch last order' });
  }
});
```

- [ ] **Step 4: Run the server locally and test the endpoint**

Run: `npm run dev`
Expected: Server starts without errors

In a new terminal, test with a valid user:
```bash
curl -H "Authorization: Bearer <test-token>" http://localhost:3000/api/last-order
```

Expected: Returns `{ orderId: null, items: [], message: 'No previous orders found' }` or actual last order

- [ ] **Step 5: Commit**

```bash
git add src/types.ts server.ts
git commit -m "feat: add last-order backend endpoint with stock validation"
```

---

## Task 2: Create `reorderService` with Tests (TDD)

**Files:**
- Create: `src/test/reorderService.test.ts`
- Create: `src/services/reorderService.ts`

### Steps

- [ ] **Step 1: Write failing tests**

Create `src/test/reorderService.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLastOrder, submitReorder } from '../services/reorderService';
import type { LastOrderResponse, ReorderResult } from '../types';

const mockFirebaseUser = {
  getIdToken: vi.fn().mockResolvedValue('mock-token'),
} as any;

describe('reorderService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('fetchLastOrder', () => {
    it('returns last order with available items', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orderId: 'ord_123',
          items: [
            { productId: 'p1', quantity: 2, available: true, name: 'Widget', price: 10 },
          ],
          shippingAddress: { id: 'addr_1', name: 'John', city: 'London' },
          currency: 'gbp',
          hasUnavailableItems: false,
          message: 'All items available',
        } as LastOrderResponse),
      });

      const result = await fetchLastOrder(mockFirebaseUser);
      expect(result.orderId).toBe('ord_123');
      expect(result.items[0].available).toBe(true);
      expect(result.hasUnavailableItems).toBe(false);
    });

    it('returns last order with unavailable items', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orderId: 'ord_123',
          items: [
            { productId: 'p1', quantity: 2, available: true, name: 'Widget', price: 10 },
            {
              productId: 'p2',
              quantity: 1,
              available: false,
              reason: 'Out of stock',
              name: 'Gadget',
              price: 20,
            },
          ],
          shippingAddress: { id: 'addr_1', name: 'John', city: 'London' },
          currency: 'gbp',
          hasUnavailableItems: true,
          message: '1/2 items available',
        } as LastOrderResponse),
      });

      const result = await fetchLastOrder(mockFirebaseUser);
      expect(result.hasUnavailableItems).toBe(true);
      expect(result.message).toContain('1/2');
      expect(result.items[1].available).toBe(false);
    });

    it('returns empty when no previous orders', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orderId: null,
          items: [],
          message: 'No previous orders found',
        }),
      });

      const result = await fetchLastOrder(mockFirebaseUser);
      expect(result.orderId).toBeNull();
      expect(result.items.length).toBe(0);
    });

    it('sends Authorization header with Bearer token', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ orderId: null, items: [] }),
      });

      await fetchLastOrder(mockFirebaseUser);
      const [, options] = (fetch as any).mock.calls[0];
      expect(options.headers['Authorization']).toBe('Bearer mock-token');
    });

    it('returns error on network failure', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'DB not configured' }),
      });

      const result = await fetchLastOrder(mockFirebaseUser);
      expect(result.error).toBeTruthy();
    });
  });

  describe('submitReorder', () => {
    it('submits reorder with available items only', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, cartCount: 2 }),
      });

      const items = [
        { productId: 'p1', variantId: undefined, quantity: 2, available: true },
        { productId: 'p2', variantId: undefined, quantity: 1, available: false },
      ];

      const result = await submitReorder(mockFirebaseUser, items, 'addr_1');
      expect(result.success).toBe(true);
      expect(result.cartCount).toBe(2);
    });

    it('filters out unavailable items before submission', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, cartCount: 1 }),
      });

      const items = [
        { productId: 'p1', variantId: undefined, quantity: 2, available: true },
        { productId: 'p2', variantId: undefined, quantity: 1, available: false },
      ];

      await submitReorder(mockFirebaseUser, items, 'addr_1');

      const [, options] = (fetch as any).mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.items.length).toBe(1);
      expect(body.items[0].productId).toBe('p1');
    });

    it('returns error when all items unavailable', async () => {
      const items = [
        { productId: 'p1', variantId: undefined, quantity: 2, available: false },
      ];

      const result = await submitReorder(mockFirebaseUser, items, 'addr_1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('No available items');
    });

    it('returns errors on API failure', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Cart update failed' }),
      });

      const items = [{ productId: 'p1', variantId: undefined, quantity: 2, available: true }];

      const result = await submitReorder(mockFirebaseUser, items, 'addr_1');
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/test/reorderService.test.ts`
Expected: FAIL (file doesn't exist yet)

- [ ] **Step 3: Implement `reorderService.ts`**

Create `src/services/reorderService.ts`:

```typescript
import type { User as FirebaseUser } from 'firebase/auth';
import type { ReorderItem, LastOrderResponse, ReorderResult } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function getAuthHeaders(firebaseUser: FirebaseUser): Promise<HeadersInit> {
  const token = await firebaseUser.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Fetch the user's last confirmed order with stock validation
 */
export async function fetchLastOrder(firebaseUser: FirebaseUser): Promise<LastOrderResponse> {
  try {
    const headers = await getAuthHeaders(firebaseUser);
    const res = await fetch(`${API_BASE}/api/last-order`, { headers });
    const data = await res.json();

    if (!res.ok) {
      return { ...data, error: data.error || 'Failed to fetch last order' };
    }

    return data as LastOrderResponse;
  } catch (error: any) {
    return {
      orderId: null,
      items: [],
      error: error.message || 'Network error',
    };
  }
}

/**
 * Submit reorder: add available items from last order to cart
 * Filters out unavailable items automatically
 */
export async function submitReorder(
  firebaseUser: FirebaseUser,
  items: ReorderItem[],
  addressId: string
): Promise<ReorderResult> {
  // Filter to available items only
  const availableItems = items.filter((item) => item.available);

  if (availableItems.length === 0) {
    return {
      success: false,
      error: 'No available items to reorder',
      unavailableItems: items.map((i) => i.name),
    };
  }

  try {
    const headers = await getAuthHeaders(firebaseUser);
    const payload = {
      items: availableItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      addressId,
    };

    const res = await fetch(`${API_BASE}/api/reorder`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Reorder failed',
      };
    }

    return {
      success: true,
      cartCount: data.cartCount,
      unavailableItems:
        availableItems.length < items.length
          ? items.filter((i) => !i.available).map((i) => i.name)
          : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- src/test/reorderService.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/reorderService.ts src/test/reorderService.test.ts
git commit -m "feat: add reorderService with stock validation and cart submission"
```

---

## Task 3: Add Backend `/api/reorder` Endpoint

**Files:**
- Modify: `server.ts`

### Steps

- [ ] **Step 1: Add `POST /api/reorder` endpoint**

Add after the `/api/last-order` endpoint (around line 810):

```typescript
// ─── Reorder: Submit Reorder & Add to Cart ──────────────────────────────────
app.post('/api/reorder', verifyFirebaseToken, async (req: any, res) => {
  if (!adminDb) return res.status(503).json({ error: 'DB not configured' });

  const { items, addressId } = req.body as {
    items: Array<{ productId: string; variantId?: string; quantity: number }>;
    addressId: string;
  };

  if (!items?.length) return res.status(400).json({ error: 'No items provided' });
  if (!addressId) return res.status(400).json({ error: 'Address ID required' });

  try {
    const uid: string = req.uid;
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData) return res.status(404).json({ error: 'User not found' });

    // Verify that the address belongs to this user
    const selectedAddress = (userData.addresses || []).find(
      (a: any) => a.id === addressId
    );
    if (!selectedAddress) {
      return res.status(400).json({ error: 'Invalid address for this user' });
    }

    // Get or create cart
    let cartRef = await adminDb.collection('carts').doc(uid).get();
    let cartData = cartRef.data() || { items: [] };

    // Validate and add items to cart
    const cartItems = cartData.items || [];

    for (const item of items) {
      const productDoc = await adminDb.collection('products').doc(item.productId).get();
      const product = productDoc.data();

      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }

      // Check stock one more time (could have changed since last-order fetch)
      if (product.stock < item.quantity) {
        return res.json({
          success: false,
          error: `${product.name}: Only ${product.stock} in stock`,
        });
      }

      // Find or create cart item
      const existingIndex = cartItems.findIndex(
        (ci: any) => ci.productId === item.productId && ci.variantId === item.variantId
      );

      if (existingIndex >= 0) {
        // Update quantity
        cartItems[existingIndex].quantity += item.quantity;
      } else {
        // Add new item
        cartItems.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          addedAt: new Date().toISOString(),
        });
      }
    }

    // Save updated cart
    await adminDb.collection('carts').doc(uid).set({
      items: cartItems,
      updatedAt: new Date().toISOString(),
    });

    // Log reorder activity
    await adminDb.collection('activity_logs').add({
      userId: uid,
      action: 'reorder',
      itemCount: items.length,
      cartCount: cartItems.length,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      cartCount: cartItems.length,
    });
  } catch (error: any) {
    console.error('reorder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

- [ ] **Step 2: Run server and test the endpoint**

Run: `npm run dev`
Expected: Server starts

Test with curl (after generating a valid token):
```bash
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"p1","quantity":2}],"addressId":"addr_1"}' \
  http://localhost:3000/api/reorder
```

Expected: Returns `{ success: true, cartCount: <number> }` or error message

- [ ] **Step 3: Commit**

```bash
git add server.ts
git commit -m "feat: add /api/reorder endpoint with address validation and cart update"
```

---

## Task 4: Create `ReorderModal` Component

**Files:**
- Create: `src/components/profile/ReorderModal.tsx`

### Steps

- [ ] **Step 1: Create the modal component**

Create `src/components/profile/ReorderModal.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, X, Loader } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { fetchLastOrder, submitReorder } from '../../services/reorderService';
import type { User as FirebaseUser } from 'firebase/auth';
import type { LastOrderResponse } from '../../types';

interface Props {
  firebaseUser: FirebaseUser;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReorderModal({ firebaseUser, onClose, onSuccess }: Props) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<LastOrderResponse | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Fetch last order on mount
  useEffect(() => {
    const load = async () => {
      const order = await fetchLastOrder(firebaseUser);
      if (order.error) {
        setError(order.error);
      } else if (!order.orderId) {
        setError(t('reorder.noOrders', 'No previous orders found'));
      } else {
        setLastOrder(order);
        setSelectedAddressId(order.shippingAddress.id);
      }
      setLoading(false);
    };
    load();
  }, [firebaseUser, t]);

  const handleSubmit = async () => {
    if (!lastOrder || !selectedAddressId) return;

    setSubmitting(true);
    setError(null);

    const result = await submitReorder(firebaseUser, lastOrder.items, selectedAddressId);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || t('reorder.failed', 'Reorder failed'));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <Loader className="animate-spin text-gray-400" size={32} />
            <p className="text-gray-600">
              {t('reorder.loading', 'Loading last order...')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !lastOrder) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="text-red-500" size={32} />
            <p className="text-red-700 text-center font-medium">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              {t('common.close', 'Close')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!lastOrder) return null;

  const availableItems = lastOrder.items.filter((i) => i.available);
  const unavailableItems = lastOrder.items.filter((i) => !i.available);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('reorder.title', 'Reorder Last Purchase')}
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Items */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('reorder.items', 'Items')}
          </h3>

          {availableItems.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                <Check size={16} /> {t('reorder.available', 'Available')}
              </h4>
              <div className="space-y-3">
                {availableItems.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex gap-3 p-3 bg-green-50 rounded-lg">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} × £{item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unavailableItems.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                <AlertCircle size={16} /> {t('reorder.unavailable', 'Unavailable')}
              </h4>
              <div className="space-y-3">
                {unavailableItems.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex gap-3 p-3 bg-red-50 rounded-lg opacity-60">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-red-700">{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Address Confirmation */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {t('reorder.shippingAddress', 'Shipping Address')}
          </h3>
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <p className="font-medium text-gray-900">{lastOrder.shippingAddress.name}</p>
            <p className="text-sm text-gray-600">
              {lastOrder.shippingAddress.addressLine1}
              {lastOrder.shippingAddress.addressLine2 && `, ${lastOrder.shippingAddress.addressLine2}`}
            </p>
            <p className="text-sm text-gray-600">
              {lastOrder.shippingAddress.city}, {lastOrder.shippingAddress.postalCode}
            </p>
            <p className="text-sm text-gray-600">{lastOrder.shippingAddress.country}</p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t('reorder.confirmingLastAddress', 'Using address from last order')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {t('reorder.adding', 'Adding {{count}} items to cart', {
              count: availableItems.length,
            })}
          </p>
          {unavailableItems.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {t('reorder.skipping', '{{count}} items skipped (unavailable)', {
                count: unavailableItems.length,
              })}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || availableItems.length === 0}
            className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader className="animate-spin" size={18} />
                {t('common.processing', 'Processing...')}
              </>
            ) : (
              t('reorder.addToCart', 'Add to Cart')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify component renders without errors**

Run: `npm run build 2>&1 | tail -20`
Expected: No errors for ReorderModal

- [ ] **Step 3: Commit**

```bash
git add src/components/profile/ReorderModal.tsx
git commit -m "feat: add ReorderModal with address confirmation and item availability"
```

---

## Task 5: Add Reorder Button to UserProfile Orders Tab

**Files:**
- Modify: `src/pages/UserProfile.tsx`

### Steps

- [ ] **Step 1: Find the Orders section in UserProfile**

Read `src/pages/UserProfile.tsx` to locate where orders are displayed (search for "orders" tab or "Siparişler")

- [ ] **Step 2: Add reorder button state at top of component**

Find the main state declarations in `UserProfile.tsx` and add:

```typescript
const [showReorderModal, setShowReorderModal] = useState(false);
```

- [ ] **Step 3: Import ReorderModal**

Add to imports at top of file:

```typescript
import { ReorderModal } from '../components/profile/ReorderModal';
```

- [ ] **Step 4: Add reorder button to each order in the list**

Find where orders are rendered (likely in a loop like `orders.map(order => ...)`) and add a button like this within the order card:

```typescript
{!order.status?.includes('cancelled') && !order.status?.includes('returned') && (
  <button
    onClick={() => setShowReorderModal(true)}
    className="mt-3 text-sm text-blue-600 hover:underline font-medium"
  >
    {t('reorder.button', 'Reorder')}
  </button>
)}
```

- [ ] **Step 5: Add ReorderModal component to render**

Add before the closing fragment/div of UserProfile:

```typescript
{showReorderModal && firebaseUser && (
  <ReorderModal
    firebaseUser={firebaseUser}
    onClose={() => setShowReorderModal(false)}
    onSuccess={() => {
      setShowReorderModal(false);
      // Optionally refresh cart or navigate to cart
      navigate('/cart');
    }}
  />
)}
```

- [ ] **Step 6: Verify the import path for useNavigate**

Check that `useNavigate` is imported:

```typescript
import { useNavigate } from 'react-router-dom';
```

If not present, add it.

- [ ] **Step 7: Run build and check for errors**

Run: `npm run build 2>&1 | grep -i error | head -10`
Expected: No errors related to ReorderModal

- [ ] **Step 8: Commit**

```bash
git add src/pages/UserProfile.tsx
git commit -m "feat: add reorder button to order history in UserProfile"
```

---

## Task 6: End-to-End Testing & Verification

**Files:**
- Modify: `src/test/reorderService.test.ts` (add integration scenarios)

### Steps

- [ ] **Step 1: Run all tests to ensure nothing broke**

Run: `npm run test 2>&1 | tail -10`
Expected: All tests pass (including new reorderService tests)

- [ ] **Step 2: Manual smoke test - Start dev server**

Run: `npm run dev`
Expected: Server starts without errors

- [ ] **Step 3: Test in browser - Navigate to UserProfile**

1. Open http://localhost:5173 in browser
2. Log in as a test user with at least one past order
3. Navigate to Profile → Orders tab
4. Verify "Reorder" button appears on orders
5. Click reorder button
6. Verify modal appears showing last order items
7. Verify address is pre-filled
8. Click "Add to Cart"
9. Verify success and redirect to cart

- [ ] **Step 4: Test edge case - User with no previous orders**

1. Create new test user (no orders)
2. Go to Profile → Orders
3. Verify "Reorder" button doesn't appear or shows "No previous orders"

- [ ] **Step 5: Test edge case - Out of stock items**

1. Use test user with a previous order
2. Manually reduce stock of one item in Firebase
3. Click reorder
4. Verify modal shows that item as unavailable
5. Verify other items can still be added
6. Submit and verify only available items added to cart

- [ ] **Step 6: Build and verify no errors**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 7: Commit final version**

```bash
git add -A
git commit -m "feat: complete reorder button feature with full integration"
```

---

## Verification Checklist

Use this checklist to verify all requirements are met:

- [ ] **Backend Endpoint**: `GET /api/last-order` returns last confirmed order with stock validation
- [ ] **Backend Endpoint**: `POST /api/reorder` accepts items + address, validates stock, adds to cart
- [ ] **Stock Validation**: Items with insufficient stock are marked unavailable and filtered on submission
- [ ] **Address Confirmation**: Modal shows address from last order, confirms before reorder
- [ ] **UI**: Reorder button appears on each order in UserProfile
- [ ] **Modal**: Shows available/unavailable items with reasons
- [ ] **Cart Integration**: Available items added to existing cart (merge, not replace)
- [ ] **Error Handling**: Graceful fallback if no previous orders
- [ ] **Error Handling**: Graceful fallback if all items unavailable
- [ ] **Tests**: All reorderService tests pass (stock, address, cart submission)
- [ ] **Build**: `npm run build` succeeds
- [ ] **Performance**: Modal loads within 1s (Firebase query optimized)

---

## Success Metrics

When this feature is live, track:

- **Reorder adoption**: % of repeat customers who use reorder (target: 20%+)
- **Conversion lift**: +4% conversion for repeat purchase flow
- **Checkout time**: Reduce from 2-3 min to ~45 sec for reorder
- **Cart addition**: Average cart size increase from reorder usage

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-24-reorder-button.md`.**

## Execution Options

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration with two-stage code review (spec compliance + quality)

**2. Inline Execution** — Execute tasks in this session using existing context, batch with checkpoints

**Which approach?**