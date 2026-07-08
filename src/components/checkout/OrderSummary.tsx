import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';
import type { CartCampaign, Coupon } from '@/types';
import type { ShippingRate, CargoProviderName } from '@/services/cargoService';
import { cn } from '@/lib/utils';
import { ShippingSection } from './ShippingSection';

export interface CartGift {
  name: string;
  quantity: number;
  productId?: string;
  image?: string;
}

export interface OrderSummaryProps {
  cartProducts: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
  }>;
  cartCampaigns: CartCampaign[];
  cartGifts: CartGift[];
  couponCode: string;
  onCouponCodeChange: (code: string) => void;
  couponError: string;
  couponLoading: boolean;
  appliedCoupon: Coupon | null;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  discountAmount: number;
  cartCampaignDiscount: number;
  totals: { subtotal: number; shipping: number; vat: number; total: number };
  curSym: string;
  ratesLoading: boolean;
  shipRates: ShippingRate[];
  selectedCarrier: CargoProviderName | null;
  onSelectCarrier: (carrier: CargoProviderName) => void;
  convertTRY: (tryAmount: number) => number;
}

export function OrderSummary({
  cartProducts,
  cartCampaigns,
  cartGifts,
  couponCode,
  onCouponCodeChange,
  couponError,
  couponLoading,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  discountAmount,
  cartCampaignDiscount,
  totals,
  curSym,
  ratesLoading,
  shipRates,
  selectedCarrier,
  onSelectCarrier,
  convertTRY,
}: OrderSummaryProps) {
  return (
    <>
      <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1033] mb-6">
        Order Summary
      </h3>

      <div className="space-y-3 mb-6">
        {cartProducts.map(p => (
          <div key={p.id} className="flex justify-between text-xs gap-2">
            <span className="text-[#1A1033]/50 font-medium truncate">
              {p.title} &times;{p.quantity}
            </span>
            <span className="font-black text-[#1A1033] shrink-0">
              &pound;{(p.price * p.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Cart Campaign Discounts (auto-applied) */}
      {cartCampaigns.length > 0 && (
        <div className="mb-4 space-y-2">
          {cartCampaigns.map((cc, idx) => (
            <div key={idx} className="bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-green-700">{cc.campaign.name}</span>
                <span className="text-[10px] font-black text-green-600">
                  -{cc.discountAmount.toFixed(2)} &#8378;
                </span>
              </div>
            </div>
          ))}
          {cartGifts.map((gift, idx) => (
            <div
              key={idx}
              className="bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 flex items-center gap-2"
            >
              <span>{'\uD83C\uDF81'}</span>
              <span className="text-[10px] font-black text-purple-700">
                {gift.name} x{gift.quantity}
              </span>
              <span className="text-[9px] text-purple-500 ms-auto">Hediye</span>
            </div>
          ))}
        </div>
      )}

      {/* Coupon Code */}
      <div className="mb-4">
        {!appliedCoupon ? (
          <div className="flex gap-2">
            <input
              value={couponCode}
              onChange={e => onCouponCodeChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onApplyCoupon()}
              placeholder="Kupon kodu"
              className="flex-1 px-3 py-2 bg-[#F8F8FA] rounded-xl text-xs font-bold outline-none border border-transparent focus:border-accent/20 uppercase"
            />
            <button
              onClick={onApplyCoupon}
              disabled={couponLoading || !couponCode.trim()}
              className="px-4 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-50 hover:scale-105 transition-all"
            >
              {couponLoading ? '...' : 'Uygula'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            <span className="text-xs font-black text-green-700">
              {appliedCoupon.code} &mdash; -{discountAmount.toFixed(2)} &#8378; indirim
            </span>
            <button
              onClick={onRemoveCoupon}
              className="text-[10px] text-green-700/60 hover:text-red-500 font-bold"
            >
              &#10005;
            </button>
          </div>
        )}
        {couponError && (
          <p className="text-[10px] text-red-500 font-bold mt-1">{couponError}</p>
        )}
      </div>

      <ShippingSection
        ratesLoading={ratesLoading}
        shipRates={shipRates}
        selectedCarrier={selectedCarrier}
        onSelectCarrier={onSelectCarrier}
        curSym={curSym}
        convertTRY={convertTRY}
      />

      <div className="space-y-4 mb-6 pt-4 border-t border-[#1A1033]/5">
        <div className="flex justify-between text-sm">
          <span className="text-[#1A1033]/40 font-bold">Subtotal</span>
          <span className="font-black text-[#1A1033]">
            &pound;{totals.subtotal.toFixed(2)}
          </span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600 font-bold">Kupon İndirimi</span>
            <span className="font-black text-green-600">
              -{discountAmount.toFixed(2)} &#8378;
            </span>
          </div>
        )}
        {cartCampaignDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600 font-bold">Sepet Kampanyası</span>
            <span className="font-black text-green-600">
              -{cartCampaignDiscount.toFixed(2)} &#8378;
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-[#1A1033]/40 font-bold">Logistics</span>
          <span className="font-black text-[#1A1033]">
            {curSym}{totals.shipping.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#1A1033]/40 font-bold">VAT</span>
          <span className="font-black text-[#1A1033]">
            &pound;{totals.vat.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="pt-6 border-t border-[#1A1033]/5 flex justify-between items-center mb-8">
        <span className="text-xs font-black uppercase tracking-widest text-[#1A1033]">Total</span>
        <span className="text-2xl font-display font-black text-accent">
          {curSym}{totals.total.toFixed(2)}
        </span>
      </div>

      <div className="flex items-center gap-3 bg-[#F8F8FA] p-4 rounded-xl">
        <ShieldCheck className="text-[#1A1033]/30 shrink-0" size={20} />
        <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 leading-relaxed">
          256-bit Node Encryption active. Multi-sig escrow holding.
        </p>
      </div>
    </>
  );
}
