import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, Send, ChevronLeft, Circle, Loader2, Store,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  getUserConversations, getConversationMessages,
  sendConversationMessage, markConversationRead,
  subscribeToConversationMessages,
  type Conversation, type ConversationMessage,
} from '@/services/chatService';
import { cn } from '@/lib/utils';
import { SEO } from '@/components/common/SEO';
import { Timestamp } from 'firebase/firestore';

export function SellerMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getUserConversations(user.id).then(data => {
      setConversations(data.filter(c => c.sellerId === user.id));
      setLoading(false);
    });
  }, [user]);

  // Subscribe to messages for selected conversation
  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    const unsub = subscribeToConversationMessages(selectedId, setMessages);
    return unsub;
  }, [selectedId]);

  // Mark as read and refresh unread counts
  useEffect(() => {
    if (selectedId && user) {
      markConversationRead(selectedId, user.id).then(() => {
        getUserConversations(user.id).then(data =>
          setConversations(data.filter(c => c.sellerId === user.id)),
        );
      });
    }
  }, [selectedId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedConv = conversations.find(c => c.id === selectedId);

  const handleSend = useCallback(async () => {
    if (!selectedId || !user || !inputText.trim()) return;
    setSending(true);
    try {
      await sendConversationMessage(selectedId, user.id, inputText.trim());
      setInputText('');
    } finally {
      setSending(false);
    }
  }, [selectedId, user, inputText]);

  const formatTime = (ts: string | Timestamp) => {
    const d = typeof ts === 'string' ? new Date(ts) : ts.toDate();
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return 'Dün';
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-500">Giriş yapmanız gerekiyor.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 lg:p-6">
      <SEO title="Mesajlar" />
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare size={20} className="text-emerald-400" />
          <h1 className="text-lg font-bold text-white">Müşteri Mesajları</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-emerald-400" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-zinc-900 rounded-xl p-10 text-center border border-zinc-800">
            <MessageSquare size={36} className="mx-auto mb-3 text-zinc-600" />
            <p className="text-sm text-zinc-500">Henüz mesajınız yok.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map(conv => {
              const unread = conv.unreadSeller;
              const isOpen = selectedId === conv.id;

              return (
                <div
                  key={conv.id}
                  className={cn(
                    'bg-zinc-900 rounded-xl border overflow-hidden transition-all',
                    isOpen ? 'border-emerald-500/30' : 'border-zinc-800',
                  )}
                >
                  {/* Collapsed header */}
                  <button
                    onClick={() => {
                      if (isOpen) { setSelectedId(null); return; }
                      setSelectedId(conv.id);
                    }}
                    className="w-full flex items-center gap-3 p-4 text-start hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Store size={16} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-white truncate">Alıcı</p>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-zinc-500 shrink-0">
                            {formatDate(conv.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      {conv.productTitle && (
                        <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{conv.productTitle}</p>
                      )}
                      <p className={cn(
                        'text-xs mt-1 truncate',
                        unread > 0 ? 'font-bold text-white' : 'text-zinc-400',
                      )}>
                        {conv.lastMessage || 'Mesaj yok'}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-full">
                        {unread}
                      </span>
                    )}
                    <ChevronLeft size={14} className={cn(
                      'text-zinc-500 transition-transform shrink-0',
                      isOpen ? '-rotate-90' : '',
                    )} />
                  </button>

                  {/* Expanded messages */}
                  {isOpen && (
                    <div className="border-t border-zinc-800">
                      <div className="max-h-[50vh] overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                          <p className="text-xs text-center text-zinc-600 py-4">
                            Henüz mesaj yok. İlk mesajı siz gönderin.
                          </p>
                        )}
                        {messages.map((msg, i) => (
                          <div key={msg.id ?? i} className={cn(
                            'flex', msg.senderId === user.id ? 'justify-end' : 'justify-start',
                          )}>
                            <div className={cn(
                              'max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
                              msg.senderId === user.id
                                ? 'bg-emerald-500 text-white rounded-br-md'
                                : 'bg-zinc-800 text-zinc-200 rounded-bl-md',
                            )}>
                              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                              {msg.ts && (
                                <p className={cn(
                                  'text-[9px] mt-1 text-right',
                                  msg.senderId === user.id ? 'text-white/50' : 'text-zinc-500',
                                )}>
                                  {formatTime(msg.ts)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        <div ref={bottomRef} />
                      </div>

                      {/* Reply input */}
                      <div className="border-t border-zinc-800 p-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                              }
                            }}
                            placeholder="Mesaj yazın..."
                            className="flex-1 px-4 py-2.5 bg-zinc-800 rounded-xl text-sm text-white
                              outline-none border border-transparent focus:border-emerald-500/30
                              placeholder:text-zinc-500 transition-colors"
                          />
                          <button
                            onClick={handleSend}
                            disabled={!inputText.trim() || sending}
                            className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-400
                              disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            {sending ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Send size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
