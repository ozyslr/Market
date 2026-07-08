import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction,
  increment,
  getDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  AdCampaign,
  AdCampaignStatus,
  AdEvent,
  AdConfig,
  SponsoredSlot,
  AdPerformance,
  SellerAdAnalytics,
  AdDailyBreakdown,
} from '../types';

const CAMPAIGNS_COL = 'adCampaigns';
const EVENTS_COL = 'adEvents';
const CONFIG_DOC = 'adConfig';

// ─── Default Config ────────────────────────────────────────────

const DEFAULT_CONFIG: AdConfig = {
  floorCpc: 0.5,
  maxSponsoredSlots: 4,
  minBid: 0.25,
  platformFeeRate: 0.1,
};

// ─── Seller Functions ──────────────────────────────────────────

export async function createAdCampaign(
  data: Omit<
    AdCampaign,
    | 'id'
    | 'impressions'
    | 'clicks'
    | 'spend'
    | 'dailySpend'
    | 'dailySpendDate'
    | 'createdAt'
    | 'updatedAt'
  >,
): Promise<AdCampaign> {
  try {
    const now = new Date().toISOString();
    const id = `ad-${crypto.randomUUID()}`;
    const campaign: AdCampaign = {
      ...data,
      id,
      impressions: 0,
      clicks: 0,
      spend: 0,
      dailySpend: 0,
      dailySpendDate: now.slice(0, 10),
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, CAMPAIGNS_COL, id), campaign);
    return campaign;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, CAMPAIGNS_COL);
    throw error;
  }
}

export async function getSellerAdCampaigns(sellerId: string): Promise<AdCampaign[]> {
  try {
    const q = query(
      collection(db, CAMPAIGNS_COL),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AdCampaign);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, CAMPAIGNS_COL);
    return [];
  }
}

export async function updateAdCampaign(id: string, data: Partial<AdCampaign>): Promise<void> {
  try {
    await updateDoc(doc(db, CAMPAIGNS_COL, id), { ...data, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CAMPAIGNS_COL}/${id}`);
    throw error;
  }
}

export async function pauseAdCampaign(id: string): Promise<void> {
  await updateAdCampaign(id, { status: 'paused', isActive: false });
}

export async function resumeAdCampaign(id: string): Promise<void> {
  await updateAdCampaign(id, { status: 'active', isActive: true });
}

export async function deleteAdCampaign(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, CAMPAIGNS_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${CAMPAIGNS_COL}/${id}`);
  }
}

// ─── Admin Functions ───────────────────────────────────────────

export async function getAllAdCampaigns(status?: AdCampaignStatus): Promise<AdCampaign[]> {
  try {
    let q;
    if (status) {
      q = query(
        collection(db, CAMPAIGNS_COL),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
      );
    } else {
      q = query(collection(db, CAMPAIGNS_COL), orderBy('createdAt', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as AdCampaign,
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, CAMPAIGNS_COL);
    return [];
  }
}

export async function approveAdCampaign(id: string, floorPrice?: number): Promise<void> {
  const data: Partial<AdCampaign> = {
    status: 'active',
    isActive: true,
    adminNote: undefined,
  };
  if (floorPrice !== undefined) data.floorPrice = floorPrice;
  await updateAdCampaign(id, data);
}

export async function rejectAdCampaign(id: string, reason: string): Promise<void> {
  await updateAdCampaign(id, {
    status: 'rejected',
    isActive: false,
    adminNote: reason,
  });
}

// ─── Config ────────────────────────────────────────────────────

export async function getAdConfig(): Promise<AdConfig> {
  try {
    const snap = await getDoc(doc(db, CONFIG_DOC, 'default'));
    if (snap.exists()) return snap.data() as AdConfig;
    return DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function updateAdConfig(config: Partial<AdConfig>): Promise<void> {
  try {
    const existing = await getAdConfig();
    await setDoc(doc(db, CONFIG_DOC, 'default'), { ...existing, ...config });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, CONFIG_DOC);
    throw error;
  }
}

// ─── Search Integration ────────────────────────────────────────

export async function getSponsoredProductIds(limitCount: number = 4): Promise<string[]> {
  try {
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const config = await getAdConfig();
    const actualLimit = Math.min(limitCount, config.maxSponsoredSlots);

    const q = query(
      collection(db, CAMPAIGNS_COL),
      where('status', '==', 'active'),
      where('isActive', '==', true),
    );
    const snap = await getDocs(q);

    const active: AdCampaign[] = [];
    for (const d of snap.docs) {
      const c = { id: d.id, ...d.data() } as AdCampaign;
      if (c.startDate > now || c.endDate < now) continue;
      if (c.spend >= c.totalBudget) continue;
      const dailyReset = c.dailySpendDate !== today;
      const dailySpent = dailyReset ? 0 : c.dailySpend;
      if (dailySpent >= c.dailyBudget) continue;
      active.push(c);
    }

    active.sort((a, b) => b.cpcBid - a.cpcBid);
    return active.slice(0, actualLimit).map((c) => c.productId);
  } catch {
    return [];
  }
}

export async function injectSponsoredProducts(
  existingProductIds: string[],
): Promise<SponsoredSlot[]> {
  const sponsoredIds = await getSponsoredProductIds();
  if (!sponsoredIds.length) return [];

  const slots: SponsoredSlot[] = [];
  const positions = [1, 4, 7, 10]; // 0-based: 2nd, 5th, 8th, 11th positions
  let adIndex = 0;

  const existingSet = new Set(existingProductIds);

  for (let i = 0; i < positions.length && adIndex < sponsoredIds.length; i++) {
    const pid = sponsoredIds[adIndex];
    // Skip if already in organic results
    if (!existingSet.has(pid)) {
      slots.push({ productId: pid, position: positions[i], adCampaignId: '' });
      adIndex++;
    } else {
      // Try next sponsored product
      adIndex++;
      i--; // retry this position
    }
  }

  // Fire impressions asynchronously (non-blocking)
  slots.forEach((slot) => {
    recordAdImpression(slot.productId).catch(() => {});
  });

  return slots;
}

// ─── Billing ───────────────────────────────────────────────────

export async function recordAdClick(
  adCampaignIdOrProductId: string,
  sessionId: string,
  userId?: string,
  searchQuery?: string,
): Promise<{ deducted: boolean; amount: number }> {
  try {
    // Try as campaign ID first, then as productId
    let campaign: AdCampaign | null = null;
    const docRef = doc(db, CAMPAIGNS_COL, adCampaignIdOrProductId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      campaign = { id: snap.id, ...snap.data() } as AdCampaign;
    } else {
      // Try to find by productId
      const q = query(
        collection(db, CAMPAIGNS_COL),
        where('productId', '==', adCampaignIdOrProductId),
        where('status', '==', 'active'),
        where('isActive', '==', true),
      );
      const qSnap = await getDocs(q);
      if (qSnap.empty) return { deducted: false, amount: 0 };
      campaign = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() } as AdCampaign;
    }

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    // Use transaction for atomic billing
    const result = await runTransaction(db, async (tx) => {
      const ref = doc(db, CAMPAIGNS_COL, campaign!.id);
      const txSnap = await tx.get(ref);
      if (!txSnap.exists()) return { deducted: false, amount: 0 };

      const c = txSnap.data() as AdCampaign;

      // Status checks
      if (c.status !== 'active' || !c.isActive) return { deducted: false, amount: 0 };
      if (c.startDate > now || c.endDate < now) return { deducted: false, amount: 0 };

      const cost = c.floorPrice && c.cpcBid < c.floorPrice ? c.floorPrice : c.cpcBid;
      const dailyReset = c.dailySpendDate !== today;
      const currentDaily = dailyReset ? 0 : c.dailySpend;

      // Budget checks
      if (currentDaily + cost > c.dailyBudget) return { deducted: false, amount: 0 };
      if (c.spend + cost > c.totalBudget) return { deducted: false, amount: 0 };

      // Deduct
      const updates: Record<string, unknown> = {
        clicks: increment(1),
        spend: increment(cost),
        dailySpend: dailyReset ? cost : increment(cost),
        dailySpendDate: today,
        updatedAt: now,
      };

      // Check if budget exhausted after this click
      const newDaily = dailyReset ? cost : currentDaily + cost;
      const newTotal = c.spend + cost;
      if (newDaily >= c.dailyBudget || newTotal >= c.totalBudget) {
        updates.status = 'exhausted';
        updates.isActive = false;
      }

      tx.update(ref, updates as any);

      // Log AdEvent
      const eventId = `click-${crypto.randomUUID()}`;
      const event: AdEvent = {
        id: eventId,
        adCampaignId: campaign!.id,
        sellerId: c.sellerId,
        productId: c.productId,
        type: 'click',
        sessionId,
        userId,
        cost,
        ts: now,
        searchQuery,
      };
      tx.set(doc(db, EVENTS_COL, eventId), event);

      return { deducted: true, amount: cost };
    });

    return result;
  } catch (error) {
    console.error('Ad billing error:', error);
    return { deducted: false, amount: 0 };
  }
}

export async function recordAdImpression(productId: string): Promise<void> {
  try {
    const q = query(
      collection(db, CAMPAIGNS_COL),
      where('productId', '==', productId),
      where('status', '==', 'active'),
      where('isActive', '==', true),
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await updateDoc(d.ref, {
        impressions: increment(1),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch {
    // Silently fail — impressions are non-critical
  }
}

// ─── Analytics ─────────────────────────────────────────────────

export async function getAdCampaignPerformance(
  campaignId: string,
  period: '7d' | '30d' | 'all' = '7d',
): Promise<AdPerformance> {
  try {
    const campaignSnap = await getDoc(doc(db, CAMPAIGNS_COL, campaignId));
    if (!campaignSnap.exists()) {
      return { impressions: 0, clicks: 0, ctr: 0, spend: 0, avgCpc: 0, dailyBreakdown: [] };
    }
    const c = campaignSnap.data() as AdCampaign;

    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 365;
    const since = new Date(now.getTime() - days * 86400000).toISOString();

    const q = query(
      collection(db, EVENTS_COL),
      where('adCampaignId', '==', campaignId),
      where('ts', '>=', since),
      orderBy('ts', 'desc'),
    );
    const snap = await getDocs(q);
    const events = snap.docs.map((d) => d.data() as AdEvent);

    const impressions = events.filter((e) => e.type === 'impression').length;
    const clicks = events.filter((e) => e.type === 'click').length;
    const spend = events.filter((e) => e.type === 'click').reduce((s, e) => s + e.cost, 0);

    // Daily breakdown
    const dailyMap = new Map<string, AdDailyBreakdown>();
    for (const e of events) {
      const day = e.ts.slice(0, 10);
      const existing = dailyMap.get(day) || { date: day, impressions: 0, clicks: 0, spend: 0 };
      if (e.type === 'impression') existing.impressions++;
      if (e.type === 'click') {
        existing.clicks++;
        existing.spend += e.cost;
      }
      dailyMap.set(day, existing);
    }

    const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    return {
      impressions: c.impressions,
      clicks: c.clicks,
      ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
      spend: c.spend,
      avgCpc: c.clicks > 0 ? c.spend / c.clicks : 0,
      dailyBreakdown,
    };
  } catch {
    return { impressions: 0, clicks: 0, ctr: 0, spend: 0, avgCpc: 0, dailyBreakdown: [] };
  }
}

export async function getSellerAdAnalytics(
  sellerId: string,
  period: '7d' | '30d' | 'all' = '7d',
): Promise<SellerAdAnalytics> {
  try {
    const campaigns = await getSellerAdCampaigns(sellerId);
    const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;

    const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
    const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
    const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
    const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    const campaignData = campaigns.map((c) => ({
      ...c,
      ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
      avgCpc: c.clicks > 0 ? c.spend / c.clicks : 0,
    }));

    return {
      totalImpressions,
      totalClicks,
      totalSpend,
      averageCtr,
      activeCampaigns,
      campaigns: campaignData,
    };
  } catch {
    return {
      totalImpressions: 0,
      totalClicks: 0,
      totalSpend: 0,
      averageCtr: 0,
      activeCampaigns: 0,
      campaigns: [],
    };
  }
}
