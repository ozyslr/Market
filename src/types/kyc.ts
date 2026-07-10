export interface CheckResult {
  status: 'pass' | 'fail' | 'error' | 'skipped';
  message: string;
  checkedAt: string;
  details?: Record<string, any>;
}

export interface AutoCheckResult {
  status: 'pending' | 'running' | 'passed' | 'failed';
  checks: {
    documentOcr: CheckResult;
    taxId: CheckResult;
    mersis: CheckResult;
    iban: CheckResult;
    identity: CheckResult;
  };
  score: number; // 0-100
  failureReason?: string;
}

export interface ApplicationEvent {
  timestamp: string;
  type:
    | 'submitted'
    | 'auto_check_started'
    | 'auto_check_completed'
    | 'identity_verified'
    | 'tax_verified'
    | 'admin_reviewed'
    | 'approved'
    | 'rejected'
    | 'contract_signed'
    | 'kvkk_consented';
  actor: 'system' | 'admin' | 'seller';
  actorId?: string;
  note?: string;
}

export interface KvkkConsent {
  accepted: boolean;
  acceptedAt: string;
  ipAddress: string;
  userAgent: string;
  kvkkVersion: string;
  consentWithdrawnAt?: string;
}

export interface ESignature {
  signed: boolean;
  signedAt: string;
  method: 'edevlet';
  edevletToken: string;
  contractVersion: string;
}

export interface KycSettings {
  autoCheckEnabled: boolean;
  taxIdVerification: boolean;
  mersisCheck: boolean;
  ibanVerification: boolean;
  identityOcr: boolean;
  esignatureRequired: boolean;
  autoApproveEnabled: boolean;
  autoApproveThreshold: number; // 0-100
}

export const DEFAULT_KYC_SETTINGS: KycSettings = {
  autoCheckEnabled: true,
  taxIdVerification: true,
  mersisCheck: true,
  ibanVerification: true,
  identityOcr: true,
  esignatureRequired: true,
  autoApproveEnabled: false,
  autoApproveThreshold: 90,
};

export const AUTO_CHECK_STATUS = ['pending', 'running', 'passed', 'failed'] as const;
export const CHECK_RESULT_STATUS = ['pass', 'fail', 'error', 'skipped'] as const;
