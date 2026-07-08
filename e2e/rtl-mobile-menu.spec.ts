import { test, expect } from '@playwright/test';

// RTL visual QA: Arabic mode forces document dir=rtl. The mobile menu drawer is
// anchored to the inline-start edge (start-0), which is the RIGHT side in RTL,
// so it must render against the right edge and slide in from the right.
test.describe('RTL — Arapça mobil menü', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    // Force Arabic before the app boots so LanguageProvider initialises in RTL.
    await page.addInitScript(() => window.localStorage.setItem('lang', 'ar'));
  });

  test('belge RTL moduna geçiyor', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  });

  test('mobil menü sağdan açılıyor ve sağ kenara yaslanıyor', async ({ page }) => {
    await page.goto('/');

    const viewportWidth = page.viewportSize()!.width;

    // The hamburger is the first md:hidden button carrying the lucide menu icon.
    const hamburger = page.locator('button:has(svg.lucide-menu)').first();
    await hamburger.click();

    const panel = page.locator('#mobile-menu-panel');
    await expect(panel).toBeVisible();

    // Wait for the slide-in spring to settle, then read the final position.
    await page.waitForTimeout(600);
    const box = await panel.boundingBox();
    expect(box).not.toBeNull();

    // In RTL the panel must hug the RIGHT edge: its right side reaches the viewport
    // edge and its left side is offset inward (NOT flush against the left edge,
    // which is where the LTR drawer lives).
    expect(box!.x + box!.width).toBeGreaterThan(viewportWidth - 2);
    expect(box!.x).toBeGreaterThan(2);
  });

  test('LTR (Türkçe) menü sola yaslanıyor — kontrol', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('lang', 'tr'));
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    const hamburger = page.locator('button:has(svg.lucide-menu)').first();
    await hamburger.click();

    const panel = page.locator('#mobile-menu-panel');
    await expect(panel).toBeVisible();
    await page.waitForTimeout(600);
    const box = await panel.boundingBox();
    expect(box!.x).toBeLessThan(2);
  });
});
