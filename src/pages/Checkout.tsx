import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Truck, CreditCard, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useCartStore } from '@/store/useCartStore';
import { calculateTotal, MARKETS } from '@/lib/taxEngine';
import { useCouponStore, calculateDiscount } from '@/store/useCouponStore';
import { Tag } from 'lucide-react';

export function CheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const { items, clearCart } = useCartStore();

  const cartProducts = items.map(item => ({ ...item.product, quantity: item.quantity }));
  const subtotal = cartProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const currentMarket = MARKETS['UK'];
  const totals = calculateTotal(subtotal, 12, currentMarket, true);
  const { getAppliedCoupon } = useCouponStore();
  const appliedCoupon = getAppliedCoupon();
  const discount = calculateDiscount(appliedCoupon, subtotal, totals.shipping);
  const total = Math.max(0, totals.total - discount);

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep(3); // Success step
      clearCart();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F8FA] pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/cart')} className="p-2 border border-[#1A1033]/10 rounded-xl hover:bg-[#1A1033]/5 transition-colors">
            <ChevronRight size={20} className="rotate-180 text-[#1A1033]" />
          </button>
          <h1 className="text-4xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">{t('checkout.title')}</h1>
        </div>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-12 relative before:absolute before:top-1/2 before:-translate-y-1/2 before:left-0 before:w-full before:h-1 before:bg-[#1A1033]/5 before:-z-10">
          {[
            { num: 1, label: t('checkout.delivery') },
            { num: 2, label: t('checkout.payment') },
            { num: 3, label: t('checkout.confirmation') }
          ].map(s => (
            <div key={s.num} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all ${step >= s.num ? 'bg-accent text-white shadow-lg' : 'bg-white text-[#1A1033]/30 border border-[#1A1033]/5'}`}>
                 {step > s.num ? <CheckCircle2 size={20} /> : s.num}
              </div>
              <span className={`text-[10px] uppercase font-black tracking-widest ${step >= s.num ? 'text-[#1A1033]' : 'text-[#1A1033]/30'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[2.5rem] p-8 border border-[#F8F8FA] shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                    <Truck size={24} />
                  </div>
                  <h2 className="text-2xl font-display font-black uppercase tracking-tight text-[#1A1033]">{t('checkout.shipping_address')}</h2>
                </div>
                <form className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">{t('checkout.first_name')}</label>
                      <input type="text" className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" defaultValue={user?.name?.split(' ')[0] || ''} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">{t('checkout.last_name')}</label>
                      <input type="text" className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" defaultValue={user?.name?.split(' ')[1] || ''} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">{t('checkout.street_address')}</label>
                    <input type="text" placeholder="123 Node Ave" className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">{t('checkout.city')}</label>
                      <input type="text" className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">{t('checkout.zip_code')}</label>
                      <input type="text" className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
                    </div>
                  </div>
                  <button type="button" onClick={() => setStep(2)} className="w-full py-4 bg-[#1A1033] text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 mt-8">
                    {t('checkout.continue_payment')} <ChevronRight size={18} />
                  </button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[2.5rem] p-8 border border-[#F8F8FA] shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                    <CreditCard size={24} />
                  </div>
                  <h2 className="text-2xl font-display font-black uppercase tracking-tight text-[#1A1033]">{t('checkout.secure_payment')}</h2>
                </div>
                <div className="bg-[#F8F8FA] p-6 rounded-2xl mb-8 border border-[#1A1033]/5 relative overflow-hidden">
                   <ShieldCheck className="absolute -right-4 -bottom-4 text-accent/5 size-32" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-2">{t('checkout.escrow_protection')}</p>
                   <p className="text-sm font-medium text-[#1A1033]/60 relative z-10">{t('checkout.escrow_desc')}</p>
                </div>
                <form className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">{t('checkout.cardholder_name')}</label>
                    <input type="text" className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">{t('checkout.card_number')}</label>
                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">{t('checkout.expiry_date')}</label>
                      <input type="text" placeholder="MM/YY" className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">{t('checkout.cvc')}</label>
                      <input type="text" placeholder="123" className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-8">
                    <button type="button" onClick={() => setStep(1)} className="px-6 py-4 bg-[#F8F8FA] text-[#1A1033] rounded-2xl font-black uppercase text-[11px] hover:bg-[#1A1033]/5 transition-all">
                      {t('checkout.back')}
                    </button>
                    <button type="button" onClick={handlePayment} disabled={isProcessing} className="flex-1 py-4 bg-accent text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {isProcessing ? t('checkout.verifying') : t('checkout.pay_securely').replace('{total}', `$${total.toFixed(2)}`)}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] p-12 text-center border border-[#F8F8FA] shadow-sm flex flex-col items-center">
                <div className="w-24 h-24 bg-green-500 rounded-[2.5rem] flex items-center justify-center text-white mb-8 shadow-xl shadow-green-500/20">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-4xl font-display font-black uppercase italic tracking-tighter text-[#1A1033] mb-4">{t('checkout.success_title')}</h2>
                <p className="text-sm font-medium text-[#1A1033]/60 mb-8 max-w-md">{t('checkout.success_desc')}</p>
                <button onClick={() => navigate('/profile')} className="px-8 py-4 bg-[#1A1033] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 transition-all">
                  {t('checkout.view_orders')}
                </button>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2.5rem] p-8 border border-[#F8F8FA] shadow-sm sticky top-32">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1033] mb-6">{t('checkout.order_summary')}</h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[#1A1033]/40 font-bold">{t('cart.subtotal')}</span>
                  <span className="font-black text-[#1A1033]">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#1A1033]/40 font-bold">{t('checkout.logistics')}</span>
                  <span className="font-black text-[#1A1033]">${totals.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#1A1033]/40 font-bold">{t('checkout.taxes')}</span>
                  <span className="font-black text-[#1A1033]">${totals.vat.toFixed(2)}</span>
                </div>
                {appliedCoupon && discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-bold flex items-center gap-1.5">
                      <Tag size={14} /> {appliedCoupon.code}
                    </span>
                    <span className="font-black text-green-600">-${discount.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="pt-6 border-t border-[#1A1033]/5 flex justify-between items-center mb-8">
                <span className="text-xs font-black uppercase tracking-widest text-[#1A1033]">{t('checkout.total')}</span>
                <span className="text-2xl font-display font-black text-accent">${total.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center gap-3 bg-[#F8F8FA] p-4 rounded-xl">
                <ShieldCheck className="text-[#1A1033]/30" size={20} />
                <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 leading-relaxed">
                  {t('checkout.encryption_notice')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
