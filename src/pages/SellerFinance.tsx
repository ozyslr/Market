import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { FinanceDashboard } from '@/components/seller/FinanceDashboard';

/**
 * SellerFinance page — delegates all financial data display to FinanceDashboard.
 * All data is loaded server-side from the ledger API (no direct Firestore reads).
 */
export function SellerFinance() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex justify-center py-24">
        <p className="text-sm text-gray-500">Giriş yapmanız gerekiyor.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8FA] p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary">
              Finans Paneli
            </h1>
            <p className="text-xs text-brand-primary/40 mt-1 font-bold uppercase tracking-widest">
              Kazançlarınız ve ödeme geçmişiniz
            </p>
          </div>
          <Link
            to="/seller/dashboard"
            className="flex items-center gap-2 text-xs font-bold text-brand-primary/60 hover:text-[#6418E5] transition-colors"
          >
            Dashboard <ChevronRight size={14} />
          </Link>
        </div>

        {/* Finance Dashboard (server API — no client Firestore reads) */}
        <FinanceDashboard sellerId={user.id} />
      </div>
    </div>
  );
}
