import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'tr';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.deals': "Today's Deals",
    'nav.customerservice': 'Customer Service',
    'nav.registry': 'Registry',
    'nav.giftcards': 'Gift Cards',
    'nav.sell': 'Sell on Mercora',
    'nav.hello': 'Hello, Sign in',
    'nav.account': 'Account & Lists',
    'nav.orders': 'Returns & Orders',
    'nav.cart': 'Cart',
    'nav.search_placeholder': "Search products globally: 'Handmade WATCH'...",
    'nav.all_categories': 'All Categories',
    'nav.departments': 'Departments',
    'nav.deliver_to': 'Deliver to',
    'hero.badge': '2026 Season Deals',
    'hero.title': 'Electronic Artifacts',
    'hero.subtitle': 'Discover the Future',
    'hero.desc': 'Handpicked artisan technology collection from London and Istanbul warehouses, all customs duties included.',
    'hero.cta': 'Browse Collection',
    'hero.watch': 'Watch Promo',
    'hero.spotlight1.title': 'Global Fulfillment',
    'hero.spotlight1.desc': 'Flat £12.00 flat rate shipping to EU and UK Hubs.',
    'product.origin': 'Origin',
    'product.delivery': 'Delivery Terms',
    'product.buy_now': 'Buy Now',
    'product.add_cart': 'Add to Cart',
    'home.best_sellers': 'Best Sellers',
    'home.for_everyone': 'Products for Everyone',
    'home.new_arrivals': 'New Arrivals',
    'global.discover': 'Discover the World Market',
    'global.see_all': 'See All',
    'market.insight': 'Market Insights',
    'market.trending': 'Bullish Demand',
    'market.scarcity': 'Scarcity Alert',
    'market.opportunity': 'Global Opportunity',
    'logistics.timeline': 'Fulfillment Strategy',
    'logistics.hub_processing': 'Hub Processing',
    'logistics.customs_clearance': 'Customs Authorization',
    'logistics.last_mile': 'Last Mile Delivery',
    'category.camping': 'Camping & Outdoor',
    'category.makeup': 'Makeup Products',
    'category.sportswear': 'Sportswear',
    'category.accessories': 'Accessories',
    'category.living_room': 'Living Room',
    'category.kitchen': 'Kitchen & Dining',
    'footer.corporate': 'Corporate',
    'footer.about': 'About Us',
    'footer.careers': 'Careers',
    'footer.support': 'Support',
    'footer.help': 'Help Center',
    'flash.deals': 'Limitless Opportunities',
    'flash.view': 'View Deals',
  },
  tr: {
    'nav.deals': "Günün Fırsatları",
    'nav.customerservice': 'Müşteri Hizmetleri',
    'nav.registry': 'Liste',
    'nav.giftcards': 'Hediye Kartları',
    'nav.sell': 'Mercora\'da Sat',
    'nav.hello': 'Merhaba, Giriş yap',
    'nav.account': 'Hesap ve Listeler',
    'nav.orders': 'İadeler ve Siparişler',
    'nav.cart': 'Sepet',
    'nav.search_placeholder': "Küresel ürün ara: 'El yapımı SAAT'...",
    'nav.all_categories': 'Tüm Kategoriler',
    'nav.departments': 'Bölümler',
    'nav.deliver_to': 'Gönderim',
    'hero.badge': '2026 Sezon Fırsatları',
    'hero.title': 'Elektronik Artifacts',
    'hero.subtitle': 'Geleceği Keşfet',
    'hero.desc': 'Londra ve İstanbul depo çıkışlı, gümrük masrafları dahil artisan teknoloji koleksiyonu Mercora\'da.',
    'hero.cta': 'Koleksiyonu İncele',
    'hero.watch': 'Tanıtım İzle',
    'hero.spotlight1.title': 'Küresel Gönderim',
    'hero.spotlight1.desc': 'AB ve BK merkezlerine sabit £12.00 kargo ücreti.',
    'hero.spotlight2.title': 'Artisan Doğrulamalı',
    'hero.spotlight2.desc': 'Her eser küratörlerimiz tarafından denetlenir.',
    'product.origin': 'Menşei',
    'product.delivery': 'Teslimat Şartları',
    'product.buy_now': 'Hemen Al',
    'product.add_cart': 'Sepete Ekle',
    'home.best_sellers': 'En Çok Satanlar',
    'home.for_everyone': 'Bu Ürünler Herkese Göre',
    'home.new_arrivals': 'Yeni Gelenler',
    'global.discover': 'Dünya Pazarını Keşfet',
    'global.see_all': 'Tümünü Gör',
    'market.insight': 'Pazar Analizi',
    'market.trending': 'Yüksek Talep',
    'market.scarcity': 'Stok Alarmı',
    'market.opportunity': 'Küresel Fırsat',
    'logistics.timeline': 'Lojistik Stratejisi',
    'logistics.hub_processing': 'Merkez İşleme',
    'logistics.customs_clearance': 'Gümrük Onayı',
    'logistics.last_mile': 'Son Teslimat',
    'category.camping': 'Kamp & Kampçılık',
    'category.makeup': 'Makyaj Ürünleri',
    'category.sportswear': 'Spor Giyim',
    'category.accessories': 'Aksesuar',
    'category.living_room': 'Oturma Odası',
    'category.kitchen': 'Mutfak',
    'footer.corporate': 'Kurumsal',
    'footer.about': 'Hakkımızda',
    'footer.careers': 'Kariyer',
    'footer.support': 'Destek',
    'footer.help': 'Yardım Merkezi',
    'flash.deals': 'Limitli Süre',
    'flash.view': 'Fırsatları Gör',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  const t = (key: string) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
