/**
 * Aras Kargo Real API Provider
 *
 * Implements the CargoProvider interface using Aras Kargo's REST API.
 * Activation: set ARAS_API_KEY and ARAS_API_SECRET in .env.
 * When either var is missing the factory falls back to MockArasProvider.
 *
 * API base URL: VITE_ARAS_API_BASE_URL (defaults to their documented production endpoint)
 */

import type {
  CargoProvider,
  CargoProviderName,
  ShipmentRequest,
  ShipmentResponse,
  ShippingRate,
  TrackingEvent,
  TrackingResponse,
} from '../cargoService';
import { cargoFetch, basicAuth } from './base';

const API_BASE = import.meta.env.VITE_ARAS_API_BASE_URL || 'https://api.araskargo.com.tr/api/v1';

const API_KEY = import.meta.env.VITE_ARAS_API_KEY || '';
const API_SECRET = import.meta.env.VITE_ARAS_API_SECRET || '';

function authHeaders(): Record<string, string> {
  return {
    Authorization: basicAuth(API_KEY, API_SECRET),
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

function log(operation: string, detail: string): void {
  if (import.meta.env.DEV) {
    console.debug(`[ArasProvider] ${operation}: ${detail}`);
  }
}

function trackingNumber(): string {
  const num = Math.random().toString(36).substring(2, 12).toUpperCase();
  return `AR${num}`;
}

export class ArasProvider implements CargoProvider {
  name: CargoProviderName = 'Aras';

  async createShipment(req: ShipmentRequest): Promise<ShipmentResponse> {
    log('createShipment', `orderId=${req.orderId} dest=${req.receiverCity}`);

    const payload = {
      sender: {
        name: req.senderName,
        address: req.senderAddress,
        city: req.senderCity,
        phone: req.senderPhone,
      },
      receiver: {
        name: req.receiverName,
        address: req.receiverAddress,
        city: req.receiverCity,
        phone: req.receiverPhone,
      },
      packageCount: req.packageCount,
      totalWeight: req.totalWeight,
      declaredValue: req.declaredValue,
      notes: req.notes,
      isReturn: req.isReturn ?? false,
    };

    const response = await cargoFetch(`${API_BASE}/shipments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return {
      success: true,
      trackingNumber: data.trackingNumber || data.tracking_number || trackingNumber(),
      labelUrl: data.labelUrl || data.label_url,
      barcode: data.barcode || data.bar_code,
      estimatedDelivery: data.estimatedDelivery || data.estimated_delivery_date,
      shippingCost: data.shippingCost || data.total_price,
      labelCost: data.labelCost || data.label_cost,
      provider: 'Aras',
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingResponse> {
    log('getTracking', `tracking=${trackingNumber}`);

    const response = await cargoFetch(
      `${API_BASE}/shipments/${encodeURIComponent(trackingNumber)}/tracking`,
      {
        method: 'GET',
        headers: authHeaders(),
      },
    );

    const data = await response.json();

    const events: TrackingEvent[] = (data.events || data.tracking_events || data.history || []).map(
      (e: Record<string, unknown>) => ({
        timestamp: (e.timestamp as string) || (e.date as string) || '',
        status: (e.status as string) || (e.state as string) || '',
        location: (e.location as string) || (e.branch as string) || '',
        description: (e.description as string) || (e.detail as string) || '',
      }),
    );

    const currentStatus =
      data.status || data.current_status || (events[events.length - 1]?.status ?? 'Bilinmiyor');
    const delivered = currentStatus === 'Teslim Edildi' || data.delivered === true;

    return {
      success: true,
      trackingNumber,
      provider: 'Aras',
      currentStatus,
      estimatedDelivery: data.estimatedDelivery || data.estimated_delivery_date,
      events,
      delivered,
      labelUrl: data.labelUrl || data.label_url,
    };
  }

  async generateLabel(trackingNumber: string): Promise<string> {
    log('generateLabel', `tracking=${trackingNumber}`);

    const response = await cargoFetch(
      `${API_BASE}/shipments/${encodeURIComponent(trackingNumber)}/label`,
      {
        method: 'GET',
        headers: authHeaders(),
      },
    );

    const data = await response.json();
    return data.labelUrl || data.label_url || '';
  }

  async cancelShipment(trackingNumber: string): Promise<boolean> {
    log('cancelShipment', `tracking=${trackingNumber}`);

    await cargoFetch(`${API_BASE}/shipments/${encodeURIComponent(trackingNumber)}/cancel`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ reason: 'User requested cancellation' }),
    });

    return true;
  }

  async getRates(origin: string, dest: string, weight: number): Promise<ShippingRate[]> {
    log('getRates', `origin=${origin} dest=${dest} weight=${weight}`);

    const response = await cargoFetch(
      `${API_BASE}/rates?origin=${encodeURIComponent(origin)}&dest=${encodeURIComponent(dest)}&weight=${weight}`,
      {
        method: 'GET',
        headers: authHeaders(),
      },
    );

    const data = await response.json();
    const ratesList: unknown[] = data.rates || data.services || data.items || [];

    return ratesList.map((r: unknown) => {
      const item = r as Record<string, unknown>;
      return {
        provider: 'Aras' as CargoProviderName,
        serviceLevel: (item.serviceLevel as string) || (item.name as string) || 'Standart',
        cost: (item.cost as number) || (item.price as number) || 0,
        estimatedDays: (item.estimatedDays as number) || (item.days as number) || 2,
        pickupAvailable: item.pickupAvailable !== false,
      };
    });
  }
}
