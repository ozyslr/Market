'use client';

import { X, Download, Printer, FileText } from 'lucide-react';
import type { Order } from '@/types/order';

interface InvoiceModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceModal({ order, isOpen, onClose }: InvoiceModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const subtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const shipping = order.shipping || 0;
  const tax = order.tax || 0;
  const total = order.total || subtotal + shipping + tax;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:bg-white" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto print:shadow-none print:rounded-none print:max-h-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 print:hidden">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText size={20} className="text-purple-700" />
            Invoice
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Print">
              <Printer size={18} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-black italic text-[#1A1033]">MERCORA</h1>
              <p className="text-sm text-gray-500 mt-1">Invoice</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">#{order.id?.slice(-8).toUpperCase()}</p>
              <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Bill To</h4>
              <p className="text-sm font-medium text-gray-900">{order.shippingAddress?.fullName || order.userEmail}</p>
              <p className="text-xs text-gray-500">{order.shippingAddress?.line1}</p>
              {order.shippingAddress?.line2 && <p className="text-xs text-gray-500">{order.shippingAddress.line2}</p>}
              <p className="text-xs text-gray-500">{order.shippingAddress?.city}, {order.shippingAddress?.postalCode}</p>
              <p className="text-xs text-gray-500">{order.shippingAddress?.country}</p>
            </div>
            <div className="text-right">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ship To</h4>
              <p className="text-sm font-medium text-gray-900">{order.shippingAddress?.fullName}</p>
              <p className="text-xs text-gray-500">{order.shippingAddress?.line1}</p>
              {order.shippingAddress?.line2 && <p className="text-xs text-gray-500">{order.shippingAddress.line2}</p>}
              <p className="text-xs text-gray-500">{order.shippingAddress?.city}, {order.shippingAddress?.postalCode}</p>
              <p className="text-xs text-gray-500">{order.shippingAddress?.country}</p>
            </div>
          </div>

          {/* Items */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2">Item</th>
                <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2">Qty</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2">Price</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3 text-sm text-gray-900">{item.name || item.productId}</td>
                  <td className="py-3 text-sm text-gray-700 text-center">{item.quantity}</td>
                  <td className="py-3 text-sm text-gray-700 text-right">£{item.price.toFixed(2)}</td>
                  <td className="py-3 text-sm font-medium text-gray-900 text-right">£{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>£{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>{shipping > 0 ? `£${shipping.toFixed(2)}` : 'FREE'}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax</span>
                  <span>£{tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-2">
                <span>Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
            <p>Mercora Ltd. — 123 Commerce Street, London, EC1A 1BB, United Kingdom</p>
            <p className="mt-1">VAT: GB123456789 | Company: 12345678</p>
          </div>
        </div>
      </div>
    </div>
  );
}
