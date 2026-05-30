import React, { useState, useEffect } from 'react';
import {
  MessageCircle, Plus, ChevronRight, Loader2, Send,
  CheckCircle2, Clock, AlertCircle, X, Package
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  createTicket, getUserTickets, addTicketMessage,
  SupportTicket, TicketCategory, TicketPriority
} from '@/services/supportService';
import { cn } from '@/lib/utils';
import { SEO } from '@/components/common/SEO';

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  order: 'Sipariş',
  payment: 'Ödeme',
  return: 'İade / İptal',
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

export function UserSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    subject: '',
    category: 'order' as TicketCategory,
    priority: 'medium' as TicketPriority,
    message: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getUserTickets(user.id).then(data => { setTickets(data); setLoading(false); });
  }, [user]);

  if (!user) {
    return (
      <div className="flex justify-center py-24">
        <p className="text-sm text-gray-500">Giriş yapmanız gerekiyor.</p>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.message.trim()) return;
    setCreating(true);
    try {
      await createTicket({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        subject: form.subject,
        category: form.category,
        priority: form.priority,
        status: 'open',
        initialMessage: form.message,
      });
      setForm({ subject: '', category: 'order', priority: 'medium', message: '' });
      setShowNewForm(false);
      const updated = await getUserTickets(user.id);
      setTickets(updated);
    } finally {
      setCreating(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setSending(true);
    try {
      const msg = { role: 'user' as const, text: replyText, ts: new Date().toISOString() };
      await addTicketMessage(selectedTicket.id, msg);
      setSelectedTicket(prev => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
      setTickets(prev => prev.map(t => t.id === selectedTicket.id
        ? { ...t, messages: [...t.messages, msg] } : t));
      setReplyText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8FA] p-6 lg:p-10">
      <SEO title="Destek Merkezi" />
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">
              Destek Merkezi
            </h1>
            <p className="text-xs text-[#1A1033]/40 mt-1 font-bold uppercase tracking-widest">
              {tickets.length} bilet
            </p>
          </div>
          <button
            onClick={() => { setShowNewForm(true); setSelectedTicket(null); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent/90 transition-colors"
          >
            <Plus size={14} /> Yeni Bilet
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Ticket list */}
          <div className="lg:col-span-1 space-y-2">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-[#1A1033]/5">
                <MessageCircle size={32} className="mx-auto mb-3 text-[#1A1033]/20" />
                <p className="text-xs font-bold text-[#1A1033]/40">Henüz biletiniz yok.</p>
              </div>
            ) : (
              tickets.map(ticket => {
                const sc = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => { setSelectedTicket(ticket); setShowNewForm(false); }}
                    className={cn(
                      'w-full text-start bg-white rounded-2xl p-4 border transition-all hover:border-accent/30',
                      selectedTicket?.id === ticket.id ? 'border-accent shadow-sm' : 'border-[#1A1033]/5'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-[11px] font-black text-[#1A1033] leading-tight line-clamp-2">{ticket.subject}</p>
                      <ChevronRight size={12} className="text-[#1A1033]/30 shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-black uppercase', sc.color)}>
                        {sc.label}
                      </span>
                      <span className="text-[9px] text-[#1A1033]/40">{CATEGORY_LABELS[ticket.category]}</span>
                      <span className={cn('ms-auto text-[9px] font-black uppercase', PRIORITY_COLOR[ticket.priority])}>
                        {ticket.priority === 'high' ? '⚡ Yüksek' : ticket.priority === 'medium' ? 'Orta' : 'Düşük'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right: Detail / New form */}
          <div className="lg:col-span-2">
            {showNewForm ? (
              <div className="bg-white rounded-2xl border border-[#1A1033]/5 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#1A1033]">Yeni Destek Bileti</h2>
                  <button onClick={() => setShowNewForm(false)} className="p-1 text-[#1A1033]/40 hover:text-accent">
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">Konu</label>
                    <input
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      placeholder="Talebinizi kısaca açıklayın"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#1A1033]/10 text-sm font-bold outline-none focus:border-accent/50 bg-[#F8F8FA]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">Kategori</label>
                      <select
                        value={form.category}
                        onChange={e => setForm(f => ({ ...f, category: e.target.value as TicketCategory }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#1A1033]/10 text-sm font-bold outline-none focus:border-accent/50 bg-[#F8F8FA]"
                      >
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">Öncelik</label>
                      <select
                        value={form.priority}
                        onChange={e => setForm(f => ({ ...f, priority: e.target.value as TicketPriority }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#1A1033]/10 text-sm font-bold outline-none focus:border-accent/50 bg-[#F8F8FA]"
                      >
                        <option value="low">Düşük</option>
                        <option value="medium">Orta</option>
                        <option value="high">Yüksek</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">Mesajınız</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      rows={5}
                      placeholder="Sorununuzu detaylı açıklayın..."
                      className="w-full px-4 py-3 rounded-xl border border-[#1A1033]/10 text-sm font-bold outline-none focus:border-accent/50 bg-[#F8F8FA] resize-none"
                    />
                  </div>
                  <button
                    onClick={handleCreate}
                    disabled={creating || !form.subject.trim() || !form.message.trim()}
                    className="w-full py-3 bg-accent text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {creating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {creating ? 'Gönderiliyor...' : 'Bilet Oluştur'}
                  </button>
                </div>
              </div>
            ) : selectedTicket ? (
              <div className="bg-white rounded-2xl border border-[#1A1033]/5 flex flex-col" style={{ minHeight: '500px' }}>
                {/* Ticket header */}
                <div className="px-6 py-4 border-b border-[#1A1033]/5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/30 mb-1">
                        #{selectedTicket.id.slice(0, 8)} · {CATEGORY_LABELS[selectedTicket.category]}
                      </p>
                      <h3 className="text-sm font-black text-[#1A1033]">{selectedTicket.subject}</h3>
                    </div>
                    <span className={cn('px-2 py-1 rounded-lg text-[9px] font-black uppercase shrink-0', STATUS_CONFIG[selectedTicket.status]?.color)}>
                      {STATUS_CONFIG[selectedTicket.status]?.label}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {selectedTicket.messages.map((msg, i) => (
                    <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                        msg.role === 'user'
                          ? 'bg-accent text-white rounded-br-sm'
                          : 'bg-[#F8F8FA] text-[#1A1033] rounded-bl-sm'
                      )}>
                        <p className="leading-relaxed">{msg.text}</p>
                        <p className={cn('text-[9px] mt-1 opacity-60')}>
                          {new Date(msg.ts).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply box */}
                {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                  <div className="px-6 py-4 border-t border-[#1A1033]/5 flex gap-3">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      rows={2}
                      placeholder="Yanıtınızı yazın..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#1A1033]/10 text-sm font-bold outline-none focus:border-accent/50 bg-[#F8F8FA] resize-none"
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
              <div className="bg-white rounded-2xl border border-[#1A1033]/5 flex flex-col items-center justify-center py-24 gap-4 text-[#1A1033]/20">
                <MessageCircle size={48} strokeWidth={1} />
                <p className="text-sm font-bold">Bir bilet seçin veya yeni bilet oluşturun.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
