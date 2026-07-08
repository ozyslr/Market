import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle, Search, ChevronDown, Package,
  Truck, RotateCcw, CreditCard, User, MessageCircle,
} from 'lucide-react';
import { SEO } from '@/components/common/SEO';

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  title: string;
  icon: typeof HelpCircle;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: 'Siparişler',
    icon: Package,
    items: [
      { q: 'Siparişimi nasıl takip edebilirim?', a: 'Siparişlerinizi hesabınıza giriş yaparak "Siparişlerim" bölümünden takip edebilirsiniz. Her sipariş için size özel bir takip numarası e-posta ile gönderilmektedir.' },
      { q: 'Siparişim ne zaman kargoya verilir?', a: 'Siparişleriniz genellikle 1-3 iş günü içinde kargoya teslim edilir. Yoğun dönemlerde bu süre 5 iş gününe kadar uzayabilir.' },
      { q: 'Siparişimi iptal edebilir miyim?', a: 'Siparişiniz kargoya verilmeden önce iptal edebilirsiniz. "Siparişlerim" bölümünden iptal talebi oluşturabilirsiniz. Kargoya verilmiş siparişlerde iptal işlemi mümkün değildir.' },
      { q: 'Siparişim eksik geldi, ne yapmalıyım?', a: 'Eksik ürün teslimatlarında lütfen 24 saat içinde bizimle iletişime geçin. Sipariş numaranızı ve eksik ürün bilgisini destek ekibimize iletmeniz yeterlidir.' },
      { q: 'Siparişim hasarlı geldi, ne yapmalıyım?', a: 'Hasarlı teslimat durumunda, kargo görevlisinin yanında hasar tespit tutanağı doldurmanızı ve fotoğraflamanızı öneririz. Ardından destek ekibimize başvurabilirsiniz.' },
      { q: 'Faturamı nasıl alabilirim?', a: 'E-fatura, siparişiniz tamamlandıktan sonra e-posta adresinize gönderilir. Ayrıca "Siparişlerim" bölümünden faturanızı görüntüleyebilir ve indirebilirsiniz.' },
    ],
  },
  {
    title: 'Kargo ve Teslimat',
    icon: Truck,
    items: [
      { q: 'Kargo ücreti ne kadar?', a: '250 TL ve üzeri siparişlerde kargo ücretsizdir. 250 TL altı siparişlerde kargo ücreti 29,90 TL\'dir. Kampanyalı dönemlerde fiyatlar değişiklik gösterebilir.' },
      { q: 'Teslimat süresi ne kadar?', a: 'Standart teslimat süresi 3-7 iş günüdür. Büyükşehirlerde bu süre genellikle 1-3 iş gününe kadar düşmektedir.' },
      { q: 'Hangi kargo şirketleriyle çalışıyorsunuz?', a: 'Yurt içi gönderimlerde Yurtiçi Kargo, MNG Kargo, Aras Kargo ve Sürat Kargo ile çalışmaktayız. Kargo firması siparişinizin teslimat adresine göre belirlenir.' },
      { q: 'Yurt dışına gönderim yapıyor musunuz?', a: 'Evet, belirli ülkelere yurt dışı gönderim hizmetimiz bulunmaktadır. Yurt dışı gönderim ücretleri ve süreleri için müşteri hizmetlerimizle iletişime geçebilirsiniz.' },
      { q: 'Kargo takip numaramı nasıl alabilirim?', a: 'Siparişiniz kargoya verildiğinde, takip numaranız e-posta ve SMS yoluyla size iletilecektir. Ayrıca "Siparişlerim" sayfasından da takip edebilirsiniz.' },
    ],
  },
  {
    title: 'İade ve Değişim',
    icon: RotateCcw,
    items: [
      { q: 'İade koşullarınız nelerdir?', a: 'Teslimat tarihinden itibaren 14 gün içinde, kullanılmamış ve orijinal ambalajında olan ürünleri iade edebilirsiniz. Kişisel bakım ürünleri, iç giyim ve özel sipariş ürünlerde iade kabul edilmemektedir.' },
      { q: 'Nasıl iade yapabilirim?', a: 'Hesabınızdan "Siparişlerim" bölümüne giderek iade etmek istediğiniz ürünü seçin ve iade talebi oluşturun. Kargo firması ürünü adresinizden teslim alacaktır.' },
      { q: 'İade kargo ücretini kim öder?', a: 'Kusurlu veya yanlış gönderilen ürünlerde iade kargo ücreti tarafımıza aittir. Diğer iadelerde kargo ücreti müşteriye aittir.' },
      { q: 'İadem ne zaman onaylanır?', a: 'İade ettiğiniz ürün depomuza ulaştıktan sonra 3-5 iş günü içinde incelenir ve onaylanır. Onay sonrası paranız iade edilir.' },
      { q: 'Para iadem ne zaman hesabıma yatar?', a: 'İade onaylandıktan sonra kartınıza yapılan iadeler 3-7 iş günü içinde hesabınıza yansır. Havale/EFT iadeleri 1-3 iş günü içinde tamamlanır.' },
      { q: 'Değişim yapabiliyor muyum?', a: 'Değişim talepleriniz için mevcut ürünü iade edip, aynı ürünü yeniden sipariş etmeniz gerekmektedir. Doğrudan değişim hizmetimiz bulunmamaktadır.' },
    ],
  },
  {
    title: 'Ödeme',
    icon: CreditCard,
    items: [
      { q: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?', a: 'Kredi kartı (Visa, Mastercard, Amex, Troy), banka kartı, havale/EFT, kapıda ödeme ve Benim Olan cüzdan bakiyesi ile ödeme yapabilirsiniz.' },
      { q: 'Taksit imkanı var mı?', a: 'Evet, 250 TL ve üzeri alışverişlerde, bankanıza bağlı olarak 2-12 aya varan taksit seçenekleri sunulmaktadır. Taksit sayısı ve faiz oranları bankanıza göre değişiklik gösterebilir.' },
      { q: 'Havale/EFT ile ödeme yapabilir miyim?', a: 'Evet, havale/EFT ile ödeme seçeneğimiz mevcuttur. Havale ile ödemelerde siparişiniz, ödeme hesabımıza ulaştıktan sonra işleme alınır.' },
      { q: 'Ödeme güvenli mi?', a: 'Tüm ödeme işlemleriniz 256-bit SSL sertifikası ile şifrelenmektedir. Kart bilgileriniz sistemimizde saklanmaz, PCI-DSS standartlarına uygun ödeme kuruluşları aracılığıyla işlenir.' },
      { q: 'Kupon/indirim kodu nasıl kullanırım?', a: 'Sepet sayfasında "Kupon Kodu" alanına kodunuzu girip "Uygula" butonuna tıklayabilirsiniz. Her kuponun belirli kullanım koşulları bulunmaktadır.' },
    ],
  },
  {
    title: 'Hesap',
    icon: User,
    items: [
      { q: 'Hesap nasıl oluştururum?', a: 'Sağ üst köşedeki "Giriş Yap" butonuna tıklayın. E-posta adresiniz veya Google hesabınızla hızlıca kayıt olabilirsiniz. Kayıt işlemi sadece birkaç saniye sürer.' },
      { q: 'Şifremi unuttum, ne yapmalıyım?', a: 'Giriş sayfasındaki "Şifremi Unuttum" bağlantısına tıklayın. E-posta adresinize gönderilen bağlantı ile şifrenizi sıfırlayabilirsiniz.' },
      { q: 'Hesap bilgilerimi nasıl güncellerim?', a: 'Profil sayfanızdan adres, telefon ve e-posta bilgilerinizi güncelleyebilirsiniz. Değişiklikler kaydedildikten sonra hemen geçerli olur.' },
      { q: 'Üyeliğimi nasıl silebilirim?', a: 'Hesap silme talebi için müşteri hizmetlerimizle iletişime geçmeniz gerekmektedir. Hesabınız silindikten sonra tüm verileriniz KVKK kapsamında imha edilir.' },
      { q: 'Favori ürünlerime nasıl erişirim?', a: 'Beğendiğiniz ürünleri kalp ikonuna tıklayarak favorilerinize ekleyebilirsiniz. Favori listenize "Favorilerim" sayfasından erişebilirsiniz.' },
    ],
  },
];

export function FAQ() {
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggle = (id: string) => setOpenIndex(prev => (prev === id ? null : id));

  const filtered = useMemo(() => {
    if (!search.trim()) return faqData;
    const q = search.toLowerCase();
    return faqData
      .map(cat => ({
        ...cat,
        items: cat.items.filter(
          item => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q),
        ),
      }))
      .filter(cat => cat.items.length > 0);
  }, [search]);

  const totalQuestions = faqData.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="min-h-screen bg-brand-secondary dark:bg-brand-secondary transition-colors duration-300">
      <SEO
        title="Sıkça Sorulan Sorular - SSS"
        description="Benim Olan hakkında sıkça sorulan sorular. Sipariş, kargo, iade, ödeme ve hesap işlemleriyle ilgili detaylı bilgi alın."
        canonical="/faq"
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
              <HelpCircle size={14} className="text-accent" />
              <span className="text-[10px] font-black uppercase tracking-widest">SSS</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl md:text-7xl font-display font-black tracking-tightest leading-none mb-6 italic uppercase"
          >
            Sıkça Sorulan Sorular
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto font-medium mb-8"
          >
            {totalQuestions} soru ve cevap. Aradığınızı bulamadıysanız bizimle iletişime geçmekten çekinmeyin.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl mx-auto relative"
          >
            <Search size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Sorunuzu yazın..."
              className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 ps-12 pe-6 text-white placeholder:text-white/40 font-medium text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 backdrop-blur-md transition-all"
            />
          </motion.div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle size={48} className="mx-auto text-brand-primary/20 dark:text-white/20 mb-4" />
              <h3 className="text-xl font-display font-black uppercase italic text-brand-primary dark:text-white mb-2">
                Sonuç Bulunamadı
              </h3>
              <p className="text-brand-primary/50 dark:text-white/50 font-medium text-sm">
                Aramanızla eşleşen soru bulunamadı. Lütfen farklı bir arama yapın veya bizimle iletişime geçin.
              </p>
            </div>
          ) : (
            filtered.map((category, catIdx) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: catIdx * 0.05 }}
              >
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                    <category.icon size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
                      {category.title}
                    </h2>
                    <p className="text-xs text-brand-primary/40 dark:text-white/40 font-medium">
                      {category.items.length} soru
                    </p>
                  </div>
                </div>

                {/* Accordion Items */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-brand-primary/5 dark:border-zinc-700 shadow-sm overflow-hidden divide-y divide-brand-primary/5 dark:divide-zinc-700">
                  {category.items.map((item, idx) => {
                    const id = `${catIdx}-${idx}`;
                    const isOpen = openIndex === id;
                    return (
                      <div key={id}>
                        <button
                          onClick={() => toggle(id)}
                          className="w-full flex items-center justify-between gap-4 px-6 py-5 text-start hover:bg-brand-secondary/50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <span className="text-sm font-bold text-brand-primary dark:text-white flex-1 leading-relaxed">
                            {item.q}
                          </span>
                          <ChevronDown
                            size={18}
                            className={`shrink-0 text-brand-primary/30 dark:text-white/30 transition-transform duration-300 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              key="content"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-5">
                                <p className="text-sm text-brand-primary/60 dark:text-white/60 font-medium leading-relaxed">
                                  {item.a}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
