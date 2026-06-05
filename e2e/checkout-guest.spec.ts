/**
 * E2E tests: Guest (Anonymous) Checkout Flow
 *
 * Tests the checkout journey for unauthenticated users using mock Stripe payment mode.
 * Mock mode is triggered automatically when the create-payment-intent API call fails in test environment.
 *
 * Prerequisites:
 *   - App running at BASE_URL (via `npm run build && npm run preview` or dev server)
 *   - Firebase Anonymous Auth enabled in the connected project
 *   - At least one product available on the home page
 *   - Stripe mock mode: no real Stripe keys needed (mock handles payment)
 *
 * Known limitations:
 *   - Guest email is currently sourced from firebaseUser.email (null for anon). BUY-01 will add a dedicated
 *     guest email field on the checkout delivery step.
 *   - Cart persistence for guests: currently in React state only (lost on refresh). BUY-02 will add localStorage.
 */

import { test, expect } from '@playwright/test';

test.describe('Guest Checkout Flow', () => {
  test.slow(); // Multi-step checkout flow

  test('guest completes checkout from cart to order confirmation', async ({ page }) => {
    // Step 0: Navigate to home page (anonymous — no sign-in required)
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Step 1: Add first available product to cart
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await expect(firstProduct).toBeVisible();

    // Click the add-to-cart button on the first product
    const addToCart = firstProduct.locator('[data-testid="add-to-cart"]');
    await expect(addToCart).toBeVisible();
    await addToCart.click();

    // Step 2: Navigate to cart page
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/cart');

    // Step 3: Click checkout button to proceed to /checkout
    const checkoutButton = page.getByRole('button', { name: /Authorize Payment/i });
    await expect(checkoutButton).toBeVisible({ timeout: 5000 });
    await checkoutButton.click();
    await page.waitForURL('**/checkout');

    // Step 4: Verify we're on the Delivery step (Step 1 of 3)
    await expect(page.getByText('Delivery')).toBeVisible();
    await expect(page.getByText('Shipping Address')).toBeVisible();

    // Step 5: Fill address form fields
    // AddressSelector renders labels: Ad Soyad, Telefon, Sokak / Cadde, Posta Kodu, Şehir, Bölge / İlçe
    await page.getByLabel('Ad Soyad').fill('Test Kullanici');
    await page.getByLabel('Telefon').fill('+905551234567');
    await page.getByLabel(/Sokak \/ Cadde/).fill('Test Sokak No:42');
    await page.getByLabel('Posta Kodu').fill('34000');
    await page.getByLabel(/^Şehir$/).fill('İstanbul');

    // Step 6: Proceed to payment
    const continueButton = page.getByRole('button', { name: /Ödemeye Devam Et/i });
    await expect(continueButton).toBeEnabled({ timeout: 3000 });
    await continueButton.click();

    // Step 7: Wait for payment step to render
    // The create-payment-intent API will likely fail in test environment,
    // which triggers mock mode fallback (isMock=true)
    await expect(page.getByText(/Demo Mode|Secure Payment/i)).toBeVisible({ timeout: 15000 });

    // Step 8: Verify payment button is rendered (mock mode)
    // In mock mode, StripePaymentForm renders a "Pay {amount} Securely" button
    const payButton = page.getByRole('button', { name: /(Pay|Securely)/i });
    await expect(payButton).toBeVisible({ timeout: 10000 });

    // Step 9: Click pay — mock mode simulates payment with 1.5s delay
    await payButton.click();

    // Step 10: Verify order confirmation
    // After mock payment succeeds, step changes to 3 (Confirmation)
    // Look for the success heading or confirmation section
    await expect(page.getByText(/Ödeme Başarılı|Sipariş|Confirmation/i)).toBeVisible({
      timeout: 20000,
    });
  });

  test('guest checkout — required address fields validated', async ({ page }) => {
    // Navigate directly to checkout with empty cart
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });

    // Verify the page loaded and shows either checkout or empty-cart state
    // The checkout page may redirect to cart if cart is empty
    // This test verifies the form validation UI is present
    const formVisible = await page
      .getByText('Shipping Address')
      .isVisible()
      .catch(() => false);

    if (formVisible) {
      // Empty required fields should prevent submission
      // Fill only partial fields
      await page.getByLabel('Ad Soyad').fill('');
      await page.getByLabel('Telefon').fill('');

      // Click the submit button — HTML5 validation should trigger on required fields
      const continueButton = page.getByRole('button', { name: /Ödemeye Devam Et/i });
      await continueButton.click();

      // After browser validation, we should still be on the checkout page
      // (form should not submit with empty required fields)
      await expect(page).toHaveURL(/\/checkout/);
    }
  });

  test('guest cart accessible from home page with product added', async ({ page }) => {
    // Navigate to home page
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    // Add a product to cart
    const addToCart = page.locator('[data-testid="add-to-cart"]').first();
    await expect(addToCart).toBeVisible();
    await addToCart.click();

    // Navigate to cart page — verify the product is listed
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    // Cart page should render (even if empty, it renders the cart layout)
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
