import { test, expect } from '@playwright/test';

test.describe('Ana Sayfa', () => {
  test('sayfa yükleniyor ve başlık görünüyor', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Mercora/);
  });

  test('ürünler listeleniyor', async ({ page }) => {
    await page.goto('/');
    // En az bir ürün kartı görünene kadar bekle
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    const cards = page.locator('[data-testid="product-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('kategoriler görüntüleniyor', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="category-card"]', { timeout: 10000 });
    const cats = page.locator('[data-testid="category-card"]');
    const count = await cats.count();
    expect(count).toBeGreaterThan(0);
  });

  test('sepete ekle butonu çalışıyor', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    const addBtn = page.locator('[data-testid="add-to-cart"]').first();
    await addBtn.click();
    await expect(page.locator('[data-testid="cart-badge"]')).toBeVisible();
  });
});
