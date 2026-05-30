import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TicketStatus = 'open' | 'pending' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface SupportTicket {
  id: string;
  customer: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string; // ISO
}

const MOCK_TICKETS: SupportTicket[] = [
  { id: 'TKT-501', customer: 'Mehmet Kaya', subject: 'Kargom gelmedi', message: 'Siparişim 5 gündür kargoda görünüyor, ulaşmadı.', status: 'open', priority: 'high', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'TKT-502', customer: 'Ayşe Demir', subject: 'İade süreci', message: 'Ürünü nasıl iade edebilirim?', status: 'pending', priority: 'medium', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'TKT-503', customer: 'Ali Yılmaz', subject: 'Fatura talebi', message: 'Siparişim için e-fatura alabilir miyim?', status: 'resolved', priority: 'low', createdAt: new Date(Date.now() - 172800000).toISOString() },
];

interface SupportStore {
  tickets: SupportTicket[];
  updateStatus: (id: string, status: TicketStatus) => void;
}

export const useSupportStore = create<SupportStore>()(
  persist(
    (set) => ({
      tickets: MOCK_TICKETS,
      updateStatus: (id, status) =>
        set((state) => ({
          tickets: state.tickets.map((t) => (t.id === id ? { ...t, status } : t)),
        })),
    }),
    { name: 'mercora-support-storage' }
  )
);
