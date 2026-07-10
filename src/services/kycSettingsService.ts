// src/services/kycSettingsService.ts
import type { KycSettings } from '@/types/kyc';

export async function getKycSettings(token: string): Promise<KycSettings> {
  const res = await fetch('/api/kyc/admin/settings', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('KYC ayarları alınamadı');
  return res.json();
}

export async function updateKycSettings(
  token: string,
  settings: Partial<KycSettings>,
): Promise<KycSettings> {
  const res = await fetch('/api/kyc/admin/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('KYC ayarları güncellenemedi');
  return res.json();
}
