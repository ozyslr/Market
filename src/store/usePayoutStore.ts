import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const COMMISSION_RATE = 0.15; // %15 platform komisyonu
export const MIN_PAYOUT = 100; // minimum çekim tutarı (₺)

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'rejected';

export interface BankAccount {
  holder: string; // hesap sahibi adı
  iban: string;
  bankName: string;
}

export interface PayoutRequest {
  id: string;
  amount: number;
  iban: string;
  status: PayoutStatus;
  requestedAt: string; // ISO date
  paidAt?: string;
}

interface PayoutStore {
  bankAccount: BankAccount | null;
  withdrawn: number; // toplam çekilen (talep edilen) tutar
  requests: PayoutRequest[];
  error: string | null;

  setBankAccount: (account: BankAccount) => void;
  /** Çekilebilir bakiyeyi hesaplar: ciro - komisyon - daha önce çekilen. */
  getAvailableBalance: (grossRevenue: number) => number;
  requestPayout: (amount: number, grossRevenue: number) => boolean;
  /** Admin: çekim talebinin durumunu günceller. */
  updateRequestStatus: (id: string, status: PayoutStatus) => void;
}

const IBAN_REGEX = /^TR\d{24}$/;

export function normalizeIban(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

export const usePayoutStore = create<PayoutStore>()(
  persist(
    (set, get) => ({
      bankAccount: null,
      withdrawn: 0,
      requests: [],
      error: null,

      setBankAccount: (account) =>
        set({
          bankAccount: {
            holder: account.holder.trim(),
            iban: normalizeIban(account.iban),
            bankName: account.bankName.trim(),
          },
          error: null,
        }),

      getAvailableBalance: (grossRevenue) => {
        const net = grossRevenue * (1 - COMMISSION_RATE);
        return Math.max(0, net - get().withdrawn);
      },

      requestPayout: (amount, grossRevenue) => {
        const { bankAccount, withdrawn, requests } = get();
        if (!bankAccount) {
          set({ error: 'Önce banka hesabı eklemelisiniz.' });
          return false;
        }
        if (!IBAN_REGEX.test(bankAccount.iban)) {
          set({ error: 'Geçersiz IBAN. TR ile başlamalı ve 26 karakter olmalı.' });
          return false;
        }
        if (amount < MIN_PAYOUT) {
          set({ error: `Minimum çekim tutarı ${MIN_PAYOUT}₺.` });
          return false;
        }
        const available = Math.max(0, grossRevenue * (1 - COMMISSION_RATE) - withdrawn);
        if (amount > available) {
          set({ error: 'Çekilebilir bakiyeyi aşamazsınız.' });
          return false;
        }
        const request: PayoutRequest = {
          id: `PO-${Date.now()}`,
          amount,
          iban: bankAccount.iban,
          status: 'pending',
          requestedAt: new Date().toISOString(),
        };
        set({
          requests: [request, ...requests],
          withdrawn: withdrawn + amount,
          error: null,
        });
        return true;
      },

      updateRequestStatus: (id, status) =>
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id ? { ...r, status, paidAt: status === 'paid' ? new Date().toISOString() : r.paidAt } : r
          ),
        })),
    }),
    {
      name: 'mercora-payout-storage',
      partialize: (state) => ({
        bankAccount: state.bankAccount,
        withdrawn: state.withdrawn,
        requests: state.requests,
      }),
    }
  )
);
