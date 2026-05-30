import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Navbar } from './components/layout/Navbar';
import { CartPage } from './pages/Cart';
import { WishlistPage } from './pages/Wishlist';
import { Home } from './pages/Home';
import { ProductDetail } from './pages/ProductDetail';
import { SellerDashboard } from './pages/SellerDashboard';
import { SellerInventoryPage } from './pages/SellerInventory';
import { SellerOrdersPage } from './pages/SellerOrders';
import { SellerStorePage } from './pages/SellerStore';
import { SearchResultsPage } from './pages/SearchResults';
import { UserProfilePage } from './pages/UserProfile';
import { AdminDashboard } from './pages/AdminDashboard';
import { SellOnMercora } from './pages/SellOnMercora';
import { SellerProductUpload } from './pages/SellerProductUpload';
import { ShoppingAssistant } from './components/ai/ShoppingAssistant';
import { Footer } from './components/layout/Footer';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { ScrollToTop } from './components/common/ScrollToTop';
import { BotSalesEngine } from './components/commerce/BotSalesEngine';

import { CheckoutPage } from './pages/Checkout';

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <LocationProvider>
              <Router>
                <ScrollToTop />
                <div className="relative min-h-screen transition-colors duration-300">
                  <Navbar />
                  
                  <main className="pt-[144px] md:pt-[156px]">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/product/:slug" element={<ProductDetail />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/wishlist" element={<WishlistPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/seller/dashboard" element={<SellerDashboard />} />
                      <Route path="/seller/products/new" element={<SellerProductUpload />} />
                      <Route path="/seller/inventory" element={<SellerInventoryPage />} />
                      <Route path="/seller/orders" element={<SellerOrdersPage />} />
                      <Route path="/seller/:id" element={<SellerStorePage />} />
                      <Route path="/search" element={<SearchResultsPage />} />
                      <Route path="/profile" element={<UserProfilePage />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/sell" element={<SellOnMercora />} />
                      <Route path="*" element={<Home />} />
                    </Routes>
                  </main>

                  <Footer />
                  <ShoppingAssistant />
                  <BotSalesEngine />
                </div>
              </Router>
            </LocationProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
