import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  HelpCircle,
  ChevronRight,
  Heart,
  Sparkles,
  ArrowRight,
  Globe,
  Lock,
  Info,
  ShoppingBag,
  Zap as ZapIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { getProductsByIds, getProducts } from '@/services/productService';
import { LoadingState, ErrorState } from '@/components/shared/DataStates';
import { cn } from '@/lib/utils';
import { ProductVariant } from '@/types';
import type { Product } from '@/types';
import { calculateTotal, MARKETS } from '@/lib/taxEngine';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { useLocationStore } from '@/context/LocationContext';
import { useAuth } from '@/context/AuthContext';
import { useOneClickCheckout } from '@/hooks/useOneClickCheckout';
import { OneClickSuccessModal } from '@/components/checkout/OneClickSuccessModal';
import {
  getActiveCartCampaigns,
  calcCartCampaigns,
  getCartCampaignDiscount,
  getCartCampaignGifts,
} from '@/services/campaignService';
import type { CartCampaign } from '@/types';

export function CartPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const {
    canOneClick,
    runOneClick,
    loading: oneClickLoading,
    error: oneClickError,
    successOrder,
    clearSuccess,
  } = useOneClickCheckout();
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const { location } = useLocationStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  const productIds = useMemo(() => items.map((i) => i.productId), [items]);

  const loadProducts = useCallback(async () => {
    setStatus('loading');
    try {
      setProducts(productIds.length ? await getProductsByIds(productIds) : []);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [productIds]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const missingIds = useMemo(
    () => productIds.filter((id) => !products.some((p) => p.id === id)),
    [productIds, products],
  );

  const [suggested, setSuggested] = useState<Product[]>([]);
  useEffect(() => {
    getProducts({ limit: 2 })
      .then(setSuggested)
      .catch(() => setSuggested([]));
  }, []);

  // Cart campaigns
  const [cartCampaigns, setCartCampaigns] = useState<CartCampaign[]>([]);
  useEffect(() => {
    const itemSubtotal = items.reduce((sum, i) => {
      const product = products.find((p) => p.id === i.productId);
      const price = product
        ? ((i.variantId
            ? product.variants?.find((v) => v.id === i.variantId)?.price
            : product.price) ?? product.price)
        : 0;
      return sum + price * i.quantity;
    }, 0);
    getActiveCartCampaigns().then((campaigns) => {
      setCartCampaigns(
        calcCartCampaigns(
          campaigns,
          itemSubtotal,
          items.map((i) => i.productId),
        ),
      );
    });
  }, [items, products]);
  const cartCampaignDiscount = getCartCampaignDiscount(cartCampaigns);
  const cartGifts = getCartCampaignGifts(cartCampaigns);

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleOneClickOrder = () => {
    runOneClick(
      items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      user?.currency || 'gbp',
      clearCart,
    );
  };

  const getAvailableStock = (product: CartProduct): number => {
    if (product.variant) return product.variant.stock;
    return product.stock ?? 0;
  };

  const updateQuantityDelta = (id: string, delta: number, variantId?: string) => {
    const item = items.find((i) => i.productId === id && (i.variantId ?? '') === (variantId ?? ''));
    if (!item) return;
    if (item.quantity + delta <= 0) {
      removeItem(id, variantId);
      return;
    }
    // Cap at available stock
    const cartProduct = cartProducts.find(
      (p) => p.id === id && (p.variantId ?? '') === (variantId ?? ''),
    );
    if (cartProduct && delta > 0) {
      const maxStock = getAvailableStock(cartProduct);
      const newQty = Math.min(item.quantity + delta, maxStock);
      updateQuantity(id, newQty, variantId);
    } else {
      updateQuantity(id, item.quantity + delta, variantId);
    }
  };

  type CartProduct = Product & { quantity: number; variantId?: string; variant?: ProductVariant };
  const cartProducts = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      const variant = item.variantId
        ? product.variants?.find((v) => v.id === item.variantId)
        : undefined;
      return {
        ...product,
        quantity: item.quantity,
        variantId: item.variantId,
        variant,
      } as CartProduct;
    })
    .filter(Boolean) as CartProduct[];

  const subtotal = cartProducts.reduce(
    (sum, p) => sum + (p.variant?.price ?? p.price) * p.quantity,
    0,
  );
  const currentMarket = MARKETS[location.market] ?? MARKETS['UK'];
  const totals = calculateTotal(subtotal, 12, currentMarket, true);

  if (status === 'loading')
    return (
      <div className="min-h-screen bg-brand-secondary/30 pb-20 px-4 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <LoadingState />
        </div>
      </div>
    );
  if (status === 'error')
    return (
      <div className="min-h-screen bg-brand-secondary/30 pb-20 px-4 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <ErrorState message="Sepet yüklenemedi." onRetry={loadProducts} />
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-brand-secondary/30 pb-20 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Main Cart Section */}
          <div className="flex-1 space-y-6 lg:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 lg:mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-brand-primary leading-none">
                {t('cart.title', 'Sepetim')}
              </h1>
              <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-white rounded-full border border-brand-primary/5 shadow-sm w-fit">
                {items.length} {t('cart.items_count', 'Ürün')}
              </span>
            </div>

            {missingIds.length > 0 && (
              <div
                className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 flex items-start gap-2"
                role="alert"
              >
                <Info size={16} className="shrink-0 mt-0.5" />
                <span>
                  Sepetindeki {missingIds.length} ürün artık mevcut değil ve toplamdan çıkarıldı.{' '}
                  <button type="button" onClick={loadProducts} className="underline font-medium">
                    Listeyi güncelle
                  </button>
                </span>
              </div>
            )}

            {/* Cart Campaign Banners */}
            {cartCampaigns.length > 0 && (
              <div className="space-y-3 mb-4">
                {cartCampaigns.map((cc, idx) => (
                  <div
                    key={idx}
                    className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-white font-black text-xs">%</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-green-700">{cc.campaign.name}</p>
                      <p className="text-[10px] font-bold text-green-600">
                        {cc.campaign.discountType === 'percentage'
                          ? `%${cc.campaign.discountValue} — ${cc.discountAmount.toFixed(2)} ₺ indirim!`
                          : `${cc.discountAmount.toFixed(2)} ₺ indirim!`}
                        {cc.giftProduct && ` + Hediye: ${cc.giftProduct.name}`}
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-100 px-3 py-1 rounded-full">
                      Uygulandı
                    </span>
                  </div>
                ))}
                {cartCampaignDiscount > 0 && (
                  <div className="flex justify-between text-sm bg-accent/5 rounded-2xl px-4 py-3 border border-accent/10">
                    <span className="font-black text-accent">Sepet İndirimi</span>
                    <span className="font-black text-accent">
                      -{cartCampaignDiscount.toFixed(2)} ₺
                    </span>
                  </div>
                )}
                {cartGifts.map((gift, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-2xl p-3"
                  >
                    <span className="text-lg">🎁</span>
                    <div>
                      <p className="text-xs font-black text-purple-700">Hediye Ürün: {gift.name}</p>
                      <p className="text-[10px] text-purple-500">
                        x{gift.quantity} — Sepete otomatik eklenecek
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Items List */}
            <div className="space-y-6">
              <AnimatePresence>
                {cartProducts.map((product) => (
                  <motion.div
                    key={`${product.id}-${product.variantId ?? ''}`}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-4xl p-6 md:p-8 border border-brand-primary/5 shadow-sm group hover:border-accent/40 transition-all flex flex-col md:flex-row gap-8 relative overflow-hidden"
                  >
                    <div className="absolute top-0 start-0 w-2 h-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Image Area */}
                    <Link
                      to={`/product/${product.slug}`}
                      className="w-full md:w-48 aspect-square bg-brand-secondary/50 rounded-2xl p-4 overflow-hidden shrink-0"
                    >
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
                      />
                    </Link>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                            {product.brand}
                          </span>
                          <button
                            onClick={() => removeItem(product.id, product.variantId)}
                            aria-label={`${product.title} ürününü sepetten kaldır`}
                            className="text-brand-primary/20 hover:text-red-500 transition-colors p-2"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                        <h3 className="text-xl font-bold text-brand-primary mb-2 line-clamp-1 group-hover:text-accent transition-colors">
                          {product.title}
                        </h3>
                        {product.variant && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {Object.entries(product.variant.attributes).map(([key, val]) => (
                              <span
                                key={key}
                                className="px-2 py-0.5 bg-brand-secondary text-brand-primary/60 text-[10px] font-black uppercase rounded-lg"
                              >
                                {key}: {val}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
                          <span className="flex items-center gap-1">
                            <Truck size={12} /> Global Fulfillment: London
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe size={12} /> Origin: {product.originCountry}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-end md:items-center justify-between mt-8 gap-6">
                        <div className="flex items-center bg-brand-secondary/50 rounded-2xl p-1 border border-brand-primary/5">
                          <button
                            onClick={() => updateQuantityDelta(product.id, -1, product.variantId)}
                            aria-label={`${product.title} adedini azalt`}
                            className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all text-brand-primary/40 hover:text-brand-primary"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-12 text-center font-black text-sm">
                            {product.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantityDelta(product.id, 1, product.variantId)}
                            aria-label={`${product.title} adedini artır`}
                            className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all text-brand-primary/40 hover:text-brand-primary"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          {(() => {
                            const availStock = getAvailableStock(product);
                            if (availStock <= 10) {
                              return (
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                                  Sadece {availStock} adet kaldı!
                                </span>
                              );
                            }
                            return null;
                          })()}
                          {(() => {
                            const unitPrice = product.variant?.price ?? product.price;
                            return (
                              <div className="text-end">
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/20 mb-1">
                                  Unit Price: £{unitPrice.toFixed(2)}
                                </p>
                                <p className="text-2xl font-display font-black text-brand-primary">
                                  £{(unitPrice * product.quantity).toFixed(2)}
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {items.length === 0 && (
                <div className="bg-white rounded-[3rem] p-24 text-center border border-dashed border-brand-primary/20">
                  <div className="w-20 h-20 bg-brand-secondary rounded-full flex items-center justify-center mx-auto mb-8">
                    <ShoppingBag size={40} className="text-brand-primary/10" />
                  </div>
                  <h2 className="text-2xl font-black text-brand-primary mb-4 uppercase">
                    {t('cart.empty_title', 'Sepetin boş')}
                  </h2>
                  <p className="text-sm text-brand-primary/40 mb-6 max-w-xs mx-auto">
                    {t('cart.empty_desc', 'Henüz sepetine ürün eklemedin.')}
                  </p>
                  <Link
                    to="/"
                    className="px-8 py-3 bg-brand-primary text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-accent transition-all"
                  >
                    {t('cart.start_shopping', 'Keşfet')}
                  </Link>
                </div>
              )}
            </div>

            {/* AI Cross Sell Segment */}
            <div className="bg-brand-primary rounded-[3.5rem] p-10 text-white relative overflow-hidden">
              <Sparkles
                size={300}
                className="absolute -bottom-20 -end-20 text-white/5 pointer-events-none"
              />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                    <Sparkles size={20} className="text-white fill-white" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest italic">
                    Navigator Upsells
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {suggested.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex gap-6 items-center group cursor-pointer hover:bg-white/20 transition-all"
                    >
                      <div className="w-20 h-20 bg-white/10 rounded-xl overflow-hidden p-2 shrink-0">
                        <img
                          src={product.images[0]}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-contain brightness-110"
                          alt={product.title}
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
                          {product.brand}
                        </p>
                        <h4 className="font-bold text-sm line-clamp-1 mb-2">{product.title}</h4>
                        <button className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-1 group-hover:gap-2 transition-all">
                          Add to Bay <ArrowRight size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Strategy Sidebar */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="sticky top-32 space-y-6">
              <div className="bg-white rounded-[3rem] p-10 border border-brand-primary/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 end-0 w-24 h-24 bg-accent/5 rounded-full -translate-y-4 translate-x-4 blur-xl" />

                <h3 className="text-xl font-black uppercase tracking-widest mb-10 pb-6 border-b border-brand-primary/5">
                  Artifact Summary
                </h3>

                <div className="space-y-6 mb-10">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest">
                      Subtotal
                    </span>
                    <span className="text-sm font-black text-brand-primary">
                      £{subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 group relative">
                      <span className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest text-nowrap underline decoration-accent/30 underline-offset-4 cursor-help">
                        Global Tax (VAT)
                      </span>
                      <Info size={12} className="text-brand-primary/20" />
                    </div>
                    <span className="text-sm font-black text-brand-primary">
                      £{totals.vat.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest">
                      Customs & Duties
                    </span>
                    <div className="flex items-center gap-1">
                      <ShieldCheck size={14} className="text-green-500" />
                      <span className="text-sm font-black text-green-500">Included</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest">
                      Shipping Factor
                    </span>
                    <span className="text-sm font-black text-brand-primary">
                      £{totals.shipping.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="pt-8 mb-6 border-t border-brand-primary/5">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/20 mb-1">
                        Final Investment
                      </p>
                      <p className="text-4xl font-display font-black text-brand-primary tracking-tighter">
                        £{totals.total.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-end text-[10px] font-black uppercase tracking-widest text-accent">
                      Free Returns
                    </div>
                  </div>
                </div>

                {checkoutError && (
                  <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                    <Info size={16} className="text-red-500 shrink-0" />
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight">
                      {checkoutError}
                    </p>
                  </div>
                )}

                {/* One-Click Order Button */}
                {user && canOneClick && items.length > 0 && (
                  <>
                    <div className="mb-1">
                      <p className="text-xs text-brand-primary/60 mb-1">
                        {user.defaultPaymentMethodBrand} •••• {user.defaultPaymentMethodLast4}
                      </p>
                      <button
                        onClick={handleOneClickOrder}
                        disabled={oneClickLoading}
                        className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black uppercase tracking-widest rounded-2xl transition-colors"
                      >
                        <ZapIcon size={18} />
                        {oneClickLoading ? 'İşleniyor...' : 'Tek Tıkla Sipariş'}
                      </button>
                      {oneClickError && (
                        <p className="text-sm text-red-500 mt-1">{oneClickError}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 my-3">
                      <hr className="flex-1" />
                      <span className="text-xs text-brand-primary/40">veya</span>
                      <hr className="flex-1" />
                    </div>
                  </>
                )}

                {successOrder && (
                  <OneClickSuccessModal
                    orderId={successOrder.orderId}
                    total={successOrder.total}
                    currency={successOrder.currency}
                    onClose={clearSuccess}
                  />
                )}

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || items.length === 0}
                  className={cn(
                    'w-full py-6 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-4 group hover:gap-6 active:scale-95',
                    isCheckingOut
                      ? 'bg-brand-primary/20 cursor-not-allowed'
                      : 'bg-brand-primary hover:bg-accent',
                  )}
                >
                  {isCheckingOut ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Authorizing...
                    </span>
                  ) : (
                    <>
                      Authorize Payment{' '}
                      <ChevronRight
                        size={20}
                        className="group-hover:translate-x-2 transition-transform"
                      />
                    </>
                  )}
                </button>

                <div className="mt-8 pt-8 border-t border-brand-primary/5 grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center gap-2 text-center p-4 bg-brand-secondary/30 rounded-2xl">
                    <Lock size={16} className="text-brand-primary/40" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-brand-primary/40">
                      Secured Bay
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center p-4 bg-brand-secondary/30 rounded-2xl">
                    <Globe size={16} className="text-brand-primary/40" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-brand-primary/40">
                      Cert. Export
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Support Teaser */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-brand-primary/5 flex items-center gap-6 group hover:translate-x-2 transition-all cursor-pointer">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                  <HelpCircle size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-brand-primary">
                    Merchant Priority Support
                  </h4>
                  <p className="text-[10px] font-medium text-brand-primary/40 mt-1">
                    Chat with a Global logistics specialist.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
