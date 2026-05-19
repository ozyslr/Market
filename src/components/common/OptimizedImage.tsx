import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  /** Low-resolution placeholder to show while loading (base64 or URL) */
  placeholder?: string;
  /** Whether to lazy-load (default: true) */
  lazy?: boolean;
  /** Aspect ratio for layout stability (e.g. "1/1", "4/3", "16/9") */
  aspectRatio?: string;
  className?: string;
  containerClassName?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  decoding?: 'sync' | 'async' | 'auto';
  crossOrigin?: '' | 'anonymous' | 'use-credentials';
}

/**
 * OptimizedImage — lazy loading, blur placeholder, error fallback, aspect ratio locking.
 * WCAG 1.1.1: alt required. WCAG 2.2.2: loading="lazy" by default.
 */
export function OptimizedImage({
  src,
  alt,
  placeholder,
  lazy = true,
  aspectRatio,
  className,
  containerClassName,
  referrerPolicy,
  decoding,
  crossOrigin,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => setError(true), []);

  if (!src || error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-400',
          className,
        )}
        style={aspectRatio ? { aspectRatio } : undefined}
        role="img"
        aria-label={alt || 'Image not available'}
      >
        <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={cn('relative overflow-hidden', containerClassName)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Blur placeholder while loading */}
      {placeholder && !loaded && (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          className={cn('absolute inset-0 w-full h-full object-cover blur-xl scale-110', className)}
        />
      )}
      <img
        src={src}
        alt={alt || ''}
        loading={lazy ? 'lazy' : undefined}
        decoding={decoding || 'async'}
        referrerPolicy={referrerPolicy}
        crossOrigin={crossOrigin}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          className,
        )}
      />
    </div>
  );
}
