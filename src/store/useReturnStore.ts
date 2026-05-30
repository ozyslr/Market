import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'refunded';

export interface ReturnRequest {
  id: string;
  orderId: string;
  buyerName: string;
  reason: string;
  amount: number;
  status: ReturnStatus;
  requestedAt: string; // ISO date
}

const MOCK_RETURNS: ReturnRequest[] = [
  { id: 'RET-1001', orderId: 'ORD-8823', buyerName: 'Marie L.', reason: 'Ürün hasarlı geldi', amount: 899.0, status: 'requested', requestedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'RET-1002', orderId: 'ORD-8821', buyerName: 'Alice M.', reason: 'Yanlış beden', amount: 124.99, status: 'requested', requestedAt: new Date(Date.now() - 43200000).toISOString() },
];

interface ReturnStore {
  returns: ReturnRequest[];
  createReturn: (input: Omit<ReturnRequest, 'id' | 'status' | 'requestedAt'>) => void;
  updateStatus: (id: string, status: ReturnStatus) => void;
}

export const useReturnStore = create<ReturnStore>()(
  persist(
    (set) => ({
      returns: MOCK_RETURNS,

      createReturn: (input) =>
        set((state) => ({
          returns: [
            { ...input, id: `RET-${Date.now()}`, status: 'requested', requestedAt: new Date().toISOString() },
            ...state.returns,
          ],
        })),

      updateStatus: (id, status) =>
        set((state) => ({
          returns: state.returns.map((r) => (r.id === id ? { ...r, status } : r)),
        })),
    }),
    { name: 'mercora-returns-storage' }
  )
);
