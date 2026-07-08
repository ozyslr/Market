import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCachedRates, type FxRates } from '../services/fxRateService';

interface CurrencyContextType {
  currency: 'TRY' | 'EUR';
  rates: FxRates | null;
  lastUpdated: Date | null;
  toggleCurrency: () => void;
  setCurrency: (c: 'TRY' | 'EUR') => void;
  convertPrice: (priceTRY: number) => { display: number; currency: string; formatted: string };
  formatPrice: (amount: number, currency?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_KEY = 'benimolan_currency';

function detectDefaultCurrency(): 'TRY' | 'EUR' {
  try {
    const saved = localStorage.getItem(CURRENCY_KEY);
    if (saved === 'EUR' || saved === 'TRY') return saved;
  } catch {}
  // Geo-detect from browser language
  const lang = navigator.language || '';
  if (lang.startsWith('tr') || lang.startsWith('az')) return 'TRY';
  return 'EUR';
}

function formatTRY(amount: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
}

function formatEUR(amount: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<'TRY' | 'EUR'>(detectDefaultCurrency);
  const [rates, setRates] = useState<FxRates | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load cached rates on mount
  useEffect(() => {
    getCachedRates().then((r) => {
      if (r) {
        setRates(r.rates as FxRates);
        setLastUpdated(new Date(r.updatedAt));
      }
    });
  }, []);

  // Refresh rates every 6 hours
  useEffect(() => {
    const interval = setInterval(
      () => {
        getCachedRates().then((r) => {
          if (r) {
            setRates(r.rates as FxRates);
            setLastUpdated(new Date(r.updatedAt));
          }
        });
      },
      6 * 60 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, []);

  const setCurrency = useCallback((c: 'TRY' | 'EUR') => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_KEY, c);
    } catch {}
  }, []);

  const toggleCurrency = useCallback(() => {
    setCurrencyState((prev) => {
      const next = prev === 'TRY' ? 'EUR' : 'TRY';
      try {
        localStorage.setItem(CURRENCY_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  const convertPrice = useCallback(
    (priceTRY: number) => {
      if (currency === 'TRY' || !rates?.EUR) {
        return { display: priceTRY, currency: 'TRY', formatted: formatTRY(priceTRY) };
      }
      const eurPrice = priceTRY * rates.EUR;
      return { display: eurPrice, currency: 'EUR', formatted: formatEUR(eurPrice) };
    },
    [currency, rates],
  );

  const formatPrice = useCallback(
    (amount: number, curr?: string) => {
      const c = curr || currency;
      return c === 'TRY' ? formatTRY(amount) : formatEUR(amount);
    },
    [currency],
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        rates,
        lastUpdated,
        toggleCurrency,
        setCurrency,
        convertPrice,
        formatPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
