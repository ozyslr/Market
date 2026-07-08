import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Campaign } from '../types';

const COL = 'campaigns';

export async function getCampaigns(): Promise<Campaign[]> {
  try {
    const snap = await getDocs(collection(db, COL));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function getActiveCampaigns(): Promise<Campaign[]> {
  try {
    const now = new Date().toISOString();
    const q = query(collection(db, COL), where('isActive', '==', true));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Campaign))
      .filter(c => c.startDate <= now && c.endDate >= now);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function createCampaign(data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<Campaign> {
  try {
    const id = `campaign-${Date.now()}`;
    const campaign: Campaign = { ...data, id, createdAt: new Date().toISOString() };
    await setDoc(doc(db, COL, id), campaign);
    return campaign;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COL);
    throw error;
  }
}

export async function updateCampaign(id: string, data: Partial<Campaign>): Promise<void> {
  try {
    await updateDoc(doc(db, COL, id), { ...data, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${id}`);
    throw error;
  }
}

export async function deleteCampaign(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COL}/${id}`);
    throw error;
  }
}

export function calcCampaignDiscount(
  campaigns: Campaign[],
  orderTotal: number,
  productCategoryId?: string,
  productBrand?: string,
): number {
  const now = new Date().toISOString();
  const applicable = campaigns.filter(c =>
    c.isActive &&
    c.startDate <= now &&
    c.endDate >= now &&
    (!c.minOrderAmount || orderTotal >= c.minOrderAmount) &&
    (c.targetType === 'all_products' ||
     (c.targetType === 'category' && c.targetValue === productCategoryId) ||
     (c.targetType === 'brand' && c.targetValue === productBrand))
  );
  if (!applicable.length) return 0;
  const best = applicable.reduce((max, c) => {
    const val = c.discountType === 'percentage' ? orderTotal * (c.discountValue / 100) : c.discountValue;
    return val > max ? val : max;
  }, 0);
  return Math.min(best, orderTotal);
}

// ─── Cart Campaigns ──────────────────────────────────────────────────────────

import { CartCampaign } from '../types';
import { MOCK_PRODUCTS } from '../mockData';

/** Get all active cart-level campaigns that auto-apply based on cart total */
export async function getActiveCartCampaigns(): Promise<Campaign[]> {
  try {
    const now = new Date().toISOString();
    const q = query(collection(db, COL), where('isActive', '==', true), where('isCartCampaign', '==', true));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Campaign))
      .filter(c => c.startDate <= now && c.endDate >= now);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

/** Calculate cart-level discounts for a given cart subtotal */
export function calcCartCampaigns(
  campaigns: Campaign[],
  cartSubtotal: number,
  cartProductIds: string[] = [],
): CartCampaign[] {
  const now = new Date().toISOString();
  const active = campaigns.filter(c =>
    c.isActive && c.isCartCampaign &&
    c.startDate <= now && c.endDate >= now &&
    (!c.minOrderAmount || cartSubtotal >= c.minOrderAmount)
  );

  return active.map(campaign => {
    let discountAmount = campaign.discountType === 'percentage'
      ? Math.round(cartSubtotal * (campaign.discountValue / 100) * 100) / 100
      : campaign.discountValue;

    // Cap at maxDiscountAmount if set
    if (campaign.maxDiscountAmount && discountAmount > campaign.maxDiscountAmount) {
      discountAmount = campaign.maxDiscountAmount;
    }

    // Find free gift product
    let giftProduct: CartCampaign['giftProduct'] = null;
    if (campaign.freeGiftProductId) {
      const product = MOCK_PRODUCTS.find(p => p.id === campaign.freeGiftProductId);
      if (product) {
        giftProduct = {
          id: product.id,
          name: product.title,
          image: product.images[0],
          quantity: campaign.freeGiftQuantity || 1,
        };
      }
    }

    return { campaign, discountAmount, giftProduct };
  });
}

/** Get the total cart-level discount from all cart campaigns (best one wins) */
export function getCartCampaignDiscount(cartCampaigns: CartCampaign[]): number {
  if (cartCampaigns.length === 0) return 0;
  // Take the best discount (highest)
  return Math.max(...cartCampaigns.map(cc => cc.discountAmount));
}

/** Get all free gifts from applicable cart campaigns */
export function getCartCampaignGifts(cartCampaigns: CartCampaign[]): NonNullable<CartCampaign['giftProduct']>[] {
  return cartCampaigns
    .filter(cc => cc.giftProduct)
    .map(cc => cc.giftProduct!);
}
