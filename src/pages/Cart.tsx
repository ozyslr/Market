import React, { useState } from 'react';
import {
  Trash2, Plus, Minus, ShieldCheck, Truck,
  HelpCircle, ChevronRight, Heart, Sparkles,
  ArrowRight, Globe, Lock, Info, ShoppingBag, Tag, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { MOCK_PRODUCTS } from '@/mockData';
import { cn } from '@/lib/utils';
import { calculateTotal, MARKETS } from '@/lib/taxEngine';
import { useLanguage } from '@/context/LanguageContext';
import { useCartStore } from '@/store/useCartStore';
import { useCouponStore, calculateDiscount } from '@/store/useCouponStore';

export function CartPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const { items, updateQuantity, removeItem } = useCartStore();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const cartProducts = items.map(item => {
    return { ...item.product, quantity: item.quantity };
  });

  const subtotal = cartProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const currentMarket = MARKETS['UK'];
  const totals = calculateTotal(subtotal, 12, currentMarket, true);

  // Coupon
  const { appliedCode, error: couponError, applyCoupon, removeCoupon, getAppliedCoupon } = useCouponStore();
  const [couponInput, setCouponInput] = useState('');
  const appliedCoupon = getAppliedCoupon();
  const discount = calculateDiscount(appliedCoupon, subtotal, totals.shipping);
  const finalTotal = Math.max(0, totals.total - discount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (applyCoupon(couponInput, subtotal)) {
      setCouponInput('');
    }
  };

  return (
    <div className="min-h-screen bg-brand-secondary/30 pb-20 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Main Cart Section */}
          <div className="flex-1 space-y-6 lg:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 lg:mb-8">
              <h1 className="text-3xl lg:text-4xl font-display font-black tracking-tighter text-brand-primary uppercase italic leading-none">{t('cart.title')}</h1>
              <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-white rounded-full border border-brand-primary/5 shadow-sm w-fit">
                {items.length} {t('cart.items_in_bay')}
              </span>
            </div>

            {/* Items List */}
            <div className="space-y-6">
              <AnimatePresence>
                {cartProducts.map((product) => (
                  <motion.div 
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-brand-primary/5 shadow-sm group hover:border-accent/40 transition-all flex flex-col md:flex-row gap-8 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-2 h-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Image Area */}
                    <Link to={`/product/${product.slug}`} className="w-full md:w-48 aspect-square bg-brand-secondary/50 rounded-2xl p-4 overflow-hidden shrink-0">
                       <img 
                        src={product.images[0]} 
                        alt={product.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" 
                      />
                    </Link>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30">{product.brand}</span>
                          <button 
                            onClick={() => removeItem(product.id)}
                            className="text-brand-primary/20 hover:text-red-500 transition-colors p-2"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                        <h3 className="text-xl font-bold text-brand-primary mb-2 line-clamp-1 group-hover:text-accent transition-colors">{product.title}</h3>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
                          <span className="flex items-center gap-1"><Truck size={12} /> {t('cart.global_fulfillment')}</span>
                          <span className="flex items-center gap-1"><Globe size={12} /> {t('cart.origin')}: {product.originCountry}</span>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-end md:items-center justify-between mt-8 gap-6">
                        <div className="flex items-center bg-brand-secondary/50 rounded-2xl p-1 border border-brand-primary/5">
                          <button 
                            onClick={() => updateQuantity(product.id, product.quantity - 1)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all text-brand-primary/40 hover:text-brand-primary"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-12 text-center font-black text-sm">{product.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(product.id, product.quantity + 1)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all text-brand-primary/40 hover:text-brand-primary"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/20 mb-1">{t('cart.unit_price')}: £{product.price}</p>
                          <p className="text-2xl font-display font-black text-brand-primary">£{(product.price * product.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {items.length === 0 && (
                <div className="bg-white rounded-[3rem] p-24 text-center border border-dashed border-brand-primary/20">
                   <div className="w-20 h-20 bg-brand-secondary rounded-full flex items-center justify-center mx-auto mb-8">
                      <ShoppingBag size={40} className="text-brand-primary/10" />
                   </div>
                   <h2 className="text-2xl font-black text-brand-primary mb-4 uppercase">{t('cart.empty')}</h2>
                   <Link to="/" className="px-8 py-3 bg-brand-primary text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-accent transition-all">{t('cart.start_archiving')}</Link>
                </div>
              )}
            </div>

            {/* AI Cross Sell Segment */}
            <div className="bg-brand-primary rounded-[3.5rem] p-10 text-white relative overflow-hidden">
               <Sparkles size={300} className="absolute -bottom-20 -right-20 text-white/5 pointer-events-none" />
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-8">
                   <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                     <Sparkles size={20} className="text-white fill-white" />
                   </div>
                   <h3 className="text-xl font-black uppercase tracking-widest italic">Navigator Upsells</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {MOCK_PRODUCTS.slice(4, 6).map(product => (
                      <div key={product.id} className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex gap-6 items-center group cursor-pointer hover:bg-white/20 transition-all">
                        <div className="w-20 h-20 bg-white/10 rounded-xl overflow-hidden p-2 shrink-0">
                          <img src={product.images[0]} referrerPolicy="no-referrer" className="w-full h-full object-contain brightness-110" alt="" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{product.brand}</p>
                          <h4 className="font-bold text-sm line-clamp-1 mb-2">{product.title}</h4>
                          <button className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-1 group-hover:gap-2 transition-all">{t('product.add_cart')} <ArrowRight size={10} /></button>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          </div>

          {/* Checkout Strategy Sidebar */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="sticky top-32 space-y-6">
              <div className="bg-white rounded-[3rem] p-10 border border-brand-primary/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -translate-y-4 translate-x-4 blur-xl" />
                
                <h3 className="text-xl font-black uppercase tracking-widest mb-10 pb-6 border-b border-brand-primary/5">{t('cart.artifact_summary')}</h3>
                
                <div className="space-y-6 mb-10">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest">{t('cart.subtotal')}</span>
                    <span className="text-sm font-black text-brand-primary">£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 group relative">
                       <span className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest text-nowrap underline decoration-accent/30 underline-offset-4 cursor-help">{t('cart.global_tax')}</span>
                       <Info size={12} className="text-brand-primary/20" />
                    </div>
                    <span className="text-sm font-black text-brand-primary">£{totals.vat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest">{t('cart.customs_duties')}</span>
                    <div className="flex items-center gap-1">
                      <ShieldCheck size={14} className="text-green-500" />
                      <span className="text-sm font-black text-green-500">{t('cart.included')}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest">{t('cart.shipping_factor')}</span>
                    <span className="text-sm font-black text-brand-primary">£{totals.shipping.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-green-600 uppercase tracking-widest flex items-center gap-1">
                        <Tag size={12} /> İndirim ({appliedCoupon?.code})
                      </span>
                      <span className="text-sm font-black text-green-600">-£{discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Coupon Box */}
                <div className="mb-10">
                  {appliedCoupon && discount > 0 ? (
                    <div className="flex items-center justify-between gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <Tag size={16} className="text-green-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-widest text-green-700">{appliedCoupon.code}</p>
                          <p className="text-[10px] font-bold text-green-600/70 truncate">{appliedCoupon.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="p-1.5 text-green-600/60 hover:text-red-500 transition-colors shrink-0"
                        aria-label="Kuponu kaldır"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary/30" />
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            placeholder="İndirim kodu"
                            className="w-full pl-9 pr-3 py-3 bg-brand-secondary/40 border border-brand-primary/10 rounded-2xl text-xs font-black uppercase tracking-widest text-brand-primary placeholder:text-brand-primary/30 placeholder:normal-case placeholder:tracking-normal placeholder:font-bold focus:border-accent outline-none transition-all"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!couponInput.trim()}
                          className="px-5 py-3 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all disabled:opacity-40"
                        >
                          Uygula
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight px-1">{couponError}</p>
                      )}
                    </form>
                  )}
                </div>

                <div className="pt-8 mb-6 border-t border-brand-primary/5">
                  <div className="flex justify-between items-end">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/20 mb-1">{t('cart.final_investment')}</p>
                       <p className="text-4xl font-display font-black text-brand-primary tracking-tighter">£{finalTotal.toFixed(2)}</p>
                    </div>
                    <div className="text-right text-[10px] font-black uppercase tracking-widest text-accent">
                       {t('cart.free_returns')}
                    </div>
                  </div>
                </div>

                {checkoutError && (
                  <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                    <Info size={16} className="text-red-500 shrink-0" />
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight">{checkoutError}</p>
                  </div>
                )}

                <button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut || items.length === 0}
                  className={cn(
                    "w-full py-6 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-4 group hover:gap-6 active:scale-95",
                    isCheckingOut ? "bg-brand-primary/20 cursor-not-allowed" : "bg-brand-primary hover:bg-accent"
                  )}
                >
                  {isCheckingOut ? (
                    <span className="flex items-center gap-2">
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                       {t('cart.authorizing')}
                    </span>
                  ) : (
                    <>{t('cart.authorize_payment')} <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" /></>
                  )}
                </button>

                <div className="mt-8 pt-8 border-t border-brand-primary/5 grid grid-cols-2 gap-4">
                   <div className="flex flex-col items-center gap-2 text-center p-4 bg-brand-secondary/30 rounded-2xl">
                     <Lock size={16} className="text-brand-primary/40" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-brand-primary/40">{t('cart.secured_bay')}</span>
                   </div>
                   <div className="flex flex-col items-center gap-2 text-center p-4 bg-brand-secondary/30 rounded-2xl">
                     <Globe size={16} className="text-brand-primary/40" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-brand-primary/40">{t('cart.cert_export')}</span>
                   </div>
                </div>
              </div>

              {/* Dynamic Support Teaser */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-brand-primary/5 flex items-center gap-6 group hover:translate-x-2 transition-all cursor-pointer">
                 <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                    <HelpCircle size={24} />
                 </div>
                 <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-brand-primary">{t('cart.priority_support')}</h4>
                    <p className="text-[10px] font-medium text-brand-primary/40 mt-1">{t('cart.support_desc')}</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
