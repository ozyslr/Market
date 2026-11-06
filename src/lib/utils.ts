import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
