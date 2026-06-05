import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Upload,
  FileText,
  ChevronRight,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  submitApplication,
  hasAllRequiredDocs,
  type KycDocument,
} from '@/services/sellerApplicationService';
import { recordEvent } from '@/services/sellerOnboardingService';

const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_DOC_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const CATEGORIES = [
  'Elektronik',
  'Moda',
  'Ev & Yaşam',
  'Spor & Outdoor',
  'Aksesuar',
  'Oyuncak & Hobi',
  'Kozmetik',
  'Kitap',
  'Müzik & Enstrüman',
  'Otomotiv',
  'Bahçe',
  'Sanat & El İşi',
];

const EXPERIENCE_OPTIONS = [
  { value: '0-1', label: '0-1 yıl (Yeni başladım)' },
  { value: '1-3', label: '1-3 yıl' },
  { value: '3-5', label: '3-5 yıl' },
  { value: '5+', label: '5+ yıl (Uzman)' },
];

const MONTHLY_TARGETS = [
  { value: '0-10000', label: '₺0 - ₺10.000' },
  { value: '10000-50000', label: '₺10.000 - ₺50.000' },
  { value: '50000-200000', label: '₺50.000 - ₺200.000' },
  { value: '200000+', label: '₺200.000+' },
];

type DocType = 'identity' | 'tax_certificate' | 'bank_iban';

interface DocSlotConfig {
  docType: DocType;
  label: string;
  hint: string;
}

const DOC_SLOTS: DocSlotConfig[] = [
  {
    docType: 'identity',
    label: 'Identity Document',
    hint: 'National ID, passport, or driving licence',
  },
  {
    docType: 'tax_certificate',
    label: 'Tax Certificate',
    hint: 'Tax registration document or certificate',
  },
  {
    docType: 'bank_iban',
    label: 'Bank / IBAN Document',
    hint: 'Bank statement or IBAN confirmation letter',
  },
];

type UploadState = 'empty' | 'uploading' | 'uploaded' | 'error';

interface DocSlotState {
  state: UploadState;
  doc?: KycDocument;
  error?: string;
  progress?: number;
}

// ─── DocUploadSlot ────────────────────────────────────────────────────────────

interface DocUploadSlotProps {
  config: DocSlotConfig;
  slotState: DocSlotState;
  onFileSelect: (docType: DocType, file: File) => void;
  onReplace: (docType: DocType) => void;
}

function DocUploadSlot({ config, slotState, onFileSelect, onReplace }: DocUploadSlotProps) {
  const inputId = `doc-upload-${config.docType}`;
  const { state, doc, error, progress } = slotState;

  const truncateName = (name: string) => {
    const dot = name.lastIndexOf('.');
    const ext = dot > 0 ? name.slice(dot) : '';
    const base = dot > 0 ? name.slice(0, dot) : name;
    return base.length > 28 ? base.slice(0, 28) + '…' + ext : name;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-4 transition-all',
        state === 'empty' && 'border-dashed border-gray-300 dark:border-zinc-600',
        state === 'uploading' && 'border-violet-500',
        state === 'uploaded' && 'border-green-500',
        state === 'error' && 'border-red-500',
      )}
    >
      <p className="text-xs font-bold text-brand-primary dark:text-white mb-1">{config.label}</p>

      {state === 'empty' && (
        <label
          htmlFor={inputId}
          className="flex flex-col items-center justify-center gap-2 py-4 cursor-pointer"
        >
          <Upload size={24} className="text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-zinc-400 text-center">
            {config.hint}
          </span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            Accepted: JPG, PNG, PDF · Max 5 MB
          </span>
          <input
            id={inputId}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) onFileSelect(config.docType, file);
            }}
          />
        </label>
      )}

      {state === 'uploading' && (
        <div className="py-3 space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-violet-600" />
            <span className="text-xs text-violet-600 font-medium">Uploading…</span>
          </div>
          <div className="h-1 w-full bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-600 rounded-full transition-all duration-300"
              style={{ width: `${progress ?? 30}%` }}
            />
          </div>
        </div>
      )}

      {state === 'uploaded' && doc && (
        <div className="flex items-center gap-2 py-2">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-brand-primary dark:text-white truncate">
              {truncateName(doc.fileName)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onReplace(config.docType)}
            className="text-xs text-gray-500 hover:text-violet-600 font-medium shrink-0"
          >
            Replace
          </button>
          <input
            id={`${inputId}-replace`}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) onFileSelect(config.docType, file);
            }}
          />
        </div>
      )}

      {state === 'error' && (
        <div className="flex items-center gap-2 py-2">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 flex-1">{error ?? 'Upload failed. Try again.'}</p>
          <label
            htmlFor={inputId}
            className="text-xs text-violet-600 cursor-pointer font-medium shrink-0"
          >
            Retry
            <input
              id={inputId}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) onFileSelect(config.docType, file);
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}

// ─── SellerApplication (main component) ──────────────────────────────────────

export function SellerApplication() {
  const { user, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // KYC doc slots: one per docType
  const [docSlots, setDocSlots] = useState<Record<DocType, DocSlotState>>({
    identity: { state: 'empty' },
    tax_certificate: { state: 'empty' },
    bank_iban: { state: 'empty' },
  });

  // Stripe Identity verification state
  const [identityStatus, setIdentityStatus] = useState<
    'not_started' | 'pending' | 'verified' | 'requires_input'
  >('not_started');
  const [identityLoading, setIdentityLoading] = useState(false);

  const [form, setForm] = useState({
    storeName: '',
    phone: '',
    origin: 'TR',
    taxId: '',
    businessRegistration: '',
    website: '',
    productCategories: [] as string[],
    monthlySalesTarget: '',
    experience: '',
  });

  const set = (k: keyof typeof form, v: unknown) => setForm((p) => ({ ...p, [k]: v }));
  const toggleCategory = (cat: string) =>
    setForm((p) => ({
      ...p,
      productCategories: p.productCategories.includes(cat)
        ? p.productCategories.filter((c) => c !== cat)
        : [...p.productCategories, cat],
    }));

  // Collect uploaded KycDocument[] from slots
  const kycDocuments: KycDocument[] = Object.values(docSlots)
    .filter((s) => s.state === 'uploaded' && s.doc)
    .map((s) => s.doc!);

  const allDocsUploaded =
    docSlots.identity.state === 'uploaded' &&
    docSlots.tax_certificate.state === 'uploaded' &&
    docSlots.bank_iban.state === 'uploaded';

  // ── Upload handler: POST /api/kyc/upload-url then PUT signed URL ──────────
  const handleFileSelect = async (docType: DocType, file: File) => {
    if (!user || !firebaseUser) return;

    // Client-side size guard
    if (file.size > MAX_DOC_BYTES) {
      setDocSlots((p) => ({
        ...p,
        [docType]: { state: 'error', error: 'File must be 5 MB or smaller.' },
      }));
      return;
    }
    if (!ACCEPTED_DOC_TYPES.includes(file.type)) {
      setDocSlots((p) => ({
        ...p,
        [docType]: { state: 'error', error: 'Only JPG, PNG, or PDF files are accepted.' },
      }));
      return;
    }

    setDocSlots((p) => ({ ...p, [docType]: { state: 'uploading', progress: 20 } }));

    try {
      const token = await firebaseUser.getIdToken();

      // Step 1: Get signed upload URL
      const urlRes = await fetch('/api/kyc/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sellerId: user.id, docType, fileName: file.name }),
      });
      if (!urlRes.ok) {
        const err = await urlRes.json().catch(() => ({ error: 'Upload URL request failed' }));
        throw new Error(err.error ?? 'Upload URL request failed');
      }
      const { uploadUrl, storagePath } = await urlRes.json();

      setDocSlots((p) => ({ ...p, [docType]: { state: 'uploading', progress: 50 } }));

      // Step 2: PUT file to signed URL
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: file,
      });
      if (!putRes.ok) throw new Error('File upload to storage failed');

      setDocSlots((p) => ({
        ...p,
        [docType]: {
          state: 'uploaded',
          doc: {
            docType,
            storagePath,
            uploadedAt: new Date().toISOString(),
            fileName: file.name,
          },
        },
      }));
    } catch (err: unknown) {
      setDocSlots((p) => ({
        ...p,
        [docType]: {
          state: 'error',
          error: (err as Error).message ?? 'Upload failed. Please try again.',
        },
      }));
    }
  };

  const handleReplace = (docType: DocType) => {
    // Reset slot to empty so the file input becomes visible again
    setDocSlots((p) => ({ ...p, [docType]: { state: 'empty' } }));
    // Trigger the replace input by simulating label click
    const el = document.getElementById(`doc-upload-${docType}-replace`);
    if (el) el.click();
  };

  // ── Stripe Identity: POST /api/kyc/identity-verify ────────────────────────
  const handleStartIdentityVerification = async () => {
    if (!user || !firebaseUser) return;
    setIdentityLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      // applicationId is the seller's uid until the application is submitted;
      // after submission, the returned id will be used — for the flow here we
      // use the user uid as a stable pre-submission identifier.
      const applicationId = `app-${user.id}`;
      const res = await fetch('/api/kyc/identity-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ applicationId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Identity verification failed' }));
        throw new Error(err.error ?? 'Identity verification failed');
      }
      const data = await res.json();
      if (data.alreadyVerified) {
        setIdentityStatus('verified');
      } else if (data.verificationUrl) {
        setIdentityStatus('pending');
        window.location.href = data.verificationUrl;
      }
    } catch {
      setIdentityStatus('requires_input');
    } finally {
      setIdentityLoading(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await submitApplication({
        userId: user.id,
        userEmail: user.email || '',
        userName: user.name || '',
        ...form,
        slug: form.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        socialMedia: [],
        kycDocuments,
        identityVerificationStatus: identityStatus === 'verified' ? 'verified' : 'pending',
      });
      // Record KYC submission for funnel instrumentation (fire-and-forget)
      recordEvent(user.id, 'kyc_submitted').catch(() => {});
      setSubmitted(true);
    } catch {
      // handled by service
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-white dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-brand-primary/5 p-12 max-w-lg w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black uppercase italic text-brand-primary dark:text-white mb-3">
            Application Submitted!
          </h2>
          <p className="text-sm text-brand-primary/60 dark:text-white/60 mb-2">
            Your seller application has been successfully submitted.
          </p>
          <p className="text-xs text-brand-primary/40 dark:text-white/40 mb-8">
            Our team will review it within 1–3 business days. You will be notified by email.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-violet-600 text-white font-black text-sm rounded-xl hover:bg-violet-700 transition-colors uppercase tracking-widest"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        <button
          onClick={() => (step > 1 ? setStep((s) => s - 1) : navigate('/'))}
          className="flex items-center gap-2 text-sm font-bold text-brand-primary/50 hover:text-brand-primary transition-colors mb-6"
        >
          <ArrowLeft size={16} /> {step > 1 ? 'Back' : 'Home'}
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center">
            <Store className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase italic text-brand-primary dark:text-white">
              Seller Application
            </h1>
            <p className="text-xs text-brand-primary/50 font-bold">Start selling on Mercora</p>
          </div>
        </div>

        {/* Step indicator — numbered circles per UI-SPEC */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all',
                  step > s
                    ? 'bg-green-500 text-white'
                    : step === s
                      ? 'bg-violet-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-brand-primary/30',
                )}
              >
                {step > s ? <CheckCircle size={14} /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    'flex-1 h-1 rounded',
                    step > s ? 'bg-violet-600' : 'bg-zinc-100 dark:bg-zinc-800',
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16">
        <motion.div
          key={step}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-brand-primary/5 p-8"
        >
          {/* ── Step 1: Store Info ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-black uppercase italic text-brand-primary dark:text-white">
                Store Information
              </h2>

              <div>
                <label className="block text-xs font-bold text-brand-primary/60 mb-1.5">
                  Store Name *
                </label>
                <input
                  value={form.storeName}
                  onChange={(e) => set('storeName', e.target.value)}
                  placeholder="e.g. TechStore"
                  className="w-full px-4 py-3 rounded-xl border border-brand-primary/10 bg-white dark:bg-zinc-800 text-sm font-bold text-brand-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-primary/60 mb-1.5">
                  Phone *
                </label>
                <div className="flex gap-2">
                  <select
                    value={form.origin}
                    onChange={(e) => set('origin', e.target.value)}
                    className="px-3 py-3 rounded-xl border border-brand-primary/10 bg-white dark:bg-zinc-800 text-sm font-bold text-brand-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="TR">🇹🇷 +90</option>
                    <option value="UK">🇬🇧 +44</option>
                    <option value="US">🇺🇸 +1</option>
                    <option value="DE">🇩🇪 +49</option>
                  </select>
                  <input
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="5XX XXX XX XX"
                    className="flex-1 px-4 py-3 rounded-xl border border-brand-primary/10 bg-white dark:bg-zinc-800 text-sm font-bold text-brand-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-primary/60 mb-1.5">
                    Tax Number (optional)
                  </label>
                  <input
                    value={form.taxId}
                    onChange={(e) => set('taxId', e.target.value)}
                    placeholder="Tax number"
                    className="w-full px-4 py-3 rounded-xl border border-brand-primary/10 bg-white dark:bg-zinc-800 text-sm font-bold text-brand-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-primary/60 mb-1.5">
                    Website (optional)
                  </label>
                  <input
                    value={form.website}
                    onChange={(e) => set('website', e.target.value)}
                    placeholder="https://"
                    className="w-full px-4 py-3 rounded-xl border border-brand-primary/10 bg-white dark:bg-zinc-800 text-sm font-bold text-brand-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={!form.storeName.trim() || !form.phone.trim()}
                  className="w-full py-3.5 bg-violet-600 text-white font-black text-sm rounded-xl hover:bg-violet-700 transition-colors uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Categories & Experience ───────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-black uppercase italic text-brand-primary dark:text-white">
                Categories & Experience
              </h2>

              <div>
                <label className="block text-xs font-bold text-brand-primary/60 mb-2">
                  Categories You Want to Sell In *
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        'px-4 py-2 rounded-xl text-xs font-bold border transition-all',
                        form.productCategories.includes(cat)
                          ? 'bg-violet-100 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300'
                          : 'bg-white dark:bg-zinc-800 border-brand-primary/10 text-brand-primary/60 hover:border-violet-300',
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-primary/60 mb-1.5">
                  Sales Experience
                </label>
                <select
                  value={form.experience}
                  onChange={(e) => set('experience', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-brand-primary/10 bg-white dark:bg-zinc-800 text-sm font-bold text-brand-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Select</option>
                  {EXPERIENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-primary/60 mb-1.5">
                  Monthly Sales Target
                </label>
                <select
                  value={form.monthlySalesTarget}
                  onChange={(e) => set('monthlySalesTarget', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-brand-primary/10 bg-white dark:bg-zinc-800 text-sm font-bold text-brand-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Select</option>
                  {MONTHLY_TARGETS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3.5 border border-brand-primary/10 text-brand-primary font-black text-sm rounded-xl hover:bg-zinc-50 transition-colors uppercase tracking-widest"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={form.productCategories.length === 0}
                  className="flex-1 py-3.5 bg-violet-600 text-white font-black text-sm rounded-xl hover:bg-violet-700 transition-colors uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Document Upload + Identity Verification ───────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-black uppercase italic text-brand-primary dark:text-white">
                Identity Verification
              </h2>

              {/* 3-doc upload slots */}
              <div>
                <p className="text-xs font-bold text-brand-primary/60 mb-3">
                  Upload all 3 required documents to continue
                </p>
                <div className="space-y-3">
                  {DOC_SLOTS.map((slot) => (
                    <DocUploadSlot
                      key={slot.docType}
                      config={slot}
                      slotState={docSlots[slot.docType]}
                      onFileSelect={handleFileSelect}
                      onReplace={handleReplace}
                    />
                  ))}
                </div>
              </div>

              {/* Stripe Identity section — visible once all docs uploaded */}
              {allDocsUploaded && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-s-4 border-violet-600 bg-violet-50 dark:bg-violet-900/20 rounded-xl ps-4 pe-4 py-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={18} className="text-violet-600" />
                    <p className="text-sm font-black text-brand-primary dark:text-white">
                      Identity Verification
                    </p>
                  </div>

                  {identityStatus === 'not_started' && (
                    <>
                      <p className="text-xs text-brand-primary/60 dark:text-white/60 mb-3">
                        We use Stripe Identity to verify your ID document and selfie. This takes
                        about 2 minutes and strengthens trust with buyers.
                      </p>
                      <button
                        onClick={handleStartIdentityVerification}
                        disabled={identityLoading}
                        className="w-full py-3 bg-violet-600 text-white font-black text-sm rounded-xl hover:bg-violet-700 transition-colors uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {identityLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <ShieldCheck size={16} />
                        )}
                        {identityLoading ? 'Starting…' : 'Start Identity Verification'}
                      </button>
                    </>
                  )}

                  {identityStatus === 'pending' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold">
                      <Loader2 size={12} className="animate-spin" />
                      Identity check in progress — we'll notify you by email
                    </span>
                  )}

                  {identityStatus === 'verified' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold">
                      <CheckCircle size={12} />
                      Identity verified
                    </span>
                  )}

                  {identityStatus === 'requires_input' && (
                    <div className="space-y-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold">
                        <AlertCircle size={12} />
                        Verification needs attention — please retry
                      </span>
                      <button
                        onClick={handleStartIdentityVerification}
                        disabled={identityLoading}
                        className="w-full py-2.5 border border-violet-300 text-violet-600 font-black text-xs rounded-xl hover:bg-violet-50 transition-colors uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {identityLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                        Retry Verification
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Summary preview */}
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-primary/50">Store Name</span>
                  <span className="font-bold text-brand-primary dark:text-white">
                    {form.storeName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-primary/50">Phone</span>
                  <span className="font-bold text-brand-primary dark:text-white">{form.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-primary/50">Categories</span>
                  <span className="font-bold text-brand-primary dark:text-white text-end">
                    {form.productCategories.join(', ')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-primary/50">Documents</span>
                  <span
                    className={cn(
                      'font-bold text-sm',
                      allDocsUploaded ? 'text-green-600' : 'text-amber-600',
                    )}
                  >
                    {kycDocuments.length} / 3 uploaded
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  Your application will be reviewed after submission. Average review time is 1–3
                  business days.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3.5 border border-brand-primary/10 text-brand-primary font-black text-sm rounded-xl hover:bg-zinc-50 transition-colors uppercase tracking-widest"
                >
                  Back
                </button>
                {/* 3-doc gate: disabled until all 3 docs uploaded (D-06) */}
                <div
                  className="flex-1"
                  title={
                    !allDocsUploaded ? 'Upload all 3 required documents to continue' : undefined
                  }
                >
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !allDocsUploaded}
                    className="w-full py-3.5 bg-violet-600 text-white font-black text-sm rounded-xl hover:bg-violet-700 transition-colors uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    {submitting ? 'Submitting…' : 'Submit Application'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
