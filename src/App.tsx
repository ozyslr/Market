import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Navbar } from './components/layout/Navbar';
import SellerLayout from './components/layout/SellerLayout';
import { CartPage } from './pages/Cart';
import { Home } from './pages/Home';
import { ProductDetail } from './pages/ProductDetail';
import { SellerDashboard } from './pages/SellerDashboard';
import { SellerInventoryPage } from './pages/SellerInventory';
import { SellerOrdersPage } from './pages/SellerOrders';
import { SellerStorePage } from './pages/SellerStore';
import { SearchResultsPage } from './pages/SearchResults';
import { CategoryPage } from './pages/CategoryPage';
import { UserProfilePage } from './pages/UserProfile';
import { AdminDashboard } from './pages/AdminDashboard';
import { SellOnMercora } from './pages/SellOnMercora';
import { ShoppingAssistant } from './components/ai/ShoppingAssistant';
import { Footer } from './components/layout/Footer';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LocationProvider } from './context/LocationContext';
import { ScrollToTop } from './components/common/ScrollToTop';
import { BotSalesEngine } from './components/commerce/BotSalesEngine';

import { CheckoutPage } from './pages/Checkout';
import { Wishlist } from './pages/Wishlist';
import { OrderTracking } from './pages/OrderTracking';
import { NotFound } from './pages/NotFound';
import { WishlistProvider } from './context/WishlistContext';
import { FollowsProvider } from './context/FollowsContext';
import { NotificationProvider } from './context/NotificationContext';
import { SellerSettings } from './pages/SellerSettings';
import { SellerFinance } from './pages/SellerFinance';
import { ModeratorDashboard } from './pages/ModeratorDashboard';
import { CollectionPage } from './pages/CollectionPage';
import { AdminCategories } from './pages/AdminCategories';
import { UserSupport } from './pages/UserSupport';

function MainLayout() {
  return (
    <div className="relative min-h-screen transition-colors duration-300">
      <Navbar />
      <main className="pt-[144px] md:pt-[156px]">
        <Outlet />
      </main>
      <Footer />
      <ShoppingAssistant />
      <BotSalesEngine />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
          <WishlistProvider>
          <FollowsProvider>
          <NotificationProvider>
          <LanguageProvider>
            <LocationProvider>
              <Router>
                <ScrollToTop />
                <Routes>
                  {/* Seller panel — full-screen, no Navbar/Footer */}
                  <Route path="/seller" element={<SellerLayout />}>
                    <Route path="dashboard" element={<SellerDashboard />} />
                    <Route path="inventory" element={<SellerInventoryPage />} />
                    <Route path="orders" element={<SellerOrdersPage />} />
                    <Route path="finance" element={<SellerFinance />} />
                    <Route path="settings" element={<SellerSettings />} />
                  </Route>
                  {/* All other routes — with Navbar/Footer */}
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/product/:slug" element={<ProductDetail />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/moderator" element={<ModeratorDashboard />} />
                    <Route path="/seller/:id" element={<SellerStorePage />} />
                    <Route path="/search" element={<SearchResultsPage />} />
                    <Route path="/category/:id" element={<CategoryPage />} />
                    <Route path="/collection/:type" element={<CollectionPage />} />
                    <Route path="/profile" element={<UserProfilePage />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/categories" element={<AdminCategories />} />
                    <Route path="/sell" element={<SellOnMercora />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/orders/:orderId" element={<OrderTracking />} />
                    <Route path="/support" element={<UserSupport />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Router>
            </LocationProvider>
          </LanguageProvider>
          </NotificationProvider>
          </FollowsProvider>
          </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
