import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Plus, Eye, MousePointerClick, DollarSign, TrendingUp,
  RefreshCcw, AlertCircle, Megaphone, PauseCircle, PlayCircle,
  Loader2, X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import type { AdCampaign } from '@/types';
import {
  getSellerAdCampaigns,
  createAdCampaign,
  pauseAdCampaign,
  resumeAdCampaign,
  getSellerAdAnalytics,
} from '@/services/adService';
import type { SellerAdAnalytics } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────

type PageStatus = 'loading' | 'error' | 'empty' | 'ready';

interface CampaignForm {
  productId: string;
  campaignName: string;
  cpcBid: number;
  dailyBudget: number;
  totalBudget: number;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: CampaignForm = {
  productId: '',
  campaignName: '',
  cpcBid: 0.5,
  dailyBudget: 50,
  totalBudget: 500,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}

function statusColor(status: AdCampaign['status']): string {
  switch (status) {
    case 'active': return 'bg-emerald-500/20 text-emerald-400';
    case 'paused': return 'bg-amber-500/20 text-amber-400';
    case 'pending': return 'bg-blue-500/20 text-blue-400';
    case 'rejected': return 'bg-red-500/20 text-red-400';
    case 'ended': return 'bg-zinc-500/20 text-zinc-400';
    case 'exhausted': return 'bg-orange-500/20 text-orange-400';
    default: return 'bg-zinc-500/20 text-zinc-400';
  }
}

function statusLabel(status: AdCampaign['status']): string {
  switch (status) {
    case 'active': return 'Aktif';
    case 'paused': return 'Duraklatıldı';
    case 'pending': return 'Onay Bekliyor';
    case 'rejected': return 'Reddedildi';
    case 'ended': return 'Bitti';
    case 'exhausted': return 'Bütçe Tükendi';
    default: return status;
  }
}

// ─── KPI Card ───────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

function KPICard({ label, value, subtext, icon: Icon, color, bg }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-zinc-700 transition-colors"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-white tracking-tight">{value}</p>
        {subtext && <p className="text-[10px] text-zinc-500 mt-0.5">{subtext}</p>}
      </div>
    </motion.div>
  );
}

// ─── Create Campaign Modal ─────────────────────────────────────────────────

function CreateCampaignModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<CampaignForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleSubmit = useCallback(async () => {
    if (!user?.id) return;
    if (!form.productId || !form.campaignName) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createAdCampaign({
        sellerId: user.id,
        productId: form.productId,
        campaignName: form.campaignName,
        cpcBid: form.cpcBid,
        dailyBudget: form.dailyBudget,
        totalBudget: form.totalBudget,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        status: 'pending',
        isActive: false,
      });
      onCreated();
      onClose();
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kampanya oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  }, [user, form, onCreated, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Yeni Reklam Kampanyası</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
            <X size={18} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Ürün ID <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.productId}
              onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
              placeholder="Ürün ID'sini girin"
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Kampanya Adı <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.campaignName}
              onChange={e => setForm(f => ({ ...f, campaignName: e.target.value }))}
              placeholder="Örn: Kış İndirimi 2026"
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                CPC Teklifi (₺)
              </label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                value={form.cpcBid}
                onChange={e => setForm(f => ({ ...f, cpcBid: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Günlük Bütçe (₺)
              </label>
              <input
                type="number"
                step="10"
                min="10"
                value={form.dailyBudget}
                onChange={e => setForm(f => ({ ...f, dailyBudget: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Toplam Bütçe (₺)
            </label>
            <input
              type="number"
              step="50"
              min="50"
              value={form.totalBudget}
              onChange={e => setForm(f => ({ ...f, totalBudget: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-bold text-zinc-400 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving ? 'Oluşturuluyor...' : 'Kampanya Oluştur'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function AdCampaigns() {
  const { user } = useAuth();
  const [status, setStatus] = useState<PageStatus>('loading');
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [analytics, setAnalytics] = useState<SellerAdAnalytics | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setStatus('loading');
    setErrorMsg(null);
    try {
      const [campaignsData, analyticsData] = await Promise.all([
        getSellerAdCampaigns(user.id),
        getSellerAdAnalytics(user.id, '30d'),
      ]);
      setCampaigns(campaignsData);
      setAnalytics(analyticsData);
      setStatus(campaignsData.length === 0 ? 'empty' : 'ready');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Veriler yüklenemedi.');
      setStatus('error');
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = useCallback(async (campaign: AdCampaign) => {
    setTogglingId(campaign.id);
    try {
      if (campaign.status === 'active') await pauseAdCampaign(campaign.id);
      else if (campaign.status === 'paused') await resumeAdCampaign(campaign.id);
      await load();
    } catch {
      // Silently handle
    } finally {
      setTogglingId(null);
    }
  }, [load]);

  // ── Render ──────────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div className="p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-zinc-800" />
                <div className="w-20 h-3 rounded bg-zinc-800" />
                <div className="w-28 h-7 rounded bg-zinc-800" />
              </div>
            ))}
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 animate-pulse">
            <div className="w-40 h-5 rounded bg-zinc-800" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-zinc-800/50" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="p-6 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
            <AlertCircle size={40} className="mx-auto mb-3 text-red-400" />
            <h2 className="text-lg font-bold text-red-400 mb-1">Veri Yüklenemedi</h2>
            <p className="text-sm text-red-400/70 mb-4">{errorMsg}</p>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-500 transition-colors"
            >
              <RefreshCcw size={14} /> Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Reklam Kampanyaları</h1>
            <p className="text-xs text-zinc-500 mt-1">CPC reklam kampanyalarını yönetin</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-colors"
          >
            <Plus size={16} /> Yeni Kampanya
          </button>
        </div>

        {/* ── KPI Cards ───────────────────────────────────────────────────── */}
        {analytics && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <KPICard label="Toplam Gösterim" value={analytics.totalImpressions.toLocaleString('tr-TR')} icon={Eye} color="text-blue-400" bg="bg-blue-500/10" />
            <KPICard label="Toplam Tıklama" value={analytics.totalClicks.toLocaleString('tr-TR')} icon={MousePointerClick} color="text-purple-400" bg="bg-purple-500/10" />
            <KPICard label="Toplam Harcama" value={formatCurrency(analytics.totalSpend)} icon={DollarSign} color="text-emerald-400" bg="bg-emerald-500/10" />
            <KPICard label="Ort. Tıklama Oranı" value={`%${analytics.averageCtr.toFixed(2)}`} subtext={`${analytics.activeCampaigns} aktif kampanya`} icon={TrendingUp} color="text-amber-400" bg="bg-amber-500/10" />
          </motion.div>
        )}

        {/* ── Campaign List ───────────────────────────────────────────────── */}
        {status === 'empty' ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-16 text-center">
            <Megaphone size={48} className="mx-auto mb-4 text-zinc-700" />
            <h2 className="text-lg font-bold text-white mb-2">Henüz Kampanya Yok</h2>
            <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed mb-6">
              İlk reklam kampanyanızı oluşturun ve ürünlerinizi sponsorlu olarak öne çıkarın.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-colors"
            >
              <Plus size={16} /> İlk Kampanyayı Oluştur
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50">
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Kampanya</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">CPC</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Bütçe</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Harcama</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Gösterim</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tıklama</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">TO</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Durum</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => {
                    const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : '0.00';
                    const canToggle = c.status === 'active' || c.status === 'paused';
                    return (
                      <tr key={c.id} className={cn('border-b border-zinc-800/50', i % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-900/50')}>
                        <td className="px-4 py-3">
                          <p className="font-bold text-white text-xs">{c.campaignName}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">Ürün: {c.productId.slice(0, 12)}...</p>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-zinc-300">{formatCurrency(c.cpcBid)}</td>
                        <td className="px-4 py-3 text-xs text-zinc-400">
                          <p className="font-semibold">{formatCurrency(c.dailyBudget)} / gün</p>
                          <p className="text-[10px] text-zinc-600">Toplam: {formatCurrency(c.totalBudget)}</p>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-zinc-300">{formatCurrency(c.spend)}</td>
                        <td className="px-4 py-3 text-xs text-zinc-400">{c.impressions.toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-3 text-xs text-zinc-400">{c.clicks.toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-zinc-300">%{ctr}</td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-block px-2 py-0.5 text-[10px] font-bold rounded-full', statusColor(c.status))}>
                            {statusLabel(c.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canToggle && (
                            <button
                              onClick={() => handleToggle(c)}
                              disabled={togglingId === c.id}
                              className={cn(
                                'p-1.5 rounded-lg transition-colors',
                                c.status === 'active'
                                  ? 'text-amber-400 hover:bg-amber-500/10'
                                  : 'text-emerald-400 hover:bg-emerald-500/10',
                              )}
                              title={c.status === 'active' ? 'Duraklat' : 'Aktifleştir'}
                            >
                              {togglingId === c.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : c.status === 'active' ? (
                                <PauseCircle size={16} />
                              ) : (
                                <PlayCircle size={16} />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── Budget Info ─────────────────────────────────────────────────── */}
        {status === 'ready' && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-400 flex items-start gap-3">
            <Megaphone size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold mb-0.5">Bütçe Yönetimi</p>
              <p className="text-amber-400/70">
                Onaylanan kampanyalar yayına başlar. Günlük bütçe dolduğunda kampanya durur, ertesi gün sıfırlanır.
              </p>
            </div>
          </div>
        )}
      </div>

      <CreateCampaignModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={load}
      />
    </div>
  );
}
