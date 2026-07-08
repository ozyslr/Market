import React from 'react';

interface UnitPriceProps {
  price: number;
  unitAmount: number;
  unitLabel: string;
  currency?: string;
}

export function UnitPrice({
  price,
  unitAmount,
  unitLabel,
  currency = 'gbp',
}: UnitPriceProps) {
  const symbol = currency === 'gbp' ? '£' : currency === 'try' ? '₺' : currency;
  const unitPrice = price / unitAmount;

  return (
    <p className="text-[10px] font-bold text-brand-primary/40 mt-1">
      ({unitPrice.toFixed(2)} {symbol} / {unitLabel})
    </p>
  );
}
