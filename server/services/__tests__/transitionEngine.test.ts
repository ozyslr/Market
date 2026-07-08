import { describe, it, expect } from 'vitest';
import { transitionOrder, InvalidTransitionError } from '../transitionEngine.js';
import type { OrderSetStatus, TransitionEvent } from '../transitionEngine.js';

describe('transitionEngine', () => {
  describe('valid transitions', () => {
    it('pending + payment_received -> processing', () => {
      const result = transitionOrder('pending', 'payment_received', 0);
      expect(result.status).toBe('processing');
      expect(result.version).toBe(1);
    });

    it('processing + mark_shipped -> shipped', () => {
      const result = transitionOrder('processing', 'mark_shipped', 0);
      expect(result.status).toBe('shipped');
    });

    it('shipped + confirm_delivery -> delivered', () => {
      const result = transitionOrder('shipped', 'confirm_delivery', 0);
      expect(result.status).toBe('delivered');
    });

    it('delivered + auto_complete -> completed', () => {
      const result = transitionOrder('delivered', 'auto_complete', 0);
      expect(result.status).toBe('completed');
    });

    it('processing + cancel -> cancelled', () => {
      const result = transitionOrder('processing', 'cancel', 0);
      expect(result.status).toBe('cancelled');
    });

    it('pending + cancel -> cancelled', () => {
      const result = transitionOrder('pending', 'cancel', 0);
      expect(result.status).toBe('cancelled');
    });
  });

  describe('invalid transitions throw InvalidTransitionError', () => {
    it('pending + confirm_delivery throws', () => {
      expect(() => transitionOrder('pending', 'confirm_delivery', 0)).toThrow(
        InvalidTransitionError,
      );
    });

    it('pending + mark_shipped throws', () => {
      expect(() => transitionOrder('pending', 'mark_shipped', 0)).toThrow(InvalidTransitionError);
    });

    it('shipped + cancel throws (shipped cannot be cancelled)', () => {
      expect(() => transitionOrder('shipped', 'cancel', 0)).toThrow(InvalidTransitionError);
    });

    it('InvalidTransitionError has status and event properties', () => {
      try {
        transitionOrder('pending', 'confirm_delivery', 0);
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidTransitionError);
        expect((err as InvalidTransitionError).status).toBe('pending');
        expect((err as InvalidTransitionError).event).toBe('confirm_delivery');
      }
    });
  });

  describe('version bump', () => {
    it('transitionOrder increments version field by 1', () => {
      const result = transitionOrder('pending', 'payment_received', 5);
      expect(result.version).toBe(6);
    });

    it('version starts at 0 and becomes 1 after first transition', () => {
      const result = transitionOrder('pending', 'payment_received', 0);
      expect(result.version).toBe(1);
    });
  });

  describe('terminal states', () => {
    it('cancelled has no transitions', () => {
      expect(() => transitionOrder('cancelled', 'payment_received', 0)).toThrow(
        InvalidTransitionError,
      );
      expect(() => transitionOrder('cancelled', 'cancel', 0)).toThrow(InvalidTransitionError);
    });

    it('refunded has no transitions', () => {
      expect(() => transitionOrder('refunded', 'payment_received', 0)).toThrow(
        InvalidTransitionError,
      );
      expect(() => transitionOrder('refunded', 'refund', 0)).toThrow(InvalidTransitionError);
    });
  });
});
