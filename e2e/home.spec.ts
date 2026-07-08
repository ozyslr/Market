import { test, expect } from '@playwright/test';

test.describe('Ana Sayfa', () => {
  test('sayfa yükleniyor ve başlık görünüyor', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Benim Olan/);
  });

  test('ürünler listeleniyor', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    const cards = page.locator('[data-testid="product-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('kategoriler görüntüleniyor', async ({ page }) => {
    await page.goto('/');
    // Anasayfadaki kategori linkleri (circular icon links)
    const catLinks = page.locator('a[href*="categoryId"]').first();
    await expect(catLinks).toBeVisible({ timeout: 10000 });
  });

  test('sepete ekle butonu görünüyor', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    const addBtn = page.locator('[data-testid="add-to-cart"]').first();
    await expect(addBtn).toBeVisible();
  });
});
