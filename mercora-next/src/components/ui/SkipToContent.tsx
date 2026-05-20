'use client';

import { useEffect } from 'react';

export function SkipToContent() {
  useEffect(() => {
    // Handle hash-based skip link from static HTML
    const handler = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.hash === '#main-content') {
        e.preventDefault();
        document.getElementById('main-content')?.focus();
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-purple-700 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:text-sm focus:font-medium"
    >
      İçeriğe atla
    </a>
  );
}
