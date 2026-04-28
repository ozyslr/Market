import React, { useState } from 'react';
import { Star, Truck, ShieldCheck, ChevronRight, ShoppingCart, Globe, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { cn } from '@/lib/utils';
import { calculateTotal, MARKETS } from '@/lib/taxEngine';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const currentMarket = MARKETS['UK']; // Default for demo
  const tax = calculateTotal(product.price, 12, currentMarket, product.originCountry === 'UK');

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-white rounded-3xl overflow-hidden border border-brand-primary/5 hover:border-accent/40 transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-accent/10 hover:-translate-y-2 flex flex-col h-full"
    >
      {/* Image Section */}
      <Link to={`/product/${product.slug}`} className="relative aspect-square overflow-hidden bg-brand-secondary/30">
        <img 
          src={product.images[0]} 
          alt={product.title}
          className={cn(
            "w-full h-full object-cover transition-transform duration-700",
            isHovered ? "scale-110" : "scale-100"
          )}
          referrerPolicy="no-referrer"
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.oldPrice && (
            <span className="px-3 py-1 bg-accent text-white text-[10px] font-bold uppercase rounded-full shadow-lg">
              -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% Save
            </span>
          )}
          <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-brand-primary text-[10px] font-bold uppercase rounded-full shadow-sm border border-brand-primary/10 flex items-center gap-1">
            <Globe size={10} className="text-accent" />
            {product.originCountry}
          </span>
        </div>

        {/* Demand Index Badge (Commercial Intelligence) */}
        <div className="absolute top-4 right-4 group-hover/card:scale-110 transition-transform">
           <div className="bg-brand-primary/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-2">
              <TrendingUp size={12} className="text-green-500" />
              <div className="flex flex-col leading-none">
                 <span className="text-[8px] font-black text-white/40 uppercase tracking-tighter">Demand</span>
                 <span className="text-[10px] font-black text-white uppercase tabular-nums">High</span>
              </div>
           </div>
        </div>

        {/* Quick Add Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-4 right-4 flex gap-2"
            >
              <button className="flex-1 py-3 bg-accent text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors shadow-lg shadow-accent/30">
                <ShoppingCart size={14} /> Sepete Ekle
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      {/* Info Section */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary/40">{product.brand}</span>
          <div className="flex items-center gap-1 text-xs font-bold text-accent">
            <Star size={12} fill="currentColor" /> {product.rating}
          </div>
        </div>
        
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-display font-bold text-lg leading-tight mb-4 group-hover:text-accent transition-colors line-clamp-2">
            {product.title}
          </h3>
        </Link>

        <div className="mt-auto pt-4 border-t border-brand-primary/5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] text-brand-primary/40 uppercase font-bold mb-1">Local Price + Tax</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-display font-bold">£{product.price.toFixed(2)}</span>
                {product.oldPrice && <span className="text-xs text-brand-primary/30 line-through">£{product.oldPrice.toFixed(2)}</span>}
              </div>
              <p className="text-[10px] text-brand-primary/40 font-bold uppercase mt-1 flex items-center gap-1">
                VAT Incl: <span className="text-brand-primary">£{(product.price + tax.vat).toFixed(2)}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold uppercase">
                <Truck size={12} /> {product.estimatedDeliveryDays || '3-5'}-day delivery
              </div>
              <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold uppercase">
                <ShieldCheck size={12} /> Escrow
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
