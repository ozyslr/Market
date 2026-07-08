import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Plus, Trash2, Loader2, Clock,
  Package, BarChart3, Tag, AlertCircle, CheckCircle2,
  X, ToggleLeft, ToggleRight, Percent, DollarSign,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Product } from '@/types';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import {
  PricingRule, PricingRuleType, PriceAdjustment,
  createRule, updateRule, deleteRule, getRulesBySeller,
  calculateDynamicPrice,
} from '@/services/dynamicPricingService';

function formatCurrency(amount: number) {
  return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺';
}

const RULE_LABELS: Record<PricingRuleType, string> = {
  stock_based: 'Stok Bazlı',
  time_based: 'Zaman Bazlı',
  demand_based: 'Talep Bazlı',
};

const RULE_ICONS: Record<PricingRuleType, React.ElementType> = {
  stock_based: Package,
  time_based: Clock,
  demand_based: BarChart3,
};

const RULE_DESCS: Record<PricingRuleType, string> = {
  stock_based: 'Stok seviyesine göre fiyatı otomatik ayarla',
  time_based: 'Belirli saat/günlerde indirim uygula',
  demand_based: 'Popülerlik ve görüntülenmeye göre fiyat güncelle',
};

export function SellerPricing() {
  const { user } = useAuth();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formProductId, setFormProductId] = useState('');
  const [formRuleType, setFormRuleType] = useState<PricingRuleType>('stock_based');
  const [formAdjustType, setFormAdjustType] = useState<PriceAdjustment>('percentage');
  const [formAdjustValue, setFormAdjustValue] = useState(-10);
  const [formStockThreshold, setFormStockThreshold] = useState(5);
  const [formOverstockThreshold, setFormOverstockThreshold] = useState(50);
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('18:00');
  const [formMinViews, setFormMinViews] = useState(100);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      getRulesBySeller(user.id),
      getDocs(query(collection(db, 'products'), limit(50))),
    ]).then(([ruleData, snap]) => {
      setRules(ruleData);
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Product));
    }).finally(() => setLoading(false));
  }, [user?.id]);

  async function handleCreate() {
    if (!user?.id || !formProductId) return;
    setSaving(true);
    const selectedProduct = products.find(p => p.id === formProductId);
    try {
      const id = await createRule({
        sellerId: user.id,
        productId: formProductId,
        productTitle: selectedProduct?.title || 'Ürün',
        ruleType: formRuleType,
        enabled: true,
        adjustmentType: formAdjustType,
        adjustmentValue: formAdjustValue,
        stockThreshold: formRuleType === 'stock_based' ? formStockThreshold : undefined,
        overstockThreshold: formRuleType === 'stock_based' ? formOverstockThreshold : undefined,
        startTime: formRuleType === 'time_based' ? formStartTime : undefined,
        endTime: formRuleType === 'time_based' ? formEndTime : undefined,
        daysOfWeek: formRuleType === 'time_based' ? [1, 2, 3, 4, 5] : undefined,
        minViews: formRuleType === 'demand_based' ? formMinViews : undefined,
      });
      // Refresh
      const updated = await getRulesBySeller(user.id);
      setRules(updated);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(rule: PricingRule) {
    await updateRule(rule.id, { enabled: !rule.enabled });
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r));
  }

  async function handleDelete(id: string) {
    await deleteRule(id);
    setRules(prev => prev.filter(r => r.id !== id));
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-emerald-400" />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={20} className="text-emerald-400" />
            <h1 className="text-xl font-bold text-white">Dinamik Fiyatlandırma</h1>
          </div>
          <p className="text-sm text-zinc-400">Stok, zaman ve talebe göre fiyatları otomatik yönetin</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'İptal' : 'Kural Ekle'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-zinc-300">Yeni Fiyatlandırma Kuralı</h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Product selector */}
            <div className="col-span-2">
              <label className="block text-xs text-zinc-400 mb-1">Ürün *</label>
              <select
                value={formProductId}
                onChange={e => setFormProductId(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="">Ürün seçin</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.title} ({p.price.toLocaleString('tr-TR')} ₺)</option>
                ))}
              </select>
            </div>

            {/* Rule type */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Kural Türü</label>
              <div className="flex gap-2">
                {(Object.entries(RULE_LABELS) as [PricingRuleType, string][]).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => setFormRuleType(type)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all',
                      formRuleType === type
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Adjustment */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Ayar Türü</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormAdjustType('percentage')}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1',
                    formAdjustType === 'percentage'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600',
                  )}
                >
                  <Percent size={12} /> Yüzde
                </button>
                <button
                  onClick={() => setFormAdjustType('fixed')}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1',
                    formAdjustType === 'fixed'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600',
                  )}
                >
                  <DollarSign size={12} /> Sabit
                </button>
              </div>
            </div>

            {/* Adjustment value */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Ayar Değeri {formAdjustType === 'percentage' ? '(%)' : '(₺)'}
                <span className={cn('ms-2 text-xs', formAdjustValue < 0 ? 'text-red-400' : 'text-green-400')}>
                  {formAdjustValue < 0 ? 'İndirim' : 'Zam'}
                </span>
              </label>
              <input
                type="number"
                value={formAdjustValue}
                onChange={e => setFormAdjustValue(parseInt(e.target.value) || 0)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
              />
              <p className="text-[10px] text-zinc-500 mt-1">Negatif değer = indirim, pozitif = zam</p>
            </div>

            {/* Rule-specific fields */}
            {formRuleType === 'stock_based' && (
              <>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Düşük Stok Eşiği (adet)</label>
                  <input
                    type="number" min={0} value={formStockThreshold}
                    onChange={e => setFormStockThreshold(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Bu adedin altında fiyat artar</p>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Yüksek Stok Eşiği (adet)</label>
                  <input
                    type="number" min={0} value={formOverstockThreshold}
                    onChange={e => setFormOverstockThreshold(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Bu adedin üzerinde fiyat düşer</p>
                </div>
              </>
            )}

            {formRuleType === 'time_based' && (
              <>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Başlangıç Saati</label>
                  <input
                    type="time" value={formStartTime}
                    onChange={e => setFormStartTime(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Bitiş Saati</label>
                  <input
                    type="time" value={formEndTime}
                    onChange={e => setFormEndTime(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </>
            )}

            {formRuleType === 'demand_based' && (
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Min. Görüntülenme</label>
                <input
                  type="number" min={0} value={formMinViews}
                  onChange={e => setFormMinViews(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Bu sayıya ulaşan ürünlerde kural aktif olur</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleCreate}
              disabled={saving || !formProductId}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Kural Oluştur
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/50 rounded-2xl border border-zinc-800">
          <TrendingUp size={40} className="text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">Henüz fiyatlandırma kuralı yok</p>
          <p className="text-zinc-600 text-sm mt-1">Yukarıdaki butonu kullanarak ilk kuralınızı oluşturun</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => {
            const Icon = RULE_ICONS[rule.ruleType];
            const product = products.find(p => p.id === rule.productId);
            const priceResult = calculateDynamicPrice(
              { id: rule.productId, price: product?.price || 0, stock: product?.stock, views: 100 },
              [rule],
            );

            return (
              <div
                key={rule.id}
                className={cn(
                  'bg-zinc-900 border rounded-xl p-5 flex items-center gap-5 transition-all',
                  rule.enabled ? 'border-zinc-700' : 'border-zinc-800 opacity-60',
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  rule.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500',
                )}>
                  <Icon size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white truncate">{rule.productTitle}</span>
                    <span className={cn(
                      'text-[10px] font-medium px-2 py-0.5 rounded-full',
                      rule.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500',
                    )}>
                      {RULE_LABELS[rule.ruleType]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Tag size={12} />
                      {rule.adjustmentType === 'percentage' ? `%${rule.adjustmentValue}` : `${rule.adjustmentValue} ₺`}
                    </span>
                    {rule.ruleType === 'stock_based' && (
                      <span>Stok &lt;{rule.stockThreshold} / &gt;{rule.overstockThreshold}</span>
                    )}
                    {rule.ruleType === 'time_based' && (
                      <span>{rule.startTime} - {rule.endTime}</span>
                    )}
                    {rule.ruleType === 'demand_based' && (
                      <span>≥{rule.minViews} görüntülenme</span>
                    )}
                    {priceResult.applied && (
                      <span className="text-emerald-400">
                        {formatCurrency(priceResult.dynamicPrice)} ({priceResult.discount > 0 ? 'indirimli' : 'artışlı'})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(rule)}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      rule.enabled ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-zinc-600 hover:bg-zinc-800',
                    )}
                    title={rule.enabled ? 'Devre dışı bırak' : 'Aktifleştir'}
                  >
                    {rule.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Nasıl Çalışır?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <Package size={14} /> Stok Bazlı
            </div>
            <p className="text-zinc-500 text-xs">Stok azaldığında fiyat artar, çok stokta bekleyen ürünlerde fiyat düşer.</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <Clock size={14} /> Zaman Bazlı
            </div>
            <p className="text-zinc-500 text-xs">Belirlediğiniz saat aralıklarında otomatik indirim uygulanır.</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <BarChart3 size={14} /> Talep Bazlı
            </div>
            <p className="text-zinc-500 text-xs">Popüler ürünlerin fiyatı görüntülenme sayısına göre optimize edilir.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
