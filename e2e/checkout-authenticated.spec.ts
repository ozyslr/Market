/**
 * E2E tests: Authenticated Checkout with Saved Card
 *
 * Tests the checkout flow for signed-in users, including saved card selection and
 * Stripe Elements new-card payment.
 *
 * Prerequisites:
 *   - App running at BASE_URL (via `npm run build && npm run preview` or dev server)
 *   - Firebase project connected with Email/Password auth enabled
 *   - A test user account with:
 *     - At least one saved address in Firestore users/{uid}.addresses[]
 *     - At least one saved Stripe card (requires prior Stripe setup + save-card flow)
 *   - Playwright storageState or inline Firebase auth for test authentication
 *
 * Auth setup options (choose one):
 *   1. storageState: Save auth state after manual login, load via `use: { storageState }`
 *      > npx playwright test --global-timeout=0 → manually sign in → state saved
 *   2. Inline Firebase Auth: Use Firebase Auth REST API to sign in programmatically
 *   3. Test emulator: Use Firebase Auth emulator for local testing
 *
 * This file uses test.skip() by default. Remove .skip() after configuring auth setup.
 *
 * Known limitations:
 *   - Saved cards require a real Stripe customer with payment methods attached.
 *     Mock mode (isMock=true) bypasses this for the payment step but saved card
 *     selection UI won't render without actual saved cards from Stripe.
 */

import { test, expect } from '@playwright/test';

test.describe('Authenticated Checkout', () => {
  test.slow(); // Multi-step authenticated flow

  // TODO: Unskip after configuring auth setup (storageState or test account)
  test.skip('authenticated user checks out with saved card', async ({ page }) => {
    // Prerequisite: page must be authenticated with a user that has saved cards
    // Use storageState in playwright.config.ts or call signIn programmatically.

    // Navigate to checkout (cart must have items)
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/checkout');

    // Step 1 (Delivery): Verify saved addresses are displayed
    const savedAddressesSection = page.getByText(/Kayıtlı Adreslerim/i);
    const hasSavedAddresses = await savedAddressesSection.isVisible().catch(() => false);

    if (hasSavedAddresses) {
      // Select first saved address
      const firstAddress = page
        .locator('button')
        .filter({ hasText: /Varsayılan|MapPin/ })
        .first();
      if (await firstAddress.isVisible().catch(() => false)) {
        await firstAddress.click();
      }
    }

    // Fill address form if no saved addresses
    const addressFormVisible = await page
      .getByLabel('Ad Soyad')
      .isVisible()
      .catch(() => false);
    if (addressFormVisible) {
      await page.getByLabel('Ad Soyad').fill('Auth Test User');
      await page.getByLabel('Telefon').fill('+905551234567');
      await page.getByLabel(/Sokak \/ Cadde/).fill('123 Auth Street');
      await page.getByLabel('Posta Kodu').fill('34000');
      await page.getByLabel(/^Şehir$/).fill('İstanbul');
    }

    // Proceed to payment step
    const continueButton = page.getByRole('button', { name: /Ödemeye Devam Et/i });
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
    }

    // Step 2 (Payment): Verify saved cards section (if user has saved cards)
    // SavedCardSelector renders when firebaseUser && (savedCards.length > 0 || savedCardsLoading)
    await page.waitForTimeout(3000); // Allow saved cards to load

    // Check for saved card selector or payment method selector
    const hasSavedCards = await page
      .locator('text=Kayıtlı Kartlarım')
      .isVisible()
      .catch(() => false);
    const hasPaymentSelector = await page
      .getByText(/Secure Payment|Payment Method/i)
      .isVisible()
      .catch(() => false);

    // If saved cards exist, select the first one
    if (hasSavedCards) {
      const firstCardButton = page.locator('button').filter({ hasText: /••••/ }).first();
      if (await firstCardButton.isVisible().catch(() => false)) {
        await firstCardButton.click();
      }
      // After selecting a saved card, the "Seçili Kartla Öde" button should appear
      const savedCardPayButton = page.getByRole('button', { name: /Seçili Kartla Öde/i });
      await expect(savedCardPayButton).toBeVisible({ timeout: 5000 });
      await savedCardPayButton.click();
    } else if (hasPaymentSelector) {
      // No saved cards — mock mode payment
      const payButton = page.getByRole('button', { name: /(Pay|Securely)/i });
      if (await payButton.isVisible().catch(() => false)) {
        await payButton.click();
      }
    }

    // Step 3 (Confirmation): Verify order confirmation
    await expect(page.getByText(/Ödeme Başarılı|Sipariş|Confirmation/i)).toBeVisible({
      timeout: 25000,
    });
  });

  // TODO: Unskip after configuring auth setup
  test.skip('authenticated user checks out with new Stripe card (mock mode)', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/checkout');

    // Step 1: Fill delivery address
    await page.getByLabel('Ad Soyad').fill('Stripe Test User');
    await page.getByLabel('Telefon').fill('+905559876543');
    await page.getByLabel(/Sokak \/ Cadde/).fill('456 Stripe Ave');
    await page.getByLabel('Posta Kodu').fill('34000');
    await page.getByLabel(/^Şehir$/).fill('İstanbul');

    // Proceed to payment
    const continueButton = page.getByRole('button', { name: /Ödemeye Devam Et/i });
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
    }

    // Step 2: Verify Stripe payment form renders
    // In mock mode, the Demo Mode banner is shown
    await expect(page.getByText(/Demo Mode|Secure Payment/i)).toBeVisible({ timeout: 15000 });

    // Verify the pay button is present
    const payButton = page.getByRole('button', { name: /(Pay|Securely)/i });
    await expect(payButton).toBeVisible({ timeout: 10000 });

    // Click pay (mock mode simulates payment)
    await payButton.click();

    // Step 3: Verify order confirmation appears
    await expect(page.getByText(/Ödeme Başarılı|Sipariş/i)).toBeVisible({ timeout: 20000 });
  });
});

test.describe('Cart Navigation for Authenticated Users', () => {
  test.skip('authenticated user can access checkout from cart page', async ({ page }) => {
    // Add product to cart from home page
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    const addToCart = page.locator('[data-testid="add-to-cart"]').first();
    await expect(addToCart).toBeVisible();
    await addToCart.click();

    // Navigate to cart page
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });

    // Verify checkout button is present
    const checkoutButton = page.getByRole('button', { name: /Authorize Payment/i });
    await expect(checkoutButton).toBeVisible({ timeout: 5000 });

    // Click and verify navigation to checkout
    await checkoutButton.click();
    await page.waitForURL('**/checkout');
    await expect(page.getByText(/Shipping Address|Delivery/i)).toBeVisible({ timeout: 10000 });
  });
});
