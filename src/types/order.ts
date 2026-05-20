export type PaymentMethod = 'stripe' | 'iyzico' | 'paytr' | 'manual';

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'return_requested' | 'returned';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed';

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
}
