'use client';

import { useState } from 'react';
import { X, MapPin, ChevronDown } from 'lucide-react';
import { useLocation } from '@/context/LocationContext';
import { TURKEY_LOCATIONS } from '@/lib/turkeyLocations';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationModal({ isOpen, onClose }: LocationModalProps) {
  const { market, availableMarkets, setMarket, city, setCity } = useLocation();
  const [selectedCountry, setSelectedCountry] = useState(market.country);
  const [selectedCity, setSelectedCity] = useState(city || '');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  if (!isOpen) return null;

  const countryList = Object.entries(availableMarkets).map(([code, info]) => ({
    code,
    ...info,
  }));

  const cities = selectedCountry === 'TR' ? Object.keys(TURKEY_LOCATIONS) : [];

  const handleSave = () => {
    setMarket(selectedCountry);
    if (selectedCity) setCity(selectedCity);
    onClose();
  };

  const currentCountry = countryList.find(c => c.code === selectedCountry);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 relative animate-in fade-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-full">
              <MapPin size={20} className="text-purple-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Delivery Location</h2>
              <p className="text-sm text-gray-500">Set your delivery region</p>
            </div>
          </div>

          <div className="relative mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Country / Region</label>
            <button
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-lg text-sm hover:border-gray-400 focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{currentCountry?.flag}</span>
                <span>{currentCountry?.country}</span>
                <span className="text-gray-400 text-xs">({currentCountry?.currency})</span>
              </span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {showCountryDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {countryList.map(c => (
                  <button
                    key={c.code}
                    onClick={() => { setSelectedCountry(c.code); setShowCountryDropdown(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-purple-50 text-left"
                  >
                    <span className="text-lg">{c.flag}</span>
                    <span>{c.country}</span>
                    <span className="text-gray-400 text-xs ml-auto">({c.currency})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {cities.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">City (optional)</label>
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
              >
                <option value="">Select a city</option>
                {cities.map(cityName => (
                  <option key={cityName} value={cityName}>{cityName}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleSave}
            className="w-full py-2.5 bg-purple-700 text-white rounded-lg hover:bg-purple-800 font-medium transition-colors text-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
