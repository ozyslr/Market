# Epic X — Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 9 feature grubunu çalışır hale getir: Autocomplete Search, Homepage Pinning, Notification System, Price Drop Tracking, Product Variants UI, 3rd Level Categories, Seller Finance (Firestore), Behavior Tracking + AI, Admin Categories derinleştirme.

**Architecture:** Firebase/Firestore backend, React context pattern (mevcut WishlistContext/FollowsContext şablonu), Tailwind + Lucide UI. Her feature kendi servis dosyasına sahip.

**Tech Stack:** React 18, TypeScript, Firebase Firestore, Tailwind CSS, Lucide React, Framer Motion, Gemini AI

---

## Mevcut Durum (Okuma Notları)

- `types.ts`: `ProductVariant`, `Product.variants`, `Category.level`, `Product.featured` — tipler hazır
- `App.tsx`: Route'lar eksiksiz, `FollowsProvider` + `WishlistProvider` sarmalı var
- `pages/AdminCategories.tsx` — mevcut, geliştirilecek
- `pages/SellerFinance.tsx` — mevcut, Firestore bağlantısı yok
- `pages/SearchResults.tsx` — mevcut, navbar autocomplete yok
- Notification, PriceDrop servisleri yok

---

## X9 — Autocomplete Search (Navbar)

**Dosyalar:**
- Modify: `components/layout/Navbar.tsx` (arama input kısmı)
- Create: `services/searchService.ts`

### Task X9.1 — searchService.ts

- [ ] `src/services/searchService.ts` oluştur:
```typescript
import { MOCK_PRODUCTS } from '@/mockData';
import { Product } from '@/types';

export function searchProducts(query: string, limit = 5): Product[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return MOCK_PRODUCTS.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    p.tags?.some(t => t.toLowerCase().includes(q))
  ).slice(0, limit);
}
```

### Task X9.2 — Navbar'a autocomplete ekle

- [ ] Navbar'daki arama inputunu bul (search input wrapper)
- [ ] `searchQuery` state'i zaten varsa onu kullan, yoksa ekle
- [ ] Arama inputunun altına dropdown panel ekle:

```tsx
// Navbar'da search input'un hemen altına ekle (relative wrapper içinde)
import { searchProducts } from '@/services/searchService';
import { useNavigate } from 'react-router-dom';

// state
const [suggestions, setSuggestions] = useState<Product[]>([]);
const [showSuggestions, setShowSuggestions] = useState(false);

// handler
function handleSearchChange(val: string) {
  setSearchQuery(val);
  setSuggestions(searchProducts(val, 6));
  setShowSuggestions(val.length > 1);
}

// JSX — search input'un wrapper'ını relative yap, altına ekle:
{showSuggestions && suggestions.length > 0 && (
  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-[#1A1033]/5 z-50 overflow-hidden">
    {suggestions.map(p => (
      <button
        key={p.id}
        onClick={() => { navigate(`/product/${p.slug}`); setShowSuggestions(false); setSearchQuery(''); }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F8F8FA] transition-colors text-left"
      >
        <img src={p.images[0]} className="w-10 h-10 object-contain rounded-lg bg-gray-50" referrerPolicy="no-referrer" />
        <div>
          <p className="text-xs font-bold text-[#1A1033] line-clamp-1">{p.title}</p>
          <p className="text-[10px] text-[#1A1033]/40 font-bold">{p.brand} · £{p.price}</p>
        </div>
      </button>
    ))}
    <button
      onClick={() => { navigate(`/search?q=${searchQuery}`); setShowSuggestions(false); }}
      className="w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest text-accent bg-accent/5 hover:bg-accent/10 transition-colors"
    >
      Tümünü Gör — "{searchQuery}"
    </button>
  </div>
)}
```

- [ ] `onBlur` ile `setTimeout(()=>setShowSuggestions(false), 200)` ekle (click önce kaybolmasın)
- [ ] `npx tsc --noEmit` → 0 hata

---

## X8 — Homepage Pinning (Admin)

**Dosyalar:**
- Create: `services/featuredService.ts`
- Modify: `pages/AdminProducts.tsx` (featured toggle)
- Modify: `pages/Home.tsx` (Firestore'dan pinned ürünleri çek)

### Task X8.1 — featuredService.ts

- [ ] `src/services/featuredService.ts` oluştur:
```typescript
import { collection, query, where, getDocs, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const PRODUCTS_COL = 'products';

export async function getFeaturedProducts(marketKey = 'UK', count = 8) {
  const q = query(
    collection(db, PRODUCTS_COL),
    where('featured', '==', true),
    where('status', '==', 'approved'),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function toggleFeatured(productId: string, featured: boolean) {
  await updateDoc(doc(db, PRODUCTS_COL, productId), { featured });
}
```

### Task X8.2 — AdminProducts'ta pin toggle

- [ ] `pages/AdminProducts.tsx` içinde ürün listesindeki her satıra Featured toggle ekle:
```tsx
import { toggleFeatured } from '@/services/featuredService';

// Her ürün satırında:
<button
  onClick={() => toggleFeatured(product.id, !product.featured)}
  className={cn('p-2 rounded-lg transition-colors', product.featured ? 'text-yellow-500 bg-yellow-50' : 'text-[#1A1033]/20 hover:text-yellow-400')}
  title={product.featured ? 'Featured kaldır' : 'Featured yap'}
>
  <Star size={16} fill={product.featured ? 'currentColor' : 'none'} />
</button>
```

### Task X8.3 — Home.tsx featured section

- [ ] `pages/Home.tsx` içinde mevcut MOCK_PRODUCTS yerine Firestore'dan çek (fallback MOCK ile):
```tsx
const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
useEffect(() => {
  getFeaturedProducts().then(prods => {
    setFeaturedProducts(prods.length ? prods as Product[] : MOCK_PRODUCTS.filter(p => p.featured));
  }).catch(() => setFeaturedProducts(MOCK_PRODUCTS.filter(p => p.featured)));
}, []);
```

---

## X3 — Notification System

**Dosyalar:**
- Create: `services/notificationService.ts`
- Create: `context/NotificationContext.tsx`
- Modify: `App.tsx` (NotificationProvider ekle)
- Modify: `components/layout/Navbar.tsx` (bell icon + badge)

### Task X3.1 — Firestore şema + servis

```
/notifications/{notifId}
  userId: string
  type: 'order_update' | 'price_drop' | 'review_approved' | 'follow' | 'system'
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
```

- [ ] `src/services/notificationService.ts` oluştur:
```typescript
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc, writeBatch, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COL = 'notifications';

export interface Notification {
  id: string;
  userId: string;
  type: 'order_update' | 'price_drop' | 'review_approved' | 'follow' | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export async function getUserNotifications(userId: string, count = 20): Promise<Notification[]> {
  const q = query(collection(db, COL), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
}

export async function markAsRead(notifId: string) {
  await updateDoc(doc(db, COL, notifId), { read: true });
}

export async function markAllRead(userId: string) {
  const q = query(collection(db, COL), where('userId', '==', userId), where('read', '==', false));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
}

export async function createNotification(notif: Omit<Notification, 'id'>) {
  await addDoc(collection(db, COL), notif);
}
```

### Task X3.2 — NotificationContext.tsx

- [ ] `src/context/NotificationContext.tsx` oluştur (WishlistContext pattern):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserNotifications, markAsRead, markAllRead, Notification } from '@/services/notificationService';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [], unreadCount: 0, loading: false,
  markRead: async () => {}, markAllAsRead: async () => {}, refresh: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!user) { setNotifications([]); return; }
    setLoading(true);
    try { setNotifications(await getUserNotifications(user.id)); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [user?.id]);

  async function markRead(id: string) {
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllAsRead() {
    if (!user) return;
    await markAllRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, markRead, markAllAsRead, refresh: load }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
```

### Task X3.3 — App.tsx'e NotificationProvider ekle

- [ ] `App.tsx` içinde `import { NotificationProvider } from './context/NotificationContext'`
- [ ] `<FollowsProvider>` içine `<NotificationProvider>` sarmalayıcısı ekle

### Task X3.4 — Navbar bell icon

- [ ] Navbar'da sağ üst köşeye (user avatar yanına) bildirim bell ekle:
```tsx
import { useNotifications } from '@/context/NotificationContext';
import { Bell } from 'lucide-react';

const { notifications, unreadCount, markRead, markAllAsRead } = useNotifications();
const [showNotifs, setShowNotifs] = useState(false);

// Bell button:
<div className="relative">
  <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 text-[#1A1033]/40 hover:text-[#1A1033] transition-colors">
    <Bell size={20} />
    {unreadCount > 0 && (
      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-white text-[9px] font-black rounded-full flex items-center justify-center">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    )}
  </button>
  {showNotifs && (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-[#1A1033]/5 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1033]/5">
        <span className="text-xs font-black uppercase tracking-widest text-[#1A1033]">Bildirimler</span>
        {unreadCount > 0 && <button onClick={markAllAsRead} className="text-[10px] font-bold text-accent">Tümünü Oku</button>}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 && (
          <p className="text-center text-[10px] text-[#1A1033]/40 font-bold py-8">Bildirim yok</p>
        )}
        {notifications.map(n => (
          <button key={n.id} onClick={() => markRead(n.id)}
            className={cn('w-full text-left px-4 py-3 hover:bg-[#F8F8FA] transition-colors border-b border-[#1A1033]/5', !n.read && 'bg-accent/5')}>
            <p className="text-xs font-bold text-[#1A1033]">{n.title}</p>
            <p className="text-[10px] text-[#1A1033]/40 mt-0.5">{n.message}</p>
          </button>
        ))}
      </div>
    </div>
  )}
</div>
```

---

## X4 — Price Drop Tracking

**Dosyalar:**
- Create: `services/priceTrackService.ts`
- Modify: `pages/ProductDetail.tsx` (track button)
- Modify: `pages/Wishlist.tsx` (tracked items section)

### Task X4.1 — priceTrackService.ts

```
/priceTracks/{userId_productId}
  userId: string
  productId: string
  targetPrice: number   // kullanıcının hedef fiyatı (0 = sadece düşüş)
  originalPrice: number
  addedAt: string
```

- [ ] `src/services/priceTrackService.ts` oluştur:
```typescript
import { doc, setDoc, deleteDoc, getDocs, collection, query, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COL = 'priceTracks';
const trackId = (userId: string, productId: string) => `${userId}_${productId}`;

export interface PriceTrack {
  userId: string;
  productId: string;
  targetPrice: number;
  originalPrice: number;
  addedAt: string;
}

export async function trackPrice(userId: string, productId: string, currentPrice: number, targetPrice = 0) {
  await setDoc(doc(db, COL, trackId(userId, productId)), {
    userId, productId, targetPrice, originalPrice: currentPrice, addedAt: new Date().toISOString()
  });
}

export async function untrackPrice(userId: string, productId: string) {
  await deleteDoc(doc(db, COL, trackId(userId, productId)));
}

export async function isTracking(userId: string, productId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, COL, trackId(userId, productId)));
  return snap.exists();
}

export async function getUserTracks(userId: string): Promise<PriceTrack[]> {
  const q = query(collection(db, COL), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as PriceTrack);
}
```

### Task X4.2 — ProductDetail'da track button

- [ ] `pages/ProductDetail.tsx` içinde Fiyat bölümüne "Fiyat Düşünce Haber Ver" butonu ekle:
```tsx
import { trackPrice, untrackPrice, isTracking } from '@/services/priceTrackService';
import { BellRing } from 'lucide-react';

const [tracking, setTracking] = useState(false);

useEffect(() => {
  if (firebaseUser && product?.id) {
    isTracking(firebaseUser.uid, product.id).then(setTracking);
  }
}, [firebaseUser, product?.id]);

async function handleTrack() {
  if (!firebaseUser) { /* toast: giriş yap */ return; }
  if (tracking) {
    await untrackPrice(firebaseUser.uid, product.id);
    setTracking(false);
  } else {
    await trackPrice(firebaseUser.uid, product.id, product.price);
    setTracking(true);
  }
}

// JSX (fiyat yanına):
<button onClick={handleTrack}
  className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
    tracking ? 'bg-accent/10 text-accent border border-accent/30' : 'bg-[#1A1033]/5 text-[#1A1033]/40 hover:bg-accent/10 hover:text-accent')}>
  <BellRing size={14} fill={tracking ? 'currentColor' : 'none'} />
  {tracking ? 'Takip Ediliyor' : 'Fiyat Düşünce Haber Ver'}
</button>
```

---

## X1 — Product Variants UI (Seller)

**Dosyalar:**
- Modify: `pages/SellerInventory.tsx` (variant matrix ekleme formu)

### Task X1.1 — SellerInventory'de variant editor

- [ ] `pages/SellerInventory.tsx` içinde ürün ekleme/düzenleme modalına Variant sekmesi ekle:
```tsx
// Variant attribute tanımlama (örn: ["Renk", "Beden"])
const [variantAttrs, setVariantAttrs] = useState<string[]>([]);
const [variants, setVariants] = useState<ProductVariant[]>([]);

// UI: "Variant Ekle" butonu ile variantlar listesi
// Her variant: attributes (key:val), price, stock, sku
// Tablo formatında göster, satır başına input
```

---

## X7 — 3rd Level Categories UI

**Dosyalar:**
- Modify: `pages/AdminCategories.tsx` (3 seviye ağaç, ekle/düzenle/sil)

### Task X7.1 — AdminCategories 3 seviye

- [ ] `pages/AdminCategories.tsx` içinde mevcut ağaç yapısını incele
- [ ] Level 3 alt kategori ekleme/düzenleme butonları ekle
- [ ] `CategoryPage.tsx`'de level-3 subcategory kartları göster

---

## X5 — Seller Finance (Firestore)

**Dosyalar:**
- Modify: `pages/SellerFinance.tsx` (mock'tan Firestore'a geç)
- Create: `services/financeService.ts`

### Task X5.1 — financeService.ts

```
/sellerFinance/{sellerId}
  totalRevenue: number
  pendingPayout: number
  lastPayout: { amount, date }
  commissionRate: number
  transactions: (subcollection) /sellerFinance/{sellerId}/transactions/{id}
```

- [ ] `src/services/financeService.ts` oluştur:
```typescript
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function getSellerFinance(sellerId: string) {
  const snap = await getDoc(doc(db, 'sellerFinance', sellerId));
  return snap.exists() ? snap.data() : null;
}

export async function getTransactions(sellerId: string, count = 50) {
  const q = query(
    collection(db, 'sellerFinance', sellerId, 'transactions'),
    orderBy('date', 'desc'), limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
```

- [ ] `pages/SellerFinance.tsx` içinde `useEffect` ile `getSellerFinance(sellerId)` çağır, loading state ekle

---

## X6 — Behavior Tracking + AI Öneriler

**Dosyalar:**
- Create: `services/behaviorService.ts`
- Modify: `pages/ProductDetail.tsx` (view event)
- Modify: `pages/Home.tsx` (AI öneriler section)

### Task X6.1 — behaviorService.ts

```
/behavior/{userId}/events/{eventId}
  type: 'view' | 'cart' | 'purchase' | 'search'
  productId?: string
  query?: string
  timestamp: string
```

- [ ] `src/services/behaviorService.ts` oluştur:
```typescript
import { collection, addDoc, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function trackEvent(userId: string, event: { type: 'view'|'cart'|'purchase'|'search', productId?: string, query?: string }) {
  try {
    await addDoc(collection(db, 'behavior', userId, 'events'), {
      ...event, timestamp: new Date().toISOString()
    });
  } catch { /* silent fail — tracking never breaks UX */ }
}

export async function getRecentViewed(userId: string, count = 10) {
  const q = query(
    collection(db, 'behavior', userId, 'events'),
    where('type', '==', 'view'),
    orderBy('timestamp', 'desc'),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data().productId as string).filter(Boolean);
}
```

### Task X6.2 — ProductDetail'da view tracking

- [ ] `pages/ProductDetail.tsx`'de `useEffect` ile product yüklenince `trackEvent(userId, { type: 'view', productId: product.id })` çağır

### Task X6.3 — Home.tsx'de "Senin İçin" section

- [ ] Son görüntülenen ürünleri `getRecentViewed()` ile çek
- [ ] MOCK_PRODUCTS içinden eşleştir, "Son Gezilen" carousel olarak göster

---

## Doğrulama Listesi

- [ ] Arama inputuna 2+ harf girilince autocomplete dropdown açılıyor
- [ ] Ürüne tıklanınca dropdown kapanıp doğru sayfaya gidiliyor
- [ ] Admin ürün listesinde star ikonu ile featured toggle çalışıyor
- [ ] Bildirim bell'de unread badge görünüyor, "Tümünü Oku" çalışıyor
- [ ] ProductDetail'da "Fiyat Düşünce Haber Ver" toggle çalışıyor (login required)
- [ ] `npx tsc --noEmit` → 0 hata

---

## Uygulama Sırası

```
X9 Autocomplete    ← 20 dk, hızlı kazanım
    ↓
X8 Homepage Pin    ← 25 dk
    ↓
X3 Notifications   ← 45 dk (Context + Navbar)
    ↓
X4 Price Drop      ← 20 dk (builds on X3)
    ↓
X1 Variants UI     ← 30 dk
    ↓
X5 Seller Finance  ← 20 dk
    ↓
X6 Behavior + AI   ← 30 dk
```
