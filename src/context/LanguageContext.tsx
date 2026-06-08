import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import tr from '@/i18n/tr.json';
import en from '@/i18n/en.json';

export interface LanguagePack {
  code: string;
  name: string;
  flag: string;
}

// Languages that read right-to-left; the document direction flips for these.
export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

export const isRTL = (lang: string) => RTL_LANGUAGES.includes(lang);

export const initialAvailableLanguages: LanguagePack[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export type Language = string;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  availableLanguages: LanguagePack[];
  setAvailableLanguages: (packs: LanguagePack[]) => void;
  translations: Record<string, Record<string, string>>;
  setTranslations: (trans: Record<string, Record<string, string>>) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Preloaded translations (Turkish default + English fallback); DE and AR load lazily
const eagerTranslations: Record<string, Record<string, string>> = { tr, en };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'tr';
    return window.localStorage.getItem('lang') || 'tr';
  });
  const [availableLanguages, setAvailableLanguages] =
    useState<LanguagePack[]>(initialAvailableLanguages);
  const [translations, setTranslations] =
    useState<Record<string, Record<string, string>>>(eagerTranslations);

  // Lazy-load non-default languages (DE, AR)
  useEffect(() => {
    if (translations[lang]) return;
    import(`@/i18n/${lang}.json`)
      .then((mod) => {
        setTranslations((prev) => ({ ...prev, [lang]: mod.default }));
      })
      .catch(() => {
        if (lang !== 'en') {
          setTranslations((prev) => ({ ...prev, en }));
        }
      });
  }, [lang, translations]);

  // Persist lang choice and sync <html lang>/<html dir> (RTL support)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    window.localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
  }, [lang]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => {
      const tx = translations[lang] as Record<string, string> | undefined;
      const result =
        tx?.[key] ||
        (en as Record<string, string>)[key] ||
        (tr as Record<string, string>)[key];
      return result ?? fallback;
    },
    [lang, translations],
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
      availableLanguages,
      setAvailableLanguages,
      translations,
      setTranslations,
    }),
    [lang, t, setLang, availableLanguages, translations],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
