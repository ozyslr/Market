// server/lib/kycChecks.ts
import type { CheckResult } from '../../src/types/kyc.js';

function makeCheck(status: CheckResult['status'], message: string, details?: any): CheckResult {
  return { status, message, checkedAt: new Date().toISOString(), details };
}

/** Turkish Tax ID validation (10 digits, first digit non-zero, checksum) */
export function checkTaxIdFormat(taxId: string): CheckResult {
  if (!/^\d{10}$/.test(taxId)) {
    return makeCheck('fail', 'Vergi numarası 10 haneli olmalıdır', { taxId });
  }
  if (taxId[0] === '0') {
    return makeCheck('fail', 'Vergi numarası 0 ile başlayamaz', { taxId });
  }
  // Checksum: sum(digits[i] * (i+1)) mod 10 === digits[9]
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(taxId[i]) * (i + 1);
  }
  if (sum % 10 !== parseInt(taxId[9])) {
    return makeCheck('fail', 'Vergi numarası checksum hatası', {
      taxId,
      expectedChecksum: sum % 10,
    });
  }
  return makeCheck('pass', 'Vergi numarası formatı geçerli', { taxId });
}

/** Turkish IBAN validation (TR + 24 digits) */
export function checkIbanFormat(iban: string, accountHolder?: string): CheckResult {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  if (!/^TR\d{24}$/.test(cleaned)) {
    return makeCheck('fail', 'IBAN TR ile başlamalı ve 26 karakter olmalıdır', { iban: cleaned });
  }
  // IBAN checksum: move first 4 chars to end, replace letters with numbers (A=10...), mod 97 should be 1
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (ch) => (ch.charCodeAt(0) - 55).toString());
  const checksum = BigInt(numeric) % 97n;
  if (checksum !== 1n) {
    return makeCheck('fail', 'IBAN checksum geçersiz', {
      iban: cleaned,
      checksum: Number(checksum),
    });
  }
  if (!accountHolder || accountHolder.trim().length < 3) {
    return makeCheck('fail', 'Hesap sahibi adı eksik veya çok kısa', { accountHolder });
  }
  return makeCheck('pass', 'IBAN formatı geçerli', {
    iban: cleaned,
    accountHolder,
  });
}

/** TCKN (Turkish ID Number) format validation */
export function checkTcknFormat(tckn: string, fullName?: string): CheckResult {
  if (!/^\d{11}$/.test(tckn)) {
    return makeCheck('fail', 'TC Kimlik No 11 haneli olmalıdır', { tckn });
  }
  if (tckn[0] === '0') {
    return makeCheck('fail', 'TC Kimlik No 0 ile başlayamaz', { tckn });
  }
  // TCKN checksum algorithm
  const digits = tckn.split('').map(Number);
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const tenth = (oddSum * 7 - evenSum) % 10;
  if (tenth !== digits[9]) {
    return makeCheck('fail', 'TC Kimlik No 10. hane hatası', { tckn });
  }
  const allSum = oddSum + evenSum + digits[9];
  if (allSum % 10 !== digits[10]) {
    return makeCheck('fail', 'TC Kimlik No 11. hane hatası', { tckn });
  }
  return makeCheck('pass', 'TC Kimlik No formatı geçerli', { tckn, fullName });
}

/** Document OCR check — validates at least one readable document */
export async function checkDocumentOcr(
  kycDocs: Array<{
    docType: string;
    storagePath: string;
    verified?: boolean;
  }>,
): Promise<CheckResult> {
  const requiredTypes = ['identity', 'tax_certificate', 'bank_iban'];
  const uploaded = new Set(kycDocs.map((d) => d.docType));
  const missing = requiredTypes.filter((t) => !uploaded.has(t));

  if (missing.length > 0) {
    return makeCheck('fail', `Eksik belgeler: ${missing.join(', ')}`, { missing });
  }

  const allPresent = requiredTypes.every((t) => {
    const doc = kycDocs.find((d) => d.docType === t);
    return doc && doc.storagePath && doc.storagePath.length > 0;
  });

  return allPresent
    ? makeCheck('pass', 'Tüm belgeler mevcut', {
        docCount: kycDocs.length,
      })
    : makeCheck('fail', 'Bazı belgeler eksik veya bozuk', { kycDocs });
}
