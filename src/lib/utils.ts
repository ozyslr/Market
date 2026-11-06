import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Turkish lira price as shown on product cards: "1.299,00 TL". */
export const formatTL = (n: number) =>
  `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;

/** Discount in whole percent: from oldPrice when set (always current), else the stored value. */
export function discountPercent(p: {
  price: number;
  oldPrice?: number;
  discountPercentage?: number;
}): number {
  if (p.oldPrice && p.oldPrice > p.price) {
    return Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
  }
  return p.discountPercentage ?? 0;
}
