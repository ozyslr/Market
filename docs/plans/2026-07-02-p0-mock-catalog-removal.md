# P0 Mock Katalog Ağının Sökülmesi — Uygulama Planı

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** `MOCK_PRODUCTS`/`MOCK_SELLERS` mock katalogunu 5 transaksiyonel yüzeyden (Cart, Checkout, SellerStore, AdminSellers, UserProfile) ve besleyen servis fallback'lerinden söküp gerçek Firestore verisine bağlamak.

**Architecture:** Üç katman, aşağıdan yukarı. (1) Servis katmanı: ID ile toplu ürün çekme + slug/id ile satıcı çekme fonksiyonları eklenir, `getProducts`'taki sessiz mock fallback'leri kaldırılır (hata fırlatır). (2) Paylaşılan durum bileşenleri: `LoadingState`/`ErrorState`/`EmptyState`. (3) 5 sayfa gerçek servislere bağlanır; loading/error/empty/invalid-item durumları paylaşılan bileşenlerle standartlaşır. Mock veri dosyaları silinmez; yalnızca seed/test için karantinaya alınır.

**Tech Stack:** React 19 + TypeScript, Firebase Firestore (client SDK), Vitest + @testing-library/react + jsdom. Servis testleri `vi.hoisted` + `vi.mock('firebase/firestore')` kalıbını izler (mevcut örnek: `src/services/__tests__/campaignService.test.ts`).

**Kaynak spec:** `docs/superpowers/specs/2026-07-02-p0-mock-catalog-removal-design.md`

**Önemli gerçek:** `productService.ts` mock'u `../mockData` (`src/mockData.ts`) üzerinden import eder — `src/data/mockProducts.ts` DEĞİL. İki ayrı mock kaynağı vardır; her ikisini de dikkate al.

**Kapsam dışı (bu planda YOK):** `getProductBySlug` mock fallback'i (ProductDetail'i besler — ayrı faz), Home/ProductDetail/SearchResults karüselleri, searchService/moderationService mock'ları, Stripe→ledger, satıcı kategori yönetimi, admin menü. Bunlara dokunma.

---

## Task 1: `getProductsByIds` servis fonksiyonu (TDD)

Sepet/checkout line item'larını ID ile toplu çözer. Firestore `where(documentId(), 'in', chunk)` — `in` operatörü en fazla 10 değer alır, bu yüzden 10'lu chunk'lara böl.

**Files:**

- Modify: `src/services/productService.ts` (import `documentId`; yeni fonksiyon ekle)
- Test: `src/services/__tests__/productService.test.ts` (yeni dosya)

**Step 1: Failing test yaz**

`src/services/__tests__/productService.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockGetDocs,
  mockCollection,
  mockQuery,
  mockWhere,
  mockDocumentId,
  mockHandleFirestoreError,
} = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockCollection: vi.fn(),
  mockQuery: vi.fn(),
  mockWhere: vi.fn(),
  mockDocumentId: vi.fn(() => '__name__'),
  mockHandleFirestoreError: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  getDocs: mockGetDocs,
  documentId: mockDocumentId,
  doc: vi.fn(),
  getDoc: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  addDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  runTransaction: vi.fn(),
  increment: vi.fn(),
  writeBatch: vi.fn(),
}));

vi.mock('../../lib/firebase', () => ({
  db: {},
  handleFirestoreError: mockHandleFirestoreError,
  OperationType: { LIST: 'LIST', GET: 'GET', CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE' },
}));

vi.mock('../priceHistoryService', () => ({ recordPrice: vi.fn() }));

import { getProductsByIds } from '../productService';

function snapFromDocs(docs: { id: string; data: any }[]) {
  return { docs: docs.map((d) => ({ id: d.id, data: () => d.data })), empty: docs.length === 0 };
}

describe('getProductsByIds', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty array for empty input without querying', async () => {
    const result = await getProductsByIds([]);
    expect(result).toEqual([]);
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it('fetches products for given ids in a single chunk', async () => {
    mockGetDocs.mockResolvedValueOnce(
      snapFromDocs([
        { id: 'a', data: { title: 'A', slug: 'a' } },
        { id: 'b', data: { title: 'B', slug: 'b' } },
      ]),
    );
    const result = await getProductsByIds(['a', 'b']);
    expect(result.map((p) => p.id)).toEqual(['a', 'b']);
    expect(mockGetDocs).toHaveBeenCalledTimes(1);
  });

  it('chunks ids in groups of 10', async () => {
    const ids = Array.from({ length: 12 }, (_, i) => `id${i}`);
    mockGetDocs
      .mockResolvedValueOnce(
        snapFromDocs(ids.slice(0, 10).map((id) => ({ id, data: { title: id } }))),
      )
      .mockResolvedValueOnce(
        snapFromDocs(ids.slice(10).map((id) => ({ id, data: { title: id } }))),
      );
    const result = await getProductsByIds(ids);
    expect(mockGetDocs).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(12);
  });

  it('omits ids that do not exist (no mock fallback)', async () => {
    mockGetDocs.mockResolvedValueOnce(snapFromDocs([{ id: 'a', data: { title: 'A' } }]));
    const result = await getProductsByIds(['a', 'missing']);
    expect(result.map((p) => p.id)).toEqual(['a']);
  });

  it('throws on Firestore error (no mock fallback)', async () => {
    mockGetDocs.mockRejectedValueOnce(new Error('firestore down'));
    await expect(getProductsByIds(['a'])).rejects.toThrow();
    expect(mockHandleFirestoreError).toHaveBeenCalled();
  });
});
```

**Step 2: Testi çalıştır, fail görsün**

Run: `npx vitest run src/services/__tests__/productService.test.ts`
Expected: FAIL — `getProductsByIds is not a function`.

**Step 3: Minimal implementasyon**

`src/services/productService.ts` — satır 18'deki firestore import'una `documentId` ekle:

```typescript
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  limit,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
  increment,
  writeBatch,
  documentId,
} from 'firebase/firestore';
```

`getProducts` fonksiyonundan HEMEN ÖNCE (satır ~90) ekle:

```typescript
/**
 * Fetch multiple products by their document IDs in one pass.
 * Firestore `in` supports max 10 values, so ids are chunked in 10s.
 * Returns ONLY the products that exist — callers detect missing/invalid
 * ids by diffing requested ids against the returned ids. No mock fallback.
 */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  try {
    const productsRef = collection(db, 'products');
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const q = query(productsRef, where(documentId(), 'in', chunk));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
      }),
    );

    const found = results.flat().map(ensureProductHasSlug);
    // Preserve requested order, drop missing ids.
    const byId = new Map(found.map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter((p): p is Product => p != null);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products/byIds');
    throw error;
  }
}
```

**Step 4: Testi çalıştır, pass görsün**

Run: `npx vitest run src/services/__tests__/productService.test.ts`
Expected: PASS (5 test).

**Step 5: Commit**

```bash
git add src/services/productService.ts src/services/__tests__/productService.test.ts
git commit -m "feat(products): add getProductsByIds batch fetch (no mock fallback)"
```

---

## Task 2: `getProductById` servis fonksiyonu (TDD)

**Files:**

- Modify: `src/services/productService.ts`
- Test: `src/services/__tests__/productService.test.ts`

**Step 1: Failing test ekle** (aynı dosyaya, `getProductById`'yi import satırına ekle):

```typescript
import { getProductsByIds, getProductById } from '../productService';
```

`firebase/firestore` mock'una `getDoc`/`doc` zaten var. Testler:

```typescript
describe('getProductById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the product when it exists', async () => {
    const { getDoc } = await import('firebase/firestore');
    (getDoc as any).mockResolvedValueOnce({
      exists: () => true,
      id: 'p1',
      data: () => ({ title: 'P1' }),
    });
    const result = await getProductById('p1');
    expect(result?.id).toBe('p1');
  });

  it('returns null when the product does not exist', async () => {
    const { getDoc } = await import('firebase/firestore');
    (getDoc as any).mockResolvedValueOnce({ exists: () => false });
    const result = await getProductById('missing');
    expect(result).toBeNull();
  });

  it('throws on Firestore error', async () => {
    const { getDoc } = await import('firebase/firestore');
    (getDoc as any).mockRejectedValueOnce(new Error('down'));
    await expect(getProductById('p1')).rejects.toThrow();
  });
});
```

**Step 2: Run** — `npx vitest run src/services/__tests__/productService.test.ts` — FAIL (`getProductById is not a function`).

**Step 3: Implementasyon** (Task 1 fonksiyonunun altına):

```typescript
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const snapshot = await getDoc(doc(db, 'products', id));
    if (!snapshot.exists()) return null;
    return ensureProductHasSlug({ id: snapshot.id, ...snapshot.data() } as Product);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `products/${id}`);
    throw error;
  }
}
```

**Step 4: Run** — PASS.

**Step 5: Commit**

```bash
git add src/services/productService.ts src/services/__tests__/productService.test.ts
git commit -m "feat(products): add getProductById"
```

---

## Task 3: `getProducts` mock fallback'lerini kaldır (TDD)

İki mock noktası var: `productService.ts:135` (`if (products.length === 0) products = MOCK_PRODUCTS;`) ve `:158-162` (catch → mock). İkisi de kaldırılır. **`getProductBySlug`'a DOKUNMA** (kapsam dışı).

**Files:**

- Modify: `src/services/productService.ts:135`, `:158-162`, ve satır 21 import
- Test: `src/services/__tests__/productService.test.ts`

**Step 1: Failing test ekle**

`getProducts`'ı import satırına ekle: `import { getProductsByIds, getProductById, getProducts } from '../productService';`

```typescript
describe('getProducts (no mock fallback)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty array when Firestore has no products', async () => {
    mockGetDocs.mockResolvedValueOnce(snapFromDocs([]));
    const result = await getProducts();
    expect(result).toEqual([]);
  });

  it('throws when Firestore query fails', async () => {
    mockGetDocs.mockRejectedValueOnce(new Error('firestore down'));
    await expect(getProducts()).rejects.toThrow();
  });
});
```

> Not: `getProducts` `orderBy`/`limit` çağırır — mock'ta bunlar `vi.fn()` olarak var, sorun çıkmaz.

**Step 2: Run** — FAIL: boş sonuç testinde `MOCK_PRODUCTS` dönecek (uzunluk 0 değil); hata testinde throw yerine mock dönecek.

**Step 3: Kaldırma**

`src/services/productService.ts:135` satırını **sil**:

```typescript
if (products.length === 0) products = MOCK_PRODUCTS; // ← BU SATIRI SİL
```

Catch bloğunu (`:158-162`) şununla değiştir:

```typescript
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products');
    throw error;
  }
```

Satır 21 import'unu güncelle — `MOCK_PRODUCTS` artık `getProducts`'ta kullanılmıyor ama `getProductBySlug` HÂLÂ kullanıyor (kapsam dışı), o yüzden import'u **bırak**:

```typescript
import { MOCK_PRODUCTS, CATEGORIES } from '../mockData';
```

(Değişiklik yok — sadece teyit et. `getProductBySlug` kapsam dışı olduğu için `MOCK_PRODUCTS` import'u bu pass'te kalır.)

**Step 4: Run** — `npx vitest run src/services/__tests__/productService.test.ts` — PASS (tüm testler).

**Step 5: Commit**

```bash
git add src/services/productService.ts src/services/__tests__/productService.test.ts
git commit -m "fix(products): remove silent MOCK_PRODUCTS fallback from getProducts (ACC-03)"
```

---

## Task 4: `getSellerBySlug` + `getSellerById` (TDD)

**Files:**

- Modify: `src/services/userService.ts` (import `where`, `query`, `limit` ekle; iki fonksiyon)
- Test: `src/services/__tests__/userService.test.ts` (yeni dosya)

**Step 1: Failing test yaz**

`src/services/__tests__/userService.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockGetDocs,
  mockGetDoc,
  mockCollection,
  mockQuery,
  mockWhere,
  mockLimit,
  mockDoc,
  mockHandleFirestoreError,
} = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockGetDoc: vi.fn(),
  mockCollection: vi.fn(),
  mockQuery: vi.fn(),
  mockWhere: vi.fn(),
  mockLimit: vi.fn(),
  mockDoc: vi.fn(),
  mockHandleFirestoreError: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  limit: mockLimit,
  getDocs: mockGetDocs,
  getDoc: mockGetDoc,
  doc: mockDoc,
  deleteDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  setDoc: vi.fn(),
  arrayUnion: vi.fn(),
  arrayRemove: vi.fn(),
}));

vi.mock('../../lib/firebase', () => ({
  db: {},
  handleFirestoreError: mockHandleFirestoreError,
  OperationType: { LIST: 'LIST', GET: 'GET' },
}));

import { getSellerBySlug, getSellerById } from '../userService';

describe('getSellerBySlug', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns the seller when a slug matches', async () => {
    mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 's1', data: () => ({ storeName: 'Shop', slug: 'shop' }) }],
    });
    const s = await getSellerBySlug('shop');
    expect(s?.id).toBe('s1');
  });
  it('returns null when no slug matches (no mock fallback)', async () => {
    mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });
    expect(await getSellerBySlug('nope')).toBeNull();
  });
  it('throws on error', async () => {
    mockGetDocs.mockRejectedValueOnce(new Error('down'));
    await expect(getSellerBySlug('shop')).rejects.toThrow();
  });
});

describe('getSellerById', () => {
  beforeEach(() => vi.clearAllMocks());
  it('returns the seller when it exists', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 's1',
      data: () => ({ storeName: 'Shop' }),
    });
    expect((await getSellerById('s1'))?.id).toBe('s1');
  });
  it('returns null when missing', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });
    expect(await getSellerById('x')).toBeNull();
  });
});
```

**Step 2: Run** — `npx vitest run src/services/__tests__/userService.test.ts` — FAIL.

**Step 3: Implementasyon**

`src/services/userService.ts` satır 1-13 import'una `query, where, limit` ekle:

```typescript
import {
  collection,
  query,
  where,
  limit,
  getDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  setDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
```

`getSellers` fonksiyonunun altına (satır ~61) ekle:

```typescript
export async function getSellerById(id: string): Promise<Seller | null> {
  try {
    const snapshot = await getDoc(doc(db, 'sellers', id));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Seller;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `sellers/${id}`);
    throw error;
  }
}

export async function getSellerBySlug(slug: string): Promise<Seller | null> {
  try {
    const q = query(collection(db, 'sellers'), where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as Seller;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `sellers?slug=${slug}`);
    throw error;
  }
}
```

**Step 4: Run** — PASS.

**Step 5: Commit**

```bash
git add src/services/userService.ts src/services/__tests__/userService.test.ts
git commit -m "feat(sellers): add getSellerById + getSellerBySlug lookups"
```

---

## Task 5: Paylaşılan durum bileşenleri (LoadingState / ErrorState / EmptyState)

ACC-02 (paylaşılan bileşen) + ACC-03 (hata + retry). Marka temasıyla uyumlu, minimal. Önce mevcut bir eşdeğer var mı kontrol et.

**Step 0: Mevcut bileşen kontrolü**

Run: `grep -rin "onRetry\|Yeniden dene\|EmptyState\|ErrorState" src/components | head`
Varsa mevcut olanı kullan/genişlet; yoksa oluştur.

**Files:**

- Create: `src/components/shared/DataStates.tsx`
- Test: `src/components/shared/__tests__/DataStates.test.tsx`

**Step 1: Failing test**

`src/components/shared/__tests__/DataStates.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState, EmptyState, LoadingState } from '../DataStates';

describe('DataStates', () => {
  it('LoadingState renders a status role', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toBeTruthy();
  });
  it('ErrorState shows message and calls onRetry', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Yükleme hatası" onRetry={onRetry} />);
    expect(screen.getByText('Yükleme hatası')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /yeniden dene/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
  it('EmptyState shows title', () => {
    render(<EmptyState title="Ürün yok" />);
    expect(screen.getByText('Ürün yok')).toBeTruthy();
  });
});
```

**Step 2: Run** — `npx vitest run src/components/shared/__tests__/DataStates.test.tsx` — FAIL.

**Step 3: Implementasyon**

`src/components/shared/DataStates.tsx` (mevcut Tailwind + marka moru #6418E5 ile uyumlu; ikonlar lucide-react):

```tsx
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

export function LoadingState({ label = 'Yükleniyor…' }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500"
    >
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <AlertCircle className="h-10 w-10 text-red-500" />
      <p className="max-w-md text-sm text-gray-700">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-[#6418E5] px-4 py-2 text-sm font-medium text-white hover:bg-[#5313c0]"
      >
        Yeniden dene
      </button>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-gray-500">
      <Inbox className="h-10 w-10" />
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {description && <p className="max-w-md text-sm">{description}</p>}
    </div>
  );
}
```

**Step 4: Run** — PASS.

**Step 5: Commit**

```bash
git add src/components/shared/DataStates.tsx src/components/shared/__tests__/DataStates.test.tsx
git commit -m "feat(ui): add shared LoadingState/ErrorState/EmptyState (ACC-02/ACC-03)"
```

---

## Task 6: Cart.tsx — gerçek veriye bağla

**Files:**

- Modify: `src/pages/Cart.tsx` (satır 9 import, 43, 91-94, 276)

**Adımlar (manuel doğrulamalı — component test altyapısı yok, dev sunucusunda doğrula):**

**Step 1:** Satır 9'daki `import { MOCK_PRODUCTS } from '@/data/mockProducts';` **sil**. Şunu ekle:

```typescript
import { getProductsByIds, getProducts } from '@/services/productService';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/DataStates';
import type { Product } from '@/types';
```

**Step 2:** Ürünleri çeken bir yükleme durumu ekle. Bileşen içine (mevcut `items` erişiminden sonra):

```typescript
const [products, setProducts] = useState<Product[]>([]);
const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

const productIds = useMemo(() => items.map((i) => i.productId), [items]);

const loadProducts = useCallback(async () => {
  setStatus('loading');
  try {
    setProducts(productIds.length ? await getProductsByIds(productIds) : []);
    setStatus('ready');
  } catch {
    setStatus('error');
  }
}, [productIds]);

useEffect(() => {
  loadProducts();
}, [loadProducts]);
```

(`useState, useMemo, useCallback, useEffect` React import'unda mevcut değilse ekle.)

**Step 3:** Satır 43 ve 91-94'teki `MOCK_PRODUCTS.find(p => p.id === i.productId)` çağrılarını `products.find(...)` ile değiştir. Line-item kurulurken **dönmeyen** productId'leri geçersiz işaretle:

```typescript
const missingIds = productIds.filter((id) => !products.some((p) => p.id === id));
```

Geçersiz ürün varsa toplamdan çıkar (mevcut `itemSubtotal` hesabı yalnızca `products` içinde bulunanları toplasın) ve kullanıcıya banner göster:

```tsx
{
  missingIds.length > 0 && (
    <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
      Sepetindeki {missingIds.length} ürün artık mevcut değil ve toplamdan çıkarıldı.
    </div>
  );
}
```

**Step 4:** Render dallanması: en üste ekle:

```tsx
if (status === 'loading') return <LoadingState />;
if (status === 'error') return <ErrorState message="Sepet yüklenemedi." onRetry={loadProducts} />;
if (items.length === 0) return /* mevcut boş-sepet UI'si */;
```

(Boş-sepet zaten varsa onu koru; yeni `EmptyState` şart değil.)

**Step 5:** Satır 276 öneri karüseli: `MOCK_PRODUCTS.slice(4, 6)` → ayrı bir state ile `getProducts({ limit: 2 })`. Böylece dosyadan `MOCK_PRODUCTS` tamamen kalkar. Basit tut:

```typescript
const [suggested, setSuggested] = useState<Product[]>([]);
useEffect(() => {
  getProducts({ limit: 2 })
    .then(setSuggested)
    .catch(() => setSuggested([]));
}, []);
```

Karüsel `suggested`'ı render etsin.

**Step 6: Doğrula** — Run: `npm run lint` (tsc --noEmit) → 0 hata. Dev sunucuda (`npm run dev`) sepete gerçek ürün ekle, göründüğünü doğrula.

**Step 7: Commit**

```bash
git add src/pages/Cart.tsx
git commit -m "feat(cart): resolve line items from Firestore, remove MOCK_PRODUCTS (ACC-03)"
```

---

## Task 7: Checkout.tsx — gerçek veriye bağla

**Files:**

- Modify: `src/pages/Checkout.tsx` (satır 22 import, 185, 398-406)

**Step 1:** Satır 22 `import { MOCK_PRODUCTS } ...` **sil**; ekle:

```typescript
import { getProductsByIds } from '@/services/productService';
import { LoadingState, ErrorState } from '@/components/shared/DataStates';
```

**Step 2:** `MOCK_PRODUCTS.find` (satır 185) yerine sepet ID'leriyle `getProductsByIds` çağır (Cart ile aynı loading/error deseni: `status` state + `loadProducts`). `cartProducts` bulunan ürünlerden kurulur.

**Step 3:** **Geçersiz ürün → checkout bloklama.** `missingIds.length > 0` ise ödeme adımını devre dışı bırak ve kullanıcıyı sepete yönlendir:

```tsx
{
  missingIds.length > 0 && (
    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
      Sepetinde artık mevcut olmayan ürünler var.{' '}
      <button onClick={() => navigate('/cart')} className="underline font-medium">
        Sepete dön
      </button>
    </div>
  );
}
```

Sipariş oluşturma butonu `disabled={missingIds.length > 0}` olsun.

**Step 4:** Sipariş kalemleri (satır 398-406) çözülen gerçek ürünlerden kurulsun. Sunucu doğrulaması (`validateCartStock`) değişmez.

**Step 5: Doğrula** — `npm run lint` → 0 hata. Dev sunucuda gerçek ürünle checkout akışı.

**Step 6: Commit**

```bash
git add src/pages/Checkout.tsx
git commit -m "feat(checkout): build order items from Firestore, block on invalid items (ACC-03)"
```

---

## Task 8: SellerStore.tsx — gerçek veriye bağla

**Files:**

- Modify: `src/pages/SellerStore.tsx` (satır 30, 32 import, 44-83, 106, 211)

**Step 1:** Satır 30 (`MOCK_PRODUCTS`) ve 32 (`MOCK_SELLERS`) import'larını **sil**; ekle:

```typescript
import { getSellerBySlug, getSellerById } from '@/services/userService';
import { getProducts } from '@/services/productService';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/DataStates';
import type { Seller, Product } from '@/types';
```

**Step 2:** `routeKey` (satır 79) — ACC-04 gereği `useMemo` ile sabitle:

```typescript
const routeKey = useMemo(() => slugParam ?? id, [slugParam, id]);
```

**Step 3:** Satır 83 `MOCK_SELLERS.find(...) || MOCK_SELLERS[0]` bloğunu gerçek yüklemeyle değiştir:

```typescript
const [seller, setSeller] = useState<Seller | null>(null);
const [products, setProducts] = useState<Product[]>([]);
const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

const loadStore = useCallback(async () => {
  if (!routeKey) {
    setStatus('error');
    return;
  }
  setStatus('loading');
  try {
    const s = (await getSellerBySlug(routeKey)) ?? (await getSellerById(routeKey));
    if (!s) {
      setSeller(null);
      setStatus('ready');
      return;
    } // ready + null → "bulunamadı"
    setSeller(s);
    setProducts(await getProducts({ sellerId: s.id }));
    setStatus('ready');
  } catch {
    setStatus('error');
  }
}, [routeKey]);

useEffect(() => {
  loadStore();
}, [loadStore]);
```

**Step 4:** Aşağı akıştaki tüm `sellerData` referanslarını `seller`'a taşı ve null-guard ekle. Render dallanması:

```tsx
if (status === 'loading') return <LoadingState />;
if (status === 'error') return <ErrorState message="Mağaza yüklenemedi." onRetry={loadStore} />;
if (!seller) return <EmptyState title="Mağaza bulunamadı" />;
```

Satır 106 `getSellerStarSummary(sellerData.id)` → `getSellerStarSummary(seller.id)` (guard sonrası güvenli).

**Step 5:** Satır 211 `MOCK_PRODUCTS.filter(...)` → `const sellerProducts = products;`. Ürün yoksa listede `<EmptyState title="Bu mağazada henüz ürün yok" />`.

**Step 6: Doğrula** — `npm run lint` → 0 hata. Dev sunucuda gerçek bir satıcının `/store/:slug` sayfasını aç; envanterdeki ürünlerin göründüğünü doğrula.

**Step 7: Commit**

```bash
git add src/pages/SellerStore.tsx
git commit -m "feat(sellerstore): load real seller+products, remove MOCK fallback (ACC-03/ACC-04)"
```

---

## Task 9: AdminSellers.tsx — mock fallback'i sök

**Files:**

- Modify: `src/pages/AdminSellers.tsx` (satır 35, 84, 87)

**Step 1:** `MOCK_SELLERS` import'unu (satır 35) **sil**. `getSellers` (userService) zaten kullanılıyor olmalı — teyit et.

**Step 2:** Satır 84 ve 87'deki fallback'leri kaldır. Yükleme desenini üç duruma çevir:

```typescript
const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
const load = useCallback(async () => {
  setStatus('loading');
  try {
    setSellers(await getSellers());
    setStatus('ready');
  } catch {
    setStatus('error');
  }
}, []);
useEffect(() => {
  load();
}, [load]);
```

Boş sonuçta **fallback yok** — `sellers` boş kalır.

**Step 3:** Render dallanması:

```tsx
if (status === 'loading') return <LoadingState />;
if (status === 'error') return <ErrorState message="Satıcılar yüklenemedi." onRetry={load} />;
{
  sellers.length === 0 && status === 'ready' && <EmptyState title="Kayıtlı satıcı yok" />;
}
```

**Step 4: Doğrula** — `npm run lint` → 0 hata. Admin panelinde satıcı listesi gerçek Firestore'dan; boş/hata durumları doğru.

**Step 5: Commit**

```bash
git add src/pages/AdminSellers.tsx
git commit -m "fix(admin): remove MOCK_SELLERS fallback, add error/empty states (ACC-03)"
```

---

## Task 10: UserProfile.tsx — mock okumaları gerçek servislere bağla

**Files:**

- Modify: `src/pages/UserProfile.tsx`

**Step 1:** `grep -n "MOCK_" src/pages/UserProfile.tsx` ile tüm mock okumalarını bul (sipariş/wishlist).

**Step 2:** Sipariş okumasını `orderService` (ör. `getOrdersByUser`/mevcut fonksiyon) ile, wishlist'i mevcut wishlist servisi/context ile değiştir (ikisi de canlı — denetim raporu). Loading/error durumları paylaşılan bileşenlerle.

**Step 3:** **Kapsam dışı — DEĞİŞTİRME:** satır 432 sadakat puanı hardcoded `0`. Üstüne şu yorumu ekle:

```tsx
{
  /* TODO(scope: loyalty-phase): puan backend'i yok; ayrı fazda ele alınacak */
}
```

**Step 4: Doğrula** — `npm run lint` → 0 hata. Profil sayfasında gerçek sipariş/wishlist.

**Step 5: Commit**

```bash
git add src/pages/UserProfile.tsx
git commit -m "feat(profile): wire orders/wishlist to real services, drop mocks (ACC-03)"
```

---

## Task 11: Mock dosyalarını karantinaya al + regresyon taraması

**Step 1: Runtime import'ları temizlendi mi doğrula**

Run:

```bash
grep -rn "MOCK_PRODUCTS\|MOCK_SELLERS" src/pages
grep -rn "MOCK_PRODUCTS\|MOCK_SELLERS" src/services
```

Beklenen: `src/pages`'te **sonuç yok**. `src/services`'te yalnızca:

- `productService.ts` — `getProductBySlug` içindeki `MOCK_PRODUCTS` (kapsam dışı, KALIR)
- `seedService.ts` — seed (KALIR)
- `searchService.ts`, `moderationService.ts`, `botService.ts`, `campaignService.ts` — kapsam dışı (KALIR, ayrı fazda)

Beş yüzeyin beslediği fallback'ler (getProducts) temiz olmalı.

**Step 2: Karantina niyetini belgele**

`src/data/mockProducts.ts` ve `src/data/mockSellers.ts` başına, ayrıca `src/mockData.ts` başına yorum ekle:

```typescript
/**
 * KARANTİNA: Bu mock veri YALNIZCA seedService ve testler tarafından kullanılır.
 * Runtime/UI kodundan (sayfalar, servisler) import ETMEYİN. Gerçek veri için
 * productService/userService fonksiyonlarını kullanın. (ACC-03)
 */
```

**Step 3: (Opsiyonel) ESLint guard**

`.eslintrc.json`'a `no-restricted-imports` ile `src/pages/**` ve ilgili servisler için mock dosyalarını yasakla. Zaman kısıtlıysa atla — yorum + regresyon grep yeterli.

**Step 4: Tam test + lint**

Run:

```bash
npx vitest run
npm run lint
```

Beklenen: tüm testler PASS, tsc 0 hata.

**Step 5: Commit**

```bash
git add src/data/mockProducts.ts src/data/mockSellers.ts src/mockData.ts .eslintrc.json
git commit -m "chore: quarantine mock data for seed/test only (ACC-03)"
```

---

## Final Doğrulama (spec Başarı Kriterleri)

Her biri TRUE olmalı:

1. ✅ Sepete eklenen gerçek ürün Cart + Checkout'ta doğru görünür; sipariş gerçek üründen kurulur.
2. ✅ Satıcı `/store/:slug` vitrininde gerçek ürünlerini görür; `MOCK_SELLERS[0]` fallback yok.
3. ✅ AdminSellers gerçek satıcıları listeler; boş→empty, hata→error+retry; sahte satıcı yok.
4. ✅ `getProducts` hata durumunda mock döndürmez; UI error+retry gösterir.
5. ✅ `src/pages`'te ve `getProducts` yolunda `MOCK_PRODUCTS`/`MOCK_SELLERS` runtime okuması yok (`getProductBySlug` + seed hariç).
6. ✅ Loading/error/empty üç durumu paylaşılan bileşenlerle 5 yüzeyde tutarlı.

**Genel doğrulama komutları:**

```bash
npx vitest run          # tüm birim/bileşen testleri
npm run lint            # tsc --noEmit, 0 hata
npm run dev             # manuel: sepet→checkout, /store/:slug, admin satıcılar
```
