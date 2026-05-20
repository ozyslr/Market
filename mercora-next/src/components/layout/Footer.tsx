'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useEffect, useState } from 'react';

export function Footer() {
  const { t } = useLanguage();
  const [year, setYear] = useState(2026);
  useEffect(() => { setYear(new Date().getFullYear()); }, []);

  return (
    <footer className="bg-[#1A1033] text-white mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-black italic tracking-tight mb-4" id="footer-brand">MERCORA</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Corporate */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-4" id="footer-corporate">{t('footer.corporate')}</h4>
            <ul className="space-y-2 text-sm text-gray-400" aria-labelledby="footer-corporate">
              <li><Link href="/about" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 rounded">{t('footer.about')}</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 rounded">{t('footer.careers')}</Link></li>
              <li><Link href="/sell" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 rounded">{t('nav.sell')}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-4" id="footer-support">{t('footer.support')}</h4>
            <ul className="space-y-2 text-sm text-gray-400" aria-labelledby="footer-support">
              <li><Link href="/support" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 rounded">{t('footer.help')}</Link></li>
              <li><Link href="/orders" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 rounded">{t('nav.orders')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-4" id="footer-legal">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400" aria-labelledby="footer-legal">
              <li><Link href="/privacy" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 rounded">{t('footer.privacy_policy')}</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 rounded">{t('footer.terms_of_service')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          &copy; {year} Mercora. {t('footer.rights_reserved')}
        </div>
      </div>
    </footer>
  );
}
