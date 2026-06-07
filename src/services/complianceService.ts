import { getHsCode, getHsCodeLabel } from '../data/hsCodes';

// Restricted categories by destination
const RESTRICTIONS: Record<string, { blockedCountries: string[]; reason: string }> = {
  'food-beverage': {
    blockedCountries: ['DE', 'FR', 'NL', 'BE', 'AT', 'DK', 'SE', 'FI'],
    reason: 'Gıda ürünleri AB gümrük denetimi gerektirir ve şu an gönderilemez.',
  },
  cosmetics: {
    blockedCountries: ['DE', 'FR'],
    reason: 'Kozmetik ürünleri GPSR belgesi olmadan AB ülkelerine gönderilemez.',
  },
};

export async function isProductEligible(
  productId: string,
  destinationCountry: string,
): Promise<boolean> {
  const reason = await getRestrictionReason(productId, destinationCountry);
  return reason === null;
}

export async function getRestrictionReason(
  productId: string,
  destinationCountry: string,
): Promise<string | null> {
  // For MVP: check stored restrictions by category
  // In production this would query product data
  for (const [, rule] of Object.entries(RESTRICTIONS)) {
    if (rule.blockedCountries.includes(destinationCountry)) {
      return rule.reason;
    }
  }
  return null;
}

export function isGpsrCompliant(product: any): boolean {
  return !!(product.gpsrRepName && product.gpsrRepAddress && product.gpsrSafetyDoc);
}

export function getGpsrInfo(product: any): {
  repName: string;
  repAddress: string;
  repEmail: string;
  safetyDoc: string;
  declarationDate: string;
} | null {
  if (!isGpsrCompliant(product)) return null;
  return {
    repName: product.gpsrRepName,
    repAddress: product.gpsrRepAddress,
    repEmail: product.gpsrRepEmail || '',
    safetyDoc: product.gpsrSafetyDoc,
    declarationDate: product.gpsrDeclarationDate || '',
  };
}

export { getHsCode, getHsCodeLabel };
