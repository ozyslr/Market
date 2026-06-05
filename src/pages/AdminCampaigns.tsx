import React, { useState, useEffect } from 'react';
import { Campaign, CampaignTargetType, CampaignDiscountType } from '@/types';
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from '@/services/campaignService';
import { Loader2, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { audit } from '@/services/auditLogService';
import { useAuth } from '@/context/AuthContext';

const DEFAULT_FORM: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  description: '',
  discountType: 'percentage',
  discountValue: 10,
  targetType: 'all_products',
  targetValue: '',
  isActive: true,
  startDate: new Date().toISOString().slice(0, 16),
  endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
};

const TARGET_LABELS: Record<CampaignTargetType, string> = {
  all_products: 'Tüm Ürünler',
  category: 'Kategori',
  brand: 'Marka',
  specific_products: 'Belirli Ürünler',
};

function campaignStatus(c: Campaign): { label: string; cls: string } {
  const now = new Date().toISOString();
  if (!c.isActive) return { label: 'Pasif', cls: 'bg-red-100 text-red-600' };
  if (c.startDate > now) return { label: 'Planlandı', cls: 'bg-blue-100 text-blue-600' };
  if (c.endDate < now) return { label: 'Sona Erdi', cls: 'bg-gray-100 text-gray-500' };
  return { label: 'Aktif', cls: 'bg-green-100 text-green-700' };
}

export function AdminCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    getCampaigns().then((data) => {
      setCampaigns(data);
      setLoading(false);
    });
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  };
  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description ?? '',
      discountType: c.discountType,
      discountValue: c.discountValue,
      targetType: c.targetType,
      targetValue: c.targetValue ?? '',
      minOrderAmount: c.minOrderAmount,
      isActive: c.isActive,
      isCartCampaign: c.isCartCampaign || false,
      maxDiscountAmount: c.maxDiscountAmount,
      freeGiftProductId: c.freeGiftProductId,
      startDate: c.startDate.slice(0, 16),
      endDate: c.endDate.slice(0, 16),
    } as any);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateCampaign(editing.id, form);
        audit(
          user?.uid ?? '',
          user?.email ?? '',
          user?.role ?? 'admin',
          'campaign.update',
          'campaign',
          editing.id,
          editing.name,
        );
        setCampaigns((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...form } : c)));
      } else {
        const created = await createCampaign(form);
        audit(
          user?.uid ?? '',
          user?.email ?? '',
          user?.role ?? 'admin',
          'campaign.create',
          'campaign',
          created.id,
          form.name,
        );
        setCampaigns((prev) => [created, ...prev]);
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kampanyayı silmek istediğinizden emin misiniz?')) return;
    await deleteCampaign(id);
    audit(
      user?.uid ?? '',
      user?.email ?? '',
      user?.role ?? 'admin',
      'campaign.delete',
      'campaign',
      id,
    );
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  const handleToggle = async (c: Campaign) => {
    await updateCampaign(c.id, { isActive: !c.isActive });
    audit(
      user?.uid ?? '',
      user?.email ?? '',
      user?.role ?? 'admin',
      'campaign.update',
      'campaign',
      c.id,
      c.name,
      `isActive: ${!c.isActive}`,
    );
    setCampaigns((prev) => prev.map((x) => (x.id === c.id ? { ...x, isActive: !x.isActive } : x)));
  };

  const set = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );

  return (
    <div className="bg-white rounded-[3.5rem] p-8 lg:p-12 border border-[#F8F8FA] shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Megaphone className="w-6 h-6 text-accent" />
          <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">
            Kampanyalar
          </h3>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-2xl text-xs font-black uppercase tracking-wide hover:bg-accent/90 transition-colors"
        >
          <Plus size={14} /> Yeni Kampanya
        </button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 bg-[#F8F8FA] rounded-3xl border border-[#1A1033]/10">
          <h4 className="text-sm font-black uppercase tracking-widest text-[#1A1033]/50 mb-5">
            {editing ? 'Kampanyayı Düzenle' : 'Yeni Kampanya'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                Kampanya Adı *
              </label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Yaz sezonu indirimi..."
                className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/30"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                Açıklama
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/30 resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                İndirim Tipi
              </label>
              <select
                value={form.discountType}
                onChange={(e) => set('discountType', e.target.value as CampaignDiscountType)}
                className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/30"
              >
                <option value="percentage">Yüzde (%)</option>
                <option value="fixed">Sabit (₺)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                İndirim Değeri
              </label>
              <input
                type="number"
                min={0}
                value={form.discountValue}
                onChange={(e) => set('discountValue', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/30"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                Hedef
              </label>
              <select
                value={form.targetType}
                onChange={(e) => set('targetType', e.target.value as CampaignTargetType)}
                className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/30"
              >
                {(Object.entries(TARGET_LABELS) as [CampaignTargetType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            {form.targetType !== 'all_products' && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                  {form.targetType === 'category'
                    ? 'Kategori ID'
                    : form.targetType === 'brand'
                      ? 'Marka Adı'
                      : "Ürün ID'leri (virgülle)"}
                </label>
                <input
                  value={form.targetValue ?? ''}
                  onChange={(e) => set('targetValue', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/30"
                />
              </div>
            )}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                Min. Sipariş Tutarı (₺)
              </label>
              <input
                type="number"
                min={0}
                value={form.minOrderAmount ?? ''}
                onChange={(e) =>
                  set('minOrderAmount', e.target.value ? parseFloat(e.target.value) : undefined)
                }
                placeholder="Opsiyonel"
                className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/30"
              />
            </div>
            {/* Cart Campaign Toggle */}
            <div className="col-span-2 bg-[#F8F8FA] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/60">
                  Sepet Kampanyası
                </p>
                <p className="text-[9px] text-[#1A1033]/40">
                  Kupon kodu gerektirmeden sepette otomatik uygulanır
                </p>
              </div>
              <button
                onClick={() => set('isCartCampaign', !(form as any).isCartCampaign)}
                className="text-accent"
              >
                {(form as any).isCartCampaign ? (
                  <ToggleRight size={28} />
                ) : (
                  <ToggleLeft size={28} className="text-[#1A1033]/30" />
                )}
              </button>
            </div>
            {(form as any).isCartCampaign && (
              <>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                    Maks. İndirim (₺)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={(form as any).maxDiscountAmount ?? ''}
                    onChange={(e) =>
                      set(
                        'maxDiscountAmount',
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                    placeholder="Sınırsız"
                    className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                    Hediye Ürün ID
                  </label>
                  <input
                    value={(form as any).freeGiftProductId ?? ''}
                    onChange={(e) => set('freeGiftProductId', e.target.value || undefined)}
                    placeholder="Opsiyonel"
                    className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/30"
                  />
                </div>
              </>
            )}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                Başlangıç
              </label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/30"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                Bitiş
              </label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/30"
              />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => set('isActive', !form.isActive)} className="text-accent">
                {form.isActive ? (
                  <ToggleRight size={28} />
                ) : (
                  <ToggleLeft size={28} className="text-[#1A1033]/30" />
                )}
              </button>
              <span className="text-sm font-bold text-[#1A1033]/60">
                {form.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="px-5 py-2.5 bg-accent text-white rounded-2xl text-xs font-black uppercase disabled:opacity-50 hover:bg-accent/90 transition-colors"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : editing ? (
                'Güncelle'
              ) : (
                'Oluştur'
              )}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 bg-[#1A1033]/10 text-[#1A1033] rounded-2xl text-xs font-black uppercase hover:bg-[#1A1033]/20 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F8F8FA]">
              <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                Kampanya
              </th>
              <th className="pb-3 text-center text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                İndirim
              </th>
              <th className="pb-3 text-center text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                Hedef
              </th>
              <th className="pb-3 text-center text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                Tarih Aralığı
              </th>
              <th className="pb-3 text-center text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                Durum
              </th>
              <th className="pb-3 text-center text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => {
              const { label, cls } = campaignStatus(c);
              return (
                <tr
                  key={c.id}
                  className="border-b border-[#F8F8FA] hover:bg-[#F8F8FA]/50 transition-colors"
                >
                  <td className="py-3">
                    <p className="font-bold text-[#1A1033] text-xs">{c.name}</p>
                    {c.description && (
                      <p className="text-[10px] text-[#1A1033]/40 line-clamp-1">{c.description}</p>
                    )}
                  </td>
                  <td className="py-3 text-center font-bold text-[#1A1033] text-xs">
                    {c.discountType === 'percentage'
                      ? `%${c.discountValue}`
                      : `${c.discountValue} ₺`}
                  </td>
                  <td className="py-3 text-center text-[10px] font-bold text-[#1A1033]/60">
                    {TARGET_LABELS[c.targetType]}
                    {c.targetValue && (
                      <span className="block text-[#1A1033]/30">{c.targetValue}</span>
                    )}
                  </td>
                  <td className="py-3 text-center text-[10px] text-[#1A1033]/50">
                    <span>{c.startDate.slice(0, 10)}</span>
                    <span className="block">→ {c.endDate.slice(0, 10)}</span>
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-black uppercase',
                        cls,
                      )}
                    >
                      {label}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleToggle(c)}
                        className="p-1.5 rounded-lg hover:bg-[#F8F8FA] text-[#1A1033]/40 hover:text-accent transition-colors"
                      >
                        {c.isActive ? (
                          <ToggleRight size={16} className="text-accent" />
                        ) : (
                          <ToggleLeft size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 rounded-lg hover:bg-[#F8F8FA] text-[#1A1033]/40 hover:text-blue-500 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-[#1A1033]/40 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {campaigns.length === 0 && (
          <div className="text-center py-12">
            <Megaphone className="w-10 h-10 text-[#1A1033]/10 mx-auto mb-3" />
            <p className="text-[#1A1033]/30 text-sm font-bold">Henüz kampanya yok</p>
          </div>
        )}
      </div>
    </div>
  );
}
