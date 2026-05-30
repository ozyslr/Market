import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Campaign {
  id: string;
  title: string;
  discountPercent: number;
  startDate: string; // ISO
  endDate: string; // ISO
  active: boolean;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 'CMP-1', title: 'Yaz İndirimi', discountPercent: 25, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 7 * 86400000).toISOString(), active: true },
  { id: 'CMP-2', title: 'Elektronik Festivali', discountPercent: 15, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 14 * 86400000).toISOString(), active: false },
];

interface CampaignStore {
  campaigns: Campaign[];
  addCampaign: (input: Omit<Campaign, 'id' | 'active'>) => void;
  toggleActive: (id: string) => void;
  removeCampaign: (id: string) => void;
}

export const useCampaignStore = create<CampaignStore>()(
  persist(
    (set) => ({
      campaigns: MOCK_CAMPAIGNS,
      addCampaign: (input) =>
        set((state) => ({
          campaigns: [{ ...input, id: `CMP-${Date.now()}`, active: true }, ...state.campaigns],
        })),
      toggleActive: (id) =>
        set((state) => ({
          campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, active: !c.active } : c)),
        })),
      removeCampaign: (id) =>
        set((state) => ({ campaigns: state.campaigns.filter((c) => c.id !== id) })),
    }),
    { name: 'mercora-campaigns-storage' }
  )
);
