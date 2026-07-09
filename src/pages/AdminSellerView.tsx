import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '@/lib/firebase';
import { getProducts } from '@/services/productService';
import { getOrdersBySeller } from '@/services/orderService';
import { calcSellerPerformance, SellerPerformanceScore } from '@/services/sellerRatingService';
import { getSellerCommissions, CommissionTransaction } from '@/services/commissionService';
import { getPayoutHistory, getSellerBalance, PayoutRequest } from '@/services/sellerPayoutService';
import {
  reviewApplication,
  hasAllRequiredDocs,
  type SellerApplication,
} from '@/services/sellerApplicationService';
import { useAuth } from '@/context/AuthContext';
import { Seller, Product } from '@/types';
import { updateSeller } from '@/services/userService';
import { Order } from '@/types/order';
import {
  ArrowLeft,
  Package,
  ShoppingBag,
  Star,
  Loader2,
  TrendingUp,
  DollarSign,
  Medal,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Edit2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIER_ORDER, type SellerTier } from '@/services/sellerTierService';

const TIER_LABELS: Record<string, string> = {
  starter: 'Baslangic',
  bronze: 'Bronz',
  silver: 'Gumus',
  gold: 'Altin',
  platinum: 'Platin',
};

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastMsg {
  id: number;
  message: string;
  type: 'success' | 'error';
}

// ─── DocViewerCard ────────────────────────────────────────────────────────────

interface DocViewerCardProps {
  docType: string;
  storagePath: string;
  adminToken: string;
}

function DocViewerCard({ docType, storagePath, adminToken }: DocViewerCardProps) {
  const [loading, setLoading] = useState(false);
  const [expired, setExpired] = useState(false);

  const labelMap: Record<string, string> = {
    identity: 'Identity Document',
    tax_certificate: 'Tax Certificate',
    bank_iban: 'Bank / IBAN Document',
  };

  const handleView = async () => {
    setLoading(true);
    setExpired(false);
    try {
      const encoded = encodeURIComponent(storagePath);
      const res = await fetch(`/api/kyc/signed-url/${encoded}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) {
        setExpired(true);
        return;
      }
      const { url } = await res.json();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setExpired(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-800 rounded-xl p-4 space-y-2">
      <p className="text-sm font-semibold text-white">{labelMap[docType] ?? docType}</p>
      {expired && (
        <p className="text-xs text-amber-400 flex items-center gap-1">
          <AlertCircle size={12} /> Document link expired — click to refresh
        </p>
      )}
      {/* storagePath is intentionally NOT rendered in DOM (T-03-01) */}
      <button
        onClick={handleView}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-violet-500 text-violet-400 text-xs font-bold hover:bg-violet-900/30 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
        {loading ? 'Loading…' : 'View Document'}
      </button>
    </div>
  );
}

// ─── AdminSellerView ──────────────────────────────────────────────────────────

export function AdminSellerView() {
  const { sellerId: sellerIdParam } = useParams<{ sellerId: string }>();
  // Stabilize useParams value — React Router v7 can return new object refs
  const sellerId = useMemo(() => sellerIdParam, [sellerIdParam]);
  const { firebaseUser } = useAuth();
  const toastIdRef = useRef(0);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [application, setApplication] = useState<SellerApplication | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [perfScore, setPerfScore] = useState<SellerPerformanceScore | null>(null);
  const [commissions, setCommissions] = useState<CommissionTransaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [sellerBal, setSellerBal] = useState<any>(null);

  // Approve/reject flow state
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [onboardingUrl, setOnboardingUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Tier & commission editing
  const [editingTier, setEditingTier] = useState(false);
  const [editingTierValue, setEditingTierValue] = useState<string>(
    (seller as any)?.tier || 'starter',
  );
  const [savingTier, setSavingTier] = useState(false);
  const [editingCommission, setEditingCommission] = useState(false);
  const [commissionValue, setCommissionValue] = useState<string>(
    String(seller?.commissionRate ?? ''),
  );
  const [savingCommission, setSavingCommission] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = ++toastIdRef.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  useEffect(() => {
    if (!sellerId) return;
    // Use allSettled so one failing query doesn't block the entire page
    const loadSeller = async () => {
      const results = await Promise.allSettled([
        getDoc(doc(db, 'sellers', sellerId)),
        getProducts({ sellerId, includeNonApproved: true } as any),
        getOrdersBySeller(sellerId),
        calcSellerPerformance(sellerId),
        getSellerCommissions(sellerId),
        getPayoutHistory(sellerId),
        getSellerBalance(sellerId),
        getDocs(query(collection(db, 'sellerApplications'), where('userId', '==', sellerId))),
      ]);

      const [snapR, prodsR, ordsR, perfR, commsR, paysR, balR, appSnapR] = results;

      if (snapR.status === 'fulfilled' && snapR.value.exists())
        setSeller({ id: snapR.value.id, ...snapR.value.data() } as Seller);
      if (prodsR.status === 'fulfilled') setProducts(prodsR.value);
      if (ordsR.status === 'fulfilled') setOrders(ordsR.value);
      else console.warn('[AdminSellerView] Orders failed to load:', ordsR.reason);
      if (perfR.status === 'fulfilled') setPerfScore(perfR.value);
      if (commsR.status === 'fulfilled') setCommissions(commsR.value);
      if (paysR.status === 'fulfilled') setPayouts(paysR.value);
      if (balR.status === 'fulfilled') setSellerBal(balR.value);
      if (appSnapR.status === 'fulfilled' && !appSnapR.value.empty) {
        const sorted = appSnapR.value.docs
          .map((d) => ({ id: d.id, ...d.data() }) as SellerApplication)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setApplication(sorted[0] ?? null);
      }
      setLoading(false);
    };
    loadSeller();
  }, [sellerId]);

  const getAdminToken = async (): Promise<string> => {
    if (!firebaseUser) return '';
    return firebaseUser.getIdToken();
  };

  // ── Approve handler ────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!sellerId || !application) return;
    setApproving(true);
    try {
      const token = await getAdminToken();
      const origin = application.origin ?? seller?.origin ?? 'TR';
      const endpoint =
        origin === 'TR'
          ? `/api/admin/seller/${sellerId}/approve-tr`
          : `/api/admin/seller/${sellerId}/approve-eu`;

      // Call regional provisioning
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adminNote: 'Approved by admin' }),
      });

      // Also update Firestore application via client service
      await reviewApplication(sellerId, 'approved', 'Approved', firebaseUser?.uid ?? 'admin');

      if (res.ok) {
        const data = await res.json();
        if (data.onboardingUrl) setOnboardingUrl(data.onboardingUrl);
        addToast('Seller approved. Payment account provisioning initiated.', 'success');
        setApplication((a) => (a ? { ...a, status: 'approved' } : a));
      } else {
        const err = await res.json().catch(() => ({ error: 'Approval failed' }));
        addToast(err.error ?? 'Approval failed', 'error');
      }
    } catch (err: any) {
      addToast(err.message ?? 'Approval failed', 'error');
    } finally {
      setApproving(false);
    }
  };

  // ── Reject handler ─────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!sellerId) return;
    if (rejectionReason.trim().length < 10) {
      setRejectionError('Please provide a rejection reason (minimum 10 characters)');
      return;
    }
    setRejecting(true);
    try {
      await reviewApplication(sellerId, 'rejected', rejectionReason, firebaseUser?.uid ?? 'admin');
      addToast('Application rejected. Seller has been notified.', 'error');
      setApplication((a) => (a ? { ...a, status: 'rejected', adminNote: rejectionReason } : a));
      setShowRejectForm(false);
      setRejectionReason('');
    } catch (err: any) {
      addToast(err.message ?? 'Rejection failed', 'error');
    } finally {
      setRejecting(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(onboardingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Render guards ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Seller not found.
      </div>
    );
  }

  const totalRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((s, o) => s + o.total, 0);

  const kycColor =
    seller.kycStatus === 'verified'
      ? 'bg-emerald-500/20 text-emerald-400'
      : seller.kycStatus === 'pending'
        ? 'bg-blue-500/20 text-blue-400'
        : 'bg-red-500/20 text-red-400';

  const kycLabel =
    seller.kycStatus === 'verified'
      ? 'Verified'
      : seller.kycStatus === 'pending'
        ? 'Pending'
        : 'Rejected';

  const canApprove =
    application !== null &&
    hasAllRequiredDocs(application) &&
    application.identityVerificationStatus === 'verified' &&
    application.status === 'pending';

  const kycDocs = application?.kycDocuments ?? [];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Toast container */}
      <div className="fixed top-4 end-4 z-50 space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'px-4 py-3 rounded-xl text-sm font-bold shadow-xl pointer-events-auto max-w-xs',
                t.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white',
              )}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Back */}
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Admin Panel
        </Link>

        {/* Seller header */}
        <div className="bg-zinc-900 rounded-2xl p-6 mb-6 flex items-start gap-5">
          {seller.logoUrl ? (
            <img
              src={seller.logoUrl}
              alt={seller.storeName}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Package size={24} className="text-zinc-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-bold truncate">{seller.storeName}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${kycColor}`}>
                {kycLabel}
              </span>
            </div>
            {seller.description && (
              <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{seller.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Star size={13} /> {seller.rating?.toFixed(1) ?? '0.0'}
              </span>
              <span className="flex items-center gap-1.5">
                <Package size={13} /> {products.length} products
              </span>
              <span className="flex items-center gap-1.5">
                <ShoppingBag size={13} /> {orders.length} orders
              </span>
              <span>Commission: %{seller.commissionRate}</span>
              <span className="flex items-center gap-1.5">
                Tier:{' '}
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400">
                  {TIER_LABELS[(seller as any).tier || 'starter'] || 'Baslangic'}
                </span>
              </span>
              {seller.origin && <span>Origin: {seller.origin}</span>}
            </div>
          </div>
          <div className="text-end flex-shrink-0">
            <p className="text-2xl font-bold text-emerald-400">
              {totalRevenue.toLocaleString('tr-TR')} ₺
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">Total Revenue</p>
          </div>
        </div>

        {/* ── Admin Management Card ──────────────────────────────────── */}
        <div className="bg-zinc-900 rounded-2xl p-6 mb-6 space-y-5">
          <h2 className="text-base font-semibold text-zinc-300">Admin Management</h2>

          {/* Tier */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-zinc-400 font-semibold min-w-[60px]">Tier</span>
            {editingTier ? (
              <div className="flex items-center gap-2">
                <select
                  value={editingTierValue}
                  onChange={(e) => setEditingTierValue(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-700 border border-zinc-600 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {TIER_ORDER.map((t) => (
                    <option key={t} value={t}>
                      {TIER_LABELS[t]}
                    </option>
                  ))}
                </select>
                <button
                  onClick={async () => {
                    if (!sellerId) return;
                    setSavingTier(true);
                    try {
                      await updateSeller(sellerId, { tier: editingTierValue } as any);
                      setSeller((prev) =>
                        prev ? ({ ...prev, tier: editingTierValue } as any) : prev,
                      );
                      addToast(
                        `Tier updated to ${TIER_LABELS[editingTierValue] || editingTierValue}`,
                        'success',
                      );
                      setEditingTier(false);
                    } catch (err: any) {
                      addToast(err?.message ?? 'Failed to save tier', 'error');
                    } finally {
                      setSavingTier(false);
                    }
                  }}
                  disabled={savingTier}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {savingTier ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <CheckCircle size={12} />
                  )}
                  Save
                </button>
                <button
                  onClick={() => setEditingTier(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <XCircle size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400">
                  {TIER_LABELS[(seller as any).tier || 'starter'] || 'Baslangic'}
                </span>
                <button
                  onClick={() => {
                    setEditingTierValue((seller as any).tier || 'starter');
                    setEditingTier(true);
                  }}
                  className="text-zinc-500 hover:text-purple-400 transition-colors"
                  title="Edit tier"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Commission Rate */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-zinc-400 font-semibold min-w-[60px]">Commission</span>
            {editingCommission ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={commissionValue}
                  onChange={(e) => setCommissionValue(e.target.value)}
                  className="w-16 px-3 py-1.5 rounded-lg bg-zinc-700 border border-zinc-600 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
                <span className="text-zinc-500 text-xs">%</span>
                <button
                  onClick={async () => {
                    if (!sellerId) return;
                    const val = parseFloat(commissionValue);
                    if (isNaN(val) || val < 0 || val > 100) {
                      addToast('Please enter a valid rate (0-100)', 'error');
                      return;
                    }
                    setSavingCommission(true);
                    try {
                      await updateSeller(sellerId, { commissionRate: val });
                      setSeller((prev) => (prev ? { ...prev, commissionRate: val } : prev));
                      addToast(`Commission set to %${val}`, 'success');
                      setEditingCommission(false);
                    } catch (err: any) {
                      addToast(err?.message ?? 'Failed to save commission', 'error');
                    } finally {
                      setSavingCommission(false);
                    }
                  }}
                  disabled={savingCommission}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {savingCommission ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <CheckCircle size={12} />
                  )}
                  Save
                </button>
                <button
                  onClick={() => setEditingCommission(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <XCircle size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-200">%{seller.commissionRate}</span>
                <button
                  onClick={() => {
                    setCommissionValue(String(seller.commissionRate ?? ''));
                    setEditingCommission(true);
                  }}
                  className="text-zinc-500 hover:text-emerald-400 transition-colors"
                  title="Edit commission"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            )}
          </div>

          {/* KYC Status */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-zinc-400 font-semibold min-w-[60px]">KYC</span>
            <span
              className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                seller.kycStatus === 'verified'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : seller.kycStatus === 'pending'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-red-500/20 text-red-400',
              )}
            >
              {seller.kycStatus === 'verified'
                ? 'Verified'
                : seller.kycStatus === 'pending'
                  ? 'Pending'
                  : 'Rejected'}
            </span>
            {seller.kycStatus !== 'verified' && (
              <button
                onClick={async () => {
                  if (!sellerId) return;
                  try {
                    await updateSeller(sellerId, {
                      kycStatus: 'verified',
                      isVerified: true,
                    } as any);
                    setSeller((prev) =>
                      prev ? ({ ...prev, kycStatus: 'verified', isVerified: true } as any) : prev,
                    );
                    addToast('Seller KYC marked as verified', 'success');
                  } catch (err: any) {
                    addToast(err?.message ?? 'Failed to update KYC status', 'error');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-xs font-bold transition-colors"
              >
                Mark as Verified
              </button>
            )}
            {seller.kycStatus !== 'rejected' && seller.kycStatus === 'pending' && (
              <button
                onClick={async () => {
                  if (!sellerId) return;
                  try {
                    await updateSeller(sellerId, { kycStatus: 'rejected' } as any);
                    setSeller((prev) =>
                      prev ? ({ ...prev, kycStatus: 'rejected' } as any) : prev,
                    );
                    addToast('Seller KYC rejected', 'error');
                  } catch (err: any) {
                    addToast(err?.message ?? 'Failed to update KYC status', 'error');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 text-xs font-bold transition-colors"
              >
                Reject
              </button>
            )}
          </div>
        </div>

        {/* ── KYC Application Panel ─────────────────────────────────────── */}
        {application && (
          <div className="bg-zinc-900 rounded-2xl p-6 mb-6 space-y-5">
            <h2 className="text-base font-semibold text-zinc-300">KYC Application Review</h2>

            {/* Document viewer — 3-col grid, storagePath never in DOM */}
            {kycDocs.length > 0 ? (
              <div>
                <p className="text-xs text-zinc-500 font-semibold mb-3 uppercase tracking-wider">
                  Uploaded Documents
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {kycDocs.map((d) => (
                    <DocViewerCard
                      key={d.docType}
                      docType={d.docType}
                      storagePath={d.storagePath}
                      adminToken=""
                      // token fetched lazily inside the component via the outer closure
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500">No documents uploaded yet.</p>
            )}

            {/* Identity verification status row */}
            <div className="flex items-center gap-3 flex-wrap">
              <ShieldCheck size={16} className="text-zinc-400" />
              <span className="text-sm text-zinc-400 font-semibold">Identity Verification</span>
              {application.identityVerificationStatus === 'verified' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={11} /> Verified
                </span>
              )}
              {application.identityVerificationStatus === 'requires_input' && (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 flex items-center gap-1">
                    <AlertCircle size={11} /> Requires Input
                  </span>
                  {application.identityVerificationError && (
                    <span className="text-zinc-500" style={{ fontSize: 13 }}>
                      {application.identityVerificationError}
                    </span>
                  )}
                </div>
              )}
              {(!application.identityVerificationStatus ||
                application.identityVerificationStatus === 'pending') && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-700 text-zinc-400">
                  Pending
                </span>
              )}
            </div>

            {/* Payment provisioning status row */}
            <div className="flex items-center gap-3 flex-wrap">
              <CreditCard size={16} className="text-zinc-400" />
              <span className="text-sm text-zinc-400 font-semibold">Payment Account</span>
              {application.origin === 'TR' ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Iyzico Sub-merchant</span>
                  {seller.iyzicoSubMerchantKey ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
                      Active
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-700 text-zinc-400">
                      Pending
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-zinc-400">Stripe Connect Express</span>
                  {seller.stripeOnboardingStatus === 'complete' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
                      Active
                    </span>
                  ) : seller.stripeAccountId ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400">
                      Onboarding
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-700 text-zinc-400">
                      Pending
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Onboarding URL copyable field (EU sellers after approval) */}
            {onboardingUrl && (
              <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
                <span className="text-xs text-zinc-400 flex-1 truncate">{onboardingUrl}</span>
                <button
                  onClick={handleCopyUrl}
                  className="text-violet-400 hover:text-violet-300 transition-colors shrink-0"
                  title="Copy onboarding link"
                >
                  {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                </button>
              </div>
            )}

            {/* Approve / Reject buttons */}
            {application.status === 'pending' && (
              <div className="space-y-3 pt-2">
                <div className="flex gap-3">
                  {/* Approve — disabled if !hasAllRequiredDocs or identity not verified (T-03-07) */}
                  <button
                    onClick={handleApprove}
                    disabled={approving || !canApprove}
                    title={
                      !canApprove
                        ? !hasAllRequiredDocs(application)
                          ? 'All 3 KYC documents must be uploaded before approval'
                          : 'Identity verification must be completed before approval'
                        : undefined
                    }
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {approving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Approve
                  </button>

                  <button
                    onClick={() => setShowRejectForm((v) => !v)}
                    disabled={rejecting}
                    className="flex-1 py-3 rounded-xl border border-red-500 text-red-400 hover:bg-red-500/10 font-black text-sm uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>

                {/* Inline rejection form */}
                <AnimatePresence>
                  {showRejectForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-zinc-800 rounded-xl p-4 space-y-3">
                        <label className="block text-xs font-bold text-zinc-400">
                          Reason for Rejection *
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => {
                            setRejectionReason(e.target.value);
                            if (e.target.value.trim().length >= 10) setRejectionError('');
                          }}
                          placeholder="Provide a clear reason for rejection (min 10 characters)"
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-700 border border-zinc-600 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                        />
                        {rejectionError && (
                          <p className="text-xs text-red-400 font-bold">{rejectionError}</p>
                        )}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleReject}
                            disabled={rejecting}
                            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {rejecting ? <Loader2 size={14} className="animate-spin" /> : null}
                            Confirm Rejection
                          </button>
                          <button
                            onClick={() => {
                              setShowRejectForm(false);
                              setRejectionError('');
                            }}
                            className="text-xs text-zinc-400 hover:text-zinc-200 font-bold transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {application.status !== 'pending' && (
              <div
                className={cn(
                  'px-4 py-3 rounded-xl text-sm font-bold',
                  application.status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400',
                )}
              >
                {application.status === 'approved'
                  ? '✓ Application approved'
                  : `✗ Application rejected${application.adminNote ? `: ${application.adminNote}` : ''}`}
              </div>
            )}
          </div>
        )}

        {/* Performance & Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {perfScore && (
            <div className="bg-zinc-900 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Medal size={16} className="text-yellow-400" />
                <span className="text-xs text-zinc-500 font-semibold">Performance</span>
              </div>
              <p className="text-2xl font-bold text-white">{perfScore.overall}</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-semibold',
                    perfScore.level === 'platinum'
                      ? 'bg-purple-500/20 text-purple-400'
                      : perfScore.level === 'gold'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : perfScore.level === 'silver'
                          ? 'bg-gray-500/20 text-gray-400'
                          : 'bg-orange-500/20 text-orange-400',
                  )}
                >
                  {perfScore.level}
                </span>
                <span className="text-xs text-zinc-500">Return: %{perfScore.returnRate}</span>
              </div>
            </div>
          )}
          <div className="bg-zinc-900 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={16} className="text-emerald-400" />
              <span className="text-xs text-zinc-500 font-semibold">Paid Out</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {sellerBal?.totalPaidOut?.toLocaleString('tr-TR') ?? '0'} ₺
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Available: {sellerBal?.availableBalance?.toLocaleString('tr-TR') ?? '0'} ₺
            </p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-blue-400" />
              <span className="text-xs text-zinc-500 font-semibold">Commission</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">
              {commissions.reduce((s, c) => s + c.amount, 0).toLocaleString('tr-TR')} ₺
            </p>
            <p className="text-xs text-zinc-500 mt-1">{commissions.length} transactions</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={16} className="text-purple-400" />
              <span className="text-xs text-zinc-500 font-semibold">Payouts</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">{payouts.length}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {payouts.filter((p) => p.status === 'completed').length} completed
            </p>
          </div>
        </div>

        {/* Products */}
        <section className="mb-6">
          <h2 className="text-base font-semibold mb-3 text-zinc-300">
            Products ({products.length})
          </h2>
          {products.length === 0 ? (
            <p className="text-zinc-500 text-sm py-6 text-center bg-zinc-900 rounded-2xl">
              No products yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.slice(0, 20).map((p) => (
                <div key={p.id} className="bg-zinc-900 rounded-xl p-4 flex gap-3 items-center">
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <Package size={16} className="text-zinc-600" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate text-white">{p.title}</p>
                    <p className="text-xs text-zinc-500">
                      {p.price?.toLocaleString('tr-TR')} ₺ · Stock: {p.stock}
                    </p>
                    <span
                      className={`text-xs ${
                        p.status === 'approved'
                          ? 'text-emerald-400'
                          : p.status === 'pending'
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}
                    >
                      {p.status === 'approved'
                        ? 'Approved'
                        : p.status === 'pending'
                          ? 'Pending'
                          : p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Orders */}
        <section>
          <h2 className="text-base font-semibold mb-3 text-zinc-300">
            Recent Orders ({orders.length})
          </h2>
          {orders.length === 0 ? (
            <p className="text-zinc-500 text-sm py-6 text-center bg-zinc-900 rounded-2xl">
              No orders yet.
            </p>
          ) : (
            <div className="bg-zinc-900 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800 text-xs">
                    <th className="text-start px-5 py-3 font-semibold">Order ID</th>
                    <th className="text-start px-5 py-3 font-semibold">Date</th>
                    <th className="text-start px-5 py-3 font-semibold">Status</th>
                    <th className="text-end px-5 py-3 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 20).map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-zinc-400">
                        #{o.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-5 py-3 text-zinc-400">
                        {new Date(o.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            o.status === 'delivered'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : o.status === 'shipped'
                                ? 'bg-blue-500/20 text-blue-400'
                                : o.status === 'cancelled'
                                  ? 'bg-zinc-700 text-zinc-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-end font-semibold">
                        {o.total.toLocaleString('tr-TR')} ₺
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
