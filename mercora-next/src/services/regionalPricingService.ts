/**
 * Regional Pricing Service (STREAM I)
 * Handles region-specific pricing strategies and currency conversion
 */

export interface RegionalPrice {
  basePrice: number;
  currency: string;
  region: string;
  adjustment: number; // percentage adjustment for region
  finalPrice: number;
}

class RegionalPricingService {
  private readonly EXCHANGE_RATES: Record<string, number> = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    TRY: 32.5,
    BRL: 5.1,
    AED: 3.67,
    CNY: 7.24,
    MXN: 17.5,
  };

  private readonly REGIONAL_ADJUSTMENTS: Record<string, number> = {
    // Purchasing power adjustments (-)
    TR: -0.25, // 25% lower in Turkey
    BR: -0.15, // 15% lower in Brazil
    MX: -0.1, // 10% lower in Mexico

    // Premium pricing (+)
    GB: 0.05, // 5% higher in UK
    FR: 0.0, // Standard in France
    DE: 0.0, // Standard in Germany
    US: 0.0, // Base price
  };

  private readonly VOLUME_DISCOUNTS: Record<number, number> = {
    1: 0,
    5: 0.05,
    10: 0.1,
    25: 0.15,
    50: 0.2,
    100: 0.25,
  };

  /**
   * Get exchange rate for currency
   */
  getExchangeRate(currency: string): number {
    return this.EXCHANGE_RATES[currency] || 1.0;
  }

  /**
   * Convert price between currencies
   */
  convertPrice(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number {
    const fromRate = this.getExchangeRate(fromCurrency);
    const toRate = this.getExchangeRate(toCurrency);
    return (amount / fromRate) * toRate;
  }

  /**
   * Get regional price adjustment
   */
  getRegionalAdjustment(countryCode: string): number {
    return this.REGIONAL_ADJUSTMENTS[countryCode] || 0;
  }

  /**
   * Calculate regional price
   */
  calculateRegionalPrice(
    basePrice: number,
    currency: string,
    countryCode: string,
    usdBasePrice: number = basePrice
  ): RegionalPrice {
    // Convert to target currency
    const convertedPrice = this.convertPrice('USD', currency, basePrice);

    // Apply regional adjustment
    const adjustment = this.getRegionalAdjustment(countryCode);
    const adjustedPrice = convertedPrice * (1 + adjustment);

    // Round to 2 decimals
    const finalPrice = Math.round(adjustedPrice * 100) / 100;

    return {
      basePrice,
      currency,
      region: countryCode,
      adjustment,
      finalPrice,
    };
  }

  /**
   * Get volume discount percentage
   */
  getVolumeDiscount(quantity: number): number {
    const discounts = Object.entries(this.VOLUME_DISCOUNTS)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

    for (const [qty, discount] of discounts) {
      if (quantity >= parseInt(qty)) {
        return discount;
      }
    }

    return 0;
  }

  /**
   * Calculate bulk pricing
   */
  calculateBulkPrice(
    unitPrice: number,
    quantity: number,
    currency: string,
    countryCode: string
  ): {
    unitPrice: number;
    discount: number;
    subtotal: number;
    tax: number;
    total: number;
  } {
    // Get regional price for unit
    const regionalPrice = this.calculateRegionalPrice(
      unitPrice,
      currency,
      countryCode
    );

    // Apply volume discount
    const volumeDiscount = this.getVolumeDiscount(quantity);
    const discountedPrice = regionalPrice.finalPrice * (1 - volumeDiscount);

    // Calculate subtotal
    const subtotal = discountedPrice * quantity;

    // Estimate tax (basic calculation)
    const taxRate = this.estimateTaxRate(countryCode);
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + tax;

    return {
      unitPrice: Math.round(discountedPrice * 100) / 100,
      discount: volumeDiscount,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Estimate tax rate for region (basic)
   */
  private estimateTaxRate(countryCode: string): number {
    const taxRates: Record<string, number> = {
      DE: 19,
      FR: 20,
      GB: 20,
      TR: 18,
      BR: 15,
      US: 7.5,
      MX: 16,
    };

    return taxRates[countryCode] || 0;
  }

  /**
   * Get recommended price in region
   * Considers local purchasing power and market conditions
   */
  getRecommendedPrice(
    basePriceUSD: number,
    countryCode: string
  ): {
    price: number;
    currency: string;
    rationale: string;
  } {
    const adjustment = this.getRegionalAdjustment(countryCode);
    const currency = this.getCountryCurrency(countryCode);
    const exchangeRate = this.getExchangeRate(currency);

    const baseConverted = basePriceUSD * exchangeRate;
    const adjustedPrice = baseConverted * (1 + adjustment);
    const roundedPrice = Math.round(adjustedPrice * 100) / 100;

    let rationale = 'Price adjusted based on local market conditions';
    if (adjustment > 0) {
      rationale = `Premium pricing (${(adjustment * 100).toFixed(0)}% above base)`;
    } else if (adjustment < 0) {
      rationale = `Adjusted for local purchasing power (${(adjustment * 100).toFixed(0)}%)`;
    }

    return {
      price: roundedPrice,
      currency,
      rationale,
    };
  }

  /**
   * Get currency for country
   */
  private getCountryCurrency(countryCode: string): string {
    const currencyMap: Record<string, string> = {
      DE: 'EUR',
      FR: 'EUR',
      GB: 'GBP',
      TR: 'TRY',
      BR: 'BRL',
      US: 'USD',
      MX: 'MXN',
      AE: 'AED',
      CN: 'CNY',
    };

    return currencyMap[countryCode] || 'USD';
  }

  /**
   * List supported currencies
   */
  listSupportedCurrencies(): Array<{
    code: string;
    rate: number;
  }> {
    return Object.entries(this.EXCHANGE_RATES).map(([code, rate]) => ({
      code,
      rate,
    }));
  }
}

export const regionalPricingService = new RegionalPricingService();
