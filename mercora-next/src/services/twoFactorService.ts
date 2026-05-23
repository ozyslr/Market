/**
 * Two-Factor Authentication Service (STREAM M)
 * Manages TOTP, SMS OTP, recovery codes, and device trust
 */

import { totp } from 'speakeasy';
import { encode as base32Encode } from 'js-base64';

export interface TwoFactorSettings {
  userId: string;
  enabled: boolean;
  method: 'totp' | 'sms' | 'email' | null;
  totpSecret?: string; // Encrypted
  backupCodes: string[]; // Hashed
  smsNumber?: string;
  recoveryEmail?: string;
  enabledAt?: Date;
  lastVerifiedAt?: Date;
}

export interface TrustedDevice {
  id: string;
  userId: string;
  deviceFingerprint: string;
  deviceName?: string;
  lastUsed: Date;
  trustedUntil: Date;
  ipAddress: string;
}

class TwoFactorService {
  private readonly BACKUP_CODE_COUNT = 10;
  private readonly BACKUP_CODE_LENGTH = 8;
  private readonly DEVICE_TRUST_DAYS = 30;
  private readonly TOTP_WINDOW = 2; // Allow ±30 seconds

  /**
   * Generate TOTP secret and QR code
   */
  async generateTOTPSecret(userId: string, email: string): Promise<{
    secret: string;
    qrCode: string;
    manualEntry: string;
  }> {
    try {
      const secret = totp.generateSecret({
        name: `Mercora (${email})`,
        issuer: 'Mercora',
        length: 32,
      });

      if (!secret.base32 || !secret.otpauth_url) {
        throw new Error('Failed to generate TOTP secret');
      }

      // In production, generate actual QR code
      // const qrCode = await QRCode.toDataURL(secret.otpauth_url)

      return {
        secret: secret.base32,
        qrCode: secret.otpauth_url,
        manualEntry: secret.base32,
      };
    } catch (error) {
      console.error('Generate TOTP secret error:', error);
      throw new Error('Failed to generate 2FA secret');
    }
  }

  /**
   * Verify TOTP code
   */
  verifyTOTPCode(secret: string, code: string): boolean {
    try {
      const verified = totp.verify({
        secret,
        encoding: 'base32',
        token: code,
        window: this.TOTP_WINDOW,
      });

      return verified;
    } catch (error) {
      console.error('Verify TOTP error:', error);
      return false;
    }
  }

  /**
   * Generate backup codes
   */
  generateBackupCodes(): string[] {
    const codes: string[] = [];

    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      const code = this.generateRandomCode(this.BACKUP_CODE_LENGTH);
      codes.push(code);
    }

    return codes;
  }

  /**
   * Hash backup code (for storage)
   */
  hashBackupCode(code: string): string {
    // In production, use bcrypt
    // return await bcrypt.hash(code, 10)

    // Simple hash for demo
    return base32Encode(code);
  }

  /**
   * Verify backup code and mark as used
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      // Query user's backup codes
      // const user = await db.collection('users').doc(userId).get()
      // const codes = user.data()?.twoFactorBackupCodes || []

      // Check if code matches any unused code
      // for (const hashedCode of codes) {
      //   if (await bcrypt.compare(code, hashedCode)) {
      //     // Mark as used by removing it
      //     await db.collection('users').doc(userId).update({
      //       twoFactorBackupCodes: codes.filter(c => c !== hashedCode)
      //     })
      //     return true
      //   }
      // }

      return false;
    } catch (error) {
      console.error('Verify backup code error:', error);
      return false;
    }
  }

  /**
   * Enable 2FA for user
   */
  async enable2FA(
    userId: string,
    method: 'totp' | 'sms' | 'email',
    secret?: string,
    smsNumber?: string
  ): Promise<{ backupCodes: string[]; settings: TwoFactorSettings }> {
    try {
      const backupCodes = this.generateBackupCodes();
      const hashedCodes = backupCodes.map((code) => this.hashBackupCode(code));

      const settings: TwoFactorSettings = {
        userId,
        enabled: true,
        method,
        totpSecret: secret,
        smsNumber,
        backupCodes: hashedCodes,
        enabledAt: new Date(),
      };

      // Save to Firestore
      // db.collection('users').doc(userId).update({
      //   twoFactorEnabled: true,
      //   twoFactorMethod: method,
      //   totp_secret: secret ? await encrypt(secret) : null,
      //   twoFactorBackupCodes: hashedCodes,
      //   twoFactorEnabledAt: new Date(),
      // })

      // Log audit event
      await this.logAuditEvent(userId, 'setup_2fa', { method });

      return { backupCodes, settings };
    } catch (error) {
      console.error('Enable 2FA error:', error);
      throw new Error('Failed to enable 2FA');
    }
  }

  /**
   * Disable 2FA for user
   */
  async disable2FA(userId: string): Promise<void> {
    try {
      // db.collection('users').doc(userId).update({
      //   twoFactorEnabled: false,
      //   twoFactorMethod: null,
      //   totp_secret: null,
      //   twoFactorBackupCodes: [],
      // })

      // Log audit event
      await this.logAuditEvent(userId, 'disable_2fa', {});

      console.log(`[2FA] Disabled for ${userId}`);
    } catch (error) {
      console.error('Disable 2FA error:', error);
      throw new Error('Failed to disable 2FA');
    }
  }

  /**
   * Create device trust token
   */
  async createTrustedDevice(
    userId: string,
    deviceFingerprint: string,
    ipAddress: string,
    deviceName?: string
  ): Promise<TrustedDevice> {
    try {
      const device: TrustedDevice = {
        id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        deviceFingerprint,
        deviceName,
        lastUsed: new Date(),
        trustedUntil: new Date(
          Date.now() + this.DEVICE_TRUST_DAYS * 24 * 60 * 60 * 1000
        ),
        ipAddress,
      };

      // Save to Firestore
      // db.collection('trusted_devices').doc(device.id).set(device)

      console.log(`[2FA] Device trusted: ${deviceName || 'Unknown'}`);
      return device;
    } catch (error) {
      console.error('Create trusted device error:', error);
      throw new Error('Failed to trust device');
    }
  }

  /**
   * Check if device is trusted
   */
  async isDeviceTrusted(userId: string, deviceFingerprint: string): Promise<boolean> {
    try {
      // Query trusted devices
      // const snapshot = await db
      //   .collection('trusted_devices')
      //   .where('userId', '==', userId)
      //   .where('deviceFingerprint', '==', deviceFingerprint)
      //   .where('trustedUntil', '>', new Date())
      //   .get()

      // return !snapshot.empty

      return false;
    } catch (error) {
      console.error('Check device trusted error:', error);
      return false;
    }
  }

  /**
   * Get user's trusted devices
   */
  async getTrustedDevices(userId: string): Promise<TrustedDevice[]> {
    try {
      // Query all non-expired trusted devices for user
      // const snapshot = await db
      //   .collection('trusted_devices')
      //   .where('userId', '==', userId)
      //   .where('trustedUntil', '>', new Date())
      //   .get()

      // return snapshot.docs.map(doc => doc.data() as TrustedDevice)

      return [];
    } catch (error) {
      console.error('Get trusted devices error:', error);
      return [];
    }
  }

  /**
   * Remove trusted device
   */
  async removeTrustedDevice(userId: string, deviceId: string): Promise<void> {
    try {
      // db.collection('trusted_devices').doc(deviceId).delete()

      console.log(`[2FA] Device removed: ${deviceId}`);
    } catch (error) {
      console.error('Remove trusted device error:', error);
      throw new Error('Failed to remove device');
    }
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    userId: string,
    event: 'setup_2fa' | 'verify_2fa' | 'disable_2fa' | 'failed_2fa',
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      // db.collection('auth_audit_log').add({
      //   userId,
      //   event,
      //   metadata,
      //   ipAddress: getCurrentIp(),
      //   timestamp: new Date(),
      // })

      console.log(`[Audit] ${event} by ${userId}`);
    } catch (error) {
      console.error('Log audit event error:', error);
    }
  }

  /**
   * Get audit log for user
   */
  async getAuditLog(userId: string, days: number = 30): Promise<Array<{
    event: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }>> {
    try {
      // Query audit log
      // const snapshot = await db
      //   .collection('auth_audit_log')
      //   .where('userId', '==', userId)
      //   .where('timestamp', '>=', new Date(Date.now() - days * 24 * 60 * 60 * 1000))
      //   .orderBy('timestamp', 'desc')
      //   .get()

      // return snapshot.docs.map(doc => ({
      //   event: doc.data().event,
      //   timestamp: doc.data().timestamp,
      //   metadata: doc.data().metadata,
      // }))

      return [];
    } catch (error) {
      console.error('Get audit log error:', error);
      return [];
    }
  }

  /**
   * Generate random code
   */
  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  }
}

export const twoFactorService = new TwoFactorService();
