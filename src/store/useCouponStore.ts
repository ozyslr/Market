import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CouponType = 'percentage' | 'fixed' | 'freeshipping';

export interface Coupon {
  code: string;
  type: CouponType;
  value: number; // percentage (0-100) or fixed currency amount; ignored for freeshipping
  minOrder: number; // minimum subtotal required
  description: string;
  expiresAt?: string; // ISO date; undefined = never expires
}

export const AVAILABLE_COUPONS: Coupon[] = [
  { code: 'HOSGELDIN10', type: 'percentage', value: 10, minOrder: 0, description: 'İlk alışverişine %10 indirim' },
  { code: 'SUPER20', type: 'percentage', value: 20, minOrder: 500, description: '500₺ ve üzeri sepette %20 indirim' },
  { code: 'MERCORA50', type: 'fixed', value: 50, minOrder: 250, description: '250₺ ve üzeri sepette 50₺ indirim' },
  { code: 'KARGOBEDAVA', type: 'freeshipping', value: 0, minOrder: 0, description: 'Ücretsiz kargo' },
];

export function findCouponIn(catalog: Coupon[], code: string): Coupon | undefined {
  return catalog.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
}

/** Returns the discount amount applied to a given subtotal/shipping. */
export function calculateDiscount(coupon: Coupon | null, subtotal: number, shipping: number): number {
  if (!coupon) return 0;
  if (subtotal < coupon.minOrder) return 0;
  switch (coupon.type) {
    case 'percentage':
      return (subtotal * coupon.value) / 100;
    case 'fixed':
      return Math.min(coupon.value, subtotal);
    case 'freeshipping':
      return shipping;
    default:
      return 0;
  }
}

interface CouponStore {
  catalog: Coupon[];
  appliedCode: string | null;
  error: string | null;
  applyCoupon: (code: string, subtotal: number) => boolean;
  removeCoupon: () => void;
  getAppliedCoupon: () => Coupon | null;
  addCoupon: (coupon: Coupon) => boolean;
  deleteCoupon: (code: string) => void;
}

export const useCouponStore = create<CouponStore>()(
  persist(
    (set, get) => ({
      catalog: AVAILABLE_COUPONS,
      appliedCode: null,
      error: null,

      applyCoupon: (code, subtotal) => {
        const coupon = findCouponIn(get().catalog, code);
        if (!coupon) {
          set({ error: 'Geçersiz kupon kodu.', appliedCode: null });
          return false;
        }
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          set({ error: 'Bu kuponun süresi dolmuş.', appliedCode: null });
          return false;
        }
        if (subtotal < coupon.minOrder) {
          set({
            error: `Bu kupon en az ${coupon.minOrder}₺ sepet tutarı gerektirir.`,
            appliedCode: null,
          });
          return false;
        }
        set({ appliedCode: coupon.code, error: null });
        return true;
      },

      removeCoupon: () => set({ appliedCode: null, error: null }),

      getAppliedCoupon: () => findCouponIn(get().catalog, get().appliedCode || '') || null,

      addCoupon: (coupon) => {
        const code = coupon.code.trim().toUpperCase();
        if (!code) {
          set({ error: 'Kupon kodu boş olamaz.' });
          return false;
        }
        if (findCouponIn(get().catalog, code)) {
          set({ error: 'Bu kupon kodu zaten mevcut.' });
          return false;
        }
        set((state) => ({ catalog: [{ ...coupon, code }, ...state.catalog], error: null }));
        return true;
      },

      deleteCoupon: (code) =>
        set((state) => ({
          catalog: state.catalog.filter((c) => c.code.toUpperCase() !== code.toUpperCase()),
          appliedCode: state.appliedCode?.toUpperCase() === code.toUpperCase() ? null : state.appliedCode,
        })),
    }),
    {
      name: 'mercora-coupon-storage',
      partialize: (state) => ({ appliedCode: state.appliedCode, catalog: state.catalog }),
    }
  )
);
