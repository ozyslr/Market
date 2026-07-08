import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional custom recovery callback. Defaults to window.location.reload(). */
  onReset?: () => void;
  /** Optional fallback UI to replace the entire default error view. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[PageErrorBoundary]', error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const errorMessage = this.state.error?.message || 'Beklenmeyen bir hata oluştu.';

    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-brand-secondary/30 px-4 py-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-zinc-800">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#6418E5]/10">
            <AlertTriangle className="h-7 w-7 text-[#6418E5]" aria-hidden="true" />
          </div>

          <h1 className="mb-2 text-lg font-semibold text-brand-primary">Bir hata oluştu</h1>

          <p className="mb-4 text-sm leading-relaxed text-brand-primary/60">{errorMessage}</p>

          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-xs font-medium text-brand-primary/50 hover:text-brand-primary/70 transition-colors">
              Hata detayları
            </summary>
            <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-brand-secondary px-4 py-3 text-xs text-brand-primary/70 whitespace-pre-wrap break-words">
              {this.state.error?.stack || errorMessage}
            </pre>
          </details>

          <button
            onClick={this.handleReset}
            className="rounded-lg bg-[#6418E5] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5210c8] focus-visible:ring-2 focus-visible:ring-[#6418E5] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-800 transition-all"
          >
            Yeniden dene
          </button>
        </div>
      </div>
    );
  }
}
