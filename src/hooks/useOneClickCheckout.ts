import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { executeOneClickCheckout } from '@/services/oneClickCheckoutService';

export interface OneClickItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

interface SuccessOrder {
  orderId: string;
  total: number;
  currency: string;
}

/**
 * Shared one-click checkout logic used by the cart and product pages.
 * Gates on a saved default card + a default shipping address, runs the
 * off-session charge, and exposes success/error/loading state so callers
 * can render <OneClickSuccessModal>. On a 3DS (`requires_action`) result it
 * falls back to the full /checkout flow (cart is preserved server-side).
 */
export function useOneClickCheckout() {
  const { user, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<SuccessOrder | null>(null);

  const canOneClick =
    !!user &&
    !!user.defaultPaymentMethodId &&
    !!user.defaultAddressId &&
    !!user.addresses?.find((a) => a.id === user.defaultAddressId);

  const runOneClick = useCallback(
    async (items: OneClickItem[], currency?: string, onSuccess?: () => void) => {
      if (!firebaseUser || !user || !canOneClick || items.length === 0) return;
      const cur = currency || user.currency || 'gbp';
      setLoading(true);
      setError(null);
      const result = await executeOneClickCheckout(firebaseUser, items, cur);
      if (result.status === 'succeeded' && result.orderId) {
        onSuccess?.();
        setSuccessOrder({ orderId: result.orderId, total: result.total ?? 0, currency: cur });
      } else if (result.status === 'requires_action') {
        // 3DS / extra auth needed — complete it in the standard checkout (cart intact)
        navigate('/checkout', { state: { oneClickAuth: true } });
      } else {
        setError(result.errorMessage || 'Ödeme başarısız oldu.');
      }
      setLoading(false);
    },
    [firebaseUser, user, canOneClick, navigate]
  );

  return {
    canOneClick,
    runOneClick,
    loading,
    error,
    successOrder,
    clearSuccess: () => setSuccessOrder(null),
    clearError: () => setError(null),
  };
}
