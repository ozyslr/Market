import { motion } from 'motion/react';
import {
  Heart,
  ShieldCheck,
  Users,
  Star,
  Package,
  Store,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/common/SEO';

const stats = [
  { value: '450+', label: 'Satıcı', icon: Store },
  { value: '50.000+', label: 'Ürün', icon: Package },
  { value: '100.000+', label: 'Mutlu Müşteri', icon: Users },
  { value: '%98', label: 'Müşteri Memnuniyeti', icon: TrendingUp },
];

const values = [
  {
    title: 'Güven',
    desc: '256-bit SSL şifreleme ve KVKK uyumlu veri politikasıyla alışverişleriniz tamamen güvende.',
    icon: ShieldCheck,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/10',
  },
  {
    title: 'Kalite',
    desc: 'Her ürün özenle seçilir, satıcılarımız titizlikle denetlenir. Orijinal ürün garantisi sunarız.',
    icon: Star,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/10',
  },
  {
    title: 'Topluluk',
    desc: 'Satıcı ve alıcılarımızla güçlü bir ekosistem kuruyor, herkesin kazandığı bir pazar yaratıyoruz.',
    icon: Heart,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/10',
  },
];

const milestones = [
  {
    year: '2024',
    event: "Benim Olan kuruldu ve Türkiye'nin yeni nesil pazar yeri vizyonuyla yola çıktı.",
  },
  {
    year: '2025',
    event: '450+ satıcı, 50.000+ ürün ve AI destekli alışveriş asistanı ile büyümeye devam etti.',
  },
  {
    year: '2026',
    event: 'Global pazara açılış, bot satış motoru ve çoklu dil desteği ile sınırları aşıyoruz.',
  },
];

export function About() {
  return (
    <div className="min-h-screen bg-brand-secondary dark:bg-brand-secondary transition-colors duration-300">
      <SEO
        title="Hakkımızda"
        description="Benim Olan — Türkiye'nin yeni nesil online pazar yeri. Hikayemiz, misyonumuz ve değerlerimiz hakkında bilgi alın."
        canonical="/about"
      />

      {/* Hero */}
      <section className="relative pt-28 pb-20 px-6 overflow-hidden bg-brand-primary text-white">
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
              <Sparkles size={14} className="text-accent" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Benim Olan Hakkında
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl md:text-7xl font-display font-black tracking-tightest leading-none mb-6 italic uppercase"
          >
            Türkiye&apos;nin Yeni Nesil
            <br />
            <span className="text-accent">Online Pazar Yeri</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto mb-10 font-medium"
          >
            Benim Olan&apos;da alışveriş bir deneyimdir. En yeni teknolojiler, güvenilir satıcılar
            ve benzersiz bir müşteri deneyimi ile aradığınız her şey burada.
          </motion.p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 px-6">
        <div className="max-w-[1700px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-accent rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                  Hikayemiz
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white leading-tight">
                Bir Fikirle Başladı
              </h2>
              <p className="text-brand-primary/60 dark:text-white/60 font-medium leading-relaxed">
                Benim Olan, 2024 yılında alışveriş deneyimini tamamen dönüştürme vizyonuyla kuruldu.
                Amacımız, satıcılar ve alıcılar arasında güven, kalite ve hız odaklı bir platform
                oluşturmaktı.
              </p>
              <p className="text-brand-primary/60 dark:text-white/60 font-medium leading-relaxed">
                Bugün, 450&apos;den fazla seçkin satıcımız ve 50.000+ ürünümüzle Türkiye&apos;nin en
                hızlı büyüyen online pazar yerlerinden biriyiz. Yapay zeka destekli altyapımız, bot
                satış motorumuz ve çoklu dil desteğimizle global bir ekosisteme dönüşüyoruz.
              </p>
              <Link
                to="/sell"
                className="inline-flex items-center gap-3 px-8 py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-accent/40 hover:scale-105 transition-all"
              >
                Satıcı Olun <ArrowRight size={16} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 gap-6"
            >
              {milestones.map((m, i) => (
                <div
                  key={i}
                  className="flex gap-6 p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-brand-primary/5 dark:border-zinc-700 shadow-sm hover:border-accent/30 transition-all group"
                >
                  <div className="shrink-0 w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center text-accent font-display font-black text-xl">
                    {m.year}
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-brand-primary/70 dark:text-white/70 leading-relaxed">
                      {m.event}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 bg-white dark:bg-zinc-900">
        <div className="max-w-[1700px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="w-16 h-16 mx-auto mb-5 bg-brand-secondary dark:bg-zinc-800 rounded-2xl shadow-lg flex items-center justify-center text-accent group-hover:rotate-12 transition-all">
                  <stat.icon size={24} />
                </div>
                <h3 className="text-4xl font-display font-black text-brand-primary dark:text-white mb-1 italic uppercase">
                  {stat.value}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-white/40">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 px-6">
        <div className="max-w-[1700px] mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="flex justify-center items-center gap-3 mb-4">
              <div className="w-1.5 h-8 bg-accent rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                Misyonumuz
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white leading-tight mb-6">
              Alışverişi Herkes İçin Erişilebilir Kılmak
            </h2>
            <p className="text-brand-primary/60 dark:text-white/60 font-medium leading-relaxed max-w-2xl mx-auto">
              En yeni teknolojileri kullanarak, satıcıların ürünlerini dünyaya sergilemesini,
              alıcıların ise güvenle ve keyifle alışveriş yapmasını sağlıyoruz.
            </p>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 bg-white dark:bg-zinc-900 rounded-[2rem] border border-brand-primary/5 dark:border-zinc-700 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all group"
              >
                <div
                  className={`w-16 h-16 ${v.bg} rounded-2xl flex items-center justify-center ${v.color} mb-6 group-hover:scale-110 transition-transform`}
                >
                  <v.icon size={28} />
                </div>
                <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white mb-4">
                  {v.title}
                </h3>
                <p className="text-sm text-brand-primary/60 dark:text-white/60 font-medium leading-relaxed">
                  {v.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-brand-primary rounded-[4rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-accent/20 blur-[100px] opacity-30" />
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                <Zap size={28} className="text-accent" />
              </div>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-white italic uppercase tracking-tighter mb-6 leading-none">
              Alışverişe Başlamaya
              <br />
              <span className="text-accent">Hazır mısınız?</span>
            </h2>
            <p className="text-white/60 mb-10 max-w-md mx-auto font-medium">
              Binlerce ürünü keşfedin, fırsatları yakalayın.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/"
                className="px-10 py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-accent/40 hover:scale-105 transition-all flex items-center gap-3"
              >
                Alışverişe Başla <ArrowRight size={16} />
              </Link>
              <Link
                to="/sell"
                className="px-10 py-4 bg-white/10 text-white border border-white/10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all"
              >
                Satıcı Ol
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
