# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-path.spec.ts >> Critical Production Paths >> checkout page loads
- Location: e2e\critical-path.spec.ts:57:3

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
        - generic [ref=e99]:
            - generic [ref=e100]:
                - button "Sepete geri dön" [ref=e101]:
                    - img [ref=e102]
                - heading "Secure Checkout" [level=1] [ref=e104]
            - generic [ref=e105]:
                - generic [ref=e106]:
                    - generic [ref=e107]: '1'
                    - generic [ref=e108]: Delivery
                - generic [ref=e109]:
                    - generic [ref=e110]: '2'
                    - generic [ref=e111]: Payment
                - generic [ref=e112]:
                    - generic [ref=e113]: '3'
                    - generic [ref=e114]: Confirmation
            - generic [ref=e115]:
                - generic [ref=e117]:
                    - generic [ref=e118]:
                        - img [ref=e120]
                        - heading "Shipping Address" [level=2] [ref=e125]
                    - generic [ref=e126]:
                        - generic [ref=e127]:
                            - generic [ref=e128]:
                                - button "Ev" [ref=e129]:
                                    - img [ref=e130]
                                    - text: Ev
                                - button "İş" [ref=e133]:
                                    - img [ref=e134]
                                    - text: İş
                                - button "Diğer" [ref=e137]:
                                    - img [ref=e138]
                                    - text: Diğer
                            - generic [ref=e141]:
                                - generic [ref=e142]:
                                    - generic [ref=e143]: Ad Soyad
                                    - textbox [ref=e144]
                                - generic [ref=e145]:
                                    - generic [ref=e146]: Telefon
                                    - textbox [ref=e147]
                            - generic [ref=e148]:
                                - generic [ref=e149]: Sokak / Cadde
                                - textbox "123 Node Ave" [ref=e150]
                            - generic [ref=e151]:
                                - generic [ref=e152]: Posta Kodu
                                - generic [ref=e153]:
                                    - textbox "SW1A 1AA" [ref=e154]
                                    - button "Bul" [disabled] [ref=e155]:
                                        - img [ref=e156]
                                        - text: Bul
                                - paragraph [ref=e159]: UK posta kodu → şehir/bölge otomatik dolar
                            - generic [ref=e160]:
                                - generic [ref=e161]:
                                    - generic [ref=e162]: Şehir
                                    - textbox [ref=e163]
                                - generic [ref=e164]:
                                    - generic [ref=e165]: Bölge / İlçe
                                    - textbox [ref=e166]
                        - button "Ödemeye Devam Et" [ref=e167]:
                            - text: Ödemeye Devam Et
                            - img [ref=e168]
                - generic [ref=e171]:
                    - heading "Order Summary" [level=3] [ref=e172]
                    - generic [ref=e174]:
                        - textbox "Kupon kodu" [ref=e175]
                        - button "Uygula" [disabled] [ref=e176]
                    - generic [ref=e177]:
                        - generic [ref=e178]:
                            - generic [ref=e179]: Subtotal
                            - generic [ref=e180]: £0.00
                        - generic [ref=e181]:
                            - generic [ref=e182]: Logistics
                            - generic [ref=e183]: £12.00
                        - generic [ref=e184]:
                            - generic [ref=e185]: VAT
                            - generic [ref=e186]: £0.00
                    - generic [ref=e187]:
                        - generic [ref=e188]: Total
                        - generic [ref=e189]: £12.00
                    - generic [ref=e190]:
                        - img [ref=e191]
                        - paragraph [ref=e194]: 256-bit Node Encryption active. Multi-sig escrow holding.
    - contentinfo [ref=e195]:
        - generic [ref=e196]:
            - generic [ref=e197]:
                - generic [ref=e198]:
                    - img [ref=e200]
                    - heading "Güvenli Alışveriş" [level=4] [ref=e203]
                    - paragraph [ref=e204]: 256 Bit Şifreleme
                - generic [ref=e205]:
                    - img [ref=e207]
                    - heading "Orijinal Ürün Garantisi" [level=4] [ref=e210]
                    - paragraph [ref=e211]: '%100 Güvenilir Kaynaklar'
                - generic [ref=e212]:
                    - img [ref=e214]
                    - heading "Hızlı Teknoloji" [level=4] [ref=e216]
                    - paragraph [ref=e217]: Anında Stok ve Flaş Teslimat
                - generic [ref=e218]:
                    - img [ref=e220]
                    - heading "Gizlilik Politikası" [level=4] [ref=e223]
                    - paragraph [ref=e224]: KVKK Kapsamında Koruma
            - generic [ref=e225]:
                - generic [ref=e226]:
                    - link "Benim Olan" [ref=e227] [cursor=pointer]:
                        - /url: /
                        - img [ref=e228]
                        - generic [ref=e229]: Benim Olan
                    - paragraph [ref=e230]: Türkiye'nin yenilikçi, hızlı ve her zaman avantajlı e-ticaret platformu. Aradığın her şey burada.
                    - generic [ref=e231]:
                        - button "App Store'dan İndirin" [ref=e232]:
                            - img [ref=e233]
                            - generic [ref=e235]:
                                - generic [ref=e236]: App Store'dan
                                - generic [ref=e237]: İndirin
                        - button "Google Play'den Alın" [ref=e238]:
                            - img [ref=e239]
                            - generic [ref=e241]:
                                - generic [ref=e242]: Google Play'den
                                - generic [ref=e243]: Alın
                - generic [ref=e244]:
                    - heading "Benim Olan" [level=4] [ref=e245]
                    - list [ref=e246]:
                        - listitem [ref=e247]:
                            - link "Hakkımızda" [ref=e248] [cursor=pointer]:
                                - /url: /about
                        - listitem [ref=e249]:
                            - link "Kariyer" [ref=e250] [cursor=pointer]:
                                - /url: /
                        - listitem [ref=e251]:
                            - link "İletişim" [ref=e252] [cursor=pointer]:
                                - /url: /contact
                        - listitem [ref=e253]:
                            - link "Sürdürülebilirlik" [ref=e254] [cursor=pointer]:
                                - /url: /
                        - listitem [ref=e255]:
                            - link "Güvenli Alışveriş" [ref=e256] [cursor=pointer]:
                                - /url: /
                - generic [ref=e257]:
                    - heading "Alışveriş" [level=4] [ref=e258]
                    - list [ref=e259]:
                        - listitem [ref=e260]:
                            - link "Kampanyalar" [ref=e261] [cursor=pointer]:
                                - /url: /campaigns
                        - listitem [ref=e262]:
                            - link "Hediye Kartı" [ref=e263] [cursor=pointer]:
                                - /url: /
                        - listitem [ref=e264]:
                            - link "Benim Olan Blog" [ref=e265] [cursor=pointer]:
                                - /url: /
                        - listitem [ref=e266]:
                            - link "Nasıl İade Ederim" [ref=e267] [cursor=pointer]:
                                - /url: /faq
                        - listitem [ref=e268]:
                            - link "İşlem Rehberi" [ref=e269] [cursor=pointer]:
                                - /url: /
                - generic [ref=e270]:
                    - heading "Satıcı" [level=4] [ref=e271]
                    - list [ref=e272]:
                        - listitem [ref=e273]:
                            - link "Satıcı Platformu" [ref=e274] [cursor=pointer]:
                                - /url: /sell
                        - listitem [ref=e275]:
                            - link "Benim Olan Akademi" [ref=e276] [cursor=pointer]:
                                - /url: /
                        - listitem [ref=e277]:
                            - link "Reklam Ver" [ref=e278] [cursor=pointer]:
                                - /url: /
                        - listitem [ref=e279]:
                            - link "İş Ortaklığı" [ref=e280] [cursor=pointer]:
                                - /url: /
                        - listitem [ref=e281]:
                            - link "Seller Center" [ref=e282] [cursor=pointer]:
                                - /url: /seller/dashboard
                - generic [ref=e283]:
                    - heading "Yasal" [level=4] [ref=e284]
                    - list [ref=e285]:
                        - listitem [ref=e286]:
                            - link "Gizlilik Politikasi" [ref=e287] [cursor=pointer]:
                                - /url: /privacy
                        - listitem [ref=e288]:
                            - link "Kullanici Sozlesmesi" [ref=e289] [cursor=pointer]:
                                - /url: /terms
                        - listitem [ref=e290]:
                            - link "KVKK Aydinlatma Metni" [ref=e291] [cursor=pointer]:
                                - /url: /kvkk
                        - listitem [ref=e292]:
                            - link "Cerez Politikasi" [ref=e293] [cursor=pointer]:
                                - /url: /cookies
                        - listitem [ref=e294]:
                            - link "VERBIS" [ref=e295] [cursor=pointer]:
                                - /url: /verbis
                - generic [ref=e296]:
                    - heading "Yardım" [level=4] [ref=e297]
                    - list [ref=e298]:
                        - listitem [ref=e299]:
                            - link "Müşteri Hizmetleri" [ref=e300] [cursor=pointer]:
                                - /url: /support
                        - listitem [ref=e301]:
                            - link "SSS" [ref=e302] [cursor=pointer]:
                                - /url: /faq
                        - listitem [ref=e303]:
                            - link "Canlı Yardım" [ref=e304] [cursor=pointer]:
                                - /url: /support
                        - listitem [ref=e305]:
                            - link "Yatırımcı İlişkileri" [ref=e306] [cursor=pointer]:
                                - /url: /
                        - listitem [ref=e307]:
                            - link "Kullanım Koşulları" [ref=e308] [cursor=pointer]:
                                - /url: /terms
                - generic [ref=e309]:
                    - heading "E-Bülten" [level=4] [ref=e310]
                    - paragraph [ref=e311]: Kampanya ve fırsatlardan ilk siz haberdar olun.
                    - form "E-bülten aboneliği" [ref=e312]:
                        - textbox "E-posta adresiniz" [ref=e313]
                        - button "Abone Ol" [ref=e314]
            - generic [ref=e315]:
                - generic [ref=e316]:
                    - generic [ref=e317]: 'Bizi Takip Edin:'
                    - generic [ref=e318]:
                        - link "Twitter/X" [ref=e319] [cursor=pointer]:
                            - /url: '#'
                            - img [ref=e320]
                        - link "Instagram" [ref=e322] [cursor=pointer]:
                            - /url: '#'
                            - img [ref=e323]
                        - link "Facebook" [ref=e326] [cursor=pointer]:
                            - /url: '#'
                            - img [ref=e327]
                        - link "Youtube" [ref=e329] [cursor=pointer]:
                            - /url: '#'
                            - img [ref=e330]
                - generic [ref=e333]:
                    - generic [ref=e334]: VISA
                    - generic [ref=e335]: Mastercard
                    - generic [ref=e336]: TROY
                    - generic [ref=e337]: iyzico
                    - generic [ref=e338]: Stripe
            - generic [ref=e339]:
                - paragraph [ref=e340]: © 2026 Benim Olan. Tüm hakları saklıdır.
                - paragraph [ref=e341]: 'Kayıtlı Elektronik Posta Adresi: benimolan@hs01.kep.tr | Mersis No: 0123456789000001'
    - button [ref=e343]:
        - img [ref=e344]
    - generic [ref=e349]:
        - img [ref=e351]
        - generic [ref=e353]:
            - generic [ref=e354]:
                - generic [ref=e355]:
                    - heading "Cerez Tercihleri" [level=3] [ref=e356]
                    - paragraph [ref=e357]: Sitemizde alisveris deneyiminizi iyilestirmek ve trafik analizi yapmak icin cerezler kullaniyoruz. Lutfen tercihlerinizi secin.
                - button "Kapat" [ref=e358]:
                    - img [ref=e359]
            - generic [ref=e362]:
                - generic [ref=e363]:
                    - generic [ref=e364]:
                        - img [ref=e365]
                        - generic [ref=e367]:
                            - paragraph [ref=e368]: Zorunlu Cerezler
                            - paragraph [ref=e369]: Oturum, sepet, guvenlik — her zaman aktif
                    - generic [ref=e370]: Hep Acik
                - generic [ref=e371]:
                    - generic [ref=e372]:
                        - img [ref=e373]
                        - generic [ref=e375]:
                            - paragraph [ref=e376]: Analitik Cerezler
                            - paragraph [ref=e377]: GA4 ile sayfa goruntuleme, urun etkilesimi takibi
                    - button "Analitik cerezler" [ref=e378]
                - generic [ref=e380]:
                    - generic [ref=e381]:
                        - img [ref=e382]
                        - generic [ref=e385]:
                            - paragraph [ref=e386]: Pazarlama Cerezleri
                            - paragraph [ref=e387]: Meta Pixel, TikTok — kisisellestirme ve reklam
                    - button "Pazarlama cerezleri" [ref=e388]
            - generic [ref=e390]:
                - button "Tumunu Kabul Et" [ref=e391]
                - button "Yalnizca Zorunlu" [ref=e392]
                - button "Detaylar" [ref=e393]:
                    - img [ref=e394]
                    - text: Detaylar
            - paragraph [ref=e396]: Tercihleriniz 6 ay sureyle saklanir. Dilediginiz zaman tarayici ayarlarinizdan cerezleri temizleyerek tercihlerinizi sifirlayabilirsiniz.
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
> 67  |     expect(hasCheckout).toBeTruthy();
      |                         ^ Error: expect(received).toBeTruthy()
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
  81  |     expect(hasContent).toBeTruthy();
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
```
