'use client';

import { useState } from 'react';
import { CreditCard, Lock, Calendar, User } from 'lucide-react';

interface IyzicoPaymentProps {
  amount: number;
  currency: string;
  onSuccess: (token: string) => void;
  onError: (error: string) => void;
}

export function IyzicoPayment({ amount, currency, onSuccess, onError }: IyzicoPaymentProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [installment, setInstallment] = useState(1);
  const [loading, setLoading] = useState(false);

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call backend to init Iyzico payment
      const res = await fetch('/api/iyzico/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          installment,
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardHolder,
          expiry,
          cvv,
        }),
      });

      const data = await res.json();
      if (data.token) {
        onSuccess(data.token);
      } else {
        onError(data.error || 'Payment failed');
      }
    } catch (err: any) {
      onError(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  const installments = [1, 2, 3, 6, 9, 12].filter(i => i <= 12);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <Lock size={14} />
        <span>Secured by Iyzico — 256-bit SSL</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
        <div className="relative">
          <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={cardNumber}
            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Card Holder</label>
        <div className="relative">
          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={cardHolder}
            onChange={e => setCardHolder(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
            placeholder="Name on card"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={expiry}
              onChange={e => setExpiry(formatExpiry(e.target.value))}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
              placeholder="MM/YY"
              maxLength={5}
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
          <input
            type="text"
            value={cvv}
            onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
            placeholder="123"
            maxLength={4}
            required
          />
        </div>
      </div>

      {/* Installment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Installment</label>
        <select
          value={installment}
          onChange={e => setInstallment(parseInt(e.target.value))}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
        >
          {installments.map(i => (
            <option key={i} value={i}>{i === 1 ? 'One Payment' : `${i} Installments`}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-purple-700 text-white rounded-xl hover:bg-purple-800 disabled:opacity-50 font-medium text-sm transition-colors"
      >
        {loading ? 'Processing...' : `Pay ${currency} ${amount.toFixed(2)}`}
      </button>
    </form>
  );
}
