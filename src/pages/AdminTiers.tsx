import React, { useState, useEffect } from 'react';
import { Loader2, Save, Star, Package, DollarSign, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getAllTierConfigs,
  updateTierConfig,
  getTierBenefits,
  SellerTier,
} from '@/services/sellerTierService';
import type { TierConfig } from '@/services/sellerTierService';
import { audit } from '@/services/auditLogService';
import { useAuth } from '@/context/AuthContext';

const TIER_COLORS: Record<SellerTier, string> = {
  starter: 'bg-zinc-100 border-zinc-200',
  bronze: 'bg-orange-50 border-orange-200',
  silver: 'bg-zinc-50 border-zinc-200',
  gold: 'bg-amber-50 border-amber-200',
  platinum: 'bg-purple-50 border-purple-200',
};

export function AdminTiers() {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTier, setEditingTier] = useState<SellerTier | null>(null);
  const [editForm, setEditForm] = useState<Partial<TierConfig>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllTierConfigs().then((data) => {
      setTiers(data);
      setLoading(false);
    });
  }, []);

  const startEdit = (tier: TierConfig) => {
    setEditingTier(tier.tier);
    setEditForm({
      maxProducts: tier.maxProducts,
      commissionRate: tier.commissionRate,
      monthlyFee: tier.monthlyFee,
    });
  };

  const saveEdit = async () => {
    if (!editingTier) return;
    setSaving(true);
    await updateTierConfig(editingTier, editForm);
    audit(
      user?.uid ?? '',
      user?.email ?? '',
      user?.role ?? 'admin',
      'tier.update',
      'tier',
      editingTier,
      undefined,
      JSON.stringify(editForm),
    );
    setTiers((prev) => prev.map((t) => (t.tier === editingTier ? { ...t, ...editForm } : t)));
    setEditingTier(null);
    setSaving(false);
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );

  return (
    <div className="bg-white rounded-[3.5rem] p-8 lg:p-12 border border-[#F8F8FA] shadow-sm space-y-8">
      <div>
        <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary">
          Satıcı Kademeleri
        </h3>
        <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest mt-1">
          Her kademe için ürün limiti, komisyon ve özellik yönetimi
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {tiers.map((tier) => (
          <div key={tier.tier} className={cn('rounded-2xl border-2 p-5', TIER_COLORS[tier.tier])}>
            <div className="flex items-center justify-between mb-3">
              <Star
                size={18}
                className={cn(
                  tier.tier === 'platinum'
                    ? 'text-purple-500'
                    : tier.tier === 'gold'
                      ? 'text-amber-500'
                      : tier.tier === 'silver'
                        ? 'text-zinc-500'
                        : tier.tier === 'bronze'
                          ? 'text-orange-500'
                          : 'text-zinc-400',
                )}
              />
              <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40">
                {tier.minPerformanceScore}+ puan
              </span>
            </div>
            <h4 className="text-lg font-display font-black text-brand-primary">{tier.label}</h4>

            {editingTier === tier.tier ? (
              <div className="mt-3 space-y-2">
                <div>
                  <label className="text-[8px] font-bold uppercase text-brand-primary/40">
                    Maks. Ürün
                  </label>
                  <input
                    type="number"
                    value={editForm.maxProducts || ''}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, maxProducts: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full px-2 py-1.5 bg-white rounded-lg text-xs font-bold outline-none border"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-bold uppercase text-brand-primary/40">
                    Komisyon %
                  </label>
                  <input
                    type="number"
                    value={editForm.commissionRate || ''}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        commissionRate: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-2 py-1.5 bg-white rounded-lg text-xs font-bold outline-none border"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-bold uppercase text-brand-primary/40">
                    Aylık Ücret (₺)
                  </label>
                  <input
                    type="number"
                    value={editForm.monthlyFee || ''}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, monthlyFee: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full px-2 py-1.5 bg-white rounded-lg text-xs font-bold outline-none border"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="flex-1 py-1.5 bg-accent text-white rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1"
                  >
                    <Save size={10} /> Kaydet
                  </button>
                  <button
                    onClick={() => setEditingTier(null)}
                    className="px-2 py-1.5 bg-zinc-100 text-zinc-500 rounded-lg text-[9px]"
                  >
                    <X size={10} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <Package size={12} className="text-brand-primary/30" />
                    <span className="font-black text-brand-primary">
                      {tier.maxProducts.toLocaleString()}
                    </span>
                    <span className="text-brand-primary/40">ürün</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <DollarSign size={12} className="text-brand-primary/30" />
                    <span className="font-black text-brand-primary">%{tier.commissionRate}</span>
                    <span className="text-brand-primary/40">komisyon</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-black text-brand-primary">{tier.monthlyFee} ₺</span>
                    <span className="text-brand-primary/40">/ ay</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-brand-primary/10">
                  <p className="text-[8px] font-black uppercase tracking-widest text-brand-primary/30 mb-1.5">
                    Özellikler
                  </p>
                  <div className="space-y-1">
                    {tier.benefits.map((b, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Check size={10} className="text-green-500 shrink-0" />
                        <span className="text-[10px] text-brand-primary/60">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-2 flex gap-1.5">
                  {tier.apiAccess && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[8px] font-black">
                      API
                    </span>
                  )}
                  {tier.couponCreation && (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[8px] font-black">
                      Kupon
                    </span>
                  )}
                  {tier.featuredPlacement && (
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-[8px] font-black">
                      Öne Çıkan
                    </span>
                  )}
                </div>

                <button
                  onClick={() => startEdit(tier)}
                  className="w-full mt-3 py-2 border border-brand-primary/10 rounded-xl text-[9px] font-black uppercase text-brand-primary/40 hover:bg-brand-primary/5 transition-colors"
                >
                  Düzenle
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
