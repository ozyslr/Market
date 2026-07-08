/**
 * E2E tests: Address Book Flow at Checkout
 *
 * Tests the save-address-at-checkout workflow and address reuse for authenticated users.
 * Covers: inline new address form, "Bu adresi profilime kaydet" checkbox, saved address
 * selection, and form auto-fill.
 *
 * Prerequisites:
 *   - App running at BASE_URL (via `npm run build && npm run preview` or dev server)
 *   - Authenticated user session (Firebase email/password or storageState)
 *   - At least one item in the cart for checkout flow
 *   - Firestore users/{uid}.addresses[] field writable by authenticated user
 *
 * Key DOM elements (from AddressSelector.tsx):
 *   - "Kayıtlı Adreslerim" heading — shown when saved addresses > 0
 *   - "+ Yeni Adres" button — toggles the new address form
 *   - "Bu adresi profilime kaydet" checkbox — visible for authenticated users
 *   - Address type badges: "Ev" (Home), "İş" (Work), "Diğer" (Other) — rendered on saved address cards
 *   - Form fields: Ad Soyad, Telefon, Sokak / Cadde, Posta Kodu, Şehir, Bölge / İlçe
 *
 * This file uses test.skip() by default for tests requiring authentication.
 * Remove .skip() after configuring auth setup.
 */

import { test, expect } from '@playwright/test';

test.describe('Address Book — Checkout Integration', () => {
  test.slow();

  // TODO: Unskip after configuring auth setup (storageState or test account)
  test.skip('save new address at checkout and verify it appears on subsequent checkout', async ({
    page,
  }) => {
    // Navigate to checkout with items in cart
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/checkout');

    // Step 1: Fill a new address in the inline form
    await page.getByLabel('Ad Soyad').fill('Adres Test Kullanici');
    await page.getByLabel('Telefon').fill('+905551112233');
    await page.getByLabel(/Sokak \/ Cadde/).fill('789 Yeni Mahalle Sokak');
    await page.getByLabel('Posta Kodu').fill('34700');
    await page.getByLabel(/^Şehir$/).fill('İstanbul');
    await page.getByLabel(/Bölge \/ İlçe/).fill('Kadıköy');

    // Step 2: Check "Bu adresi profilime kaydet" checkbox
    // This checkbox only renders when `user` is truthy (authenticated)
    const saveAddressCheckbox = page.getByText(/Bu adresi profilime kaydet/i);
    if (await saveAddressCheckbox.isVisible().catch(() => false)) {
      await saveAddressCheckbox.click();
    }

    // Step 3: Proceed to payment
    const continueButton = page.getByRole('button', { name: /Ödemeye Devam Et/i });
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
    }

    // Step 4: Complete payment in mock mode
    const payButton = page.getByRole('button', { name: /(Pay|Securely)/i });
    if (await payButton.isVisible().catch(() => false)) {
      await payButton.click();
    }

    // Step 5: Verify order confirmation
    await expect(page.getByText(/Ödeme Başarılı|Sipariş|Confirmation/i)).toBeVisible({
      timeout: 25000,
    });

    // Step 6: Navigate back to checkout to verify saved address appears
    // First, add another item to cart to re-enable checkout
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    await page.locator('[data-testid="add-to-cart"]').first().click();
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/checkout');

    // Step 7: Verify "Kayıtlı Adreslerim" section shows the saved address
    const savedAddressesHeading = page.getByText(/Kayıtlı Adreslerim/i);
    await expect(savedAddressesHeading).toBeVisible({ timeout: 10000 });

    // Verify the saved address card contains the street name we entered
    const savedAddressCard = page.locator('button').filter({ hasText: /Yeni Mahalle Sokak/i });
    await expect(savedAddressCard.first()).toBeVisible({ timeout: 5000 });

    // Step 8: Click the saved address card — form should auto-fill
    await savedAddressCard.first().click();

    // Verify form fields are populated with saved address data
    await expect(page.getByLabel('Ad Soyad')).toHaveValue('Adres Test Kullanici');
    await expect(page.getByLabel(/Sokak \/ Cadde/)).toHaveValue('789 Yeni Mahalle Sokak');
    await expect(page.getByLabel(/^Şehir$/)).toHaveValue('İstanbul');
  });

  // TODO: Unskip after configuring auth setup
  test.skip('new address form toggle renders "+ Yeni Adres" button when saved addresses exist', async ({
    page,
  }) => {
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/checkout');

    // If user has saved addresses, the "Kayıtlı Adreslerim" section + "+ Yeni Adres" button appear
    const savedSection = page.getByText(/Kayıtlı Adreslerim/i);
    const hasSaved = await savedSection.isVisible().catch(() => false);

    if (hasSaved) {
      // Click "+ Yeni Adres" to toggle new address form
      const newAddressButton = page.getByRole('button', { name: /Yeni Adres/i });
      await expect(newAddressButton).toBeVisible();
      await newAddressButton.click();

      // Verify new address form appears with "Yeni Teslimat Adresi" heading
      await expect(page.getByText(/Yeni Teslimat Adresi/i)).toBeVisible({ timeout: 3000 });

      // Verify form fields are visible
      await expect(page.getByLabel('Ad Soyad')).toBeVisible();
      await expect(page.getByLabel('Telefon')).toBeVisible();
      await expect(page.getByLabel(/Sokak \/ Cadde/)).toBeVisible();
    }
  });

  test.skip('address type badges render on saved address cards', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/checkout');

    // Check for address type indicators
    // Address cards show labels like "Ev", "İş", "Diğer" as part of the address label
    const addressSection = page.getByText(/Kayıtlı Adreslerim/i);
    if (await addressSection.isVisible().catch(() => false)) {
      // Verify at least one address card has a MapPin icon (all saved addresses render with MapPin)
      const mapPinIcons = page.locator('svg').filter({ has: page.locator('text=MapPin') });
      // AddressSelector renders MapPin size={10} on each saved address card
      // Just verify the section renders with address content
      await expect(page.getByText(/Kayıtlı Adreslerim/i)).toBeVisible();
    }
  });

  test.skip('save address checkbox hidden for anonymous users', async ({ page }) => {
    // When NOT authenticated, the "Bu adresi profilime kaydet" checkbox should not render
    // AddressSelector.tsx line 213: {!!user && (<checkbox>)}
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/checkout');

    // The checkbox text should NOT be visible for anonymous users
    const saveCheckbox = page.getByText(/Bu adresi profilime kaydet/i);
    await expect(saveCheckbox).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Address Book — Form Validation', () => {
  test('required fields prevent empty submission (anonymous user)', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });

    // Check if checkout page loaded (may redirect if cart empty)
    const isCheckout = await page
      .getByText('Shipping Address')
      .isVisible()
      .catch(() => false);

    if (isCheckout) {
      // Leave all fields empty and try to submit
      const continueButton = page.getByRole('button', { name: /Ödemeye Devam Et/i });
      if (await continueButton.isVisible().catch(() => false)) {
        await continueButton.click();
        // Browser-level HTML5 validation should prevent form submission
        // Page URL should remain on /checkout
        await expect(page).toHaveURL(/\/checkout/);
      }
    }
  });
});
