import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
}

interface SettingsStore {
  siteName: string;
  supportEmail: string;
  commissionRate: number; // %
  currency: string;
  maintenanceMode: boolean;
  integrations: Integration[];
  updateSettings: (patch: Partial<Pick<SettingsStore, 'siteName' | 'supportEmail' | 'commissionRate' | 'currency' | 'maintenanceMode'>>) => void;
  toggleIntegration: (id: string) => void;
}

const DEFAULT_INTEGRATIONS: Integration[] = [
  { id: 'stripe', name: 'Stripe', description: 'Kredi kartı ödeme altyapısı', connected: true },
  { id: 'iyzico', name: 'iyzico', description: 'Türkiye ödeme & taksit', connected: true },
  { id: 'mailchimp', name: 'Mailchimp', description: 'E-posta pazarlama', connected: false },
  { id: 'ga4', name: 'Google Analytics 4', description: 'Web analitiği', connected: true },
  { id: 'meta', name: 'Meta Pixel', description: 'Reklam dönüşüm takibi', connected: false },
  { id: 'shipping', name: 'Aras Kargo API', description: 'Kargo entegrasyonu', connected: true },
];

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      siteName: 'Mercora',
      supportEmail: 'destek@mercora.com',
      commissionRate: 15,
      currency: 'TRY',
      maintenanceMode: false,
      integrations: DEFAULT_INTEGRATIONS,
      updateSettings: (patch) => set(patch),
      toggleIntegration: (id) =>
        set((state) => ({
          integrations: state.integrations.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i)),
        })),
    }),
    { name: 'mercora-settings-storage' }
  )
);
