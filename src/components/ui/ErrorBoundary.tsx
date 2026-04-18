import React, { type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen flex items-center justify-center bg-brand-secondary/30">
            <div className="text-center bg-white rounded-[3rem] p-16 shadow-xl border border-brand-primary/5 max-w-md">
              <h2 className="text-2xl font-black uppercase tracking-tight text-brand-primary mb-3">
                Bir şeyler yanlış gitti
              </h2>
              <p className="text-sm text-brand-primary/40 font-medium mb-8">
                Sayfa yükleme sırasında bir hata oluştu.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-brand-primary text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-2xl hover:bg-accent transition-all"
              >
                Sayfayı Yenile
              </button>
            </div>
          </div>
        )
      )
    }
    return this.props.children
  }
}
