import React from 'react';
import { Link } from 'react-router-dom';
import { Webhook, Key, Bot, Truck, FileText, Bell, Shield, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const INTEGRATIONS = [
  { name: 'Satıcı REST API', desc: 'REST API endpointleri — ürün, sipariş, stok yönetimi', icon: Key, path: '/seller/api-keys', status: 'active', color: 'text-blue-500 bg-blue-50' },
  { name: 'Webhook Sistemi', desc: '15 event tipi, HMAC imza, retry mekanizması', icon: Webhook, path: '/admin', tab: 'webhooks', status: 'active', color: 'text-purple-500 bg-purple-50' },
  { name: 'AI Moderasyon', desc: 'Gemini 3 Flash ile ürün ve yorum otomatik filtreleme', icon: Bot, path: '/admin', tab: 'products', status: 'active', color: 'text-pink-500 bg-pink-50' },
  { name: 'Kargo Entegrasyonu', desc: 'PTT, Yurtiçi, Aras, MNG, Sürat, UPS, DHL', icon: Truck, path: '/seller/orders', status: 'active', color: 'text-green-500 bg-green-50' },
  { name: 'E-Fatura (UBL-TR)', desc: 'GİB uyumlu UBL-TR 2.1 formatı, otomatik fatura', icon: FileText, path: '/seller/invoices', status: 'active', color: 'text-orange-500 bg-orange-50' },
  { name: 'Push Notification', desc: 'Firebase Cloud Messaging — anlık bildirim', icon: Bell, path: '/admin', tab: 'settings', status: 'active', color: 'text-red-500 bg-red-50' },
  { name: 'Blockchain Doğrulama', desc: 'Ürün sertifikası — sahteciliğe karşı blockchain kaydı', icon: Shield, path: '/seller/certificates', status: 'active', color: 'text-teal-500 bg-teal-50' },
];

export function AdminIntegrations() {
  return (
    <div className="bg-white rounded-[3.5rem] p-8 lg:p-12 border border-[#F8F8FA] shadow-sm space-y-6">
      <div>
        <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">Entegrasyonlar</h3>
        <p className="text-[10px] font-bold text-[#1A1033]/40 uppercase tracking-widest mt-1">Aktif sistem entegrasyonları ve API bağlantıları</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATIONS.map(integration => (
          <div key={integration.name} className="bg-[#F8F8FA] rounded-2xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", integration.color)}>
                <integration.icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-black text-[#1A1033] text-sm">{integration.name}</p>
                  <span className="w-2 h-2 bg-green-500 rounded-full" title="Aktif" />
                </div>
                <p className="text-[10px] text-[#1A1033]/40 mt-1">{integration.desc}</p>
              </div>
              <ExternalLink size={14} className="text-[#1A1033]/20 shrink-0 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
