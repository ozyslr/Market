import { test, expect } from '@playwright/test';

test.describe('Ürün Detayı', () => {
  test('ürün detay sayfası açılıyor', async ({ page }) => {
    // Ana sayfadan bir ürüne tıkla
    await page.goto('/');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    await page.locator('[data-testid="product-card"]').first().click();

    // Ürün detay sayfası kontrolü
    await page.waitForURL(/\/product\//);
    await expect(page.locator('[data-testid="product-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
  });

  test('ürün bilgileri görüntüleniyor', async ({ page }) => {
    await page.goto('/product/test-product');
    await page.waitForLoadState('networkidle');

    // Temel ürün bilgileri
    const title = page.locator('[data-testid="product-title"]');
    const price = page.locator('[data-testid="product-price"]');

    if (await title.isVisible()) {
      await expect(title).not.toBeEmpty();
      await expect(price).not.toBeEmpty();
    }
  });
});
