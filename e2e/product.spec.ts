import { test, expect } from '@playwright/test';

test.describe('Ürün Detayı', () => {
  test('ürün detay sayfası açılıyor', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    await page.locator('[data-testid="product-card"]').first().click();
    await page.waitForURL(/\/product\//);
    // Sayfanın yüklendiğini doğrula (en az bir metin içeriği var)
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });
});
