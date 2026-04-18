import { MarketContext, TaxCalculation } from '@/types';

export const MARKETS: Record<string, MarketContext> = {
  UK: {
    country: 'United Kingdom',
    currency: 'GBP',
    language: 'English',
    vatRate: 0.20,
    importTaxThreshold: 135,
  },
  DE: {
    country: 'Germany',
    currency: 'EUR',
    language: 'German',
    vatRate: 0.19,
    importTaxThreshold: 150,
  },
  TR: {
    country: 'Turkey',
    currency: 'TRY',
    language: 'Turkish',
    vatRate: 0.20,
    importTaxThreshold: 30, // Example threshold
  },
  US: {
    country: 'USA',
    currency: 'USD',
    language: 'English',
    vatRate: 0.0, // Sales tax varies, simplified for MVP
    importTaxThreshold: 800,
  }
};

export function calculateTotal(
  price: number,
  shippingCost: number,
  market: MarketContext,
  isDomestic: boolean
): TaxCalculation {
  const subtotal = price;
  const shipping = shippingCost;
  
  // Simplified logic for MVP
  const vat = subtotal * market.vatRate;
  
  let customs = 0;
  let handlingFee = 0;

  if (!isDomestic && subtotal > market.importTaxThreshold) {
    customs = subtotal * 0.05; // 5% flat example
    handlingFee = 6; // Flat £6/€6 fee for customs processing
  }

  return {
    subtotal,
    shipping,
    vat,
    customs,
    handlingFee,
    total: subtotal + shipping + vat + customs + handlingFee,
  };
}
