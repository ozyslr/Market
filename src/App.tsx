import { useEffect, lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { HelmetProvider as HelmetProviderOrig } from 'react-helmet-async';
import { Sentry } from './lib/sentry';
import { initAnalytics, getConsent, trackEvent } from './lib/analytics';
import { AnalyticsTracker } from './components/common/AnalyticsTracker';
import { Navbar } from './components/layout/Navbar';
import { AdminRoute } from './components/auth/AdminRoute';
import { OfflineBanner } from './services/offlineService';
import { SkipToContent } from './components/common/SkipToContent';
import { CookieConsent } from './components/common/CookieConsent';
import SellerLayout from './components/layout/SellerLayout';
// React 19 removed children from ComponentClass props — explicit wrappers restore type-safety
const HelmetProvider = HelmetProviderOrig as ComponentType<{ children: ReactNode }>;

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}
const SentryErrorBoundary = Sentry.ErrorBoundary as any as ComponentType<ErrorBoundaryProps>;

import { Footer } from './components/layout/Footer';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LocationProvider } from './context/LocationContext';
import { ScrollToTop } from './components/common/ScrollToTop';
import { WishlistProvider } from './context/WishlistContext';
import { FollowsProvider } from './context/FollowsContext';
import { NotificationProvider } from './context/NotificationContext';

// ─── Lazy-loaded page components (route-level code splitting) ──────────────

// Helper: extract named export for React.lazy (which requires default exports)
const named = <T extends ComponentType<any>>(
  importer: () => Promise<Record<string, T>>,
  name: string,
) => lazy(() => importer().then((m) => ({ default: m[name] })));

const defaultPage = <T extends ComponentType<any>>(importer: () => Promise<{ default: T }>) =>
  lazy(importer);

// Main layout pages
const Home = named(() => import('./pages/Home'), 'Home');
const ProductDetail = named(() => import('./pages/ProductDetail'), 'ProductDetail');
const CartPage = named(() => import('./pages/Cart'), 'CartPage');
const CheckoutPage = named(() => import('./pages/Checkout'), 'CheckoutPage');
const SearchResultsPage = named(() => import('./pages/SearchResults'), 'SearchResultsPage');
const CategoryPage = named(() => import('./pages/CategoryPage'), 'CategoryPage');
const CollectionPage = named(() => import('./pages/CollectionPage'), 'CollectionPage');
const UserProfilePage = named(() => import('./pages/UserProfile'), 'UserProfilePage');
const Wishlist = named(() => import('./pages/Wishlist'), 'Wishlist');
const OrderHistory = named(() => import('./pages/OrderHistory'), 'OrderHistory');
const OrderTracking = named(() => import('./pages/OrderTracking'), 'OrderTracking');
const UserSupport = named(() => import('./pages/UserSupport'), 'UserSupport');
const VisualSearch = named(() => import('./pages/VisualSearch'), 'VisualSearch');
const ProductVerification = named(
  () => import('./pages/ProductVerification'),
  'ProductVerification',
);
const MessageCenter = named(() => import('./pages/MessageCenter'), 'MessageCenter');
const Campaigns = named(() => import('./pages/Campaigns'), 'Campaigns');
const FollowedSellers = named(() => import('./pages/FollowedSellers'), 'FollowedSellers');
const PriceAlerts = named(() => import('./pages/PriceAlerts'), 'PriceAlerts');
const About = named(() => import('./pages/About'), 'About');
const Contact = named(() => import('./pages/Contact'), 'Contact');
const FAQ = named(() => import('./pages/FAQ'), 'FAQ');
const NotFound = named(() => import('./pages/NotFound'), 'NotFound');
const PrivacyPolicy = named(() => import('./pages/PrivacyPolicy'), 'PrivacyPolicy');
const TermsOfService = named(() => import('./pages/TermsOfService'), 'TermsOfService');
const KVKKDisclosure = named(() => import('./pages/KVKKDisclosure'), 'KVKKDisclosure');
const CookiePolicy = named(() => import('./pages/CookiePolicy'), 'CookiePolicy');
const VERBISInfo = named(() => import('./pages/VERBISInfo'), 'VERBISInfo');

// Seller pages
const SellerDashboard = named(() => import('./pages/SellerDashboard'), 'SellerDashboard');
const SellerInventoryPage = named(() => import('./pages/SellerInventory'), 'SellerInventoryPage');
const SellerOrdersPage = named(() => import('./pages/SellerOrders'), 'SellerOrdersPage');
const SellerStorePage = named(() => import('./pages/SellerStore'), 'SellerStorePage');
const SellerStoreSettingsPage = named(
  () => import('./pages/SellerStoreSettings'),
  'SellerStoreSettings',
);
const SellerSettings = named(() => import('./pages/SellerSettings'), 'SellerSettings');
const SellerImportCenter = named(() => import('./pages/SellerImportCenter'), 'SellerImportCenter');
const SellerApplication = named(() => import('./pages/SellerApplication'), 'SellerApplication');
const SellerFinance = named(() => import('./pages/SellerFinance'), 'SellerFinance');
const SellerPricing = named(() => import('./pages/SellerPricing'), 'SellerPricing');
const SellerCertificates = named(() => import('./pages/SellerCertificates'), 'SellerCertificates');
const SellerCoupons = named(() => import('./pages/SellerCoupons'), 'SellerCoupons');
const SellerCouponsPage = named(() => import('./pages/SellerCouponManager'), 'SellerCouponManager');
const StoreBlocksEditorPage = named(() => import('./pages/StoreBlocksEditor'), 'StoreBlocksEditor');
const SellerMenuEditorPage = named(() => import('./pages/SellerMenuEditor'), 'SellerMenuEditor');
const SellerPerformance = named(() => import('./pages/SellerPerformance'), 'SellerPerformance');
const SellerInvoices = named(() => import('./pages/SellerInvoices'), 'SellerInvoices');
const SellerPriceAnalysis = named(
  () => import('./pages/SellerPriceAnalysis'),
  'SellerPriceAnalysis',
);
const SellerApiKeys = named(() => import('./pages/SellerApiKeys'), 'SellerApiKeys');
const SellerMessages = named(() => import('./pages/SellerMessages'), 'SellerMessages');
const SellerAnalytics = defaultPage(() => import('./pages/SellerAnalytics'));

// Admin pages
const AdminDashboard = named(() => import('./pages/AdminDashboard'), 'AdminDashboard');
const AdminSellerView = named(() => import('./pages/AdminSellerView'), 'AdminSellerView');
const AdminCategories = named(() => import('./pages/AdminCategories'), 'AdminCategories');
const ModeratorDashboard = named(() => import('./pages/ModeratorDashboard'), 'ModeratorDashboard');
const AdminDataDeletion = named(() => import('./pages/AdminDataDeletion'), 'AdminDataDeletion');

// Other
const SellOnBenimOlan = named(() => import('./pages/SellOnBenimOlan'), 'SellOnBenimOlan');

import { ShoppingAssistant } from './components/ai/ShoppingAssistant';
import { LiveChatWidget } from './components/chat/LiveChatWidget';
import { BotSalesEngine } from './components/commerce/BotSalesEngine';

// ─── Page loading fallback ─────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
        <p className="text-sm text-zinc-400">Yükleniyor...</p>
      </div>
    </div>
  );
}

// ─── Layouts ───────────────────────────────────────────────────────────────

function MainLayout() {
  useEffect(() => {
    if (getConsent() === 'granted') {
      initAnalytics();
    }
    trackEvent('page_view', { page_title: document.title, page_location: window.location.href });
  }, []);

  return (
    <div className="relative min-h-screen transition-colors duration-300">
      <OfflineBanner />
      <SkipToContent />
      <Navbar />
      <main id="main-content" role="main" className="pt-[144px] md:pt-[156px]" tabIndex={-1}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <ShoppingAssistant />
      <BotSalesEngine />
      <LiveChatWidget />
      <CookieConsent />
    </div>
  );
}

function SellerSuspense() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <SentryErrorBoundary fallback={<p>Bir hata oluştu. Lütfen sayfayı yenileyin.</p>}>
      <HelmetProvider>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <FollowsProvider>
                  <NotificationProvider>
                    <LanguageProvider>
                      <CurrencyProvider>
                        <LocationProvider>
                          <Router>
                            <ScrollToTop />
                            <AnalyticsTracker />
                            <Suspense fallback={<PageLoader />}>
                              <Routes>
                                {/* Seller panel — full-screen, no Navbar/Footer */}
                                <Route path="/seller" element={<SellerLayout />}>
                                  <Route element={<SellerSuspense />}>
                                    <Route path="dashboard" element={<SellerDashboard />} />
                                    <Route path="inventory" element={<SellerInventoryPage />} />
                                    <Route path="store" element={<SellerStorePage />} />
                                    <Route
                                      path="store-settings"
                                      element={<SellerStoreSettingsPage />}
                                    />
                                    <Route
                                      path="store-blocks"
                                      element={<StoreBlocksEditorPage />}
                                    />
                                    <Route path="store-menu" element={<SellerMenuEditorPage />} />
                                    <Route path="coupons" element={<SellerCouponsPage />} />
                                    <Route path="orders" element={<SellerOrdersPage />} />
                                    <Route path="finance" element={<SellerFinance />} />
                                    <Route path="settings" element={<SellerSettings />} />
                                    <Route path="import" element={<SellerImportCenter />} />
                                    <Route path="pricing" element={<SellerPricing />} />
                                    <Route path="analytics" element={<SellerAnalytics />} />
                                    <Route path="certificates" element={<SellerCertificates />} />
                                    <Route path="coupons" element={<SellerCoupons />} />
                                    <Route path="performance" element={<SellerPerformance />} />
                                    <Route path="invoices" element={<SellerInvoices />} />
                                    <Route
                                      path="price-analysis"
                                      element={<SellerPriceAnalysis />}
                                    />
                                    <Route path="api-keys" element={<SellerApiKeys />} />
                                    <Route path="messages" element={<SellerMessages />} />
                                  </Route>
                                </Route>
                                {/* All other routes — with Navbar/Footer */}
                                <Route element={<MainLayout />}>
                                  <Route path="/" element={<Home />} />
                                  <Route path="/product/:slug" element={<ProductDetail />} />
                                  <Route path="/cart" element={<CartPage />} />
                                  <Route path="/campaigns" element={<Campaigns />} />
                                  <Route path="/checkout" element={<CheckoutPage />} />
                                  <Route path="/moderator" element={<ModeratorDashboard />} />
                                  <Route path="/seller/:id" element={<SellerStorePage />} />
                                  <Route path="/store/:slug" element={<SellerStorePage />} />
                                  <Route path="/search" element={<SearchResultsPage />} />
                                  <Route path="/category/:id" element={<CategoryPage />} />
                                  <Route path="/collection/:type" element={<CollectionPage />} />
                                  <Route path="/profile" element={<UserProfilePage />} />
                                  <Route
                                    path="/admin"
                                    element={
                                      <AdminRoute>
                                        <AdminDashboard />
                                      </AdminRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/categories"
                                    element={
                                      <AdminRoute requiredRole="super-admin">
                                        <AdminCategories />
                                      </AdminRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/seller/:sellerId"
                                    element={
                                      <AdminRoute requiredRole="support">
                                        <AdminSellerView />
                                      </AdminRoute>
                                    }
                                  />
                                  <Route
                                    path="/admin/compliance/deletion-requests"
                                    element={
                                      <AdminRoute requiredRole="support">
                                        <AdminDataDeletion />
                                      </AdminRoute>
                                    }
                                  />
                                  <Route path="/sell" element={<SellOnBenimOlan />} />
                                  <Route path="/sell/apply" element={<SellerApplication />} />
                                  <Route path="/wishlist" element={<Wishlist />} />
                                  <Route path="/followed-sellers" element={<FollowedSellers />} />
                                  <Route path="/price-alerts" element={<PriceAlerts />} />
                                  <Route path="/orders" element={<OrderHistory />} />
                                  <Route path="/orders/:orderId" element={<OrderTracking />} />
                                  <Route path="/support" element={<UserSupport />} />
                                  <Route path="/visual-search" element={<VisualSearch />} />
                                  <Route path="/verify" element={<ProductVerification />} />
                                  <Route path="/messages" element={<MessageCenter />} />
                                  <Route path="/about" element={<About />} />
                                  <Route path="/contact" element={<Contact />} />
                                  <Route path="/faq" element={<FAQ />} />
                                  {/* Legal pages (D-09) */}
                                  <Route path="/privacy" element={<PrivacyPolicy />} />
                                  <Route path="/terms" element={<TermsOfService />} />
                                  <Route path="/kvkk" element={<KVKKDisclosure />} />
                                  <Route path="/cookies" element={<CookiePolicy />} />
                                  <Route path="/verbis" element={<VERBISInfo />} />
                                  <Route path="*" element={<NotFound />} />
                                </Route>
                              </Routes>
                            </Suspense>
                          </Router>
                        </LocationProvider>
                      </CurrencyProvider>
                    </LanguageProvider>
                  </NotificationProvider>
                </FollowsProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </SentryErrorBoundary>
  );
}
