import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import type { Order } from '@/types/order';

interface InvoiceModalProps {
  order: Order;
  onClose: () => void;
}

export function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const invoiceDate = new Date(order.createdAt ?? Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const currencySymbol = order.currency === 'GBP' ? '£' : order.currency === 'USD' ? '$' : '₺';

  return (
    <>
      {/* Print styles — hidden on screen, visible when printing */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #invoice-print-root { display: block !important; position: fixed; inset: 0; z-index: 9999; background: white; }
          #invoice-modal-overlay { display: none !important; }
        }
      `}</style>

      {/* Overlay */}
      <div id="invoice-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label="Fatura" onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-[#1A1033]/5">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#1A1033]">Fatura / Invoice</h2>
            <div className="flex items-center gap-2">
              <button onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/90 transition-colors">
                <Printer size={13} /> Yazdır / PDF
              </button>
              <button onClick={onClose} aria-label="Kapat" className="p-2 text-[#1A1033]/30 hover:text-[#1A1033] transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Invoice Content */}
          <div id="invoice-print-root" ref={printRef} className="px-8 py-6 space-y-6">
            {/* Logo + Invoice Number */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">
                  BENIM OLAN
                </h1>
                <p className="text-[10px] font-bold text-[#1A1033]/40 uppercase tracking-widest mt-0.5">
                  Global Marketplace
                </p>
              </div>
              <div className="text-end">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">Fatura No</p>
                <p className="text-lg font-black text-[#1A1033]">#{order.id.slice(0, 12).toUpperCase()}</p>
                <p className="text-[10px] font-bold text-[#1A1033]/40 mt-1">{invoiceDate}</p>
              </div>
            </div>

            {/* Bill To / Ship To */}
            <div className="grid grid-cols-2 gap-6 py-5 border-t border-b border-[#1A1033]/5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/30 mb-2">Faturalanan</p>
                <p className="text-sm font-black text-[#1A1033]">{order.shippingAddress?.fullName ?? '—'}</p>
                <p className="text-[11px] font-bold text-[#1A1033]/50">{order.userEmail}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/30 mb-2">Teslimat Adresi</p>
                {order.shippingAddress ? (
                  <>
                    <p className="text-sm font-black text-[#1A1033]">{order.shippingAddress.fullName}</p>
                    <p className="text-[11px] font-bold text-[#1A1033]/50 leading-relaxed">
                      {order.shippingAddress.line1}<br />
                      {order.shippingAddress.city}, {order.shippingAddress.postalCode}<br />
                      {order.shippingAddress.country}
                    </p>
                  </>
                ) : <p className="text-[11px] text-[#1A1033]/40">—</p>}
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#1A1033]/10">
                  <th className="text-start py-2 text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 pb-3">Ürün</th>
                  <th className="text-center py-2 text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 pb-3">Adet</th>
                  <th className="text-end py-2 text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 pb-3">Birim</th>
                  <th className="text-end py-2 text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 pb-3">Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1033]/5">
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-3 font-bold text-[#1A1033] text-[12px] max-w-[200px]">
                      <span className="line-clamp-2">{item.name}</span>
                    </td>
                    <td className="py-3 text-center font-black text-[#1A1033]/60 text-[12px]">{item.quantity}</td>
                    <td className="py-3 text-end font-black text-[#1A1033] text-[12px]">
                      {currencySymbol}{item.price.toFixed(2)}
                    </td>
                    <td className="py-3 text-end font-black text-[#1A1033] text-[12px]">
                      {currencySymbol}{item.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="ms-auto w-64 space-y-2 pt-4 border-t border-[#1A1033]/10">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#1A1033]/50 font-bold">Ara Toplam</span>
                <span className="font-black text-[#1A1033]">{currencySymbol}{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#1A1033]/50 font-bold">Kargo</span>
                <span className="font-black text-[#1A1033]">{currencySymbol}{order.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#1A1033]/50 font-bold">KDV / VAT</span>
                <span className="font-black text-[#1A1033]">{currencySymbol}{order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-3 border-t-2 border-[#1A1033]/10">
                <span className="font-black text-[#1A1033] uppercase tracking-widest">TOPLAM</span>
                <span className="text-xl font-display font-black text-accent">{currencySymbol}{order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment info */}
            <div className="bg-[#F8F8FA] rounded-2xl px-5 py-4 mt-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-[#1A1033]/40">Ödeme Durumu</span>
                <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  {order.paymentStatus === 'succeeded' ? 'Ödendi' : order.paymentStatus}
                </span>
              </div>
              {order.stripePaymentIntentId && (
                <p className="text-[9px] text-[#1A1033]/30 mt-1 font-bold">
                  Referans: {order.stripePaymentIntentId}
                </p>
              )}
            </div>

            {/* Footer */}
            <p className="text-center text-[9px] text-[#1A1033]/20 font-bold uppercase tracking-widest pt-4 border-t border-[#1A1033]/5">
              Benim Olan Global Marketplace · Bu belge bilgilendirme amaçlıdır · benimolan.com
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
