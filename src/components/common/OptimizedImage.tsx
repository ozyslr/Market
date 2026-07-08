import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

/**
 * Firebase Storage Image Processing URL patterns:
 *
 * When the Firebase "Image Processing" extension is enabled, resized variants are
 * served by appending query parameters to the Storage download URL:
 *
 *   {baseUrl}?width=320
 *   {baseUrl}?width=768
 *   {baseUrl}?width=1200
 *
 * The extension also supports height, format (webp), and quality params.
 * Without the extension enabled, these params are silently ignored by Storage
 * and the original full-size image is served — so srcSet is forward-compatible.
 *
 * Setting `widths` on this component auto-generates srcSet from the `src` URL.
 * If `src` is not a Firebase Storage URL, `?width=N` is still appended as a
 * generic hint (most servers will ignore unknown query params).
 *
 * Enabling the extension (one-time, Firebase Console):
 *   Firebase Console → Storage → Extensions → "Image Processing" → Install
 *   https://firebase.google.com/products/extensions/image-processing-resize-images
 */

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
  /**
   * Breakpoints for responsive srcSet generation (default: [320, 768, 1200]).
   * Each width generates a `src?width=N` URL variant.
   * Pass an empty array to suppress srcSet entirely.
   * Omit the prop (undefined) to use defaults.
   */
  widths?: number[];
  /**
   * The `sizes` attribute for the img element. If omitted when `widths` is
   * provided, a sensible default is used:
   * "(max-width: 320px) 320px, (max-width: 768px) 768px, 1200px"
   */
  sizes?: string;
}

const DEFAULT_WIDTHS: number[] = [320, 768, 1200];
const DEFAULT_SIZES = '(max-width: 320px) 320px, (max-width: 768px) 768px, 1200px';

/**
 * Generate a srcSet string from a base URL and an array of width breakpoints.
 * Appends `?width=N` as a query parameter. Duplicate `?` in the original URL
 * is handled so we don't produce `...?token=abc?width=320`.
 */
function buildSrcSet(src: string, widths: number[]): string {
  const separator = src.includes('?') ? '&' : '?';
  return widths.map((w) => `${src}${separator}width=${w} ${w}w`).join(', ');
}

/**
 * OptimizedImage — lazy loading, blur placeholder, error fallback, aspect ratio locking,
 * and responsive srcSet for Firebase Storage images.
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
  widths,
  sizes,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => setError(true), []);

  // Only compute srcSet when widths is explicitly provided (non-undefined).
  // If widths is undefined → no srcSet (backward compatible, single src only).
  // If widths is an empty array → no srcSet (explicit opt-out).
  const effectiveWidths: number[] | null =
    widths !== undefined ? (widths.length > 0 ? widths : null) : null;

  const hasResponsive = effectiveWidths !== null;
  const resolvedWidths = effectiveWidths ?? DEFAULT_WIDTHS;

  const srcSet = useMemo(
    () => (hasResponsive ? buildSrcSet(src, resolvedWidths) : undefined),
    [hasResponsive, src, resolvedWidths],
  );

  const resolvedSizes = sizes ?? (hasResponsive ? DEFAULT_SIZES : undefined);

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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
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
        srcSet={srcSet}
        sizes={resolvedSizes}
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
