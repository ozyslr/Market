# Mercora UX Implementation Guide
## Developer Quick Reference

**For:** Frontend developers implementing P0/P1 UX components  
**Based on:** UX-DESIGN-SPECIFICATION.md  
**Duration:** Sprint 1-2 (2 weeks)

---

## Quick Start

### 1. Fix Silent Errors (Critical Path)

**Identify all silent catch blocks:**
```bash
# Find all empty catch blocks
grep -r "\.catch(().*{.*})" src/ mercora-next/src/ --include="*.ts*"
```

**Files identified (from report):**
- `src/pages/AdminSellers.tsx:64-68`
- `src/components/SellerSettings.tsx:73`
- `src/components/SellerImportCenter.tsx:152`
- `src/pages/OrderTracking.tsx:45`

**Fix pattern:**
```typescript
// BEFORE (Silent)
.catch(() => {
  setSellers(MOCK_SELLERS);
})

// AFTER (User-aware)
.catch((error) => {
  console.error('Failed to fetch sellers:', error);
  showToast({
    type: 'error',
    title: 'Satıcı listesi yüklenemedi',
    message: 'Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.',
    action: { label: 'Tekrar Dene', onClick: () => retryFetch() }
  });
  Sentry.captureException(error);
})
```

---

### 2. Install Toast System (30 min)

**Create core files:**

**`src/types/toast.ts`:**
```typescript
export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastContextType {
  messages: ToastMessage[];
  showToast: (config: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
}
```

**`src/context/ToastContext.tsx`:**
```typescript
import React, { createContext, useState, useCallback } from 'react';
import { ToastMessage, ToastContextType } from '../types/toast';

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const showToast = useCallback((config: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36);
    const duration = config.duration ?? (config.type === 'success' ? 3000 : 5000);

    setMessages(prev => [...prev, { ...config, id, duration }]);

    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ messages, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
};
```

**`src/hooks/useToast.ts`:**
```typescript
import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
```

**`src/components/common/Toast.tsx`:**
```typescript
import React, { useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const iconMap = {
  error: <AlertCircle className="w-5 h-5 text-red-600" />,
  success: <CheckCircle className="w-5 h-5 text-green-600" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
  info: <Info className="w-5 h-5 text-blue-600" />,
};

const bgColorMap = {
  error: 'bg-red-50 border-red-200',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  info: 'bg-blue-50 border-blue-200',
};

const textColorMap = {
  error: 'text-red-800',
  success: 'text-green-800',
  warning: 'text-yellow-800',
  info: 'text-blue-800',
};

export const ToastContainer: React.FC = () => {
  const { messages, dismissToast } = useToast();

  return (
    <div className="fixed top-6 right-6 space-y-2 z-50 max-w-sm">
      {messages.map(message => (
        <div
          key={message.id}
          className={`border rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-top ${bgColorMap[message.type]}`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex-shrink-0 mt-0.5">{iconMap[message.type]}</div>
          <div className="flex-1">
            <h3 className={`font-semibold ${textColorMap[message.type]}`}>
              {message.title}
            </h3>
            {message.message && (
              <p className={`text-sm mt-1 ${textColorMap[message.type]}`}>
                {message.message}
              </p>
            )}
            {message.action && (
              <button
                onClick={message.action.onClick}
                className={`text-sm font-semibold mt-2 hover:underline ${textColorMap[message.type]}`}
              >
                {message.action.label}
              </button>
            )}
          </div>
          <button
            onClick={() => dismissToast(message.id)}
            className="flex-shrink-0 hover:opacity-70"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
```

**Update App.tsx:**
```typescript
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/common/Toast';

export default function App() {
  return (
    <ToastProvider>
      <NetworkStatus />
      <ToastContainer />
      <ErrorBoundary>
        <Router>
          <Routes>...</Routes>
        </Router>
      </ErrorBoundary>
    </ToastProvider>
  );
}
```

---

### 3. Create 403 Forbidden Page (20 min)

**`src/pages/Forbidden.tsx`:**
```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export const Forbidden: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6">
          <Shield className="w-20 h-20 mx-auto text-red-500 opacity-50" />
        </div>

        {/* Status Code */}
        <h1 className="text-5xl font-bold text-gray-900 mb-2">403</h1>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Erişim Reddedildi
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-2">
          Bu sayfaya erişim yetkiniz yok.
        </p>
        <p className="text-gray-600 mb-8">
          Yalnızca yöneticiler bu bölüme erişebilir.
        </p>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Link
            to="/"
            className="block bg-brand-primary text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Ana Sayfaya Dön
          </Link>
          <a
            href="mailto:support@mercora.com"
            className="block bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Destek İletişim
          </a>
        </div>

        {/* Additional Info */}
        <p className="text-sm text-gray-500 mt-8">
          Bunun bir hata olduğunu düşünüyorsanız lütfen destek ekibiyle iletişime geçin.
        </p>
      </div>
    </div>
  );
};
```

**Update Router (App.tsx):**
```typescript
<Routes>
  {/* ... other routes ... */}
  <Route path="/403" element={<Forbidden />} />
  <Route path="/forbidden" element={<Forbidden />} />
</Routes>
```

---

### 4. Form Validation Basics (45 min)

**`src/validators/formValidators.ts`:**
```typescript
export const validators = {
  required: (value: string) => 
    value.trim() ? null : 'Bu alan zorunludur',

  email: (value: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value) ? null : 'Geçerli bir e-posta adresi giriniz';
  },

  phone: (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 10 ? null : 'Telefon numarası 10 haneli olmalıdır';
  },

  minLength: (min: number) => (value: string) =>
    value.length >= min ? null : `En az ${min} karakter giriniz`,

  maxLength: (max: number) => (value: string) =>
    value.length <= max ? null : `En fazla ${max} karakter giriniz`,
};

export type ValidationRule = (value: string) => string | null;
```

**`src/hooks/useFormValidation.ts`:**
```typescript
import { useState, useCallback } from 'react';
import { ValidationRule } from '../validators/formValidators';

interface FormState {
  [key: string]: string;
}

interface FormErrors {
  [key: string]: string | null;
}

interface FormRules {
  [key: string]: ValidationRule[];
}

export const useFormValidation = (initialState: FormState, rules: FormRules) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = useCallback((name: string, value: string) => {
    const fieldRules = rules[name];
    if (!fieldRules) return null;

    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) return error;
    }
    return null;
  }, [rules]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate on change (debounced in real implementation)
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    Object.keys(rules).forEach(name => {
      const error = validateField(name, formData[name]);
      if (error) newErrors[name] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validateField, formData, rules]);

  return {
    formData,
    errors,
    touched,
    setFormData,
    handleChange,
    handleBlur,
    validateForm,
    isValid: Object.values(errors).every(e => e === null)
  };
};
```

**Usage in a component:**
```typescript
import { useFormValidation } from '../hooks/useFormValidation';
import { validators } from '../validators/formValidators';

export const SellerSettingsForm = () => {
  const { formData, errors, touched, handleChange, handleBlur, validateForm } = 
    useFormValidation(
      { storeName: '', email: '' },
      {
        storeName: [validators.required, validators.minLength(3)],
        email: [validators.required, validators.email]
      }
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast({ type: 'error', title: 'Lütfen hataları düzeltin' });
      return;
    }
    // Submit form...
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">Mağaza Adı</label>
        <input
          name="storeName"
          value={formData.storeName}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full border-2 rounded px-3 py-2 ${
            touched.storeName && errors.storeName ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
        />
        {touched.storeName && errors.storeName && (
          <p className="text-red-600 text-sm mt-1" role="alert">
            {errors.storeName}
          </p>
        )}
      </div>
      {/* More fields... */}
    </form>
  );
};
```

---

### 5. Network Status Component (25 min)

**`src/components/common/NetworkStatus.tsx`:**
```typescript
import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white py-3 px-4 flex items-center justify-between z-50">
      <div className="flex items-center gap-2">
        <WifiOff className="w-5 h-5" />
        <span className="font-semibold">Çevrimdışısınız</span>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="underline text-sm hover:opacity-90"
      >
        Tekrar Dene
      </button>
    </div>
  );
};
```

---

## Common Patterns

### Using Toast in Data Fetching
```typescript
const fetchSellers = async () => {
  try {
    setLoading(true);
    const data = await api.getSellers();
    setSellers(data);
  } catch (error) {
    const { showToast } = useToast();
    showToast({
      type: 'error',
      title: 'Satıcılar yüklenemedi',
      message: error.message || 'Lütfen daha sonra tekrar deneyin',
      action: { label: 'Tekrar Dene', onClick: fetchSellers }
    });
  } finally {
    setLoading(false);
  }
};
```

### Form Submission with Validation
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) {
    showToast({ type: 'error', title: 'Lütfen tüm hataları düzeltin' });
    return;
  }

  try {
    setLoading(true);
    await submitForm(formData);
    showToast({ type: 'success', title: 'Başarıyla kaydedildi!' });
    navigate('/success');
  } catch (error) {
    showToast({ type: 'error', title: 'Gönderme başarısız', message: error.message });
  } finally {
    setLoading(false);
  }
};
```

---

## Checklist for Each Sprint

### Sprint 1
- [ ] Install Toast system
- [ ] Create 403 page
- [ ] Fix all silent `.catch()` blocks in critical files
- [ ] Enhance ErrorBoundary
- [ ] Test Toast with 5+ real use cases

### Sprint 2
- [ ] Add form validation to 3+ forms
- [ ] Create Maintenance page
- [ ] Create Search empty state
- [ ] Add NetworkStatus component
- [ ] Document all messaging patterns
- [ ] Code review & QA

---

## Testing Checklist

```typescript
// Test Toast behavior
describe('Toast System', () => {
  test('shows error toast with action button', () => {
    // Render component with Toast
    // Trigger error
    // Verify toast appears with title, message, action
    // Click action button
    // Verify callback called
  });

  test('auto-dismisses success toast after 3s', () => {
    // Render success toast
    // Wait 3s
    // Verify toast disappears
  });
});

// Test form validation
describe('Form Validation', () => {
  test('shows error on invalid email', () => {
    // Type invalid email
    // Blur field
    // Verify error message appears
  });

  test('clears error on valid input', () => {
    // Type invalid → shows error
    // Type valid → error disappears
  });
});

// Test 403 page
describe('Forbidden Page', () => {
  test('renders on unauthorized access', () => {
    // Navigate to /admin as non-admin
    // Verify 403 page renders
  });
});
```

---

**Last Updated:** 2026-05-23  
**Version:** 1.0
