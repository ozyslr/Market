/**
 * Cargo/Shipping API Abstraction Layer
 *
 * Architecture: Provider pattern — each carrier implements the CargoProvider interface.
 * Mock providers simulate real APIs with realistic response formats and timing.
 * Swap in real API keys via env vars to switch from mock → production.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type CargoProviderName = 'PTT' | 'Yurtici' | 'Aras' | 'MNG' | 'Surat' | 'UPS' | 'DHL';

export interface ShipmentRequest {
  orderId: string;
  senderName: string;
  senderAddress: string;
  senderCity: string;
  senderPhone: string;
  receiverName: string;
  receiverAddress: string;
  receiverCity: string;
  receiverPhone: string;
  packageCount: number;
  totalWeight?: number;
  /** Total declared value for insurance */
  declaredValue?: number;
  /** Special instructions */
  notes?: string;
}

export interface ShipmentResponse {
  success: boolean;
  trackingNumber: string;
  labelUrl?: string;
  barcode?: string;
  estimatedDelivery?: string;
  shippingCost?: number;
  provider: CargoProviderName;
  error?: string;
}

export interface TrackingEvent {
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

export interface TrackingResponse {
  success: boolean;
  trackingNumber: string;
  provider: CargoProviderName;
  currentStatus: string;
  estimatedDelivery?: string;
  events: TrackingEvent[];
  delivered: boolean;
  labelUrl?: string;
  error?: string;
}

export interface ShippingRate {
  provider: CargoProviderName;
  serviceLevel: string;
  cost: number;
  estimatedDays: number;
  pickupAvailable: boolean;
}

// ─── Provider Interface ─────────────────────────────────────────────────────

export interface CargoProvider {
  name: CargoProviderName;
  createShipment(req: ShipmentRequest): Promise<ShipmentResponse>;
  getTracking(trackingNumber: string): Promise<TrackingResponse>;
  generateLabel(trackingNumber: string): Promise<string>;
  cancelShipment(trackingNumber: string): Promise<boolean>;
  getRates(originCity: string, destCity: string, weight: number): Promise<ShippingRate[]>;
}

// ─── Mock Base ──────────────────────────────────────────────────────────────

const STATUS_CHAINS: Record<string, TrackingEvent[]> = {
  standard: [
    { timestamp: '', status: 'Kabul Edildi', location: '', description: 'Kargo şubeye teslim edildi.' },
    { timestamp: '', status: 'Yolda', location: '', description: 'Kargo transfer merkezine ulaştı.' },
    { timestamp: '', status: 'Dağıtımda', location: '', description: 'Kargo dağıtım şubesine ulaştı, teslimata çıktı.' },
    { timestamp: '', status: 'Teslim Edildi', location: '', description: 'Alıcıya teslim edildi.' },
  ],
};

function generateMockTracking(provider: string): string {
  const prefix = provider === 'PTT' ? 'PT' : provider === 'Yurtici' ? 'YT' : provider === 'Aras' ? 'AR' :
    provider === 'MNG' ? 'MN' : provider === 'Surat' ? 'SR' : provider === 'UPS' ? 'UP' : 'DH';
  const num = Math.random().toString(36).substring(2, 12).toUpperCase();
  return `${prefix}${num}`;
}

function generateEvents(baseEvents: TrackingEvent[], hoursAgo: number): TrackingEvent[] {
  const now = Date.now();
  const deliveredRandom = Math.random() > 0.6; // 40% chance already delivered

  return baseEvents.map((event, idx) => {
    const progress = (idx + 1) / baseEvents.length;
    const hoursOffset = hoursAgo * (1 - progress) + Math.random() * 4;
    const timestamp = new Date(now - hoursOffset * 3600000).toISOString();

    if (idx === baseEvents.length - 1 && !deliveredRandom) {
      return { ...event, timestamp: '', status: event.status, location: event.location, description: event.description };
    }

    return { ...event, timestamp };
  }).filter(e => e.timestamp !== '');
}

const TURKISH_CITIES = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Kayseri', 'Samsun'];

// ─── Mock Providers ─────────────────────────────────────────────────────────

class MockPttProvider implements CargoProvider {
  name: CargoProviderName = 'PTT';

  async createShipment(req: ShipmentRequest): Promise<ShipmentResponse> {
    await delay(300);
    const tracking = generateMockTracking('PTT');
    const days = 2 + Math.floor(Math.random() * 3);
    const eta = new Date(Date.now() + days * 86400000).toISOString();
    return {
      success: true, trackingNumber: tracking, provider: 'PTT',
      barcode: `99${tracking}`,
      estimatedDelivery: eta,
      shippingCost: 29.90 + Math.random() * 20,
      labelUrl: `/api/cargo/label/${tracking}`,
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingResponse> {
    await delay(200);
    const daysSinceShip = 1 + Math.floor(Math.random() * 5);
    const events = generateEvents(STATUS_CHAINS.standard, daysSinceShip * 24);
    const delivered = events[events.length - 1]?.status === 'Teslim Edildi';
    return {
      success: true, trackingNumber, provider: 'PTT',
      currentStatus: events[events.length - 1]?.status || 'Bilinmiyor',
      events: events.map(e => ({ ...e, location: TURKISH_CITIES[Math.floor(Math.random() * TURKISH_CITIES.length)] })),
      delivered,
      estimatedDelivery: new Date(Date.now() + (delivered ? 0 : 86400000)).toISOString(),
      labelUrl: `https://mock-cargo.ptt.gov.tr/label/${trackingNumber}.pdf`,
    };
  }

  async generateLabel(trackingNumber: string): Promise<string> {
    await delay(200);
    return `https://mock-cargo.ptt.gov.tr/label/${trackingNumber}.pdf`;
  }

  async cancelShipment(trackingNumber: string): Promise<boolean> {
    await delay(200);
    return true;
  }

  async getRates(origin: string, dest: string, weight: number): Promise<ShippingRate[]> {
    return [{
      provider: 'PTT', serviceLevel: 'Standart', cost: 25 + weight * 2,
      estimatedDays: 2 + Math.ceil(Math.random() * 3), pickupAvailable: true,
    }];
  }
}

class MockYurticiProvider implements CargoProvider {
  name: CargoProviderName = 'Yurtici';

  async createShipment(req: ShipmentRequest): Promise<ShipmentResponse> {
    await delay(350);
    const tracking = generateMockTracking('Yurtici');
    const days = 1 + Math.floor(Math.random() * 3);
    return {
      success: true, trackingNumber: tracking, provider: 'Yurtici',
      estimatedDelivery: new Date(Date.now() + days * 86400000).toISOString(),
      shippingCost: 34.90 + Math.random() * 25,
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingResponse> {
    await delay(250);
    const daysSinceShip = 1 + Math.floor(Math.random() * 4);
    const events = generateEvents(STATUS_CHAINS.standard, daysSinceShip * 24);
    const delivered = events[events.length - 1]?.status === 'Teslim Edildi';
    return {
      success: true, trackingNumber, provider: 'Yurtici',
      currentStatus: events[events.length - 1]?.status || 'Bilinmiyor',
      events: events.map(e => ({ ...e, location: TURKISH_CITIES[Math.floor(Math.random() * TURKISH_CITIES.length)] })),
      delivered,
      labelUrl: `https://mock-cargo.yurticikargo.com/label/${trackingNumber}.pdf`,
    };
  }

  async generateLabel(trackingNumber: string): Promise<string> {
    await delay(200);
    return `https://mock-cargo.yurticikargo.com/label/${trackingNumber}.pdf`;
  }

  async cancelShipment(trackingNumber: string): Promise<boolean> {
    await delay(200);
    return true;
  }

  async getRates(origin: string, dest: string, weight: number): Promise<ShippingRate[]> {
    return [{
      provider: 'Yurtici', serviceLevel: 'Ekspres', cost: 30 + weight * 2.5,
      estimatedDays: 1 + Math.ceil(Math.random() * 2), pickupAvailable: true,
    }];
  }
}

class MockArasProvider implements CargoProvider {
  name: CargoProviderName = 'Aras';

  async createShipment(req: ShipmentRequest): Promise<ShipmentResponse> {
    await delay(280);
    const tracking = generateMockTracking('Aras');
    const days = 1 + Math.floor(Math.random() * 4);
    return {
      success: true, trackingNumber: tracking, provider: 'Aras',
      estimatedDelivery: new Date(Date.now() + days * 86400000).toISOString(),
      shippingCost: 27.50 + Math.random() * 22,
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingResponse> {
    await delay(220);
    const daysSinceShip = 1 + Math.floor(Math.random() * 5);
    const events = generateEvents(STATUS_CHAINS.standard, daysSinceShip * 24);
    const delivered = events[events.length - 1]?.status === 'Teslim Edildi';
    return {
      success: true, trackingNumber, provider: 'Aras',
      currentStatus: events[events.length - 1]?.status || 'Bilinmiyor',
      events: events.map(e => ({ ...e, location: TURKISH_CITIES[Math.floor(Math.random() * TURKISH_CITIES.length)] })),
      delivered,
      labelUrl: `https://mock-cargo.araskargo.com/label/${trackingNumber}.pdf`,
    };
  }

  async generateLabel(trackingNumber: string): Promise<string> {
    await delay(200);
    return `https://mock-cargo.araskargo.com/label/${trackingNumber}.pdf`;
  }

  async cancelShipment(trackingNumber: string): Promise<boolean> {
    await delay(200);
    return true;
  }

  async getRates(origin: string, dest: string, weight: number): Promise<ShippingRate[]> {
    return [{
      provider: 'Aras', serviceLevel: 'Standart', cost: 22 + weight * 1.8,
      estimatedDays: 2 + Math.ceil(Math.random() * 3), pickupAvailable: true,
    }];
  }
}

// ─── Provider Registry ──────────────────────────────────────────────────────

const providerRegistry: Map<CargoProviderName, CargoProvider> = new Map();

function getProviders(): Map<CargoProviderName, CargoProvider> {
  if (providerRegistry.size === 0) {
    // In production, swap mock providers with real implementations using API keys
    providerRegistry.set('PTT', new MockPttProvider());
    providerRegistry.set('Yurtici', new MockYurticiProvider());
    providerRegistry.set('Aras', new MockArasProvider());
    // Others fall back to PTT's provider
  }
  return providerRegistry;
}

function getProvider(name: CargoProviderName): CargoProvider {
  return getProviders().get(name) || getProviders().get('PTT')!;
}

// ─── Public API ─────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Create a shipment and get tracking number */
export async function createCargoShipment(
  provider: CargoProviderName,
  req: ShipmentRequest,
): Promise<ShipmentResponse> {
  return getProvider(provider).createShipment(req);
}

/** Get real-time tracking status for a shipment */
export async function getTrackingStatus(
  provider: CargoProviderName,
  trackingNumber: string,
): Promise<TrackingResponse> {
  return getProvider(provider).getTracking(trackingNumber);
}

/** Generate shipping label PDF */
export async function generateCargoLabel(
  provider: CargoProviderName,
  trackingNumber: string,
): Promise<string> {
  return getProvider(provider).generateLabel(trackingNumber);
}

/** Cancel a shipment */
export async function cancelCargoShipment(
  provider: CargoProviderName,
  trackingNumber: string,
): Promise<boolean> {
  return getProvider(provider).cancelShipment(trackingNumber);
}

/** Get shipping rates from all providers */
export async function getAllShippingRates(
  originCity: string,
  destCity: string,
  weight: number,
): Promise<ShippingRate[]> {
  const providers = getProviders();
  const rates: ShippingRate[] = [];
  for (const [, provider] of providers) {
    try {
      const providerRates = await provider.getRates(originCity, destCity, weight);
      rates.push(...providerRates);
    } catch { /* skip failed providers */ }
  }
  return rates.sort((a, b) => a.cost - b.cost);
}

/** Get all available cargo providers */
export function getAvailableCarriers(): { name: CargoProviderName; label: string }[] {
  return [
    { name: 'PTT', label: 'PTT Kargo' },
    { name: 'Yurtici', label: 'Yurtiçi Kargo' },
    { name: 'Aras', label: 'Aras Kargo' },
    { name: 'MNG', label: 'MNG Kargo' },
    { name: 'Surat', label: 'Sürat Kargo' },
    { name: 'UPS', label: 'UPS' },
    { name: 'DHL', label: 'DHL' },
  ];
}
