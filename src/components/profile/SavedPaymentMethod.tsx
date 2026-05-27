import React, { useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../../context/AuthContext';
import { createSetupIntent, setupPaymentMethod } from '../../services/oneClickCheckoutService';
import { useLanguage } from '../../context/LanguageContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

function SetupForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { firebaseUser, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !firebaseUser) return;
    setLoading(true);
    setError(null);

    const { error: confirmError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || t('payment.saveFailed', 'Kart kaydedilemedi'));
      setLoading(false);
      return;
    }

    if (setupIntent?.payment_method) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pm = await (stripe as any).retrievePaymentMethod(setupIntent.payment_method as string);
      const card = pm.paymentMethod?.card;
      const result = await setupPaymentMethod(
        firebaseUser,
        setupIntent.payment_method as string,
        card?.last4 || '',
        card?.brand || ''
      );
      if (result.error) {
        setError(result.error);
      } else {
        await refreshUser();
        onSuccess();
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full py-3 bg-black text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-gray-800 transition-colors"
      >
        {loading ? t('payment.saving', 'Kaydediliyor...') : t('payment.saveCard', 'Kartı Kaydet')}
      </button>
    </form>
  );
}

export function SavedPaymentMethod() {
  const { user, firebaseUser } = useAuth();
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const openSetupForm = async () => {
    if (!firebaseUser) return;
    const result = await createSetupIntent(firebaseUser);
    if (result.clientSecret) {
      setClientSecret(result.clientSecret);
      setShowForm(true);
    }
  };

  const hasSavedCard = !!(user?.defaultPaymentMethodId);

  return (
    <div className="max-w-xl space-y-4">
      <h3 className="text-lg font-semibold text-brand-primary dark:text-white">
        {t('payment.savedMethods', 'Kayıtlı Ödeme Yöntemi')}
      </h3>
      <p className="text-sm text-brand-primary/60 dark:text-zinc-400">
        {t(
          'payment.description',
          'Tek tıkla ödeme için kartınızı kaydedin. Kart bilgileri güvenli şekilde Stripe\'ta saklanır.'
        )}
      </p>

      {hasSavedCard && (
        <div className="flex items-center gap-3 p-4 border border-brand-primary/10 rounded-xl bg-white dark:bg-zinc-900">
          <CreditCard size={20} className="text-brand-primary/50 dark:text-zinc-500" />
          <div className="flex-1">
            <p className="text-sm font-medium capitalize text-brand-primary dark:text-white">
              {user?.defaultPaymentMethodBrand}
            </p>
            <p className="text-sm text-brand-primary/60 dark:text-zinc-400">•••• {user?.defaultPaymentMethodLast4}</p>
          </div>
          <button
            onClick={openSetupForm}
            className="text-xs text-accent hover:underline font-medium"
          >
            {t('payment.change', 'Değiştir')}
          </button>
        </div>
      )}

      {!hasSavedCard && !showForm && (
        <button
          onClick={openSetupForm}
          className="w-full py-3 border-2 border-dashed border-brand-primary/20 rounded-xl text-sm text-brand-primary/60 dark:text-zinc-400 hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          {t('payment.addCard', 'Kart Ekle')}
        </button>
      )}

      {showForm && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <SetupForm onSuccess={() => setShowForm(false)} />
        </Elements>
      )}
    </div>
  );
}
