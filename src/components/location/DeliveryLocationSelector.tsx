import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, ChevronDown, Check, Loader2, X, Search } from 'lucide-react';
import { useLocationStore, DeliveryLocation } from '@/context/LocationContext';
import { TURKEY_LOCATIONS } from '@/lib/turkeyLocations';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Market configuration
// ---------------------------------------------------------------------------

interface MarketConfig {
  flag: string;
  label: string;
  country: string;
  currency: string;
  hasDistricts: boolean;
}

const MARKET_OPTIONS: Record<string, MarketConfig> = {
  UK: { flag: '🇬🇧', label: 'United Kingdom', country: 'GB', currency: 'GBP', hasDistricts: false },
  TR: { flag: '🇹🇷', label: 'Türkiye', country: 'TR', currency: 'TRY', hasDistricts: true },
  DE: { flag: '🇩🇪', label: 'Germany', country: 'DE', currency: 'EUR', hasDistricts: false },
  US: { flag: '🇺🇸', label: 'United States', country: 'US', currency: 'USD', hasDistricts: false },
};

// ---------------------------------------------------------------------------
// Curated city lists for non-TR markets
// ---------------------------------------------------------------------------

const UK_CITIES: string[] = [
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Glasgow', 'Edinburgh',
  'Bristol', 'Sheffield', 'Newcastle upon Tyne', 'Nottingham', 'Southampton', 'Cardiff',
  'Belfast', 'Leicester', 'Coventry', 'Brighton', 'Plymouth', 'Oxford', 'Cambridge',
  'Aberdeen', 'Dundee', 'Swansea', 'Exeter', 'York', 'Bath', 'Norwich', 'Portsmouth',
  'Stoke-on-Trent', 'Wolverhampton', 'Derby', 'Sunderland', 'Luton', 'Reading',
];

const DE_CITIES: string[] = [
  'Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt am Main', 'Stuttgart', 'Düsseldorf',
  'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden', 'Hannover', 'Nürnberg',
  'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster', 'Mannheim',
  'Karlsruhe', 'Augsburg', 'Wiesbaden', 'Aachen', 'Mönchengladbach', 'Gelsenkirchen',
  'Braunschweig', 'Kiel', 'Chemnitz', 'Halle (Saale)', 'Magdeburg', 'Freiburg im Breisgau',
  'Krefeld', 'Mainz', 'Lübeck', 'Erfurt', 'Oberhausen', 'Rostock', 'Kassel',
];

const US_CITIES: string[] = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
  'Fort Worth', 'Columbus', 'Charlotte', 'Indianapolis', 'San Francisco', 'Seattle',
  'Denver', 'Nashville', 'Oklahoma City', 'El Paso', 'Washington', 'Boston',
  'Las Vegas', 'Portland', 'Memphis', 'Louisville', 'Baltimore', 'Milwaukee',
  'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Mesa', 'Atlanta', 'Kansas City',
  'Omaha', 'Colorado Springs', 'Raleigh', 'Miami', 'Long Beach', 'Virginia Beach',
  'Oakland', 'Minneapolis', 'Tampa', 'Arlington', 'New Orleans', 'Cleveland',
  'Honolulu', 'Orlando',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCitiesForMarket(market: string): string[] {
  switch (market) {
    case 'TR': return Object.keys(TURKEY_LOCATIONS).sort();
    case 'UK': return UK_CITIES;
    case 'DE': return DE_CITIES;
    case 'US': return US_CITIES;
    default: return [];
  }
}

function getDistrictsForCity(market: string, city: string): string[] {
  if (market !== 'TR' || !city) return [];
  return TURKEY_LOCATIONS[city] ?? [];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DeliveryLocationSelectorProps {
  variant: 'inline' | 'modal';
  onConfirm?: () => void;
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DeliveryLocationSelector({
  variant,
  onConfirm,
  onClose,
}: DeliveryLocationSelectorProps) {
  const { location, setLocation } = useLocationStore();

  // ----- local selection state (initialised from persisted location) -----
  const [selectedMarket, setSelectedMarket] = useState<string>(location.market);
  const [selectedCity, setSelectedCity] = useState<string>(location.city);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(location.district ?? '');

  // ----- UI state -----
  const [citySearch, setCitySearch] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);

  // ----- derived data -----
  const marketCfg = MARKET_OPTIONS[selectedMarket];
  const cities = useMemo(() => getCitiesForMarket(selectedMarket), [selectedMarket]);
  const districts = useMemo(
    () => getDistrictsForCity(selectedMarket, selectedCity),
    [selectedMarket, selectedCity],
  );

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return cities;
    const q = citySearch.toLocaleLowerCase('tr');
    return cities.filter((c) => c.toLocaleLowerCase('tr').includes(q));
  }, [cities, citySearch]);

  const showCityGrid = !selectedCity && !citySearch.trim() && cities.length > 0;

  // ----- reset helpers -----
  const changeMarket = useCallback((market: string) => {
    setSelectedMarket(market);
    setSelectedCity('');
    setSelectedDistrict('');
    setCitySearch('');
    setGpsError('');
  }, []);

  const selectCity = useCallback((city: string) => {
    setSelectedCity(city);
    setSelectedDistrict('');
    setCitySearch('');
  }, []);

  const clearCity = useCallback(() => {
    setSelectedCity('');
    setSelectedDistrict('');
  }, []);

  // ----- click-outside (inline only) -----
  useEffect(() => {
    if (variant !== 'inline' || !isDropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [variant, isDropdownOpen]);

  // ----- keyboard: close on Escape (inline only) -----
  useEffect(() => {
    if (variant !== 'inline' || !isDropdownOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsDropdownOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [variant, isDropdownOpen]);

  // ----- GPS -----
  async function handleGps() {
    if (!navigator.geolocation) {
      setGpsError('Tarayıcınız konum hizmetini desteklemiyor.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          );
          if (!res.ok) throw new Error('Nominatim request failed');
          const data = await res.json();
          const city =
            data.address?.city || data.address?.town || data.address?.village || '';
          const countryCode = (data.address?.country_code ?? '').toUpperCase();
          const marketKey =
            Object.keys(MARKET_OPTIONS).find(
              (k) => MARKET_OPTIONS[k].country === countryCode,
            ) ?? 'UK';
          changeMarket(marketKey);
          if (city) selectCity(city);
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
      { timeout: 10_000, enableHighAccuracy: false },
    );
  }

  // ----- confirm -----
  function handleConfirm() {
    const cfg = MARKET_OPTIONS[selectedMarket];
    const city = selectedCity.trim();
    const district = selectedDistrict.trim();

    let displayText: string;
    if (city && district) {
      displayText = `${district}, ${city}, ${selectedMarket}`;
    } else if (city) {
      displayText = `${city}, ${selectedMarket}`;
    } else {
      displayText = cfg.label;
    }

    const loc: DeliveryLocation = {
      country: cfg.country,
      city: city || cfg.label,
      district: district || undefined,
      displayText,
      market: selectedMarket,
      currency: cfg.currency,
    };

    setLocation(loc);
    setIsDropdownOpen(false);
    onConfirm?.();
  }

  // ===================================================================
  // Shared selector content
  // ===================================================================

  const selectorContent = (
    <div className="space-y-5">
      {/* ---- GPS Button ---- */}
      <button
        type="button"
        onClick={handleGps}
        disabled={gpsLoading}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#1A1033]/5 dark:bg-white/5
                   hover:bg-accent/10 border border-[#1A1033]/5 dark:border-white/10
                   hover:border-accent/30 rounded-2xl transition-all group disabled:opacity-50"
        aria-label="Mevcut konumumu kullan"
      >
        {gpsLoading ? (
          <Loader2 size={18} className="text-accent animate-spin" />
        ) : (
          <Navigation size={18} className="text-accent group-hover:scale-110 transition-transform" />
        )}
        <span className="text-xs font-black uppercase tracking-widest text-[#1A1033] dark:text-white/80">
          {gpsLoading ? 'Konum alınıyor...' : 'Mevcut Konumumu Kullan'}
        </span>
      </button>
      {gpsError && (
        <p className="text-[10px] text-red-500 font-bold -mt-3" role="alert">
          {gpsError}
        </p>
      )}

      {/* ---- Country / Market Selector ---- */}
      <fieldset>
        <legend className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 dark:text-white/30 mb-3">
          Ülke / Market
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(MARKET_OPTIONS).map(([key, cfg]) => (
            <button
              key={key}
              type="button"
              onClick={() => changeMarket(key)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all',
                selectedMarket === key
                  ? 'border-accent bg-accent/5 shadow-sm'
                  : 'border-[#1A1033]/5 dark:border-white/10 hover:border-accent/30 bg-[#F8F8FA] dark:bg-white/5',
              )}
              aria-pressed={selectedMarket === key}
            >
              <span className="text-xl leading-none" aria-hidden="true">
                {cfg.flag}
              </span>
              <div className="text-start">
                <p className="text-[10px] font-black text-[#1A1033] dark:text-white/80">{key}</p>
                <p className="text-[9px] text-[#1A1033]/40 dark:text-white/40 font-bold">
                  {cfg.currency}
                </p>
              </div>
              {selectedMarket === key && (
                <Check size={12} className="text-accent ms-auto" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </fieldset>

      {/* ---- City Selector ---- */}
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 dark:text-white/30 mb-2">
          Şehir / Bölge
        </p>

        {selectedCity ? (
          /* Selected city chip with clear button */
          <div className="flex items-center gap-2 px-4 py-3 bg-accent/5 border border-accent/30 rounded-2xl">
            <MapPin size={14} className="text-accent shrink-0" />
            <span className="text-sm font-bold text-[#1A1033] dark:text-white/80 flex-1 truncate">
              {selectedCity}
            </span>
            <button
              type="button"
              onClick={clearCity}
              className="p-1 text-[#1A1033]/30 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
              aria-label="Şehri temizle"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          /* Search input with filtered dropdown */
          <div className="relative">
            <Search
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1033]/20 dark:text-white/20 pointer-events-none"
            />
            <input
              ref={cityInputRef}
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Şehir ara..."
              className="w-full pl-10 pr-4 py-3 bg-[#F8F8FA] dark:bg-white/5
                         border border-[#1A1033]/5 dark:border-white/10 rounded-2xl
                         text-sm font-bold text-[#1A1033] dark:text-white/80
                         outline-none focus:ring-4 ring-accent/10 focus:border-accent/30
                         transition-all placeholder:text-[#1A1033]/20 dark:placeholder:text-white/15"
              aria-label="Şehir ara"
              autoComplete="off"
            />

            <AnimatePresence>
              {citySearch.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-10 mt-1 w-full bg-white dark:bg-[#1A1033]
                             border border-[#1A1033]/10 dark:border-white/10 rounded-2xl
                             shadow-xl max-h-52 overflow-y-auto py-1"
                >
                  {filteredCities.length === 0 ? (
                    <p className="px-4 py-4 text-[10px] text-[#1A1033]/40 dark:text-white/30 font-bold text-center">
                      Şehir bulunamadı
                    </p>
                  ) : (
                    filteredCities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => selectCity(city)}
                        className="w-full text-left px-4 py-2.5 text-sm font-bold
                                   text-[#1A1033] dark:text-white/80
                                   hover:bg-accent/10 transition-colors"
                      >
                        {city}
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Quick-select grid when no search active */}
        {showCityGrid && (
          <div className="mt-2 grid grid-cols-2 gap-1 max-h-44 overflow-y-auto">
            {cities.slice(0, 24).map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => selectCity(city)}
                className="text-left px-3 py-2 text-[11px] font-bold
                           text-[#1A1033]/60 dark:text-white/50
                           hover:text-[#1A1033] dark:hover:text-white
                           hover:bg-[#F8F8FA] dark:hover:bg-white/5
                           rounded-xl transition-all truncate"
              >
                {city}
              </button>
            ))}
            {cities.length > 24 && (
              <p className="col-span-2 text-[9px] text-[#1A1033]/30 dark:text-white/20 font-bold text-center py-1">
                Aramak için yazmaya başlayın…
              </p>
            )}
          </div>
        )}
      </div>

      {/* ---- District Selector (TR only) ---- */}
      {marketCfg?.hasDistricts && selectedCity && districts.length > 0 && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 dark:text-white/30 mb-2">
            İlçe
          </p>
          <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
            {/* "Tümü" / skip-district option */}
            <button
              type="button"
              onClick={() => setSelectedDistrict('')}
              className={cn(
                'text-left px-3 py-2 text-[11px] font-bold rounded-xl transition-all',
                !selectedDistrict
                  ? 'bg-accent/10 text-accent'
                  : 'text-[#1A1033]/60 dark:text-white/50 hover:text-[#1A1033] dark:hover:text-white hover:bg-[#F8F8FA] dark:hover:bg-white/5',
              )}
            >
              {!selectedDistrict && <Check size={10} className="inline me-1" />}
              Tümü
            </button>
            {districts.map((district) => (
              <button
                key={district}
                type="button"
                onClick={() => setSelectedDistrict(district)}
                className={cn(
                  'text-left px-3 py-2 text-[11px] font-bold rounded-xl transition-all truncate',
                  selectedDistrict === district
                    ? 'bg-accent/10 text-accent'
                    : 'text-[#1A1033]/60 dark:text-white/50 hover:text-[#1A1033] dark:hover:text-white hover:bg-[#F8F8FA] dark:hover:bg-white/5',
                )}
              >
                {selectedDistrict === district && <Check size={10} className="inline me-1" />}
                {district}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---- Confirm Button ---- */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={gpsLoading}
        className="w-full py-3.5 bg-[#1A1033] dark:bg-white dark:text-[#1A1033]
                   hover:bg-accent hover:text-white text-white
                   rounded-2xl text-[10px] font-black uppercase tracking-widest
                   transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
        aria-label="Konumu uygula"
      >
        {marketCfg?.flag} Uygula — {selectedCity || marketCfg?.label}
        {selectedDistrict ? `, ${selectedDistrict}` : ''}, {selectedMarket}
      </button>
    </div>
  );

  // ===================================================================
  // INLINE variant — collapsed button + animated dropdown
  // ===================================================================

  if (variant === 'inline') {
    return (
      <div ref={dropdownRef} className="relative">
        {/* Collapsed trigger */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all group',
            'bg-[#F8F8FA] dark:bg-white/5 border-[#1A1033]/5 dark:border-white/10',
            'hover:border-accent/30',
            isDropdownOpen && 'border-accent/30 bg-accent/5 dark:bg-accent/10',
          )}
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
          aria-label={`Teslimat konumu: ${location.displayText}. Seçmek için tıklayın.`}
        >
          <MapPin size={14} className="text-accent shrink-0" aria-hidden="true" />
          <span className="text-[11px] font-bold text-[#1A1033] dark:text-white/80 truncate max-w-[150px]">
            {location.displayText}
          </span>
          <ChevronDown
            size={14}
            className={cn(
              'text-[#1A1033]/30 dark:text-white/30 transition-transform duration-200',
              isDropdownOpen && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </button>

        {/* Expanded dropdown */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute z-50 mt-2 w-80 bg-white dark:bg-[#1A1033]
                         border border-[#1A1033]/10 dark:border-white/10
                         rounded-3xl shadow-2xl p-5"
              role="dialog"
              aria-label="Teslimat konumu seç"
            >
              {/* Inner close button */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-[#1A1033]/30
                           hover:text-[#1A1033] dark:hover:text-white transition-colors
                           rounded-lg hover:bg-[#1A1033]/5"
                aria-label="Kapat"
              >
                <X size={16} />
              </button>
              {selectorContent}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ===================================================================
  // MODAL variant — plain content, no outer chrome
  // ===================================================================

  return (
    <div>
      {selectorContent}
    </div>
  );
}

export default DeliveryLocationSelector;
