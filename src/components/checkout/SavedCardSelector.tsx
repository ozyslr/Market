import React from 'react';
import { CreditCard, Star, Trash2, Loader2, Plus } from 'lucide-react';
import type { SavedCard } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { deletePaymentMethod, setDefaultPaymentMethod } from '@/services/oneClickCheckoutService';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface SavedCardSelectorProps {
  cards: SavedCard[];
  selectedCardId: string | null;
  onSelect: (cardId: string | null) => void;
  loading: boolean;
  onCardsChange: () => void;
}

export function SavedCardSelector({
  cards,
  selectedCardId,
  onSelect,
  loading,
  onCardsChange,
}: SavedCardSelectorProps) {
  const { t } = useLanguage();
  const { firebaseUser } = useAuth();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const handleSetDefault = async (id: string) => {
    if (!firebaseUser) return;
    setBusyId(id);
    await setDefaultPaymentMethod(firebaseUser, id);
    await onCardsChange();
    setBusyId(null);
  };

  const handleDelete = async (id: string) => {
    if (!firebaseUser) return;
    if (
      !window.confirm(t('payment.confirmDelete', 'Bu kartı kaldırmak istediğinize emin misiniz?'))
    )
      return;
    setBusyId(id);
    await deletePaymentMethod(firebaseUser, id);
    await onCardsChange();
    setBusyId(null);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-3">
          {t('payment.savedMethods', 'Kayıtlı Kartlarım')}
        </p>
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-brand-primary/5 dark:bg-zinc-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
        {t('payment.savedMethods', 'Kayıtlı Kartlarım')}
      </p>

      {cards.map((card) => {
        const isSelected = selectedCardId === card.id;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-start',
              isSelected
                ? 'border-accent bg-accent/5 shadow-sm'
                : 'border-brand-primary/10 bg-white dark:bg-zinc-900 hover:border-accent/40',
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
                isSelected ? 'bg-accent text-white' : 'bg-brand-secondary text-brand-primary/50',
              )}
            >
              <CreditCard size={18} />
            </div>
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
            <div className="flex items-center gap-1 shrink-0">
              {busyId === card.id ? (
                <Loader2 size={16} className="animate-spin text-brand-primary/40" />
              ) : (
                <>
                  {!card.isDefault && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetDefault(card.id);
                      }}
                      className="p-2 text-brand-primary/30 hover:text-accent transition-colors"
                      title={t('payment.makeDefault', 'Varsayılan yap')}
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(card.id);
                    }}
                    className="p-2 text-brand-primary/30 hover:text-red-500 transition-colors"
                    aria-label={t('payment.remove', 'Kartı kaldır')}
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
            {isSelected && (
              <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center shrink-0">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </button>
        );
      })}

      {/* "New card" option */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-dashed transition-all text-start',
          selectedCardId === null && cards.length > 0
            ? 'border-accent bg-accent/5'
            : 'border-brand-primary/20 hover:border-accent/40',
        )}
      >
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            selectedCardId === null && cards.length > 0
              ? 'bg-accent text-white'
              : 'bg-brand-secondary text-brand-primary/50',
          )}
        >
          <Plus size={18} />
        </div>
        <div className="flex-1">
          <p
            className={cn(
              'text-sm font-medium',
              selectedCardId === null && cards.length > 0 ? 'text-accent' : 'text-brand-primary/60',
            )}
          >
            {t('payment.newCard', 'Yeni Kart Ekle')}
          </p>
          <p className="text-[10px] text-brand-primary/40">
            {t('payment.newCardDesc', 'Kredi kartı bilgilerini gir')}
          </p>
        </div>
      </button>
    </div>
  );
}
