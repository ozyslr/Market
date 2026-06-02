export type PaymentMethod = 'stripe' | 'iyzico' | 'paytr' | 'manual';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'return_requested'
  | 'returned';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed';

// ─── OrderSet / SubOrder Types (Order Walking Skeleton) ──────────────────────

export type OrderSetStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'return_requested'
  | 'return_approved'
  | 'return_rejected'
  | 'refunded'
  | 'on_hold';

export type SubOrderStatus = OrderSetStatus;

export type TransitionEvent =
  | 'payment_received'
  | 'mark_shipped'
  | 'confirm_delivery'
  | 'auto_complete'
  | 'cancel'
  | 'request_return'
  | 'approve_return'
  | 'reject_return'
  | 'refund'
  | 'place_on_hold'
  | 'release_hold';

export interface SubOrderItem {
  productId: string;
  sellerId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface SubOrder {
  id: string;
  sellerId: string;
  items: SubOrderItem[];
  subtotal: number;
  shippingCost: number;
  commission: number;
  payoutAmount: number;
  status: SubOrderStatus;
  trackingNumber?: string;
  carrier?: string;
  shippedAt?: string;
  deliveredAt?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderSet {
  id: string;
  userId: string;
  userEmail: string;
  totalAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subOrderIds: string[];
  status: OrderSetStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  sellerId: string;
  name: string;
  title?: string;
  image: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

/** @deprecated Use OrderSet + SubOrder types instead. Kept for backward compatibility. */
export interface Order {
  id: string;
  userId: string;
  buyerId?: string;
  userEmail: string;
  items: OrderItem[];
  sellerIds: string[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  totalAmount?: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  installment?: number;
  stripePaymentIntentId: string;
  iyzicoPaymentToken?: string;
  shippingAddress: ShippingAddress;
  trackingNumber?: string;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  shippedAt?: string;
  /** Seller/admin notes */
  notes?: string;
}

export interface OneClickCheckoutPayload {
  items: Array<{ productId: string; variantId?: string; quantity: number }>;
  currency: string;
}

export interface OneClickCheckoutResult {
  orderId?: string;
  total?: number;
  status: 'succeeded' | 'requires_action' | 'failed';
  clientSecret?: string; // present when status === 'requires_action'
  errorMessage?: string; // present when status === 'failed'
}
