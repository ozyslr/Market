import React, { useState, useEffect } from 'react';
import { Loader2, RotateCcw, AlertCircle, MessageCircle, Send, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getAllTickets,
  addTicketMessage,
  updateTicketStatus,
  updateTicketPriority,
  SupportTicket,
  TicketStatus,
  TicketPriority,
} from '@/services/supportService';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  order: 'Sipariş',
  payment: 'Ödeme',
  return: 'İade',
  account: 'Hesap',
  other: 'Diğer',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: 'Açık', color: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: 'İşlemde', color: 'bg-blue-100 text-blue-700' },
  resolved: { label: 'Çözüldü', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Kapatıldı', color: 'bg-gray-100 text-gray-500' },
};

const PRIORITY_COLOR: Record<string, string> = {
  low: 'text-gray-400',
  medium: 'text-orange-400',
  high: 'text-red-500',
};

export function AdminSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TicketStatus | 'all'>('open');
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getAllTickets().then((data) => {
      setTickets(data);
      setLoading(false);
    });
  }, []);

  const filtered = tickets.filter((t) => filter === 'all' || t.status === filter);

  const handleStatusChange = async (id: string, status: TicketStatus) => {
    await updateTicketStatus(id, status);
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    if (selected?.id === id) setSelected((prev) => (prev ? { ...prev, status } : prev));
  };

  const handlePriorityChange = async (id: string, priority: TicketPriority) => {
    await updateTicketPriority(id, priority);
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, priority } : t)));
    if (selected?.id === id) setSelected((prev) => (prev ? { ...prev, priority } : prev));
  };

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      const msg = { role: 'admin' as const, text: replyText, ts: new Date().toISOString() };
      await addTicketMessage(selected.id, msg);
      const updated = { ...selected, messages: [...selected.messages, msg] };
      setSelected(updated);
      setTickets((prev) => prev.map((t) => (t.id === selected.id ? updated : t)));
      setReplyText('');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-display font-black uppercase italic tracking-tight text-brand-primary">
          Destek Biletleri
        </h2>
        <div className="flex gap-2 flex-wrap">
          {(['open', 'in_progress', 'resolved', 'closed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[10px] font-black transition-colors uppercase tracking-widest',
                filter === f
                  ? 'bg-accent text-white'
                  : 'bg-[#F8F8FA] text-brand-primary/60 hover:bg-accent/10',
              )}
            >
              {f === 'all'
                ? `Tümü (${tickets.length})`
                : f === 'open'
                  ? `Açık (${tickets.filter((t) => t.status === 'open').length})`
                  : f === 'in_progress'
                    ? 'İşlemde'
                    : f === 'resolved'
                      ? 'Çözüldü'
                      : 'Kapatıldı'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Ticket list */}
        <div className="xl:col-span-1 space-y-2 max-h-[700px] overflow-y-auto pe-1">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#F8F8FA] py-12 text-center text-brand-primary/30 text-sm font-bold">
              <MessageCircle size={28} className="mx-auto mb-2 opacity-30" />
              Kayıt bulunamadı
            </div>
          ) : (
            filtered.map((ticket) => {
              const sc = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelected(ticket)}
                  className={cn(
                    'w-full text-start bg-white rounded-2xl p-4 border transition-all hover:border-accent/30',
                    selected?.id === ticket.id ? 'border-accent shadow-sm' : 'border-[#F8F8FA]',
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-[11px] font-black text-brand-primary leading-tight line-clamp-2">
                      {ticket.subject}
                    </p>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-lg text-[9px] font-black uppercase shrink-0',
                        sc.color,
                      )}
                    >
                      {sc.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-brand-primary/40">
                      {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                    </span>
                    {ticket.userEmail && (
                      <span className="text-[9px] text-brand-primary/30 truncate">
                        {ticket.userEmail}
                      </span>
                    )}
                    <span
                      className={cn(
                        'ms-auto text-[9px] font-black uppercase shrink-0',
                        PRIORITY_COLOR[ticket.priority],
                      )}
                    >
                      {ticket.priority === 'high'
                        ? '⚡ Yüksek'
                        : ticket.priority === 'medium'
                          ? 'Orta'
                          : 'Düşük'}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Detail */}
        <div className="xl:col-span-2">
          {selected ? (
            <div
              className="bg-white rounded-2xl border border-[#F8F8FA] flex flex-col"
              style={{ minHeight: 500 }}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-brand-primary/5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/30 mb-1">
                      #{selected.id.slice(0, 8)} · {CATEGORY_LABELS[selected.category]}
                      {selected.userName && ` · ${selected.userName}`}
                    </p>
                    <h3 className="text-sm font-black text-brand-primary">{selected.subject}</h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <select
                      value={selected.priority}
                      onChange={(e) =>
                        handlePriorityChange(selected.id, e.target.value as TicketPriority)
                      }
                      className="px-2 py-1.5 rounded-xl border border-brand-primary/10 text-[10px] font-black outline-none"
                    >
                      <option value="low">Düşük</option>
                      <option value="medium">Orta</option>
                      <option value="high">Yüksek</option>
                    </select>
                    <select
                      value={selected.status}
                      onChange={(e) =>
                        handleStatusChange(selected.id, e.target.value as TicketStatus)
                      }
                      className="px-2 py-1.5 rounded-xl border border-brand-primary/10 text-[10px] font-black outline-none"
                    >
                      <option value="open">Açık</option>
                      <option value="in_progress">İşlemde</option>
                      <option value="resolved">Çözüldü</option>
                      <option value="closed">Kapatıldı</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-80">
                {selected.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn('flex', msg.role === 'admin' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                        msg.role === 'admin'
                          ? 'bg-accent text-white rounded-ee-sm'
                          : 'bg-[#F8F8FA] text-brand-primary rounded-es-sm',
                      )}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                      <p className="text-[9px] mt-1 opacity-60">
                        {new Date(msg.ts).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Admin reply */}
              {selected.status !== 'closed' && (
                <div className="px-6 py-4 border-t border-brand-primary/5 flex gap-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                    placeholder="Admin yanıtı yazın..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-brand-primary/10 text-sm font-bold outline-none focus:border-accent/50 bg-[#F8F8FA] resize-none"
                  />
                  <button
                    onClick={handleReply}
                    disabled={sending || !replyText.trim()}
                    className="px-4 py-2.5 bg-accent text-white rounded-xl hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#F8F8FA] flex flex-col items-center justify-center py-24 gap-3 text-brand-primary/20">
              <MessageCircle size={40} strokeWidth={1} />
              <p className="text-sm font-bold">Bir bilet seçin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
