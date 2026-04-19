import React, { useState } from 'react';
import {
  Trash2, Plus, Minus, ShieldCheck, Truck,
  HelpCircle, ChevronRight, Sparkles,
  ArrowRight, Globe, Lock, Info, ShoppingBag,
  Tag, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { MOCK_PRODUCTS } from '@/mockData';
import { cn } from '@/lib/utils';
import { calculateTotal, MARKETS } from '@/lib/taxEngine';
import { useLanguage } from '@/context/LanguageContext';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';

export function CartPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { items, updateQuantity: storeUpdateQty, removeItem: storeRemove, coupon, applyCoupon, removeCoupon, totalPrice } = useCartStore();
  const { addToast } = useUIStore();
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  const handleCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), cart_total: totalPrice() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      applyCoupon({ code: data.code, discount: data.discount, type: data.type, value: data.value })
      addToast(`"${data.code}" kodu uygulandı — £${data.discount.toFixed(2)} indirim!`, 'success')
      setCouponInput('')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Kupon hatası', 'error')
    } finally {
      setCouponLoading(false)
    }
  }

  const updateQuantity = (productId: string, delta: number) => {
    const item = items.find(i => i.productId === productId);
    if (!item) return;
    const next = Math.max(1, item.quantity + delta);
    storeUpdateQty(productId, next);
  };

  const removeItem = (productId: string) => storeRemove(productId);

  const cartProducts = items.map(item => {
    const product = MOCK_PRODUCTS.find(p => p.id === item.productId);
    if (!product) return null;
    return { ...product, quantity: item.quantity };
  }).filter(Boolean) as (typeof MOCK_PRODUCTS[0] & { quantity: number })[];

  const subtotal = cartProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const discountedSubtotal = coupon ? Math.max(0, subtotal - coupon.discount) : subtotal;
  const currentMarket = MARKETS['UK'];
  const totals = calculateTotal(discountedSubtotal, 12, currentMarket, true);

  return (
    <div className="min-h-screen bg-brand-secondary/30 pt-8 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Main Cart Section */}
          <div className="flex-1 space-y-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-display font-black tracking-tighter text-brand-primary uppercase italic">Shopping Global <br /> <span className="text-accent underline decoration-brand-primary decoration-4 underline-offset-4">Artifacts</span></h1>
              <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-white rounded-full border border-brand-primary/5 shadow-sm">
                {items.length} Items in Bay
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
                          <span className="flex items-center gap-1"><Truck size={12} /> Global Fulfillment: London</span>
                          <span className="flex items-center gap-1"><Globe size={12} /> Origin: {product.originCountry}</span>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-end md:items-center justify-between mt-8 gap-6">
                        <div className="flex items-center bg-brand-secondary/50 rounded-2xl p-1 border border-brand-primary/5">
                          <button 
                            onClick={() => updateQuantity(product.id, -1)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all text-brand-primary/40 hover:text-brand-primary"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-12 text-center font-black text-sm">{product.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(product.id, 1)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all text-brand-primary/40 hover:text-brand-primary"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/20 mb-1">Unit Price: £{product.price}</p>
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
                   <h2 className="text-2xl font-black text-brand-primary mb-4 uppercase">Your bay is empty.</h2>
                   <Link to="/" className="px-8 py-3 bg-brand-primary text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-accent transition-all">Start Archiving</Link>
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
                          <button className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-1 group-hover:gap-2 transition-all">Add to Bay <ArrowRight size={10} /></button>
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
                
                <h3 className="text-xl font-black uppercase tracking-widest mb-10 pb-6 border-b border-brand-primary/5">Artifact Summary</h3>
                
                <div className="space-y-6 mb-10">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest">Subtotal</span>
                    <span className="text-sm font-black text-brand-primary">£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 group relative">
                       <span className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest text-nowrap underline decoration-accent/30 underline-offset-4 cursor-help">Global Tax (VAT)</span>
                       <Info size={12} className="text-brand-primary/20" />
                    </div>
                    <span className="text-sm font-black text-brand-primary">£{totals.vat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest">Customs & Duties</span>
                    <div className="flex items-center gap-1">
                      <ShieldCheck size={14} className="text-green-500" />
                      <span className="text-sm font-black text-green-500">Included</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest">Shipping Factor</span>
                    <span className="text-sm font-black text-brand-primary">£{totals.shipping.toFixed(2)}</span>
                  </div>
                </div>

                {/* Coupon */}
                <div className="space-y-3 border-t border-brand-primary/5 pt-4 mb-6">
                  {coupon ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2 text-green-700">
                        <Tag size={14} />
                        <span className="text-xs font-black uppercase">{coupon.code}</span>
                        <span className="text-xs font-medium">— £{coupon.discount.toFixed(2)} indirim</span>
                      </div>
                      <button onClick={removeCoupon} className="text-green-500 hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleCoupon()}
                        placeholder="KUPON KODU"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-brand-primary/10 text-xs font-black uppercase tracking-widest outline-none focus:border-accent transition-colors"
                      />
                      <button
                        onClick={handleCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="px-4 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-black disabled:opacity-40 hover:bg-accent transition-colors"
                      >
                        {couponLoading ? '...' : 'Uygula'}
                      </button>
                    </div>
                  )}
                  {coupon && (
                    <div className="flex justify-between text-xs font-bold text-green-700">
                      <span>İndirim</span>
                      <span>-£{coupon.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-brand-primary border-t border-brand-primary/5 pt-3">
                    <span>Genel Toplam</span>
                    <span>£{totals.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-8 mb-10 border-t border-brand-primary/5">
                  <div className="flex justify-between items-end">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/20 mb-1">Final Investment</p>
                       <p className="text-4xl font-display font-black text-brand-primary tracking-tighter">£{totals.total.toFixed(2)}</p>
                    </div>
                    <div className="text-right text-[10px] font-black uppercase tracking-widest text-accent">
                       Free Returns
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => items.length > 0 && navigate('/checkout')}
                  disabled={items.length === 0}
                  className="w-full py-6 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:bg-accent transition-all flex items-center justify-center gap-4 group hover:gap-6 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                  Authorize Payment <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </button>

                <div className="mt-8 pt-8 border-t border-brand-primary/5 grid grid-cols-2 gap-4">
                   <div className="flex flex-col items-center gap-2 text-center p-4 bg-brand-secondary/30 rounded-2xl">
                     <Lock size={16} className="text-brand-primary/40" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-brand-primary/40">Secured Bay</span>
                   </div>
                   <div className="flex flex-col items-center gap-2 text-center p-4 bg-brand-secondary/30 rounded-2xl">
                     <Globe size={16} className="text-brand-primary/40" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-brand-primary/40">Cert. Export</span>
                   </div>
                </div>
              </div>

              {/* Dynamic Support Teaser */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-brand-primary/5 flex items-center gap-6 group hover:translate-x-2 transition-all cursor-pointer">
                 <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                    <HelpCircle size={24} />
                 </div>
                 <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-brand-primary">Merchant Priority Support</h4>
                    <p className="text-[10px] font-medium text-brand-primary/40 mt-1">Chat with a Global logistics specialist.</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
