import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, Star } from 'lucide-react';

interface OtherSeller {
  sellerId: string;
  sellerName: string;
  price: number;
  rating: number;
  currency: string;
}

interface OtherSellersProps {
  sellers: OtherSeller[];
  onAddToCart?: (sellerId: string) => void;
}

export function OtherSellers({ sellers, onAddToCart }: OtherSellersProps) {
  const [expanded, setExpanded] = useState(false);

  if (sellers.length === 0) return null;

  const visible = expanded ? sellers : sellers.slice(0, 2);

  return (
    <div className="bg-white rounded-2xl border border-brand-primary/5 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-brand-secondary/30 transition-colors"
      >
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40 text-left">Diğer Satıcılar</p>
          <p className="text-xs font-bold text-brand-primary mt-0.5">{sellers.length} satıcı</p>
        </div>
        {expanded ? <ChevronUp size={16} className="text-brand-primary/40" /> : <ChevronDown size={16} className="text-brand-primary/40" />}
      </button>

      {expanded && (
        <div className="divide-y divide-brand-primary/5">
          {visible.map(seller => (
            <div key={seller.sellerId} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-brand-primary truncate">{seller.sellerName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star size={10} fill="#FBBF24" className="text-yellow-400" />
                  <span className="text-[10px] text-brand-primary/50">{seller.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-brand-primary">
                  {seller.currency === 'gbp' ? '£' : '₺'}{seller.price.toFixed(2)}
                </p>
                {onAddToCart && (
                  <button
                    onClick={() => onAddToCart(seller.sellerId)}
                    className="mt-1 flex items-center gap-1 px-2 py-1 bg-accent text-white text-[9px] font-black rounded-lg hover:bg-brand-primary transition-colors"
                  >
                    <ShoppingCart size={10} /> Sepete Ekle
                  </button>
                )}
              </div>
            </div>
          ))}
          {sellers.length > 2 && (
            <button
              onClick={() => setExpanded(false)}
              className="w-full py-2 text-[10px] font-black text-accent hover:underline"
            >
              Daha az göster
            </button>
          )}
        </div>
      )}
    </div>
  );
}
