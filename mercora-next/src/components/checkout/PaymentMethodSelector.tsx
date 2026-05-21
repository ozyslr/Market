'use client';

import { CreditCard, Building, Banknote } from 'lucide-react';

export type PaymentMethodType = 'stripe' | 'iyzico' | 'manual' | 'paypal';

interface PaymentMethod {
  id: PaymentMethodType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const METHODS: PaymentMethod[] = [
  { id: 'stripe', label: 'Credit Card', description: 'Pay with Visa, Mastercard, or Amex', icon: <CreditCard size={20} /> },
  { id: 'iyzico', label: 'Iyzico', description: 'Local payment (TR)', icon: <Building size={20} /> },
  { id: 'manual', label: 'Bank Transfer', description: 'Pay via EFT / wire transfer', icon: <Banknote size={20} /> },
];

interface PaymentMethodSelectorProps {
  value: PaymentMethodType;
  onChange: (method: PaymentMethodType) => void;
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 text-sm">Payment Method</h3>
      <div className="grid gap-3">
        {METHODS.map(method => (
          <button
            key={method.id}
            onClick={() => onChange(method.id)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
              value === method.id
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className={`p-2 rounded-lg ${value === method.id ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
              {method.icon}
            </div>
            <div>
              <p className={`font-medium text-sm ${value === method.id ? 'text-purple-700' : 'text-gray-900'}`}>
                {method.label}
              </p>
              <p className="text-xs text-gray-500">{method.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
