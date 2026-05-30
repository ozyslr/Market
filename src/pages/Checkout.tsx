import React, { FormEvent, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Truck, CreditCard, ChevronRight, CheckCircle2, Loader2, MapPin, Search, Plus, Check, Download, Building2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MOCK_PRODUCTS } from '@/mockData';
import { createOrder, getOrderById } from '@/services/orderService';
import { decreaseProductStock, validateCartStock } from '@/services/productService';
import { addAddress } from '@/services/userService';
import { sendOrderConfirmationEmail } from '@/services/emailService';
import { InvoiceModal } from '@/components/commerce/InvoiceModal';
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector';
import { IyzicoPayment } from '@/components/checkout/IyzicoPayment';
import { ManualPayment } from '@/components/checkout/ManualPayment';
import type { Order, PaymentMethod, ShippingAddress } from '@/types/order';
import { validateCoupon, incrementCouponUsage, calcDiscount } from '@/services/couponService';
import { getActiveCartCampaigns, calcCartCampaigns, getCartCampaignDiscount, getCartCampaignGifts } from '@/services/campaignService';
import type { CartCampaign } from '@/types';
import type { Address, Coupon } from '@/types';
import { cn } from '@/lib/utils';
import { calculateTotal, MARKETS } from '@/lib/taxEngine';
import { getAllShippingRates, getAvailableCarriers } from '@/services/cargoService';
import type { ShippingRate, CargoProviderName } from '@/services/cargoService';
import { useExchangeRate } from '@/hooks/useExchangeRate';

const CARRIER_LABELS: Record<string, string> = Object.fromEntries(
  getAvailableCarriers().map(c => [c.name, c.label]),
);
const CURRENCY_SYMBOLS: Record<string, string> = { TRY: '₺', EUR: '€', USD: '$', GBP: '£' };

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise =
  stripeKey && !stripeKey.includes('YOUR') ? loadStripe(stripeKey) : null;

// ─── Inner payment form (must live inside <Elements>) ──────────────────────
interface PaymentFormProps {
  total: number;
  currency: string;
  isMock: boolean;
  shippingAddress: ShippingAddress;
  onSuccess: (paymentIntentId: string) => void;
  onBack: () => void;
}

function PaymentForm({ total, currency, isMock, shippingAddress, onSuccess, onBack }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    if (isMock || !stripe || !elements) {
      // Mock mode: simulate success after short delay
      setTimeout(() => {
        setIsProcessing(false);
        onSuccess('mock_pi_' + Math.random().toString(36).substring(7));
      }, 1500);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed. Please try again.');
      setIsProcessing(false);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else {
      setError('Unexpected payment status. Please contact support.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isMock ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800 font-medium">
          <strong className="block mb-1 uppercase text-xs tracking-widest">Demo Mode</strong>
          Add your Stripe keys to <code className="bg-amber-100 px-1 rounded">.env</code> to enable real payments.
          This checkout will simulate a successful payment.
        </div>
      ) : (
        <PaymentElement />
      )}

      {error && (
        <p className="text-sm text-red-600 font-medium bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="flex items-center gap-4 mt-8">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-4 bg-[#F8F8FA] text-[#1A1033] rounded-2xl font-black uppercase text-[11px] hover:bg-[#1A1033]/5 transition-all"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isProcessing}
          className="flex-1 py-4 bg-accent text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <><Loader2 size={16} className="animate-spin" /> Processing...</>
          ) : (
            <>Pay {currency.toUpperCase() === 'GBP' ? '£' : currency.toUpperCase() === 'USD' ? '$' : '₺'}{total.toFixed(2)} Securely</>
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Outer checkout page ────────────────────────────────────────────────────
export function CheckoutPage() {
  const { user, firebaseUser } = useAuth();
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

  // Cart campaign auto-apply
  const [cartCampaigns, setCartCampaigns] = useState<CartCampaign[]>([]);
  const [cartCampaignDiscount, setCartCampaignDiscount] = useState(0);
  useEffect(() => {
    getActiveCartCampaigns().then(campaigns => {
      const ccs = calcCartCampaigns(campaigns, subtotal, cartProducts.map(p => p.id));
      setCartCampaigns(ccs);
      setCartCampaignDiscount(getCartCampaignDiscount(ccs));
    });
  }, []);
  const cartGifts = getCartCampaignGifts(cartCampaigns);
  const [stockError, setStockError] = useState<string | null>(null);
  const [stockValidating, setStockValidating] = useState(false);

  // ─── iyzico callback handler (redirected back from iyzico payment page) ─────
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const iyzicoStatus = searchParams.get('iyzico_status');
    if (iyzicoStatus) {
      const orderId = searchParams.get('orderId') || '';
      if (iyzicoStatus === 'success' && orderId) {
        // Fetch order and show confirmation
        getOrderById(orderId).then(order => {
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
    .map(item => {
      const product = MOCK_PRODUCTS.find(p => p.id === item.productId);
      return product ? { ...product, quantity: item.quantity } : null;
    })
    .filter(Boolean) as (typeof MOCK_PRODUCTS[0] & { quantity: number })[];

  const subtotal = cartProducts.reduce((s, p) => s + p.price * p.quantity, 0);
  const totalDiscount = discountAmount + cartCampaignDiscount;

  // Ücretsiz kargo muafiyeti: freeShipping ürünleri kargo ağırlığına katkı vermez.
  // Faturalanabilir ağırlık yalnızca ücretli ürünlerden hesaplanır; tüm sepet
  // ücretsizse kargo bedeli 0'a sabitlenir.
  const billableShippingUnits = cartProducts.reduce((s, p) => s + (p.freeShipping ? 0 : p.quantity), 0);
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
    if (!destCity || cartProducts.length === 0) { setShipRates([]); return; }
    // Tüm ürünler ücretsiz kargoluysa taşıyıcı sorgulamaya gerek yok.
    if (allFreeShipping) { setShipRates([]); setSelectedCarrier(null); return; }
    const weight = Math.max(1, billableShippingUnits);
    let cancelled = false;
    setRatesLoading(true);
    getAllShippingRates('İstanbul', destCity, weight)
      .then(rates => {
        if (cancelled) return;
        setShipRates(rates);
        // Henüz seçim yoksa en ucuzu (liste artan sıralı) öne al.
        setSelectedCarrier(prev =>
          prev && rates.some(r => r.provider === prev) ? prev : rates[0]?.provider ?? null);
      })
      .finally(() => { if (!cancelled) setRatesLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address.city, cartProducts.length]);

  const selectedRate = shipRates.find(r => r.provider === selectedCarrier) ?? shipRates[0];
  // Tüm ürünler ücretsiz kargoluysa bedel 0; aksi halde seçili taşıyıcı ücreti
  // (kargo henüz yüklenmediyse önceki sabit değere (12) düş).
  const shippingInCurrency = allFreeShipping ? 0 : (selectedRate ? convertTRY(selectedRate.cost) : 12);
  const totals = calculateTotal(Math.max(0, subtotal - totalDiscount), shippingInCurrency, market, true);

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
          const sellerItems = cartProducts.filter(p => p.sellerId === result.coupon!.sellerId);
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
        setCouponError(result.error === 'coupon.min_order' ? 'Minimum sipariş tutarı karşılanmıyor' : 'Geçersiz veya süresi dolmuş kupon');
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
        setAddress(a => ({
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
    setAddress(a => ({
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
  const processOrder = async (status: 'paid' | 'pending', paymentIntentId: string): Promise<Order | null> => {
    if (!firebaseUser) return null;
    setStockError(null);
    setStockValidating(true);

    const orderItems = cartProducts.map(p => ({
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
      cartProducts.map(p => ({ productId: p.id, quantity: p.quantity }))
    );

    if (!stockCheck.passed) {
      const failureMsgs = stockCheck.failures.map(f =>
        `"${f.productId.slice(0,8)}..." — mevcut: ${f.available}, istenen: ${f.requested}`
      );
      setStockError(`Stok yetersiz! ${failureMsgs.join(' | ')}`);
      setStockValidating(false);
      return null;
    }

    try {
      const order = await createOrder({
        userId: firebaseUser.uid,
        userEmail: firebaseUser.email ?? '',
        items: orderItems,
        sellerIds: [...new Set(orderItems.map(i => i.sellerId))],
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
        cartProducts.map(p => ({ productId: p.id, quantity: p.quantity }))
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

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    const order = await processOrder('paid', paymentIntentId);
    if (order) {
      setConfirmedOrderId(order.id);
      setConfirmedOrder(order);
      clearCart();
      setStep(3);
    }
  };

  const elementsOptions = clientSecret && !isMock
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
          {[{ num: 1, label: 'Delivery' }, { num: 2, label: 'Payment' }, { num: 3, label: 'Confirmation' }].map(s => (
            <div key={s.num} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all ${step >= s.num ? 'bg-accent text-white shadow-lg' : 'bg-white text-[#1A1033]/30 border border-[#1A1033]/5'}`}>
                {step > s.num ? <CheckCircle2 size={20} /> : s.num}
              </div>
              <span className={`text-[10px] uppercase font-black tracking-widest ${step >= s.num ? 'text-[#1A1033]' : 'text-[#1A1033]/30'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">

            {/* Step 1: Shipping */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[2.5rem] p-8 border border-[#F8F8FA] shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                    <Truck size={24} />
                  </div>
                  <h2 className="text-2xl font-display font-black uppercase tracking-tight text-[#1A1033]">Shipping Address</h2>
                </div>
                <form className="space-y-6" onSubmit={e => { e.preventDefault(); proceedToPayment(); }}>
                  {/* Saved Addresses */}
                  {(() => {
                    const savedAddresses: Address[] = (user as any)?.addresses ?? [];
                    const defaultAddressId: string = (user as any)?.defaultAddressId ?? '';
                    if (savedAddresses.length === 0) return null;
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/50">Kayıtlı Adreslerim</p>
                          <button type="button" onClick={() => { setShowNewAddressForm(f => !f); setSelectedAddressId(null); }}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-accent hover:text-accent/80 transition-colors">
                            <Plus size={12} /> Yeni Adres
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {savedAddresses.map(addr => (
                            <button key={addr.id} type="button" onClick={() => selectSavedAddress(addr)}
                              className={cn(
                                'relative text-start px-4 py-3.5 rounded-2xl border-2 transition-all text-xs group',
                                selectedAddressId === addr.id
                                  ? 'border-accent bg-accent/5 shadow-sm'
                                  : 'border-[#1A1033]/10 bg-[#F8F8FA] hover:border-accent/40'
                              )}>
                              {selectedAddressId === addr.id && (
                                <span className="absolute top-3 end-3 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                  <Check size={10} className="text-white" />
                                </span>
                              )}
                              <div className="flex items-center gap-1.5 mb-1">
                                <MapPin size={10} className="text-accent shrink-0" />
                                <span className="font-black text-[#1A1033] text-[11px]">{addr.label}</span>
                                {addr.id === defaultAddressId && (
                                  <span className="ms-1 text-[8px] font-black uppercase tracking-widest bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">Varsayılan</span>
                                )}
                              </div>
                              <p className="text-[#1A1033]/50 font-medium leading-tight">{addr.line1}</p>
                              <p className="text-[#1A1033]/40 font-medium">{addr.city}, {addr.postalCode} · {addr.country}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* New address form — shown when no saved addresses or user clicked "+ Yeni Adres" */}
                  {(((user as any)?.addresses ?? []).length === 0 || showNewAddressForm || !selectedAddressId) && (
                    <div className="space-y-4">
                      {((user as any)?.addresses ?? []).length > 0 && showNewAddressForm && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 pt-2 border-t border-[#1A1033]/5">Yeni Teslimat Adresi</p>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">Ad Soyad</label>
                          <input required type="text" value={address.fullName}
                            onChange={e => setAddress(a => ({ ...a, fullName: e.target.value }))}
                            className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">Telefon</label>
                          <input required type="tel" value={address.phone}
                            onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))}
                            className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">Sokak / Cadde</label>
                        <input required type="text" value={address.line1}
                          onChange={e => setAddress(a => ({ ...a, line1: e.target.value }))}
                          placeholder="123 Node Ave"
                          className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
                      </div>

                      {/* Postal Code + Lookup */}
                      <div>
                        <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">Posta Kodu</label>
                        <div className="flex gap-2">
                          <input required type="text" value={address.postalCode}
                            onChange={e => { setAddress(a => ({ ...a, postalCode: e.target.value })); setPostcodeLookupError(''); }}
                            placeholder="SW1A 1AA"
                            className="flex-1 px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none uppercase" />
                          <button type="button" onClick={lookupPostcode} disabled={postcodeLookupLoading || !address.postalCode.trim()}
                            title="Adresi otomatik doldur"
                            className="px-4 py-3 bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent/90 disabled:opacity-40 transition-colors flex items-center gap-1.5 shrink-0">
                            {postcodeLookupLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                            Bul
                          </button>
                        </div>
                        {postcodeLookupError && <p className="text-[10px] text-red-500 font-bold mt-1">{postcodeLookupError}</p>}
                        <p className="text-[9px] text-[#1A1033]/30 font-bold mt-1 uppercase tracking-widest">UK posta kodu → şehir/bölge otomatik dolar</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">Şehir</label>
                          <input required type="text" value={address.city}
                            onChange={e => setAddress(a => ({ ...a, city: e.target.value }))}
                            className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#1A1033] uppercase tracking-widest mb-2">Bölge / İlçe</label>
                          <input type="text" value={address.state}
                            onChange={e => setAddress(a => ({ ...a, state: e.target.value }))}
                            className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
                        </div>
                      </div>

                      {/* Save address checkbox */}
                      {user && (
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div onClick={() => setSaveAddress(s => !s)}
                            className={cn(
                              'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0',
                              saveAddress ? 'bg-accent border-accent' : 'border-[#1A1033]/20 group-hover:border-accent/50'
                            )}>
                            {saveAddress && <Check size={11} className="text-white" />}
                          </div>
                          <span className="text-[11px] font-bold text-[#1A1033]/60 group-hover:text-[#1A1033] transition-colors">
                            Bu adresi profilime kaydet
                          </span>
                        </label>
                      )}
                    </div>
                  )}

                  <button type="submit" disabled={isFetchingIntent}
                    className="w-full py-4 bg-[#1A1033] text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 mt-8 disabled:opacity-60">
                    {isFetchingIntent
                      ? <><Loader2 size={16} className="animate-spin" /> Hazırlanıyor...</>
                      : <>Ödemeye Devam Et <ChevronRight size={18} /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[2.5rem] p-8 border border-[#F8F8FA] shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                    <CreditCard size={24} />
                  </div>
                  <h2 className="text-2xl font-display font-black uppercase tracking-tight text-[#1A1033]">Secure Payment</h2>
                </div>

                {/* Escrow notice */}
                <div className="bg-[#F8F8FA] p-6 rounded-2xl mb-6 border border-[#1A1033]/5 relative overflow-hidden">
                  <ShieldCheck className="absolute -end-4 -bottom-4 text-accent/5 size-32" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-2">Escrow Protection</p>
                  <p className="text-sm font-medium text-[#1A1033]/60 relative z-10">Your funds are held securely until the artifact is delivered and verified by you.</p>
                </div>

                {/* Payment Method Selector */}
                <div className="mb-6">
                  <PaymentMethodSelector
                    selected={paymentMethod}
                    onChange={setPaymentMethod}
                    region={user?.country || 'UK'}
                  />
                </div>

                {/* Stripe Payment */}
                {paymentMethod === 'stripe' && clientSecret && (
                  <>
                    {stripePromise && elementsOptions ? (
                      <Elements stripe={stripePromise} options={elementsOptions}>
                        <PaymentForm
                          total={totals.total}
                          currency={currency}
                          isMock={false}
                          shippingAddress={address}
                          onSuccess={handlePaymentSuccess}
                          onBack={() => setStep(1)}
                        />
                      </Elements>
                    ) : (
                      <PaymentForm
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
                      {isFetchingIntent
                        ? <><Loader2 size={16} className="animate-spin" /> Hazırlanıyor...</>
                        : <>Ödemeye Hazırlan <ChevronRight size={18} /></>}
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
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Stok Hatası</p>
                    <p className="text-xs font-bold text-red-700">{stockError}</p>
                  </div>
                )}
                {paymentError && (
                  <p className="mt-4 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 rounded-xl">{paymentError}</p>
                )}
              </motion.div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] border border-[#F8F8FA] shadow-sm overflow-hidden">
                {/* Success header */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-10 text-center text-white">
                  <div className="w-20 h-20 bg-white/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-5 shadow-xl">
                    <CheckCircle2 size={36} />
                  </div>
                  <h2 className="text-3xl font-display font-black uppercase italic tracking-tighter mb-2">Ödeme Başarılı!</h2>
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
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40">Tahmini Teslimat</p>
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
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-3">Sipariş Özeti</p>
                      <div className="space-y-2">
                        {confirmedOrder.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <img src={item.image} alt={item.name} referrerPolicy="no-referrer" loading="lazy"
                              className="w-10 h-10 rounded-xl object-contain bg-[#F8F8FA] p-1 shrink-0" />
                            <span className="flex-1 text-[11px] font-bold text-[#1A1033] line-clamp-1">{item.name}</span>
                            <span className="text-[11px] font-black text-[#1A1033]/50">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shipping address */}
                  {confirmedOrder?.shippingAddress && (
                    <div className="border-t border-[#1A1033]/5 pt-5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-2">Teslimat Adresi</p>
                      <p className="text-[12px] font-bold text-[#1A1033]">{confirmedOrder.shippingAddress.fullName}</p>
                      <p className="text-[11px] text-[#1A1033]/50 leading-relaxed">
                        {confirmedOrder.shippingAddress.line1}, {confirmedOrder.shippingAddress.city} {confirmedOrder.shippingAddress.postalCode}
                      </p>
                    </div>
                  )}

                  {/* Email info */}
                  <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-blue-100">
                    <span className="text-base shrink-0">📧</span>
                    <p className="text-[10px] font-bold text-blue-700">
                      <strong>{user?.email}</strong> adresinize onay emaili gönderildi.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    {confirmedOrder && (
                      <button onClick={() => setShowInvoice(true)}
                        className="flex-1 py-3.5 border-2 border-[#1A1033]/10 text-[#1A1033] rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2">
                        <Download size={14} /> Fatura İndir
                      </button>
                    )}
                    <button onClick={() => navigate('/profile')}
                      className="flex-1 py-3.5 bg-[#1A1033] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-accent transition-colors">
                      Siparişlerimi Gör
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2.5rem] p-8 border border-[#F8F8FA] shadow-sm sticky top-32">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1033] mb-6">Order Summary</h3>
              <div className="space-y-3 mb-6">
                {cartProducts.map(p => (
                  <div key={p.id} className="flex justify-between text-xs gap-2">
                    <span className="text-[#1A1033]/50 font-medium truncate">{p.title} ×{p.quantity}</span>
                    <span className="font-black text-[#1A1033] shrink-0">£{(p.price * p.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {/* Cart Campaign Discounts (auto-applied) */}
              {cartCampaigns.length > 0 && (
                <div className="mb-4 space-y-2">
                  {cartCampaigns.map((cc, idx) => (
                    <div key={idx} className="bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-green-700">{cc.campaign.name}</span>
                        <span className="text-[10px] font-black text-green-600">-{cc.discountAmount.toFixed(2)} ₺</span>
                      </div>
                    </div>
                  ))}
                  {cartGifts.map((gift, idx) => (
                    <div key={idx} className="bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 flex items-center gap-2">
                      <span>🎁</span>
                      <span className="text-[10px] font-black text-purple-700">{gift.name} x{gift.quantity}</span>
                      <span className="text-[9px] text-purple-500 ms-auto">Hediye</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Coupon Code */}
              <div className="mb-4">
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Kupon kodu"
                      className="flex-1 px-3 py-2 bg-[#F8F8FA] rounded-xl text-xs font-bold outline-none border border-transparent focus:border-accent/20 uppercase"
                    />
                    <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-50 hover:scale-105 transition-all">
                      {couponLoading ? '...' : 'Uygula'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                    <span className="text-xs font-black text-green-700">{appliedCoupon.code} — -{discountAmount.toFixed(2)} ₺ indirim</span>
                    <button onClick={() => { setAppliedCoupon(null); setDiscountAmount(0); }} className="text-[10px] text-green-700/60 hover:text-red-500 font-bold">✕</button>
                  </div>
                )}
                {couponError && <p className="text-[10px] text-red-500 font-bold mt-1">{couponError}</p>}
              </div>

              {/* Kargo seçimi (dinamik, market para birimine çevrilmiş) */}
              {(ratesLoading || shipRates.length > 0) && (
                <div className="mb-4 pt-4 border-t border-[#1A1033]/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/50 mb-3 flex items-center gap-1.5">
                    <Truck size={12} className="text-accent" /> Kargo Seçimi
                  </p>
                  {ratesLoading ? (
                    <div className="flex items-center gap-2 px-3 py-3 bg-[#F8F8FA] rounded-xl">
                      <Loader2 size={14} className="animate-spin text-accent" />
                      <span className="text-[11px] font-bold text-[#1A1033]/50">Kargo ücretleri hesaplanıyor...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {shipRates.map(rate => {
                        const active = selectedCarrier === rate.provider;
                        return (
                          <button key={rate.provider} type="button"
                            onClick={() => setSelectedCarrier(rate.provider)}
                            className={cn(
                              'w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border-2 transition-all text-start',
                              active ? 'border-accent bg-accent/5' : 'border-[#1A1033]/10 bg-[#F8F8FA] hover:border-accent/40'
                            )}>
                            <span className="flex items-center gap-2 min-w-0">
                              <span className={cn(
                                'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                                active ? 'border-accent bg-accent' : 'border-[#1A1033]/20'
                              )}>
                                {active && <Check size={9} className="text-white" />}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[11px] font-black text-[#1A1033] truncate">{CARRIER_LABELS[rate.provider] ?? rate.provider}</span>
                                <span className="block text-[9px] font-bold text-[#1A1033]/40">{rate.estimatedDays} iş günü</span>
                              </span>
                            </span>
                            <span className="text-[11px] font-black text-[#1A1033] shrink-0">{curSym}{convertTRY(rate.cost).toFixed(2)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4 mb-6 pt-4 border-t border-[#1A1033]/5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#1A1033]/40 font-bold">Subtotal</span>
                  <span className="font-black text-[#1A1033]">£{totals.subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-bold">Kupon İndirimi</span>
                    <span className="font-black text-green-600">-{discountAmount.toFixed(2)} ₺</span>
                  </div>
                )}
                {cartCampaignDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-bold">Sepet Kampanyası</span>
                    <span className="font-black text-green-600">-{cartCampaignDiscount.toFixed(2)} ₺</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#1A1033]/40 font-bold">Logistics</span>
                  <span className="font-black text-[#1A1033]">{curSym}{totals.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#1A1033]/40 font-bold">VAT</span>
                  <span className="font-black text-[#1A1033]">£{totals.vat.toFixed(2)}</span>
                </div>
              </div>
              <div className="pt-6 border-t border-[#1A1033]/5 flex justify-between items-center mb-8">
                <span className="text-xs font-black uppercase tracking-widest text-[#1A1033]">Total</span>
                <span className="text-2xl font-display font-black text-accent">£{totals.total.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3 bg-[#F8F8FA] p-4 rounded-xl">
                <ShieldCheck className="text-[#1A1033]/30 shrink-0" size={20} />
                <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 leading-relaxed">
                  256-bit Node Encryption active. Multi-sig escrow holding.
                </p>
              </div>
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
