'use client';

import { Building, Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface ManualPaymentProps {
  amount: number;
  currency: string;
  orderId?: string;
  onConfirmed: () => void;
}

const BANK_ACCOUNTS = [
  { bank: 'Garanti BBVA', branch: 'Istanbul Levent', account: 'TR12 0006 2000 1234 5678 9000 01', holder: 'Mercora Ltd.' },
  { bank: 'İş Bankası', branch: 'Istanbul Merkez', account: 'TR34 0006 4000 9876 5432 1000 02', holder: 'Mercora Ltd.' },
];

export function ManualPayment({ amount, currency, orderId, onConfirmed }: ManualPaymentProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <Building size={20} className="text-amber-600" />
        <div>
          <p className="text-sm font-medium text-amber-800">Bank Transfer</p>
          <p className="text-xs text-amber-600">Please transfer the exact amount. Orders are processed after payment confirmation.</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-xs text-gray-500 mb-1">Total Amount to Transfer</p>
        <p className="text-3xl font-bold text-gray-900">{currency} {amount.toFixed(2)}</p>
        {orderId && <p className="text-xs text-gray-400 mt-1">Reference: {orderId}</p>}
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 text-sm">Bank Accounts</h4>
        {BANK_ACCOUNTS.map((acc, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm text-gray-900">{acc.bank}</p>
              <span className="text-xs text-gray-400">{acc.branch}</span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <code className="text-xs text-gray-700 truncate font-mono">{acc.account}</code>
              <button
                onClick={() => copyToClipboard(acc.account, i)}
                className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                aria-label="Copy IBAN"
              >
                {copiedIndex === i ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-gray-400" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">Holder: {acc.holder}</p>
          </div>
        ))}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-xs text-blue-700">
          After making the transfer, please email your receipt to <strong>payments@mercora.com</strong> with your order reference.
          Your order will be processed within 1-2 business days.
        </p>
      </div>

      <button
        onClick={onConfirmed}
        className="w-full py-3 bg-purple-700 text-white rounded-xl hover:bg-purple-800 font-medium text-sm transition-colors"
      >
        I Will Transfer Later
      </button>
    </div>
  );
}
