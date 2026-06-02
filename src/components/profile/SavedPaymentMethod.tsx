import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Plus, Trash2, Check, Star, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../../context/AuthContext';
import {
  createSetupIntent,
  setupPaymentMethod,
  listPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod,
} from '../../services/oneClickCheckoutService';
import { useLanguage } from '../../context/LanguageContext';
import type { SavedCard } from '../../types';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = loadStripe(stripePublishableKey);

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
      const pm = await (stripe as any).retrievePaymentMethod(setupIntent.payment_method as string);
      const card = pm.paymentMethod?.card;
      const result = await setupPaymentMethod(
        firebaseUser,
        setupIntent.payment_method as string,
        card?.last4 || '',
        card?.brand || '',
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
  const { firebaseUser, refreshUser } = useAuth();
  const { t } = useLanguage();

  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const loadCards = useCallback(async () => {
    if (!firebaseUser) {
      setLoadingCards(false);
      return;
    }
    setLoadingCards(true);
    setCardsError(null);
    const result = await listPaymentMethods(firebaseUser);
    if (result.error) setCardsError(result.error);
    setCards(result.cards);
    setLoadingCards(false);
  }, [firebaseUser]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const openSetupForm = async () => {
    if (!firebaseUser) return;
    if (!stripePublishableKey) {
      setSetupError(
        t(
          'payment.configMissing',
          'Ödeme sistemi yapılandırılmamış. Lütfen daha sonra tekrar deneyin.',
        ),
      );
      return;
    }
    setLoadingIntent(true);
    setSetupError(null);
    const result = await createSetupIntent(firebaseUser);
    if (result.clientSecret) {
      setClientSecret(result.clientSecret);
      setShowForm(true);
    } else {
      setSetupError(
        result.error || t('payment.setupFailed', 'Ödeme formu yüklenemedi. Lütfen tekrar deneyin.'),
      );
    }
    setLoadingIntent(false);
  };

  const handleSetDefault = async (id: string) => {
    if (!firebaseUser) return;
    setBusyId(id);
    const result = await setDefaultPaymentMethod(firebaseUser, id);
    if (result.error) setCardsError(result.error);
    await Promise.all([loadCards(), refreshUser()]);
    setBusyId(null);
  };

  const handleDelete = async (id: string) => {
    if (!firebaseUser) return;
    if (
      !window.confirm(t('payment.confirmDelete', 'Bu kartı kaldırmak istediğinize emin misiniz?'))
    )
      return;
    setBusyId(id);
    const result = await deletePaymentMethod(firebaseUser, id);
    if (result.error) setCardsError(result.error);
    await Promise.all([loadCards(), refreshUser()]);
    setBusyId(null);
  };

  const onAddSuccess = async () => {
    setShowForm(false);
    setClientSecret(null);
    await loadCards();
  };

  return (
    <div className="max-w-xl space-y-4">
      <h3 className="text-lg font-semibold text-brand-primary dark:text-white">
        {t('payment.savedMethods', 'Kayıtlı Ödeme Yöntemi')}
      </h3>
      <p className="text-sm text-brand-primary/60 dark:text-zinc-400">
        {t(
          'payment.description',
          "Tek tıkla ödeme için kartınızı kaydedin. Kart bilgileri güvenli şekilde Stripe'ta saklanır.",
        )}
      </p>

      {/* Card list */}
      {loadingCards ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-brand-primary/5 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <p className="text-sm text-brand-primary/40 dark:text-zinc-500 py-2">
          {t('payment.noCards', 'Henüz kayıtlı kartınız yok.')}
        </p>
      ) : (
        <div className="space-y-2">
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex items-center gap-3 p-4 border border-brand-primary/10 rounded-xl bg-white dark:bg-zinc-900"
            >
              <CreditCard size={20} className="text-brand-primary/50 dark:text-zinc-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium capitalize text-brand-primary dark:text-white flex items-center gap-2">
                  {card.brand}
                  {card.isDefault && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                      <Star size={10} className="fill-accent" />
                      {t('payment.default', 'Varsayılan')}
                    </span>
                  )}
                </p>
                <p className="text-sm text-brand-primary/60 dark:text-zinc-400">
                  •••• {card.last4}
                  <span className="ms-2 text-xs text-brand-primary/40 dark:text-zinc-500">
                    {String(card.expMonth).padStart(2, '0')}/{String(card.expYear).slice(-2)}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {busyId === card.id ? (
                  <Loader2 size={16} className="animate-spin text-brand-primary/40" />
                ) : (
                  <>
                    {!card.isDefault && (
                      <button
                        onClick={() => handleSetDefault(card.id)}
                        className="text-xs text-accent hover:underline font-medium flex items-center gap-1"
                      >
                        <Check size={14} />
                        {t('payment.makeDefault', 'Varsayılan yap')}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="text-brand-primary/40 hover:text-red-500 transition-colors"
                      aria-label={t('payment.remove', 'Kartı kaldır')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {cardsError && (
        <p className="text-sm text-red-500" role="alert">
          {cardsError}
        </p>
      )}

      {/* Add card */}
      {!showForm && (
        <button
          onClick={openSetupForm}
          disabled={loadingIntent}
          className="w-full py-3 border-2 border-dashed border-brand-primary/20 rounded-xl text-sm text-brand-primary/60 dark:text-zinc-400 hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          {loadingIntent
            ? t('payment.loading', 'Yükleniyor...')
            : t('payment.addCard', 'Kart Ekle')}
        </button>
      )}

      {setupError && (
        <p className="text-sm text-red-500" role="alert">
          {setupError}
        </p>
      )}

      {showForm && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <SetupForm onSuccess={onAddSuccess} />
        </Elements>
      )}
    </div>
  );
}
