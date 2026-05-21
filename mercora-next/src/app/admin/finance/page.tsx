'use client';
import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft, Loader2, AlertCircle, Banknote } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

interface Transaction {
  id: string;
  date: string;
  type: 'commission' | 'payout' | 'refund';
  amount: number;
  seller: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
}

interface FinanceSummary {
  totalRevenue: number;
  pendingPayments: number;
  paidAmount: number;
  totalCommission: number;
}

const typeLabels: Record<string, string> = { commission: 'Komisyon', payout: 'Odeme', refund: 'Iade' };
const statusLabels: Record<string, string> = { pending: 'Bekliyor', completed: 'Tamamlandi', failed: 'Basarisiz' };
const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700' };

export default function FinancePage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const tq = query(collection(db, 'payouts'), orderBy('createdAt', 'desc'), limit(100));
      const tSnap = await getDocs(tq);
      const txns = tSnap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          date: data.createdAt?.toDate?.()?.toISOString?.()?.split('T')[0] || new Date().toISOString().split('T')[0],
          type: data.type || 'payout',
          amount: data.amount || 0,
          seller: data.sellerName || data.sellerId || '-',
          description: data.description || '',
          status: data.status || 'completed',
        } as Transaction;
      });
      setTransactions(txns);
      setSummary({
        totalRevenue: txns.filter(t => t.type === 'payout').reduce((a, t) => a + t.amount, 0),
        pendingPayments: txns.filter(t => t.status === 'pending').reduce((a, t) => a + t.amount, 0),
        paidAmount: txns.filter(t => t.status === 'completed' && t.type === 'payout').reduce((a, t) => a + t.amount, 0),
        totalCommission: txns.filter(t => t.type === 'commission').reduce((a, t) => a + t.amount, 0),
      });
    } catch {
      setError('Finans verileri yuklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-700 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold">{error}</p>
          <button onClick={load} className="mt-4 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors">Tekrar Dene</button>
        </div>
      </div>
    );
  }

  const cards = [
    { label: 'Toplam Ciro', value: summary?.totalRevenue ?? 0, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Bekleyen Odemeler', value: summary?.pendingPayments ?? 0, icon: Wallet, color: 'text-yellow-600' },
    { label: 'Odenen Tutar', value: summary?.paidAmount ?? 0, icon: ArrowUpRight, color: 'text-blue-600' },
    { label: 'Komisyon Toplami', value: summary?.totalCommission ?? 0, icon: Banknote, color: 'text-purple-700' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Finans</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{card.label}</span>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(card.value)}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Islemler</h2>
          </div>
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <Banknote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Henuz islem yok.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-5 py-3 font-medium">Tarih</th>
                    <th className="px-5 py-3 font-medium">Tur</th>
                    <th className="px-5 py-3 font-medium">Tutar</th>
                    <th className="px-5 py-3 font-medium">Satici</th>
                    <th className="px-5 py-3 font-medium">Aciklama</th>
                    <th className="px-5 py-3 font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-900">{t.date}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 ${t.type === 'commission' ? 'text-purple-700' : t.type === 'refund' ? 'text-red-600' : 'text-blue-600'}`}>
                          {t.type === 'payout' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                          {typeLabels[t.type]}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t.amount)}</td>
                      <td className="px-5 py-3 text-gray-700">{t.seller}</td>
                      <td className="px-5 py-3 text-gray-500">{t.description}</td>
                      <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[t.status]}`}>{statusLabels[t.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
