import React, { useState, useEffect, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Truck,
  ChevronRight,
  ShoppingCart,
  Globe,
  Heart,
  Share2,
  Info,
  Award,
  Sparkles,
  Zap,
  Shield,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  Tag,
  Copy,
  BellRing,
  Smartphone,
  Zap as ZapIcon,
  Facebook,
  Twitter,
} from 'lucide-react';
import { MOCK_PRODUCTS } from '@/data/mockProducts';
import { MOCK_SELLERS } from '@/data/mockSellers';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { useLocationStore } from '@/context/LocationContext';
import { calculateTotal, MARKETS } from '@/lib/taxEngine';
import { ProductCard } from '@/components/commerce/ProductCard';
import { SEO } from '@/components/common/SEO';
import { ProductCarousel } from '@/components/commerce/ProductCarousel';
import { getProductBySlug } from '@/services/productService';
import { Product, Campaign, Coupon, ProductVariant } from '@/types';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { ReviewSection } from '@/components/product/ReviewSection';
import { CompactRating } from '@/components/product/RatingSummary';
import { ProductGallery } from '@/components/product/ProductGallery';
import { SellerCard } from '@/components/product/SellerCard';
import { OtherSellers } from '@/components/product/OtherSellers';
import { DeliveryBox } from '@/components/product/DeliveryBox';
import { InstallmentTable } from '@/components/product/InstallmentTable';
import { StickyBuyBar } from '@/components/product/StickyBuyBar';
import { TrustBadges } from '@/components/product/TrustBadges';
import { QASection } from '@/components/product/QASection';
import { VariantSelector } from '@/components/product/VariantSelector';
import { FrequentlyBoughtTogether } from '@/components/product/FrequentlyBoughtTogether';
import { SocialProofBar } from '@/components/product/SocialProofBar';
import { UnitPrice } from '@/components/product/UnitPrice';
import { StockAlertButton } from '@/components/product/StockAlertButton';
import { PriceTrackButton } from '@/components/product/PriceTrackButton';
import { getActiveCampaigns, calcCampaignDiscount } from '@/services/campaignService';
import { getCoupons } from '@/services/couponService';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { trackPrice, untrackPrice, isTracking } from '@/services/priceTrackService';
import { useOneClickCheckout } from '@/hooks/useOneClickCheckout';
import { OneClickSuccessModal } from '@/components/checkout/OneClickSuccessModal';
import { trackEvent, getRecentViewedIds } from '@/services/behaviorService';
import { productSchema, breadcrumbSchema } from '@/components/seo/schemas';
import {
  getContentBasedRecommendations,
  getCollaborativeRecommendations,
} from '@/services/recommendationService';
import { ARViewer } from '@/components/commerce/ARViewer';
import { AuthenticityBadge } from '@/components/commerce/AuthenticityBadge';
import { ProductDetailSkeleton } from '@/components/ui/Skeleton';
import { PriceHistoryChart } from '@/components/product/PriceHistoryChart';
import { ComparisonBar } from '@/components/commerce/ComparisonBar';
import { ComparisonModal } from '@/components/commerce/ComparisonModal';
import { useComparison } from '@/hooks/useComparison';

const AIProductInsights = React.lazy(() =>
  import('@/components/product/AIProductInsights').then((m) => ({ default: m.AIProductInsights })),
);

const POPULAR_SEARCHES_BY_LANG: Record<string, string[]> = {
  tr: [
    'Akıllı Saat',
    'Kablosuz Kulaklık',
    'Robot Süpürge',
    'Oyuncu Bilgisayarı',
    'Deri Ceket',
    'Kahve Makinesi',
    'Güneş Gözlüğü',
    'Bluetooth Hoparlör',
  ],
  en: [
    'Smart Watch',
    'Wireless Earbuds',
    'Robot Vacuum',
    'Gaming Laptop',
    'Leather Jacket',
    'Coffee Maker',
    'Sunglasses',
    'Bluetooth Speaker',
  ],
  de: [
    'Smartwatch',
    'Kabellose Kopfhörer',
    'Saugroboter',
    'Gaming-Laptop',
    'Lederjacke',
    'Kaffeemaschine',
    'Sonnenbrille',
    'Bluetooth-Lautsprecher',
  ],
  ar: [
    'ساعة ذكية',
    'سماعات لاسلكية',
    'مكنسة روبوت',
    'كمبيوتر ألعاب',
    'سترة جلدية',
    'آلة صنع القهوة',
    'نظارات شمسية',
    'مكبر صوت بلوتوث',
  ],
};

export function ProductDetail() {
  const { t, lang } = useLanguage();
  const { selectedLocation, setIsLocationModalOpen, location } = useLocationStore();
  const { user, firebaseUser } = useAuth();
  const { addItem } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews' | 'qa'>('details');
  const [viewers, setViewers] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCoupons, setActiveCoupons] = useState<Coupon[]>([]);
  const [tracking, setTracking] = useState(false);
  const [trackLoading, setTrackLoading] = useState(false);
  const {
    canOneClick,
    runOneClick,
    loading: oneClickLoading,
    error: oneClickError,
    successOrder,
    clearSuccess,
  } = useOneClickCheckout();
  const [recSimilar, setRecSimilar] = useState<Product[]>([]);
  const [recAlsoBought, setRecAlsoBought] = useState<Product[]>([]);
  const [arOpen, setArOpen] = useState(false);
  const [recentViewed, setRecentViewed] = useState<Product[]>([]);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [isFollowingSeller, setIsFollowingSeller] = useState(false);
  const {
    addItem: addToComparison,
    removeItem: removeFromComparison,
    isAdded: isAddedToComparison,
  } = useComparison();

  useEffect(() => {
    const STICKY_THRESHOLD = 600;
    const onScroll = () => setShowStickyBar(window.scrollY > STICKY_THRESHOLD);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!product?.id) return;
    // Initial random viewer count + periodic refresh every 15s
    setViewers(Math.floor(Math.random() * 14) + 2);
    const interval = setInterval(() => {
      setViewers(Math.floor(Math.random() * 14) + 2);
    }, 15_000);
    return () => clearInterval(interval);
  }, [product?.id]);

  useEffect(() => {
    if (!product?.id) return;

    // 1. Firebase tracking (authenticated user)
    if (firebaseUser?.uid) {
      trackEvent(firebaseUser.uid, {
        type: 'view',
        productId: product.id,
        timestamp: new Date().toISOString(),
      });
    }

    // 2. localStorage tracking (both guest & logged-in user fallback)
    try {
      const localKey = 'mercora_recently_viewed_local';
      const existing = localStorage.getItem(localKey);
      let list: string[] = existing ? JSON.parse(existing) : [];
      list = [product.id, ...list.filter((id) => id !== product.id)].slice(0, 10);
      localStorage.setItem(localKey, JSON.stringify(list));
    } catch (err) {
      console.error('Error tracking recently viewed locally:', err);
    }
  }, [firebaseUser?.uid, product?.id]);

  useEffect(() => {
    async function loadRecentViewed() {
      if (!product?.id) return;
      let viewedIds: string[] = [];

      if (firebaseUser?.uid) {
        viewedIds = await getRecentViewedIds(firebaseUser.uid, 12);
      }

      // Fallback or guest user: read from localStorage
      if (viewedIds.length === 0) {
        try {
          const localKey = 'mercora_recently_viewed_local';
          const existing = localStorage.getItem(localKey);
          viewedIds = existing ? JSON.parse(existing) : [];
        } catch {
          viewedIds = [];
        }
      }

      // Filter out current product id
      const filteredIds = viewedIds.filter((id) => id !== product.id);

      // Map to MOCK_PRODUCTS
      const products = filteredIds
        .map((id) => MOCK_PRODUCTS.find((p) => p.id === id))
        .filter((p): p is Product => !!p);

      setRecentViewed(products.slice(0, 8));
    }

    loadRecentViewed();
  }, [product?.id, firebaseUser?.uid]);

  useEffect(() => {
    if (!firebaseUser || !product?.id) return;
    isTracking(firebaseUser.uid, product.id)
      .then(setTracking)
      .catch(() => {});
  }, [firebaseUser, product]);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setLoading(true);
      const data = await getProductBySlug(slug);
      setProduct(data);
      setLoading(false);
    }
    loadProduct();
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    getActiveCampaigns().then((all) => {
      const relevant = all.filter(
        (c) =>
          c.targetType === 'all_products' ||
          (c.targetType === 'category' && c.targetValue === product.categoryId) ||
          (c.targetType === 'brand' && c.targetValue === product.brand),
      );
      setCampaigns(relevant);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.categoryId, product?.brand]);

  useEffect(() => {
    getCoupons().then((all) => {
      const valid = all.filter(
        (c) =>
          c.isActive &&
          (!c.expiresAt || new Date(c.expiresAt) > new Date()) &&
          (!c.maxUses || c.usedCount < c.maxUses),
      );
      setActiveCoupons(valid.slice(0, 3));
    });
  }, []);

  useEffect(() => {
    if (!product?.id) return;
    getContentBasedRecommendations(product, 10).then(setRecSimilar);
    getCollaborativeRecommendations(product.id, 6).then(setRecAlsoBought);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  async function handleTrackPrice() {
    if (!firebaseUser || !product) return; // silently ignore — UI should guide user to login
    setTrackLoading(true);
    try {
      if (tracking) {
        await untrackPrice(firebaseUser.uid, product.id);
        setTracking(false);
      } else {
        await trackPrice(firebaseUser.uid, product.id, product.price);
        setTracking(true);
      }
    } finally {
      setTrackLoading(false);
    }
  }

  const handleBuyNow = () => {
    if (!product || !canOneClick) return;
    const hasVariants =
      (product.variantAttributes?.length ?? 0) > 0 && (product.variants?.length ?? 0) > 0;
    const selectedVariant: ProductVariant | undefined = hasVariants
      ? product.variants!.find((v) =>
          product.variantAttributes!.every((attr) => v.attributes[attr] === selectedAttrs[attr]),
        )
      : undefined;
    runOneClick(
      [{ productId: product.id, variantId: selectedVariant?.id, quantity }],
      product.currency ?? user?.currency ?? 'gbp',
    );
  };

  const memoizedSpecs = React.useMemo(
    () => product?.specifications ?? {},
    [product?.specifications],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f4f7] dark:bg-zinc-950 transition-colors duration-300">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (!product)
    return (
      <div className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle size={48} className="text-red-500 mb-6" />
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-brand-primary">
          Artifact Not Found
        </h2>
        <p className="text-brand-primary/40 text-xs font-bold uppercase tracking-widest mt-4">
          The requested data node does not exist in the master matrix.
        </p>
        <Link
          to="/"
          className="mt-10 px-8 py-3 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
        >
          Master Feed
        </Link>
      </div>
    );

  const cartDiscount = product
    ? calcCampaignDiscount(campaigns, product.price, product.categoryId, product.brand)
    : 0;
  const cartPrice = product ? product.price - cartDiscount : 0;

  // Recommendations logic
  const relatedProducts = MOCK_PRODUCTS.filter((p) => product.relatedProductIds?.includes(p.id));
  const boughtTogether = MOCK_PRODUCTS.filter((p) =>
    product.frequentlyBoughtTogetherIds?.includes(p.id),
  );
  const sellerProducts = MOCK_PRODUCTS.filter(
    (p) => p.sellerId === product.sellerId && p.id !== product.id,
  );
  const categoriesProducts = MOCK_PRODUCTS.filter(
    (p) => p.categoryId === product.categoryId && p.id !== product.id,
  ).slice(0, 10);

  const currentMarket = MARKETS[location.market] ?? MARKETS['UK'];
  const tax = calculateTotal(product.price, 12, currentMarket, product.originCountry === 'UK');

  const scrollToReviews = () => {
    setActiveTab('reviews');
    document.querySelector('[data-tab-panel]')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-white dark:bg-zinc-950 min-h-screen pb-20 transition-colors duration-300">
      <SEO
        title={product.title}
        description={product.description}
        image={product.images[0]}
        type="product"
        lang={lang}
        jsonLd={[
          productSchema({
            name: product.title,
            description: product.description,
            image: product.images,
            sku: product.id,
            brand: product.brand || undefined,
            price: product.price,
            currency: product.currency ?? 'TRY',
            availability: product.stock > 0 ? 'InStock' : 'OutOfStock',
            ratingValue: product.rating || undefined,
            reviewCount: product.reviewsCount || undefined,
            url: `/product/${product.slug}`,
          }),
          breadcrumbSchema([
            { name: 'Ana Sayfa', url: '/' },
            { name: product.categoryId, url: `/search?category=${product.categoryId}` },
            { name: product.title, url: `/product/${product.slug}` },
          ]),
        ]}
      />
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-[11px] font-bold text-brand-primary/40 uppercase tracking-wider py-6 overflow-hidden whitespace-nowrap">
          <Link to="/" className="hover:text-accent transition-colors">
            Ana Sayfa
          </Link>
          <ChevronRight size={10} />
          <Link
            to={`/search?category=${product.categoryId}`}
            className="hover:text-accent transition-colors uppercase"
          >
            {product.categoryId}
          </Link>
          <ChevronRight size={10} />
          <span className="text-brand-primary truncate">{product.title}</span>
        </nav>

        {/* Main Product Stage: 2-Column Layout (60% Gallery / 40% Sidebar) */}
        <div className="max-w-[1060px]">
          <div className="grid lg:grid-cols-[460px_1fr] gap-6 mb-8 items-start overflow-hidden">
            {/* LEFT: Gallery */}
            <div>
              <ProductGallery
                images={product.images}
                title={product.title}
                extraActions={
                  <>
                    {product.model3dUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setArOpen(true);
                        }}
                        className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 shadow-xl rounded-full text-white hover:from-purple-400 hover:to-blue-400 transition-all border border-white/20"
                        title="3D / AR ile görüntüle"
                        aria-label="3D/AR ile görüntüle"
                      >
                        <Smartphone size={20} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      aria-label={
                        isWishlisted(product.id) ? 'Favorilerden çıkar' : 'Favorilere ekle'
                      }
                      className={cn(
                        'p-3 bg-white/80 backdrop-blur shadow-xl rounded-full transition-all border border-brand-primary/5',
                        isWishlisted(product.id)
                          ? 'text-red-500 bg-white'
                          : 'text-brand-primary/40 hover:text-accent hover:bg-white',
                      )}
                    >
                      <Heart size={20} fill={isWishlisted(product.id) ? 'currentColor' : 'none'} />
                    </button>
                    <div className="relative group" onClick={(e) => e.stopPropagation()}>
                      <button
                        aria-label="Paylaş"
                        className="p-3 bg-white/80 backdrop-blur shadow-xl rounded-full text-brand-primary/40 hover:text-accent hover:bg-white transition-all border border-brand-primary/5"
                      >
                        <Share2 size={20} />
                      </button>
                      <div className="absolute end-full top-0 me-3 flex items-center gap-2 opacity-0 -translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto transition-all duration-300">
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Facebook'ta paylaş"
                          className="p-3 bg-white/90 backdrop-blur shadow-lg rounded-full text-[#1877F2] hover:scale-110 transition-transform"
                        >
                          <Facebook size={18} />
                        </a>
                        <a
                          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Twitter'da paylaş"
                          className="p-3 bg-white/90 backdrop-blur shadow-lg rounded-full text-[#1DA1F2] hover:scale-110 transition-transform"
                        >
                          <Twitter size={18} />
                        </a>
                        <a
                          href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(product.images[0])}&description=${encodeURIComponent(product.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Pinterest'te paylaş"
                          className="p-3 bg-white/90 backdrop-blur shadow-lg rounded-full text-[#E60023] hover:scale-110 transition-transform"
                        >
                          <span className="font-extrabold text-sm" style={{ fontFamily: 'serif' }}>
                            P
                          </span>
                        </a>
                      </div>
                    </div>
                  </>
                }
              />
            </div>

            {/* RIGHT: Product Info Sidebar */}
            <div className="divide-y divide-gray-100">
              {/* Product Info */}
              <div className="pb-4 space-y-3.5">
                {/* Brand & Badges */}
                <div className="space-y-3">
                  <Link
                    to={`/seller/${product.sellerId}`}
                    className="text-accent text-xs font-black uppercase tracking-widest hover:underline decoration-2"
                  >
                    {product.brand}
                  </Link>
                  {(product.bestSeller ||
                    product.isFlashDeal ||
                    product.promoBadge ||
                    product.newArrival ||
                    (product.discountPercentage ?? 0) > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {product.isFlashDeal && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-[9px] font-black uppercase rounded-lg">
                          <Zap size={9} /> Flaş İndirim
                        </span>
                      )}
                      {product.bestSeller && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500 text-white text-[9px] font-black uppercase rounded-lg">
                          <TrendingUp size={9} /> En Çok Satan
                        </span>
                      )}
                      {product.newArrival && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-[9px] font-black uppercase rounded-lg">
                          <Sparkles size={9} /> Yeni
                        </span>
                      )}
                      {product.promoBadge && (
                        <span className="px-2 py-1 bg-purple-500 text-white text-[9px] font-black uppercase rounded-lg">
                          {product.promoBadge}
                        </span>
                      )}
                      {(product.discountPercentage ?? 0) > 0 && (
                        <span className="px-2 py-1 bg-[#1A1033] text-white text-[9px] font-black rounded-lg">
                          %{product.discountPercentage}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-xl md:text-2xl font-display font-black tracking-tight text-brand-primary leading-[1.2]">
                  {product.title}
                </h1>

                {/* Rating & Reviews */}
                <div className="flex items-center gap-4 pb-4 border-b border-brand-primary/5">
                  <CompactRating
                    rating={product.rating}
                    reviewsCount={product.reviewsCount || 0}
                    onScrollToReviews={scrollToReviews}
                  />
                </div>

                {/* Price Section */}
                <div className="space-y-2">
                  <div>
                    {product.oldPrice && (
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-base text-gray-400 line-through">
                          £{product.oldPrice.toFixed(2)}
                        </span>
                        {product.discountPercentage && product.discountPercentage > 0 && (
                          <span className="px-1.5 py-0.5 bg-[#FF6000] text-white text-[10px] font-bold rounded">
                            %{product.discountPercentage}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-[28px] font-bold text-[#1A1033] tracking-tight">
                        £{Math.floor(product.price)}
                      </span>
                      <span className="text-lg font-bold text-[#1A1033]">
                        ,
                        {Math.floor((product.price % 1) * 100)
                          .toString()
                          .padStart(2, '0')}
                      </span>
                    </div>
                    {product.unitLabel && product.unitAmount && (
                      <UnitPrice
                        price={cartPrice}
                        unitAmount={product.unitAmount}
                        unitLabel={product.unitLabel}
                        currency={product.currency ?? 'gbp'}
                      />
                    )}
                    <p className="text-[10px] font-black uppercase text-green-600 tracking-widest flex items-center gap-1.5 mt-2">
                      <Truck size={11} className="text-green-500" /> {t('badge.free_shipping')}
                    </p>
                    <SocialProofBar
                      favoriteCount={product.favoriteCount}
                      cartAddCount={product.cartAddCount}
                      viewerCount={viewers}
                      bestSellerRank={product.bestSeller ? 1 : undefined}
                      reviewCount={product.reviewsCount}
                    />
                  </div>

                  {/* Stock Status */}
                  {product.stock !== undefined && product.stock > 0 && product.stock <= 10 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-100">
                      <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
                      <p className="text-xs font-black text-red-600">
                        Son <span className="text-red-700">{product.stock}</span> adet kaldı!
                      </p>
                    </div>
                  )}
                </div>

                {/* Price Tracking */}
                <PriceTrackButton
                  productId={product.id}
                  currentPrice={cartPrice}
                  userId={firebaseUser?.uid}
                />

                {/* Authent Badge */}
                <div className="pt-2 border-t border-brand-primary/5">
                  <AuthenticityBadge
                    productId={product.id}
                    productTitle={product.title}
                    productImage={product.images[0]}
                    sellerId={product.sellerId}
                    brand={product.brand}
                    originCountry={product.originCountry}
                    compact
                  />
                </div>
              </div>

              {/* Price History Chart */}
              <PriceHistoryChart
                productId={product.id}
                currentPrice={cartPrice}
                currency={product.currency ?? 'try'}
              />

              {/* Seller Card */}
              <SellerCard
                sellerId={product.sellerId}
                sellerName={
                  MOCK_SELLERS.find((s) => s.id === product.sellerId)?.storeName ||
                  product.brand ||
                  'Mağaza'
                }
                sellerRating={
                  MOCK_SELLERS.find((s) => s.id === product.sellerId)?.rating ?? product.rating
                }
                sellerReviewCount={
                  MOCK_SELLERS.find((s) => s.id === product.sellerId)?.reviewsCount ??
                  product.reviewsCount
                }
                isFollowing={isFollowingSeller}
                onToggleFollow={() => setIsFollowingSeller((f) => !f)}
                onAskQuestion={() => {
                  setActiveTab('qa');
                  document
                    .querySelector('[data-tab-panel]')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
              />

              {/* Satıcıya Sor — Messaging entry point */}
              {firebaseUser && user?.id !== product.sellerId && (
                <div className="py-3">
                  <button
                    onClick={() =>
                      navigate(
                        `/messages?sellerId=${product.sellerId}&productId=${product.id}&productTitle=${encodeURIComponent(product.title)}`,
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-accent/20 text-accent hover:bg-accent hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    <MessageSquare size={16} />
                    Satıcıya Sor
                  </button>
                </div>
              )}

              {/* Other Sellers */}
              <OtherSellers sellers={[]} />

              {/* Installment Table */}
              <InstallmentTable price={cartPrice} currency={product.currency ?? 'gbp'} />

              {/* Promotions Card */}
              {(campaigns.length > 0 || cartDiscount > 0 || activeCoupons.length > 0) && (
                <div className="py-3 space-y-3">
                  {campaigns.length > 0 && (
                    <div className="space-y-2">
                      {campaigns.slice(0, 2).map((c) => (
                        <div
                          key={c.id}
                          className="flex items-start gap-2 p-2 bg-white/60 rounded-xl"
                        >
                          <Tag size={12} className="text-orange-500 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-orange-700">{c.name}</p>
                            <p className="text-[9px] text-orange-600 font-bold">
                              {c.discountType === 'percentage'
                                ? `%${c.discountValue}`
                                : `${c.discountValue} TL`}{' '}
                              indirim
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {cartDiscount > 0 && (
                    <div className="p-2 bg-white/60 rounded-xl border border-green-100">
                      <p className="text-[9px] font-black text-green-700 uppercase">
                        £{cartDiscount.toFixed(2)} tasarruf
                      </p>
                    </div>
                  )}
                  {activeCoupons.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black uppercase text-orange-600 mb-2">
                        Kupon Kodu
                      </p>
                      <button
                        onClick={() => navigator.clipboard.writeText(activeCoupons[0].code)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 border-2 border-dashed border-orange-300 rounded-lg hover:border-accent hover:bg-accent/5 transition-all group text-start"
                      >
                        <span className="text-xs font-black text-orange-700">
                          {activeCoupons[0].code}
                        </span>
                        <Copy
                          size={10}
                          className="text-orange-400 ms-auto group-hover:text-accent transition-colors"
                        />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Variants Card */}
              {product.variantAttributes &&
                product.variantAttributes.length > 0 &&
                product.variants &&
                product.variants.length > 0 && (
                  <VariantSelector
                    variants={product.variants}
                    variantAttributes={product.variantAttributes}
                    selectedAttrs={selectedAttrs}
                    onVariantChange={(attr, value) =>
                      setSelectedAttrs((prev) => ({ ...prev, [attr]: value }))
                    }
                  />
                )}

              {/* Add to Cart & CTAs */}
              <div className="space-y-4">
                {/* Quantity & CTAs */}
                {(() => {
                  const hasVariants =
                    (product.variantAttributes?.length ?? 0) > 0 &&
                    (product.variants?.length ?? 0) > 0;
                  const selectedVariant: ProductVariant | undefined = hasVariants
                    ? product.variants!.find((v) =>
                        product.variantAttributes!.every(
                          (attr) => v.attributes[attr] === selectedAttrs[attr],
                        ),
                      )
                    : undefined;
                  const allSelected =
                    !hasVariants || product.variantAttributes!.every((attr) => selectedAttrs[attr]);
                  const canAdd = allSelected && (!hasVariants || !!selectedVariant);
                  return (
                    <div className="space-y-2.5">
                      <div className="py-4 space-y-2.5">
                        {/* Quantity selector — inline, compact */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-gray-400">
                            Adet
                          </span>
                          <div className="flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              className="w-9 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 font-bold text-sm"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-bold text-sm text-gray-700">
                              {quantity}
                            </span>
                            <button
                              onClick={() => setQuantity(quantity + 1)}
                              className="w-9 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 font-bold text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        {/* Sepete Ekle — full width, orange like Trendyol */}
                        <button
                          onClick={() =>
                            canAdd && addItem(product.id, quantity, selectedVariant?.id)
                          }
                          disabled={!canAdd}
                          className={cn(
                            'w-full h-12 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2',
                            canAdd
                              ? 'bg-[#FF6000] hover:bg-[#E55500] active:scale-[0.98]'
                              : 'bg-gray-300 cursor-not-allowed',
                          )}
                        >
                          <ShoppingCart size={18} />
                          {hasVariants && !allSelected ? 'Seçenek Seçin' : 'Sepete Ekle'}
                        </button>

                        {/* Hemen Al — full width yellow */}
                        {user && (
                          <>
                            {canOneClick ? (
                              <button
                                onClick={handleBuyNow}
                                disabled={oneClickLoading || !canAdd}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-[#FFD814] hover:bg-[#F7CA00] disabled:opacity-50 text-black font-bold text-sm rounded-lg transition-colors active:scale-[0.98]"
                              >
                                <ZapIcon size={16} />
                                {oneClickLoading ? 'İşleniyor...' : 'Hemen Al'}
                              </button>
                            ) : (
                              <button
                                onClick={() => navigate('/profile?tab=payment')}
                                className="w-full text-[10px] text-gray-400 underline py-2 hover:text-[#FF6000] font-bold"
                              >
                                Tek tıkla ödeme ayarı →
                              </button>
                            )}
                            {oneClickError && (
                              <p className="text-xs text-red-500 text-center">{oneClickError}</p>
                            )}
                          </>
                        )}

                        {/* Price Tracking */}
                        {firebaseUser && (
                          <button
                            onClick={handleTrackPrice}
                            disabled={trackLoading}
                            className={cn(
                              'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50',
                              tracking
                                ? 'bg-accent/10 text-accent border border-accent/30'
                                : 'bg-brand-secondary/30 text-brand-primary/40 hover:text-accent border border-transparent',
                            )}
                          >
                            <BellRing size={13} fill={tracking ? 'currentColor' : 'none'} />
                            {tracking ? 'Fiyat Takibinde' : 'Fiyat Takibi'}
                          </button>
                        )}

                        {/* Stock Alert */}
                        <StockAlertButton
                          productId={product.id}
                          stock={product.stock ?? 0}
                          userId={firebaseUser?.uid}
                        />
                      </div>

                      {successOrder && (
                        <OneClickSuccessModal
                          orderId={successOrder.orderId}
                          total={successOrder.total}
                          currency={successOrder.currency}
                          onClose={clearSuccess}
                        />
                      )}
                    </div>
                  );
                })()}

                {/* Trust Badges */}
                <TrustBadges />

                {/* Delivery & Trust */}
                <DeliveryBox
                  locationLabel={selectedLocation}
                  onChangeLocation={() => setIsLocationModalOpen(true)}
                  hasExpressShipping={product.isFlashDeal}
                  freeShipping={product.freeShipping}
                />
              </div>
            </div>
          </div>
        </div>
        {/* end max-w-[1060px] */}

        {/* Frequently Bought Together */}
        <FrequentlyBoughtTogether product={product} boughtTogether={boughtTogether} />

        {/* Tabbed Detailed View */}
        <div data-tab-panel className="border-t border-gray-100 mb-8">
          <div className="flex border-b border-brand-primary/5 overflow-x-auto no-scrollbar">
            {[
              { id: 'details', label: t('product.description') },
              { id: 'specs', label: t('product.specifications') },
              { id: 'reviews', label: t('product.reviews') },
              { id: 'qa', label: t('product.questions_answers') },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'px-4 md:px-8 py-4 md:py-6 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all relative shrink-0',
                  activeTab === tab.id
                    ? 'text-accent'
                    : 'text-brand-primary/30 hover:text-brand-primary',
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 start-0 end-0 h-1 bg-accent"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="p-4 md:p-8 lg:p-12">
            <AnimatePresence mode="wait">
              {activeTab === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="prose prose-zinc dark:prose-invert max-w-none"
                >
                  <h2 className="text-2xl font-display font-black text-brand-primary uppercase italic mb-6">
                    Artifact Intelligence
                  </h2>
                  <div className="text-brand-primary/70 leading-relaxed font-medium whitespace-pre-wrap">
                    {product.longDescription || product.description}
                  </div>
                  <Suspense
                    fallback={
                      <div className="h-32 bg-brand-secondary/50 dark:bg-zinc-800/50 rounded-2xl animate-pulse" />
                    }
                  >
                    <AIProductInsights
                      productTitle={product.title}
                      description={product.description ?? ''}
                      specs={memoizedSpecs}
                    />
                  </Suspense>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                    {[
                      { label: 'Origin', value: product.originCountry, icon: Globe },
                      { label: 'Merchant', value: product.brand, icon: Award },
                      { label: 'Protection', value: 'Escrow', icon: Shield },
                      { label: 'Express', value: 'Priority', icon: Zap },
                    ].map((f, i) => (
                      <div
                        key={i}
                        className="p-6 bg-brand-secondary/30 rounded-3xl border border-brand-primary/5 text-center group hover:bg-white hover:shadow-xl transition-all"
                      >
                        <f.icon size={24} className="text-accent mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase text-brand-primary/40 tracking-widest">
                          {f.label}
                        </p>
                        <p className="text-xs font-black text-brand-primary uppercase mt-1">
                          {f.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'specs' && (
                <motion.div
                  key="specs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-2xl font-display font-black text-brand-primary uppercase italic mb-8">
                    Technical Mapping
                  </h2>
                  <div className="grid grid-cols-1 border border-brand-primary/5 rounded-3xl overflow-hidden shadow-sm">
                    {product.specifications ? (
                      Object.entries(product.specifications).map(([key, val], i) => (
                        <div
                          key={key}
                          className={cn(
                            'grid grid-cols-2 p-6 transition-colors',
                            i % 2 === 0 ? 'bg-brand-secondary/20' : 'bg-white',
                          )}
                        >
                          <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary/40">
                            {key}
                          </span>
                          <span className="text-sm font-black text-brand-primary uppercase italic">
                            {val as string}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center text-brand-primary/20 italic">
                        No structured data for this artifact.
                      </div>
                    )}
                    <div className="grid grid-cols-2 p-6 bg-brand-primary text-white">
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
                        Global HS-CODE
                      </span>
                      <span className="text-sm font-black uppercase italic">
                        {product.hsCode || '85.43.00.00'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ReviewSection
                    productId={product.id}
                    sellerId={product.sellerId}
                    productRating={product.rating}
                    currentUserId={firebaseUser?.uid}
                    currentUserName={user?.name || firebaseUser?.displayName || undefined}
                    isSeller={user?.id === product.sellerId || user?.role === 'admin'}
                    isLoggedIn={!!firebaseUser}
                  />
                </motion.div>
              )}

              {activeTab === 'qa' && (
                <motion.div
                  key="qa"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <QASection
                    productId={product.id}
                    currentUserId={firebaseUser?.uid}
                    currentUserName={user?.name || firebaseUser?.displayName || undefined}
                    isSeller={user?.id === product.sellerId || user?.role === 'admin'}
                    isLoggedIn={!!firebaseUser}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Recommendations Blocks */}
        <div className="divide-y divide-brand-primary/5 dark:divide-white/5 mb-12">
          {/* Row 1: Bunlar da İlgini Çekebilir */}
          {(recSimilar.length > 0 || relatedProducts.length > 0) && (
            <div className="py-5">
              <ProductCarousel
                title={t('product.rec.interest.title')}
                subtext={t('product.rec.interest.sub')}
                products={recSimilar.length > 0 ? recSimilar : relatedProducts}
              />
            </div>
          )}

          {/* Row 2: Buna Bakanların Aldıkları */}
          {recAlsoBought.length > 0 && (
            <div className="py-5">
              <ProductCarousel
                title={t('product.rec.bakanAldi.title')}
                subtext={t('product.rec.bakanAldi.sub')}
                products={recAlsoBought}
              />
            </div>
          )}

          {/* Row 3: Birlikte Alınanlar */}
          {boughtTogether.length > 0 && (
            <div className="py-5">
              <ProductCarousel
                title={t('product.rec.birlikte.title')}
                subtext={t('product.rec.birlikte.sub')}
                products={boughtTogether}
              />
            </div>
          )}

          {/* Row 4: Herkes Bunlara Bakıyor */}
          {categoriesProducts.length > 0 && (
            <div className="py-5">
              <ProductCarousel
                title={t('product.rec.populer.title')}
                subtext={t('product.rec.populer.sub')}
                products={categoriesProducts}
              />
            </div>
          )}

          {/* Row 5: Popüler Ürünlerden Seçtik */}
          <div className="py-5">
            <ProductCarousel
              title={t('product.rec.secilmis.title')}
              subtext={t('product.rec.secilmis.sub')}
              products={MOCK_PRODUCTS.filter((p) => p.featured && p.id !== product.id).slice(0, 10)}
            />
          </div>

          {/* Popular Searches badge grid */}
          <div className="py-6">
            <h4 className="text-sm font-black uppercase tracking-wider text-brand-primary dark:text-white mb-4">
              {t('product.rec.searches.title')}
            </h4>
            <div className="flex flex-wrap gap-2.5">
              {(POPULAR_SEARCHES_BY_LANG[lang] || POPULAR_SEARCHES_BY_LANG['en']).map((tag) => (
                <Link
                  key={tag}
                  to={`/search?q=${encodeURIComponent(tag)}`}
                  className="px-4 py-2 bg-brand-secondary/50 dark:bg-zinc-800 text-brand-primary/80 dark:text-zinc-300 hover:text-white hover:bg-accent rounded-xl text-xs font-black transition-all border border-brand-primary/5 dark:border-white/5 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Buy Bar */}
      <StickyBuyBar
        product={product}
        selectedAttrs={selectedAttrs}
        onVariantChange={(attr, value) => setSelectedAttrs((prev) => ({ ...prev, [attr]: value }))}
        visible={showStickyBar}
        quantity={quantity}
        price={cartPrice}
        currency={product.currency ?? 'gbp'}
        onAddToCart={(variantId) => addItem(product.id, quantity, variantId)}
        onBuyNow={canOneClick ? handleBuyNow : undefined}
        oneClickLoading={oneClickLoading}
        onQuantityChange={setQuantity}
        isFavorited={isWishlisted(product.id)}
        onToggleFavorite={() => toggleWishlist(product.id)}
      />

      {/* AR Viewer Modal */}
      {product.model3dUrl && (
        <ARViewer
          modelUrl={product.model3dUrl}
          productTitle={product.title}
          open={arOpen}
          onClose={() => setArOpen(false)}
        />
      )}

      {/* Comparison */}
      <ComparisonBar onOpen={() => setComparisonOpen(true)} />
      <ComparisonModal isOpen={comparisonOpen} onClose={() => setComparisonOpen(false)} />
    </div>
  );
}
