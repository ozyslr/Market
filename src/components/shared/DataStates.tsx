import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

export function LoadingState({ label = 'Yükleniyor…' }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500"
    >
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <AlertCircle className="h-10 w-10 text-red-500" />
      <p className="max-w-md text-sm text-gray-700">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-[#6418E5] px-4 py-2 text-sm font-medium text-white hover:bg-[#5313c0]"
      >
        Yeniden dene
      </button>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-gray-500">
      <Inbox className="h-10 w-10" />
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {description && <p className="max-w-md text-sm">{description}</p>}
    </div>
  );
}
