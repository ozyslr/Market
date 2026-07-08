/**
 * Shared Zod validation schemas for forms across the app.
 * Import and use with react-hook-form's zodResolver:
 *   const form = useForm({ resolver: zodResolver(schema) });
 *
 * For forms not yet migrated to react-hook-form, use `.safeParse()`
 * to validate data manually without changing the existing form structure.
 */
import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .min(1, 'Email gerekli')
  .email('Geçerli bir email adresi girin');

export const passwordSchema = z
  .string()
  .min(1, 'Şifre gerekli')
  .min(6, 'Şifre en az 6 karakter olmalı');

export const nameSchema = z
  .string()
  .min(1, 'İsim gerekli')
  .min(2, 'İsim en az 2 karakter olmalı')
  .max(100, 'İsim çok uzun');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// ── Address ───────────────────────────────────────────────────────────────

export const addressSchema = z.object({
  fullName: z.string().min(1, 'Ad soyad gerekli'),
  addressLine1: z.string().min(1, 'Adres gerekli'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'Şehir gerekli'),
  state: z.string().optional(),
  postcode: z.string().min(1, 'Posta kodu gerekli'),
  country: z.string().min(1, 'Ülke gerekli'),
  phone: z.string().optional(),
  type: z.enum(['home', 'work', 'other']).default('home'),
});

export type AddressInput = z.infer<typeof addressSchema>;

// ── Product (seller) ──────────────────────────────────────────────────────

export const productSchema = z.object({
  title: z.string().min(1, 'Ürün adı gerekli').max(200),
  description: z.string().min(1, 'Açıklama gerekli').max(5000),
  price: z.number().min(0.01, "Fiyat 0'dan büyük olmalı").max(1000000),
  stock: z.number().int().min(0, 'Stok negatif olamaz').max(1000000),
  categoryId: z.string().min(1, 'Kategori gerekli'),
  brand: z.string().optional(),
  images: z.array(z.string()).min(1, 'En az bir görsel gerekli'),
});

export type ProductInput = z.infer<typeof productSchema>;

// ── Coupon ────────────────────────────────────────────────────────────────

export const couponCodeSchema = z
  .string()
  .min(1, 'Kupon kodu gerekli')
  .max(50, 'Kupon kodu çok uzun')
  .regex(/^[A-Z0-9_-]+$/i, 'Sadece harf, rakam, tire ve alt çizgi');
