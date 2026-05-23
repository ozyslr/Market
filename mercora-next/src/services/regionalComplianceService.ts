/**
 * Regional Compliance Service (STREAM I)
 * Handles regional regulations and compliance requirements
 */

export interface ComplianceRequirements {
  region: string;
  gdpr: boolean;
  ccpa: boolean;
  lgpd: boolean;
  cookieConsent: boolean;
  ageVerification: boolean;
  minimumAge: number;
  dataRetentionDays: number;
  paymentMethods: string[];
  currency: string;
  taxSystem: 'vat' | 'gst' | 'salestax' | 'none';
  taxRate?: number;
  vatNumber?: boolean;
  invoiceRequired: boolean;
}

class RegionalComplianceService {
  private readonly COMPLIANCE_MAP: Record<string, ComplianceRequirements> = {
    // Europe - GDPR
    DE: {
      region: 'Germany',
      gdpr: true,
      ccpa: false,
      lgpd: false,
      cookieConsent: true,
      ageVerification: false,
      minimumAge: 13,
      dataRetentionDays: 30,
      paymentMethods: [
        'card',
        'sepa',
        'paypal',
        'ideal',
        'bancontact',
        'sofort',
      ],
      currency: 'EUR',
      taxSystem: 'vat',
      taxRate: 19,
      vatNumber: true,
      invoiceRequired: true,
    },
    FR: {
      region: 'France',
      gdpr: true,
      ccpa: false,
      lgpd: false,
      cookieConsent: true,
      ageVerification: false,
      minimumAge: 13,
      dataRetentionDays: 30,
      paymentMethods: [
        'card',
        'paypal',
        'ideal',
        'bancontact',
        'sofort',
        'klarna',
      ],
      currency: 'EUR',
      taxSystem: 'vat',
      taxRate: 20,
      vatNumber: true,
      invoiceRequired: true,
    },
    GB: {
      region: 'United Kingdom',
      gdpr: true,
      ccpa: false,
      lgpd: false,
      cookieConsent: true,
      ageVerification: false,
      minimumAge: 13,
      dataRetentionDays: 30,
      paymentMethods: [
        'card',
        'paypal',
        'apple_pay',
        'google_pay',
        'klarna',
      ],
      currency: 'GBP',
      taxSystem: 'vat',
      taxRate: 20,
      vatNumber: true,
      invoiceRequired: true,
    },

    // Turkey - Local Regulations
    TR: {
      region: 'Turkey',
      gdpr: false,
      ccpa: false,
      lgpd: false,
      cookieConsent: false,
      ageVerification: true,
      minimumAge: 18,
      dataRetentionDays: 365,
      paymentMethods: ['card', 'iyzico', 'paytr', 'bank_transfer'],
      currency: 'TRY',
      taxSystem: 'vat',
      taxRate: 18,
      vatNumber: true,
      invoiceRequired: true,
    },

    // US - CCPA
    US: {
      region: 'United States',
      gdpr: false,
      ccpa: true,
      lgpd: false,
      cookieConsent: true,
      ageVerification: false,
      minimumAge: 13,
      dataRetentionDays: 90,
      paymentMethods: [
        'card',
        'paypal',
        'apple_pay',
        'google_pay',
        'stripe',
      ],
      currency: 'USD',
      taxSystem: 'salestax',
      vatNumber: false,
      invoiceRequired: false,
    },

    // Brazil - LGPD
    BR: {
      region: 'Brazil',
      gdpr: false,
      ccpa: false,
      lgpd: true,
      cookieConsent: true,
      ageVerification: false,
      minimumAge: 13,
      dataRetentionDays: 30,
      paymentMethods: ['card', 'pix', 'boleto', 'bank_transfer'],
      currency: 'BRL',
      taxSystem: 'gst',
      taxRate: 15,
      vatNumber: true,
      invoiceRequired: true,
    },
  };

  /**
   * Get compliance requirements for a region
   */
  getRequirements(countryCode: string): ComplianceRequirements | null {
    return this.COMPLIANCE_MAP[countryCode] || null;
  }

  /**
   * Check if GDPR applies
   */
  isGDPRRequired(countryCode: string): boolean {
    const requirements = this.getRequirements(countryCode);
    return requirements?.gdpr || false;
  }

  /**
   * Check if cookie consent is required
   */
  isCookieConsentRequired(countryCode: string): boolean {
    const requirements = this.getRequirements(countryCode);
    return requirements?.cookieConsent || false;
  }

  /**
   * Get tax rate for region
   */
  getTaxRate(countryCode: string): number {
    const requirements = this.getRequirements(countryCode);
    return requirements?.taxRate || 0;
  }

  /**
   * Calculate tax amount
   */
  calculateTax(amount: number, countryCode: string): number {
    const taxRate = this.getTaxRate(countryCode);
    return (amount * taxRate) / 100;
  }

  /**
   * Get allowed payment methods for region
   */
  getAllowedPaymentMethods(countryCode: string): string[] {
    const requirements = this.getRequirements(countryCode);
    return requirements?.paymentMethods || ['card'];
  }

  /**
   * Check if payment method is allowed in region
   */
  isPaymentMethodAllowed(
    countryCode: string,
    paymentMethod: string
  ): boolean {
    const allowed = this.getAllowedPaymentMethods(countryCode);
    return allowed.includes(paymentMethod);
  }

  /**
   * Get data retention policy
   */
  getDataRetentionDays(countryCode: string): number {
    const requirements = this.getRequirements(countryCode);
    return requirements?.dataRetentionDays || 90;
  }

  /**
   * Get minimum user age
   */
  getMinimumAge(countryCode: string): number {
    const requirements = this.getRequirements(countryCode);
    return requirements?.minimumAge || 13;
  }

  /**
   * Check if invoice is required
   */
  isInvoiceRequired(countryCode: string): boolean {
    const requirements = this.getRequirements(countryCode);
    return requirements?.invoiceRequired || false;
  }

  /**
   * Generate privacy policy text for region
   */
  getPrivacyPolicyText(countryCode: string): string {
    const requirements = this.getRequirements(countryCode);

    if (!requirements) {
      return 'Please review our privacy policy for more information.';
    }

    const policies: string[] = [];

    if (requirements.gdpr) {
      policies.push(
        'This service complies with GDPR. You have the right to access, rectify, and delete your personal data.'
      );
    }

    if (requirements.ccpa) {
      policies.push(
        'This service complies with CCPA. You have the right to know, delete, and opt-out of the sale of your personal information.'
      );
    }

    if (requirements.lgpd) {
      policies.push(
        'This service complies with LGPD. You have the right to access and delete your personal data.'
      );
    }

    if (requirements.cookieConsent) {
      policies.push(
        'We use cookies and similar technologies to enhance your experience. You can manage your cookie preferences at any time.'
      );
    }

    return policies.join(' ');
  }

  /**
   * List all supported regions
   */
  listSupportedRegions(): Array<{ code: string; name: string }> {
    return Object.entries(this.COMPLIANCE_MAP).map(([code, req]) => ({
      code,
      name: req.region,
    }));
  }
}

export const regionalComplianceService = new RegionalComplianceService();
