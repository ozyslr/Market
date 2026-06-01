import React, { useEffect, useState } from 'react';
import { Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  trackPrice,
  untrackPrice,
  isTrackingPrice,
  getPriceAlert,
} from '@/services/priceTrackingService';

interface Props {
  productId: string;
  currentPrice: number;
  userId?: string;
}

export function PriceTrackButton({ productId, currentPrice, userId }: Props) {
  const [tracking, setTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [targetPrice, setTargetPrice] = useState<number>(currentPrice * 0.9);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const uid = userId;
    isTrackingPrice(uid, productId).then(async (isTracked) => {
      setTracking(isTracked);
      if (isTracked) {
        const alert = await getPriceAlert(uid, productId);
        if (alert) setTargetPrice(alert.targetPrice);
      }
    }).catch(() => {});
  }, [userId, productId]);

  // Recalculate default when price changes and not currently tracking
  useEffect(() => {
    if (!tracking) {
      setTargetPrice(Math.round(currentPrice * 0.9 * 100) / 100);
    }
  }, [currentPrice, tracking]);

  if (!userId) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-400 cursor-not-allowed">
        <Crosshair size={13} />
        Fiyat Düşünce Haber Ver
      </div>
    );
  }

  const uid: string = userId;

  async function handleToggle() {
    if (loading) return;
    setLoading(true);
    try {
      if (tracking) {
        await untrackPrice(uid, productId);
        setTracking(false);
      } else {
        await trackPrice(uid, productId, targetPrice);
        setTracking(true);
        setEditing(false);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggle}
          disabled={loading}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50',
            tracking
              ? 'bg-accent/10 text-accent border border-accent/30'
              : 'bg-brand-secondary/30 text-brand-primary/40 hover:text-accent border border-transparent'
          )}
        >
          <Crosshair size={13} fill={tracking ? 'currentColor' : 'none'} />
          {tracking ? 'Fiyat Takibinde' : 'Fiyat Düşünce Haber Ver'}
        </button>
        {tracking && (
          <button
            onClick={() => setEditing(!editing)}
            className="px-3 py-2.5 rounded-xl text-[10px] font-bold text-brand-primary/40 hover:text-accent border border-transparent hover:border-accent/30 transition-all"
          >
            Hedef: £{targetPrice.toFixed(2)}
          </button>
        )}
      </div>

      {editing && tracking && (
        <div className="flex items-center gap-2 px-3 py-2 bg-brand-secondary/40 rounded-xl border border-brand-primary/5">
          <span className="text-[10px] font-black uppercase text-brand-primary/40 whitespace-nowrap">
            Hedef Fiyat
          </span>
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-primary/40">
              £
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={currentPrice}
              value={targetPrice}
              onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
              className="w-full pl-5 pr-2 py-1 text-xs font-bold rounded-lg border border-brand-primary/10 bg-white focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <button
            onClick={async () => {
              if (loading) return;
              setLoading(true);
              try {
                await untrackPrice(uid, productId);
                await trackPrice(uid, productId, targetPrice);
              } finally {
                setLoading(false);
              }
              setEditing(false);
            }}
            disabled={loading}
            className="px-3 py-1 text-[10px] font-black uppercase bg-accent text-white rounded-lg hover:bg-accent/90 transition-all disabled:opacity-50"
          >
            Güncelle
          </button>
        </div>
      )}
    </div>
  );
}
