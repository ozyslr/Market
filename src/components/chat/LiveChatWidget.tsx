import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Loader2, Minimize2, Maximize2, ChevronDown, Bot } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  createChatSession,
  getActiveSession,
  sendMessage,
  subscribeToMessages,
  subscribeToSession,
  closeChatSession,
  ChatMessage,
  ChatSession,
} from '@/services/chatService';

type ViewState = 'closed' | 'minimized' | 'open';

export function LiveChatWidget() {
  const { user } = useAuth();
  const [viewState, setViewState] = useState<ViewState>('closed');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore or create session on first open
  const ensureSession = useCallback(async () => {
    if (!user || sessionId) return;
    setInitializing(true);
    try {
      const existing = await getActiveSession(user.id);
      if (existing) {
        setSessionId(existing.id);
        setSession(existing);
      }
    } finally {
      setInitializing(false);
    }
  }, [user, sessionId]);

  // Real-time message subscription
  useEffect(() => {
    if (!sessionId) return;
    const unsubMsgs = subscribeToMessages(sessionId, setMessages);
    const unsubSesh = subscribeToSession(sessionId, (s) => setSession(s));
    return () => { unsubMsgs(); unsubSesh(); };
  }, [sessionId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (viewState === 'open') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [viewState]);

  const handleOpen = async () => {
    setViewState('open');
    await ensureSession();
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending || !user) return;

    setSending(true);
    setInputText('');
    try {
      if (sessionId) {
        await sendMessage(sessionId, 'user', text);
      } else {
        const newId = await createChatSession({
          userId: user.id,
          userName: user.name ?? user.email,
          userEmail: user.email,
          subject: 'Canlı Destek',
          initialMessage: text,
        });
        setSessionId(newId);
      }
    } catch {
      setInputText(text); // restore on failure
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = async () => {
    if (sessionId && session?.status !== 'closed') {
      await closeChatSession(sessionId);
    }
    setViewState('closed');
  };

  const formatTime = (ts: unknown): string => {
    if (!ts) return '';
    const d = (ts as any)?.toDate ? (ts as any).toDate() : new Date(ts as string);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const isOpen = viewState === 'open';
  const isMinimized = viewState === 'minimized';

  return (
    <>
      {/* Floating Button */}
      {viewState === 'closed' && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-[#F9423A] text-white rounded-full shadow-2xl shadow-[#F9423A]/30 flex items-center justify-center hover:bg-orange-600 transition-colors cursor-pointer"
          aria-label="Canlı desteği aç"
        >
          <MessageCircle size={28} strokeWidth={2.5} />
        </motion.button>
      )}

      {/* Minimized Bar */}
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 cursor-pointer"
            onClick={() => setViewState('open')}
          >
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="w-10 h-10 bg-[#F9423A]/10 rounded-xl flex items-center justify-center">
                <MessageCircle size={20} className="text-[#F9423A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-brand-primary">Canlı Destek</p>
                <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Çevrimiçi</p>
              </div>
              <ChevronDown size={18} className="text-brand-primary/30" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-120px)] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#1A1033] text-white px-6 py-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F9423A]/20 rounded-xl flex items-center justify-center">
                  <Bot size={20} className="text-[#F9423A]" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight">Canlı Destek</p>
                  <p className="text-[9px] text-green-400 font-bold uppercase tracking-widest">
                    {session?.status === 'waiting' ? 'Sırada bekliyor...' : 'Çevrimiçi'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewState('minimized')}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  aria-label="Küçült"
                >
                  <Minimize2 size={16} />
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  aria-label="Kapat"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-zinc-50/50">
              {initializing ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={24} className="animate-spin text-[#F9423A]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle size={40} className="text-[#F9423A]/20 mb-4" />
                  <p className="text-sm font-black text-brand-primary/40 uppercase tracking-wider">
                    Nasıl yardımcı olabiliriz?
                  </p>
                  <p className="text-[11px] text-brand-primary/30 mt-2 max-w-[200px]">
                    Sipariş, ödeme veya ürünlerle ilgili sorularınızı yanıtlamak için buradayız.
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isAdmin = msg.role === 'admin';
                  const showAvatar = i === 0 || messages[i - 1]?.role !== msg.role;
                  return (
                    <div
                      key={msg.id || i}
                      className={cn(
                        'flex',
                        isAdmin ? 'justify-start' : 'justify-end',
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] px-5 py-3 text-sm leading-relaxed',
                          isAdmin
                            ? 'bg-white text-brand-primary rounded-2xl rounded-tl-md shadow-sm border border-gray-100'
                            : 'bg-[#F9423A] text-white rounded-2xl rounded-tr-md shadow-sm',
                        )}
                      >
                        <p>{msg.text}</p>
                        <p
                          className={cn(
                            'text-[9px] font-bold uppercase tracking-widest mt-1.5',
                            isAdmin ? 'text-brand-primary/20' : 'text-white/50',
                          )}
                        >
                          {formatTime(msg.ts)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Mesajınızı yazın..."
                  disabled={sending || !user}
                  className="flex-1 px-5 py-3 bg-zinc-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-4 ring-[#F9423A]/10 focus:border-[#F9423A]/30 transition-all disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || sending || !user}
                  className="w-12 h-12 bg-[#F9423A] text-white rounded-2xl flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-[#F9423A]/20"
                  aria-label="Gönder"
                >
                  {sending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} strokeWidth={2.5} />
                  )}
                </button>
              </div>
              {!user && (
                <p className="text-[9px] text-brand-primary/30 text-center mt-2 font-medium">
                  Mesaj göndermek için giriş yapmalısınız.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
