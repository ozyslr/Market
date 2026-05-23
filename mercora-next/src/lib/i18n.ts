/**
 * Internationalization Setup (STREAM I)
 * Multi-language support with i18next
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import trCommon from '@/public/locales/tr/common.json';
import enCommon from '@/public/locales/en/common.json';
import deCommon from '@/public/locales/de/common.json';
import frCommon from '@/public/locales/fr/common.json';

const resources = {
  tr: { translation: trCommon },
  en: { translation: enCommon },
  de: { translation: deCommon },
  fr: { translation: frCommon },
};

i18n
  .use(LanguageDetector) // Auto-detect language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // React already prevents XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

/**
 * Get language from localStorage
 */
export function getLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('i18nextLng') || 'en';
}

/**
 * Set language
 */
export function setLanguage(lang: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('i18nextLng', lang);
  }
  i18n.changeLanguage(lang);
}

/**
 * Get supported languages
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
];

/**
 * Direction for language (LTR or RTL)
 */
export function getTextDirection(lang: string): 'ltr' | 'rtl' {
  // Add RTL languages here if needed (Arabic, Hebrew, etc)
  return 'ltr';
}
