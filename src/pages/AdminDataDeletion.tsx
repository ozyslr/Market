import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { audit } from '@/services/auditLogService';
import { useAuth } from '@/context/AuthContext';

interface DeletionRequest {
  requestId: string;
  userId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  processedBy?: string;
  processedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

type FilterKey = 'all' | 'pending' | 'approved' | 'rejected';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tumu' },
  { key: 'pending', label: 'Bekleyen' },
  { key: 'approved', label: 'Onaylanan' },
  { key: 'rejected', label: 'Reddedilen' },
];

export function AdminDataDeletion() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const { getAuth } = await import('firebase/auth');
      const current = getAuth().currentUser;
      if (!current) return;
      const token = await current.getIdToken();
      const url =
        filter === 'all'
          ? '/api/admin/compliance/deletion-requests'
          : `/api/admin/compliance/deletion-requests?status=${filter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message || 'Yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleApprove = async (requestId: string) => {
    try {
      const { getAuth } = await import('firebase/auth');
      const current = getAuth().currentUser;
      if (!current) return;
      const token = await current.getIdToken();
      const res = await fetch(`/api/admin/compliance/deletion-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      audit(
        user?.uid ?? '',
        user?.email ?? '',
        user?.role ?? 'admin',
        'user.data_deletion',
        'user',
        requestId,
      );
      fetchRequests();
    } catch {}
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason) return;
    try {
      const { getAuth } = await import('firebase/auth');
      const current = getAuth().currentUser;
      if (!current) return;
      const token = await current.getIdToken();
      const res = await fetch(`/api/admin/compliance/deletion-requests/${rejectingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) throw new Error('Failed');
      audit(
        user?.uid ?? '',
        user?.email ?? '',
        user?.role ?? 'admin',
        'user.data_deletion',
        'user',
        rejectingId,
      );
      setRejectingId(null);
      setRejectReason('');
      fetchRequests();
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8FA] dark:bg-zinc-950 pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
            Veri Silme Talepleri
          </h1>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all',
                filter === f.key
                  ? 'bg-accent text-white shadow-lg shadow-accent/20'
                  : 'bg-white dark:bg-zinc-900 text-brand-primary/60 dark:text-zinc-400 border border-brand-primary/10',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && <div className="text-center py-8 text-red-500 text-sm font-bold">{error}</div>}

        {requests.length === 0 && !error && (
          <div className="text-center py-16 text-brand-primary/30 dark:text-zinc-600">
            <p className="text-sm font-black uppercase tracking-widest">Talep bulunamadi</p>
          </div>
        )}

        {/* Requests table */}
        {requests.map((req) => (
          <div
            key={req.requestId}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-5 mb-3 border border-brand-primary/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[9px] font-black uppercase',
                      req.status === 'pending'
                        ? 'bg-amber-50 dark:bg-amber-950 text-amber-600'
                        : req.status === 'approved'
                          ? 'bg-green-50 dark:bg-green-950 text-green-600'
                          : 'bg-red-50 dark:bg-red-950 text-red-600',
                    )}
                  >
                    {req.status === 'pending'
                      ? 'Bekliyor'
                      : req.status === 'approved'
                        ? 'Onaylandi'
                        : 'Reddedildi'}
                  </span>
                  <span className="text-[9px] text-brand-primary/30 font-mono">
                    {req.userId.slice(0, 12)}...
                  </span>
                </div>
                <p className="text-xs text-brand-primary/70 dark:text-zinc-300 mb-1">
                  {req.reason}
                </p>
                <div className="flex items-center gap-3 text-[9px] text-brand-primary/30">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(req.createdAt).toLocaleString('tr-TR')}
                  </span>
                  {req.processedAt && (
                    <span>Islem: {new Date(req.processedAt).toLocaleString('tr-TR')}</span>
                  )}
                </div>
                {req.rejectionReason && (
                  <p className="text-[9px] text-red-500 mt-1">Red sebebi: {req.rejectionReason}</p>
                )}
              </div>

              {req.status === 'pending' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(req.requestId)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-xl text-[9px] font-black uppercase hover:bg-green-600 transition-all"
                  >
                    <CheckCircle2 size={12} />
                    Onayla
                  </button>
                  <button
                    onClick={() => setRejectingId(req.requestId)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-500 rounded-xl text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all"
                  >
                    <XCircle size={12} />
                    Reddet
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reject modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-[16000] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-sm font-black text-brand-primary dark:text-white mb-2">
              Reddetme Sebebi
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reddetme sebebini belirtin..."
              className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs mb-4 resize-none h-20 border border-brand-primary/10"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={!rejectReason}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-40"
              >
                Reddet
              </button>
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2.5 border border-brand-primary/10 rounded-xl text-[10px] font-black uppercase"
              >
                Iptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
