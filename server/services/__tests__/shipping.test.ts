// ─── Shipping Provider Tests (TDD RED phase) ─────────────────────────────────
// Tests for MockEntegiProvider, MockEasyPostProvider, and routeCarrierByRegion.
// These tests are RED until Plan 03 wires the shipping route.
// cargoService.ts already has MockEntegiProvider + MockEasyPostProvider (Plan 01).

import { describe, it, expect } from 'vitest';
import {
  createCargoShipment,
  getTrackingStatus,
  routeCarrierByRegion,
} from '../../../src/services/cargoService.js';
import type { ShipmentRequest } from '../../../src/services/cargoService.js';

// ─── Minimal shipment request fixture ────────────────────────────────────────

const minimalReq: ShipmentRequest = {
  orderId: 'order-test-001',
  senderName: 'Test Seller',
  senderAddress: 'Test Seller Adres, Istanbul',
  senderCity: 'Istanbul',
  senderPhone: '+905001234567',
  receiverName: 'Test Buyer',
  receiverAddress: 'Test Buyer Adres, Berlin',
  receiverCity: 'Berlin',
  receiverPhone: '+491701234567',
  receiverCountry: 'TR',
  weight: 1.5,
  description: 'Test package',
};

// ─── routeCarrierByRegion ─────────────────────────────────────────────────────

describe('routeCarrierByRegion', () => {
  it("'TR' routes to Entegi", () => {
    expect(routeCarrierByRegion('TR')).toBe('Entegi');
  });

  it("'DE' routes to EasyPost", () => {
    expect(routeCarrierByRegion('DE')).toBe('EasyPost');
  });

  it("'FR' routes to EasyPost", () => {
    expect(routeCarrierByRegion('FR')).toBe('EasyPost');
  });
});

// ─── MockEntegiProvider ───────────────────────────────────────────────────────

describe('MockEntegiProvider', () => {
  it('createShipment returns success=true, EN-prefixed trackingNumber, and labelUrl string', async () => {
    const req: ShipmentRequest = { ...minimalReq, receiverCountry: 'TR' };
    const result = await createCargoShipment('Entegi', req);

    expect(result.success).toBe(true);
    expect(result.trackingNumber).toMatch(/^EN/i);
    expect(typeof result.labelUrl).toBe('string');
    expect(result.labelUrl!.length).toBeGreaterThan(0);
  });

  it('getTrackingStatus returns success=true and provider=Entegi', async () => {
    const result = await getTrackingStatus('Entegi', 'EN12345678');

    expect(result.success).toBe(true);
    expect(result.provider).toBe('Entegi');
    expect(result.trackingNumber).toBe('EN12345678');
  });
});

// ─── MockEasyPostProvider ─────────────────────────────────────────────────────

describe('MockEasyPostProvider', () => {
  it('createShipment returns success=true, EZ-prefixed trackingNumber, and labelUrl string', async () => {
    const req: ShipmentRequest = { ...minimalReq, receiverCountry: 'DE' };
    const result = await createCargoShipment('EasyPost', req);

    expect(result.success).toBe(true);
    expect(result.trackingNumber).toMatch(/^EZ/i);
    expect(typeof result.labelUrl).toBe('string');
    expect(result.labelUrl!.length).toBeGreaterThan(0);
  });

  it('getTrackingStatus returns success=true and provider=EasyPost', async () => {
    const result = await getTrackingStatus('EasyPost', 'EZ87654321');

    expect(result.success).toBe(true);
    expect(result.provider).toBe('EasyPost');
    expect(result.trackingNumber).toBe('EZ87654321');
  });
});
