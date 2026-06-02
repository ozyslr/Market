import React, { useState, useEffect } from 'react';
import {
  Webhook,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Zap,
  Play,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  getDeliveryLogs,
  testWebhook,
  WEBHOOK_EVENT_LABELS,
  WebhookEventType,
  WebhookSubscription,
  WebhookDeliveryLog,
} from '@/services/webhookService';

const EVENT_GROUPS: { label: string; events: WebhookEventType[] }[] = [
  {
    label: 'Siparişler',
    events: [
      'order.created',
      'order.shipped',
      'order.delivered',
      'order.cancelled',
      'order.returned',
    ],
  },
  { label: 'Ürünler', events: ['product.created', 'product.updated', 'product.deleted'] },
  { label: 'Satıcılar', events: ['seller.verified', 'seller.suspended'] },
  { label: 'Ödemeler', events: ['payout.completed'] },
  { label: 'İadeler', events: ['return.created', 'return.approved', 'return.received'] },
  { label: 'Faturalar', events: ['invoice.created'] },
];

export function AdminWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    status: number;
    duration: number;
  } | null>(null);

  // View logs
  const [viewingLogs, setViewingLogs] = useState<string | null>(null);
  const [logs, setLogs] = useState<WebhookDeliveryLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    ownerId: 'admin',
    name: '',
    url: '',
    events: [] as WebhookEventType[],
    secret: '',
    isActive: true,
    headers: {} as Record<string, string>,
    maxRetries: 3,
  });

  useEffect(() => {
    getWebhooks().then((data) => {
      setWebhooks(data);
      setLoading(false);
    });
  }, []);

  const toggleEvent = (event: WebhookEventType) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter((e) => e !== event) : [...f.events, event],
    }));
  };

  const handleCreate = async () => {
    if (!form.name || !form.url || form.events.length === 0) return;
    setSaving(true);
    const created = await createWebhook({
      ...form,
      url: form.url.trim(),
      secret: form.secret.trim() || undefined,
    });
    setWebhooks((prev) => [created, ...prev]);
    setForm({
      ownerId: 'admin',
      name: '',
      url: '',
      events: [],
      secret: '',
      isActive: true,
      headers: {},
      maxRetries: 3,
    });
    setShowForm(false);
    setSaving(false);
  };

  const handleToggle = async (wh: WebhookSubscription) => {
    await updateWebhook(wh.id, { isActive: !wh.isActive });
    setWebhooks((prev) => prev.map((w) => (w.id === wh.id ? { ...w, isActive: !w.isActive } : w)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu webhook'u silmek istiyor musunuz?")) return;
    await deleteWebhook(id);
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  };

  const handleTest = async (wh: WebhookSubscription) => {
    setTestingId(wh.id);
    setTestResult(null);
    const result = await testWebhook(wh.id);
    setTestResult(result);
    setTestingId(null);
  };

  const handleViewLogs = async (subscriptionId: string) => {
    setViewingLogs(subscriptionId);
    setLogsLoading(true);
    const data = await getDeliveryLogs(subscriptionId, 30);
    setLogs(data);
    setLogsLoading(false);
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );

  return (
    <div className="bg-white rounded-[3.5rem] p-8 lg:p-12 border border-[#F8F8FA] shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">
            Webhook Yönetimi
          </h3>
          <p className="text-[10px] font-bold text-[#1A1033]/40 uppercase tracking-widest mt-1">
            15 event tipi · Otomatik retry · HMAC imza
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-5 py-3 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all"
        >
          <Plus size={14} /> Yeni Webhook
        </button>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-5">
            <h3 className="text-xl font-display font-black text-[#1A1033]">Yeni Webhook</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 block mb-1">
                  İsim
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Sipariş Webhook'u"
                  className="w-full px-3 py-2.5 bg-[#F8F8FA] rounded-xl text-sm font-bold outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 block mb-1">
                  URL
                </label>
                <input
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://api.example.com/webhook"
                  className="w-full px-3 py-2.5 bg-[#F8F8FA] rounded-xl text-sm font-mono font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 block mb-1">
                  Secret (opsiyonel)
                </label>
                <input
                  value={form.secret}
                  onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
                  placeholder="HMAC imza anahtarı"
                  className="w-full px-3 py-2.5 bg-[#F8F8FA] rounded-xl text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 block mb-1">
                  Max Retry
                </label>
                <select
                  value={form.maxRetries}
                  onChange={(e) => setForm((f) => ({ ...f, maxRetries: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2.5 bg-[#F8F8FA] rounded-xl text-sm font-bold outline-none"
                >
                  {[0, 1, 2, 3, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} deneme
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Event Selection */}
            <div>
              <label className="text-[9px] font-bold uppercase text-[#1A1033]/40 block mb-2">
                Event&apos;ler ({form.events.length} seçili)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {EVENT_GROUPS.map((group) => (
                  <div key={group.label} className="bg-[#F8F8FA] rounded-xl p-3">
                    <p className="text-[9px] font-black uppercase text-[#1A1033]/40 mb-2">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {group.events.map((event) => (
                        <label key={event} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.events.includes(event)}
                            onChange={() => toggleEvent(event)}
                            className="w-3.5 h-3.5 rounded accent-accent"
                          />
                          <span className="text-[10px] font-bold text-[#1A1033]">
                            {WEBHOOK_EVENT_LABELS[event]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 bg-[#F8F8FA] text-[#1A1033] rounded-xl text-[10px] font-black uppercase"
              >
                İptal
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.name || !form.url || form.events.length === 0}
                className="flex-1 py-3 bg-accent text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}{' '}
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhook List */}
      <div className="space-y-3">
        {webhooks.length === 0 && (
          <div className="text-center py-16">
            <Webhook size={40} className="mx-auto text-[#1A1033]/10 mb-4" />
            <p className="text-sm font-bold text-[#1A1033]/30">Henüz webhook yok</p>
          </div>
        )}
        {webhooks.map((wh) => (
          <div
            key={wh.id}
            className={cn(
              'bg-[#F8F8FA] rounded-2xl p-5 border transition-all',
              wh.isActive ? 'border-transparent' : 'border-[#F8F8FA] opacity-60',
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-[#1A1033]">{wh.name}</span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase',
                      wh.lastStatus === 'success'
                        ? 'bg-green-100 text-green-600'
                        : wh.lastStatus === 'failed'
                          ? 'bg-red-100 text-red-500'
                          : 'bg-zinc-100 text-zinc-500',
                    )}
                  >
                    {wh.lastStatus === 'success' ? (
                      <CheckCircle size={8} />
                    ) : wh.lastStatus === 'failed' ? (
                      <XCircle size={8} />
                    ) : (
                      <Clock size={8} />
                    )}
                    {wh.lastStatus || 'pending'}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-[#1A1033]/40 mt-1">{wh.url}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleTest(wh)}
                  disabled={testingId === wh.id}
                  className="p-2 text-[#1A1033]/30 hover:text-accent transition-colors"
                  title="Test"
                >
                  {testingId === wh.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Play size={14} />
                  )}
                </button>
                <button
                  onClick={() => handleViewLogs(wh.id)}
                  className="p-2 text-[#1A1033]/30 hover:text-blue-500 transition-colors"
                  title="Loglar"
                >
                  <Eye size={14} />
                </button>
                <button onClick={() => handleToggle(wh)} className="transition-colors">
                  {wh.isActive ? (
                    <ToggleRight size={20} className="text-accent" />
                  ) : (
                    <ToggleLeft size={20} className="text-[#1A1033]/30" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(wh.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {wh.events.map((e) => (
                <span
                  key={e}
                  className="px-2 py-0.5 bg-white rounded-lg text-[8px] font-black uppercase text-[#1A1033]/50"
                >
                  {WEBHOOK_EVENT_LABELS[e]}
                </span>
              ))}
            </div>
            {wh.lastDeliveryAt && (
              <p className="text-[9px] text-[#1A1033]/30 mt-2">
                Son: {new Date(wh.lastDeliveryAt).toLocaleString('tr-TR')}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Test Result Toast */}
      {testResult && (
        <div
          className={cn(
            'fixed bottom-6 end-6 rounded-2xl p-4 shadow-xl z-50',
            testResult.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white',
          )}
        >
          <p className="text-xs font-black">
            {testResult.success ? 'Başarılı!' : 'Başarısız'} — HTTP {testResult.status} (
            {testResult.duration}ms)
          </p>
          <button onClick={() => setTestResult(null)} className="text-[10px] underline mt-1">
            Kapat
          </button>
        </div>
      )}

      {/* Delivery Logs Modal */}
      {viewingLogs && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display font-black text-[#1A1033]">Teslimat Logları</h3>
              <button
                onClick={() => {
                  setViewingLogs(null);
                  setLogs([]);
                }}
                className="p-2 hover:bg-[#F8F8FA] rounded-xl"
              >
                ✕
              </button>
            </div>
            {logsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-center py-8 text-sm text-[#1A1033]/30">Henüz log yok</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      'rounded-xl p-3 text-xs',
                      log.status === 'success'
                        ? 'bg-green-50'
                        : log.status === 'retrying'
                          ? 'bg-amber-50'
                          : 'bg-red-50',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black">
                        {WEBHOOK_EVENT_LABELS[log.eventType] || log.eventType}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-lg text-[9px] font-black uppercase',
                          log.status === 'success'
                            ? 'bg-green-200 text-green-700'
                            : log.status === 'retrying'
                              ? 'bg-amber-200 text-amber-700'
                              : 'bg-red-200 text-red-700',
                        )}
                      >
                        {log.status}
                      </span>
                    </div>
                    <p className="text-[#1A1033]/40 mt-1">
                      HTTP {log.responseStatus} · {log.duration}ms · Deneme {log.attempt}
                      {log.errorMessage && ` · ${log.errorMessage}`}
                    </p>
                    <p className="text-[#1A1033]/30 mt-0.5">
                      {new Date(log.createdAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
