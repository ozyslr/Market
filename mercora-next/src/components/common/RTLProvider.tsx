'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

const RTL_LANGUAGES = ['ar'];
const LANG_MAP: Record<string, string> = {
  en: 'en',
  tr: 'tr',
  de: 'de',
  ar: 'ar',
};

export function RTLProvider() {
  const { lang } = useLanguage();

  useEffect(() => {
    const dir = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
    const htmlLang = LANG_MAP[lang] || 'tr';

    document.documentElement.dir = dir;
    document.documentElement.lang = htmlLang;

    // Add/remove RTL class for Tailwind overrides
    document.documentElement.classList.toggle('rtl', dir === 'rtl');
  }, [lang]);

  return null;
}
