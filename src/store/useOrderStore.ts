import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order } from '../types';

export interface ExtendedOrder extends Order {
  buyerName: string;
  shippingAddress: string;
  trackingNumber?: string;
  urgency: 'Standard' | 'High' | 'Critical';
}

interface OrderState {
  orders: ExtendedOrder[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => void;
  updateOrderStatus: (id: string, status: ExtendedOrder['status'], trackingNumber?: string) => void;
}

// Temporary Mock Data for modern order screen
const MOCK_ORDERS: ExtendedOrder[] = [
  { 
    id: 'ORD-8821', 
    buyerId: 'user1',
    buyerName: 'Alice M.', 
    total: 249.99, 
    status: 'pending', 
    shippingAddress: '123 Baker St, London, UK', 
    urgency: 'High',
    items: [{ productId: 'p1', quantity: 2, price: 124.99 }],
    createdAt: new Date(Date.now() - 10000000).toISOString(),
    market: 'UK'
  },
  { 
    id: 'ORD-8822', 
    buyerId: 'user2',
    buyerName: 'Khalid A.', 
    total: 120.00, 
    status: 'shipped', 
    trackingNumber: 'TRK-992123',
    shippingAddress: '45 King Fahd Rd, Riyadh, KSA', 
    urgency: 'Standard',
    items: [{ productId: 'p2', quantity: 1, price: 120.00 }],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    market: 'KSA'
  },
  { 
    id: 'ORD-8823', 
    buyerId: 'user3',
    buyerName: 'Marie L.', 
    total: 899.00, 
    status: 'delivered', 
    trackingNumber: 'TRK-992124',
    shippingAddress: '12 Avenue des Champs-Élysées, Paris, FR', 
    urgency: 'Standard',
    items: [{ productId: 'p3', quantity: 1, price: 899.00 }],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    market: 'FR'
  },
  { 
    id: 'ORD-8824', 
    buyerId: 'user4',
    buyerName: 'James T.', 
    total: 19.99, 
    status: 'processing', 
    shippingAddress: '78 Marina, Dubai, UAE', 
    urgency: 'High',
    items: [{ productId: 'p4', quantity: 1, price: 19.99 }],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    market: 'UAE'
  },
];

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: MOCK_ORDERS,
      isLoading: false,
      error: null,

      fetchOrders: () => {
        // Only fetch if empty, or simulate refresh
        if (get().orders.length === 0) {
          set({ isLoading: true });
          setTimeout(() => {
            set({ orders: MOCK_ORDERS, isLoading: false });
          }, 600);
        }
      },

      updateOrderStatus: (id, status, trackingNumber) => {
        set((state) => ({
          orders: state.orders.map(order => 
            order.id === id 
              ? { ...order, status, trackingNumber: trackingNumber || order.trackingNumber } 
              : order
          )
        }));
      }
    }),
    {
      name: 'mercora-orders-storage',
    }
  )
);
