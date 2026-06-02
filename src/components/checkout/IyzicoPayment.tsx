import React, { useState, useCallback } from 'react';
import {
  Loader2,
  CreditCard,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { getActiveProvidersForRegion } from '@/services/paymentProviderService';
import type { InstallmentOption } from '@/types/payment';

interface IyzicoPaymentProps {
  total: number;
  currency: string;
  orderId: string;
  userId: string;
  userEmail: string;
  userName: string;
  buyerPhone: string;
  region: string;
  shippingAddress: {
    fullName: string;
    line1: string;
    city: string;
    country: string;
  };
  onSuccess: () => void;
  onBack: () => void;
  onError: (msg: string) => void;
}

export function IyzicoPayment({
  total,
  currency,
  orderId,
  userId,
  userEmail,
  userName,
  buyerPhone,
  region,
  shippingAddress,
  onSuccess,
  onBack,
  onError,
}: IyzicoPaymentProps) {
  const [installment, setInstallment] = useState(1);
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([]);
  const [loadingInstallments, setLoadingInstallments] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [status, setStatus] = useState<'select' | 'redirecting' | 'success'>('select');

  // Load installment options for TR region
  const loadInstallments = useCallback(async () => {
    setLoadingInstallments(true);
    try {
      const res = await fetch(`/api/iyzico/installments?amount=${total}`);
      const data = await res.json();
      setInstallmentOptions(data.installments || []);
    } catch {
      // Not critical — show default 1 taksit
    } finally {
      setLoadingInstallments(false);
    }
  }, [total]);

  React.useEffect(() => {
    if (region === 'TR') loadInstallments();
  }, [region, loadInstallments]);

  const handlePay = async () => {
    setInitializing(true);
    try {
      const res = await fetch('/api/iyzico/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail,
          userName,
          total,
          currency: currency === 'TRY' ? 'TRY' : 'GBP',
          installment,
          orderId,
          items: [],
          shippingAddress,
          buyerPhone,
        }),
      });

      const data = await res.json();

      if (data.paymentPageUrl) {
        setStatus('redirecting');
        // Store order reference then redirect to iyzico
        sessionStorage.setItem(
          `iyzico_order_${orderId}`,
          JSON.stringify({
            orderId,
            token: data.token,
            total,
            currency,
          }),
        );

        // Start polling for payment completion after redirect
        // The callback URL will redirect back to /checkout?iyzico_status=...
        window.location.href = data.paymentPageUrl;
      } else if (data.isMock) {
        onError('iyzico henüz yapılandırılmamış. Lütfen stripe veya havale/EFT kullanın.');
      } else {
        onError(data.error || 'Ödeme başlatılamadı');
      }
    } catch (err: any) {
      onError(err.message || 'Bağlantı hatası');
    } finally {
      setInitializing(false);
    }
  };

  if (status === 'redirecting') {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="w-16 h-16 bg-accent/10 rounded-[1.5rem] flex items-center justify-center mx-auto">
          <Loader2 size={32} className="animate-spin text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-black text-[#1A1033] uppercase tracking-tight mb-2">
            iyzico&apos;ya Yönlendiriliyor
          </h3>
          <p className="text-sm text-[#1A1033]/50 font-medium">
            Güvenli ödeme sayfasına yönlendiriliyorsunuz...
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-[#1A1033]/30">
          <ExternalLink size={12} /> Yeni sayfada açılmazsa{' '}
          <button onClick={handlePay} className="text-accent underline">
            tıklayın
          </button>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-[1.5rem] flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h3 className="text-lg font-black text-[#1A1033] uppercase tracking-tight">
          Ödeme Başarılı!
        </h3>
        <p className="text-sm text-[#1A1033]/50">Siparişiniz alındı, teşekkür ederiz.</p>
      </div>
    );
  }

  const bankLogos = [
    { name: 'Ziraat', color: '#1A5276' },
    { name: 'İş Bankası', color: '#922B21' },
    { name: 'Garanti', color: '#1E8449' },
    { name: 'YKB', color: '#6C3483' },
    { name: 'Akbank', color: '#D4AC0D' },
    { name: 'QNB', color: '#2E4053' },
  ];

  return (
    <div className="space-y-6">
      {/* Installment Selection */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-3">
          Taksit Seçeneği
        </p>

        {/* Quick bank logos */}
        <div className="flex flex-wrap gap-2 mb-4">
          {bankLogos.map((b) => (
            <span
              key={b.name}
              className="px-3 py-1.5 bg-[#F8F8FA] rounded-lg text-[10px] font-bold text-[#1A1033]/40 border border-[#1A1033]/5"
            >
              {b.name}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 6].map((num) => {
            const isFree = num <= 1;
            const monthly = isFree ? total / num : total / num + (total * 0.01 * num) / num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => setInstallment(num)}
                className={`px-3 py-3 rounded-2xl border-2 text-center transition-all ${
                  installment === num
                    ? 'border-accent bg-accent/5 shadow-sm'
                    : 'border-[#1A1033]/10 bg-[#F8F8FA] hover:border-accent/40'
                }`}
              >
                <span
                  className={`text-sm font-black ${installment === num ? 'text-accent' : 'text-[#1A1033]'}`}
                >
                  {num}
                </span>
                <span className="block text-[9px] font-bold text-[#1A1033]/40 uppercase tracking-widest">
                  Taksit
                </span>
              </button>
            );
          })}
        </div>

        {installment > 1 && (
          <div className="mt-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-[10px] font-bold text-amber-700">
              {installment} taksit ile aylık ~
              {(total / installment + (total * 0.012 * installment) / installment).toFixed(2)}{' '}
              {currency} ödeme
            </p>
            <p className="text-[9px] text-amber-500 font-medium mt-0.5">
              *Taksit oranları bankanıza göre değişiklik gösterebilir
            </p>
          </div>
        )}
      </div>

      {/* Pay Button */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-4 bg-[#F8F8FA] text-[#1A1033] rounded-2xl font-black uppercase text-[11px] hover:bg-[#1A1033]/5 transition-all"
        >
          Geri
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={initializing}
          className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:bg-orange-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {initializing ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Başlatılıyor...
            </>
          ) : (
            <>
              <CreditCard size={16} />
              {installment > 1 ? `${installment} Taksit ile ` : ''}Öde
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
