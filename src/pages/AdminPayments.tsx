import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Save,
  X,
  RefreshCw,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  getPaymentProviders,
  savePaymentProvider,
  updatePaymentProvider,
  deletePaymentProvider,
} from '@/services/paymentProviderService';
import { PaymentProvider, ProviderKey, PROVIDER_TEMPLATES } from '@/types/payment';

const REGION_LABELS: Record<string, string> = {
  TR: 'Türkiye',
  EU: 'Avrupa',
  UK: 'Birleşik Krallık',
  US: 'ABD',
  GLOBAL: 'Global',
};

function MaskedInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pe-10 px-4 py-2.5 bg-[#F8F8FA] rounded-xl text-xs font-mono border border-transparent focus:border-accent/20 outline-none"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute end-3 top-1/2 -translate-y-1/2 text-brand-primary/30 hover:text-brand-primary transition-colors"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

interface ConfigFormProps {
  providerKey: ProviderKey;
  initial?: PaymentProvider;
  onSave: (data: Omit<PaymentProvider, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

function ConfigForm({ providerKey, initial, onSave, onCancel }: ConfigFormProps) {
  const template = PROVIDER_TEMPLATES.find((t) => t.key === providerKey)!;
  const [config, setConfig] = useState<Record<string, string>>(initial?.config ?? {});
  const [regions, setRegions] = useState<string[]>(initial?.regions ?? template.regions);
  const [saving, setSaving] = useState(false);

  const allRegions = ['TR', 'EU', 'UK', 'US', 'GLOBAL'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        key: providerKey,
        name: template.name,
        active: initial?.active ?? false,
        regions,
        config,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 mt-6 p-6 bg-[#F8F8FA] rounded-[1.5rem] border border-brand-primary/5"
    >
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-3">
          Aktif Bölgeler
        </p>
        <div className="flex flex-wrap gap-2">
          {allRegions.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() =>
                setRegions((prev) =>
                  prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
                )
              }
              className={cn(
                'px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border',
                regions.includes(r)
                  ? 'bg-brand-primary text-white border-transparent'
                  : 'bg-white text-brand-primary/40 border-brand-primary/10 hover:border-brand-primary/30',
              )}
            >
              {REGION_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
          API Yapılandırması
        </p>
        {template.configFields.map((field) => (
          <div key={field.key}>
            <label className="block text-[10px] font-bold text-brand-primary/60 uppercase tracking-widest mb-1.5">
              {field.label}
            </label>
            {field.sensitive ? (
              <MaskedInput
                value={config[field.key] ?? ''}
                onChange={(v) => setConfig((c) => ({ ...c, [field.key]: v }))}
                placeholder={field.placeholder}
              />
            ) : (
              <input
                type="text"
                value={config[field.key] ?? ''}
                onChange={(e) => setConfig((c) => ({ ...c, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full px-4 py-2.5 bg-white rounded-xl text-xs font-mono border border-transparent focus:border-accent/20 outline-none"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40 hover:bg-accent transition-all"
        >
          {saving ? (
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={13} />
          )}
          Kaydet
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-5 py-3 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-primary/10 hover:border-brand-primary/30 transition-all"
        >
          <X size={13} /> İptal
        </button>
      </div>
    </form>
  );
}

export function AdminPayments() {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingKey, setAddingKey] = useState<ProviderKey | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    getPaymentProviders().then((data) => {
      setProviders(data);
      setLoading(false);
    });
  }, []);

  const configuredKeys = new Set(providers.map((p) => p.key));

  async function handleSaveNew(data: Omit<PaymentProvider, 'id' | 'createdAt' | 'updatedAt'>) {
    const saved = await savePaymentProvider(data);
    setProviders((prev) => [...prev, saved]);
    setAddingKey(null);
  }

  async function handleUpdate(
    id: string,
    data: Omit<PaymentProvider, 'id' | 'createdAt' | 'updatedAt'>,
  ) {
    await updatePaymentProvider(id, data);
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)),
    );
    setEditingId(null);
  }

  async function toggleActive(p: PaymentProvider) {
    await updatePaymentProvider(p.id, { active: !p.active });
    setProviders((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)));
  }

  async function handleDelete(id: string) {
    await deletePaymentProvider(id);
    setProviders((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary">
            Ödeme Sistemleri
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30 mt-1">
            {providers.filter((p) => p.active).length} aktif sağlayıcı
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            getPaymentProviders().then((d) => {
              setProviders(d);
              setLoading(false);
            });
          }}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-[#F8F8FA] rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all"
        >
          <RefreshCw size={14} /> Yenile
        </button>
      </div>

      {/* Configured Providers */}
      {providers.length > 0 && (
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
            Yapılandırılmış Sağlayıcılar
          </p>
          {providers.map((p) => {
            const tpl = PROVIDER_TEMPLATES.find((t) => t.key === p.key);
            return (
              <motion.div
                key={p.id}
                layout
                className="bg-white rounded-[2rem] border border-[#F8F8FA] shadow-sm overflow-hidden"
              >
                <div className="p-6 flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0"
                    style={{ backgroundColor: tpl?.color ?? '#1A1033' }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-black text-brand-primary text-sm">{p.name}</p>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest',
                          p.active ? 'bg-green-50 text-green-600' : 'bg-zinc-100 text-zinc-400',
                        )}
                      >
                        {p.active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {p.regions.map((r) => (
                        <span
                          key={r}
                          className="flex items-center gap-1 px-2 py-0.5 bg-[#F8F8FA] rounded text-[9px] font-black uppercase tracking-widest text-brand-primary/50"
                        >
                          <Globe size={8} /> {REGION_LABELS[r] ?? r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(p)}
                      className={cn(
                        'p-2.5 rounded-xl transition-all',
                        p.active
                          ? 'bg-green-50 text-green-600 hover:bg-red-50 hover:text-red-500'
                          : 'bg-[#F8F8FA] text-brand-primary/30 hover:bg-green-50 hover:text-green-600',
                      )}
                    >
                      {p.active ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </button>
                    <button
                      onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                      className="p-2.5 bg-[#F8F8FA] rounded-xl text-brand-primary/40 hover:text-brand-primary transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2.5 bg-[#F8F8FA] rounded-xl text-brand-primary/20 hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                  {editingId === p.id && tpl && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 overflow-hidden"
                    >
                      <ConfigForm
                        providerKey={p.key}
                        initial={p}
                        onSave={(data) => handleUpdate(p.id, data)}
                        onCancel={() => setEditingId(null)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add New Provider */}
      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
          Sağlayıcı Ekle
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {PROVIDER_TEMPLATES.filter((t) => !configuredKeys.has(t.key)).map((tpl) => (
            <motion.div key={tpl.key} layout>
              <button
                onClick={() => setAddingKey(addingKey === tpl.key ? null : tpl.key)}
                className={cn(
                  'w-full text-start p-6 rounded-[2rem] border transition-all group',
                  addingKey === tpl.key
                    ? 'border-accent/30 bg-accent/5 shadow-lg'
                    : 'border-[#F8F8FA] bg-white hover:border-brand-primary/10 hover:shadow-md',
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0"
                    style={{ backgroundColor: tpl.color }}
                  >
                    {tpl.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-black text-brand-primary text-sm">{tpl.name}</p>
                      <Plus
                        size={16}
                        className={cn(
                          'transition-transform',
                          addingKey === tpl.key ? 'rotate-45 text-accent' : 'text-brand-primary/20',
                        )}
                      />
                    </div>
                    <p className="text-[10px] font-medium text-brand-primary/50 leading-relaxed mb-3">
                      {tpl.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {tpl.regions.map((r) => (
                        <span
                          key={r}
                          className="px-2 py-0.5 bg-[#F8F8FA] group-hover:bg-white rounded text-[9px] font-black uppercase tracking-widest text-brand-primary/40 transition-colors"
                        >
                          {REGION_LABELS[r] ?? r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
              <AnimatePresence>
                {addingKey === tpl.key && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden px-1"
                  >
                    <ConfigForm
                      providerKey={tpl.key}
                      onSave={handleSaveNew}
                      onCancel={() => setAddingKey(null)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
          {PROVIDER_TEMPLATES.every((t) => configuredKeys.has(t.key)) && (
            <div className="col-span-full py-8 text-center text-[10px] font-black uppercase tracking-widest text-brand-primary/20">
              Tüm sağlayıcılar yapılandırıldı
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
