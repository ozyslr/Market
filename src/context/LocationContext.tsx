import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DeliveryLocation {
  country: string; // ISO 2-letter code: 'GB' | 'TR' | 'DE' | 'US'
  city: string;
  district?: string;
  displayText: string; // "London, UK"
  market: string; // MARKETS key: 'UK' | 'TR' | 'DE' | 'US'
  currency: string; // 'GBP' | 'TRY' | 'EUR' | 'USD'
}

const DEFAULT_LOCATION: DeliveryLocation = {
  country: 'GB',
  city: 'London',
  displayText: 'London, UK',
  market: 'UK',
  currency: 'GBP',
};

function loadSavedLocation(): DeliveryLocation {
  try {
    const raw = localStorage.getItem('mercora_location');
    if (raw) return JSON.parse(raw) as DeliveryLocation;
  } catch {
    /* empty */
  }
  return DEFAULT_LOCATION;
}

interface LocationContextType {
  location: DeliveryLocation;
  setLocation: (loc: DeliveryLocation) => void;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;
  // backward-compat alias
  selectedLocation: string;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<DeliveryLocation>(loadSavedLocation);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const setLocation = (loc: DeliveryLocation) => {
    setLocationState(loc);
    try {
      localStorage.setItem('mercora_location', JSON.stringify(loc));
    } catch {
      /* empty */
    }
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation,
        isLocationModalOpen,
        setIsLocationModalOpen,
        selectedLocation: location.displayText,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationStore() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationStore must be used within a LocationProvider');
  return ctx;
}
