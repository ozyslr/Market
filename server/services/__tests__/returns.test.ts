// ─── Returns / Return Window Tests (TDD RED phase) ───────────────────────────
// Tests for SHP-05: 14-day return window enforcement and processRefund wire-up.
// Window enforcement tests pass immediately (pure date math).
// processRefund wire-up test is marked todo until Plan 04 ships the route.

import { describe, it, expect, vi } from 'vitest';

// ─── Inline business rule helper ─────────────────────────────────────────────
// Mirrors the exact guard that will be extracted into the returns route (Plan 04).

function isReturnWindowExpired(deliveredAt: string): boolean {
  const WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(deliveredAt).getTime() > WINDOW_MS;
}

// ─── return window enforcement ────────────────────────────────────────────────

describe('return window enforcement', () => {
  it('rejects return request with deliveredAt older than 14 days', () => {
    const deliveredAt = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    expect(isReturnWindowExpired(deliveredAt)).toBe(true);
  });

  it('accepts return request with deliveredAt within 14 days', () => {
    const deliveredAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(isReturnWindowExpired(deliveredAt)).toBe(false);
  });
});

// ─── return approval processRefund wire-up ────────────────────────────────────

describe('return approval processRefund wire-up', () => {
  it.todo('approval calls processRefund with { orderSetId, subOrderId, isFullRefund: true }');
});
