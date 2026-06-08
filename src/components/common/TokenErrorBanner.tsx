import { AlertTriangle, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/**
 * Banner shown when the Firebase auth token can't be refreshed.
 * Prompts the user to re-login. Token expiry happens ~1 hour after login;
 * this catches the case where the refresh fails (user disabled, session
 * revoked, persistent network error).
 */
export function TokenErrorBanner() {
  const { tokenError, clearTokenError, login, logout } = useAuth();

  if (!tokenError) return null;

  const handleReLogin = async () => {
    clearTokenError();
    try {
      await logout();
    } catch {
      // logout best-effort
    }
    await login();
  };

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
      <div className="max-w-[1700px] mx-auto px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertTriangle size={16} className="text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-xs font-bold text-red-800 dark:text-red-200 truncate">
            {tokenError}
          </p>
        </div>
        <button
          onClick={handleReLogin}
          className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 hover:bg-red-300 dark:hover:bg-red-700 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <LogIn size={12} />
          Tekrar Giriş Yap
        </button>
      </div>
    </div>
  );
}
