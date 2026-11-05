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
  /** Total the buyer saw; compared against the server quote, never charged as-is. */
  amount: z.number().finite().positive(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(128),
        quantity: z.number().int().positive().max(999),
      }),
    )
    .min(1)
    .max(50),
  couponCode: z.string().max(64).optional(),
  shipping: z.number().finite().nonnegative().optional(),
  /** Saved card (pm_…) of the authenticated user. */
  paymentMethodId: z.string().min(1).optional(),
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

/** Amount, basket and buyer come from the server-created order, never from the client. */
export const iyzicoInitSchema = z.object({
  orderId: z.string().min(1).max(128),
  installment: z.number().int().min(1).max(12).optional(),
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

// Caps bound the cost of a single call; the model is chosen server-side.
export const geminiTextSchema = z.object({
  prompt: z.string().min(1).max(12_000),
});

export const geminiVisionSchema = z.object({
  prompt: z.string().min(1).max(4_000),
  imageBase64: z.string().min(1).max(6_200_000),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']).optional(),
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

// ─── SubOrder Transition (ORD-03) ────────────────────────────────────────

export const subOrderTransitionSchema = z
  .object({
    event: z.enum(['mark_shipped']),
    trackingNumber: z.string().min(1).optional(),
    carrier: z.enum(['Yurtici', 'MNG', 'Aras', 'PTT', 'UPS']).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.event === 'mark_shipped' && !data.trackingNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['trackingNumber'],
        message: 'trackingNumber is required when event is mark_shipped',
      });
    }
  });

// ─── Admin Refund Routes ──────────────────────────────────────────────────────

export const adminRefundSchema = z.object({
  orderSetId: z.string().min(1),
  subOrderId: z.string().min(1).optional(),
  paymentTransactionId: z.string().optional(),
  isFullRefund: z.boolean().default(true),
  reason: z.string().max(500).optional(),
});

export const cancelOrderSchema = z.object({
  orderSetId: z.string().min(1),
  reason: z.string().max(500).optional(),
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

// ─── KYC Routes (Phase 3) ─────────────────────────────────────────────────────

export const kycUploadUrlSchema = z.object({
  sellerId: z.string().min(1),
  docType: z.enum(['identity', 'tax_certificate', 'bank_iban']),
  fileName: z.string().min(1),
});

export const identityVerifySchema = z.object({
  applicationId: z.string().min(1),
});

export const approveSellerSchema = z.object({
  adminNote: z.string().optional(),
  rejectionReason: z.string().optional(),
});
