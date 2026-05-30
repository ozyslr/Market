import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, Truck, ShieldCheck, ChevronRight, ShoppingCart, 
  Globe, Heart, Share2, Info, ChevronLeft, Award, 
  Clock, Sparkles, Zap, Shield, MapPin, 
  Undo2, CheckCircle2, AlertCircle, MessageCircle,
  ThumbsUp, BarChart, ExternalLink, Package, ArrowRight,
  Facebook, Twitter, Navigation
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
import { Product, Review } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useReviewStore } from '@/store/useReviewStore';
import { useAuth } from '@/context/AuthContext';

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

export function ProductDetail() {
  const { t } = useLanguage();
  const { user, login } = useAuth();
  const { selectedLocation, setIsLocationModalOpen } = useLocationStore();
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews' | 'qa'>('details');

  // Wishlist
  const wishlistItems = useWishlistStore((state) => state.items);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isWishlisted = product ? wishlistItems.some((p) => p.id === product.id) : false;

  // Reviews
  const storedReviews = useReviewStore((state) => state.reviews);
  const addReview = useReviewStore((state) => state.addReview);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const userReviews: Review[] = product
    ? storedReviews.filter((r) => r.productId === product.id)
    : [];
  const allReviews: Review[] = [...userReviews, ...(product?.reviews || [])];

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !reviewComment.trim()) return;
    addReview({
      productId: product.id,
      userId: user?.id || 'guest',
      userName: user?.name || 'Misafir Kullanıcı',
      rating: reviewRating,
      comment: reviewComment.trim(),
    });
    setReviewComment('');
    setReviewRating(5);
  };

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

  if (loading) {
    return (
       <div className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center gap-6">
          <Sparkles size={48} className="text-accent animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-primary/20">Syncing Artifact Data...</p>
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

  // Recommendations logic
  const relatedProducts = MOCK_PRODUCTS.filter(p => product.relatedProductIds?.includes(p.id));
  const boughtTogether = MOCK_PRODUCTS.filter(p => product.frequentlyBoughtTogetherIds?.includes(p.id));
  const sellerProducts = MOCK_PRODUCTS.filter(p => p.sellerId === product.sellerId && p.id !== product.id);
  const categoriesProducts = MOCK_PRODUCTS.filter(p => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 10);

  const currentMarket = MARKETS['UK'];
  const tax = calculateTotal(product.price, 12, currentMarket, product.originCountry === 'UK');

  return (
    <div className="bg-[#f2f4f7] dark:bg-zinc-950 min-h-screen pb-20 transition-colors duration-300">
      <SEO 
        title={product.title} 
        description={product.description}
        image={product.images[0]}
        type="product"
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
                  <div className="aspect-square bg-white rounded-3xl overflow-hidden border border-brand-primary/5 p-8 relative flex items-center justify-center">
                    <motion.img 
                      key={activeImage}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={product.images[activeImage]} 
                      className="w-full h-full object-contain mix-blend-multiply" 
                      alt="" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute top-6 right-6 flex flex-col gap-3">
                      <button
                        onClick={() => toggleWishlist(product)}
                        aria-label={isWishlisted ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                        className={cn(
                          "p-3 backdrop-blur shadow-xl rounded-full transition-all border active:scale-90",
                          isWishlisted
                            ? "bg-[#F9423A] text-white border-[#F9423A]"
                            : "bg-white/80 text-brand-primary/40 border-brand-primary/5 hover:text-[#F9423A] hover:bg-white"
                        )}
                      >
                        <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
                      </button>
                      <div className="relative group">
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
                        <img src={img} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info & Price */}
                <div className="flex flex-col">
                  <div className="mb-6">
                     <Link to={`/seller/${product.sellerId}`} className="text-accent text-sm font-black uppercase tracking-widest hover:underline decoration-2">{product.brand}</Link>
                     <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-brand-primary mt-2 leading-[1.2]">{product.title}</h1>
                     <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-1">
                           <Star size={18} fill="#FF5200" className="text-accent" />
                           <span className="text-sm font-black text-brand-primary">{product.rating}</span>
                        </div>
                        <div className="h-4 w-[1px] bg-brand-primary/10" />
                        <span className="text-sm font-bold text-brand-primary/40 underline decoration-dotted">{product.reviewsCount + userReviews.length} {t('product.reviews')}</span>
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
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                       <div className="w-24 h-12 bg-white border border-brand-primary/5 rounded-xl flex items-center px-1">
                          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex-1 text-brand-primary/40 hover:text-brand-primary">-</button>
                          <span className="w-8 text-center font-black text-sm">{quantity}</span>
                          <button onClick={() => setQuantity(quantity + 1)} className="flex-1 text-brand-primary/40 hover:text-brand-primary">+</button>
                       </div>
                       <button 
                         onClick={() => {
                           useCartStore.getState().addItem(product, quantity);
                           useCartStore.getState().setIsOpen(true);
                         }}
                         className="flex-1 h-12 bg-accent text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-primary transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-3"
                       >
                         <ShoppingCart size={18} /> {t('product.add_cart')}
                       </button>
                    </div>
                  </div>

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
                      <img src={product.images[0]} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                    </div>
                    <span className="text-xl md:text-2xl font-black text-brand-primary/20">+</span>
                    {boughtTogether.map((p, i) => (
                      <React.Fragment key={p.id}>
                        <div className="w-24 h-24 md:w-32 md:h-32 p-2 border border-brand-primary/5 rounded-2xl bg-white shrink-0 group relative cursor-pointer">
                          <img src={p.images[0]} className="w-full h-full object-contain mix-blend-multiply" alt="" />
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
                     <button 
                       onClick={() => {
                         useCartStore.getState().addItem(product, 1);
                         boughtTogether.forEach(p => useCartStore.getState().addItem(p, 1));
                         useCartStore.getState().setIsOpen(true);
                       }}
                       className="mt-4 w-full xl:w-auto px-8 lg:px-12 py-4 lg:py-3 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all"
                     >
                       Listeyi Sepete Ekle
                     </button>
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
                               <span className="text-sm font-black text-brand-primary uppercase italic">{val}</span>
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
                        className="space-y-12"
                      >
                         <div className="grid md:grid-cols-3 gap-12 border-b border-brand-primary/5 pb-12">
                            <div className="text-center md:text-left space-y-4">
                               <h4 className="text-6xl font-display font-black text-brand-primary uppercase italic">{product.rating}</h4>
                               <div className="flex items-center justify-center md:justify-start gap-1">
                                 {Array.from({ length: 5 }).map((_, i) => (
                                   <Star key={i} size={24} fill={i < Math.floor(product.rating) ? "#FF5200" : "none"} className={i < Math.floor(product.rating) ? "text-accent" : "text-brand-primary/10"} />
                                 ))}
                               </div>
                               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary/40">Verified Artifact Balance</p>
                            </div>
                            <div className="md:col-span-2 space-y-4">
                               {[5, 4, 3, 2, 1].map(star => {
                                 const count = [85, 10, 3, 1, 1][5-star];
                                 return (
                                   <div key={star} className="flex items-center gap-4">
                                      <span className="text-[10px] font-black w-8 text-brand-primary/60">{star} ★</span>
                                      <div className="flex-1 h-3 bg-brand-secondary rounded-full overflow-hidden border border-brand-primary/5">
                                         <div className="h-full bg-accent shadow-[0_0_10px_rgba(255,82,0,0.4)]" style={{ width: `${count}%` }} />
                                      </div>
                                      <span className="text-[10px] font-black w-8 text-brand-primary/40 text-right">{count}%</span>
                                   </div>
                                 );
                               })}
                            </div>
                         </div>
                         
                         {/* Write a Review */}
                         <div className="bg-brand-secondary/30 rounded-[2rem] border border-brand-primary/5 p-6 md:p-8">
                            <h4 className="text-sm font-black uppercase tracking-widest text-brand-primary mb-6 flex items-center gap-2">
                               <MessageCircle size={16} className="text-accent" /> Değerlendirme Yaz
                            </h4>
                            <form onSubmit={handleSubmitReview} className="space-y-5">
                               <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">Puanın</span>
                                  <div className="flex items-center gap-1">
                                     {Array.from({ length: 5 }).map((_, i) => {
                                       const value = i + 1;
                                       return (
                                         <button
                                           key={i}
                                           type="button"
                                           onClick={() => setReviewRating(value)}
                                           onMouseEnter={() => setHoverRating(value)}
                                           onMouseLeave={() => setHoverRating(0)}
                                           className="p-0.5 transition-transform hover:scale-110"
                                         >
                                            <Star
                                              size={22}
                                              fill={value <= (hoverRating || reviewRating) ? '#FF5200' : 'none'}
                                              className={value <= (hoverRating || reviewRating) ? 'text-accent' : 'text-brand-primary/20'}
                                            />
                                         </button>
                                       );
                                     })}
                                  </div>
                               </div>
                               <textarea
                                 value={reviewComment}
                                 onChange={(e) => setReviewComment(e.target.value)}
                                 placeholder="Bu ürün hakkındaki deneyimini paylaş..."
                                 rows={4}
                                 className="w-full p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-brand-primary/10 text-sm font-medium text-brand-primary dark:text-white placeholder:text-brand-primary/30 focus:border-accent outline-none transition-all resize-none"
                               />
                               <div className="flex items-center justify-between gap-4">
                                  <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest">
                                     {user ? `${user.name} olarak yazıyorsun` : 'Misafir olarak yazıyorsun'}
                                  </p>
                                  <button
                                    type="submit"
                                    disabled={!reviewComment.trim()}
                                    className="px-8 py-3 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-accent/20 hover:bg-brand-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                     Gönder
                                  </button>
                               </div>
                            </form>
                         </div>

                         <div className="space-y-12">
                            {allReviews.length === 0 && (
                              <div className="py-12 text-center text-brand-primary/30 text-sm font-bold uppercase tracking-widest">
                                 Henüz değerlendirme yok. İlk yorumu sen yaz!
                              </div>
                            )}
                            {allReviews.map((review) => (
                              <div key={review.id} className="group pb-12 border-b border-brand-primary/5">
                                 <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center font-black text-accent uppercase">
                                          {review.userName.charAt(0)}
                                       </div>
                                       <div>
                                          <p className="text-xs font-black uppercase tracking-wider text-brand-primary">{review.userName}</p>
                                          <div className="flex items-center gap-1 text-accent mt-1">
                                            {Array.from({length: 5}).map((_, i) => (
                                              <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} />
                                            ))}
                                            <span className="text-[10px] font-black ml-2 text-brand-primary/40">{review.createdAt.split('T')[0]}</span>
                                          </div>
                                       </div>
                                    </div>
                                    {review.verified && (
                                       <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 rounded-full border border-green-500/20">
                                          <CheckCircle2 size={12} />
                                          <span className="text-[8px] font-black uppercase tracking-widest">{t('product.verified_purchase')}</span>
                                       </div>
                                    )}
                                 </div>
                                 <p className="text-sm text-brand-primary/70 leading-relaxed font-medium mb-6">{review.comment}</p>
                                 <div className="flex items-center gap-6">
                                    <button className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-primary/40 hover:text-accent transition-colors"><ThumbsUp size={14} /> {t('product.useful')} (12)</button>
                                    <button className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-primary/40 hover:text-accent transition-colors"><MessageCircle size={14} /> Yanıtla</button>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </motion.div>
                    )}

                    {activeTab === 'qa' && (
                       <motion.div key="qa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center space-y-4">
                          <MessageCircle size={48} className="mx-auto text-brand-primary/10" />
                          <h3 className="text-xl font-display font-black text-brand-primary uppercase italic">Community Intelligence Pool</h3>
                          <p className="text-sm text-brand-primary/40 max-w-sm mx-auto uppercase font-bold tracking-widest tracking-tight">Ask a question to verified buyers or the artisan directly.</p>
                          <button className="px-8 py-3 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-accent/20">Soru Sor</button>
                       </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>

            {/* Recommendations Blocks */}
            <ProductCarousel title={t('product.you_might_also_like')} products={categoriesProducts} />
            <ProductCarousel title={t('product.everyone_looking')} products={MOCK_PRODUCTS.filter(p => p.featured).slice(0, 10)} />
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
                         <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${product.brand}`} className="w-full h-full object-cover rounded-xl" alt="" />
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
                             <img src={p.images[0]} className="w-full h-full object-contain mix-blend-multiply" alt="" />
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
    </div>
  );
}
