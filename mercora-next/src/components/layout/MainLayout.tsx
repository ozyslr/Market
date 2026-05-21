'use client';

import dynamic from 'next/dynamic';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { TopTicker } from './TopTicker';
import { MobileTabBar } from './MobileTabBar';
import { CookieConsent } from '@/components/common/CookieConsent';
import { LiveChatWidget } from '@/components/chat/LiveChatWidget';
import { CampaignBanner } from '@/components/marketing/CampaignBanner';

const ShoppingAssistant = dynamic(() => import('@/components/ai/ShoppingAssistant').then(m => ({ default: m.ShoppingAssistant })), { ssr: false });

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col">
      <CampaignBanner />
      <TopTicker />
      <Navbar />
      <main id="main-content" role="main" className="flex-1 pb-16 md:pb-0" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <MobileTabBar />
      <ShoppingAssistant />
      <CookieConsent />
      <LiveChatWidget />
    </div>
  );
}
