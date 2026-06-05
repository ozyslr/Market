import React from 'react';
import type { Address, AddressType } from '@/types';
import type { ShippingAddress } from '@/types/order';
import { cn } from '@/lib/utils';
import { MapPin, Search, Loader2, Plus, Check, Home, Briefcase } from 'lucide-react';

export interface AddressSelectorProps {
  address: ShippingAddress;
  onAddressChange: (updates: Partial<ShippingAddress>) => void;
  selectedAddressId: string | null;
  onSelectSavedAddress: (addr: Address) => void;
  showNewAddressForm: boolean;
  onToggleNewAddressForm: () => void;
  postcodeLookupLoading: boolean;
  postcodeLookupError: string;
  onPostcodeLookup: () => void;
  onPostcodeErrorClear: () => void;
  saveAddress: boolean;
  onToggleSaveAddress: () => void;
  savedAddresses: Address[];
  defaultAddressId: string;
  showSaveCheckbox: boolean;
  addressType?: AddressType;
  onAddressTypeChange?: (type: AddressType) => void;
}

export function AddressSelector({
  address,
  onAddressChange,
  selectedAddressId,
  onSelectSavedAddress,
  showNewAddressForm,
  onToggleNewAddressForm,
  postcodeLookupLoading,
  postcodeLookupError,
  onPostcodeLookup,
  onPostcodeErrorClear,
  saveAddress,
  onToggleSaveAddress,
  savedAddresses,
  defaultAddressId,
  showSaveCheckbox,
  addressType = 'home',
  onAddressTypeChange,
}: AddressSelectorProps) {
  const TYPE_CONFIG: Record<AddressType, { icon: typeof Home; label: string }> = {
    home: { icon: Home, label: 'Ev' },
    work: { icon: Briefcase, label: 'İş' },
    other: { icon: MapPin, label: 'Diğer' },
  };
  const resolvedType = (addressType || 'home') as AddressType;

  return (
    <>
      {/* Saved Addresses */}
      {savedAddresses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/50">
              Kayıtlı Adreslerim
            </p>
            <button
              type="button"
              onClick={onToggleNewAddressForm}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-accent hover:text-accent/80 transition-colors"
            >
              <Plus size={12} /> Yeni Adres
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedAddresses.map((addr) => (
              <button
                key={addr.id}
                type="button"
                onClick={() => onSelectSavedAddress(addr)}
                className={cn(
                  'relative text-start px-4 py-3.5 rounded-2xl border-2 transition-all text-xs group',
                  selectedAddressId === addr.id
                    ? 'border-accent bg-accent/5 shadow-sm'
                    : 'border-[#1A1033]/10 bg-[#F8F8FA] hover:border-accent/40',
                )}
              >
                {selectedAddressId === addr.id && (
                  <span className="absolute top-3 end-3 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </span>
                )}
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin size={10} className="text-accent shrink-0" />
                  <span className="font-black text-[#1A1033] text-[11px]">{addr.label}</span>
                  {/* Address type badge */}
                  {(() => {
                    const t = (addr.type || 'home') as AddressType;
                    const cfg = TYPE_CONFIG[t];
                    const Icon = cfg.icon;
                    return (
                      <span className="text-[9px] bg-[#1A1033]/5 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-medium text-[#1A1033]/50">
                        <Icon size={9} />
                        {cfg.label}
                      </span>
                    );
                  })()}
                  {addr.id === defaultAddressId && (
                    <span className="ms-1 text-[8px] font-black uppercase tracking-widest bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">
                      Varsayılan
                    </span>
                  )}
                </div>
                <p className="text-[#1A1033]/50 font-medium leading-tight">{addr.line1}</p>
                <p className="text-[#1A1033]/40 font-medium">
                  {addr.city}, {addr.postalCode} &middot; {addr.country}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New address form — shown when no saved addresses or user clicked "+ Yeni Adres" */}
      {(savedAddresses.length === 0 || showNewAddressForm || !selectedAddressId) && (
        <div className="space-y-4">
          {savedAddresses.length > 0 && showNewAddressForm && (
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 pt-2 border-t border-[#1A1033]/5">
              Yeni Teslimat Adresi
            </p>
          )}

          {/* Address type selector chips */}
          <div className="flex gap-2">
            {(['home', 'work', 'other'] as AddressType[]).map((t) => {
              const cfg = TYPE_CONFIG[t];
              const Icon = cfg.icon;
              const active = resolvedType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onAddressTypeChange?.(t)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors',
                    active
                      ? 'bg-accent text-white'
                      : 'bg-[#F8F8FA] text-[#1A1033]/60 hover:bg-[#1A1033]/5',
                  )}
                >
                  <Icon size={12} />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">
                Ad Soyad
              </label>
              <input
                required
                type="text"
                autoComplete="name"
                value={address.fullName}
                onChange={(e) => onAddressChange({ fullName: e.target.value })}
                className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">
                Telefon
              </label>
              <input
                required
                type="tel"
                autoComplete="tel"
                value={address.phone}
                onChange={(e) => onAddressChange({ phone: e.target.value })}
                className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">
              Sokak / Cadde
            </label>
            <input
              required
              type="text"
              autoComplete="address-line1"
              value={address.line1}
              onChange={(e) => onAddressChange({ line1: e.target.value })}
              placeholder="123 Node Ave"
              className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none"
            />
          </div>

          {/* Postal Code + Lookup */}
          <div>
            <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">
              Posta Kodu
            </label>
            <div className="flex gap-2">
              <input
                required
                type="text"
                autoComplete="postal-code"
                value={address.postalCode}
                onChange={(e) => {
                  onAddressChange({ postalCode: e.target.value });
                  onPostcodeErrorClear();
                }}
                placeholder="SW1A 1AA"
                className="flex-1 px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none uppercase"
              />
              <button
                type="button"
                onClick={onPostcodeLookup}
                disabled={postcodeLookupLoading || !address.postalCode.trim()}
                title="Adresi otomatik doldur"
                className="px-4 py-3 bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent/90 disabled:opacity-40 transition-colors flex items-center gap-1.5 shrink-0"
              >
                {postcodeLookupLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
                Bul
              </button>
            </div>
            {postcodeLookupError && (
              <p className="text-[10px] text-red-500 font-bold mt-1">{postcodeLookupError}</p>
            )}
            <p className="text-[9px] text-[#1A1033]/30 font-bold mt-1 uppercase tracking-widest">
              UK posta kodu &rarr; şehir/bölge otomatik dolar
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">
                Şehir
              </label>
              <input
                required
                type="text"
                autoComplete="address-level2"
                value={address.city}
                onChange={(e) => onAddressChange({ city: e.target.value })}
                className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">
                Bölge / İlçe
              </label>
              <input
                type="text"
                autoComplete="address-level1"
                value={address.state}
                onChange={(e) => onAddressChange({ state: e.target.value })}
                className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none"
              />
            </div>
          </div>

          {/* Save address checkbox */}
          {showSaveCheckbox && (
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={onToggleSaveAddress}
                className={cn(
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0',
                  saveAddress
                    ? 'bg-accent border-accent'
                    : 'border-[#1A1033]/20 group-hover:border-accent/50',
                )}
              >
                {saveAddress && <Check size={11} className="text-white" />}
              </div>
              <span className="text-[11px] font-bold text-[#1A1033]/60 group-hover:text-[#1A1033] transition-colors">
                Bu adresi profilime kaydet
              </span>
            </label>
          )}
        </div>
      )}
    </>
  );
}
