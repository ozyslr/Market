# Delivery Location Cascading Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add cascading city/district dropdowns to the delivery location selector, based on selected country, with manual pick and auto-detect GPS options.

**Architecture:** Create a reusable `DeliveryLocationSelector` component that replaces the current text-input-only city field in the location flow. It cascades: Country → City → District (where district data exists — currently TR). The component supports both manual selection and browser GPS + Nominatim reverse geocoding. It appears inline on the homepage and also integrates into the existing `LocationModal`.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, framer-motion, lucide-react, existing `LocationContext`, `TURKEY_LOCATIONS` data

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/location/DeliveryLocationSelector.tsx` | Reusable cascading selector: country → city → district + GPS button |
| Modify | `src/components/layout/LocationModal.tsx` | Replace city text input with `<DeliveryLocationSelector />` |
| Modify | `src/pages/Home.tsx` | Add delivery location bar between quick-categories strip and hero section |
| Modify | `src/context/LocationContext.tsx` | Ensure `district` is always preserved through the flow |

---

### Task 1: Create `DeliveryLocationSelector` Component

**Files:**
- Create: `src/components/location/DeliveryLocationSelector.tsx`

- [ ] **Step 1: Write the component**

```tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, Navigation, ChevronDown, Check, Loader2, X } from 'lucide-react';
import { useLocationStore, DeliveryLocation } from '@/context/LocationContext';
import { TURKEY_LOCATIONS } from '@/lib/turkeyLocations';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

/* ── Market config (mirrors LocationModal) ── */

interface MarketConfig {
  flag: string;
  label: string;
  country: string;   // ISO 2-letter
  currency: string;
  hasDistricts: boolean;
}

const MARKET_OPTIONS: Record<string, MarketConfig> = {
  UK: { flag: '🇬🇧', label: 'United Kingdom', country: 'GB', currency: 'GBP', hasDistricts: false },
  TR: { flag: '🇹🇷', label: 'Türkiye', country: 'TR', currency: 'TRY', hasDistricts: true },
  DE: { flag: '🇩🇪', label: 'Germany', country: 'DE', currency: 'EUR', hasDistricts: false },
  US: { flag: '🇺🇸', label: 'United States', country: 'US', currency: 'USD', hasDistricts: false },
};

/* ── Props ── */

interface DeliveryLocationSelectorProps {
  /** Render as a compact inline bar (homepage) or full modal content */
  variant?: 'inline' | 'modal';
  /** Called after location is confirmed */
  onConfirm?: () => void;
  /** Show close button (modal variant only) */
  onClose?: () => void;
  /** Extra class on the root */
  className?: string;
}

/* ── Helpers ── */

/** Get all city names for the current market. For TR, use TURKEY_LOCATIONS keys. */
function getCitiesForMarket(market: string): string[] {
  if (market === 'TR') return Object.keys(TURKEY_LOCATIONS);
  // For other markets, we return a curated list of major cities
  // UK
  if (market === 'UK') return [
    'London', 'Manchester', 'Birmingham', 'Liverpool', 'Edinburgh',
    'Glasgow', 'Bristol', 'Leeds', 'Sheffield', 'Cardiff',
    'Belfast', 'Newcastle', 'Nottingham', 'Southampton', 'Brighton',
  ];
  // DE
  if (market === 'DE') return [
    'Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt',
    'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen',
    'Bremen', 'Dresden', 'Hannover', 'Nürnberg', 'Bonn',
  ];
  // US
  if (market === 'US') return [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
    'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin',
    'San Jose', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte',
    'Seattle', 'Denver', 'Boston', 'Nashville', 'Portland',
  ];
  return [];
}

/** Get districts for a given city. Only TR has district data. */
function getDistrictsForCity(market: string, city: string): string[] {
  if (market === 'TR' && TURKEY_LOCATIONS[city]) {
    return TURKEY_LOCATIONS[city];
  }
  return [];
}

/** City search filter */
function filterCities(cities: string[], query: string): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return cities;
  return cities.filter(c => c.toLowerCase().includes(q));
}

/* ── Component ── */

export function DeliveryLocationSelector({
  variant = 'inline',
  onConfirm,
  onClose,
  className,
}: DeliveryLocationSelectorProps) {
  const { location, setLocation } = useLocationStore();

  /* local state */
  const [market, setMarket] = useState<string>(location.market);
  const [city, setCity] = useState<string>(location.city);
  const [district, setDistrict] = useState<string>(location.district || '');
  const [isOpen, setIsOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  /* city search */
  const [cityQuery, setCityQuery] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  /* district dropdown */
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);

  /* refs for click-outside */
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Derived data ── */
  const allCities = useMemo(() => getCitiesForMarket(market), [market]);
  const filteredCities = useMemo(() => filterCities(allCities, cityQuery), [allCities, cityQuery]);
  const districts = useMemo(() => getDistrictsForCity(market, city), [market, city]);

  /* Reset district when market or city changes */
  useEffect(() => {
    setDistrict('');
    setCityQuery('');
  }, [market]);

  useEffect(() => {
    setDistrict('');
  }, [city]);

  /* Reset city when market changes */
  useEffect(() => {
    if (market !== location.market) {
      setCity('');
    }
  }, [market, location.market]);

  /* click-outside handler */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowCityDropdown(false);
        setShowDistrictDropdown(false);
        if (variant === 'inline') setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [variant]);

  /* ── GPS handler ── */
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
          const detectedCity = data.address?.city || data.address?.town || data.address?.village || '';
          const countryCode = (data.address?.country_code ?? '').toUpperCase();
          const detectedMarket = Object.keys(MARKET_OPTIONS).find(
            k => MARKET_OPTIONS[k].country === countryCode,
          ) ?? 'UK';

          setMarket(detectedMarket);
          setCity(detectedCity);
          setDistrict('');
          setCityQuery('');
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

  /* ── Confirm ── */
  function handleConfirm() {
    const cfg = MARKET_OPTIONS[market];
    const displayParts: string[] = [];
    if (district) displayParts.push(district);
    if (city) displayParts.push(city);
    if (!displayParts.length) displayParts.push(cfg.label);

    const loc: DeliveryLocation = {
      country: cfg.country,
      city: city || cfg.label,
      district: district || undefined,
      displayText: `${displayParts.join(', ')}, ${cfg.country}`,
      market,
      currency: cfg.currency,
    };
    setLocation(loc);
    setIsOpen(false);
    setShowCityDropdown(false);
    setShowDistrictDropdown(false);
    onConfirm?.();
  }

  /* ── Display text ── */
  const displayLabel = (() => {
    const parts: string[] = [];
    if (location.district) parts.push(location.district);
    if (location.city) parts.push(location.city);
    if (!parts.length) return 'Konum Seçin';
    return `${parts.join(', ')} — ${location.market}`;
  })();

  const cfg = MARKET_OPTIONS[market];

  /* ── Inline variant ── */
  if (variant === 'inline') {
    return (
      <div ref={containerRef} className={cn('relative', className)}>
        {/* Collapsed bar */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-800',
            'border border-[#1A1033]/5 hover:border-accent/30 shadow-sm',
            'transition-all cursor-pointer',
          )}
        >
          <MapPin size={16} className="text-accent shrink-0" />
          <span className="text-[11px] font-bold text-[#1A1033] dark:text-zinc-200 truncate max-w-[200px]">
            {displayLabel}
          </span>
          <ChevronDown size={14} className={cn(
            'text-[#1A1033]/40 transition-transform shrink-0',
            isOpen && 'rotate-180',
          )} />
        </button>

        {/* Expanded dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className={cn(
                'absolute top-full mt-2 left-0 z-50 w-[340px]',
                'bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-[#1A1033]/5',
                'p-4 space-y-3',
              )}
            >
              {renderSelectorContent()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ── Modal variant ── */
  return (
    <div ref={containerRef} className={cn('space-y-4', className)}>
      {renderSelectorContent()}
    </div>
  );

  /* ── Shared selector content ── */
  function renderSelectorContent() {
    return (
      <>
        {/* GPS Button */}
        <button
          onClick={handleGps}
          disabled={gpsLoading}
          className="w-full flex items-center gap-3 px-4 py-3 bg-accent/5 hover:bg-accent/10 border border-accent/20 hover:border-accent/40 rounded-2xl transition-all group disabled:opacity-50"
        >
          {gpsLoading
            ? <Loader2 size={18} className="text-accent animate-spin" />
            : <Navigation size={18} className="text-accent group-hover:scale-110 transition-transform" />}
          <span className="text-[11px] font-black uppercase tracking-widest text-[#1A1033] dark:text-zinc-200">
            {gpsLoading ? 'Konum alınıyor...' : 'Mevcut Konumumu Kullan'}
          </span>
        </button>
        {gpsError && (
          <p className="text-[10px] text-red-500 font-bold">{gpsError}</p>
        )}

        {/* Country / Market */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 dark:text-zinc-400 mb-2">
            Ülke / Market
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(MARKET_OPTIONS).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setMarket(key)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border transition-all text-start',
                  market === key
                    ? 'border-accent bg-accent/5 shadow-sm'
                    : 'border-[#1A1033]/5 hover:border-accent/30 bg-[#F8F8FA] dark:bg-zinc-800',
                )}
              >
                <span className="text-lg leading-none">{cfg.flag}</span>
                <div>
                  <p className="text-[10px] font-black text-[#1A1033] dark:text-zinc-200">{key}</p>
                  <p className="text-[8px] text-[#1A1033]/40 font-bold">{cfg.currency}</p>
                </div>
                {market === key && <Check size={11} className="text-accent ms-auto" />}
              </button>
            ))}
          </div>
        </div>

        {/* City selector */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 dark:text-zinc-400 mb-2">
            Şehir
          </p>
          <div className="relative">
            <input
              type="text"
              value={cityQuery || city}
              onChange={e => {
                setCityQuery(e.target.value);
                setShowCityDropdown(true);
              }}
              onFocus={() => setShowCityDropdown(true)}
              placeholder="Şehir ara veya seç..."
              className="w-full px-4 py-3 bg-[#F8F8FA] dark:bg-zinc-800 border border-[#1A1033]/5 rounded-2xl text-sm font-bold text-[#1A1033] dark:text-zinc-200 outline-none focus:ring-4 ring-accent/10 focus:border-accent/30 transition-all placeholder:text-[#1A1033]/20"
            />
            {city && !cityQuery && (
              <button
                onClick={() => { setCity(''); setDistrict(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#1A1033]/30 hover:text-red-400"
              >
                <X size={14} />
              </button>
            )}

            {/* City dropdown */}
            <AnimatePresence>
              {showCityDropdown && filteredCities.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full mt-1 left-0 right-0 z-20 max-h-[180px] overflow-y-auto bg-white dark:bg-zinc-900 border border-[#1A1033]/10 rounded-xl shadow-lg"
                >
                  {filteredCities.map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        setCity(c);
                        setCityQuery('');
                        setShowCityDropdown(false);
                        setDistrict('');
                      }}
                      className={cn(
                        'w-full text-start px-4 py-2.5 text-[11px] font-bold hover:bg-accent/5 transition-colors',
                        c === city && 'bg-accent/10 text-accent',
                      )}
                    >
                      {c}
                      {c === city && <Check size={11} className="inline ms-2 text-accent" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* District selector — only if market has districts */}
        {cfg.hasDistricts && city && districts.length > 0 && (
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 dark:text-zinc-400 mb-2">
              İlçe / Bölge
            </p>
            <div className="relative">
              <button
                onClick={() => setShowDistrictDropdown(!showDistrictDropdown)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all',
                  district
                    ? 'border-accent bg-accent/5'
                    : 'border-[#1A1033]/5 bg-[#F8F8FA] dark:bg-zinc-800',
                )}
              >
                <span className={cn(
                  'text-sm font-bold',
                  district ? 'text-[#1A1033] dark:text-zinc-200' : 'text-[#1A1033]/30',
                )}>
                  {district || 'İlçe seçin...'}
                </span>
                <ChevronDown size={14} className={cn(
                  'text-[#1A1033]/40 transition-transform',
                  showDistrictDropdown && 'rotate-180',
                )} />
              </button>

              <AnimatePresence>
                {showDistrictDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full mt-1 left-0 right-0 z-20 max-h-[180px] overflow-y-auto bg-white dark:bg-zinc-900 border border-[#1A1033]/10 rounded-xl shadow-lg"
                  >
                    {/* "All" option */}
                    <button
                      onClick={() => {
                        setDistrict('');
                        setShowDistrictDropdown(false);
                      }}
                      className={cn(
                        'w-full text-start px-4 py-2.5 text-[11px] font-bold hover:bg-accent/5 transition-colors',
                        !district && 'bg-accent/10 text-accent',
                      )}
                    >
                      Tüm İlçeler
                      {!district && <Check size={11} className="inline ms-2 text-accent" />}
                    </button>
                    {districts.map(d => (
                      <button
                        key={d}
                        onClick={() => {
                          setDistrict(d);
                          setShowDistrictDropdown(false);
                        }}
                        className={cn(
                          'w-full text-start px-4 py-2.5 text-[11px] font-bold hover:bg-accent/5 transition-colors',
                          d === district && 'bg-accent/10 text-accent',
                        )}
                      >
                        {d}
                        {d === district && <Check size={11} className="inline ms-2 text-accent" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          className="w-full py-3.5 bg-[#1A1033] hover:bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {cfg.flag} Uygula — {[district, city || cfg.label].filter(Boolean).join(', ')}, {market}
        </button>
      </>
    );
  }
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | Select-String "DeliveryLocationSelector" || echo "No errors in DeliveryLocationSelector"`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/components/location/DeliveryLocationSelector.tsx
git commit -m "feat(location): add cascading DeliveryLocationSelector component"
```

---

### Task 2: Integrate Selector into LocationModal

**Files:**
- Modify: `src/components/layout/LocationModal.tsx`

- [ ] **Step 1: Replace the city text input and market selector in LocationModal with the new component**

In `LocationModal.tsx`, find the section with the market selector (lines 295-317) and city input (lines 320-330). Replace both with `<DeliveryLocationSelector variant="modal" />`.

The modal will still keep its own saved-addresses section, header, and footer — only the market/city selection portion gets replaced.

**Changes to `LocationModal.tsx`:**

1. Add import for `DeliveryLocationSelector`:
```tsx
import { DeliveryLocationSelector } from '@/components/location/DeliveryLocationSelector';
```

2. Replace the market selector + city input block (currently lines 294-330) with:
```tsx
          {/* Cascading Location Selector */}
          <DeliveryLocationSelector
            variant="modal"
            onConfirm={() => {
              onClose();
            }}
          />
```

3. Remove the old `selectedMarket`, `cityInput` state variables (lines 37-38) since they're now managed inside `DeliveryLocationSelector`.

4. Remove the old `handleGps`, `gpsLoading`, `gpsError` state and handlers (lines 39-40 and 103-133) — now handled inside `DeliveryLocationSelector`.

5. Remove the old `handleConfirm` function (lines 144-155).

6. Simplify the footer button to just close:
```tsx
<div className="px-6 py-4 border-t border-[#1A1033]/5 bg-[#F8F8FA]">
  <button
    onClick={onClose}
    className="w-full py-3.5 bg-[#1A1033] hover:bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
  >
    Kapat
  </button>
</div>
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | Select-String "LocationModal|DeliveryLocationSelector" || echo "No errors"`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/LocationModal.tsx
git commit -m "refactor(location): integrate DeliveryLocationSelector into LocationModal"
```

---

### Task 3: Add Delivery Location Bar to Homepage

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Import and add the inline selector to the homepage**

Add the import:
```tsx
import { DeliveryLocationSelector } from '@/components/location/DeliveryLocationSelector';
```

Add the delivery location bar right before the Hero section (around line 349, before `<section className="px-4 md:px-0 mb-8">`). The bar sits between the quick-categories strip and the main hero+deals row:

```tsx
      {/* Delivery Location Bar */}
      <div className="max-w-[1700px] mx-auto px-4 md:px-6 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 dark:text-zinc-400 shrink-0">
            Teslimat Konumu
          </span>
          <DeliveryLocationSelector variant="inline" />
        </div>
      </div>
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | Select-String "Home.tsx" || echo "No errors in Home.tsx"`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat(home): add inline delivery location selector bar"
```

---

### Task 4: Type Check and Final Verification

**Files:**
- Verify: all modified files

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run existing tests to ensure no regressions**

Run: `npx vitest run --reporter=verbose 2>&1 | Select-Object -Last 30`
Expected: All existing tests pass (224+ tests)

- [ ] **Step 3: Start dev server and manually verify**

Run: `npx vite --host`
Open the homepage and verify:
- The delivery location bar appears between the quick categories and hero
- Clicking it opens the dropdown with: GPS button, country selector (4 markets), city search/dropdown
- Selecting "Türkiye" shows cascading il/ilçe dropdowns
- Selecting a city (e.g., "İstanbul") shows ilçe dropdown (Kadıköy, Beşiktaş, etc.)
- "Mevcut Konumumu Kullan" triggers browser geolocation
- On confirm, the bar updates and the location is saved to localStorage
- Navbar location button still works and opens the enhanced LocationModal

- [ ] **Step 4: Final commit if any fixes were made**

```bash
git add -A
git commit -m "chore(location): final adjustments and verification"
```

---

## Verification Checklist

- [ ] Country selector shows 4 markets (UK, TR, DE, US) with flags
- [ ] Switching to TR shows all 81 cities in the city dropdown
- [ ] Selecting a TR city shows its districts in the district dropdown
- [ ] Switching to UK/DE/US shows major cities list (no district dropdown)
- [ ] City search filters cities as you type
- [ ] GPS button triggers browser geolocation prompt
- [ ] GPS reverse geocodes via Nominatim and auto-fills country + city
- [ ] Confirm button updates LocationContext and localStorage
- [ ] Inline bar on homepage shows current location text
- [ ] Location persists across page reloads
- [ ] Navbar "Teslimat Konumu" modal still opens and works correctly
- [ ] Dark mode styling applies correctly
