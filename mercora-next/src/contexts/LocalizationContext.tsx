'use client';

/**
 * Localization Context (STREAM I)
 * Manages language and currency preferences
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Exchange rate to USD
}

export interface LocalizationContextType {
  language: string;
  currency: Currency;
  setLanguage: (lang: string) => void;
  setCurrency: (currency: Currency) => void;
  currencies: Currency[];
  formatPrice: (amount: number) => string;
}

const SUPPORTED_CURRENCIES: Record<string, Currency> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', rate: 32.5 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
};

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState('en');
  const [currency, setCurrencyState] = useState<Currency>(SUPPORTED_CURRENCIES.USD);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') || 'en';
      const savedCurrency = localStorage.getItem('currency') || 'USD';

      setLanguageState(savedLanguage);
      setCurrencyState(SUPPORTED_CURRENCIES[savedCurrency] || SUPPORTED_CURRENCIES.USD);
      setIsHydrated(true);
    }
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  const setCurrency = (cur: Currency) => {
    setCurrencyState(cur);
    if (typeof window !== 'undefined') {
      localStorage.setItem('currency', cur.code);
    }
  };

  const formatPrice = (amount: number): string => {
    const formatted = (amount * currency.rate).toLocaleString(
      language === 'tr' ? 'tr-TR' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
    return `${currency.symbol}${formatted}`;
  };

  if (!isHydrated) {
    return <>{children}</>;
  }

  return (
    <LocalizationContext.Provider
      value={{
        language,
        currency,
        setLanguage,
        setCurrency,
        currencies: Object.values(SUPPORTED_CURRENCIES),
        formatPrice,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization(): LocalizationContextType {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within LocalizationProvider');
  }
  return context;
}
