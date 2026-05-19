import React, { useState } from 'react';
import { Building2, Loader2, CheckCircle2, ChevronRight, Copy, Check } from 'lucide-react';

interface BankAccount {
  bankName: string;
  iban: string;
  accountHolder: string;
  branchCode?: string;
  accountNumber?: string;
}

interface ManualPaymentProps {
  total: number;
  currency: string;
  onConfirm: () => void;
  onBack: () => void;
  onError: (msg: string) => void;
}

const DEFAULT_ACCOUNTS: BankAccount[] = [
  {
    bankName: 'Ziraat Bankası',
    iban: 'TR00 0000 0000 0000 0000 0000 00',
    accountHolder: 'Mercora Ltd. Şti.',
    branchCode: '1234',
    accountNumber: '5678901-2',
  },
  {
    bankName: 'Garanti BBVA',
    iban: 'TR00 0000 0000 0000 0000 0000 00',
    accountHolder: 'Mercora Ltd. Şti.',
    branchCode: '5678',
    accountNumber: '9012345-6',
  },
];

export function ManualPayment({ total, currency, onConfirm, onBack, onError }: ManualPaymentProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleConfirm = () => {
    if (!confirmed) {
      onError('Ödemeyi yaptıktan sonra "Havale Bildirimi Yaptım" butonuna tıklayın.');
      return;
    }
    onConfirm();
  };

  const currencySymbol = currency === 'TRY' ? '₺' : currency === 'GBP' ? '£' : '$';

  return (
    <div className="space-y-6">
      {/* Payment Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Building2 size={20} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-[#1A1033] mb-1">Havale / EFT ile Ödeme</p>
            <p className="text-[11px] text-[#1A1033]/60 font-medium leading-relaxed">
              Aşağıdaki banka hesaplarından birine <strong className="text-[#1A1033]">{currencySymbol}{total.toFixed(2)}</strong> tutarında havale/EFT yapın.
              Açıklama kısmına sipariş numaranızı yazmayı unutmayın.
            </p>
          </div>
        </div>
      </div>

      {/* Bank Accounts */}
      <div className="space-y-3">
        {DEFAULT_ACCOUNTS.map((acc, idx) => (
          <div key={idx} className="bg-[#F8F8FA] rounded-2xl p-5 border border-[#1A1033]/5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-[#1A1033]">{acc.bankName}</h4>
              <button
                type="button"
                onClick={() => copyToClipboard(acc.iban, idx)}
                className="flex items-center gap-1.5 text-[10px] font-black text-accent hover:text-accent/80 transition-colors uppercase tracking-widest"
              >
                {copiedIndex === idx ? <Check size={12} /> : <Copy size={12} />}
                {copiedIndex === idx ? 'Kopyalandı' : 'Kopyala'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1">IBAN</p>
                <p className="font-bold text-[#1A1033] break-all">{acc.iban}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1">Hesap Sahibi</p>
                <p className="font-bold text-[#1A1033]">{acc.accountHolder}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div
          onClick={() => setConfirmed(c => !c)}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 mt-0.5 ${
            confirmed ? 'bg-accent border-accent' : 'border-[#1A1033]/20 group-hover:border-accent/50'
          }`}
        >
          {confirmed && <Check size={11} className="text-white" />}
        </div>
        <span className="text-[11px] font-bold text-[#1A1033]/60 group-hover:text-[#1A1033] transition-colors leading-relaxed">
          Havale/EFT işlemini gerçekleştirdim. Ödemeyi sipariş numaramla birlikte açıklama kısmına yazarak yaptım.
        </span>
      </label>

      {/* Actions */}
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
          onClick={handleConfirm}
          disabled={!confirmed}
          className="flex-1 py-4 bg-[#1A1033] text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:bg-accent transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <CheckCircle2 size={16} />
          Havale Bildirimi Yaptım
        </button>
      </div>
    </div>
  );
}
