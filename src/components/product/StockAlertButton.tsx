import React, { useEffect, useState } from 'react';
import { Bell, BellOff, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  subscribeToStockAlert,
  unsubscribeFromStockAlert,
  isSubscribedToStockAlert,
} from '@/services/stockAlertService';

interface Props {
  productId: string;
  stock: number;
  userId?: string;
}

export function StockAlertButton({ productId, stock, userId }: Props) {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justNotified, setJustNotified] = useState(false);

  useEffect(() => {
    if (!userId) return;
    isSubscribedToStockAlert(userId, productId).then(setSubscribed).catch(() => {});
  }, [userId, productId]);

  // Show "Tekrar stokta!" when subscribed and product is back in stock
  useEffect(() => {
    if (subscribed && stock > 0) {
      setJustNotified(true);
    }
  }, [subscribed, stock]);

  if (stock > 0 && !subscribed) return null;

  async function handleToggle() {
    if (!userId || loading) return;
    setLoading(true);
    try {
      if (subscribed) {
        await unsubscribeFromStockAlert(userId, productId);
        setSubscribed(false);
        setJustNotified(false);
      } else {
        await subscribeToStockAlert(userId, productId);
        setSubscribed(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (justNotified) {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50',
          'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
        )}
      >
        <CheckCircle2 size={13} />
        Tekrar stokta!
      </button>
    );
  }

  if (stock === 0 && !userId) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-400 cursor-not-allowed">
        <Bell size={13} />
        Gelince Haber Ver
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50',
        subscribed
          ? 'bg-accent/10 text-accent border border-accent/30'
          : 'bg-brand-secondary/30 text-brand-primary/40 hover:text-accent border border-transparent'
      )}
    >
      {subscribed ? <BellOff size={13} /> : <Bell size={13} />}
      {subscribed ? 'Bilgilendirme Aktif' : 'Gelince Haber Ver'}
    </button>
  );
}
