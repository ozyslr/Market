import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Mail, Phone, MapPin, Send, Loader2, CheckCircle2,
  MessageCircle, HelpCircle, ChevronRight,
  Instagram, Twitter, Facebook, Youtube,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/common/SEO';

const contactInfo = [
  { icon: Mail, label: 'E-posta', value: 'destek@benimolan.com', href: 'mailto:destek@benimolan.com' },
  { icon: Phone, label: 'Telefon', value: '+90 (850) 123 45 67', href: 'tel:+908501234567' },
  { icon: MapPin, label: 'Adres', value: 'Levent Mah. Büyükdere Cad. No:123, Şişli / İstanbul' },
];

const socialLinks = [
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: Youtube, label: 'Youtube', href: '#' },
];

const faqQuickLinks = [
  { label: 'Sipariş Takibi', to: '/faq' },
  { label: 'İade Koşulları', to: '/faq' },
  { label: 'Ödeme Yöntemleri', to: '/faq' },
  { label: 'Kargo Bilgisi', to: '/faq' },
];

export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSubmitting(true);
    // Simulate submission
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-brand-secondary dark:bg-brand-secondary transition-colors duration-300">
      <SEO
        title="İletişim"
        description="Benim Olan ile iletişime geçin. Müşteri hizmetleri, destek ve iş birliği için bize ulaşın."
        canonical="/contact"
      />

      {/* Hero */}
      <section className="relative pt-28 pb-16 px-6 overflow-hidden bg-brand-primary text-white">
        <div className="absolute top-0 start-0 w-full h-full opacity-10">
          <div className="absolute top-1/4 start-10 w-96 h-96 bg-accent rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 end-10 w-96 h-96 bg-blue-500 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-[1700px] mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6"
          >
            <div className="px-6 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-3">
              <MessageCircle size={14} className="text-accent" />
              <span className="text-[10px] font-black uppercase tracking-widest">İletişim</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl md:text-7xl font-display font-black tracking-tightest leading-none mb-6 italic uppercase"
          >
            Bize Ulaşın
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto font-medium"
          >
            Sorularınız, önerileriniz veya iş birliği talepleriniz için
            aşağıdaki formu kullanabilirsiniz.
          </motion.p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-6">
        <div className="max-w-[1700px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Contact Info Sidebar */}
            <div className="lg:col-span-2 space-y-8">
              {/* Info Cards */}
              {contactInfo.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-5 p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-brand-primary/5 dark:border-zinc-700 shadow-sm hover:border-accent/30 transition-all"
                >
                  <div className="w-12 h-12 shrink-0 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                    <item.icon size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-white/40 mb-1">
                      {item.label}
                    </p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-sm font-bold text-brand-primary dark:text-white hover:text-accent transition-colors"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm font-bold text-brand-primary dark:text-white">{item.value}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Social Links */}
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-brand-primary/5 dark:border-zinc-700 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-white/40 mb-4">
                  Bizi Takip Edin
                </p>
                <div className="flex gap-3">
                  {socialLinks.map((s, i) => (
                    <a
                      key={i}
                      href={s.href}
                      aria-label={s.label}
                      className="w-10 h-10 bg-brand-secondary dark:bg-zinc-800 rounded-xl flex items-center justify-center text-brand-primary/50 dark:text-white/50 hover:bg-accent hover:text-white transition-all"
                    >
                      <s.icon size={18} />
                    </a>
                  ))}
                </div>
              </div>

              {/* FAQ Quick Links */}
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-brand-primary/5 dark:border-zinc-700 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-white/40 mb-4">
                  Hızlı Yardım
                </p>
                <ul className="space-y-3">
                  {faqQuickLinks.map((link, i) => (
                    <li key={i}>
                      <Link
                        to={link.to}
                        className="flex items-center justify-between text-sm font-bold text-brand-primary dark:text-white hover:text-accent transition-colors group"
                      >
                        <span>{link.label}</span>
                        <ChevronRight size={14} className="text-brand-primary/30 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3 bg-white dark:bg-zinc-900 rounded-[2rem] border border-brand-primary/5 dark:border-zinc-700 shadow-xl p-8 md:p-10"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-8 bg-accent rounded-full" />
                <h2 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
                  Mesaj Gönder
                </h2>
              </div>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} className="text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-display font-black uppercase italic text-brand-primary dark:text-white mb-3">
                    Mesajınız Alındı!
                  </h3>
                  <p className="text-brand-primary/60 dark:text-white/60 font-medium max-w-sm">
                    En kısa sürede size dönüş yapacağız. Teşekkür ederiz.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField label="Adınız *">
                      <input
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                        placeholder="Ad Soyad"
                        className={inputCls}
                        required
                      />
                    </FormField>
                    <FormField label="E-posta *">
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => set('email', e.target.value)}
                        placeholder="ornek@email.com"
                        className={inputCls}
                        required
                      />
                    </FormField>
                  </div>

                  <FormField label="Konu">
                    <input
                      value={form.subject}
                      onChange={e => set('subject', e.target.value)}
                      placeholder="Mesajınızın konusu"
                      className={inputCls}
                    />
                  </FormField>

                  <FormField label="Mesajınız *">
                    <textarea
                      value={form.message}
                      onChange={e => set('message', e.target.value)}
                      placeholder="Mesajınızı buraya yazın..."
                      rows={6}
                      className={`${inputCls} resize-none`}
                      required
                    />
                  </FormField>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-accent/20"
                  >
                    {submitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Gönderiliyor...</>
                    ) : (
                      <><Send size={16} /> Mesajı Gönder</>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

const inputCls =
  'w-full border border-brand-primary/10 dark:border-zinc-700 rounded-xl p-3.5 text-sm font-medium text-brand-primary dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-brand-primary/30 dark:placeholder:text-white/30';

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase text-brand-primary/40 dark:text-white/40 mb-1.5 tracking-widest">
        {label}
      </label>
      {children}
    </div>
  );
}
