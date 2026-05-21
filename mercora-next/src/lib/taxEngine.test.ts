import { describe, it, expect } from 'vitest';
import { calculateTotal, MARKETS } from './taxEngine';

describe('taxEngine', () => {
  describe('calculateTotal', () => {
    it('should calculate domestic UK order correctly', () => {
      const result = calculateTotal(100, 10, MARKETS.UK, true);
      expect(result.subtotal).toBe(100);
      expect(result.shipping).toBe(10);
      expect(result.vat).toBe(20); // 20% of 100
      expect(result.customs).toBe(0);
      expect(result.handlingFee).toBe(0);
      expect(result.total).toBe(130);
    });

    it('should add customs and handling for international orders above threshold', () => {
      const result = calculateTotal(200, 15, MARKETS.UK, false);
      expect(result.vat).toBe(40);
      expect(result.customs).toBe(10); // 5% of 200
      expect(result.handlingFee).toBe(6);
      expect(result.total).toBe(271);
    });

    it('should NOT add customs for international orders below threshold', () => {
      const result = calculateTotal(50, 10, MARKETS.UK, false);
      expect(result.customs).toBe(0);
      expect(result.handlingFee).toBe(0);
    });

    it('should handle US market (0% VAT)', () => {
      const result = calculateTotal(100, 5, MARKETS.US, true);
      expect(result.vat).toBe(0);
      expect(result.total).toBe(105);
    });

    it('should handle TR market correctly', () => {
      const result = calculateTotal(1000, 50, MARKETS.TR, true);
      expect(result.vat).toBe(200);
      expect(result.total).toBe(1250);
    });

    it('should handle DE market (19% VAT)', () => {
      const result = calculateTotal(200, 10, MARKETS.DE, true);
      expect(result.vat).toBe(38); // 19% of 200
      expect(result.total).toBe(248);
    });
  });
});
