# Mercora Ödeme Sistemi - Implementation Guide
## Sprint 1-2 Kod Referansları & Checklist

---

## PART 1: APPLE PAY / GOOGLE PAY (Sprint 1, 4 günü)

### 1.1 Current Setup Analysis

**Existing Stripe Integration:**
```typescript
// /mercora-next/src/app/api/create-payment-intent/route.ts
// ✓ Already has: automatic_payment_methods: { enabled: true }

const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amount * 100),
  currency,
  automatic_payment_methods: { enabled: true },  // ← APPLE PAY READY
  metadata: { orderId: orderId || '' },
});
```

**Already installed packages:**
```json
{
  "@stripe/react-stripe-js": "^2.x",
  "@stripe/stripe-js": "^3.x",
  "stripe": "^15.x"
}
```

### 1.2 Implementation Steps

**Step 1: Create Payment Element Wrapper**

File: `/mercora-next/src/components/payment/PaymentMethodSelector.tsx`

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { PaymentRequestButtonElement, usePaymentRequest } from '@stripe/react-stripe-js';
import { StripePaymentRequestButtonOptions } from '@stripe/stripe-js';

interface PaymentMethodSelectorProps {
  amount: number;
  currency: string;
  orderId: string;
  onPaymentSuccess: (paymentMethod: string, token?: string) => void;
  onPaymentError: (error: string) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  amount,
  currency,
  orderId,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [showExpressCheckout, setShowExpressCheckout] = useState(false);

  const paymentRequestOptions: StripePaymentRequestButtonOptions = {
    country: 'US', // TODO: Get from user location
    currency: currency.toLowerCase(),
    total: {
      label: 'Total',
      amount: Math.round(amount * 100),
    },
    requestPayerName: true,
    requestPayerEmail: true,
    requestPayerPhone: true,
    requestShipping: true,
  };

  const { paymentRequest } = usePaymentRequest(paymentRequestOptions);

  useEffect(() => {
    if (paymentRequest) {
      // Check if Apple Pay or Google Pay is available
      paymentRequest.canMakePayment().then((result) => {
        if (result) {
          setShowExpressCheckout(true);
        }
      });
    }
  }, [paymentRequest]);

  if (!paymentRequest || !showExpressCheckout) {
    return null; // Fallback to card form
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Express Checkout</h3>
      <PaymentRequestButtonElement
        options={{ paymentRequest }}
        onReady={() => console.log('Payment request ready')}
        onLoadError={() => console.log('Payment request failed')}
      />
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or pay with card</span>
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Create Apple Pay Button (iOS specific)**

File: `/mercora-next/src/components/payment/ApplePayButton.tsx`

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';

interface ApplePayButtonProps {
  amount: number;
  currency: string;
  orderId: string;
  onSuccess: (token: string) => void;
  onError: (error: string) => void;
}

export const ApplePayButton: React.FC<ApplePayButtonProps> = ({
  amount,
  currency,
  orderId,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false);

  useEffect(() => {
    // Check if Apple Pay is available
    if (
      window.ApplePaySession &&
      stripe &&
      window.ApplePaySession.canMakePayments()
    ) {
      setIsApplePayAvailable(true);
    }
  }, [stripe]);

  const handleApplePayClick = async () => {
    if (!stripe) return;

    try {
      // Call your backend to create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: currency.toLowerCase(),
          orderId,
        }),
      });

      const { clientSecret } = await response.json();

      // Use Stripe to confirm payment with Apple Pay
      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/confirmation`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        onError(result.error.message || 'Apple Pay failed');
      } else if (result.paymentIntent?.status === 'succeeded') {
        onSuccess(result.paymentIntent.id);
      }
    } catch (error: any) {
      onError(error.message);
    }
  };

  if (!isApplePayAvailable) return null;

  return (
    <button
      onClick={handleApplePayClick}
      className="w-full px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 mb-3"
      style={{
        WebkitAppearance: 'none',
        fontFamily: 'system-ui',
      }}
    >
      Pay with Apple Pay
    </button>
  );
};
```

**Step 3: Create Google Pay Button (Android specific)**

File: `/mercora-next/src/components/payment/GooglePayButton.tsx`

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';

interface GooglePayButtonProps {
  amount: number;
  currency: string;
  orderId: string;
  onSuccess: (token: string) => void;
  onError: (error: string) => void;
}

export const GooglePayButton: React.FC<GooglePayButtonProps> = ({
  amount,
  currency,
  orderId,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isGooglePayAvailable, setIsGooglePayAvailable] = useState(false);

  useEffect(() => {
    // Check if Google Pay is available
    if (stripe && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsGooglePayAvailable(true);
    } else if (stripe) {
      setIsGooglePayAvailable(true);
    }
  }, [stripe]);

  const handleGooglePayClick = async () => {
    if (!stripe) return;

    try {
      // Call your backend to create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: currency.toLowerCase(),
          orderId,
        }),
      });

      const { clientSecret } = await response.json();

      // Confirm payment with Google Pay
      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/confirmation`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        onError(result.error.message || 'Google Pay failed');
      } else if (result.paymentIntent?.status === 'succeeded') {
        onSuccess(result.paymentIntent.id);
      }
    } catch (error: any) {
      onError(error.message);
    }
  };

  if (!isGooglePayAvailable) return null;

  return (
    <button
      onClick={handleGooglePayClick}
      className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 mb-3"
    >
      <img
        src="https://www.gstatic.com/images/branding/googlelogo/svg_outlined.svg"
        alt="Google"
        className="inline-block w-4 h-4 mr-2"
      />
      Pay with Google Pay
    </button>
  );
};
```

**Step 4: Update Checkout Component**

File: `/mercora-next/src/components/Checkout.tsx` (MODIFY)

```typescript
'use client';

import { ApplePayButton } from './payment/ApplePayButton';
import { GooglePayButton } from './payment/GooglePayButton';
import { CardPaymentForm } from './payment/CardPaymentForm'; // existing
import { IyzicoPayment } from './payment/IyzicoPayment'; // existing

export const Checkout: React.FC<CheckoutProps> = ({
  orderId,
  total,
  currency,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<
    'applepay' | 'googlepay' | 'card' | 'iyzico' | 'stripe'
  >('card');

  return (
    <div className="payment-container">
      <h2>Payment Method</h2>

      {/* Express Checkout (Stripe Apple/Google Pay) */}
      <div className="express-checkout">
        <ApplePayButton
          amount={total}
          currency={currency}
          orderId={orderId}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
        <GooglePayButton
          amount={total}
          currency={currency}
          orderId={orderId}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </div>

      {/* Standard Payment Methods */}
      <div className="payment-methods">
        <div
          className={`method-option ${
            paymentMethod === 'card' ? 'selected' : ''
          }`}
          onClick={() => setPaymentMethod('card')}
        >
          <h3>Card</h3>
          <CardPaymentForm
            orderId={orderId}
            total={total}
            currency={currency}
            onSuccess={handlePaymentSuccess}
          />
        </div>

        <div
          className={`method-option ${
            paymentMethod === 'iyzico' ? 'selected' : ''
          }`}
          onClick={() => setPaymentMethod('iyzico')}
        >
          <h3>Iyzico (Taksit)</h3>
          <IyzicoPayment
            orderId={orderId}
            total={total}
            currency={currency}
          />
        </div>
      </div>
    </div>
  );
};
```

### 1.3 Testing Checklist - Apple/Google Pay

- [ ] iOS Safari: Apple Pay button appears
- [ ] Android Chrome: Google Pay button appears
- [ ] Desktop: Both buttons hidden (fallback to card)
- [ ] Successful payment: Order created, webhook processed
- [ ] Failed payment: Error message shown
- [ ] Device detection: Correct button shown per device
- [ ] Network timeout: Graceful error handling
- [ ] Stripe dashboard: Payment intent created with metadata

---

## PART 2: GUEST CHECKOUT (Sprint 1-2, 6 günü)

### 2.1 Frontend Implementation (Sprint 1, 3 günü)

**Step 1: Create Guest Email Form**

File: `/mercora-next/src/components/checkout/GuestEmailForm.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { validateEmail } from '@/lib/validation';

interface GuestEmailFormProps {
  onSubmit: (email: string, phone: string) => void;
  isLoading?: boolean;
}

export const GuestEmailForm: React.FC<GuestEmailFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!phone || phone.length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(email, phone);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="your@email.com"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="+1 (555) 000-0000"
          disabled={isLoading}
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : 'Continue as Guest'}
      </button>
    </form>
  );
};
```

**Step 2: Create Guest Address Form**

File: `/mercora-next/src/components/checkout/GuestAddressForm.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { Address } from '@/types/index';

interface GuestAddressFormProps {
  onSubmit: (address: Address) => void;
  isLoading?: boolean;
}

export const GuestAddressForm: React.FC<GuestAddressFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [address, setAddress] = useState<Partial<Address>>({
    label: 'Shipping Address',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const requiredFields = [
      'fullName',
      'line1',
      'city',
      'state',
      'postalCode',
      'country',
      'phone',
    ];
    requiredFields.forEach((field) => {
      if (!address[field as keyof Address]) {
        newErrors[field] = `${field} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(address as Address);
  };

  const handleChange = (field: string, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields... */}
      <input
        type="text"
        placeholder="Full Name"
        value={address.fullName || ''}
        onChange={(e) => handleChange('fullName', e.target.value)}
        disabled={isLoading}
      />
      {/* ... other fields ... */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        {isLoading ? 'Processing...' : 'Continue'}
      </button>
    </form>
  );
};
```

**Step 3: Create Order Tracking Page**

File: `/mercora-next/src/pages/TrackOrder.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function TrackOrder() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [orderId, setOrderId] = useState(searchParams.get('id') || '');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/order/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, orderId }),
      });

      if (!response.ok) {
        throw new Error('Order not found');
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8">Track Your Order</h1>

      <form onSubmit={handleTrack} className="max-w-lg mx-auto mb-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Order ID</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            {loading ? 'Tracking...' : 'Track Order'}
          </button>
        </div>
      </form>

      {error && <div className="text-red-600 text-center mb-4">{error}</div>}

      {order && (
        <div className="max-w-lg mx-auto bg-white border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Order #{order.id}</h2>
          <div className="space-y-2">
            <p>
              <strong>Status:</strong> {order.status}
            </p>
            <p>
              <strong>Total:</strong> ${order.total}
            </p>
            <p>
              <strong>Created:</strong>{' '}
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
            {/* Shipping status timeline */}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 2.2 Backend Implementation (Sprint 2, 3 günü)

**Step 1: Create Guest Checkout API**

File: `/mercora-next/src/app/api/checkout/guest/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const {
      guestEmail,
      guestPhone,
      shippingAddress,
      items,
      total,
      currency,
    } = await req.json();

    // Validate input
    if (!guestEmail || !guestPhone || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const orderId = uuidv4();
    const sessionId = uuidv4();
    const now = new Date().toISOString();

    // Create order in Firestore
    const orderRef = await addDoc(collection(db, 'orders'), {
      id: orderId,
      guestEmail,
      guestPhone,
      sessionId,
      userId: null, // null for guest
      items,
      shippingAddress,
      total,
      currency,
      paymentMethod: null, // to be set after payment
      paymentStatus: 'pending',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      orderId,
      sessionId,
      documentId: orderRef.id,
    });
  } catch (error: any) {
    console.error('Guest checkout error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**Step 2: Create Order Tracking API**

File: `/mercora-next/src/app/api/order/track/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    const { email, orderId } = await req.json();

    if (!email || !orderId) {
      return NextResponse.json(
        { error: 'Email and Order ID required' },
        { status: 400 }
      );
    }

    // Query for guest or registered user order
    const q = query(
      collection(db, 'orders'),
      where('id', '==', orderId)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = snap.docs[0].data();

    // Verify email matches
    if (order.guestEmail !== email && order.userEmail !== email) {
      return NextResponse.json(
        { error: 'Email does not match order' },
        { status: 403 }
      );
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Order tracking error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**Step 3: Update Order Types**

File: `/mercora-next/src/types/order.ts` (NEW FILE)

```typescript
export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  category?: string;
}

export type OrderStatus =
  | 'pending'
  | 'pending_cod'
  | 'confirmed_cod'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'pending_cod'
  | 'cod_completed';

export interface Order {
  id: string;
  userId?: string;           // NULL for guests
  guestEmail?: string;       // NEW
  guestPhone?: string;       // NEW
  sessionId?: string;        // NEW - for guest tracking
  items: OrderItem[];
  total: number;
  currency: string;
  paymentMethod?: string;    // 'card' | 'applepay' | 'googlepay' | 'iyzico' | 'cod'
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  shippingAddress: any;
  createdAt: string;
  updatedAt: string;
}
```

### 2.3 Testing Checklist - Guest Checkout

- [ ] Guest email form validation (email, phone)
- [ ] Address form validation (required fields)
- [ ] Order created in Firestore with guestEmail
- [ ] Session ID generated and returned
- [ ] Payment intent created with orderId
- [ ] Order tracking page accessible (no login)
- [ ] Email + Order ID correctly identifies order
- [ ] Confirmation email sent to guestEmail

---

## PART 3: CASH ON DELIVERY (Sprint 2, 3 günü)

### 3.1 Update Order Types

File: `/mercora-next/src/types/order.ts` (MODIFY)

```typescript
export type PaymentMethod = 'card' | 'applepay' | 'googlepay' | 'iyzico' | 'cod';

export type OrderStatus =
  | 'pending'
  | 'pending_cod'          // NEW
  | 'confirmed_cod'        // NEW
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface Order {
  // ... existing fields
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  
  // COD specific fields
  codVerificationStatus?: 'pending' | 'verified' | 'failed';  // NEW
  codVerificationToken?: string;   // NEW
}
```

### 3.2 Frontend: Add COD Option

File: `/mercora-next/src/components/payment/CODPayment.tsx` (NEW)

```typescript
'use client';

import React from 'react';

interface CODPaymentProps {
  orderId: string;
  total: number;
  onSelect: () => void;
  isSelected: boolean;
}

export const CODPayment: React.FC<CODPaymentProps> = ({
  orderId,
  total,
  onSelect,
  isSelected,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`border-2 rounded-lg p-4 cursor-pointer transition ${
        isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <h3 className="font-semibold text-lg mb-2">Pay on Delivery (COD)</h3>
      <div className="bg-blue-100 border border-blue-300 rounded p-3 mb-3">
        <p className="text-sm text-blue-900">
          Pay in cash when your order is delivered. Our courier will collect
          payment.
        </p>
      </div>
      <ul className="text-sm text-gray-600 space-y-2">
        <li>✓ No upfront payment required</li>
        <li>✓ Delivery in 2-3 business days</li>
        <li>✓ Available in selected areas</li>
        <li>✓ Identity verification may be required</li>
      </ul>
      {isSelected && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm font-semibold text-green-800">
            You will pay {total} {/* currency */} upon delivery
          </p>
        </div>
      )}
    </div>
  );
};
```

### 3.3 Backend: Create COD Order API

File: `/mercora-next/src/app/api/order/create-with-cod/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      guestEmail,
      items,
      total,
      currency,
      shippingAddress,
    } = await req.json();

    if (!items || items.length === 0 || !shippingAddress) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    const orderId = uuidv4();
    const codVerificationToken = uuidv4();
    const now = new Date().toISOString();

    // Create order with pending_cod status
    const orderRef = await addDoc(collection(db, 'orders'), {
      id: orderId,
      userId: userId || null,
      guestEmail: guestEmail || null,
      items,
      total,
      currency,
      shippingAddress,
      paymentMethod: 'cod',
      paymentStatus: 'pending_cod',
      status: 'pending_cod',
      codVerificationStatus: 'pending',
      codVerificationToken,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      orderId,
      status: 'pending_cod',
      codVerificationToken,
    });
  } catch (error: any) {
    console.error('COD order creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### 3.4 Backend: COD Confirmation API

File: `/mercora-next/src/app/api/order/confirm-cod/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    const { orderId, codVerificationToken } = await req.json();

    // Verify token (from cargo system)
    const q = query(
      collection(db, 'orders'),
      where('id', '==', orderId),
      where('codVerificationToken', '==', codVerificationToken)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    const orderDoc = snap.docs[0];
    await updateDoc(doc(db, 'orders', orderDoc.id), {
      codVerificationStatus: 'verified',
      status: 'confirmed_cod',
      paymentStatus: 'pending_cod',
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ status: 'confirmed_cod' });
  } catch (error: any) {
    console.error('COD confirmation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### 3.5 Seller Dashboard: COD Orders

File: `/mercora-next/src/components/seller/CODOrdersDashboard.tsx` (NEW)

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CODOrdersDashboardProps {
  sellerId: string;
}

export const CODOrdersDashboard: React.FC<CODOrdersDashboardProps> = ({
  sellerId,
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCODOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('sellerIds', 'array-contains', sellerId),
          where('paymentMethod', '==', 'cod'),
          where('status', 'in', ['pending_cod', 'confirmed_cod'])
        );

        const snap = await getDocs(q);
        const ordersData = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching COD orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCODOrders();
  }, [sellerId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">COD Orders ({orders.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Order ID</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Total</th>
              <th className="text-left py-2">Customer</th>
              <th className="text-left py-2">Address</th>
              <th className="text-left py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="py-3">{order.id.substring(0, 8)}</td>
                <td className="py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'confirmed_cod'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="py-3">${order.total}</td>
                <td className="py-3">
                  {order.guestEmail || order.userName}
                </td>
                <td className="py-3 text-sm text-gray-600">
                  {order.shippingAddress?.city}
                </td>
                <td className="py-3">
                  <button className="text-blue-600 hover:underline">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

### 3.6 Testing Checklist - COD

- [ ] COD option appears in payment methods
- [ ] COD order status = pending_cod
- [ ] Verification token generated
- [ ] Seller sees COD orders in dashboard
- [ ] COD confirmation API works
- [ ] Order status updates to confirmed_cod
- [ ] Kargo API integration (mock testing)
- [ ] Email notification sent (COD awaiting pickup)

---

## IMPLEMENTATION SUMMARY

| Phase | Feature | Sprint | Duration | Status |
|-------|---------|--------|----------|--------|
| S1 | Apple Pay | 1 | 2d | Ready |
| S1 | Google Pay | 1 | 2d | Ready |
| S1 | Guest form (FE) | 1 | 3d | Ready |
| S2 | Guest API (BE) | 2 | 3d | Ready |
| S2 | COD | 2 | 3d | Ready |
| **Total** | **5 features** | **2 sprints** | **14 days** | **Ready** |

---

**Reference Files:**
- `/mercora-next/src/app/api/create-payment-intent/route.ts`
- `/mercora-next/src/app/api/iyzico/init/route.ts`
- `/mercora-next/src/services/paymentProviderService.ts`
- `/mercora-next/src/services/orderService.ts`

**Next Steps:**
1. Create feature branches for each component
2. Implement in parallel (frontend can work on Apple/Google Pay, backend on guest API)
3. Weekly sync for Iyzico/Stripe integration testing
4. QA testing on iOS Safari + Android Chrome devices
