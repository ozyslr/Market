import React, { useState, useEffect, useRef } from 'react';
import { Loader2, MessageCircle, Send, Circle, CheckCircle2 } from 'lucide-react';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import {
  getAllChatSessions,
  subscribeToMessages,
  sendMessage,
  closeChatSession,
  markMessagesAsRead,
  ChatSession,
  ChatMessage,
} from '@/services/chatService';

export function AdminChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time session list
  useEffect(() => {
    const q = query(collection(db, 'chat_sessions'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatSession);
      setSessions(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Real-time messages for selected session
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    const unsub = subscribeToMessages(selectedId, setMessages);
    markMessagesAsRead(selectedId);
    return unsub;
  }, [selectedId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!selectedId || !replyText.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(selectedId, 'admin', replyText.trim());
      setReplyText('');
    } finally {
      setSending(false);
    }
  };

  const handleClose = async (id: string) => {
    await closeChatSession(id);
    if (selectedId === id) setSelectedId(null);
  };

  const selectedSession = sessions.find((s) => s.id === selectedId);
  const activeSessions = sessions.filter((s) => s.status === 'active' || s.status === 'waiting');
  const waitingCount = sessions.filter((s) => s.status === 'waiting').length;

  const formatTime = (ts: unknown): string => {
    if (!ts) return '';
    const d = (ts as any)?.toDate ? (ts as any).toDate() : new Date(ts as string);
    return d.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Circle size={10} className="text-yellow-500" />;
      case 'active':
        return <Circle size={10} className="text-green-500" />;
      case 'resolved':
        return <CheckCircle2 size={10} className="text-blue-500" />;
      default:
        return <Circle size={10} className="text-gray-300" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Bekliyor';
      case 'active':
        return 'Aktif';
      case 'resolved':
        return 'Çözüldü';
      case 'closed':
        return 'Kapalı';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-black uppercase italic tracking-tight text-brand-primary">
          Canlı Destek
        </h2>
        {waitingCount > 0 && (
          <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-xl text-[10px] font-black uppercase tracking-widest">
            {waitingCount} bekleyen
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Session list */}
        <div className="xl:col-span-1 space-y-1 max-h-[700px] overflow-y-auto pe-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#F8F8FA] py-12 text-center">
              <MessageCircle size={28} className="mx-auto mb-2 text-brand-primary/20" />
              <p className="text-sm font-bold text-brand-primary/30">Aktif sohbet yok</p>
            </div>
          ) : (
            sessions.filter((s) => s.status !== 'closed').length === 0 && (
              <div className="bg-white rounded-2xl border border-[#F8F8FA] py-8 text-center">
                <MessageCircle size={28} className="mx-auto mb-2 text-brand-primary/10" />
                <p className="text-sm font-bold text-brand-primary/20">Tüm sohbetler kapalı</p>
              </div>
            )
          )}

          {sessions
            .filter((s) => s.status !== 'closed')
            .map((session) => (
              <button
                key={session.id}
                onClick={() => setSelectedId(session.id)}
                className={cn(
                  'w-full text-start bg-white rounded-2xl p-4 border transition-all hover:border-accent/30',
                  selectedId === session.id ? 'border-accent shadow-sm' : 'border-[#F8F8FA]',
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {statusIcon(session.status)}
                    <span className="text-[11px] font-black text-brand-primary truncate">
                      {session.userName || session.userEmail || 'İsimsiz'}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-[9px] font-black uppercase shrink-0',
                      session.status === 'waiting'
                        ? 'text-yellow-600'
                        : session.status === 'active'
                          ? 'text-green-600'
                          : 'text-gray-400',
                    )}
                  >
                    {statusLabel(session.status)}
                  </span>
                </div>
                {session.lastMessage && (
                  <p className="text-[10px] text-brand-primary/40 truncate mt-1">
                    {session.lastMessage}
                  </p>
                )}
                <p className="text-[8px] text-brand-primary/20 mt-1">
                  {formatTime(session.lastMessageTs)}
                </p>
              </button>
            ))}
        </div>

        {/* Messages panel */}
        <div className="xl:col-span-2">
          {selectedSession ? (
            <div
              className="bg-white rounded-2xl border border-[#F8F8FA] flex flex-col"
              style={{ minHeight: 500 }}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-brand-primary/5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/30 mb-0.5">
                    #{selectedSession.id.slice(0, 8)}
                  </p>
                  <p className="text-sm font-black text-brand-primary">
                    {selectedSession.userName || selectedSession.userEmail || 'İsimsiz Kullanıcı'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedSession.status !== 'closed' && (
                    <button
                      onClick={() => handleClose(selectedSession.id)}
                      className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      Sohbeti Kapat
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: 400 }}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-brand-primary/20">
                    <MessageCircle size={32} className="mb-2" />
                    <p className="text-xs font-bold">Henüz mesaj yok</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={msg.id || i}
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
                        <p
                          className={cn(
                            'text-[9px] mt-1',
                            msg.role === 'admin' ? 'text-white/60' : 'text-brand-primary/30',
                          )}
                        >
                          {formatTime(msg.ts)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Admin input */}
              {selectedSession.status !== 'closed' && (
                <div className="px-6 py-4 border-t border-brand-primary/5 flex gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Admin yanıtı yazın..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-brand-primary/10 text-sm font-bold outline-none focus:border-accent/50 bg-[#F8F8FA]"
                  />
                  <button
                    onClick={handleSend}
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
              <p className="text-sm font-bold">Bir sohbet seçin</p>
            </div>
          )}
        </div>
      </div>

      {/* Closed sessions summary */}
      {sessions.filter((s) => s.status === 'closed').length > 0 && (
        <details className="bg-white rounded-2xl border border-[#F8F8FA]">
          <summary className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-brand-primary/40 cursor-pointer">
            Geçmiş Sohbetler ({sessions.filter((s) => s.status === 'closed').length})
          </summary>
          <div className="px-6 pb-4 space-y-1">
            {sessions
              .filter((s) => s.status === 'closed')
              .map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedId(session.id)}
                  className={cn(
                    'w-full text-start px-4 py-3 rounded-xl text-sm transition-colors',
                    selectedId === session.id ? 'bg-accent/5' : 'hover:bg-gray-50',
                  )}
                >
                  <span className="font-bold text-brand-primary/60">
                    {session.userName || session.userEmail || 'İsimsiz'}
                  </span>
                  <span className="text-brand-primary/30 ms-2 text-xs">
                    {formatTime(session.createdAt)}
                  </span>
                </button>
              ))}
          </div>
        </details>
      )}
    </div>
  );
}
