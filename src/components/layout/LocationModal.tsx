import React, { useState } from 'react';
import { X, MapPin, Navigation, Home, Briefcase, Check, Loader2 } from 'lucide-react';
import { useLocationStore, DeliveryLocation } from '@/context/LocationContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface MarketConfig {
  flag: string;
  label: string;
  country: string;
  currency: string;
}

const MARKET_OPTIONS: Record<string, MarketConfig> = {
  UK: { flag: '🇬🇧', label: 'United Kingdom', country: 'GB', currency: 'GBP' },
  TR: { flag: '🇹🇷', label: 'Türkiye', country: 'TR', currency: 'TRY' },
  DE: { flag: '🇩🇪', label: 'Germany', country: 'DE', currency: 'EUR' },
  US: { flag: '🇺🇸', label: 'United States', country: 'US', currency: 'USD' },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationModal({ isOpen, onClose }: Props) {
  const { location, setLocation } = useLocationStore();
  const { user } = useAuth();

  const [selectedMarket, setSelectedMarket] = useState<string>(location.market);
  const [cityInput, setCityInput] = useState(location.city);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  if (!isOpen) return null;

  const addresses = user?.addresses ?? [];

  async function handleGps() {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || '';
          const countryCode = (data.address?.country_code ?? '').toUpperCase();
          const marketKey = Object.keys(MARKET_OPTIONS).find(
            k => MARKET_OPTIONS[k].country === countryCode,
          ) ?? 'UK';
          setSelectedMarket(marketKey);
          setCityInput(city);
        } catch {
          setGpsError('Konum alınamadı, manuel seçin.');
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setGpsError('Konum erişimi reddedildi.');
        setGpsLoading(false);
      },
    );
  }

  function handleSelectSavedAddress(addr: NonNullable<typeof addresses>[0]) {
    const countryCode = addr.country?.toUpperCase();
    const marketKey = Object.keys(MARKET_OPTIONS).find(
      k => MARKET_OPTIONS[k].country === countryCode,
    ) ?? 'UK';
    setSelectedMarket(marketKey);
    setCityInput(addr.city);
  }

  function handleConfirm() {
    const cfg = MARKET_OPTIONS[selectedMarket];
    const loc: DeliveryLocation = {
      country: cfg.country,
      city: cityInput.trim() || cfg.label,
      displayText: cityInput.trim() ? `${cityInput.trim()}, ${cfg.country}` : cfg.label,
      market: selectedMarket,
      currency: cfg.currency,
    };
    setLocation(loc);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label="Konum seç" onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#1A1033]/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-2xl flex items-center justify-center">
              <MapPin size={18} className="text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#1A1033]">Teslimat Konumu</h2>
              <p className="text-[10px] font-bold text-[#1A1033]/40 mt-0.5">Daha doğru teslimat için konum seçin</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#1A1033]/30 hover:text-[#1A1033] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* GPS Button */}
          <button
            onClick={handleGps}
            disabled={gpsLoading}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#1A1033]/5 hover:bg-accent/10 border border-[#1A1033]/5 hover:border-accent/30 rounded-2xl transition-all group disabled:opacity-50"
          >
            {gpsLoading
              ? <Loader2 size={18} className="text-accent animate-spin" />
              : <Navigation size={18} className="text-accent group-hover:scale-110 transition-transform" />}
            <span className="text-xs font-black uppercase tracking-widest text-[#1A1033]">
              {gpsLoading ? 'Konum alınıyor...' : 'Mevcut Konumumu Kullan'}
            </span>
          </button>
          {gpsError && <p className="text-[10px] text-red-500 font-bold -mt-3">{gpsError}</p>}

          {/* Saved Addresses */}
          {addresses.length > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 mb-3">Kayıtlı Adresler</p>
              <div className="grid grid-cols-2 gap-2">
                {addresses.slice(0, 4).map(addr => (
                  <button
                    key={addr.id}
                    onClick={() => handleSelectSavedAddress(addr)}
                    className={cn(
                      'flex items-start gap-2.5 p-3.5 rounded-2xl border text-start transition-all',
                      cityInput === addr.city && selectedMarket === (Object.keys(MARKET_OPTIONS).find(k => MARKET_OPTIONS[k].country === addr.country?.toUpperCase()) ?? 'UK')
                        ? 'border-accent bg-accent/5'
                        : 'border-[#1A1033]/5 hover:border-accent/30 bg-[#F8F8FA]',
                    )}
                  >
                    <div className="w-7 h-7 bg-white rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      {addr.label?.toLowerCase().includes('ev') || addr.label?.toLowerCase().includes('home')
                        ? <Home size={13} className="text-accent" />
                        : <Briefcase size={13} className="text-[#1A1033]/40" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#1A1033] leading-tight">{addr.label || addr.fullName}</p>
                      <p className="text-[9px] text-[#1A1033]/40 font-bold mt-0.5 leading-tight">{addr.city}, {addr.country}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Country / Market Selector */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 mb-3">Ülke / Market</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(MARKET_OPTIONS).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setSelectedMarket(key)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all',
                    selectedMarket === key
                      ? 'border-accent bg-accent/5 shadow-sm'
                      : 'border-[#1A1033]/5 hover:border-accent/30 bg-[#F8F8FA]',
                  )}
                >
                  <span className="text-xl leading-none">{cfg.flag}</span>
                  <div className="text-start">
                    <p className="text-[10px] font-black text-[#1A1033]">{key}</p>
                    <p className="text-[9px] text-[#1A1033]/40 font-bold">{cfg.currency}</p>
                  </div>
                  {selectedMarket === key && <Check size={12} className="text-accent ms-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* City Input */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 mb-2">Şehir / Bölge</p>
            <input
              type="text"
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              placeholder="Şehir adı girin..."
              className="w-full px-4 py-3 bg-[#F8F8FA] border border-[#1A1033]/5 rounded-2xl text-sm font-bold text-[#1A1033] outline-none focus:ring-4 ring-accent/10 focus:border-accent/30 transition-all placeholder:text-[#1A1033]/20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1A1033]/5 bg-[#F8F8FA]">
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 bg-[#1A1033] hover:bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            {MARKET_OPTIONS[selectedMarket]?.flag} Onayla — {cityInput.trim() || MARKET_OPTIONS[selectedMarket]?.label}, {selectedMarket}
          </button>
        </div>
      </div>
    </div>
  );
}
