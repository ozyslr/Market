'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface MegaMenuCategory {
  name: string;
  slug: string;
  subcategories?: { name: string; slug: string }[];
}

const MEGA_MENU_DATA: MegaMenuCategory[] = [
  {
    name: 'Elektronik',
    slug: 'elektronik',
    subcategories: [
      { name: 'Telefon & Tablet', slug: 'telefon-tablet' },
      { name: 'Bilgisayar & Laptop', slug: 'bilgisayar-laptop' },
      { name: 'Kulaklık & Ses', slug: 'kulaklik-ses' },
      { name: 'Akıllı Saat', slug: 'akilli-saat' },
      { name: 'Oyun & Konsol', slug: 'oyun-konsol' },
    ],
  },
  {
    name: 'Ev & Yaşam',
    slug: 'ev-yasam',
    subcategories: [
      { name: 'Mobilya', slug: 'mobilya' },
      { name: 'Mutfak', slug: 'mutfak' },
      { name: 'Dekorasyon', slug: 'dekorasyon' },
      { name: 'Aydınlatma', slug: 'aydinlatma' },
      { name: 'Bahçe', slug: 'bahce' },
    ],
  },
  {
    name: 'Moda',
    slug: 'moda',
    subcategories: [
      { name: 'Kadın Giyim', slug: 'kadin-giyim' },
      { name: 'Erkek Giyim', slug: 'erkek-giyim' },
      { name: 'Çocuk Giyim', slug: 'cocuk-giyim' },
      { name: 'Ayakkabı', slug: 'ayakkabi' },
      { name: 'Aksesuar', slug: 'aksesuar' },
    ],
  },
  {
    name: 'Spor',
    slug: 'spor',
    subcategories: [
      { name: 'Spor Giyim', slug: 'spor-giyim' },
      { name: 'Spor Ekipmanları', slug: 'spor-ekipmanlari' },
      { name: 'Bisiklet', slug: 'bisiklet' },
      { name: 'Kamp & Doğa', slug: 'kamp-doga' },
      { name: 'Spor Beslenme', slug: 'spor-beslenme' },
    ],
  },
  {
    name: 'Bebek & Çocuk',
    slug: 'bebek-cocuk',
    subcategories: [
      { name: 'Bebek Bezi & Islak Mendil', slug: 'bebek-bezi' },
      { name: 'Bebek Giyim', slug: 'bebek-giyim' },
      { name: 'Oyuncak', slug: 'oyuncak' },
      { name: 'Bebek Arabası', slug: 'bebek-arabasi' },
      { name: 'Bebek Odası', slug: 'bebek-odasi' },
    ],
  },
  {
    name: 'Kitap & Hobi',
    slug: 'kitap-hobi',
    subcategories: [
      { name: 'Çok Satan Kitaplar', slug: 'cok-satan-kitaplar' },
      { name: 'Edebiyat', slug: 'edebiyat' },
      { name: 'Çocuk Kitapları', slug: 'cocuk-kitaplari' },
      { name: 'Hobi & El Sanatları', slug: 'hobi-el-sanatlari' },
      { name: 'Müzik Aletleri', slug: 'muzik-aletleri' },
    ],
  },
];

export function MegaMenu() {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = (slug: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenCategory(slug);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenCategory(null);
      setIsVisible(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="hidden lg:block bg-white border-b border-gray-200 relative" onMouseLeave={handleMouseLeave}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex">
          {MEGA_MENU_DATA.map(cat => (
            <div
              key={cat.slug}
              className="relative"
              onMouseEnter={() => handleMouseEnter(cat.slug)}
            >
              <Link
                href={`/category/${cat.slug}`}
                className={`flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors ${
                  openCategory === cat.slug && isVisible
                    ? 'text-purple-700 border-b-2 border-purple-700'
                    : 'text-gray-700 hover:text-purple-700'
                }`}
              >
                {cat.name}
                {cat.subcategories && <ChevronDown size={14} className="text-gray-400" />}
              </Link>
            </div>
          ))}
        </div>

        {/* Dropdown Panel */}
        {openCategory && isVisible && (
          <div
            className="absolute left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40"
            onMouseEnter={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              setIsVisible(true);
            }}
          >
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="grid grid-cols-5 gap-6">
                {MEGA_MENU_DATA.find(c => c.slug === openCategory)?.subcategories?.map(sub => (
                  <Link
                    key={sub.slug}
                    href={`/category/${openCategory}/${sub.slug}`}
                    className="block p-3 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900 hover:text-purple-700">{sub.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
