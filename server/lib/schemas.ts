import { z } from 'zod';

// ─── Shared / Reusable ────────────────────────────────────────────────────

export const addressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1),
  phone: z.string().optional(),
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  title: z.string().min(1),
  price: z.number().finite().nonnegative(),
  quantity: z.number().int().positive(),
  image: z.string().optional(),
  variantLabel: z.string().optional(),
  sellerId: z.string().optional(),
});

// ─── Stripe Routes ────────────────────────────────────────────────────────

export const createPaymentIntentSchema = z.object({
  amount: z.number().finite().positive(),
  currency: z.string().length(3).optional(),
  orderId: z.string().min(1).optional(),
});

export const setupPaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1),
  last4: z.string().max(4).optional(),
  brand: z.string().optional(),
});

export const defaultPaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1),
});

export const oneClickCheckoutSchema = z.object({
  items: z.array(cartItemSchema).min(1),
  currency: z.string().length(3).optional(),
  paymentMethodId: z.string().min(1).optional(),
});

export const refundSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().finite().positive().optional(),
});

// ─── iyzico Routes ────────────────────────────────────────────────────────

export const iyzicoInitSchema = z.object({
  userId: z.string().min(1),
  userEmail: z.string().email(),
  userName: z.string().min(1),
  total: z.number().finite().positive(),
  currency: z.string().length(3),
  installment: z.number().int().min(1).optional(),
  orderId: z.string().min(1),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        category: z.string().optional(),
        price: z.number().finite().nonnegative(),
        quantity: z.number().int().positive().optional(),
      }),
    )
    .min(1),
  shippingAddress: addressSchema,
  buyerPhone: z.string().min(1).optional(),
});

// ─── iyzico Marketplace Init Schema (OrderSet-based) ─────────────────────────

export const iyzicoMarketplaceInitSchema = z.object({
  orderSetId: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().email(),
  userName: z.string().min(1),
  buyerPhone: z.string().optional(),
  currency: z.string().length(3),
  installment: z.number().int().min(1).optional(),
  shippingAddress: addressSchema,
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        category: z.string().optional(),
        price: z.number().finite().nonnegative(),
        subMerchantKey: z.string().min(1),
        subMerchantPrice: z.number().finite().nonnegative(),
        sellerId: z.string().optional(),
        categoryId: z.string().optional(),
      }),
    )
    .min(1),
});

export const iyzicoWebhookSchema = z.object({
  token: z.string().min(1),
});

export const iyzicoCallbackSchema = z.object({
  token: z.string().min(1),
});

export const iyzicoInstallmentsQuerySchema = z.object({
  bin: z.string().min(6).max(8).optional(),
  amount: z.coerce.number().finite().positive().optional(),
});

// ─── Gemini Routes ────────────────────────────────────────────────────────

export const geminiTextSchema = z.object({
  model: z.string().min(1),
  prompt: z.string().min(1),
});

export const geminiVisionSchema = z.object({
  model: z.string().min(1),
  prompt: z.string().min(1),
  imageBase64: z.string().min(1),
  mimeType: z.string().optional(),
});

export const geminiImageSchema = z.object({
  prompt: z.string().min(1),
});

// ─── Seller API Routes ────────────────────────────────────────────────────

export const createProductSchema = z.object({
  title: z.string().min(1).max(200),
  price: z.number().finite().nonnegative(),
  stock: z.number().int().nonnegative().optional(),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  description: z.string().max(5000).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  currency: z.string().length(3).optional(),
});

export const updateProductSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  price: z.number().finite().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  description: z.string().max(5000).optional(),
  images: z.array(z.string().url()).max(10).optional(),
});

export const bulkStockUpdateSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        stock: z.number().int().nonnegative().optional(),
        price: z.number().finite().nonnegative().optional(),
      }),
    )
    .min(1)
    .max(500),
});

// ─── Server.ts inline routes ──────────────────────────────────────────────

export const abandonedCartCheckSchema = z.object({
  windowHours: z.number().int().positive().max(168).optional(),
  maxReminders: z.number().int().positive().max(10).optional(),
});

export const sendPushSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  url: z.string().url().optional(),
});
