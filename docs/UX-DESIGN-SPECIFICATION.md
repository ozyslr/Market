# Mercora UX Design Specification
## Error Handling & User Experience System

**Date:** 2026-05-23  
**Prepared by:** UX/UI Designer 1  
**Target:** Sprint 1-2 (Weeks 1-2 of development)  
**Status:** Design Specification (Component Library)

---

## Executive Summary

Mercora's UX maturity is **5.5/10** with strong skeleton screen foundations but critical gaps in error handling, form validation, and user feedback mechanisms. This spec addresses **P0 (Critical)** and **P1 (Important)** issues through component designs, messaging patterns, and implementation guidelines.

**P0 Priority Issues:**
1. Silent error swallowing (`.catch(() => {})`)
2. Missing 403/Unauthorized page
3. Missing maintenance mode page
4. Missing search empty state
5. Missing inline form validation

**Sprint Goals:**
- Eliminate all silent error handlers
- Build error UI system (Toast, Network Status, Error Pages)
- Implement inline form validation pattern

---

## 1. Component Library Architecture

### 1.1 Error & Status System Hierarchy

```
┌─ Error Handling Layer
│  ├─ ErrorBoundary (Root)
│  │  └─ Global Error Page (5xx, unknown errors)
│  ├─ Page-Level Errors (4xx series)
│  │  ├─ 404 NotFound
│  │  ├─ 403 Forbidden
│  │  ├─ 500 Server Error
│  │  └─ Maintenance
│  └─ Inline Errors
│     ├─ Form validation messages
│     └─ API error alerts
│
├─ User Feedback Layer
│  ├─ Toast/Snackbar (transient)
│  ├─ Network Status (persistent)
│  ├─ Loading States (skeleton + spinner)
│  └─ Empty States (contextual)
│
└─ Form Validation Layer
   ├─ Field-level validation
   ├─ Form-level validation
   └─ Real-time feedback
```

---

## 2. P0 Component Specifications

### 2.1 Silent Error Handler → Toast System

**Current Problem:**
```typescript
// BAD: Silent failure
.catch(() => {
  setSellers(MOCK_SELLERS);
  // User never knows what happened
})
```

**Solution: GlobalErrorHandler + Toast Component**

#### Component: `Toast.tsx`
**Purpose:** Unified notification system for errors, success, warnings

**Design:**
```
┌─────────────────────────────────────┐
│ ✕ Hata Oluştu                    ✕ │
│                                     │
│ "Ürün listesi yüklenemedi.        │
│  Lütfen sayfayı yenileyin."       │
│                                     │
│         [Yenile] [Kapat]          │
└─────────────────────────────────────┘
```

**Properties:**
- **Type:** `'error' | 'success' | 'warning' | 'info'`
- **Position:** Top-right (persistent), bottom-center (mobile)
- **Duration:** 5s (errors persistent), 3s (success auto-dismiss)
- **Actions:** Optional retry/dismiss buttons
- **Animation:** Slide-in + fade-out (framer-motion)

**Implementation Pattern:**
```typescript
// In catch block:
.catch((error) => {
  logger.error('Sellers fetch failed', error);
  showToast({
    type: 'error',
    title: 'Ürün listesi yüklenemedi',
    message: 'Lütfen internet bağlantınızı kontrol edin.',
    action: { label: 'Yenile', onClick: () => retryFetch() }
  });
})
```

**Variants:**
| Type | Icon | Color | Duration | Dismissible |
|------|------|-------|----------|------------|
| error | ✕ (red) | red-500 | 5s | Yes |
| success | ✓ (green) | green-500 | 3s | Auto-dismiss |
| warning | ⚠ (yellow) | yellow-500 | 5s | Yes |
| info | ℹ (blue) | blue-500 | 4s | Yes |

**Accessibility:**
- `role="alert"` for errors
- `aria-live="polite"` for non-critical
- `aria-label` with full message text
- Keyboard dismissible (Escape key)

---

### 2.2 403 Forbidden Page

**Current Problem:** No dedicated page; users see generic error or get stuck

**Design Wireframe:**

```
┌─────────────────────────────────────────┐
│ Mercora Logo      [Dil] [Profil]       │
├─────────────────────────────────────────┤
│                                         │
│                 ⛔ 403                   │
│                                         │
│      "Bu sayfaya erişim yetkiniz yok"  │
│                                         │
│  "Sadece admin kullanıcılar bu panele  │
│   erişebilir. Yetkisiz erişim denendi" │
│                                         │
│     [Ana Sayfaya Dön] [Destek]        │
│                                         │
└─────────────────────────────────────────┘
```

**Component: `Forbidden.tsx` (React) & `forbidden.tsx` (Next.js)**

**Content Structure:**
- **Icon:** Shield with slash (red)
- **Heading:** "Erişim Reddedildi" (red-600)
- **Subheading:** "Bu sayfaya erişim yetkiniz yok"
- **Message:** "Sadece yöneticiler bu bölüme erişebilir. Daha fazla bilgi için destek ekibiyle iletişime geçin."
- **CTA:** 
  - Primary: [Ana Sayfaya Dön] (brand color)
  - Secondary: [Destek Ekibi] (blue, opens contact)
  - Link: [Profil Ayarları]

**File Structure:**
```
src/pages/Forbidden.tsx          // React Router version
src/components/errors/ForbiddenPage.tsx  // Reusable component
mercora-next/src/app/forbidden/
  └─ page.tsx                     // Next.js App Router
```

**Route Protection (Next.js Middleware):**
```typescript
// middleware.ts
if (pathname.startsWith('/admin') && !isAdmin(token)) {
  return NextResponse.redirect('/forbidden');
}
```

---

### 2.3 Maintenance Mode Page

**Current Problem:** `maintenanceMode` flag exists but no UI to show users

**Design Wireframe:**

```
┌──────────────────────────────────────────┐
│                                          │
│         Mercora Logo (centered)          │
│                                          │
│            🔧 Bakım Modu 🔧             │
│                                          │
│       "Platform Bakımda"                 │
│                                          │
│  "Şu an Mercora'da sistem bakımı yapı-  │
│   lıyor. Lütfen daha sonra tekrar dene. │
│                                          │
│   Tahmini bitiş saati: 22:30 (5 min)"   │
│                                          │
│    [Saatleri Kontrol Et] [E-posta Al]  │
│                                          │
│    Mercora © 2026 | Destek: support...  │
│                                          │
└──────────────────────────────────────────┘
```

**Component: `Maintenance.tsx`**

**Content Structure:**
- **Icon:** Wrench/tools (animated, subtle pulse)
- **Heading:** "Bakım Modu" (gray-700)
- **Subheading:** "Mercora Şu An Bakımda"
- **Message:** Dynamic from `SiteSettings.maintenanceMessage`
- **ETA Display:** "Tahmini bitiş: HH:MM" (from `maintenanceEndTime`)
- **CTA:**
  - Primary: [Saatleri Kontrol Et] - refreshes ETA
  - Secondary: [Bildirim Al] - email signup
  - Link: [İletişim Bilgileri]

**Animation:**
- Wrench icon rotates continuously (180deg, 3s loop)
- Countdown timer updates every 10 seconds
- Subtle background gradient shift

**Redirect Logic (App.tsx):**
```typescript
useEffect(() => {
  const checkMaintenance = async () => {
    const settings = await getSiteSettings();
    if (settings.maintenanceMode && !isAdmin()) {
      navigate('/maintenance');
    }
  };
  checkMaintenance();
}, []);
```

---

### 2.4 Search Empty State

**Current Problem:** No special handling when search returns 0 results

**Design Wireframe:**

```
┌─────────────────────────────────────────────┐
│ [🔍 Ara...                            ]     │
├─────────────────────────────────────────────┤
│                                             │
│              📭 Sonuç Bulunamadı             │
│                                             │
│   "Aradığınız terimle eşleşen ürün yok"   │
│                                             │
│   Arama: "fuzzy wuzzy bears"               │
│                                             │
│   💡 Öneriler:                              │
│   • Yazımı kontrol edin                     │
│   • Daha genel bir terim deneyin            │
│   • Kategori filtresini kaldırın            │
│                                             │
│   ─────────────────────────────────────    │
│   "Muhtemelen şunu aramak istediniz?"      │
│   > Fuzzy Wuzzy Toys (234 sonuç)          │
│   > Fuzzy Plush Animals (156 sonuç)       │
│   > Teddy Bears (892 sonuç)                 │
│                                             │
│   ─────────────────────────────────────    │
│   Kategorileri Keşfet:                     │
│   [Oyuncaklar] [Evcil Hayvan] [Bebek]     │
│                                             │
└─────────────────────────────────────────────┘
```

**Component: `SearchEmptyState.tsx`**

**Content Structure:**
- **Icon:** Mail box (empty) - illustrative, not literal
- **Heading:** "Sonuç Bulunamadı" (gray-700)
- **Original Query:** Highlight user's search term
- **Suggestions Section:**
  - 3 common spelling/phrasing tips
  - "Did you mean..." (fuzzy-matched alternatives)
- **Discovery Section:**
  - Top 3 related category shortcuts
  - Popular products in similar category
- **CTA:** [Tüm Ürünleri Gör]

**Rendering Logic:**
```typescript
// SearchResults.tsx
if (results.length === 0) {
  const alternatives = generateAlternatives(searchQuery);
  const relatedCategories = getRelatedCategories(searchQuery);
  
  return (
    <SearchEmptyState
      query={searchQuery}
      alternatives={alternatives}
      categories={relatedCategories}
      onCategorySelect={handleCategoryFilter}
    />
  );
}
```

**Accessibility:**
- Explain why search returned 0 results
- Provide actionable alternatives
- `aria-label="Arama sonuçları bulunamadı. İçindekiler: ..."`

---

### 2.5 Inline Form Validation System

**Current Problem:** Users don't see validation errors until form submission

**Design Pattern:**

```
Seller Settings Form:

┌────────────────────────────────────────┐
│ Mağaza Adı                             │
│ [Mercora Satıcı                    ] ✓ │
│                                        │
│ İş E-postası                           │
│ [seller@                           ] ✗ │
│ ⚠ Geçerli bir e-posta giriniz       │
│                                        │
│ Telefon Numarası                       │
│ [+90 (5__)                         ] ◯ │
│ ℹ Türkiye telefon numarası (11 hane) │
│                                        │
│ Kategori (Gerekli)                     │
│ [Seçim Yapınız                     ] ◯ │
│                                        │
│                [Kaydet]  [İptal]      │
└────────────────────────────────────────┘
```

**Component: `FormField.tsx` (Enhanced)**

**States per field:**
| State | Icon | Border | Message | Color |
|-------|------|--------|---------|-------|
| Pristine | — | gray-300 | — | — |
| Focused | — | brand-primary | — | — |
| Valid | ✓ | green-500 | (optional) "Kullanılabilir" | green |
| Invalid | ✗ | red-500 | "Geçerli bir X giriniz" | red |
| Validating | ⟳ | blue-300 | "Kontrol ediliyor..." | blue |

**Real-time Validation Triggers:**
- **On change:** Debounced (500ms)
- **On blur:** Immediate
- **On submit:** All fields (show all errors at once)

**Implementation Pattern:**

```typescript
// Enhanced FormField component
interface FormFieldProps {
  label: string;
  value: string;
  error?: string;
  isValid?: boolean;
  isValidating?: boolean;
  rules?: ValidationRule[];
  onChange: (value: string) => void;
}

const FormField: React.FC<FormFieldProps> = ({
  label, value, error, isValid, rules, onChange
}) => {
  const [isTouched, setIsTouched] = useState(false);
  const debouncedValidate = useCallback(
    debounce((val) => validateField(val, rules), 500),
    [rules]
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    debouncedValidate(e.target.value);
  };

  return (
    <div className="form-field">
      <label>{label}</label>
      <input
        value={value}
        onChange={handleChange}
        onBlur={() => setIsTouched(true)}
        className={cn(
          'border-2',
          isValid && 'border-green-500 bg-green-50',
          error && isTouched && 'border-red-500 bg-red-50'
        )}
      />
      {error && isTouched && (
        <p className="text-red-600 text-sm mt-1" role="alert">
          {error}
        </p>
      )}
      {isValid && (
        <p className="text-green-600 text-xs mt-1">✓ Doğru</p>
      )}
    </div>
  );
};
```

**Validation Rules Library:**

```typescript
// validators.ts
export const validators = {
  email: (value: string) => 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) 
      ? null 
      : 'Geçerli bir e-posta giriniz',
  
  phone: (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 10 ? null : 'Geçerli telefon numarası';
  },
  
  storeName: (value: string) =>
    value.length >= 3 ? null : 'En az 3 karakter',
  
  required: (value: string) =>
    value.trim() ? null : 'Bu alan gerekli',
  
  asyncEmailUnique: async (value: string) => {
    const exists = await checkEmailExists(value);
    return exists ? 'Bu e-posta zaten kullanılıyor' : null;
  }
};
```

**Form-Level Validation (Pre-Submit):**
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  // Validate all fields
  const errors = validateForm(formData, rules);
  setFormErrors(errors);
  
  if (Object.keys(errors).length === 0) {
    // All valid → submit
    try {
      await submitForm(formData);
      showToast({ type: 'success', title: 'Başarılı!' });
    } catch (error) {
      showToast({ type: 'error', title: 'Gönderme başarısız' });
    }
  } else {
    // Show error toast pointing to first invalid field
    showToast({ 
      type: 'error', 
      title: 'Lütfen hataları düzeltin',
      action: { label: 'İlk hataya git', onClick: scrollToFirstError }
    });
  }
};
```

---

## 3. Network & Global Error Handlers

### 3.1 NetworkStatus Component

**Purpose:** Alert users when offline, reconnecting, or experiencing degraded connection

**Design:**

```
┌─ Offline (persistent banner) ─────────────────┐
│ ⚠ Çevrimdışısınız - Bağlantı yok              │
│ Bazı özellikler kullanılamayabilir            │
│              [Tekrar Dene]                    │
└────────────────────────────────────────────────┘

┌─ Reconnecting (auto-dismiss after reconnect) ─┐
│ ⟳ Bağlantı kuruluyor... (3s)                 │
└────────────────────────────────────────────────┘

┌─ Degraded (info) ─────────────────────────────┐
│ ℹ Yavaş bağlantı - Sayfa yüklenme gecikebilir│
└────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
// NetworkStatus.tsx
export const NetworkStatus: React.FC = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'slow'>('online');
  const connectionSpeedRef = useRef<number>(0);

  useEffect(() => {
    const handleOnline = () => setStatus('online');
    const handleOffline = () => setStatus('offline');

    // Monitor connection speed
    const monitor = setInterval(() => {
      const start = performance.now();
      fetch('/api/ping', { method: 'HEAD' })
        .then(() => {
          const latency = performance.now() - start;
          connectionSpeedRef.current = latency;
          setStatus(latency > 1000 ? 'slow' : 'online');
        })
        .catch(() => setStatus('offline'));
    }, 5000);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(monitor);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (status === 'online') return null;

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 py-3 px-4 text-white text-center',
      status === 'offline' && 'bg-red-600',
      status === 'slow' && 'bg-yellow-600'
    )}>
      {status === 'offline' && (
        <>
          <span>⚠ Çevrimdışısınız</span>
          <button onClick={() => window.location.reload()} 
            className="ml-4 underline">Tekrar Dene</button>
        </>
      )}
      {status === 'slow' && (
        <span>ℹ Yavaş bağlantı - Sayfayı yenilemeyi deneyin</span>
      )}
    </div>
  );
};
```

**Root Integration (App.tsx):**
```typescript
<div>
  <NetworkStatus />  {/* Always active */}
  <ErrorBoundary>
    <Routes>...</Routes>
  </ErrorBoundary>
</div>
```

---

## 4. Global Error Boundary Enhancement

**Current:** `SentryErrorBoundary` fallback is too minimal

**Enhanced Design:**

```
┌──────────────────────────────────────────────┐
│ Mercora                    [Dil] [Çık]      │
├──────────────────────────────────────────────┤
│                                              │
│                 ⚠ 500 Sunucu Hatası          │
│                                              │
│          "Beklenmeyen bir hata oluştu"      │
│                                              │
│     Hata Referans ID: ERR_20250523_8K2J9    │
│                                              │
│     ✓ Sorun otomatik olarak raporlandı      │
│                                              │
│     💡 Şunları deneyebilirsiniz:            │
│     • Sayfayı yenileyin                      │
│     • Bazı filtrelerinizi temizleyin         │
│     • Tarayıcı önbelleğini temizleyin        │
│                                              │
│   [Ana Sayfaya Dön]  [Destek İletişim]    │
│                                              │
│   Ya da otomatik 10 saniye sonra yönlendir  │
│   Yenileniyor: 10s                           │
│                                              │
└──────────────────────────────────────────────┘
```

**Enhanced ErrorBoundary Fallback:**

```typescript
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError
}) => {
  const errorId = generateErrorId();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Auto-redirect after 10 seconds
    const timer = setInterval(() => {
      setCountdown(c => c - 1);
    }, 1000);
    
    if (countdown === 0) {
      window.location.href = '/';
    }
    
    return () => clearInterval(timer);
  }, [countdown]);

  // Log to Sentry with error ID
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { errorId }
    });
  }, [error, errorId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="text-6xl mb-6 text-center">⚠</div>

        {/* Status Code */}
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">
          500
        </h1>

        {/* Heading */}
        <h2 className="text-xl font-semibold text-center text-gray-700 mb-4">
          Sunucu Hatası
        </h2>

        {/* Message */}
        <p className="text-center text-gray-600 mb-6">
          Beklenmeyen bir hata oluştu. Sorun otomatik olarak rapor edildi.
        </p>

        {/* Error Reference */}
        <div className="bg-gray-100 p-3 rounded mb-6 text-center text-sm text-gray-700 font-mono">
          Ref: {errorId}
        </div>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="bg-red-50 p-3 rounded mb-6 text-xs text-red-700">
            <summary className="cursor-pointer font-semibold">Hata Detayları</summary>
            <pre className="mt-2 overflow-auto">{error.stack}</pre>
          </details>
        )}

        {/* Suggestions */}
        <div className="bg-blue-50 p-4 rounded mb-6">
          <p className="text-sm font-semibold text-blue-900 mb-2">💡 Deneyebileceğiniz şeyler:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Sayfayı yenileyin</li>
            <li>✓ Filtreleri temizleyin</li>
            <li>✓ Tarayıcı önbelleğini temizleyin</li>
          </ul>
        </div>

        {/* Countdown */}
        <p className="text-center text-sm text-gray-600 mb-6">
          Ana sayfaya yönlendiriliyorsunuz: <strong>{countdown}s</strong>
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={resetError}
            className="flex-1 bg-brand-primary text-white py-2 rounded font-semibold hover:opacity-90"
          >
            Tekrar Dene
          </button>
          <a
            href="/"
            className="flex-1 bg-gray-300 text-gray-900 py-2 rounded font-semibold text-center hover:opacity-90"
          >
            Ana Sayfa
          </a>
        </div>

        <a
          href="/support"
          className="block mt-4 text-center text-sm text-blue-600 hover:underline"
        >
          Destek Ekibi ile İletişime Geçin
        </a>
      </div>
    </div>
  );
};
```

---

## 5. Implementation Checklist (Sprint 1-2)

### Sprint 1 (Week 1)

- [ ] **Toast/Snackbar System**
  - [ ] Create `Toast.tsx` component with type variants
  - [ ] Create `useToast()` hook
  - [ ] Add Toast context provider to App root
  - [ ] Test all variants (error, success, warning, info)

- [ ] **Fix All Silent Error Handlers**
  - [ ] Audit all `.catch(() => {})` blocks (list in git diff)
  - [ ] Replace with proper error handling:
    ```typescript
    .catch((error) => {
      logger.error('Operation failed', error);
      showToast({ type: 'error', title: 'Hata', message: getErrorMessage(error) });
    })
    ```
  - [ ] Add logging to Sentry
  - [ ] Files: `AdminSellers.tsx`, `SellerSettings.tsx`, `SellerImportCenter.tsx`, `OrderTracking.tsx`

- [ ] **403 Forbidden Page**
  - [ ] Create `src/pages/Forbidden.tsx`
  - [ ] Create `mercora-next/src/app/forbidden/page.tsx`
  - [ ] Add middleware protection for `/admin` routes
  - [ ] Test unauthorized access

- [ ] **Enhanced ErrorBoundary**
  - [ ] Replace `SentryErrorBoundary` fallback with `ErrorFallback` component
  - [ ] Add error reference ID generation
  - [ ] Add auto-redirect countdown
  - [ ] Test in development mode

### Sprint 2 (Week 2)

- [ ] **Maintenance Mode Page**
  - [ ] Create `src/pages/Maintenance.tsx`
  - [ ] Add redirect logic to App root
  - [ ] Add ETA countdown from `SiteSettings`
  - [ ] Create email notification signup

- [ ] **Form Validation System**
  - [ ] Create `FormField.tsx` enhanced component
  - [ ] Create `validators.ts` library
  - [ ] Create `useFormValidation()` hook
  - [ ] Apply to `SellerSettings.tsx` and `SellOnMercora.tsx`
  - [ ] Test async validators (email uniqueness)

- [ ] **Search Empty State**
  - [ ] Create `SearchEmptyState.tsx` component
  - [ ] Implement fuzzy matching for "Did you mean?"
  - [ ] Add category recommendations
  - [ ] Integrate into `SearchResults.tsx`

- [ ] **Network Status Component**
  - [ ] Create `NetworkStatus.tsx`
  - [ ] Add to App root
  - [ ] Test offline detection
  - [ ] Add connection speed monitoring

- [ ] **Documentation & Handoff**
  - [ ] Create component story files (Storybook)
  - [ ] Document all Toast message templates
  - [ ] Create error handling guide for team
  - [ ] Update TypeScript types

---

## 6. Messaging Patterns & Copy

### Error Messages (User-Friendly)

| Scenario | Message | Action |
|----------|---------|--------|
| Network Error | "İnternet bağlantınız koptu. Lütfen kontrol edin." | [Tekrar Dene] |
| Timeout (>5s) | "İşlem çok uzun sürüyor. Lütfen bekleyin veya tekrar deneyin." | [Tekrar Dene] |
| 404 Not Found | "Aradığınız sayfa bulunamadı." | [Ana Sayfaya Dön] |
| 403 Forbidden | "Bu sayfaya erişim yetkiniz yok." | [Ana Sayfaya Dön] |
| 500 Server | "Sunucu hatası. Sorun otomatik raporlandı." | [Tekrar Dene] |
| Validation Error | "{field} alanını kontrol edin." | [Düzelt] |
| Empty Cart | "Sepetiniz boş. Ürün eklemek ister misiniz?" | [Ürün Ara] |
| No Search Results | "Bu aramayla eşleşen ürün yok." | [Filtreleri Sıfırla] |

### Success Messages

| Action | Message |
|--------|---------|
| Form Submit | "Ayarlar kaydedildi!" |
| Item Deleted | "Ürün kaldırıldı." |
| Order Placed | "Siparişiniz alındı. Ref: #{orderId}" |
| Email Sent | "E-posta gönderildi. Lütfen kontrol edin." |

---

## 7. Accessibility Requirements

**All error components must:**
- Use semantic HTML (`<main>`, `<section>`, `<form>`)
- Include `role="alert"` on error messages
- Have `aria-live="polite"` on toasts
- Provide `aria-describedby` linking to error text
- Support keyboard navigation (Tab, Enter, Escape)
- Have sufficient color contrast (WCAG AA minimum)
- Include screen reader descriptions

**Example:**
```typescript
<div
  role="alert"
  aria-live="polite"
  aria-describedby="error-message"
  className="bg-red-50 border border-red-400 p-4 rounded"
>
  <span id="error-message" className="text-red-700">
    ✕ E-posta adresi geçersiz
  </span>
</div>
```

---

## 8. File Structure & Locations

```
src/
├── components/
│   ├── common/
│   │   ├── Toast.tsx           [NEW]
│   │   ├── NetworkStatus.tsx   [NEW]
│   │   ├── ErrorFallback.tsx   [NEW]
│   │   └── FormField.tsx        [ENHANCED]
│   ├── errors/
│   │   ├── Forbidden.tsx        [NEW]
│   │   ├── Maintenance.tsx      [NEW]
│   │   └── SearchEmptyState.tsx [NEW]
│   └── ...
├── hooks/
│   ├── useToast.ts             [NEW]
│   ├── useFormValidation.ts    [NEW]
│   └── ...
├── pages/
│   ├── Forbidden.tsx            [NEW]
│   ├── Maintenance.tsx          [NEW]
│   └── ...
├── services/
│   ├── validators.ts            [NEW]
│   ├── errorHandler.ts          [NEW]
│   └── ...
└── ...

mercora-next/src/
├── app/
│   ├── forbidden/
│   │   └── page.tsx             [NEW]
│   ├── maintenance/
│   │   └── page.tsx             [NEW]
│   └── error.tsx                [ENHANCED]
└── ...
```

---

## 9. Metrics & Success Criteria

**Target Metrics (End of Sprint 2):**
- **Error Coverage:** 100% of `.catch()` blocks have user-facing feedback
- **Silent Errors:** 0 instances of `.catch(() => {})`
- **Form Validation:** All forms have inline validation
- **Page Accessibility:** WCAG AA compliance on all error pages
- **Error Page Completion:** 4/4 pages implemented (403, 404, 500, Maintenance)
- **Toast Dismiss Rate:** <10% of users need to manually dismiss errors

**Monitoring:**
- Sentry error tracking with error ID correlation
- Toast dismissal analytics
- Form validation error rates
- Network error frequency

---

## 10. Design System Integration

**Color Palette:**
- **Error:** red-500 (#ef4444)
- **Success:** green-500 (#22c55e)
- **Warning:** yellow-500 (#eab308)
- **Info:** blue-500 (#3b82f6)
- **Neutral:** gray-500 (#6b7280)

**Typography:**
- **Headings:** 24px, bold (error pages)
- **Body:** 16px, regular
- **Hints:** 14px, gray-600
- **Monospace:** 12px (error IDs)

**Spacing:**
- Toast margin from top: 24px
- Form field margin-bottom: 16px
- Error message padding: 8px

**Animation:**
- Toast slide-in: 300ms (cubic-bezier)
- Skeleton shimmer: 1.5s infinite
- Network status pulse: 2s infinite

---

## Appendix: Implementation Examples

### Toast Usage
```typescript
// In any component
const { showToast } = useToast();

try {
  await updateSeller(data);
  showToast({ type: 'success', title: 'Ayarlar kaydedildi!' });
} catch (error) {
  showToast({
    type: 'error',
    title: 'Hata',
    message: error.message,
    action: { label: 'Tekrar Dene', onClick: () => retry() }
  });
}
```

### Form with Validation
```typescript
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState<string | null>(null);

const validateEmail = useCallback(
  debounce((value: string) => {
    if (!validators.email(value)) {
      setEmailError(null);
    } else {
      setEmailError(validators.email(value));
    }
  }, 500),
  []
);

<FormField
  label="E-posta"
  value={email}
  error={emailError}
  onChange={(val) => {
    setEmail(val);
    validateEmail(val);
  }}
/>
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-23  
**Next Review:** After Sprint 2 completion  
**Owner:** UX/UI Designer 1
