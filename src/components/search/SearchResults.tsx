import React from 'react';
import { Loader2 } from 'lucide-react';
import { ProductCard } from '../commerce/ProductCard';

interface Props {
  hits: any[];
  loading: boolean;
  query: string;
  totalFound: number;
}

export function SearchResults({ hits, loading, query, totalFound }: Props) {
  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  if (totalFound === 0 && query)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-zinc-400 text-lg mb-1">Aramanızla eşleşen ürün bulunamadı</p>
        <p className="text-zinc-600 text-sm">Farklı anahtar kelimeler deneyin.</p>
      </div>
    );
  if (!query && hits.length === 0) return null;
  return (
    <div>
      {query && totalFound > 0 && (
        <p className="text-sm text-zinc-400 mb-4">
          <span className="text-white font-medium">{totalFound}</span> ürün bulundu — &ldquo;{query}
          &rdquo;
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {hits.map((hit: any) => {
          const doc = hit.document || hit;
          return (
            <ProductCard
              key={doc.id}
              product={
                {
                  id: doc.id,
                  title: doc.title,
                  price: doc.price,
                  images: doc.imageUrl ? [doc.imageUrl] : [],
                  storeId: doc.storeId || '',
                  rating: doc.rating || 0,
                } as any
              }
            />
          );
        })}
      </div>
    </div>
  );
}
