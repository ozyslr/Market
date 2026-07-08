import React, { FormEvent, useState, useEffect, useRef } from 'react';
import { Loader2, CreditCard, AlertTriangle } from 'lucide-react';
import {
  PaymentElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { ShippingAddress } from '@/types/order';
import { createSetupIntent, setupPaymentMethod } from '@/services/oneClickCheckoutService';
import { useAuth } from '@/context/AuthContext';

interface StripePaymentFormProps {
  total: number;
  currency: string;
  shippingAddress: ShippingAddress;
  onSuccess: (paymentIntentId: string) => void;
  onBack: () => void;
}

export function StripePaymentForm({
  total,
  currency,
  shippingAddress: _shippingAddress,
  onSuccess,
  onBack,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { firebaseUser, refreshUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveCard, setSaveCard] = useState(false);

  // ─── Payment Request (Apple Pay / Google Pay) ────────────────────────────

  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);
  const prInitialised = useRef(false);

  // Stable refs for closure safety inside event listener
  const totalRef = useRef(total);
  totalRef.current = total;
  const currencyRef = useRef(currency);
  currencyRef.current = currency;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (!stripe || prInitialised.current) return;
    prInitialised.current = true;

    const pr = stripe.paymentRequest({
      country: 'TR',
      currency: currency.toLowerCase(),
      total: {
        label: 'Sipariş Toplamı',
        amount: Math.round(total * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
      requestShipping: false,
    });

    pr.canMakePayment()
      .then((result: any) => {
        if (result && (result.applePay || result.googlePay)) {
          setCanMakePayment(true);
          setPaymentRequest(pr);
        } else {
          (pr as any).destroy();
        }
      })
      .catch(() => {
        (pr as any).destroy();
      });

    return () => {
      (pr as any).destroy();
    };
    // Run once when stripe becomes available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe]);

  // ─── Handle Payment Request paymentmethod event ──────────────────────────
  useEffect(() => {
    if (!paymentRequest) return;

    const handlePaymentMethod = async (ev: any) => {
      try {
        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalRef.current,
            currency: currencyRef.current.toLowerCase(),
            paymentMethodId: ev.paymentMethod.id,
          }),
        });
        const data = await res.json();

        if (!res.ok || data.error) {
          ev.complete('fail');
          setError(data.error || 'Ödeme başarısız oldu');
          return;
        }

        // Extract PaymentIntent ID from clientSecret (format: pi_xxx_secret_yyy)
        const piId = (data.clientSecret as string).split('_secret_')[0];
        ev.complete('success');
        onSuccessRef.current(piId);
      } catch (err: unknown) {
        ev.complete('fail');
        setError((err as Error)?.message || 'Ödeme başarısız oldu');
      }
    };

    paymentRequest.on('paymentmethod', handlePaymentMethod);

    // No explicit off — destroy() in the creation useEffect handles cleanup
  }, [paymentRequest]);

  // Stripe not loaded — show error instead of mock fallback
  if (!stripe || !elements) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <strong className="block mb-1 uppercase text-xs tracking-widest text-red-700">
              Ödeme altyapısı yüklenemedi
            </strong>
            <p className="text-sm text-red-600">
              Stripe ödeme sistemi şu anda kullanılamıyor. Lütfen internet bağlantınızı kontrol edip
              sayfayı yenileyin.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-4 bg-[#F8F8FA] text-brand-primary rounded-2xl font-black uppercase text-[11px] hover:bg-brand-primary/5 transition-all"
          >
            Geri
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed. Please try again.');
      setIsProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      // Save card for future purchases if checkbox is checked
      if (saveCard && firebaseUser && paymentIntent.payment_method) {
        try {
          const pmId = paymentIntent.payment_method as string;
          const card = (paymentIntent as any).charges?.data?.[0]?.payment_method_details?.card;
          await setupPaymentMethod(firebaseUser, pmId, card?.last4 || '', card?.brand || '');
          await refreshUser?.();
        } catch (saveErr) {
          // Card saved, non-critical — don't block order confirmation
          console.warn('[Stripe] Failed to save card:', saveErr);
        }
      }
      onSuccess(paymentIntent.id);
    } else {
      setError('Unexpected payment status. Please contact support.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {canMakePayment && paymentRequest && (
        <div className="mb-6">
          <PaymentRequestButtonElement
            options={{
              paymentRequest,
              style: {
                paymentRequestButton: {
                  type: 'buy',
                  theme: 'dark',
                  height: '48px',
                },
              },
            }}
          />
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-brand-primary/10" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
              veya kart ile
            </span>
            <div className="flex-1 h-px bg-brand-primary/10" />
          </div>
        </div>
      )}

      <PaymentElement />

      {/* Save card checkbox — only for logged-in users */}
      {firebaseUser && (
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={saveCard}
            onChange={(e) => setSaveCard(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-brand-primary/20 text-accent focus:ring-accent/30"
          />
          <span className="text-sm text-brand-primary/70 dark:text-zinc-400 group-hover:text-brand-primary transition-colors">
            <CreditCard size={14} className="inline me-1 -mt-0.5" />
            Bu kartı bir sonraki alışverişim için kaydet
          </span>
        </label>
      )}

      {error && (
        <p className="text-sm text-red-600 font-medium bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="flex items-center gap-4 mt-8">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-4 bg-[#F8F8FA] text-brand-primary rounded-2xl font-black uppercase text-[11px] hover:bg-brand-primary/5 transition-all"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isProcessing}
          className="flex-1 py-4 bg-accent text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Processing...
            </>
          ) : (
            <>
              Pay{' '}
              {currency.toUpperCase() === 'GBP'
                ? '£'
                : currency.toUpperCase() === 'USD'
                  ? '$'
                  : '₺'}
              {total.toFixed(2)} Securely
            </>
          )}
        </button>
      </div>
    </form>
  );
}
