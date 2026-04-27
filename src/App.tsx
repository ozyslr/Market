import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { CartPage } from './pages/Cart';
import { Home } from './pages/Home';
import { ProductDetail } from './pages/ProductDetail';
import { SellerDashboard } from './pages/SellerDashboard';
import { SellerInventoryPage } from './pages/SellerInventory';
import { SellerOrdersPage } from './pages/SellerOrders';
import { SellerStorePage } from './pages/SellerStore';
import { SearchResultsPage } from './pages/SearchResults';
import { UserProfilePage } from './pages/UserProfile';
import { ShoppingAssistant } from './components/ai/ShoppingAssistant';
import { Footer } from './components/layout/Footer';
import { LanguageProvider } from './context/LanguageContext';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { CheckoutPage } from './pages/Checkout';
import { OrdersPage } from './pages/Orders';
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdminPanel } from '@/pages/Admin';
import WishlistPage from '@/pages/Wishlist';
import ComparePage from '@/pages/Compare';
import { CompareBar } from '@/components/commerce/CompareBar';
import { ToastContainer } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ScrollToTop } from './components/ui/ScrollToTop';
import { HelmetProvider } from 'react-helmet-async';

export default function App() {
  return (
    <HelmetProvider>
    <LanguageProvider>
      <Router>
        <ErrorBoundary>
          <div className="relative min-h-screen">
            <ScrollToTop />
            <Navbar />

            <main className="pt-36">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={
                  <ProtectedRoute><CheckoutPage /></ProtectedRoute>
                } />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={
                  <ProtectedRoute><UserProfilePage /></ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute><OrdersPage /></ProtectedRoute>
                } />
                <Route path="/seller/dashboard" element={
                  <ProtectedRoute requiredRole="seller"><SellerDashboard /></ProtectedRoute>
                } />
                <Route path="/seller/inventory" element={
                  <ProtectedRoute requiredRole="seller"><SellerInventoryPage /></ProtectedRoute>
                } />
                <Route path="/seller/orders" element={
                  <ProtectedRoute requiredRole="seller"><SellerOrdersPage /></ProtectedRoute>
                } />
                <Route path="/seller/:id" element={<SellerStorePage />} />
                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>
                } />
                <Route path="*" element={<Home />} />
              </Routes>
            </main>

            <Footer />
            <ShoppingAssistant />
            <CompareBar />
            <ToastContainer />
          </div>
        </ErrorBoundary>
      </Router>
    </LanguageProvider>
    </HelmetProvider>
  );
}
