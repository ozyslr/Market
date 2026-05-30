import React, { useState, useEffect } from 'react';
import { ShieldCheck, ExternalLink, Loader2, Search, AlertTriangle, CheckCircle2, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getProductCertificate, verifyProduct, getExplorerUrl } from '@/services/blockchainService';
import type { ProductCertificate } from '@/services/blockchainService';

interface Props {
  productId: string;
  productTitle: string;
  productImage: string;
  sellerId: string;
  brand: string;
  originCountry: string;
  compact?: boolean;
}

export function AuthenticityBadge({ productId, productTitle, productImage, sellerId, brand, originCountry, compact }: Props) {
  const [certificate, setCertificate] = useState<ProductCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const cert = await getProductCertificate(productId);
        if (!cancelled) setCertificate(cert);
      } catch { /* silent */ } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [productId]);

  const handleVerify = async () => {
    if (!certificate) return;
    setVerifying(true);
    try {
      const result = await verifyProduct(certificate.id);
      setVerified(result.authentic);
    } catch {
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
        <Loader2 size={14} className="animate-spin text-zinc-400" />
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sertifika kontrol ediliyor...</span>
      </div>
    );
  }

  if (!certificate) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
        <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
          Bu ürün için blockchain sertifikası bulunamadı
        </span>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg cursor-help group"
        title={`Blok zincir ile doğrulandı · Sertifika: ${certificate.metadata.serialNumber}`}
        onClick={() => setExpanded(!expanded)}
      >
        <ShieldCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
        <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
          Blockchain Korumalı
        </span>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute top-full start-0 mt-2 z-20 w-72 p-4 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <CertificateDetail
                certificate={certificate}
                verifying={verifying}
                verified={verified}
                onVerify={handleVerify}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center">
            <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-200 uppercase tracking-wider">
              Blockchain Korumalı
            </h4>
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {certificate.network} üzerinde doğrulandı
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <QrCode size={16} className="text-emerald-400" />
          <span className="text-[9px] font-mono font-bold text-emerald-500">{certificate.metadata.serialNumber}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="px-3 py-2 bg-white/60 dark:bg-black/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Blok Numarası</p>
          <p className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-200">#{certificate.blockNumber.toLocaleString()}</p>
        </div>
        <div className="px-3 py-2 bg-white/60 dark:bg-black/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Menşei</p>
          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">{certificate.metadata.originCountry}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <a
          href={getExplorerUrl(certificate)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
        >
          <ExternalLink size={14} />
          Blokta Gör
        </a>
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all disabled:opacity-50"
        >
          {verifying ? (
            <Loader2 size={14} className="animate-spin" />
          ) : verified === true ? (
            <CheckCircle2 size={14} className="text-emerald-500" />
          ) : (
            <Search size={14} />
          )}
          {verifying ? 'Doğrulanıyor...' : verified === true ? 'Doğrulandı' : verified === false ? 'Doğrula' : 'Doğrula'}
        </button>
      </div>

      {verified === false && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-xs font-bold text-red-500 flex items-center gap-1"
        >
          <AlertTriangle size={12} /> Sertifika doğrulanamadı. Bu ürün orijinal olmayabilir.
        </motion.p>
      )}
    </div>
  );
}

function CertificateDetail({ certificate, verifying, verified, onVerify }: {
  certificate: ProductCertificate;
  verifying: boolean;
  verified: boolean | null;
  onVerify: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} className="text-emerald-500" />
        <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase">
          Dijital Sertifika
        </span>
      </div>
      <div className="space-y-1.5 text-[10px]">
        <div className="flex justify-between">
          <span className="text-zinc-400">Seri No</span>
          <span className="font-mono font-bold text-zinc-700 dark:text-zinc-200">{certificate.metadata.serialNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Blok</span>
          <span className="font-mono font-bold text-zinc-700 dark:text-zinc-200">#{certificate.blockNumber.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Ağ</span>
          <span className="font-bold text-zinc-700 dark:text-zinc-200">{certificate.network}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <a
          href={getExplorerUrl(certificate)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider"
        >
          <ExternalLink size={12} /> Blokta Gör
        </a>
        <button
          onClick={onVerify}
          disabled={verifying}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-emerald-200 dark:border-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300"
        >
          {verifying ? <Loader2 size={12} className="animate-spin" /> : verified === true ? <CheckCircle2 size={12} /> : <Search size={12} />}
          {verifying ? '...' : verified === true ? 'Doğrulandı' : 'Doğrula'}
        </button>
      </div>
    </div>
  );
}
