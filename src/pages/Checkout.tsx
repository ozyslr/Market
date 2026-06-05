import React, { FormEvent, useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  Loader2,
  MapPin,
  Search,
  Plus,
  Check,
  Download,
  Building2,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MOCK_PRODUCTS } from '@/data/mockProducts';
import { createOrder, getOrderById } from '@/services/orderService';
import { decreaseProductStock, validateCartStock } from '@/services/productService';
import { addAddress } from '@/services/userService';
import { sendOrderConfirmationEmail } from '@/services/emailService';
import { InvoiceModal } from '@/components/commerce/InvoiceModal';
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector';
import { IyzicoPayment } from '@/components/checkout/IyzicoPayment';
import { ManualPayment } from '@/components/checkout/ManualPayment';
import { AddressSelector } from '@/components/checkout/AddressSelector';
import { StripePaymentForm } from '@/components/checkout/StripePaymentForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { SavedCardSelector } from '@/components/checkout/SavedCardSelector';
import { listPaymentMethods } from '@/services/oneClickCheckoutService';
import { trackFunnelEvent } from '@/services/analyticsService';
import type { Order, PaymentMethod, ShippingAddress } from '@/types/order';
import type { SavedCard } from '@/types';
import { validateCoupon, incrementCouponUsage, calcDiscount } from '@/services/couponService';
import {
  getActiveCartCampaigns,
  calcCartCampaigns,
  getCartCampaignDiscount,
  getCartCampaignGifts,
} from '@/services/campaignService';
import type { CartCampaign } from '@/types';
import type { Address, AddressType, Coupon } from '@/types';
import { cn } from '@/lib/utils';
import { calculateTotal, MARKETS } from '@/lib/taxEngine';
import { getAllShippingRates } from '@/services/cargoService';
import type { ShippingRate, CargoProviderName } from '@/services/cargoService';
import { useExchangeRate } from '@/hooks/useExchangeRate';

const CURRENCY_SYMBOLS: Record<string, string> = { TRY: '₺', EUR: '€', USD: '$', GBP: '£' };

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise = stripeKey && !stripeKey.includes('YOUR') ? loadStripe(stripeKey) : null;

// ─── Outer checkout page ────────────────────────────────────────────────────
export function CheckoutPage() {
  const { user, firebaseUser, isAnonymous, upgradeAnonymousAccount } = useAuth();
  const { items, clearCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [isFetchingIntent, setIsFetchingIntent] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressType, setAddressType] = useState<AddressType>('home');
  const [guestEmail, setGuestEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [accountError, setAccountError] = useState('');

  // Saved cards for checkout
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [savedCardsLoading, setSavedCardsLoading] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Cart campaign auto-apply
  const [cartCampaigns, setCartCampaigns] = useState<CartCampaign[]>([]);
  const [cartCampaignDiscount, setCartCampaignDiscount] = useState(0);
  useEffect(() => {
    getActiveCartCampaigns().then((campaigns) => {
      const ccs = calcCartCampaigns(
        campaigns,
        subtotal,
        cartProducts.map((p) => p.id),
      );
      setCartCampaigns(ccs);
      setCartCampaignDiscount(getCartCampaignDiscount(ccs));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const cartGifts = getCartCampaignGifts(cartCampaigns);
  const [stockError, setStockError] = useState<string | null>(null);
  const [stockValidating, setStockValidating] = useState(false);
  const paymentMethodInitRef = useRef(false);
  const paymentMethodDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── iyzico callback handler (redirected back from iyzico payment page) ─────
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const iyzicoStatus = searchParams.get('iyzico_status');
    if (iyzicoStatus) {
      const orderId = searchParams.get('orderId') || '';
      if (iyzicoStatus === 'success' && orderId) {
        // Fetch order and show confirmation
        getOrderById(orderId).then((order) => {
          if (order) {
            setConfirmedOrderId(order.id);
            setConfirmedOrder(order);
            setStep(3);
            clearCart();
          }
        });
      } else if (iyzicoStatus === 'success') {
        setStep(3);
        clearCart();
      } else {
        // Payment failed or error
        const reason = searchParams.get('reason') || 'Ödeme başarısız oldu';
        setPaymentError(reason);
      }
      // Clean up URL params
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
    }
  }, [clearCart, searchParams]);

  // ─── Funnel event: checkout_started (once per session) ───────────────────
  useEffect(() => {
    if (sessionStorage.getItem('mcr_funnel_checkout_started')) return;
    sessionStorage.setItem('mcr_funnel_checkout_started', '1');
    trackFunnelEvent('checkout_started', {
      cartItemCount: items.length,
      subtotal,
      userId: firebaseUser?.uid ?? null,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [postcodeLookupLoading, setPostcodeLookupLoading] = useState(false);
  const [postcodeLookupError, setPostcodeLookupError] = useState('');

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: user?.name ?? '',
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: user?.country ?? 'GB',
    phone: '',
  });

  const currency = user?.currency ?? 'GBP';
  const market = MARKETS[user?.country ?? 'UK'] ?? MARKETS['UK'];
  const cartProducts = items
    .map((item) => {
      const product = MOCK_PRODUCTS.find((p) => p.id === item.productId);
      return product ? { ...product, quantity: item.quantity } : null;
    })
    .filter(Boolean) as ((typeof MOCK_PRODUCTS)[0] & { quantity: number })[];

  const subtotal = cartProducts.reduce((s, p) => s + p.price * p.quantity, 0);
  const totalDiscount = discountAmount + cartCampaignDiscount;

  // Ücretsiz kargo muafiyeti: freeShipping ürünleri kargo ağırlığına katkı vermez.
  // Faturalanabilir ağırlık yalnızca ücretli ürünlerden hesaplanır; tüm sepet
  // ücretsizse kargo bedeli 0'a sabitlenir.
  const billableShippingUnits = cartProducts.reduce(
    (s, p) => s + (p.freeShipping ? 0 : p.quantity),
    0,
  );
  const allFreeShipping = cartProducts.length > 0 && billableShippingUnits === 0;

  // ─── Dinamik kargo ücreti (market para birimine çevrilir) ────────────────────
  // useExchangeRate `${currency}/TRY` → 1 birim para biriminin kaç TL olduğu.
  const { rate: tryPerUnit } = useExchangeRate(`${currency}/TRY`);
  const [shipRates, setShipRates] = useState<ShippingRate[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<CargoProviderName | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const curSym = CURRENCY_SYMBOLS[currency] ?? currency + ' ';

  // Kargo ücretleri TL bazlıdır → market para birimine çevir.
  const convertTRY = (tryAmount: number) =>
    currency === 'TRY' ? tryAmount : tryPerUnit > 0 ? tryAmount / tryPerUnit : tryAmount;

  useEffect(() => {
    const destCity = address.city.trim();
    if (!destCity || cartProducts.length === 0) {
      setShipRates([]);
      return;
    }
    // Tüm ürünler ücretsiz kargoluysa taşıyıcı sorgulamaya gerek yok.
    if (allFreeShipping) {
      setShipRates([]);
      setSelectedCarrier(null);
      return;
    }
    const weight = Math.max(1, billableShippingUnits);
    let cancelled = false;
    setRatesLoading(true);
    getAllShippingRates('İstanbul', destCity, weight)
      .then((rates) => {
        if (cancelled) return;
        setShipRates(rates);
        // Henüz seçim yoksa en ucuzu (liste artan sıralı) öne al.
        setSelectedCarrier((prev) =>
          prev && rates.some((r) => r.provider === prev) ? prev : (rates[0]?.provider ?? null),
        );
      })
      .finally(() => {
        if (!cancelled) setRatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address.city, cartProducts.length]);

  const selectedRate = shipRates.find((r) => r.provider === selectedCarrier) ?? shipRates[0];
  // Tüm ürünler ücretsiz kargoluysa bedel 0; aksi halde seçili taşıyıcı ücreti
  // (kargo henüz yüklenmediyse önceki sabit değere (12) düş).
  const shippingInCurrency = allFreeShipping
    ? 0
    : selectedRate
      ? convertTRY(selectedRate.cost)
      : 12;
  const totals = calculateTotal(
    Math.max(0, subtotal - totalDiscount),
    shippingInCurrency,
    market,
    true,
  );

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      // Calculate subtotal for seller-scoped coupons
      const effectiveSubtotal = subtotal;
      const result = await validateCoupon(couponCode, effectiveSubtotal);
      if (result.valid && result.coupon) {
        // If coupon is seller-scoped, verify cart has products from that seller
        if (result.coupon.sellerId) {
          const sellerItems = cartProducts.filter((p) => p.sellerId === result.coupon!.sellerId);
          if (sellerItems.length === 0) {
            setCouponError('Bu kupon sepetinizdeki ürünler için geçerli değil.');
            setCouponLoading(false);
            return;
          }
          const sellerSubtotal = sellerItems.reduce((s, p) => s + p.price * p.quantity, 0);
          if (result.coupon.minOrderAmount && sellerSubtotal < result.coupon.minOrderAmount) {
            setCouponError('Bu kupon için minimum satıcı ürün tutarı karşılanmıyor.');
            setCouponLoading(false);
            return;
          }
          setDiscountAmount(calcDiscount(result.coupon, sellerSubtotal));
        } else {
          setDiscountAmount(calcDiscount(result.coupon, effectiveSubtotal));
        }
        setAppliedCoupon(result.coupon);
        setCouponCode('');
      } else {
        setCouponError(
          result.error === 'coupon.min_order'
            ? 'Minimum sipariş tutarı karşılanmıyor'
            : 'Geçersiz veya süresi dolmuş kupon',
        );
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const lookupPostcode = async () => {
    const code = address.postalCode.trim().replace(/\s/g, '');
    if (!code) return;
    setPostcodeLookupLoading(true);
    setPostcodeLookupError('');
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.status === 200 && data.result) {
        setAddress((a) => ({
          ...a,
          city: data.result.admin_district || data.result.parish || a.city,
          state: data.result.admin_county || data.result.region || a.state,
          country: 'GB',
        }));
      } else {
        setPostcodeLookupError('Posta kodu bulunamadı');
      }
    } catch {
      setPostcodeLookupError('Arama başarısız, tekrar deneyin');
    } finally {
      setPostcodeLookupLoading(false);
    }
  };

  const selectSavedAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    setShowNewAddressForm(false);
    setAddress((a) => ({
      ...a,
      fullName: addr.fullName,
      line1: addr.line1,
      line2: addr.line2 ?? '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      phone: addr.phone,
    }));
  };

  const proceedToPayment = async () => {
    // Funnel event: delivery_filled (step 1 → 2)
    trackFunnelEvent('delivery_filled', {
      hasGuestEmail: !!guestEmail,
      country: address.country,
      userId: firebaseUser?.uid ?? null,
    }).catch(() => {});

    setIsFetchingIntent(true);
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totals.total, currency: currency.toLowerCase() }),
      });
      const data = await res.json();
      setClientSecret(data.clientSecret);
      setIsMock(!!data.isMock);
      setStep(2);
    } catch {
      setClientSecret('mock_fallback');
      setIsMock(true);
      setStep(2);
    } finally {
      setIsFetchingIntent(false);
    }
  };

  // Shared order processing — validates stock, creates order, decrements stock
  const processOrder = async (
    status: 'paid' | 'pending',
    paymentIntentId: string,
  ): Promise<Order | null> => {
    if (!firebaseUser) return null;
    setStockError(null);
    setStockValidating(true);

    const orderItems = cartProducts.map((p) => ({
      productId: p.id,
      sellerId: p.sellerId,
      name: p.title,
      image: p.images[0],
      price: p.price,
      quantity: p.quantity,
      subtotal: p.price * p.quantity,
    }));

    // Validate stock BEFORE creating order
    const stockCheck = await validateCartStock(
      cartProducts.map((p) => ({ productId: p.id, quantity: p.quantity })),
    );

    if (!stockCheck.passed) {
      const failureMsgs = stockCheck.failures.map(
        (f) => `"${f.productId.slice(0, 8)}..." — mevcut: ${f.available}, istenen: ${f.requested}`,
      );
      setStockError(`Stok yetersiz! ${failureMsgs.join(' | ')}`);
      setStockValidating(false);
      return null;
    }

    try {
      const order = await createOrder({
        userId: firebaseUser.uid,
        userEmail: firebaseUser.email || guestEmail || '',
        items: orderItems,
        sellerIds: [...new Set(orderItems.map((i) => i.sellerId))],
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        tax: totals.vat,
        total: totals.total,
        currency,
        paymentMethod: paymentIntentId.startsWith('mock_pi') ? 'manual' : 'stripe',
        status,
        paymentStatus: status === 'paid' ? 'succeeded' : 'pending',
        stripePaymentIntentId: paymentIntentId,
        shippingAddress: address,
        ...(selectedCarrier ? { carrier: selectedCarrier } : {}),
      });

      // Decrement stock atomically (throws if any item has insufficient stock)
      await decreaseProductStock(
        cartProducts.map((p) => ({ productId: p.id, quantity: p.quantity })),
      );

      if (appliedCoupon) await incrementCouponUsage(appliedCoupon.id);
      if (saveAddress && !selectedAddressId) {
        await addAddress(firebaseUser.uid, {
          label: address.city || 'Ev',
          fullName: address.fullName,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          phone: address.phone,
        });
      }
      sendOrderConfirmationEmail(order);

      setStockValidating(false);
      return order;
    } catch (err: any) {
      if (err?.message?.startsWith('STOCK_ERROR:')) {
        setStockError(err.message.replace('STOCK_ERROR:', '').trim());
      } else {
        setStockError('Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
      }
      setStockValidating(false);
      return null;
    }
  };

  // Pay with a saved card (selectedCardId)
  const [savedCardPaying, setSavedCardPaying] = useState(false);
  const handleSavedCardPay = async () => {
    if (!selectedCardId || !firebaseUser) return;
    setSavedCardPaying(true);
    setPaymentError(null);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: totals.total,
          currency: currency.toLowerCase(),
          paymentMethodId: selectedCardId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPaymentError(data.error || 'Ödeme başlatılamadı');
        setSavedCardPaying(false);
        return;
      }
      if (data.requiresAction && stripePromise) {
        // 3DS challenge needed
        const stripe = await stripePromise;
        if (!stripe) {
          setPaymentError('Stripe yüklenemedi');
          setSavedCardPaying(false);
          return;
        }
        const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret);
        if (error) {
          setPaymentError(error.message || '3DS doğrulaması başarısız');
          setSavedCardPaying(false);
          return;
        }
        if (paymentIntent?.status === 'succeeded') {
          await handlePaymentSuccess(paymentIntent.id);
        } else {
          setPaymentError('Ödeme tamamlanamadı');
        }
      } else {
        // Payment succeeded immediately (no 3DS)
        await handlePaymentSuccess(data.clientSecret.split('_secret_')[0] || data.clientSecret);
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Ödeme sırasında bir hata oluştu');
    }
    setSavedCardPaying(false);
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    // Funnel event: payment_completed
    trackFunnelEvent('payment_completed', {
      paymentMethod,
      paymentIntentId,
      subtotal: totals.subtotal,
      currency,
      userId: firebaseUser?.uid ?? null,
    }).catch(() => {});

    const order = await processOrder('paid', paymentIntentId);
    if (order) {
      setConfirmedOrderId(order.id);
      setConfirmedOrder(order);
      clearCart();
      setStep(3);
    }
  };

  // Load saved cards when entering payment step
  useEffect(() => {
    if (step === 2 && firebaseUser) {
      setSavedCardsLoading(true);
      listPaymentMethods(firebaseUser).then((result) => {
        setSavedCards(result.cards);
        setSavedCardsLoading(false);
      });
    }
  }, [step, firebaseUser]);

  // Funnel event: payment_method_selected (debounced, skip initial render)
  useEffect(() => {
    if (!paymentMethodInitRef.current) {
      paymentMethodInitRef.current = true;
      return;
    }
    if (!paymentMethod) return;

    if (paymentMethodDebounceRef.current) clearTimeout(paymentMethodDebounceRef.current);
    paymentMethodDebounceRef.current = setTimeout(() => {
      trackFunnelEvent('payment_method_selected', {
        paymentMethod,
        hasSavedAddress: !!selectedAddressId,
        userId: firebaseUser?.uid ?? null,
      }).catch(() => {});
    }, 600);
    return () => {
      if (paymentMethodDebounceRef.current) clearTimeout(paymentMethodDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod]);

  const elementsOptions =
    clientSecret && !isMock
      ? { clientSecret, appearance: { theme: 'stripe' as const } }
      : undefined;

  return (
    <>
      <div className="min-h-screen bg-[#F8F8FA] pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/cart')}
              className="p-2 border border-[#1A1033]/10 rounded-xl hover:bg-[#1A1033]/5 transition-colors"
            >
              <ChevronRight size={20} className="rotate-180 text-[#1A1033]" />
            </button>
            <h1 className="text-4xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">
              Secure Checkout
            </h1>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-12 relative before:absolute before:top-1/2 before:-translate-y-1/2 before:left-0 before:w-full before:h-1 before:bg-[#1A1033]/5 before:-z-10">
            {[
              { num: 1, label: 'Delivery' },
              { num: 2, label: 'Payment' },
              { num: 3, label: 'Confirmation' },
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all ${step >= s.num ? 'bg-accent text-white shadow-lg' : 'bg-white text-[#1A1033]/30 border border-[#1A1033]/5'}`}
                >
                  {step > s.num ? <CheckCircle2 size={20} /> : s.num}
                </div>
                <span
                  className={`text-[10px] uppercase font-black tracking-widest ${step >= s.num ? 'text-[#1A1033]' : 'text-[#1A1033]/30'}`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Step 1: Shipping */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-[2.5rem] p-8 border border-[#F8F8FA] shadow-sm"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                      <Truck size={24} />
                    </div>
                    <h2 className="text-2xl font-display font-black uppercase tracking-tight text-[#1A1033]">
                      Shipping Address
                    </h2>
                  </div>
                  <form
                    className="space-y-6"
                    onSubmit={(e) => {
                      e.preventDefault();
                      // Validate guest email if anonymous
                      if (
                        isAnonymous &&
                        (!guestEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail))
                      ) {
                        return;
                      }
                      proceedToPayment();
                    }}
                  >
                    {/* Guest email field — shown only for anonymous users */}
                    {isAnonymous && (
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-2">
                          E-posta Adresi <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          autoComplete="email"
                          required
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="ornek@email.com"
                          className="w-full px-5 py-4 bg-[#F8F8FA] rounded-2xl text-sm font-bold text-[#1A1033] placeholder:text-[#1A1033]/25 outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                        />
                      </div>
                    )}

                    <AddressSelector
                      address={address}
                      onAddressChange={(updates) => setAddress((a) => ({ ...a, ...updates }))}
                      selectedAddressId={selectedAddressId}
                      onSelectSavedAddress={selectSavedAddress}
                      showNewAddressForm={showNewAddressForm}
                      onToggleNewAddressForm={() => {
                        setShowNewAddressForm((f) => !f);
                        setSelectedAddressId(null);
                      }}
                      postcodeLookupLoading={postcodeLookupLoading}
                      postcodeLookupError={postcodeLookupError}
                      onPostcodeLookup={lookupPostcode}
                      onPostcodeErrorClear={() => setPostcodeLookupError('')}
                      saveAddress={saveAddress}
                      onToggleSaveAddress={() => setSaveAddress((s) => !s)}
                      savedAddresses={(user as any)?.addresses ?? []}
                      defaultAddressId={(user as any)?.defaultAddressId ?? ''}
                      showSaveCheckbox={!!firebaseUser && !isAnonymous}
                      addressType={addressType}
                      onAddressTypeChange={setAddressType}
                    />

                    <button
                      type="submit"
                      disabled={isFetchingIntent}
                      className="w-full py-4 bg-[#1A1033] text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 mt-8 disabled:opacity-60"
                    >
                      {isFetchingIntent ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Hazırlanıyor...
                        </>
                      ) : (
                        <>
                          Ödemeye Devam Et <ChevronRight size={18} />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-[2.5rem] p-8 border border-[#F8F8FA] shadow-sm"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                      <CreditCard size={24} />
                    </div>
                    <h2 className="text-2xl font-display font-black uppercase tracking-tight text-[#1A1033]">
                      Secure Payment
                    </h2>
                  </div>

                  {/* Escrow notice */}
                  <div className="bg-[#F8F8FA] p-6 rounded-2xl mb-6 border border-[#1A1033]/5 relative overflow-hidden">
                    <ShieldCheck className="absolute -end-4 -bottom-4 text-accent/5 size-32" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-2">
                      Escrow Protection
                    </p>
                    <p className="text-sm font-medium text-[#1A1033]/60 relative z-10">
                      Your funds are held securely until the artifact is delivered and verified by
                      you.
                    </p>
                  </div>

                  {/* Saved Cards — show when user is logged in */}
                  {firebaseUser && (savedCards.length > 0 || savedCardsLoading) && (
                    <div className="mb-6">
                      <SavedCardSelector
                        cards={savedCards}
                        selectedCardId={selectedCardId}
                        onSelect={(id) => {
                          setSelectedCardId(id);
                          if (id) setPaymentMethod('stripe');
                        }}
                        loading={savedCardsLoading}
                        onCardsChange={() => {
                          if (firebaseUser)
                            listPaymentMethods(firebaseUser).then((r) => setSavedCards(r.cards));
                        }}
                      />
                    </div>
                  )}

                  {/* Saved card payment button */}
                  {selectedCardId && (
                    <div className="mb-6">
                      <button
                        type="button"
                        onClick={handleSavedCardPay}
                        disabled={savedCardPaying}
                        className="w-full py-4 bg-accent text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {savedCardPaying ? (
                          <>
                            <Loader2 size={16} className="animate-spin" /> Ödeniyor...
                          </>
                        ) : (
                          <>
                            <CreditCard size={18} /> Seçili Kartla Öde
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* New card payment method selector — only show when no saved card selected */}
                  {!selectedCardId && (
                    <div className="mb-6">
                      <PaymentMethodSelector
                        selected={paymentMethod}
                        onChange={setPaymentMethod}
                        region={user?.country || 'UK'}
                      />
                    </div>
                  )}

                  {/* Stripe Payment */}
                  {paymentMethod === 'stripe' && clientSecret && (
                    <>
                      {stripePromise && elementsOptions ? (
                        <Elements stripe={stripePromise} options={elementsOptions}>
                          <StripePaymentForm
                            total={totals.total}
                            currency={currency}
                            isMock={false}
                            shippingAddress={address}
                            onSuccess={handlePaymentSuccess}
                            onBack={() => setStep(1)}
                          />
                        </Elements>
                      ) : (
                        <StripePaymentForm
                          total={totals.total}
                          currency={currency}
                          isMock={true}
                          shippingAddress={address}
                          onSuccess={handlePaymentSuccess}
                          onBack={() => setStep(1)}
                        />
                      )}
                    </>
                  )}

                  {/* Stripe: need to init payment intent first */}
                  {paymentMethod === 'stripe' && !clientSecret && (
                    <div className="text-center py-8">
                      <button
                        type="button"
                        onClick={proceedToPayment}
                        disabled={isFetchingIntent}
                        className="py-4 px-8 bg-accent text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 mx-auto disabled:opacity-60"
                      >
                        {isFetchingIntent ? (
                          <>
                            <Loader2 size={16} className="animate-spin" /> Hazırlanıyor...
                          </>
                        ) : (
                          <>
                            Ödemeye Hazırlan <ChevronRight size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* iyzico Payment */}
                  {paymentMethod === 'iyzico' && firebaseUser && (
                    <IyzicoPayment
                      total={totals.total}
                      currency={currency}
                      orderId={`pending_${Date.now()}`}
                      userId={firebaseUser.uid}
                      userEmail={firebaseUser.email || ''}
                      userName={address.fullName}
                      buyerPhone={address.phone}
                      region={user?.country || 'UK'}
                      shippingAddress={{
                        fullName: address.fullName,
                        line1: address.line1,
                        city: address.city,
                        country: address.country,
                      }}
                      onSuccess={() => {}}
                      onBack={() => setStep(1)}
                      onError={(msg) => setPaymentError(msg)}
                    />
                  )}

                  {/* Manual EFT/Havale Payment */}
                  {paymentMethod === 'manual' && (
                    <ManualPayment
                      total={totals.total}
                      currency={currency}
                      onConfirm={async () => {
                        const order = await processOrder('pending', '');
                        if (order) {
                          setConfirmedOrderId(order.id);
                          setConfirmedOrder(order);
                          clearCart();
                          setStep(3);
                        }
                      }}
                      onBack={() => setStep(1)}
                      onError={(msg) => setPaymentError(msg)}
                    />
                  )}

                  {stockValidating && (
                    <div className="mt-4 flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-3 rounded-xl">
                      <Loader2 size={16} className="animate-spin text-blue-500" />
                      <p className="text-xs font-bold text-blue-700">Stok kontrol ediliyor...</p>
                    </div>
                  )}
                  {stockError && (
                    <div className="mt-4 bg-red-50 border-2 border-red-400 px-4 py-3 rounded-xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">
                        Stok Hatası
                      </p>
                      <p className="text-xs font-bold text-red-700">{stockError}</p>
                    </div>
                  )}
                  {paymentError && (
                    <p className="mt-4 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 rounded-xl">
                      {paymentError}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-[2.5rem] border border-[#F8F8FA] shadow-sm overflow-hidden"
                >
                  {/* Success header */}
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-10 text-center text-white">
                    <div className="w-20 h-20 bg-white/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-5 shadow-xl">
                      <CheckCircle2 size={36} />
                    </div>
                    <h2 className="text-3xl font-display font-black uppercase italic tracking-tighter mb-2">
                      Ödeme Başarılı!
                    </h2>
                    {confirmedOrderId && (
                      <p className="text-sm font-black text-white/70 uppercase tracking-widest">
                        Sipariş #{confirmedOrderId.slice(0, 12).toUpperCase()}
                      </p>
                    )}
                  </div>

                  <div className="p-8 space-y-6">
                    {/* Estimated delivery */}
                    <div className="flex items-center gap-4 bg-[#F8F8FA] rounded-2xl px-5 py-4">
                      <Truck size={20} className="text-accent shrink-0" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40">
                          Tahmini Teslimat
                        </p>
                        <p className="text-sm font-black text-[#1A1033]">
                          {(() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 3);
                            const d2 = new Date();
                            d2.setDate(d2.getDate() + 5);
                            return `${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} – ${d2.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
                          })()}
                        </p>
                      </div>
                    </div>

                    {/* Order items summary */}
                    {confirmedOrder && (
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-3">
                          Sipariş Özeti
                        </p>
                        <div className="space-y-2">
                          {confirmedOrder.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                className="w-10 h-10 rounded-xl object-contain bg-[#F8F8FA] p-1 shrink-0"
                              />
                              <span className="flex-1 text-[11px] font-bold text-[#1A1033] line-clamp-1">
                                {item.name}
                              </span>
                              <span className="text-[11px] font-black text-[#1A1033]/50">
                                ×{item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shipping address */}
                    {confirmedOrder?.shippingAddress && (
                      <div className="border-t border-[#1A1033]/5 pt-5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-2">
                          Teslimat Adresi
                        </p>
                        <p className="text-[12px] font-bold text-[#1A1033]">
                          {confirmedOrder.shippingAddress.fullName}
                        </p>
                        <p className="text-[11px] text-[#1A1033]/50 leading-relaxed">
                          {confirmedOrder.shippingAddress.line1},{' '}
                          {confirmedOrder.shippingAddress.city}{' '}
                          {confirmedOrder.shippingAddress.postalCode}
                        </p>
                      </div>
                    )}

                    {/* Email info */}
                    <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-blue-100">
                      <span className="text-base shrink-0">📧</span>
                      <p className="text-[10px] font-bold text-blue-700">
                        <strong>{user?.email || guestEmail}</strong> adresinize onay emaili
                        gönderildi.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      {confirmedOrder && (
                        <button
                          onClick={() => setShowInvoice(true)}
                          className="flex-1 py-3.5 border-2 border-[#1A1033]/10 text-[#1A1033] rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2"
                        >
                          <Download size={14} /> Fatura İndir
                        </button>
                      )}
                      <button
                        onClick={() => navigate('/profile')}
                        className="flex-1 py-3.5 bg-[#1A1033] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-accent transition-colors"
                      >
                        Siparişlerimi Gör
                      </button>
                    </div>

                    {/* Create Account prompt — shown only for anonymous guest checkout */}
                    {isAnonymous && !accountCreated && (
                      <div className="border-t border-[#1A1033]/5 pt-6 mt-4">
                        <div className="bg-accent/5 rounded-2xl p-6 border border-accent/10">
                          <h3 className="text-lg font-display font-black text-[#1A1033] mb-1">
                            Siparişini takip etmek ister misin?
                          </h3>
                          <p className="text-[11px] font-medium text-[#1A1033]/50 mb-5 leading-relaxed">
                            Hesap oluştur, siparişlerini gör, daha hızlı alışveriş yap.
                          </p>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1.5">
                                Şifre
                              </label>
                              <input
                                type="password"
                                autoComplete="new-password"
                                minLength={6}
                                value={accountPassword}
                                onChange={(e) => {
                                  setAccountPassword(e.target.value);
                                  setAccountError('');
                                }}
                                placeholder="En az 6 karakter"
                                className="w-full px-4 py-3 bg-white rounded-xl text-sm font-bold text-[#1A1033] placeholder:text-[#1A1033]/25 outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                              />
                            </div>

                            {accountError && (
                              <p className="text-[10px] font-bold text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                                {accountError}
                              </p>
                            )}

                            <button
                              type="button"
                              disabled={creatingAccount || accountPassword.length < 6}
                              onClick={async () => {
                                if (accountPassword.length < 6) {
                                  setAccountError('Şifre en az 6 karakter olmalıdır.');
                                  return;
                                }
                                setCreatingAccount(true);
                                setAccountError('');
                                try {
                                  await upgradeAnonymousAccount(guestEmail, accountPassword);
                                  setAccountCreated(true);
                                } catch (err: any) {
                                  setAccountError(
                                    err.message || 'Hesap oluşturulurken bir hata oluştu.',
                                  );
                                } finally {
                                  setCreatingAccount(false);
                                }
                              }}
                              className="w-full py-3.5 bg-accent text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {creatingAccount ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" /> Hesap
                                  Oluşturuluyor...
                                </>
                              ) : (
                                'Hesap Oluştur'
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => navigate('/')}
                              className="w-full text-[10px] font-medium text-[#1A1033]/30 hover:text-[#1A1033]/50 transition-colors py-1"
                            >
                              Şimdi değil
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Account created success message */}
                    {isAnonymous && accountCreated && (
                      <div className="border-t border-[#1A1033]/5 pt-6 mt-4">
                        <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                          <div className="flex items-center gap-3 mb-3">
                            <CheckCircle2 size={20} className="text-green-600" />
                            <h3 className="text-sm font-black text-green-800">
                              Hesabın oluşturuldu! Giriş yaptın.
                            </h3>
                          </div>
                          <p className="text-[11px] font-medium text-green-700 mb-4">
                            Siparişlerini hesabından takip edebilir, daha hızlı alışveriş
                            yapabilirsin.
                          </p>
                          <button
                            onClick={() => navigate('/profile')}
                            className="w-full py-3 bg-green-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-green-700 transition-colors"
                          >
                            Siparişlerimi Gör
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-[2.5rem] p-8 border border-[#F8F8FA] shadow-sm sticky top-32">
                <OrderSummary
                  cartProducts={cartProducts}
                  cartCampaigns={cartCampaigns}
                  cartGifts={cartGifts}
                  couponCode={couponCode}
                  onCouponCodeChange={(code) => {
                    setCouponCode(code.toUpperCase());
                    setCouponError('');
                  }}
                  couponError={couponError}
                  couponLoading={couponLoading}
                  appliedCoupon={appliedCoupon}
                  onApplyCoupon={handleApplyCoupon}
                  onRemoveCoupon={() => {
                    setAppliedCoupon(null);
                    setDiscountAmount(0);
                  }}
                  discountAmount={discountAmount}
                  cartCampaignDiscount={cartCampaignDiscount}
                  totals={totals}
                  curSym={curSym}
                  ratesLoading={ratesLoading}
                  shipRates={shipRates}
                  selectedCarrier={selectedCarrier}
                  onSelectCarrier={setSelectedCarrier}
                  convertTRY={convertTRY}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showInvoice && confirmedOrder && (
        <InvoiceModal order={confirmedOrder} onClose={() => setShowInvoice(false)} />
      )}
    </>
  );
}
