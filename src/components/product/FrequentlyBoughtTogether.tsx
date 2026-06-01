import React from 'react';
import { Product } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

interface FrequentlyBoughtTogetherProps {
  product: Product;
  boughtTogether: Product[];
}

export function FrequentlyBoughtTogether({ product, boughtTogether }: FrequentlyBoughtTogetherProps) {
  const { t } = useLanguage();

  if (!boughtTogether.length) return null;

  const totalPrice = product.price + boughtTogether.reduce((acc, curr) => acc + curr.price, 0);

  return (
    <div className="py-8 border-t border-gray-100">
      <h3 className="text-sm font-black text-brand-primary uppercase tracking-wider mb-6 pb-3 border-b border-gray-100">
        {t('product.bought_together')}
      </h3>
      <div className="flex flex-col xl:flex-row items-center gap-8">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="w-24 h-24 md:w-32 md:h-32 p-2 border border-brand-primary/5 rounded-2xl bg-white shrink-0">
            <img
              src={product.images[0]}
              className="w-full h-full object-contain mix-blend-multiply"
              alt={product.title}
              loading="lazy"
            />
          </div>
          <span className="text-xl md:text-2xl font-black text-brand-primary/20">+</span>
          {boughtTogether.map((p, i) => (
            <React.Fragment key={p.id}>
              <div className="w-24 h-24 md:w-32 md:h-32 p-2 border border-brand-primary/5 rounded-2xl bg-white shrink-0 group relative cursor-pointer">
                <img
                  src={p.images[0]}
                  className="w-full h-full object-contain mix-blend-multiply"
                  alt={p.title}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-accent/90 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white text-[9px] md:text-[10px] font-black uppercase text-center p-2">
                  {p.title}
                </div>
              </div>
              {i < boughtTogether.length - 1 && (
                <span className="text-xl md:text-2xl font-black text-brand-primary/20">+</span>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="w-full xl:w-auto flex-1 xl:border-s xl:border-brand-primary/5 xl:ps-8 text-center xl:text-start">
          <p className="text-[10px] font-black uppercase text-brand-primary/40 tracking-widest mb-1">
            Toplam Fiyat
          </p>
          <p className="text-2xl md:text-3xl font-display font-black text-accent italic">
            £{totalPrice.toFixed(2)}
          </p>
          <button className="mt-4 w-full xl:w-auto px-8 lg:px-12 py-4 lg:py-3 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all">
            Listeyi Sepete Ekle
          </button>
        </div>
      </div>
    </div>
  );
}
