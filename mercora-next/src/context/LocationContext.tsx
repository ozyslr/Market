'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface MarketInfo {
  country: string;
  currency: string;
  language: string;
  flag: string;
}

const MARKETS: Record<string, MarketInfo> = {
  UK: { country: 'UK', currency: 'GBP', language: 'en', flag: '🇬🇧' },
  TR: { country: 'TR', currency: 'TRY', language: 'tr', flag: '🇹🇷' },
  DE: { country: 'DE', currency: 'EUR', language: 'de', flag: '🇩🇪' },
  FR: { country: 'FR', currency: 'EUR', language: 'fr', flag: '🇫🇷' },
  US: { country: 'US', currency: 'USD', language: 'en', flag: '🇺🇸' },
};

interface LocationContextType {
  market: MarketInfo;
  availableMarkets: typeof MARKETS;
  setMarket: (country: string) => void;
  city: string | null;
  setCity: (city: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY_MARKET = 'mcr_market';
const STORAGE_KEY_CITY = 'mcr_city';

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [market, setMarketState] = useState<MarketInfo>(MARKETS.UK);
  const [city, setCityState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // SSR-safe: read from localStorage only after mount
  useEffect(() => {
    try {
      const savedMarket = localStorage.getItem(STORAGE_KEY_MARKET);
      if (savedMarket && MARKETS[savedMarket]) {
        setMarketState(MARKETS[savedMarket]);
      }
      const savedCity = localStorage.getItem(STORAGE_KEY_CITY);
      if (savedCity) {
        setCityState(savedCity);
      }
    } catch {
      // localStorage unavailable
    }
    setReady(true);
  }, []);

  const setMarket = (country: string) => {
    const info = MARKETS[country];
    if (!info) return;
    setMarketState(info);
    try {
      localStorage.setItem(STORAGE_KEY_MARKET, country);
    } catch { /* ignore */ }
  };

  const setCity = (newCity: string) => {
    setCityState(newCity);
    try {
      localStorage.setItem(STORAGE_KEY_CITY, newCity);
    } catch { /* ignore */ }
  };

  if (!ready) {
    // Prevent hydration mismatch — render nothing until client reads localStorage
    return (
      <LocationContext.Provider value={{ market: MARKETS.UK, availableMarkets: MARKETS, setMarket, city: null, setCity }}>
        {children}
      </LocationContext.Provider>
    );
  }

  return (
    <LocationContext.Provider value={{ market, availableMarkets: MARKETS, setMarket, city, setCity }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within a LocationProvider');
  return context;
}
