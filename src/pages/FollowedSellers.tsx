import React, { useState, useEffect } from 'react';
import { Store, Star, MapPin, UserPlus, Package, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useFollows } from '@/context/FollowsContext';
import { useLanguage } from '@/context/LanguageContext';
import { getProducts } from '@/services/productService';
import type { Seller, Product } from '@/types';

// ─── Skeleton ──────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-brand-primary/5 p-6 space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            <div className="aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            <div className="aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function hasNewProducts(products: Product[]): number {
  const cutoff = Date.now() - SEVEN_DAYS_MS;
  return products.filter((p) => {
    const createdAt = (p as any).createdAt;
    if (!createdAt) return false;
    const ts =
      typeof createdAt === 'string'
        ? new Date(createdAt).getTime()
        : (createdAt.toDate?.()?.getTime() ?? new Date(createdAt).getTime());
    return ts >= cutoff;
  }).length;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function FollowedSellers() {
  const { firebaseUser, user } = useAuth();
  const { followedSellers, toggleFollow, loading: followCtxLoading } = useFollows();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [sellers, setSellers] = useState<(Seller & { products?: Product[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch seller profiles + products
  useEffect(() => {
    if (!firebaseUser) {
      setLoading(false);
      setSellers([]);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const ids = followedSellers;
        if (ids.length === 0) {
          setSellers([]);
          setLoading(false);
          return;
        }

        // Fetch seller docs in parallel
        const snapshots = await Promise.all(
          ids.map((id) => getDoc(doc(db, 'sellers', id)).then((snap) => ({ id, snap }))),
        );

        const results: (Seller & { products?: Product[] })[] = [];

        for (const { id, snap } of snapshots) {
          if (!snap.exists()) continue;

          // Spread seller data into a properly typed object
          const sellerData = snap.data() ?? {};
          const products = await getProducts({ sellerId: id, limit: 3 });
          const seller: Seller & { products?: Product[] } = {
            ...sellerData,
            id,
            products,
          } as Seller & { products?: Product[] };

          results.push(seller);
        }

        if (!cancelled) setSellers(results);
      } catch (err) {
        console.error('Error loading followed sellers:', err);
        if (!cancelled) setError('Satıcılar yüklenirken bir hata oluştu.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser, followedSellers]);

  // ─── States ────────────────────────────────────────────────────────────────

  // Not logged in
  if (!firebaseUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Store className="w-20 h-20 text-zinc-200 dark:text-zinc-700 mb-6" />
          <h2 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white mb-3">
            Takip Ettiğim Satıcılar
          </h2>
          <p className="text-brand-primary/40 dark:text-white/40 font-bold mb-8 max-w-md">
            Takip ettiğiniz satıcıları görüntülemek için giriş yapın.
          </p>
          <button
            onClick={() => navigate('/?login=1')}
            className="px-8 py-3 bg-accent text-white rounded-xl font-black text-sm hover:scale-105 transition-transform shadow-lg"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (loading || followCtxLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Store className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
            Takip Ettiğim Satıcılar
          </h1>
        </div>
        <CardSkeleton />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-500 font-bold mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-accent text-white rounded-xl font-black text-xs hover:scale-105 transition-transform"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (sellers.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Store className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
            Takip Ettiğim Satıcılar
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Store className="w-16 h-16 text-brand-primary/10 dark:text-white/10 mb-4" />
          <p className="text-brand-primary/40 dark:text-white/40 font-bold mb-6">
            Henüz bir satıcı takip etmiyorsunuz
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-white rounded-xl font-black text-sm hover:scale-105 transition-transform shadow-lg"
          >
            <ShoppingCart size={18} />
            <span>Keşfet</span>
          </Link>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Store className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
          Takip Ettiğim Satıcılar
        </h1>
        <span className="ms-2 px-2.5 py-0.5 bg-accent/10 text-accent rounded-full text-xs font-black">
          {sellers.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sellers.map((seller) => {
          const newCount = seller.products ? hasNewProducts(seller.products) : 0;

          return (
            <div
              key={seller.id}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-brand-primary/5 p-6 hover:shadow-lg transition-shadow relative group/card"
            >
              {/* New products badge */}
              {newCount > 0 && (
                <div className="absolute -top-2 -end-2 z-10 flex items-center gap-1 bg-accent text-white px-3 py-1.5 rounded-full shadow-lg text-[10px] font-black uppercase tracking-wider">
                  <Package size={12} />
                  <span>{newCount} Yeni</span>
                </div>
              )}

              {/* Clickable entire card */}
              <Link
                to={`/seller/${seller.id}`}
                className="block"
                onClick={(e) => {
                  // Don't navigate if clicking the unfollow button
                  if ((e.target as HTMLElement).closest('[data-unfollow]')) {
                    e.preventDefault();
                  }
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                  {/* Logo */}
                  {seller.logoUrl ? (
                    <img
                      src={seller.logoUrl}
                      alt={seller.storeName}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-tr from-brand-primary to-accent rounded-2xl flex items-center justify-center text-white shrink-0">
                      <Store size={24} />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-brand-primary dark:text-white truncate">
                      {seller.storeName}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-primary/60 dark:text-white/60">
                        <Star size={10} className="text-yellow-400 fill-yellow-400" />
                        {seller.rating ?? '—'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-primary/60 dark:text-white/60">
                        <MapPin size={10} className="text-accent" />
                        {seller.origin || '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-white/40 mt-0.5">
                      <UserPlus size={10} />
                      <span>{(seller.followersCount ?? 0).toLocaleString('tr-TR')} takipçi</span>
                    </div>
                  </div>
                </div>

                {/* Product thumbnails */}
                {seller.products && seller.products.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {seller.products.slice(0, 3).map((product) => (
                      <div
                        key={product.id}
                        className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden"
                      >
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-600">
                            <Package size={16} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty products placeholder */}
                {(!seller.products || seller.products.length === 0) && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="aspect-square bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex items-center justify-center text-zinc-200 dark:text-zinc-700"
                      >
                        <Package size={16} />
                      </div>
                    ))}
                  </div>
                )}
              </Link>

              {/* Unfollow button */}
              <button
                data-unfollow
                onClick={async () => {
                  await toggleFollow(seller.id);
                  // Remove from local state immediately
                  setSellers((prev) => prev.filter((s) => s.id !== seller.id));
                }}
                className="w-full py-2.5 mt-2 rounded-xl border border-brand-primary/10 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-brand-primary/60 dark:text-white/60 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 transition-all"
              >
                Takibi Bırak
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
