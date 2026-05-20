import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, ShoppingBag, ChevronRight, Zap, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { ProductCard } from '@/components/commerce/ProductCard';
import { Product } from '@/types';
import { RecommendationGroup } from '@/services/recommendationService';
import { cn } from '@/lib/utils';

interface Props {
  groups: RecommendationGroup[];
  loading?: boolean;
}

const SOURCE_ICONS = {
  gemini_ai: Sparkles,
  collaborative: ShoppingBag,
  content_based: TrendingUp,
  trending: Zap,
  category: TrendingUp,
};

const SOURCE_COLORS = {
  gemini_ai: 'text-purple-500 bg-purple-50',
  collaborative: 'text-blue-500 bg-blue-50',
  content_based: 'text-green-500 bg-green-50',
  trending: 'text-orange-500 bg-orange-50',
  category: 'text-[#F9423A] bg-[#F9423A]/10',
};

export function ProductRecommendations({ groups, loading }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-[#F9423A]" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary/30">
            Öneriler hazırlanıyor...
          </p>
        </div>
      </div>
    );
  }

  if (groups.length === 0) return null;

  return (
    <div className="space-y-16">
      {groups.map((group, gi) => {
        const Icon = SOURCE_ICONS[group.source] || Sparkles;
        const colorClass = SOURCE_COLORS[group.source] || SOURCE_COLORS.trending;

        return (
          <motion.section
            key={`${group.source}-${gi}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.1 }}
            className="space-y-8"
          >
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", colorClass)}>
                  <Icon size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-black uppercase italic tracking-tight text-brand-primary">
                    {group.title}
                  </h3>
                  <p className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.2em] mt-1">
                    {group.subtitle}
                  </p>
                </div>
              </div>
              <Link
                to="/search"
                className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/30 hover:text-[#F9423A] transition-colors"
              >
                Tümünü Gör <ChevronRight size={14} />
              </Link>
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6">
              {group.products.slice(0, 6).map((product, pi) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.1 + pi * 0.05 }}
                >
                  <Link to={`/product/${product.slug || product.id}`}>
                    <ProductCard
                      product={{
                        ...product,
                        images: product.images?.length ? product.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
                        slug: product.slug || product.id,
                      }}
                    />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}

// ─── Inline recommendation strip for product detail page ──────────────────

interface StripProps {
  title: string;
  products: Product[];
  source?: RecommendationGroup['source'];
}

export function RecommendationStrip({ title, products, source = 'content_based' }: StripProps) {
  if (products.length === 0) return null;

  const Icon = SOURCE_ICONS[source] || TrendingUp;
  const colorClass = SOURCE_COLORS[source] || SOURCE_COLORS.content_based;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorClass)}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <h3 className="text-lg font-display font-black uppercase tracking-tight text-brand-primary">
          {title}
        </h3>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory no-scrollbar">
        {products.slice(0, 10).map(product => (
          <Link
            key={product.id}
            to={`/product/${product.slug || product.id}`}
            className="snap-start shrink-0 w-[180px]"
          >
            <div className="bg-white rounded-2xl border border-brand-primary/5 overflow-hidden hover:shadow-lg transition-all group">
              <div className="aspect-square bg-zinc-50 overflow-hidden">
                <img
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-3 space-y-1">
                <p className="text-[11px] font-bold text-brand-primary leading-tight line-clamp-2">
                  {product.title}
                </p>
                <p className="text-sm font-black text-[#F9423A]">
                  {product.price.toLocaleString('tr-TR')} ₺
                </p>
                {product.rating && (
                  <p className="text-[9px] font-bold text-amber-500">
                    ★ {product.rating.toFixed(1)}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
