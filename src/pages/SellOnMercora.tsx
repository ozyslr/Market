import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap, Globe, ShieldCheck, TrendingUp, ArrowRight,
  DollarSign, X, CheckCircle, Loader2, Store,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface ApplyForm {
  storeName: string;
  contactName: string;
  phone: string;
  businessType: 'individual' | 'company';
  category: string;
  website: string;
  description: string;
}

export function SellOnMercora() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<ApplyForm>({
    storeName: '', contactName: '', phone: '',
    businessType: 'individual', category: '', website: '', description: '',
  });

  const set = (k: keyof ApplyForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleApply() {
    if (!user?.id) { navigate('/'); return; }
    if (!form.storeName.trim()) return;
    setSubmitting(true);
    try {
      const existing = await getDoc(doc(db, 'sellers', user.id));
      if (existing.exists() && existing.data().kycStatus === 'verified') {
        navigate('/seller/dashboard');
        return;
      }
      await setDoc(doc(db, 'sellers', user.id), {
        userId: user.id,
        storeName: form.storeName.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
        businessType: form.businessType,
        category: form.category.trim(),
        website: form.website.trim(),
        description: form.description.trim(),
        kycStatus: 'pending',
        isVerified: false,
        slug: form.storeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        rating: 0, reviewsCount: 0, followersCount: 0,
        commissionRate: 10,
        origin: user.country || 'TR',
        joinedDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-brand-primary text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-1/4 left-10 w-96 h-96 bg-accent rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-blue-500 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <div className="px-6 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-3">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Benim Olan Satıcı Platformu 2026</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-8xl font-display font-black tracking-tightest leading-none mb-10 italic uppercase"
          >
            Ürünlerinizi <br />
            <span className="text-accent underline decoration-4 underline-offset-8">Dünyaya Satın</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/60 max-w-2xl mx-auto mb-12 font-medium"
          >
            450+ seçkin satıcıya katılın. Benim Olan'ın AI destekli altyapısıyla ürünlerinizi global pazara taşıyın.
          </motion.p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button
              onClick={() => user ? setShowForm(true) : navigate('/')}
              className="px-10 py-5 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-accent/40 hover:scale-105 transition-all flex items-center gap-3"
            >
              Satıcı Başvurusu Yap <ArrowRight size={18} />
            </button>
            <button className="px-10 py-5 bg-white/10 text-white border border-white/10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all">
              Komisyon Yapısını İncele
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-brand-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { label: 'Satıcı Büyümesi', value: '420%', icon: TrendingUp },
              { label: 'Global Pazar',     value: '14+',  icon: Globe },
              { label: 'KDV Yönetimi',    value: '100%', icon: ShieldCheck },
              { label: 'Ortalama Sipariş', value: '₺640', icon: DollarSign },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-6 bg-white rounded-2xl shadow-xl flex items-center justify-center text-accent group-hover:rotate-12 transition-all">
                  <stat.icon size={24} />
                </div>
                <h3 className="text-4xl font-display font-black text-brand-primary mb-2 italic uppercase">{stat.value}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 leading-none">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <h2 className="text-4xl font-display font-black uppercase italic tracking-tighter mb-4">Satıcı Yol Haritası</h2>
            <p className="text-brand-primary/40 uppercase font-black text-[10px] tracking-[0.3em]">Başvurudan ilk satışa 3 adım</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {[
              {
                step: '01', title: 'Başvuru & Onay',
                desc: 'Satıcı başvurunuzu doldurun. AI destekli KYC ve mağaza doğrulama 24 saat içinde tamamlanır.',
                feat: ['Otomatik KYC', 'Belge Doğrulama', 'Hızlı Aktivasyon'],
              },
              {
                step: '02', title: 'Ürün Yükleme',
                desc: 'XML feed, CSV veya tek tek ürün ekleyebilirsiniz. 14 dile otomatik çeviri ve çoklu döviz desteği.',
                feat: ['AI Açıklamalar', 'Toplu CSV Yükleme', 'Marketplace Sync'],
              },
              {
                step: '03', title: 'Küresel Satış',
                desc: 'Bot Satış Motorumuz, yüksek niyetli alıcılara ürünlerinizi proaktif olarak sunar.',
                feat: ['Algoritmik Teklif', 'Bot Pazarlama', 'Viral SEO'],
              },
            ].map((card, i) => (
              <div key={i} className="p-10 bg-white rounded-[3rem] border border-brand-primary/5 shadow-2xl relative overflow-hidden group">
                <span className="absolute -top-10 -right-10 text-[10rem] font-display font-black text-brand-primary/5 group-hover:text-accent/10 transition-colors">{card.step}</span>
                <div className="relative z-10">
                  <h3 className="text-2xl font-display font-black uppercase mb-6 italic tracking-tighter">{card.title}</h3>
                  <p className="text-sm text-brand-primary/60 font-medium mb-10 leading-relaxed">{card.desc}</p>
                  <ul className="space-y-4">
                    {card.feat.map((f, j) => (
                      <li key={j} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-brand-primary">
                        <Zap size={14} className="text-accent" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-brand-primary rounded-[4rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-accent/20 blur-[100px] opacity-30" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-display font-black text-white italic uppercase tracking-tighter mb-8 leading-none">
              Elite Marketplace'e <br />
              <span className="text-accent underline decoration-4 underline-offset-8 decoration-accent/50">Hazır mısınız?</span>
            </h2>
            <p className="text-white/60 mb-12 max-w-xl mx-auto font-medium">
              Lansman fazı için %0 komisyonla sınırlı satıcı kontenjanı mevcuttur.
            </p>
            <button
              onClick={() => user ? setShowForm(true) : navigate('/')}
              className="px-12 py-5 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-accent/40 hover:scale-105 transition-all"
            >
              Hemen Başvur
            </button>
          </div>
        </div>
      </section>

      {/* Application Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden"
            >
              {submitted ? (
                <div className="p-10 text-center">
                  <CheckCircle size={52} className="mx-auto text-emerald-500 mb-4" />
                  <h3 className="text-2xl font-display font-black uppercase italic text-brand-primary mb-3">
                    Başvurunuz Alındı!
                  </h3>
                  <p className="text-brand-primary/60 text-sm mb-6 leading-relaxed">
                    Admin ekibimiz başvurunuzu inceleyecek.<br />
                    Onay sonrası satıcı panelinize erişebilirsiniz.
                  </p>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-8 py-3 bg-brand-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-primary/90 transition-colors"
                  >
                    Tamam
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-[#F8F8FA]">
                    <div className="flex items-center gap-3">
                      <Store size={20} className="text-accent" />
                      <h3 className="text-lg font-display font-black uppercase italic text-brand-primary">
                        Satıcı Başvurusu
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowForm(false)}
                      className="text-brand-primary/30 hover:text-brand-primary transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="px-8 py-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <FormField label="Mağaza Adı *" placeholder="Mağazanızın adı">
                      <input
                        value={form.storeName}
                        onChange={e => set('storeName', e.target.value)}
                        placeholder="Mağazanızın adı"
                        className={inputCls}
                      />
                    </FormField>

                    <FormField label="Yetkili Adı" placeholder="">
                      <input
                        value={form.contactName}
                        onChange={e => set('contactName', e.target.value)}
                        placeholder="Ad Soyad"
                        className={inputCls}
                      />
                    </FormField>

                    <FormField label="Telefon" placeholder="">
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => set('phone', e.target.value)}
                        placeholder="+90 5XX XXX XX XX"
                        className={inputCls}
                      />
                    </FormField>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-brand-primary/40 mb-2">İşletme Türü</label>
                      <div className="flex gap-4">
                        {([['individual', 'Bireysel'], ['company', 'Şirket']] as const).map(([val, lbl]) => (
                          <label key={val} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              value={val}
                              checked={form.businessType === val}
                              onChange={() => set('businessType', val)}
                              className="accent-accent"
                            />
                            <span className="text-sm font-bold text-brand-primary">{lbl}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <FormField label="Ürün Kategorisi" placeholder="">
                      <input
                        value={form.category}
                        onChange={e => set('category', e.target.value)}
                        placeholder="Elektronik, Giyim, Ev & Yaşam..."
                        className={inputCls}
                      />
                    </FormField>

                    <FormField label="Mağaza Açıklaması" placeholder="">
                      <textarea
                        value={form.description}
                        onChange={e => set('description', e.target.value)}
                        placeholder="Sattığınız ürünler ve mağazanız hakkında kısaca..."
                        rows={3}
                        className={`${inputCls} resize-none`}
                      />
                    </FormField>

                    <FormField label="Website (İsteğe bağlı)" placeholder="">
                      <input
                        value={form.website}
                        onChange={e => set('website', e.target.value)}
                        placeholder="https://..."
                        className={inputCls}
                      />
                    </FormField>
                  </div>

                  <div className="px-8 pb-8 pt-4 border-t border-[#F8F8FA]">
                    <button
                      onClick={handleApply}
                      disabled={submitting || !form.storeName.trim()}
                      className="w-full py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? <><Loader2 size={14} className="animate-spin" /> Gönderiliyor...</> : 'Başvuruyu Gönder'}
                    </button>
                    <p className="text-center text-[10px] text-brand-primary/30 mt-3 font-medium">
                      Admin onayı sonrası satıcı panelinize erişim sağlanır.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls = 'w-full border border-[#F8F8FA] rounded-xl p-3 text-sm focus:outline-none focus:border-accent bg-white';

function FormField({ label, children }: { label: string; placeholder: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase text-brand-primary/40 mb-1">{label}</label>
      {children}
    </div>
  );
}
