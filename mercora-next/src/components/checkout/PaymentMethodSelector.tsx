'use client';

/**
 * Enhanced Payment Method Selector (STREAM A)
 * Supports:
 * - Stripe (Card, Apple Pay, Google Pay, IDEAL, Bancontact)
 * - Iyzico (Turkish payments, installments)
 * - Cash on Delivery (COD)
 * - Bank Transfer fallback
 */

import React, { useState, useCallback, useMemo } from 'react';
import { CreditCard, Apple, Smartphone, Building, Banknote, Truck } from 'lucide-react';

export type PaymentMethodType =
  | 'card'
  | 'apple_pay'
  | 'google_pay'
  | 'ideal'
  | 'bancontact'
  | 'installment'
  | 'cod'
  | 'bank_transfer';

interface PaymentMethod {
  id: PaymentMethodType;
  label: string;
  description: string;
  icon: React.ReactNode;
  regions: string[]; // which regions support this
  isExpress?: boolean; // Apple/Google Pay are express
  color?: string;
}

// Detect browser capabilities
const supportsApplePay = (): boolean => {
  return typeof window !== 'undefined' && 'ApplePaySession' in window;
};

const supportsGooglePay = (): boolean => {
  return typeof window !== 'undefined' && 'google' in window;
};

interface PaymentMethodSelectorProps {
  value: PaymentMethodType;
  onChange: (method: PaymentMethodType) => void;
  region: string; // TR, EU, UK, US, etc
  amount?: number;
  onApplePayClick?: () => void;
  onGooglePayClick?: () => void;
  loading?: boolean;
}

export function PaymentMethodSelector({
  value,
  onChange,
  region,
  amount,
  onApplePayClick,
  onGooglePayClick,
  loading = false,
}: PaymentMethodSelectorProps) {
  // All available methods with regional support
  const allMethods: PaymentMethod[] = [
    {
      id: 'card',
      label: 'Credit/Debit Card',
      description: 'Visa, Mastercard, Amex',
      icon: <CreditCard size={20} />,
      regions: ['TR', 'EU', 'UK', 'US', 'GLOBAL'],
      color: '#635BFF',
    },
    {
      id: 'apple_pay',
      label: 'Apple Pay',
      description: 'Fast, secure, one-click payment',
      icon: <Apple size={20} />,
      regions: ['GLOBAL'],
      isExpress: true,
      color: '#000000',
    },
    {
      id: 'google_pay',
      label: 'Google Pay',
      description: 'Quick & secure payment',
      icon: <Smartphone size={20} />,
      regions: ['GLOBAL'],
      isExpress: true,
      color: '#4285F4',
    },
    {
      id: 'ideal',
      label: 'iDEAL',
      description: 'Dutch online banking',
      icon: <Building size={20} />,
      regions: ['EU', 'NL'],
    },
    {
      id: 'bancontact',
      label: 'Bancontact',
      description: 'Belgian payment method',
      icon: <Building size={20} />,
      regions: ['EU', 'BE'],
    },
    {
      id: 'installment',
      label: 'Installments',
      description: '3-12 months with Iyzico',
      icon: <Banknote size={20} />,
      regions: ['TR'],
      color: '#FF9900',
    },
    {
      id: 'cod',
      label: 'Cash on Delivery',
      description: 'Pay when you receive the order',
      icon: <Truck size={20} />,
      regions: ['TR', 'EU'],
      color: '#34A853',
    },
    {
      id: 'bank_transfer',
      label: 'Bank Transfer',
      description: 'Direct bank transfer (EFT)',
      icon: <Banknote size={20} />,
      regions: ['TR', 'EU', 'UK'],
    },
  ];

  // Filter methods based on region and browser capabilities
  const availableMethods = useMemo(() => {
    return allMethods.filter((method) => {
      if (!method.regions.includes(region) && !method.regions.includes('GLOBAL')) {
        return false;
      }
      if (method.id === 'apple_pay' && !supportsApplePay()) {
        return false;
      }
      if (method.id === 'google_pay' && !supportsGooglePay()) {
        return false;
      }
      return true;
    });
  }, [region]);

  // Separate express methods (Apple/Google Pay)
  const expressMethods = availableMethods.filter((m) => m.isExpress);
  const regularMethods = availableMethods.filter((m) => !m.isExpress);

  const handleMethodClick = useCallback(
    (methodId: PaymentMethodType) => {
      onChange(methodId);
    },
    [onChange]
  );

  const handleApplePayExpress = useCallback(() => {
    onChange('apple_pay');
    onApplePayClick?.();
  }, [onChange, onApplePayClick]);

  const handleGooglePayExpress = useCallback(() => {
    onChange('google_pay');
    onGooglePayClick?.();
  }, [onChange, onGooglePayClick]);

  return (
    <div className="space-y-4">
      {/* Express Payment Methods */}
      {expressMethods.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 text-sm">Express Checkout</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {expressMethods.map((method) => (
              <button
                key={method.id}
                onClick={
                  method.id === 'apple_pay'
                    ? handleApplePayExpress
                    : handleGooglePayExpress
                }
                disabled={loading}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all font-medium text-sm ${
                  method.id === 'apple_pay'
                    ? 'border-black bg-black text-white hover:bg-gray-900'
                    : 'border-blue-500 bg-blue-50 text-blue-700 hover:border-blue-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {method.icon}
                {method.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      {expressMethods.length > 0 && regularMethods.length > 0 && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or pay another way</span>
          </div>
        </div>
      )}

      {/* Regular Payment Methods */}
      {regularMethods.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">
            {expressMethods.length > 0 ? 'Other Methods' : 'Payment Method'}
          </h3>
          <div className="grid gap-3">
            {regularMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => handleMethodClick(method.id)}
                disabled={loading}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                  value === method.id
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    value === method.id
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {method.icon}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-medium text-sm ${
                      value === method.id ? 'text-purple-700' : 'text-gray-900'
                    }`}
                  >
                    {method.label}
                  </p>
                  <p className="text-xs text-gray-500">{method.description}</p>
                </div>
                <div className="hidden sm:block">
                  <input
                    type="radio"
                    name="payment-method"
                    value={method.id}
                    checked={value === method.id}
                    onChange={() => handleMethodClick(method.id)}
                    className="w-4 h-4 text-purple-600 cursor-pointer"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="pt-2 border-t">
        {value === 'cod' && (
          <p className="text-xs text-green-700 bg-green-50 p-2 rounded">
            💰 You will pay <strong>when your order is delivered</strong>. Free for orders over $50.
          </p>
        )}
        {value === 'installment' && (
          <p className="text-xs text-orange-700 bg-orange-50 p-2 rounded">
            📅 Choose your installment plan on the next step. Available for Turkish cards.
          </p>
        )}
        {(value === 'card' || value === 'ideal' || value === 'bancontact') && (
          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            🔒 Your payment information is secure and encrypted with SSL/TLS.
          </p>
        )}
        {(value === 'apple_pay' || value === 'google_pay') && (
          <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded">
            ⚡ Fast checkout using your device's payment method.
          </p>
        )}
      </div>
    </div>
  );
}
