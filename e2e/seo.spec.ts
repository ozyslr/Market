import { test, expect } from '@playwright/test';

test.describe('SEO', () => {
  test('meta açıklaması mevcut', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute('content', /.+/);
  });

  test('JSON-LD yapısal verisi mevcut', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // React tarafından render edilir; DOMContentLoaded'dan sonra yüklenir
    const jsonld = page.locator('script[type="application/ld+json"]');
    await expect(jsonld.first()).toBeAttached({ timeout: 10000 });
  });

  test('kanonik URL mevcut', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // React Helmet async render — bekle
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /https?:\/\/.+/, { timeout: 10000 });
  });

  test('OG etiketleri mevcut', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /.+/);
  });
});
