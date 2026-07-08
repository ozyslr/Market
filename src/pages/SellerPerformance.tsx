import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  XCircle,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Loader2,
  Award,
  Zap,
  Package,
  DollarSign,
  ArrowUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { calcSellerPerformance, SellerPerformanceScore } from '@/services/sellerRatingService';
import { getSellerTierStatus, getNextTier, SellerTierStatus } from '@/services/sellerTierService';

const LEVEL_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: any }
> = {
  platinum: {
    label: 'Platin',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: Trophy,
  },
  gold: {
    label: 'Altın',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: Award,
  },
  silver: {
    label: 'Gümüş',
    color: 'text-zinc-500',
    bg: 'bg-zinc-50',
    border: 'border-zinc-200',
    icon: ShieldCheck,
  },
  bronze: {
    label: 'Bronz',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: Star,
  },
};

function ScoreBar({
  label,
  score,
  icon: Icon,
  color,
}: {
  label: string;
  score: number;
  icon: any;
  color: string;
}) {
  const pct = Math.min(100, Math.max(0, score));
  const barColor =
    pct >= 80
      ? 'bg-green-500'
      : pct >= 60
        ? 'bg-blue-500'
        : pct >= 40
          ? 'bg-amber-500'
          : 'bg-red-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
            <Icon size={16} className="text-white" />
          </div>
          <span className="text-xs font-bold text-brand-primary">{label}</span>
        </div>
        <span className="text-sm font-black text-brand-primary">{score}</span>
      </div>
      <div className="h-2 bg-[#F8F8FA] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', barColor)}
        />
      </div>
    </div>
  );
}

function GaugeRing({ score, size = 180 }: { score: number; size?: number }) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? '#22c55e' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F8F8FA"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-display font-black text-brand-primary">{score}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40">
          / 100
        </span>
      </div>
    </div>
  );
}

export function SellerPerformance() {
  const { firebaseUser } = useAuth();
  const [perf, setPerf] = useState<SellerPerformanceScore | null>(null);
  const [tierStatus, setTierStatus] = useState<SellerTierStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    Promise.all([
      calcSellerPerformance(firebaseUser.uid),
      getSellerTierStatus(firebaseUser.uid, 0, 0, 50), // Will be updated after perf loads
    ]).then(([perfData, tierData]) => {
      setPerf(perfData);
      setTierStatus(tierData);
      setLoading(false);
      // Reload tier status with actual score
      getSellerTierStatus(firebaseUser.uid, 0, 0, perfData.overall).then(setTierStatus);
    });
  }, [firebaseUser]);

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );

  if (!perf)
    return (
      <div className="text-center py-24">
        <p className="text-sm font-bold text-brand-primary/30">Henüz performans verisi yok</p>
      </div>
    );

  const levelCfg = LEVEL_CONFIG[perf.level];
  const LevelIcon = levelCfg.icon;

  const metrics = [
    { label: 'Ürün Puanı', score: perf.ratingScore, icon: Star, color: 'bg-amber-500' },
    { label: 'Kargo Hızı', score: perf.shipSpeedScore, icon: Truck, color: 'bg-blue-500' },
    { label: 'Uyumluluk', score: perf.complianceScore, icon: ShieldCheck, color: 'bg-green-500' },
    { label: 'Yanıt Oranı', score: perf.responseRate, icon: MessageSquare, color: 'bg-purple-500' },
  ];

  const riskItems = [
    { label: 'İptal Oranı', value: perf.cancelRate, icon: XCircle, danger: perf.cancelRate > 10 },
    { label: 'İade Oranı', value: perf.returnRate, icon: RotateCcw, danger: perf.returnRate > 15 },
  ];

  return (
    <div className="min-h-screen bg-[#F8F8FA] p-6 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary">
              Mağaza Performansı
            </h1>
            <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest mt-1">
              Puanınız sipariş, kargo ve müşteri memnuniyetine göre hesaplanır
            </p>
          </div>
        </div>

        {/* Top Row: Gauge + Level Badge */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gauge */}
          <div className="lg:col-span-1 bg-white rounded-[2.5rem] p-8 border border-brand-primary/5 flex flex-col items-center justify-center">
            <GaugeRing score={perf.overall} />
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mt-4">
              Genel Performans
            </p>
          </div>

          {/* Level Badge */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-brand-primary/5">
            <div className="flex items-center gap-6 h-full">
              <div
                className={cn(
                  'w-28 h-28 rounded-[2rem] flex items-center justify-center border-2 shrink-0',
                  levelCfg.bg,
                  levelCfg.border,
                  levelCfg.color,
                )}
              >
                <LevelIcon size={52} />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40 mb-1">
                  Mağaza Seviyesi
                </p>
                <p className={cn('text-3xl font-display font-black', levelCfg.color)}>
                  {levelCfg.label}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  {(['bronze', 'silver', 'gold', 'platinum'] as const).map((level) => {
                    const reached =
                      ['bronze', 'silver', 'gold', 'platinum'].indexOf(perf.level) >=
                      ['bronze', 'silver', 'gold', 'platinum'].indexOf(level);
                    return (
                      <div
                        key={level}
                        className={cn(
                          'flex-1 h-2 rounded-full',
                          reached
                            ? levelCfg.bg.replace('bg-', 'bg-').replace('50', '500') +
                                ' bg-opacity-80'
                            : 'bg-[#F8F8FA]',
                        )}
                        style={
                          reached
                            ? {
                                backgroundColor:
                                  level === 'platinum'
                                    ? '#9333ea'
                                    : level === 'gold'
                                      ? '#f59e0b'
                                      : level === 'silver'
                                        ? '#71717a'
                                        : '#ea580c',
                              }
                            : {}
                        }
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-1">
                  {['bronze', 'silver', 'gold', 'platinum'].map((level) => (
                    <span
                      key={level}
                      className="text-[8px] font-black uppercase tracking-widest text-brand-primary/30"
                    >
                      {level}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] font-bold text-brand-primary/50 mt-4">
                  {perf.level === 'platinum'
                    ? 'En yüksek seviyedesiniz! Tüm avantajlardan yararlanıyorsunuz.'
                    : perf.level === 'gold'
                      ? 'Platin için 90 puana ulaşmanız gerekiyor.'
                      : perf.level === 'silver'
                        ? 'Altın seviyesi için 75 puana ulaşın.'
                        : 'Gümüş seviyesi için 60 puana ulaşın.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tier Status Card */}
        {tierStatus && (
          <div
            className={cn(
              'bg-white rounded-[2.5rem] p-8 border-2',
              tierStatus.currentTier === 'platinum'
                ? 'border-purple-200'
                : tierStatus.currentTier === 'gold'
                  ? 'border-amber-200'
                  : tierStatus.currentTier === 'silver'
                    ? 'border-zinc-200'
                    : tierStatus.currentTier === 'bronze'
                      ? 'border-orange-200'
                      : 'border-zinc-200',
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary/60">
                Kademe Durumu
              </h3>
              {tierStatus.nextTier && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-brand-primary/40">
                  <ArrowUp size={12} className="text-accent" />
                  Sonraki: {tierStatus.nextTier}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-[#F8F8FA] rounded-2xl p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40 mb-1">
                  Ürün Limiti
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-display font-black text-brand-primary">
                    {tierStatus.productCount}
                  </span>
                  <span className="text-xs text-brand-primary/40">
                    / {tierStatus.tierConfig.maxProducts.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      tierStatus.atCap ? 'bg-red-500' : 'bg-accent',
                    )}
                    style={{
                      width: `${Math.min(100, (tierStatus.productCount / tierStatus.tierConfig.maxProducts) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="bg-[#F8F8FA] rounded-2xl p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40 mb-1">
                  Komisyon
                </p>
                <p className="text-xl font-display font-black text-green-600">
                  %{tierStatus.tierConfig.commissionRate}
                </p>
              </div>
              <div className="bg-[#F8F8FA] rounded-2xl p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40 mb-1">
                  Aylık Ücret
                </p>
                <p className="text-xl font-display font-black text-brand-primary">
                  {tierStatus.tierConfig.monthlyFee > 0
                    ? `${tierStatus.tierConfig.monthlyFee} ₺`
                    : 'Ücretsiz'}
                </p>
              </div>
              <div className="bg-[#F8F8FA] rounded-2xl p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40 mb-1">
                  Kalan Slot
                </p>
                <p
                  className={cn(
                    'text-xl font-display font-black',
                    tierStatus.remainingSlots < 10 ? 'text-red-500' : 'text-brand-primary',
                  )}
                >
                  {tierStatus.remainingSlots}
                </p>
              </div>
              <div className="bg-[#F8F8FA] rounded-2xl p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40 mb-1">
                  Sonraki Seviye
                </p>
                {tierStatus.scoreToNextTier != null ? (
                  <p className="text-xl font-display font-black text-accent">
                    {tierStatus.scoreToNextTier} puan
                  </p>
                ) : (
                  <p className="text-sm font-black text-green-600">Maks.</p>
                )}
              </div>
            </div>
            {tierStatus.recommendation && (
              <div className="mt-4 bg-accent/5 border border-accent/10 rounded-2xl p-4">
                <p className="text-xs font-bold text-brand-primary">{tierStatus.recommendation}</p>
              </div>
            )}
          </div>
        )}

        {/* Score Breakdown */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-brand-primary/5">
          <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary/60 mb-6">
            Puan Detayı
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metrics.map((m) => (
              <ScoreBar
                key={m.label}
                label={m.label}
                score={m.score}
                icon={m.icon}
                color={m.color}
              />
            ))}
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {riskItems.map((item) => (
            <div
              key={item.label}
              className={cn(
                'bg-white rounded-[2rem] p-6 border transition-all',
                item.danger ? 'border-red-200' : 'border-brand-primary/5',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      item.danger ? 'bg-red-50 text-red-500' : 'bg-[#F8F8FA] text-brand-primary/40',
                    )}
                  >
                    <item.icon size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-brand-primary">{item.label}</p>
                    <p className="text-[10px] text-brand-primary/40">
                      {item.danger ? 'İyileştirme gerekli' : 'Normal seviyede'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {item.danger ? (
                    <TrendingUp size={16} className="text-red-500" />
                  ) : (
                    <TrendingDown size={16} className="text-green-500" />
                  )}
                  <span
                    className={cn(
                      'text-2xl font-display font-black',
                      item.danger ? 'text-red-500' : 'text-brand-primary',
                    )}
                  >
                    %{item.value}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Improvement Tips */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-brand-primary/5">
          <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary/60 mb-4 flex items-center gap-2">
            <Zap size={16} className="text-accent" /> İyileştirme Önerileri
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {perf.shipSpeedScore < 70 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">
                  Kargo Hızı
                </p>
                <p className="text-xs text-blue-700">
                  Siparişleri 24 saat içinde kargoya vererek puanınızı artırın.
                </p>
              </div>
            )}
            {perf.cancelRate > 10 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">
                  İptal Oranı
                </p>
                <p className="text-xs text-red-700">
                  Stok yönetiminizi güncelleyerek iptal oranını %10&apos;un altına düşürün.
                </p>
              </div>
            )}
            {perf.returnRate > 15 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">
                  İade Oranı
                </p>
                <p className="text-xs text-amber-700">
                  Ürün açıklamalarını ve görsellerini iyileştirerek iade oranını azaltın.
                </p>
              </div>
            )}
            {perf.ratingScore < 70 && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">
                  Ürün Puanı
                </p>
                <p className="text-xs text-purple-700">
                  Müşterilerden yorum bırakmalarını isteyin, ürün kalitesini artırın.
                </p>
              </div>
            )}
            {perf.overall >= 80 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 md:col-span-2">
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">
                  Harika gidiyorsunuz!
                </p>
                <p className="text-xs text-green-700">
                  Performansınız çok iyi seviyede. Bu seviyeyi koruyarak daha fazla görünürlük
                  kazanın.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
