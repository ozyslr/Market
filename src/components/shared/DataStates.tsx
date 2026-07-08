import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export function LoadingState({ label, fullPage = false }: { label?: string; fullPage?: boolean }) {
  const { t } = useLanguage();
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 py-16 text-gray-500 dark:text-gray-400 ${fullPage ? 'min-h-[60vh]' : ''}`}
    >
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="text-sm">{label ?? t('common.loading', 'Yükleniyor…')}</span>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  retryLabel,
}: {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}) {
  const { t } = useLanguage();
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center gap-4 py-16 text-center"
    >
      <AlertCircle className="h-10 w-10 text-red-500" aria-hidden="true" />
      <p className="max-w-md text-sm text-gray-700 dark:text-gray-300">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-[#6418E5] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 transition-all"
      >
        {retryLabel ?? t('common.retry', 'Yeniden dene')}
      </button>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-gray-500 dark:text-gray-400">
      <Inbox className="h-10 w-10" aria-hidden="true" />
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
      {description && <p className="max-w-md text-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
