import { parsePhoneNumberFromString, isValidNumber } from 'libphonenumber-js';

// ── Phone verification ──────────────────────────────────────────────────────

export async function sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  const parsed = parsePhoneNumberFromString(phone);
  if (!parsed || !isValidNumber(phone))
    return { success: false, error: 'Geçersiz telefon numarası' };

  // Check for VOIP / virtual numbers (basic heuristic)
  const national = parsed.nationalNumber;
  if (String(national).length < 7) return { success: false, error: 'Sanal numaralar desteklenmez' };

  try {
    // Server handles Twilio Verify (dev mode auto-accepts)
    const res = await fetch('/api/verification/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: parsed.formatInternational() }),
    });
    return res.json();
  } catch {
    return { success: false, error: 'SMS gönderilemedi. Lütfen tekrar deneyin.' };
  }
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  try {
    const parsed = parsePhoneNumberFromString(phone);
    const res = await fetch('/api/verification/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: parsed?.formatInternational() || phone, code }),
    });
    const data = await res.json();
    return data.verified === true;
  } catch {
    return false;
  }
}

// ── Tax ID validation ───────────────────────────────────────────────────────

const TR_VKN_REGEX = /^[0-9]{10}$/;
const EU_VAT_REGEX = /^[A-Z]{2}[A-Z0-9]{2,12}$/;

export function validateTaxId(taxId: string, country: string): { valid: boolean; error?: string } {
  if (country === 'TR' || country === 'Türkiye') {
    if (!TR_VKN_REGEX.test(taxId.replace(/\s/g, ''))) {
      return { valid: false, error: 'Geçersiz Vergi Kimlik Numarası (10 haneli olmalı)' };
    }
    return { valid: true };
  }

  // EU VAT validation
  if (
    country.match(
      /^(DE|FR|NL|BE|AT|IT|ES|PL|SE|DK|FI|PT|IE|GR|CZ|RO|HU|BG|HR|SK|LT|LV|EE|SI|LU|MT|CY)$/,
    )
  ) {
    if (!EU_VAT_REGEX.test(taxId.replace(/\s/g, ''))) {
      return { valid: false, error: 'Geçersiz KDV numarası formatı (örn: DE123456789)' };
    }
    return { valid: true };
  }

  return { valid: true }; // Other countries: accept, manual review later
}

export async function validateViesVat(countryCode: string, vatNumber: string): Promise<boolean> {
  try {
    const res = await fetch('/api/verification/validate-vat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryCode, vatNumber }),
    });
    const data = await res.json();
    return data.valid === true;
  } catch {
    return false; // VIES frequently down — don't block
  }
}
