import { test, expect } from '@playwright/test';

test.describe('SEO', () => {
  test('meta açıklaması mevcut', async ({ page }) => {
    await page.goto('/');
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute('content', /.+/);
  });

  test('JSON-LD yapısal verisi mevcut', async ({ page }) => {
    await page.goto('/');
    const jsonld = page.locator('script[type="application/ld+json"]');
    const count = await jsonld.count();
    expect(count).toBeGreaterThan(0);
  });

  test('kanonik URL mevcut', async ({ page }) => {
    await page.goto('/');
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /https?:\/\/.+/);
  });

  test('OG etiketleri mevcut', async ({ page }) => {
    await page.goto('/');
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /.+/);
  });
});
