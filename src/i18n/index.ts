/**
 * Lazy-loaded translations — only the active locale is downloaded.
 *
 * Usage:
 *   import { loadTranslations } from '@/i18n';
 *   const t = await loadTranslations('tr');
 */

const translationCache = new Map<string, Record<string, string>>();

export async function loadTranslations(lang: string): Promise<Record<string, string>> {
  if (translationCache.has(lang)) {
    return translationCache.get(lang)!;
  }

  try {
    const mod = await import(`./${lang}.ts`);
    const translations = mod.default as Record<string, string>;
    translationCache.set(lang, translations);
    return translations;
  } catch {
    // Fallback to English if the requested language doesn't exist
    if (lang !== 'en') return loadTranslations('en');
    return {};
  }
}

export function getCachedTranslations(lang: string): Record<string, string> | undefined {
  return translationCache.get(lang);
}
