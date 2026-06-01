import React, { FormEvent, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { ShippingAddress } from '@/types/order';

interface StripePaymentFormProps {
  total: number;
  currency: string;
  isMock: boolean;
  shippingAddress: ShippingAddress;
  onSuccess: (paymentIntentId: string) => void;
  onBack: () => void;
}

export function StripePaymentForm({
  total,
  currency,
  isMock,
  shippingAddress: _shippingAddress,
  onSuccess,
  onBack,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    if (isMock || !stripe || !elements) {
      setTimeout(() => {
        setIsProcessing(false);
        onSuccess('mock_pi_' + Math.random().toString(36).substring(7));
      }, 1500);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed. Please try again.');
      setIsProcessing(false);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else {
      setError('Unexpected payment status. Please contact support.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isMock ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800 font-medium">
          <strong className="block mb-1 uppercase text-xs tracking-widest">Demo Mode</strong>
          Add your Stripe keys to <code className="bg-amber-100 px-1 rounded">.env</code> to enable real
          payments. This checkout will simulate a successful payment.
        </div>
      ) : (
        <PaymentElement />
      )}

      {error && (
        <p className="text-sm text-red-600 font-medium bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="flex items-center gap-4 mt-8">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-4 bg-[#F8F8FA] text-[#1A1033] rounded-2xl font-black uppercase text-[11px] hover:bg-[#1A1033]/5 transition-all"
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
