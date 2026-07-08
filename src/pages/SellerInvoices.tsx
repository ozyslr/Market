import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  getInvoices,
  sendInvoiceToGib,
  cancelInvoice,
  downloadInvoiceXml,
  downloadInvoiceText,
  InvoiceData,
  InvoiceStatus,
} from '@/services/invoiceService';

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; cls: string }> = {
  draft: { label: 'Taslak', cls: 'bg-zinc-100 text-zinc-600' },
  sent: { label: 'Gönderildi', cls: 'bg-blue-50 text-blue-600' },
  approved: { label: 'Onaylandı', cls: 'bg-green-50 text-green-600' },
  rejected: { label: 'Reddedildi', cls: 'bg-red-50 text-red-600' },
  cancelled: { label: 'İptal', cls: 'bg-zinc-100 text-zinc-400 line-through' },
};

export function SellerInvoices() {
  const { firebaseUser } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all');
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    getInvoices({ sellerId: firebaseUser.uid }).then((data) => {
      setInvoices(data);
      setLoading(false);
    });
  }, [firebaseUser]);

  const handleSendToGib = async (invoiceId: string) => {
    setSendingId(invoiceId);
    const updated = await sendInvoiceToGib(invoiceId);
    setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? updated : i)));
    setSendingId(null);
  };

  const handleCancel = async (invoiceId: string) => {
    if (!confirm('Bu faturayı iptal etmek istiyor musunuz?')) return;
    await cancelInvoice(invoiceId);
    setInvoices((prev) =>
      prev.map((i) => (i.id === invoiceId ? { ...i, status: 'cancelled' } : i)),
    );
  };

  const filtered = filter === 'all' ? invoices : invoices.filter((i) => i.status === filter);

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8F8FA] p-6 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary">
              E-Fatura Yönetimi
            </h1>
            <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest mt-1">
              {invoices.length} fatura · UBL-TR 2.1 formatı · GİB entegrasyonu
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'draft', 'sent', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                filter === s
                  ? 'bg-brand-primary text-white'
                  : 'bg-white text-brand-primary/40 hover:text-brand-primary border border-brand-primary/5',
              )}
            >
              {s === 'all' ? 'Tümü' : STATUS_CONFIG[s as InvoiceStatus].label}
            </button>
          ))}
        </div>

        {/* Invoice List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-16 text-center border border-dashed border-brand-primary/10">
              <FileText size={40} className="mx-auto text-brand-primary/10 mb-4" />
              <p className="text-sm font-bold text-brand-primary/30">Henüz fatura yok</p>
              <p className="text-[10px] text-brand-primary/20 mt-1">
                Siparişler kargoya verildiğinde otomatik fatura oluşturulur
              </p>
            </div>
          ) : (
            filtered.map((invoice) => {
              const st = STATUS_CONFIG[invoice.status];
              return (
                <div
                  key={invoice.id}
                  className={cn(
                    'bg-white rounded-2xl p-5 border transition-all',
                    invoice.status === 'rejected' ? 'border-red-200' : 'border-brand-primary/5',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center',
                          st.cls
                            .replace('text-', 'bg-')
                            .replace('50', '100')
                            .replace('600', '500')
                            .replace('400', '300'),
                        )}
                      >
                        {invoice.status === 'approved' ? (
                          <CheckCircle size={22} className="text-green-600" />
                        ) : invoice.status === 'rejected' ? (
                          <XCircle size={22} className="text-red-500" />
                        ) : invoice.status === 'sent' ? (
                          <Send size={22} className="text-blue-500" />
                        ) : (
                          <Clock size={22} className="text-zinc-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-brand-primary text-sm">
                            {invoice.invoiceNumber}
                          </p>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-lg text-[9px] font-black uppercase',
                              st.cls,
                            )}
                          >
                            {st.label}
                          </span>
                          {invoice.ettn && (
                            <span className="font-mono text-[9px] text-brand-primary/40">
                              {invoice.ettn}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-brand-primary/40 mt-0.5">
                          {invoice.buyerName} ·{' '}
                          {new Date(invoice.invoiceDate).toLocaleDateString('tr-TR')}
                          {invoice.orderId &&
                            ` · Sipariş #${invoice.orderId.slice(-6).toUpperCase()}`}
                        </p>
                        {invoice.gibMessage && (
                          <p
                            className={cn(
                              'text-[10px] font-bold mt-1',
                              invoice.gibStatus === 'rejected' ? 'text-red-500' : 'text-green-600',
                            )}
                          >
                            {invoice.gibMessage}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <p className="text-lg font-display font-black text-brand-primary text-end">
                        {invoice.totalAmount.toFixed(2)}{' '}
                        <span className="text-xs">{invoice.currency}</span>
                      </p>
                      <div className="flex items-center gap-1 ms-2">
                        {(invoice.status === 'draft' || invoice.status === 'rejected') && (
                          <button
                            onClick={() => handleSendToGib(invoice.id!)}
                            disabled={sendingId === invoice.id}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all disabled:opacity-50"
                            title="GİB'e Gönder"
                          >
                            {sendingId === invoice.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Send size={14} />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => downloadInvoiceXml(invoice)}
                          className="p-2 bg-[#F8F8FA] text-brand-primary/60 rounded-lg hover:bg-brand-primary/10 transition-all"
                          title="XML İndir"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={() => downloadInvoiceText(invoice)}
                          className="p-2 bg-[#F8F8FA] text-brand-primary/60 rounded-lg hover:bg-brand-primary/10 transition-all"
                          title="Metin İndir"
                        >
                          <FileText size={14} />
                        </button>
                        {(invoice.status === 'draft' || invoice.status === 'sent') && (
                          <button
                            onClick={() => handleCancel(invoice.id!)}
                            className="p-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 transition-all"
                            title="İptal Et"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* UBL-TR Info */}
        <div className="bg-white rounded-2xl p-6 border border-brand-primary/5">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-accent" />
            <div>
              <p className="text-xs font-black text-brand-primary">UBL-TR 2.1 E-Fatura Formatı</p>
              <p className="text-[10px] text-brand-primary/40 mt-0.5">
                Faturalarınız GİB uyumlu UBL-TR 2.1 formatında oluşturulur ve XML olarak
                indirilebilir. Gerçek GİB entegrasyonu için mali mühür ve API bilgilerinizi
                ayarlardan girin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
