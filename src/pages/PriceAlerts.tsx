import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, TrendingDown, TrendingUp, ShoppingCart, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { getTrackedProducts, untrackPrice, getPriceAlert } from '@/services/priceTrackingService';
import type { PriceAlert } from '@/services/priceTrackingService';
import type { Product } from '@/types';

interface TrackedItem {
  product: Product;
  alert: PriceAlert & { id: string };
}

const currencySymbol = (code?: string): string => {
  if (code === 'GBP') return '\u00A3';
  if (code === 'USD') return '$';
  if (code === 'EUR') return '\u20AC';
  return '\u20BA';
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-white dark:bg-zinc-900 rounded-2xl border border-brand-primary/10 p-4"
        >
          <div className="aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-3" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-2" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mb-2" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function PriceAlerts() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<TrackedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const productIds = await getTrackedProducts(user.id);
      const results: TrackedItem[] = [];
      await Promise.all(
        productIds.map(async (pid) => {
          try {
            const [prodSnap, alert] = await Promise.all([
              getDoc(doc(db, 'products', pid)),
              getPriceAlert(user.id, pid),
            ]);
            if (prodSnap.exists() && alert) {
              results.push({
                product: { id: prodSnap.id, ...prodSnap.data() } as Product,
                alert: alert as PriceAlert & { id: string },
              });
            }
          } catch {
            // skip individual fetch errors
          }
        }),
      );
      results.sort((a, b) => a.product.title.localeCompare(b.product.title));
      setItems(results);
    } catch {
      setError('Fiyat alarmlar\u0131 y\u00FCklenirken bir hata olu\u015Ftu.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleRemove = async (productId: string) => {
    if (!user) return;
    try {
      await untrackPrice(user.id, productId);
      setItems((prev) => prev.filter((item) => item.product.id !== productId));
    } catch {
      // silent
    }
  };

  // ── Not logged in ──────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Bell className="w-20 h-20 text-zinc-200 dark:text-zinc-700 mb-6" />
          <h2 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white mb-3">
            Fiyat Alarmlar\u0131
          </h2>
          <p className="text-brand-primary/40 dark:text-white/40 font-bold mb-8 max-w-md">
            Fiyat alarmlar\u0131n\u0131z\u0131 g\u00F6r\u00FCnt\u00FClemek i\u00E7in giri\u015F
            yap\u0131n.
          </p>
          <button
            onClick={() => navigate('/?login=1')}
            className="px-8 py-3 bg-accent text-white rounded-xl font-black text-sm hover:scale-105 transition-transform shadow-lg"
          >
            Giri\u015F Yap
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Bell className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
            Fiyat Alarmlar\u0131
          </h1>
        </div>
        <SkeletonGrid />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
          <p className="text-red-500 font-bold mb-2">Bir hata olu\u015Ftu</p>
          <p className="text-brand-primary/40 dark:text-white/40 font-bold mb-6">{error}</p>
          <button
            onClick={() => loadItems()}
            className="px-6 py-2.5 bg-accent text-white rounded-xl font-bold text-sm hover:scale-105 transition-transform shadow-lg"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Bell className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
            Fiyat Alarmlar\u0131
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BellOff className="w-16 h-16 text-brand-primary/10 dark:text-white/10 mb-4" />
          <p className="text-brand-primary dark:text-white font-bold text-lg mb-2">
            Fiyat alarm\u0131 takip etmiyorsunuz
          </p>
          <p className="text-brand-primary/40 dark:text-white/40 font-bold mb-8 max-w-md">
            Bir \u00FCr\u00FCn sayfas\u0131nda fiyat d\u00FC\u015F\u00FCnce haber almak i\u00E7in
            &quot;Fiyat Alarm\u0131&quot; butonuna t\u0131klay\u0131n.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-white rounded-xl font-black text-sm hover:scale-105 transition-transform shadow-lg"
          >
            <ShoppingCart size={18} />
            <span>Al\u0131\u015Fveri\u015Fe Ba\u015Fla</span>
          </Link>
        </div>
      </div>
    );
  }

  // ── Data ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Bell className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
          Fiyat Alarmlar\u0131
        </h1>
        <span className="ms-2 px-2.5 py-0.5 bg-accent/10 text-accent rounded-full text-xs font-black">
          {items.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(({ product, alert }) => {
          const symbol = currencySymbol(product.currency);
          const isTriggered = product.price <= alert.targetPrice;
          const diff = product.price - alert.targetPrice;

          return (
            <div
              key={product.id}
              className="relative group bg-white dark:bg-zinc-900 rounded-2xl border border-brand-primary/10 hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Image */}
              <Link to={`/product/${product.slug}`} className="block">
                <div className="aspect-square bg-zinc-50 dark:bg-zinc-800 relative overflow-hidden">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-600">
                      <ShoppingCart size={48} />
                    </div>
                  )}

                  {/* Status badge */}
                  <div
                    className={cn(
                      'absolute top-2 start-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-lg',
                      isTriggered ? 'bg-green-500 text-white' : 'bg-red-500 text-white',
                    )}
                  >
                    {isTriggered ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                    <span>{isTriggered ? 'Hedefe Ula\u015Ft\u0131' : 'Bekleniyor'}</span>
                  </div>
                </div>
              </Link>

              {/* Details */}
              <div className="p-3">
                <Link to={`/product/${product.slug}`} className="block">
                  <h3 className="text-xs font-bold text-brand-primary dark:text-white line-clamp-2 mb-2 leading-relaxed min-h-[2rem]">
                    {product.title}
                  </h3>
                </Link>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-lg font-display font-black text-brand-primary dark:text-white">
                      {symbol}
                      {product.price.toFixed(2)}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                      G\u00FCncel Fiyat
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-lg font-display font-black text-zinc-400">
                      {symbol}
                      {alert.targetPrice.toFixed(2)}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                      Hedef Fiyat
                    </p>
                  </div>
                </div>

                {/* Price difference label */}
                <div
                  className={cn(
                    'text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg text-center mb-3',
                    isTriggered
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
                  )}
                >
                  {isTriggered
                    ? `${symbol}${Math.abs(diff).toFixed(2)} alt\u0131nda \u2014 Alarm tetiklendi!`
                    : `${symbol}${diff.toFixed(2)} fazla \u2014 Hala bekliyor`}
                </div>

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(product.id)}
                  className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-brand-primary/5"
                >
                  <BellOff size={14} />
                  <span>Alarm\u0131 Kald\u0131r</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
