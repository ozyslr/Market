import { describe, it, expect } from 'vitest';
import { checkTaxIdFormat, checkIbanFormat, checkTcknFormat } from '../lib/kycChecks.js';

describe('checkTaxIdFormat', () => {
  it('accepts valid TR tax ID with correct checksum', () => {
    const result = checkTaxIdFormat('6120067518');
    expect(result.status).toBe('pass');
  });

  it('rejects tax ID shorter than 10 digits', () => {
    const result = checkTaxIdFormat('12345');
    expect(result.status).toBe('fail');
    expect(result.message).toContain('10 haneli');
  });

  it('rejects tax ID starting with zero', () => {
    const result = checkTaxIdFormat('0123456789');
    expect(result.status).toBe('fail');
    expect(result.message).toContain('0 ile başlayamaz');
  });

  it('rejects non-numeric tax ID', () => {
    const result = checkTaxIdFormat('abcd123456');
    expect(result.status).toBe('fail');
  });

  it('rejects tax ID with wrong checksum', () => {
    // 1234567890 — checksum would be wrong
    const result = checkTaxIdFormat('1234567890');
    expect(result.status).toBe('fail');
    expect(result.message).toContain('checksum');
  });
});

describe('checkIbanFormat', () => {
  it('accepts valid TR IBAN', () => {
    // TR33 0006 1005 1978 6457 8413 26 — valid TR IBAN
    const result = checkIbanFormat('TR330006100519786457841326', 'Test Satici');
    expect(result.status).toBe('pass');
  });

  it('rejects non-TR IBAN', () => {
    const result = checkIbanFormat('GB29NWBK60161331926819', 'Test');
    expect(result.status).toBe('fail');
    expect(result.message).toContain('TR ile başlamalı');
  });

  it('rejects IBAN without account holder', () => {
    const result = checkIbanFormat('TR330006100519786457841326', '');
    expect(result.status).toBe('fail');
    expect(result.message).toContain('Hesap sahibi');
  });

  it('rejects IBAN with short account holder name', () => {
    const result = checkIbanFormat('TR330006100519786457841326', 'AB');
    expect(result.status).toBe('fail');
  });

  it('validates IBAN checksum correctly', () => {
    // Modify one digit to break checksum
    const result = checkIbanFormat('TR330006100519786457841327', 'Test Satici');
    expect(result.status).toBe('fail');
    expect(result.message).toContain('checksum');
  });
});

describe('checkTcknFormat', () => {
  it('accepts valid TCKN', () => {
    // 10000000146 — known valid TCKN test case
    const result = checkTcknFormat('10000000146', 'Test Kullanici');
    expect(result.status).toBe('pass');
  });

  it('rejects 10-digit TCKN', () => {
    const result = checkTcknFormat('1234567890');
    expect(result.status).toBe('fail');
    expect(result.message).toContain('11 haneli');
  });

  it('rejects TCKN starting with zero', () => {
    const result = checkTcknFormat('02345678901');
    expect(result.status).toBe('fail');
    expect(result.message).toContain('0 ile başlayamaz');
  });

  it('rejects TCKN with invalid 10th digit', () => {
    // Known invalid checksum
    const result = checkTcknFormat('12345678901');
    expect(result.status).toBe('fail');
  });

  it('accepts TCKN without full name', () => {
    const result = checkTcknFormat('10000000146');
    expect(result.status).toBe('pass');
  });
});
