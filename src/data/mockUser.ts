/**
 * KARANTİNA: Bu mock veri YALNIZCA seedService ve testler tarafından kullanılır.
 * Runtime/UI kodundan (sayfalar, servisler) import ETMEYİN. Gerçek veri için
 * AuthContext / userService fonksiyonlarını kullanın. (ACC-03)
 */
import { UserProfile } from '../types';

export const MOCK_USER: UserProfile = {
  id: 'u1',
  name: 'Ozan S.',
  email: 'ozan@example.com',
  role: 'buyer',
  country: 'UK',
  currency: 'GBP',
  spentTotal: 3450.5,
  createdAt: '2026-01-15T12:00:00Z',
  lastLogin: '2026-04-18T09:00:00Z',
  savedItems: ['p1', 'p2'],
  preferences: {
    newsletter: true,
    personalizedDeals: true,
    pushNotifications: false,
  },
  orders: [
    {
      id: 'ord-101',
      buyerId: 'u1',
      items: [{ productId: 'p1', quantity: 1, price: 249.99 }],
      total: 249.99,
      status: 'delivered',
      createdAt: '2026-03-12T10:00:00Z',
      market: 'UK',
    },
    {
      id: 'ord-102',
      buyerId: 'u1',
      items: [{ productId: 'p4', quantity: 2, price: 19.99 }],
      total: 39.98,
      status: 'delivered',
      createdAt: '2026-04-01T15:00:00Z',
      market: 'UK',
    },
  ],
};
