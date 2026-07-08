import React, { useState, useEffect } from 'react';
import { RotateCcw, Loader2 } from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import type { ReturnRequest, ReturnReason, ReturnStatus } from '@/types/returns';

// ─── Label maps ──────────────────────────────────────────────────────────

const REASON_LABELS: Record<ReturnReason, string> = {
  wrong_item: 'Yanlış Ürün',
  damaged: 'Hasarlı Ürün',
  not_as_described: 'Açıklamaya Uymuyor',
  changed_mind: 'Fikir Değişikliği',
  other: 'Diğer',
};

const STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: 'Bekliyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  label_sent: 'Etiket Gönderildi',
  received: 'Teslim Alındı',
  refunded: 'İade Edildi',
};

interface Props {
  sellerId?: string;
  /** Legacy prop used by SellerOrders to toggle visibility */
  uid?: string;
  show?: boolean;
}

export function ReturnManagementSection({ sellerId, uid, show }: Props) {
  const { firebaseUser } = useAuth();
  const effectiveSellerId = sellerId ?? uid ?? firebaseUser?.uid ?? '';

  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionSuccess, setActionSuccess] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<Record<string, string>>({});
  const [rejectionInputs, setRejectionInputs] = useState<Record<string, string>>({});

  // Respect legacy `show` prop
  const isVisible = show === undefined ? true : show;

  useEffect(() => {
    if (!effectiveSellerId || !isVisible) return;
    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'returns'),
      where('sellerId', '==', effectiveSellerId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
    );

    getDocs(q)
      .then((snap) => {
        setReturns(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReturnRequest));
      })
      .catch((err) => {
        console.error('ReturnManagementSection fetch error:', err);
        setError('İade talepleri yüklenemedi.');
      })
      .finally(() => setLoading(false));
  }, [effectiveSellerId, isVisible]);

  if (!isVisible) return null;

  const handleApprove = async (returnId: string) => {
    if (!firebaseUser) return;
    setActionLoading((prev) => ({ ...prev, [returnId]: true }));
    setActionError((prev) => ({ ...prev, [returnId]: '' }));
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/returns/${returnId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setReturns((prev) => prev.filter((r) => r.id !== returnId));
        setActionSuccess((prev) => ({
          ...prev,
          [returnId]: data.returnTrackingNumber
            ? `Onaylandı — Takip: ${data.returnTrackingNumber}`
            : 'Onaylandı',
        }));
      } else {
        setActionError((prev) => ({ ...prev, [returnId]: data?.error ?? `Hata: ${res.status}` }));
      }
    } catch {
      setActionError((prev) => ({ ...prev, [returnId]: 'Ağ hatası. Lütfen tekrar deneyin.' }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [returnId]: false }));
    }
  };

  const handleReject = async (returnId: string) => {
    if (!firebaseUser) return;
    const rejectionReason = rejectionInputs[returnId]?.trim();
    if (!rejectionReason) {
      setActionError((prev) => ({ ...prev, [returnId]: 'Red sebebi giriniz.' }));
      return;
    }
    setActionLoading((prev) => ({ ...prev, [returnId]: true }));
    setActionError((prev) => ({ ...prev, [returnId]: '' }));
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/returns/${returnId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rejectionReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setReturns((prev) => prev.filter((r) => r.id !== returnId));
        setActionSuccess((prev) => ({ ...prev, [returnId]: 'Reddedildi' }));
      } else {
        setActionError((prev) => ({ ...prev, [returnId]: data?.error ?? `Hata: ${res.status}` }));
      }
    } catch {
      setActionError((prev) => ({ ...prev, [returnId]: 'Ağ hatası. Lütfen tekrar deneyin.' }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [returnId]: false }));
    }
  };

  return (
    <div className="bg-white rounded-[3.5rem] shadow-sm border border-amber-200 overflow-hidden mt-8">
      {/* Header */}
      <div className="p-8 border-b border-amber-100 flex items-center justify-between">
        <h2 className="font-black text-brand-primary uppercase italic flex items-center gap-2">
          <RotateCcw size={18} className="text-amber-500" /> İade Talepleri
        </h2>
        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
          {returns.length} bekleyen
        </span>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-xs font-bold text-red-500">{error}</p>
        </div>
      ) : returns.length === 0 ? (
        <div className="text-center py-16">
          <RotateCcw size={36} className="mx-auto text-brand-primary/10 mb-3" />
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
            Bekleyen iade talebi yok
          </p>
        </div>
      ) : (
        <div className="divide-y divide-brand-primary/5">
          {returns.map((r) => (
            <div key={r.id} className="p-6 space-y-3">
              {/* Return info */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-black text-brand-primary">
                    {REASON_LABELS[r.reason] ?? r.reason}
                  </p>
                  {r.notes && <p className="text-[11px] text-brand-primary/60">{r.notes}</p>}
                  <p className="text-[10px] text-brand-primary/40">
                    Talep: {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                  {r.windowExpiresAt && (
                    <p className="text-[10px] text-brand-primary/40">
                      Son tarih: {new Date(r.windowExpiresAt).toLocaleDateString('tr-TR')}
                    </p>
                  )}
                  <p className="text-[10px] font-mono text-brand-primary/30">
                    Sipariş: {r.subOrderId.slice(-8).toUpperCase()}
                  </p>
                </div>
                <span className="shrink-0 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600">
                  {STATUS_LABELS[r.status] ?? r.status}
                </span>
              </div>

              {/* Success message */}
              {actionSuccess[r.id] && (
                <p className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-2 rounded-xl">
                  {actionSuccess[r.id]}
                </p>
              )}

              {/* Error message */}
              {actionError[r.id] && (
                <p className="text-[10px] font-bold text-red-600 bg-red-50 px-3 py-2 rounded-xl">
                  {actionError[r.id]}
                </p>
              )}

              {/* Actions */}
              <div className="space-y-2">
                {/* Rejection reason input */}
                <input
                  type="text"
                  placeholder="Red sebebi (reddetmek için gerekli)"
                  value={rejectionInputs[r.id] ?? ''}
                  onChange={(e) =>
                    setRejectionInputs((prev) => ({ ...prev, [r.id]: e.target.value }))
                  }
                  disabled={actionLoading[r.id]}
                  className="w-full text-xs bg-white border border-brand-primary/10 rounded-xl px-3 py-2 text-brand-primary placeholder-brand-primary/30 focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(r.id)}
                    disabled={actionLoading[r.id]}
                    className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {actionLoading[r.id] ? <Loader2 size={12} className="animate-spin" /> : null}
                    Onayla
                  </button>
                  <button
                    onClick={() => handleReject(r.id)}
                    disabled={actionLoading[r.id]}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {actionLoading[r.id] ? <Loader2 size={12} className="animate-spin" /> : null}
                    Reddet
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
