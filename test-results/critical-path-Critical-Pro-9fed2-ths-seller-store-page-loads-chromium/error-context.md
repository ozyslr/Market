# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-path.spec.ts >> Critical Production Paths >> seller store page loads
- Location: e2e\critical-path.spec.ts:70:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [ref=e3]:
    - link "İçeriğe atla" [ref=e4] [cursor=pointer]:
        - /url: '#main-content'
    - navigation "Ana navigasyon" [ref=e5]:
        - generic [ref=e7]:
            - generic [ref=e8]:
                - generic [ref=e11]: 'London Merkezi: Aktif'
                - generic [ref=e14]: 'Istanbul Merkezi: Aktif'
                - generic [ref=e15]:
                    - img [ref=e16]
                    - generic [ref=e19]: 'Pazar Endeksi: +1.24%'
            - generic [ref=e20]:
                - generic [ref=e21]: 'Vergi Kimlik No: MCR-2026-X'
                - generic [ref=e22]: 'Global Destek: +44 20 7946 0958'
        - generic [ref=e24]:
            - link "Benim Olan ana sayfa" [ref=e25] [cursor=pointer]:
                - /url: /
                - img "Benim Olan" [ref=e26]
            - generic [ref=e27]:
                - button "Konum Seç" [ref=e28] [cursor=pointer]:
                    - generic [ref=e29]:
                        - img [ref=e30]
                        - generic [ref=e33]: Konum Seç
                        - img [ref=e34]
                    - generic [ref=e36]: London, UK
                - search "Ürün ara" [ref=e37]:
                    - 'textbox "Küresel ürün ara: ''El yapımı SAAT''..." [ref=e38]'
                    - link "Görsel ile ara" [ref=e39] [cursor=pointer]:
                        - /url: /visual-search
                        - img [ref=e40]
                    - button "Ara" [ref=e43]:
                        - img [ref=e44]
            - generic [ref=e47]:
                - button "Karanlık moda geç" [ref=e48]:
                    - img [ref=e49]
                - button "Para birimi değiştir" [ref=e51] [cursor=pointer]:
                    - generic [ref=e52]: €
                - button "Dil seç" [ref=e54]:
                    - img [ref=e55]
                    - generic [ref=e58]: tr
                - button "Favorilerim" [ref=e59]:
                    - img [ref=e61]
                    - generic [ref=e63]: Favorilerim
                - button "Hesabım" [ref=e65]:
                    - img [ref=e66]
                    - generic [ref=e70]: Hesabım
                - link "Sepet" [ref=e71] [cursor=pointer]:
                    - /url: /cart
                    - img [ref=e73]
                    - generic [ref=e76]: Sepetim
        - navigation "Kategori hızlı erişim" [ref=e77]:
            - generic [ref=e78]:
                - generic [ref=e79]:
                    - button "Tüm Kategoriler" [ref=e80]:
                        - img [ref=e81]
                        - text: Tüm Kategoriler
                    - link "Günün Fırsatları" [ref=e82] [cursor=pointer]:
                        - /url: /collection/deals
                    - link "En Çok Satanlar" [ref=e83] [cursor=pointer]:
                        - /url: /collection/best-sellers
                    - link "Yeni Gelenler" [ref=e84] [cursor=pointer]:
                        - /url: /collection/new-arrivals
                    - link "Flash Fırsatları" [ref=e85] [cursor=pointer]:
                        - /url: /collection/flash-deals
                    - link "Öne Çıkanlar" [ref=e86] [cursor=pointer]:
                        - /url: /collection/featured
                    - link "Kampanyalar" [ref=e87] [cursor=pointer]:
                        - /url: /campaigns
                    - link "Benim Olan Prime" [ref=e88] [cursor=pointer]:
                        - /url: /search?delivery=prime
                    - link "Gift Finder" [ref=e89] [cursor=pointer]:
                        - /url: /search?tag=gift
                - link "Benim Olan'da Sat" [ref=e91] [cursor=pointer]:
                    - /url: /sell
                    - img [ref=e92]
                    - text: Benim Olan'da Sat
    - main [ref=e97]:
        - status [ref=e98]:
            - img [ref=e99]
            - generic [ref=e101]: Yükleniyor...
    - contentinfo [ref=e102]:
        - generic [ref=e103]:
            - generic [ref=e104]:
                - generic [ref=e105]:
                    - img [ref=e107]
                    - heading "Güvenli Alışveriş" [level=4] [ref=e110]
                    - paragraph [ref=e111]: 256 Bit Şifreleme
                - generic [ref=e112]:
                    - img [ref=e114]
                    - heading "Orijinal Ürün Garantisi" [level=4] [ref=e117]
                    - paragraph [ref=e118]: '%100 Güvenilir Kaynaklar'
                - generic [ref=e119]:
                    - img [ref=e121]
                    - heading "Hızlı Teknoloji" [level=4] [ref=e123]
                    - paragraph [ref=e124]: Anında Stok ve Flaş Teslimat
                - generic [ref=e125]:
                    - img [ref=e127]
                    - heading "Gizlilik Politikası" [level=4] [ref=e130]
                    - paragraph [ref=e131]: KVKK Kapsamında Koruma
            - generic [ref=e132]:
                - generic [ref=e133]:
                    - link "Benim Olan" [ref=e134] [cursor=pointer]:
                        - /url: /
                        - img [ref=e135]
                        - generic [ref=e136]: Benim Olan
                    - paragraph [ref=e137]: Türkiye'nin yenilikçi, hızlı ve her zaman avantajlı e-ticaret platformu. Aradığın her şey burada.
                    - generic [ref=e138]:
                        - button "App Store'dan İndirin" [ref=e139]:
                            - img [ref=e140]
                            - generic [ref=e142]:
                                - generic [ref=e143]: App Store'dan
                                - generic [ref=e144]: İndirin
                        - button "Google Play'den Alın" [ref=e145]:
                            - img [ref=e146]
                            - generic [ref=e148]:
                                - generic [ref=e149]: Google Play'den
                                - generic [ref=e150]: Alın
                - generic [ref=e151]:
                    - heading "Benim Olan" [level=4] [ref=e152]
                    - list [ref=e153]:
                        - listitem [ref=e154]:
                            - link "Hakkımızda" [ref=e155] [cursor=pointer]:
                                - /url: /about
                        - listitem [ref=e156]:
                            - link "Kariyer" [ref=e157] [cursor=pointer]:
                                - /url: /
                        - listitem [ref=e158]:
                            - link "İletişim" [ref=e159] [cursor=pointer]:
                                - /url: /contact
                        - listitem [ref=e160]:
                            - link "Sürdürülebilirlik" [ref=e161] [cursor=pointer]:
                                - /url: /
                        - listitem [ref=e162]:
                            - link "Güvenli Alışveriş" [ref=e163] [cursor=pointer]:
                                - /url: /
                - generic [ref=e164]:
                    - heading "Alışveriş" [level=4] [ref=e165]
                    - list [ref=e166]:
                        - listitem [ref=e167]:
                            - link "Kampanyalar" [ref=e168] [cursor=pointer]:
                                - /url: /campaigns
                        - listitem [ref=e169]:
                            - link "Hediye Kartı" [ref=e170] [cursor=pointer]:
                                - /url: /
                        - listitem [ref=e171]:
                            - link "Benim Olan Blog" [ref=e172] [cursor=pointer]:
                                - /url: /
                        - listitem [ref=e173]:
                            - link "Nasıl İade Ederim" [ref=e174] [cursor=pointer]:
                                - /url: /faq
                        - listitem [ref=e175]:
                            - link "İşlem Rehberi" [ref=e176] [cursor=pointer]:
                                - /url: /
                - generic [ref=e177]:
                    - heading "Satıcı" [level=4] [ref=e178]
                    - list [ref=e179]:
                        - listitem [ref=e180]:
                            - link "Satıcı Platformu" [ref=e181] [cursor=pointer]:
                                - /url: /sell
                        - listitem [ref=e182]:
                            - link "Benim Olan Akademi" [ref=e183] [cursor=pointer]:
                                - /url: /
                        - listitem [ref=e184]:
                            - link "Reklam Ver" [ref=e185] [cursor=pointer]:
                                - /url: /
                        - listitem [ref=e186]:
                            - link "İş Ortaklığı" [ref=e187] [cursor=pointer]:
                                - /url: /
                        - listitem [ref=e188]:
                            - link "Seller Center" [ref=e189] [cursor=pointer]:
                                - /url: /seller/dashboard
                - generic [ref=e190]:
                    - heading "Yasal" [level=4] [ref=e191]
                    - list [ref=e192]:
                        - listitem [ref=e193]:
                            - link "Gizlilik Politikasi" [ref=e194] [cursor=pointer]:
                                - /url: /privacy
                        - listitem [ref=e195]:
                            - link "Kullanici Sozlesmesi" [ref=e196] [cursor=pointer]:
                                - /url: /terms
                        - listitem [ref=e197]:
                            - link "KVKK Aydinlatma Metni" [ref=e198] [cursor=pointer]:
                                - /url: /kvkk
                        - listitem [ref=e199]:
                            - link "Cerez Politikasi" [ref=e200] [cursor=pointer]:
                                - /url: /cookies
                        - listitem [ref=e201]:
                            - link "VERBIS" [ref=e202] [cursor=pointer]:
                                - /url: /verbis
                - generic [ref=e203]:
                    - heading "Yardım" [level=4] [ref=e204]
                    - list [ref=e205]:
                        - listitem [ref=e206]:
                            - link "Müşteri Hizmetleri" [ref=e207] [cursor=pointer]:
                                - /url: /support
                        - listitem [ref=e208]:
                            - link "SSS" [ref=e209] [cursor=pointer]:
                                - /url: /faq
                        - listitem [ref=e210]:
                            - link "Canlı Yardım" [ref=e211] [cursor=pointer]:
                                - /url: /support
                        - listitem [ref=e212]:
                            - link "Yatırımcı İlişkileri" [ref=e213] [cursor=pointer]:
                                - /url: /
                        - listitem [ref=e214]:
                            - link "Kullanım Koşulları" [ref=e215] [cursor=pointer]:
                                - /url: /terms
                - generic [ref=e216]:
                    - heading "E-Bülten" [level=4] [ref=e217]
                    - paragraph [ref=e218]: Kampanya ve fırsatlardan ilk siz haberdar olun.
                    - form "E-bülten aboneliği" [ref=e219]:
                        - textbox "E-posta adresiniz" [ref=e220]
                        - button "Abone Ol" [ref=e221]
            - generic [ref=e222]:
                - generic [ref=e223]:
                    - generic [ref=e224]: 'Bizi Takip Edin:'
                    - generic [ref=e225]:
                        - link "Twitter/X" [ref=e226] [cursor=pointer]:
                            - /url: '#'
                            - img [ref=e227]
                        - link "Instagram" [ref=e229] [cursor=pointer]:
                            - /url: '#'
                            - img [ref=e230]
                        - link "Facebook" [ref=e233] [cursor=pointer]:
                            - /url: '#'
                            - img [ref=e234]
                        - link "Youtube" [ref=e236] [cursor=pointer]:
                            - /url: '#'
                            - img [ref=e237]
                - generic [ref=e240]:
                    - generic [ref=e241]: VISA
                    - generic [ref=e242]: Mastercard
                    - generic [ref=e243]: TROY
                    - generic [ref=e244]: iyzico
                    - generic [ref=e245]: Stripe
            - generic [ref=e246]:
                - paragraph [ref=e247]: © 2026 Benim Olan. Tüm hakları saklıdır.
                - paragraph [ref=e248]: 'Kayıtlı Elektronik Posta Adresi: benimolan@hs01.kep.tr | Mersis No: 0123456789000001'
    - button [ref=e250]:
        - img [ref=e251]
    - generic [ref=e256]:
        - img [ref=e258]
        - generic [ref=e260]:
            - generic [ref=e261]:
                - generic [ref=e262]:
                    - heading "Cerez Tercihleri" [level=3] [ref=e263]
                    - paragraph [ref=e264]: Sitemizde alisveris deneyiminizi iyilestirmek ve trafik analizi yapmak icin cerezler kullaniyoruz. Lutfen tercihlerinizi secin.
                - button "Kapat" [ref=e265]:
                    - img [ref=e266]
            - generic [ref=e269]:
                - generic [ref=e270]:
                    - generic [ref=e271]:
                        - img [ref=e272]
                        - generic [ref=e274]:
                            - paragraph [ref=e275]: Zorunlu Cerezler
                            - paragraph [ref=e276]: Oturum, sepet, guvenlik — her zaman aktif
                    - generic [ref=e277]: Hep Acik
                - generic [ref=e278]:
                    - generic [ref=e279]:
                        - img [ref=e280]
                        - generic [ref=e282]:
                            - paragraph [ref=e283]: Analitik Cerezler
                            - paragraph [ref=e284]: GA4 ile sayfa goruntuleme, urun etkilesimi takibi
                    - button "Analitik cerezler" [ref=e285]
                - generic [ref=e287]:
                    - generic [ref=e288]:
                        - img [ref=e289]
                        - generic [ref=e292]:
                            - paragraph [ref=e293]: Pazarlama Cerezleri
                            - paragraph [ref=e294]: Meta Pixel, TikTok — kisisellestirme ve reklam
                    - button "Pazarlama cerezleri" [ref=e295]
            - generic [ref=e297]:
                - button "Tumunu Kabul Et" [ref=e298]
                - button "Yalnizca Zorunlu" [ref=e299]
                - button "Detaylar" [ref=e300]:
                    - img [ref=e301]
                    - text: Detaylar
            - paragraph [ref=e303]: Tercihleriniz 6 ay sureyle saklanir. Dilediginiz zaman tarayici ayarlarinizdan cerezleri temizleyerek tercihlerinizi sifirlayabilirsiniz.
```

# Test source

```ts
  1   | /**
  2   |  * E2E: Critical production paths — can run against live site or dev server.
  3   |  * No auth required for these smoke tests.
  4   |  *
  5   |  * Run: npx playwright test e2e/critical-path.spec.ts
  6   |  * Against live: BASE_URL=https://benimolan.com npx playwright test e2e/critical-path.spec.ts
  7   |  */
  8   | import { test, expect } from '@playwright/test';
  9   |
  10  | test.describe('Critical Production Paths', () => {
  11  |   test('homepage loads and shows products', async ({ page }) => {
  12  |     await page.goto('/');
  13  |     await expect(page).toHaveTitle(/Benim Olan|Mercora/i);
  14  |
  15  |     // Hero section should be visible
  16  |     await expect(page.locator('h1, [class*="hero"]').first()).toBeVisible({ timeout: 10000 });
  17  |
  18  |     // Product cards or sections should render
  19  |     const productCards = page.locator(
  20  |       '[class*="ProductCard"], [class*="product"], a[href*="/product/"]',
  21  |     );
  22  |     const count = await productCards.count();
  23  |     // At least some product content should exist on homepage
  24  |     expect(count).toBeGreaterThanOrEqual(0); // Dynamic — may be 0 if empty DB
  25  |   });
  26  |
  27  |   test('can navigate to a product detail page', async ({ page }) => {
  28  |     await page.goto('/');
  29  |
  30  |     // Try to find and click a product link
  31  |     const productLink = page.locator('a[href*="/product/"]').first();
  32  |     const hasProduct = await productLink.isVisible({ timeout: 5000 }).catch(() => false);
  33  |
  34  |     if (hasProduct) {
  35  |       await productLink.click();
  36  |       await page.waitForURL('**/product/**', { timeout: 10000 });
  37  |
  38  |       // Product detail should show title and price
  39  |       await expect(page.locator('h1, h2, [class*="title"]').first()).toBeVisible({ timeout: 5000 });
  40  |     }
  41  |     // If no products, skip gracefully
  42  |   });
  43  |
  44  |   test('cart page loads', async ({ page }) => {
  45  |     await page.goto('/cart');
  46  |     await page.waitForURL('**/cart', { timeout: 10000 });
  47  |
  48  |     // Should show either "Sepet" title or empty state
  49  |     const hasCartContent = await page
  50  |       .getByText(/Sepet|Cart|sepetin/i)
  51  |       .first()
  52  |       .isVisible({ timeout: 5000 })
  53  |       .catch(() => false);
  54  |     expect(hasCartContent).toBeTruthy();
  55  |   });
  56  |
  57  |   test('checkout page loads', async ({ page }) => {
  58  |     await page.goto('/checkout');
  59  |     await page.waitForURL('**/checkout', { timeout: 10000 });
  60  |
  61  |     // Should show checkout UI or redirect/error
  62  |     const hasCheckout = await page
  63  |       .getByText(/Checkout|Ödeme|checkout/i)
  64  |       .first()
  65  |       .isVisible({ timeout: 5000 })
  66  |       .catch(() => false);
  67  |     expect(hasCheckout).toBeTruthy();
  68  |   });
  69  |
  70  |   test('seller store page loads', async ({ page }) => {
  71  |     // Try a known seller slug
  72  |     await page.goto('/store/aura-audio');
  73  |     await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
  74  |
  75  |     // Should show store name or loading/error state
  76  |     const hasContent = await page
  77  |       .locator('h1, h2, [class*="store"], [class*="seller"]')
  78  |       .first()
  79  |       .isVisible({ timeout: 8000 })
  80  |       .catch(() => false);
> 81  |     expect(hasContent).toBeTruthy();
      |                        ^ Error: expect(received).toBeTruthy()
  82  |   });
  83  |
  84  |   test('search functionality works', async ({ page }) => {
  85  |     await page.goto('/');
  86  |     await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
  87  |
  88  |     // Find search input (multiple possible selectors)
  89  |     const searchInput = page
  90  |       .locator(
  91  |         'input[type="search"], input[placeholder*="Ara"], input[placeholder*="ara"], input[placeholder*="Search"], input[placeholder*="search"]',
  92  |       )
  93  |       .first();
  94  |
  95  |     const isSearchVisible = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);
  96  |     if (isSearchVisible) {
  97  |       await searchInput.fill('test');
  98  |       await searchInput.press('Enter');
  99  |       await page.waitForTimeout(2000);
  100 |
  101 |       // Should navigate to search results or filter existing content
  102 |       const currentUrl = page.url();
  103 |       // Even if no navigation, page should not crash
  104 |       expect(currentUrl).toBeTruthy();
  105 |     }
  106 |   });
  107 |
  108 |   test('i18n: language switching works', async ({ page }) => {
  109 |     await page.goto('/');
  110 |
  111 |     // Look for language toggle or selector
  112 |     const langToggle = page
  113 |       .locator('[class*="language"], [class*="lang"], button:has-text("TR"), button:has-text("EN")')
  114 |       .first();
  115 |     const hasToggle = await langToggle.isVisible({ timeout: 3000 }).catch(() => false);
  116 |
  117 |     if (hasToggle) {
  118 |       await langToggle.click();
  119 |       await page.waitForTimeout(500);
  120 |
  121 |       // Page should not crash after language change
  122 |       await expect(page.locator('body')).toBeVisible();
  123 |     }
  124 |   });
  125 |
  126 |   test('admin login page accessible', async ({ page }) => {
  127 |     await page.goto('/admin');
  128 |     await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
  129 |
  130 |     // Admin page should redirect to login or show admin panel
  131 |     const currentUrl = page.url();
  132 |     expect(currentUrl).toBeTruthy();
  133 |     // Page should render something — not a blank white page
  134 |     await expect(page.locator('body')).toBeVisible();
  135 |   });
  136 |
  137 |   test('firebase auth modal opens', async ({ page }) => {
  138 |     await page.goto('/');
  139 |
  140 |     // Look for login/profile button
  141 |     const loginBtn = page
  142 |       .locator('button:has-text("Giriş"), a:has-text("Giriş"), [class*="login"], [class*="auth"]')
  143 |       .first();
  144 |     const hasLogin = await loginBtn.isVisible({ timeout: 5000 }).catch(() => false);
  145 |
  146 |     if (hasLogin) {
  147 |       await loginBtn.click();
  148 |       await page.waitForTimeout(1000);
  149 |
  150 |       // Auth modal should have opened (or navigation occurred)
  151 |       // Just verify page doesn't crash
  152 |       await expect(page.locator('body')).toBeVisible();
  153 |     }
  154 |   });
  155 |
  156 |   test('responsive: mobile menu works', async ({ page }) => {
  157 |     // Set mobile viewport
  158 |     await page.setViewportSize({ width: 375, height: 812 });
  159 |     await page.goto('/');
  160 |     await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
  161 |
  162 |     // Look for hamburger menu
  163 |     const mobileMenu = page
  164 |       .locator(
  165 |         'button[class*="menu"], button[class*="hamburger"], [aria-label*="menu"], [aria-label*="Menü"]',
  166 |       )
  167 |       .first();
  168 |     const hasMenu = await mobileMenu.isVisible({ timeout: 3000 }).catch(() => false);
  169 |
  170 |     if (hasMenu) {
  171 |       await mobileMenu.click();
  172 |       await page.waitForTimeout(500);
  173 |
  174 |       // Mobile nav should be visible
  175 |       const navVisible = await page
  176 |         .locator('nav, [class*="nav"], [role="navigation"]')
  177 |         .first()
  178 |         .isVisible()
  179 |         .catch(() => false);
  180 |       expect(navVisible || true).toBeTruthy(); // Soft assertion
  181 |     }
```
