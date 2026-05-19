import React, { useState } from 'react';
import { X, Zap, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { t } = useLanguage();
  const { login, loginWithEmail, registerWithEmail } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const reset = () => { setError(''); setEmail(''); setPassword(''); setName(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        if (!name.trim()) { setError(t('auth.error.nameRequired')); setLoading(false); return; }
        await registerWithEmail(email, name.trim(), password);
      }
      onClose();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError(t('auth.error.invalidCredentials'));
      } else if (code === 'auth/email-already-in-use') {
        setError(t('auth.error.emailInUse'));
      } else if (code === 'auth/weak-password') {
        setError(t('auth.error.weakPassword'));
      } else {
        setError(t('auth.error.generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[12000]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Giriş yap veya üye ol"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[420px] bg-white dark:bg-zinc-950 z-[12001] shadow-2xl rounded-[2.5rem] overflow-hidden border border-brand-primary/5 dark:border-white/5"
          >
            <div className="relative bg-gradient-to-br from-brand-primary to-zinc-800 p-8 pb-6 text-white overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-[40px]" />
              <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-10" aria-label="Kapat">
                <X size={16} />
              </button>
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg">
                  <Zap size={20} fill="currentColor" />
                </div>
                <span className="font-display font-black text-xl uppercase italic tracking-tighter">Mercora</span>
              </div>
              <div className="flex gap-1 bg-white/10 p-1 rounded-2xl relative z-10">
                <button
                  onClick={() => { setMode('login'); setError(''); }}
                  className={cn('flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all', mode === 'login' ? 'bg-white text-brand-primary shadow' : 'text-white/70 hover:text-white')}
                >
                  Giriş Yap
                </button>
                <button
                  onClick={() => { setMode('register'); setError(''); }}
                  className={cn('flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all', mode === 'register' ? 'bg-white text-brand-primary shadow' : 'text-white/70 hover:text-white')}
                >
                  Üye Ol
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              {mode === 'register' && (
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/30" />
                  <input
                    type="text"
                    placeholder={t('form.fullname')}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-brand-primary/10 dark:border-white/10 bg-brand-secondary/30 dark:bg-zinc-900 text-sm font-bold text-brand-primary dark:text-white placeholder:text-brand-primary/30 focus:border-accent outline-none transition-all"
                  />
                </div>
              )}
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/30" />
                <input
                  type="email"
                  placeholder={t('form.email')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-brand-primary/10 dark:border-white/10 bg-brand-secondary/30 dark:bg-zinc-900 text-sm font-bold text-brand-primary dark:text-white placeholder:text-brand-primary/30 focus:border-accent outline-none transition-all"
                />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('form.password')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3.5 rounded-2xl border border-brand-primary/10 dark:border-white/10 bg-brand-secondary/30 dark:bg-zinc-900 text-sm font-bold text-brand-primary dark:text-white placeholder:text-brand-primary/30 focus:border-accent outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-primary/30 hover:text-brand-primary transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && (
                <p className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 rounded-xl">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Lütfen bekleyin...' : mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
              </button>

              <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px bg-brand-primary/10 dark:bg-white/10" />
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30">veya</span>
                <div className="flex-1 h-px bg-brand-primary/10 dark:bg-white/10" />
              </div>

              <button
                type="button"
                onClick={async () => { await login(); onClose(); }}
                className="w-full py-3.5 border border-brand-primary/10 dark:border-white/10 rounded-2xl font-bold text-sm text-brand-primary dark:text-white hover:bg-brand-secondary/50 dark:hover:bg-zinc-900 transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google ile devam et
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
