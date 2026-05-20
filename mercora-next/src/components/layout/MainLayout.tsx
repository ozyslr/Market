'use client';

import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CookieConsent } from '@/components/common/CookieConsent';
import { LiveChatWidget } from '@/components/chat/LiveChatWidget';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col">
      <Navbar />
      <main id="main-content" role="main" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <CookieConsent />
      <LiveChatWidget />
    </div>
  );
}
