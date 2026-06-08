import { useState } from 'react';
import { Mail, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

/**
 * Persistent banner shown when the user hasn't verified their email.
 * Only renders for email/password users (Google sign-in auto-verifies).
 * Dismissible per-session.
 */
export function EmailVerificationBanner() {
  const { user, firebaseUser, isAnonymous, emailVerified, resendVerificationEmail } = useAuth();
  const { t } = useLanguage();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState('');

  // Don't show for: anonymous users, unauthenticated, already verified, Google sign-in, dismissed
  if (isAnonymous || !user || !firebaseUser || emailVerified || dismissed) return null;

  // Google sign-in users are automatically verified — don't nag them
  const isPasswordProvider =
    firebaseUser.providerData?.some(
      (p) => p.providerId === 'password',
    ) ?? false;
  if (!isPasswordProvider) return null;

  const handleResend = async () => {
    setSending(true);
    setError('');
    try {
      await resendVerificationEmail();
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Email gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
      <div className="max-w-[1700px] mx-auto px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Mail size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs font-bold text-amber-800 dark:text-amber-200 truncate">
            {t('auth.verifyEmailBanner') || 'Email adresinizi doğrulayın — hesabınızı aktifleştirmek için gelen kutunuzu kontrol edin.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {error && (
            <span className="text-[10px] text-red-600 font-bold">{error}</span>
          )}
          <button
            onClick={handleResend}
            disabled={sending || sent}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {sending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : sent ? (
              'Gönderildi ✓'
            ) : (
              'Tekrar Gönder'
            )}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            aria-label="Kapat"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
