/**
 * Order types for Mercora
 */

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'paid';

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  variantId?: string;
}

export interface Order {
  id: string;
  userId: string;
  buyerId?: string;
  sellerId?: string;
  items: OrderItem[];
  total: number;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  currency: string;
  status: OrderStatus;
  shippingAddress?: {
    fullName: string;
    line1: string;
    city: string;
    country: string;
    postalCode: string;
  };
  paymentMethod?: string;
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
  trackingNumber?: string;
  carrier?: string;
}
