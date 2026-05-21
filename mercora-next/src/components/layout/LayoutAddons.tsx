'use client';

import { Suspense } from 'react';
import { AnalyticsTracker } from '@/components/common/AnalyticsTracker';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { RTLProvider } from '@/components/common/RTLProvider';

export function LayoutAddons() {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      <ScrollToTop />
      <RTLProvider />
    </>
  );
}
