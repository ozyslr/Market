import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star, Truck, ShieldCheck, ChevronRight, ShoppingCart,
  Globe, Heart, Share2, Info, ChevronLeft, Award,
  Clock, Sparkles, Zap, Shield, MapPin,
  Undo2, CheckCircle2, AlertCircle,
  BarChart, Package,
  Facebook, Twitter, Navigation,
  TrendingUp, Eye, Tag, Ticket, Copy, BellRing, Smartphone,
} from 'lucide-react';
import { MOCK_PRODUCTS } from '@/mockData';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { useLocationStore } from '@/context/LocationContext';
import { calculateTotal, MARKETS } from '@/lib/taxEngine';
import { ProductCard } from '@/components/commerce/ProductCard';
import { SEO } from '@/components/common/SEO';
import { ProductCarousel } from '@/components/commerce/ProductCarousel';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { getProductBySlug } from '@/services/productService';
import { Product, Campaign, Coupon, ProductVariant } from '@/types';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { ReviewSection } from '@/components/product/ReviewSection';
import { QASection } from '@/components/product/QASection';
import { getActiveCampaigns, calcCampaignDiscount } from '@/services/campaignService';
import { getCoupons } from '@/services/couponService';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { trackPrice, untrackPrice, isTracking } from '@/services/priceTrackService';
import { trackEvent, getRecentViewedIds } from '@/services/behaviorService';
import { productSchema, breadcrumbSchema } from '@/components/seo/schemas';
import { getContentBasedRecommendations, getCollaborativeRecommendations } from '@/services/recommendationService';
import { ARViewer } from '@/components/commerce/ARViewer';
import { AuthenticityBadge } from '@/components/commerce/AuthenticityBadge';
import { ProductDetailSkeleton } from '@/components/ui/Skeleton';

// Mock data for the chart
const MARKET_DATA = [
  { day: 'Mon', demand: 65, price: 230 },
  { day: 'Tue', demand: 72, price: 245 },
  { day: 'Wed', demand: 68, price: 240 },
  { day: 'Thu', demand: 85, price: 260 },
  { day: 'Fri', demand: 92, price: 280 },
  { day: 'Sat', demand: 88, price: 275 },
  { day: 'Sun', demand: 95, price: 299 },
];

const POPULAR_SEARCHES_BY_LANG: Record<string, string[]> = {
  tr: ['Akıllı Saat', 'Kablosuz Kulaklık', 'Robot Süpürge', 'Oyuncu Bilgisayarı', 'Deri Ceket', 'Kahve Makinesi', 'Güneş Gözlüğü', 'Bluetooth Hoparlör'],
  en: ['Smart Watch', 'Wireless Earbuds', 'Robot Vacuum', 'Gaming Laptop', 'Leather Jacket', 'Coffee Maker', 'Sunglasses', 'Bluetooth Speaker'],
  de: ['Smartwatch', 'Kabellose Kopfhörer', 'Saugroboter', 'Gaming-Laptop', 'Lederjacke', 'Kaffeemaschine', 'Sonnenbrille', 'Bluetooth-Lautsprecher'],
  ar: ['ساعة ذكية', 'سماعات لاسلكية', 'مكنسة روبوت', 'كمبيوتر ألعاب', 'سترة جلدية', 'آلة صنع القهوة', 'نظارات شمسية', 'مكبر صوت بلوتوث'],
};


export function ProductDetail() {
  const { t, lang } = useLanguage();
  const { selectedLocation, setIsLocationModalOpen, location } = useLocationStore();
  const { user, firebaseUser } = useAuth();
  const { addItem } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const prevImage = () =>
    setActiveImage(i => (i - 1 + (product?.images.length ?? 1)) % (product?.images.length ?? 1));
  const nextImage = () =>
    setActiveImage(i => (i + 1) % (product?.images.length ?? 1));
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, product?.images.length]);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews' | 'qa'>('details');
  const [viewers, setViewers] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCoupons, setActiveCoupons] = useState<Coupon[]>([]);
  const [tracking, setTracking] = useState(false);
  const [trackLoading, setTrackLoading] = useState(false);
  const [recSimilar, setRecSimilar] = useState<Product[]>([]);
  const [recAlsoBought, setRecAlsoBought] = useState<Product[]>([]);
  const [arOpen, setArOpen] = useState(false);
  const [recentViewed, setRecentViewed] = useState<Product[]>([]);

  useEffect(() => {
    if (product?.id) setViewers(Math.floor(Math.random() * 14) + 2);
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
      list = [product.id, ...list.filter(id => id !== product.id)].slice(0, 10);
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
      const filteredIds = viewedIds.filter(id => id !== product.id);

      // Map to MOCK_PRODUCTS
      const products = filteredIds
        .map(id => MOCK_PRODUCTS.find(p => p.id === id))
        .filter((p): p is Product => !!p);

      setRecentViewed(products.slice(0, 8));
    }

    loadRecentViewed();
  }, [product?.id, firebaseUser?.uid]);

  useEffect(() => {
    if (!firebaseUser || !product?.id) return;
    isTracking(firebaseUser.uid, product.id).then(setTracking).catch(() => {});
  }, [firebaseUser?.uid, product?.id]);

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
    getActiveCampaigns().then(all => {
      const relevant = all.filter(c =>
        c.targetType === 'all_products' ||
        (c.targetType === 'category' && c.targetValue === product.categoryId) ||
        (c.targetType === 'brand' && c.targetValue === product.brand),
      );
      setCampaigns(relevant);
    });
  }, [product?.categoryId, product?.brand]);

  useEffect(() => {
    getCoupons().then(all => {
      const valid = all.filter(c =>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f4f7] dark:bg-zinc-950 transition-colors duration-300">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (!product) return (
    <div className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center p-12 text-center">
       <AlertCircle size={48} className="text-red-500 mb-6" />
       <h2 className="text-2xl font-black uppercase italic tracking-tighter text-brand-primary">Artifact Not Found</h2>
       <p className="text-brand-primary/40 text-xs font-bold uppercase tracking-widest mt-4">The requested data node does not exist in the master matrix.</p>
       <Link to="/" className="mt-10 px-8 py-3 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Master Feed</Link>
    </div>
  );

  const cartDiscount = product
    ? calcCampaignDiscount(campaigns, product.price, product.categoryId, product.brand)
    : 0;
  const cartPrice = product ? product.price - cartDiscount : 0;

  // Recommendations logic
  const relatedProducts = MOCK_PRODUCTS.filter(p => product.relatedProductIds?.includes(p.id));
  const boughtTogether = MOCK_PRODUCTS.filter(p => product.frequentlyBoughtTogetherIds?.includes(p.id));
  const sellerProducts = MOCK_PRODUCTS.filter(p => p.sellerId === product.sellerId && p.id !== product.id);
  const categoriesProducts = MOCK_PRODUCTS.filter(p => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 10);

  const currentMarket = MARKETS[location.market] ?? MARKETS['UK'];
  const tax = calculateTotal(product.price, 12, currentMarket, product.originCountry === 'UK');

  return (
    <div className="bg-[#f2f4f7] dark:bg-zinc-950 min-h-screen pb-20 transition-colors duration-300">
      <SEO
        title={product.title}
        description={product.description}
        image={product.images[0]}
        type="product"
        lang={lang}
        jsonLd={productSchema({
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
        })}
      />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-[11px] font-bold text-brand-primary/40 uppercase tracking-wider py-6 overflow-hidden whitespace-nowrap">
          <Link to="/" className="hover:text-accent transition-colors">Ana Sayfa</Link>
          <ChevronRight size={10} />
          <Link to={`/search?category=${product.categoryId}`} className="hover:text-accent transition-colors uppercase">{product.categoryId}</Link>
          <ChevronRight size={10} />
          <span className="text-brand-primary truncate">{product.title}</span>
        </nav>

        {/* Main Product Table/Stage */}
        <div className="grid lg:grid-cols-12 gap-8 mb-12">
          
          {/* Left: Gallery & Main Info */}
          <div className="lg:col-span-9 space-y-8">
            <div className="bg-white rounded-[2rem] border border-brand-primary/5 shadow-sm overflow-hidden p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-12">
                {/* Gallery */}
                <div className="space-y-6">
                  <div 
                    onClick={() => setIsLightboxOpen(true)}
                    className="aspect-square bg-white rounded-3xl overflow-hidden border border-brand-primary/5 p-8 relative flex items-center justify-center cursor-zoom-in group/image"
                  >
                    <motion.div
                      key={activeImage}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full h-full"
                    >
                      <OptimizedImage
                        src={product.images[activeImage]}
                        className="w-full h-full object-contain mix-blend-multiply"
                        alt={product.title}
                        containerClassName="w-full h-full"
                        lazy={false}
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                    {(product?.images.length ?? 0) > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); prevImage(); }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/80 backdrop-blur rounded-full shadow-md flex items-center justify-center hover:bg-white transition-all"
                        >
                          <ChevronLeft size={18} className="text-[#1A1033]" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); nextImage(); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/80 backdrop-blur rounded-full shadow-md flex items-center justify-center hover:bg-white transition-all"
                        >
                          <ChevronRight size={18} className="text-[#1A1033]" />
                        </button>
                      </>
                    )}
                    <div className="absolute top-6 right-6 flex flex-col gap-3">
                      {product.model3dUrl && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setArOpen(true); }}
                          className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 shadow-xl rounded-full text-white hover:from-purple-400 hover:to-blue-400 transition-all border border-white/20"
                          title="3D / AR ile görüntüle"
                        >
                          <Smartphone size={20} />
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                        className={cn(
                          "p-3 bg-white/80 backdrop-blur shadow-xl rounded-full transition-all border border-brand-primary/5",
                          isWishlisted(product.id) ? "text-red-500 bg-white" : "text-brand-primary/40 hover:text-accent hover:bg-white"
                        )}
                      >
                        <Heart size={20} fill={isWishlisted(product.id) ? "currentColor" : "none"} />
                      </button>
                      <div className="relative group" onClick={(e) => e.stopPropagation()}>
                         <button className="p-3 bg-white/80 backdrop-blur shadow-xl rounded-full text-brand-primary/40 hover:text-accent hover:bg-white transition-all border border-brand-primary/5">
                           <Share2 size={20} />
                         </button>
                         <div className="absolute right-full top-0 mr-3 flex items-center gap-2 opacity-0 -translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto transition-all duration-300">
                           <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/90 backdrop-blur shadow-lg rounded-full text-[#1877F2] hover:scale-110 transition-transform">
                              <Facebook size={18} />
                           </a>
                           <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product.title)}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/90 backdrop-blur shadow-lg rounded-full text-[#1DA1F2] hover:scale-110 transition-transform">
                              <Twitter size={18} />
                           </a>
                           <a href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(product.images[0])}&description=${encodeURIComponent(product.title)}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/90 backdrop-blur shadow-lg rounded-full text-[#E60023] hover:scale-110 transition-transform">
                              <span className="font-extrabold text-sm" style={{ fontFamily: 'serif' }}>P</span>
                           </a>
                         </div>
                      </div>
                    </div>
                  </div>
                  {(product?.images.length ?? 0) > 1 && (
                    <div className="flex gap-1.5 justify-center mb-2">
                      {product!.images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImage(i)}
                          className={cn(
                            'h-1.5 rounded-full transition-all duration-300',
                            i === activeImage ? 'bg-accent w-4' : 'bg-[#1A1033]/20 w-1.5',
                          )}
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    {product.images.map((img, i) => (
                      <button
                        key={i}
                        onMouseEnter={() => setActiveImage(i)}
                        className={cn(
                          "w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all p-1 bg-white shrink-0",
                          activeImage === i ? "border-accent shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      >
                        <OptimizedImage src={img} alt={product.title} className="w-full h-full object-contain" containerClassName="w-full h-full" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info & Price */}
                <div className="flex flex-col">
                  <div className="mb-6">
                     <Link to={`/seller/${product.sellerId}`} className="text-accent text-sm font-black uppercase tracking-widest hover:underline decoration-2">{product.brand}</Link>
                     {(product.bestSeller || product.isFlashDeal || product.promoBadge || product.newArrival || (product.discountPercentage ?? 0) > 0) && (
                       <div className="flex flex-wrap gap-2 mb-3">
                         {product.isFlashDeal && (
                           <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg">
                             <Zap size={10} /> Flaş İndirim
                           </span>
                         )}
                         {product.bestSeller && (
                           <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-500 text-white text-[10px] font-black uppercase rounded-lg">
                             <TrendingUp size={10} /> En Çok Satan
                           </span>
                         )}
                         {product.newArrival && (
                           <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white text-[10px] font-black uppercase rounded-lg">
                             <Sparkles size={10} /> Yeni
                           </span>
                         )}
                         {product.promoBadge && (
                           <span className="px-2.5 py-1 bg-purple-500 text-white text-[10px] font-black uppercase rounded-lg">
                             {product.promoBadge}
                           </span>
                         )}
                         {(product.discountPercentage ?? 0) > 0 && (
                           <span className="px-2.5 py-1 bg-[#1A1033] text-white text-[10px] font-black rounded-lg">
                             %{product.discountPercentage} İndirim
                           </span>
                         )}
                       </div>
                     )}
                     <div className="mb-3">
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
                     <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-brand-primary mt-2 leading-[1.2]">{product.title}</h1>
                     <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-1">
                           <Star size={18} fill="#FF5200" className="text-accent" />
                           <span className="text-sm font-black text-brand-primary">{product.rating}</span>
                        </div>
                        <div className="h-4 w-[1px] bg-brand-primary/10" />
                        <span className="text-sm font-bold text-brand-primary/40 underline decoration-dotted">{product.reviewsCount} {t('product.reviews')}</span>
                        <div className="h-4 w-[1px] bg-brand-primary/10" />
                        <span className="text-sm font-bold text-green-600">661 {t('product.questions_answers')}</span>
                     </div>
                  </div>

                  <div className="p-8 bg-brand-secondary/30 rounded-[2rem] border border-brand-primary/5 mb-8">
                     <div className="flex items-baseline gap-4 mb-2">
                       <span className="text-4xl font-display font-black text-brand-primary italic">£{product.price.toFixed(2)}</span>
                       {product.oldPrice && <span className="text-lg text-brand-primary/30 line-through">£{product.oldPrice.toFixed(2)}</span>}
                     </div>
                     <p className="text-[10px] font-black uppercase text-brand-primary/40 tracking-widest flex items-center gap-2">
                        <Truck size={12} className="text-green-500" /> {t('badge.free_shipping')} • {t('badge.tomorrow_at_door')}
                     </p>
                     {product.stock !== undefined && product.stock > 0 && product.stock <= 10 && (
                       <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-red-50 rounded-xl border border-red-100">
                         <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
                         <p className="text-xs font-black text-red-600">
                           Son <span className="text-red-700">{product.stock}</span> adet kaldı!
                         </p>
                       </div>
                     )}
                     {product.stock !== undefined && product.stock > 10 && product.stock <= 50 && (
                       <p className="text-[10px] font-bold text-orange-500 mt-2">
                         ⚡ Stok tükeniyor — hızlı hareket et
                       </p>
                     )}
                     {viewers > 0 && (
                       <p className="text-[10px] text-[#1A1033]/40 font-bold mt-1.5 flex items-center gap-1">
                         <Eye size={10} /> Son 24 saatte {viewers} kişi görüntüledi
                       </p>
                     )}
                     {campaigns.length > 0 && (
                       <div className="mt-3 space-y-2">
                         {campaigns.slice(0, 3).map(c => (
                           <div key={c.id} className="flex items-start gap-2 p-3 bg-orange-50 rounded-2xl border border-orange-100">
                             <Tag size={13} className="text-orange-500 mt-0.5 flex-shrink-0" />
                             <div>
                               <p className="text-xs font-black text-orange-700">{c.name}</p>
                               {c.description && (
                                 <p className="text-[10px] text-orange-500 mt-0.5">{c.description}</p>
                               )}
                               <p className="text-[10px] text-orange-400 font-bold mt-0.5">
                                 {c.discountType === 'percentage'
                                   ? `%${c.discountValue} indirim`
                                   : `${c.discountValue} TL indirim`}
                               </p>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                     {cartDiscount > 0 && (
                       <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 rounded-2xl border border-green-100">
                         <ShoppingCart size={13} className="text-green-600 flex-shrink-0" />
                         <div>
                           <p className="text-[10px] font-bold text-green-600/60">Sepette ödersiniz</p>
                           <div className="flex items-center gap-2">
                             <p className="text-lg font-black text-green-700">
                               {product?.currency} {cartPrice.toFixed(2)}
                             </p>
                             <span className="text-[10px] font-black text-green-600 bg-green-100 px-2 py-0.5 rounded-lg">
                               {product?.currency} {cartDiscount.toFixed(2)} tasarruf
                             </span>
                           </div>
                         </div>
                       </div>
                     )}
                     {activeCoupons.length > 0 && (
                       <div className="mt-3">
                         <p className="text-[10px] font-black uppercase text-[#1A1033]/30 mb-2 tracking-widest">
                           Kupon Fırsatı
                         </p>
                         <div className="flex flex-wrap gap-2">
                           {activeCoupons.map(c => (
                             <button
                               key={c.id}
                               onClick={() => navigator.clipboard.writeText(c.code)}
                               title="Kopyalamak için tıkla"
                               className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-accent/40 rounded-xl hover:border-accent hover:bg-accent/5 transition-all group"
                             >
                               <Ticket size={12} className="text-accent flex-shrink-0" />
                               <span className="text-xs font-black text-accent">{c.code}</span>
                               <span className="text-[10px] text-[#1A1033]/40 font-bold">
                                 {c.discountType === 'percentage'
                                   ? `%${c.discountValue}`
                                   : `${c.discountValue} TL`} indirim
                               </span>
                               <Copy size={10} className="text-[#1A1033]/20 group-hover:text-accent transition-colors" />
                             </button>
                           ))}
                         </div>
                       </div>
                     )}
                  </div>

                  {/* Variant Selector */}
                  {product.variantAttributes && product.variantAttributes.length > 0 && product.variants && product.variants.length > 0 && (() => {
                    const selectedVariant: ProductVariant | undefined = product.variants!.find(v =>
                      product.variantAttributes!.every(attr => v.attributes[attr] === selectedAttrs[attr])
                    );
                    const allSelected = product.variantAttributes!.every(attr => selectedAttrs[attr]);
                    return (
                      <div className="space-y-4 mb-4">
                        {product.variantAttributes!.map(attr => {
                          const uniqueValues = [...new Set(product.variants!.map(v => v.attributes[attr]).filter(Boolean))];
                          return (
                            <div key={attr}>
                              <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-2">
                                {attr.charAt(0).toUpperCase() + attr.slice(1)}
                                {selectedAttrs[attr] && <span className="ml-2 text-brand-primary normal-case font-bold">: {selectedAttrs[attr]}</span>}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {uniqueValues.map((val: string) => {
                                  const hasStock = product.variants!.some(v => v.attributes[attr] === val && v.stock > 0);
                                  return (
                                    <button
                                      key={val}
                                      onClick={() => setSelectedAttrs(prev => ({ ...prev, [attr]: val }))}
                                      disabled={!hasStock}
                                      className={cn(
                                        'px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all',
                                        selectedAttrs[attr] === val
                                          ? 'border-accent bg-accent/10 text-accent'
                                          : hasStock
                                            ? 'border-brand-primary/10 text-brand-primary hover:border-accent/40'
                                            : 'border-brand-primary/5 text-brand-primary/20 line-through cursor-not-allowed'
                                      )}
                                    >
                                      {val}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        {allSelected && selectedVariant && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-100">
                            <CheckCircle2 size={13} className="text-green-500" />
                            <span className="text-xs font-black text-green-700">
                              Stok: {selectedVariant.stock} adet · Fiyat: £{selectedVariant.price.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {allSelected && !selectedVariant && (
                          <p className="text-xs font-bold text-red-500">Bu kombinasyon mevcut değil.</p>
                        )}
                      </div>
                    );
                  })()}

                  <div className="space-y-4">
                    {(() => {
                      const hasVariants = (product.variantAttributes?.length ?? 0) > 0 && (product.variants?.length ?? 0) > 0;
                      const selectedVariant: ProductVariant | undefined = hasVariants
                        ? product.variants!.find(v => product.variantAttributes!.every(attr => v.attributes[attr] === selectedAttrs[attr]))
                        : undefined;
                      const allSelected = !hasVariants || product.variantAttributes!.every(attr => selectedAttrs[attr]);
                      const effectivePrice = selectedVariant?.price ?? cartPrice;
                      const canAdd = allSelected && (!hasVariants || !!selectedVariant);
                      return (
                        <div className="flex items-center gap-4">
                          <div className="w-24 h-12 bg-white border border-brand-primary/5 rounded-xl flex items-center px-1">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex-1 text-brand-primary/40 hover:text-brand-primary">-</button>
                            <span className="w-8 text-center font-black text-sm">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="flex-1 text-brand-primary/40 hover:text-brand-primary">+</button>
                          </div>
                          <button
                            onClick={() => canAdd && addItem(product.id, quantity, selectedVariant?.id)}
                            disabled={!canAdd}
                            className={cn(
                              'flex-1 h-12 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg flex items-center justify-center gap-3',
                              canAdd
                                ? 'bg-accent hover:bg-brand-primary shadow-accent/20'
                                : 'bg-brand-primary/20 cursor-not-allowed'
                            )}
                          >
                            <ShoppingCart size={18} />
                            {hasVariants && !allSelected ? 'Seçenek Seçin' : t('product.add_cart')}
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {firebaseUser && (
                    <div className="mt-4">
                      <button
                        onClick={handleTrackPrice}
                        disabled={trackLoading}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50',
                          tracking
                            ? 'bg-accent/10 text-accent border border-accent/30'
                            : 'bg-[#1A1033]/5 text-[#1A1033]/50 hover:bg-accent/10 hover:text-accent border border-transparent'
                        )}
                      >
                        <BellRing size={14} fill={tracking ? 'currentColor' : 'none'} />
                        {tracking ? 'Fiyat Takibinde' : 'Fiyat Düşünce Haber Ver'}
                      </button>
                    </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-brand-primary/5">
                     <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-3">Bu Ürünü Paylaş</p>
                     <div className="flex items-center gap-2">
                        <button className="w-10 h-10 rounded-xl bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-all flex items-center justify-center">
                           <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 320 512" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"></path></svg>
                        </button>
                        <button className="w-10 h-10 rounded-xl bg-[#000000]/5 text-[#000000] hover:bg-[#000000] hover:text-white transition-all flex items-center justify-center">
                           <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path></svg>
                        </button>
                        <button className="w-10 h-10 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all flex items-center justify-center">
                           <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 413.2c-32.9 0-65.1-8.8-93.5-25.5l-6.7-4-69.5 18.2L72 334l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.5-186.6 184.5zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>
                        </button>
                     </div>
                  </div>

                  <div className="mt-12 space-y-4">
                     {/* Location Based Delivery Widget */}
                     <div className="p-5 border border-brand-primary/10 bg-brand-secondary/30 dark:bg-zinc-900/40 rounded-2xl flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between group hover:border-accent/40 transition-colors cursor-pointer" onClick={() => setIsLocationModalOpen(true)}>
                        <div className="flex gap-4 items-start sm:items-center">
                           <div className="w-12 h-12 bg-white dark:bg-zinc-800 shadow-sm rounded-[1rem] flex items-center justify-center text-accent group-hover:scale-110 transition-transform shrink-0">
                              <Navigation size={22} className="fill-accent/20" />
                           </div>
                           <div className="flex flex-col">
                             <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-white/40">Teslimat Adresi</span>
                                <div className="h-1 w-1 rounded-full bg-brand-primary/20" />
                                <span className="text-[10px] font-bold text-accent truncate max-w-[150px]">{selectedLocation}</span>
                             </div>
                             <p className="text-sm font-bold text-brand-primary dark:text-white">
                                {selectedLocation.includes("İstanbul") || selectedLocation.toLowerCase().includes("istanbul") ? "Yarın Kapında (" : "En geç 2 gün içinde ("}
                                <span className="text-green-600">Ücretsiz Teslimat</span>)
                             </p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 rounded-lg shadow-sm sm:ml-auto">
                           <span className="text-[10px] font-bold text-brand-primary/60 dark:text-white/60">Değiştir</span>
                           <ChevronRight size={14} className="text-brand-primary/40" />
                        </div>
                     </div>

                     {/* Additional Delivery Perks */}
                     <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl border border-brand-primary/5 bg-white dark:bg-zinc-900 flex flex-col justify-center">
                           <div className="flex items-center gap-2 mb-2">
                             <Package size={16} className="text-[#F9423A]" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Kolay İade</span>
                           </div>
                           <p className="text-xs font-bold opacity-60">15 gün içinde koşulsuz ücretsiz iade hakkı.</p>
                        </div>
                        <div className="p-4 rounded-xl border border-brand-primary/5 bg-white dark:bg-zinc-900 flex flex-col justify-center">
                           <div className="flex items-center gap-2 mb-2">
                             <ShieldCheck size={16} className="text-green-500" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Garantili</span>
                           </div>
                           <p className="text-xs font-bold opacity-60">2 Yıl distribütör garantisi altındadır.</p>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Frequently Bought Together */}
            {boughtTogether.length > 0 && (
              <div className="bg-white rounded-[2rem] border border-brand-primary/5 shadow-sm p-6 md:p-8">
                <h3 className="text-xl font-black text-brand-primary uppercase italic mb-8 border-b border-brand-primary/5 pb-4">{t('product.bought_together')}</h3>
                <div className="flex flex-col xl:flex-row items-center gap-8">
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <div className="w-24 h-24 md:w-32 md:h-32 p-2 border border-brand-primary/5 rounded-2xl bg-white shrink-0">
                      <img src={product.images[0]} className="w-full h-full object-contain mix-blend-multiply" alt={product.title} loading="lazy" />
                    </div>
                    <span className="text-xl md:text-2xl font-black text-brand-primary/20">+</span>
                    {boughtTogether.map((p, i) => (
                      <React.Fragment key={p.id}>
                        <div className="w-24 h-24 md:w-32 md:h-32 p-2 border border-brand-primary/5 rounded-2xl bg-white shrink-0 group relative cursor-pointer">
                          <img src={p.images[0]} className="w-full h-full object-contain mix-blend-multiply" alt={p.title} loading="lazy" />
                          <div className="absolute inset-0 bg-accent/90 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white text-[9px] md:text-[10px] font-black uppercase text-center p-2">
                             {p.title}
                          </div>
                        </div>
                        {i < boughtTogether.length - 1 && <span className="text-xl md:text-2xl font-black text-brand-primary/20">+</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="w-full xl:w-auto flex-1 xl:border-l xl:border-brand-primary/5 xl:pl-8 text-center xl:text-left">
                     <p className="text-[10px] font-black uppercase text-brand-primary/40 tracking-widest mb-1">Toplam Fiyat</p>
                     <p className="text-2xl md:text-3xl font-display font-black text-accent italic">£{(product.price + boughtTogether.reduce((acc, curr) => acc + curr.price, 0)).toFixed(2)}</p>
                     <button className="mt-4 w-full xl:w-auto px-8 lg:px-12 py-4 lg:py-3 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all">Listeyi Sepete Ekle</button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabbed Detailed View */}
            <div className="bg-white rounded-[2rem] border border-brand-primary/5 shadow-sm overflow-hidden">
               <div className="flex border-b border-brand-primary/5 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'details', label: t('product.description') },
                    { id: 'specs', label: t('product.specifications') },
                    { id: 'reviews', label: t('product.reviews') },
                    { id: 'qa', label: t('product.questions_answers') }
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "px-8 py-6 text-xs font-black uppercase tracking-widest transition-all relative shrink-0",
                        activeTab === tab.id ? "text-accent" : "text-brand-primary/30 hover:text-brand-primary"
                      )}
                    >
                      {tab.label}
                      {activeTab === tab.id && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-accent" />}
                    </button>
                  ))}
               </div>
               
               <div className="p-8 md:p-12">
                  <AnimatePresence mode="wait">
                    {activeTab === 'details' && (
                      <motion.div 
                        key="details"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="prose prose-zinc dark:prose-invert max-w-none"
                      >
                         <h2 className="text-2xl font-display font-black text-brand-primary uppercase italic mb-6">Artifact Intelligence</h2>
                         <div className="text-brand-primary/70 leading-relaxed font-medium whitespace-pre-wrap">
                            {product.longDescription || product.description}
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                            {[
                              { label: 'Origin', value: product.originCountry, icon: Globe },
                              { label: 'Merchant', value: product.brand, icon: Award },
                              { label: 'Protection', value: 'Escrow', icon: Shield },
                              { label: 'Express', value: 'Priority', icon: Zap },
                            ].map((f, i) => (
                              <div key={i} className="p-6 bg-brand-secondary/30 rounded-3xl border border-brand-primary/5 text-center group hover:bg-white hover:shadow-xl transition-all">
                                 <f.icon size={24} className="text-accent mx-auto mb-4" />
                                 <p className="text-[10px] font-black uppercase text-brand-primary/40 tracking-widest">{f.label}</p>
                                 <p className="text-xs font-black text-brand-primary uppercase mt-1">{f.value}</p>
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
                        <h2 className="text-2xl font-display font-black text-brand-primary uppercase italic mb-8">Technical Mapping</h2>
                        <div className="grid grid-cols-1 border border-brand-primary/5 rounded-3xl overflow-hidden shadow-sm">
                           {product.specifications ? Object.entries(product.specifications).map(([key, val], i) => (
                             <div key={key} className={cn("grid grid-cols-2 p-6 transition-colors", i % 2 === 0 ? "bg-brand-secondary/20" : "bg-white")}>
                               <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary/40">{key}</span>
                               <span className="text-sm font-black text-brand-primary uppercase italic">{val as string}</span>
                             </div>
                           )) : (
                             <div className="p-12 text-center text-brand-primary/20 italic">No structured data for this artifact.</div>
                           )}
                           <div className="grid grid-cols-2 p-6 bg-brand-primary text-white">
                             <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Global HS-CODE</span>
                             <span className="text-sm font-black uppercase italic">{product.hsCode || '85.43.00.00'}</span>
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
                          isSeller={user?.id === product.sellerId || (user as any)?.role === 'admin'}
                          isLoggedIn={!!firebaseUser}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'qa' && (
                      <motion.div
                        key="qa"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <QASection
                          productId={product.id}
                          currentUserId={firebaseUser?.uid}
                          currentUserName={user?.name || firebaseUser?.displayName || undefined}
                          isSeller={user?.id === product.sellerId || (user as any)?.role === 'admin'}
                          isLoggedIn={!!firebaseUser}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>

            {/* Recommendations Blocks */}
            <div className="space-y-6">
              {/* Row 1: Bunlar da İlgini Çekebilir */}
              {(recSimilar.length > 0 || relatedProducts.length > 0) && (
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-brand-primary/5 dark:border-white/5 shadow-sm p-6 md:p-8">
                  <ProductCarousel
                    title={t('product.rec.interest.title')}
                    subtext={t('product.rec.interest.sub')}
                    products={recSimilar.length > 0 ? recSimilar : relatedProducts}
                  />
                </div>
              )}

              {/* Row 2: Buna Bakanların Aldıkları */}
              {recAlsoBought.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-brand-primary/5 dark:border-white/5 shadow-sm p-6 md:p-8">
                  <ProductCarousel
                    title={t('product.rec.bakanAldi.title')}
                    subtext={t('product.rec.bakanAldi.sub')}
                    products={recAlsoBought}
                  />
                </div>
              )}

              {/* Row 3: Birlikte Alınanlar */}
              {boughtTogether.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-brand-primary/5 dark:border-white/5 shadow-sm p-6 md:p-8">
                  <ProductCarousel
                    title={t('product.rec.birlikte.title')}
                    subtext={t('product.rec.birlikte.sub')}
                    products={boughtTogether}
                  />
                </div>
              )}

              {/* Row 4: Herkes Bunlara Bakıyor */}
              {categoriesProducts.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-brand-primary/5 dark:border-white/5 shadow-sm p-6 md:p-8">
                  <ProductCarousel
                    title={t('product.rec.populer.title')}
                    subtext={t('product.rec.populer.sub')}
                    products={categoriesProducts}
                  />
                </div>
              )}

              {/* Row 5: Popüler Ürünlerden Seçtik */}
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-brand-primary/5 dark:border-white/5 shadow-sm p-6 md:p-8">
                <ProductCarousel
                  title={t('product.rec.secilmis.title')}
                  subtext={t('product.rec.secilmis.sub')}
                  products={MOCK_PRODUCTS.filter(p => p.featured && p.id !== product.id).slice(0, 10)}
                />
              </div>

              {/* Popular Searches badge grid */}
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-brand-primary/5 dark:border-white/5 shadow-sm p-6 md:p-8">
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

          {/* Right: Seller & Delivery Control */}
          <div className="lg:col-span-3 space-y-6">
             {/* Seller Card */}
             <div className="bg-brand-primary rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Artisan Entity</p>
                   <h4 className="text-2xl font-display font-black mt-2 mb-6 uppercase italic text-white leading-none">{product.brand}</h4>
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 bg-white/10 rounded-2xl p-1 border border-white/20 backdrop-blur">
                         <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${product.brand}`} className="w-full h-full object-cover rounded-xl" alt={product.brand} loading="lazy" />
                      </div>
                      <div>
                         <div className="flex items-center gap-1">
                            <span className="text-sm font-black italic">9.8</span>
                            <Star size={12} fill="#FF5200" className="text-accent" />
                         </div>
                         <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Mağaza Puanı</p>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                         <p className="text-[8px] font-black uppercase text-white/40 mb-1">Followers</p>
                         <p className="text-xs font-black">12.4K</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                         <p className="text-[8px] font-black uppercase text-white/40 mb-1">Items</p>
                         <p className="text-xs font-black">450+</p>
                      </div>
                   </div>
                   <button className="w-full py-4 bg-accent text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-brand-primary transition-all shadow-xl shadow-accent/20">
                      Mağazayı Takip Et
                   </button>
                   <Link 
                     to={`/seller/${product.sellerId}`}
                     className="w-full mt-3 py-4 border border-white/10 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                   >
                     Mağazaya Git <ChevronRight size={14} />
                   </Link>
                </div>
             </div>

             {/* Seller Other Products (Brief Version) */}
             {sellerProducts.length > 0 && (
               <div className="bg-white rounded-[2.5rem] p-6 border border-brand-primary/5 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase text-brand-primary/40 tracking-[0.2em] mb-6 border-b border-brand-primary/5 pb-4">
                     Satıcının Diğer Ürünleri
                  </h4>
                  <div className="space-y-4">
                     {sellerProducts.slice(0, 3).map(p => (
                       <Link key={p.id} to={`/product/${p.slug}`} className="flex gap-4 group">
                          <div className="w-16 h-16 bg-brand-secondary/50 rounded-xl p-2 shrink-0 group-hover:bg-accent/5 transition-all">
                             <img src={p.images[0]} className="w-full h-full object-contain mix-blend-multiply" alt={p.title} loading="lazy" />
                          </div>
                          <div className="min-w-0">
                             <h5 className="text-[11px] font-bold text-brand-primary line-clamp-1 group-hover:text-accent transition-colors">{p.title}</h5>
                             <p className="text-sm font-black text-brand-primary mt-1 italic">£{p.price}</p>
                          </div>
                       </Link>
                     ))}
                  </div>
                  <Link to={`/seller/${product.sellerId}`} className="block w-full mt-6 py-3 border border-brand-primary/5 rounded-xl text-center text-[9px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all">
                     Tümünü Gör
                  </Link>
               </div>
             )}

             {/* Market Logistics Trust */}
             <div className="bg-white rounded-[2.5rem] p-8 border border-brand-primary/5 shadow-sm space-y-6">
                {[
                  { title: t('trust.easy_return'), desc: t('trust.easy_return_desc'), icon: Undo2 },
                  { title: t('trust.safe_payment'), desc: t('trust.safe_payment_desc'), icon: ShieldCheck },
                  { title: t('trust.original'), desc: t('trust.original_desc'), icon: Award }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                     <div className="w-10 h-10 bg-brand-secondary/50 rounded-xl flex items-center justify-center text-accent shrink-0">
                        <item.icon size={20} />
                     </div>
                     <div>
                        <p className="text-xs font-black uppercase text-brand-primary">{item.title}</p>
                        <p className="text-[10px] font-bold text-brand-primary/40 uppercase mt-1 tracking-widest">{item.desc}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Global Commercial Intelligence Pulse (Full-width Visual Support) */}
        <section className="bg-brand-primary rounded-[4rem] p-12 mb-20 relative overflow-hidden group shadow-3xl">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
               <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-accent text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-accent/20">
                     <BarChart size={14} /> Pazar Verisi
                  </div>
                  <h2 className="text-4xl md:text-5xl font-display font-black text-white uppercase italic leading-[1.1]">Küresel Talep Analizi</h2>
                  <p className="text-sm font-bold text-white/40 uppercase tracking-[0.2em] leading-relaxed max-w-xl">
                     Artifact {product.id} için gerçek zamanlı küresel talep endeksi. Hub London ve Mercora Istanbul çıkışlı verilerle hazırlanmıştır.
                  </p>
               </div>
               <div className="w-full md:w-[400px] h-64 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl">
                  <div className="flex justify-between items-start mb-6">
                     <p className="text-[10px] font-black uppercase text-white/40 tracking-widest italic">{product.brand} Market Cap</p>
                     <Zap size={20} className="text-accent animate-pulse" />
                  </div>
                  <ResponsiveContainer width="100%" height="70%">
                    <AreaChart data={MARKET_DATA}>
                      <defs>
                        <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF5200" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#FF5200" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="price" stroke="#FF5200" strokeWidth={4} fill="url(#colorWave)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="flex justify-between mt-4">
                     <span className="text-[9px] font-black text-accent uppercase tracking-widest">Bullish Indicator</span>
                     <span className="text-[9px] font-black text-white uppercase tracking-widest">+12.4% Momentum</span>
                  </div>
               </div>
            </div>
        </section>

      </div>
        {/* AR Viewer Modal */}
        {product.model3dUrl && (
          <ARViewer
            modelUrl={product.model3dUrl}
            productTitle={product.title}
            open={arOpen}
            onClose={() => setArOpen(false)}
          />
        )}

        {/* Lightbox / Zoom Modal */}
        <AnimatePresence>
          {isLightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLightboxOpen(false)}
              className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 md:p-8"
            >
              {/* Close Button */}
              <div className="w-full flex justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white transition-all border border-white/10"
                >
                  <span className="text-xl font-bold">✕</span>
                </button>
              </div>

              {/* Main Image View */}
              <div className="flex-1 w-full max-w-5xl flex items-center justify-between gap-4 md:gap-8 my-4">
                {/* Prev Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="w-12 h-12 md:w-16 md:h-16 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white transition-all border border-white/10"
                >
                  <ChevronLeft size={24} />
                </button>

                {/* Image Container */}
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="relative max-h-[70vh] max-w-[80vw] flex items-center justify-center"
                >
                  <motion.img
                    key={activeImage}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    src={product.images[activeImage]}
                    alt={product.title}
                    className="max-h-[70vh] max-w-[80vw] object-contain select-none pointer-events-none"
                  />
                </div>

                {/* Next Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="w-12 h-12 md:w-16 md:h-16 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white transition-all border border-white/10"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              {/* Thumbnail Strip */}
              <div 
                onClick={(e) => e.stopPropagation()}
                className="flex gap-3 overflow-x-auto no-scrollbar max-w-full pb-4"
              >
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all p-1 bg-white shrink-0",
                      activeImage === i ? "border-accent scale-105 shadow-lg" : "border-transparent opacity-50 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt={product.title} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}
