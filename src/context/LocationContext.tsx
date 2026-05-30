import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LocationContextType {
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (isOpen: boolean) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedLocation, setSelectedLocation] = useState('İstanbul, Kadıköy');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  return (
    <LocationContext.Provider value={{
      selectedLocation,
      setSelectedLocation,
      isLocationModalOpen,
      setIsLocationModalOpen
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationStore() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationStore must be used within a LocationProvider');
  }
  return context;
}
