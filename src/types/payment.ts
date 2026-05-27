export type ProviderKey = 'stripe' | 'iyzico' | 'paytr' | 'sipay' | 'manual';

export interface InstallmentOption {
  binNumber: string;
  price: number;
  totalPrice: number;
  installmentNumber: number;
  installmentRate: number;
  merchantCommissionRate: number;
  merchantCommissionAmount: number;
}

export interface PaymentProvider {
  id: string;
  key: ProviderKey;
  name: string;
  active: boolean;
  regions: string[]; // 'TR' | 'EU' | 'UK' | 'US' | 'GLOBAL'
  config: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderTemplate {
  key: ProviderKey;
  name: string;
  description: string;
  regions: string[];
  color: string;
  configFields: {
    key: string;
    label: string;
    sensitive?: boolean;
    placeholder?: string;
  }[];
}

export const PROVIDER_TEMPLATES: ProviderTemplate[] = [
  {
    key: 'stripe',
    name: 'Stripe',
    description: 'Avrupa, UK, ABD ödemeleri için lider ödeme altyapısı',
    regions: ['EU', 'UK', 'US'],
    color: '#635BFF',
    configFields: [
      { key: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_test_...' },
      { key: 'secretKey', label: 'Secret Key', sensitive: true, placeholder: 'sk_test_...' },
      { key: 'webhookSecret', label: 'Webhook Secret', sensitive: true, placeholder: 'whsec_...' },
    ],
  },
  {
    key: 'iyzico',
    name: 'iyzico',
    description: "Türkiye'nin en yaygın ödeme çözümü — kart, 3D, taksit",
    regions: ['TR'],
    color: '#FF6A00',
    configFields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'sandbox-...' },
      { key: 'secretKey', label: 'Secret Key', sensitive: true, placeholder: 'sandbox-...' },
      { key: 'baseUrl', label: 'Base URL', placeholder: 'https://sandbox.iyzipay.com' },
    ],
  },
  {
    key: 'paytr',
    name: 'PayTR',
    description: 'Türkiye sanal POS — yüksek başarı oranı, taksit',
    regions: ['TR'],
    color: '#0072CE',
    configFields: [
      { key: 'merchantId', label: 'Mağaza ID', placeholder: '123456' },
      { key: 'merchantKey', label: 'Mağaza Key', sensitive: true, placeholder: 'xxxxxxxx' },
      { key: 'merchantSalt', label: 'Mağaza Salt', sensitive: true, placeholder: 'xxxxxxxx' },
    ],
  },
  {
    key: 'sipay',
    name: 'Sipay',
    description: 'Türkiye çok kanallı ödeme platformu',
    regions: ['TR'],
    color: '#00B274',
    configFields: [
      { key: 'appKey', label: 'App Key', placeholder: 'app_key_...' },
      { key: 'appSecret', label: 'App Secret', sensitive: true, placeholder: 'app_secret_...' },
      { key: 'merchantKey', label: 'Merchant Key', placeholder: 'merchant_key_...' },
    ],
  },
  {
    key: 'manual',
    name: 'Havale / EFT',
    description: 'Banka havalesi ile manuel ödeme — tüm bölgeler',
    regions: ['TR', 'EU', 'UK', 'US', 'GLOBAL'],
    color: '#6B7280',
    configFields: [
      { key: 'bankName', label: 'Banka Adı', placeholder: 'Ziraat Bankası' },
      { key: 'iban', label: 'IBAN', placeholder: 'TR00 0000 0000 0000 0000 0000 00' },
      { key: 'accountHolder', label: 'Hesap Sahibi', placeholder: 'Benim Olan Ltd.' },
      { key: 'instructions', label: 'Ödeme Açıklaması', placeholder: 'Sipariş numaranızı açıklamaya yazınız.' },
    ],
  },
];
