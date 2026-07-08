# Benim Olan — Dark Mode Fix + i18n + User Profile Enhancements

> **Context:** Three parallel UX gaps blocking production quality:
> 1. Dark mode switches but hardcoded hex colors (e.g. `#F9423A`, `bg-white`) in Navbar/Hero/Footer break visual consistency.
> 2. Language switcher works but ~15–20% of UI strings are hardcoded — auth errors, admin headers, seller alerts never translate.
> 3. User profile settings are stub-only: no profile photo, no saved addresses, edit form doesn't call backend.
>
> **Outcome:** All three fixed and Firestore-synced. Profile photo uploads to Firebase Storage. Addresses stored on the user doc with default selection. Dark mode visually consistent across all key components.

---

## Feature 1 — Dark Mode Full Audit

### Problem
`#F9423A` (brand red) appears 15+ times in `Navbar.tsx` as `hover:text-[#F9423A]` — these bypass Tailwind's `dark:` system. `bg-white` without `dark:` variants appears in Hero, Footer, and modals.

### Approach
1. **`tailwind.config.ts`** — Add custom color token:
   ```ts
   colors: { 'mercora-red': '#F9423A' }
   ```
2. **`Navbar.tsx`** — Replace all `[#F9423A]` literals with `mercora-red`. Add `dark:` variants to white/light backgrounds:
   - Search boxes, auth dropdowns, cart panel: `bg-white` → `bg-white dark:bg-zinc-900`
   - Text colors: `text-[#1A1033]` → `text-[#1A1033] dark:text-white`
3. **`Hero.tsx`** — Campaign badge: `bg-[#F9423A]` → `bg-mercora-red`. Carousel buttons: add `dark:bg-zinc-800`.
4. **`Footer.tsx`** — `hover:text-[#F9423A]` → `hover:text-mercora-red`. Red tint containers: add `dark:bg-zinc-800/50`.
5. **`index.css`** — Verify `.dark .bg-white` override covers remaining stragglers.

### Files
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/components/home/Hero.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `tailwind.config.ts`
- Modify: `src/index.css`

---

## Feature 2 — i18n: Hardcoded Strings + Missing Translations

### Problem
Auth error messages (5 strings), SellerInventory alerts (3), AdminCMS headers (2), AdminLanguages alerts (1) are hardcoded Turkish/English and never translate. 6 TR category keys are missing.

### Approach

**New translation keys to add to `LanguageContext.tsx`:**

```ts
// auth.error namespace
'auth.error.nameRequired'      // "İsim zorunludur."
'auth.error.invalidCredentials' // "E-posta veya şifre hatalı."
'auth.error.emailInUse'        // "Bu e-posta zaten kayıtlı."
'auth.error.weakPassword'      // "Şifre en az 6 karakter olmalı."
'auth.error.generic'           // "Bir hata oluştu. Lütfen tekrar deneyin."

// seller.inventory namespace
'seller.inventory.bulkStatusUpdated' // "X products updated to Y"
'seller.inventory.productUpdated'    // "Product updated successfully!"
'seller.inventory.confirmDelete'     // "Bu ürünü silmek istediğinizden emin misiniz?"

// admin.cms namespace
'admin.cms.title'             // "CMS / Menu Management"
'admin.cms.saveFailed'        // "Error saving category"
'admin.cms.deleteFailed'      // "Failed to delete category"

// admin.languages namespace
'admin.languages.title'       // "Dil Yönetimi"
'admin.languages.saved'       // "Çeviriler başarıyla kaydedildi."

// Missing TR categories
'category.camping', 'category.makeup', 'category.sportswear',
'category.accessories', 'category.living_room', 'category.kitchen'
```

**Component changes:**
- `Navbar.tsx` — `setAuthError(t('auth.error.nameRequired'))` etc.
- `SellerInventory.tsx` — replace `alert()` and `confirm()` with `t()` equivalents
- `AdminCMS.tsx` — replace hardcoded headers and error alerts
- `AdminLanguages.tsx` — replace hardcoded title and success alert

**DE/AR:** Mirror all new keys from TR (same text for now, marked for future translation in AdminLanguages UI).

### Files
- Modify: `src/context/LanguageContext.tsx`
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/pages/SellerInventory.tsx`
- Modify: `src/pages/AdminCMS.tsx`
- Modify: `src/pages/AdminLanguages.tsx`

---

## Feature 3 — User Profile: Photo Upload + Address Management

### Data Model

**`src/types.ts` additions:**

```ts
export interface Address {
  id: string;
  label: string;          // required — "Ev", "İş", "Anne Evi"
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}
```

**Extend existing `User` interface:**
```ts
photoURL?: string;
```

**Extend existing `UserProfile` interface:**
```ts
addresses: Address[];
defaultAddressId?: string;
```

**Storage strategy:** Addresses embedded in the Firestore user document (not sub-collection). Users have ≤10 addresses; well within 1MB doc limit. Single `updateDoc` call to mutate the array.

### New & Modified Services

**`src/lib/firebase.ts`**
```ts
import { getStorage } from 'firebase/storage';
export const storage = getStorage(app);
```

**`src/services/storageService.ts`** (new)
```ts
export async function uploadProfilePhoto(userId: string, file: File): Promise<string>
// Resizes to max 400x400 via canvas, uploads to `profilePhotos/{userId}`, returns download URL
```

**`src/services/userService.ts`** additions:
```ts
export async function updateProfilePhoto(userId: string, photoURL: string): Promise<void>
export async function addAddress(userId: string, address: Omit<Address, 'id'>): Promise<Address>
export async function updateAddress(userId: string, addressId: string, data: Partial<Address>): Promise<void>
export async function deleteAddress(userId: string, addressId: string): Promise<void>
export async function setDefaultAddress(userId: string, addressId: string): Promise<void>
```

All functions call `updateDoc` on `users/{userId}` using Firestore `arrayUnion` / `arrayRemove` / field update.

### UI — UserProfile Settings Tab

Settings tab (`?tab=settings`) renders 4 accordion cards. Each card is independently expandable; only one open at a time.

#### Card 1 — Profil Bilgileri
- Header: avatar thumbnail + name + email
- Expanded: 
  - Avatar with overlay `<input type="file" accept="image/*">` pencil button
  - On file select → compress to canvas 400×400 → preview → on Save: `uploadProfilePhoto()` → `updateProfilePhoto()` → update AuthContext user
  - Fields: Display Name, Email (read-only, Firebase Auth), Country dropdown
  - Save button → `updateUser()` + photo upload if changed

#### Card 2 — Teslimat Adreslerim
- Header: address count + default city
- Expanded: list of address cards (default highlighted purple, others gray)
  - Each address: label + full address text + "Varsayılan Yap" / "Düzenle" / "Sil" buttons
  - "Varsayılan Yap" → `setDefaultAddress()` → re-renders list
  - "Sil" → confirm inline (no browser confirm()) → `deleteAddress()`
  - "+ Yeni Adres Ekle" → inline form appears below list (no modal):
    - Fields: Etiket* (required), Ad Soyad*, Telefon*, Adres Satırı 1*, Adres Satırı 2, Şehir*, Posta Kodu*, Ülke*
    - "Varsayılan yap" checkbox
    - Kaydet / İptal buttons
  - Düzenle → same inline form pre-filled, replaces the address card

#### Card 3 — Güvenlik
- Password change: show current email, "Şifre Sıfırlama E-postası Gönder" button → Firebase `sendPasswordResetEmail()`
- No complex 2FA UI for now.

#### Card 4 — Bildirimler
- Newsletter toggle → `updateUser({ preferences: { newsletter: !current } })`
- Push notifications toggle
- Personalized deals toggle
- Auto-save on toggle (no Save button needed)

### Checkout Integration
`src/pages/Checkout.tsx` — If user has saved addresses, render a "Kayıtlı Adreslerimden Seç" dropdown above the manual form. Selecting an address pre-fills the shipping form fields.

### Files
- Modify: `src/lib/firebase.ts`
- Create: `src/services/storageService.ts`
- Modify: `src/services/userService.ts`
- Modify: `src/types.ts`
- Modify: `src/pages/UserProfile.tsx`
- Modify: `src/pages/Checkout.tsx`
- Modify: `src/context/AuthContext.tsx` (expose `refreshUser()` for photo/address updates)

---

## Verification

- [ ] Dark mode toggle → Navbar hover states, Hero badge, Footer links all render correctly in both modes
- [ ] Language switch EN↔TR → all auth error messages, seller alerts, admin headers translate
- [ ] Upload profile photo → appears in UserProfile header and Navbar avatar
- [ ] Add address with label "Ev" → appears in address list, saved in Firestore
- [ ] "Varsayılan Yap" → purple highlight moves to new default
- [ ] Delete address → removed from Firestore, list updates
- [ ] Checkout → saved addresses appear in dropdown, selecting one fills the form
- [ ] TypeScript: `npx tsc --noEmit` passes with zero errors
