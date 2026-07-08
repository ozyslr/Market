import React from 'react';

/**
 * Skip-to-content link — first focusable element on every page.
 * Appears on focus for keyboard users, hidden by default.
 * WCAG 2.1.1: Keyboard, 2.4.1: Bypass Blocks
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[10000]
        focus:px-4 focus:py-2.5 focus:bg-accent focus:text-white focus:rounded-xl
        focus:text-sm focus:font-bold focus:shadow-lg focus:outline-none
        transition-none
      "
    >
      İçeriğe atla
    </a>
  );
}
