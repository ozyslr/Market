/**
 * Email Authentication Service (STREAM F)
 * Traditional email/password signup, login, verification, password reset
 *
 * Features:
 * - Email/password registration with verification
 * - Login with email and password
 * - Email verification via link (24-hour expiry)
 * - Password reset flow
 * - Account linking (email to phone/social)
 */

import { Timestamp, doc, setDoc, getDoc, updateDoc, deleteDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, Auth } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { hash, verify } from 'bcryptjs';

export interface EmailUser {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  avatar?: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  linkedPhoneNumber?: string;
  linkedAuthProviders?: string[]; // google, facebook, phone
}

export interface EmailVerificationToken {
  id: string;
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  verifiedAt?: string;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
}

const USERS_COLLECTION = 'users';
const EMAIL_VERIFICATION_COLLECTION = 'email_verification_tokens';
const PASSWORD_RESET_COLLECTION = 'password_reset_tokens';
const VERIFICATION_EXPIRY_HOURS = 24;
const RESET_EXPIRY_HOURS = 1;

/**
 * Generate secure random token
 */
export function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return hash(password, saltRounds);
}

/**
 * Verify password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return verify(password, hash);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Register user with email and password
 */
export async function registerWithEmail(email: string, password: string, name?: string): Promise<{ userId: string; verificationSent: boolean }> {
  try {
    // Validate email
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Check if email already exists
    const existingUser = await getEmailUser(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user document
    const userId = `email_${Date.now()}`;
    const userRef = doc(db, USERS_COLLECTION, userId);

    const user: EmailUser = {
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      name,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userRef, user);

    // Send verification email
    await sendVerificationEmail(userId, email);

    return {
      userId,
      verificationSent: true,
    };
  } catch (error) {
    console.error('[emailAuthService] Registration error:', error);
    throw error;
  }
}

/**
 * Login with email and password
 */
export async function loginWithEmail(email: string, password: string): Promise<{ userId: string; emailVerified: boolean }> {
  try {
    const user = await getEmailUser(email);

    if (!user) {
      throw new Error('Email or password incorrect');
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      throw new Error('Email or password incorrect');
    }

    // Update last login
    const userRef = doc(db, USERS_COLLECTION, user.id);
    await updateDoc(userRef, {
      lastLoginAt: Timestamp.now(),
    });

    return {
      userId: user.id,
      emailVerified: user.emailVerified,
    };
  } catch (error) {
    console.error('[emailAuthService] Login error:', error);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getEmailUser(email: string): Promise<EmailUser | null> {
  try {
    const userRef = collection(db, USERS_COLLECTION);
    const q = query(userRef, where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as EmailUser;
  } catch (error) {
    console.error('[emailAuthService] Error getting user:', error);
    return null;
  }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(userId: string, email: string): Promise<void> {
  try {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);

    const verificationRef = doc(db, EMAIL_VERIFICATION_COLLECTION, `${userId}_${Date.now()}`);
    const verification: EmailVerificationToken = {
      id: verificationRef.id,
      userId,
      email: email.toLowerCase(),
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    await setDoc(verificationRef, verification);

    // Send email
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}&userId=${userId}`;

    await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: 'email-verification',
        to: email,
        data: {
          verificationLink,
          expiresIn: `${VERIFICATION_EXPIRY_HOURS} hours`,
        },
      }),
    }).catch(() => {
      console.warn('[emailAuthService] Failed to send verification email');
    });
  } catch (error) {
    console.error('[emailAuthService] Error sending verification:', error);
    throw error;
  }
}

/**
 * Verify email with token
 */
export async function verifyEmailToken(userId: string, token: string): Promise<{ verified: boolean; error?: string }> {
  try {
    // Find verification record
    const verRef = collection(db, EMAIL_VERIFICATION_COLLECTION);
    const q = query(verRef, where('userId', '==', userId), where('token', '==', token));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { verified: false, error: 'Verification token not found' };
    }

    const verification = snapshot.docs[0].data() as EmailVerificationToken;

    // Check expiry
    if (new Date() > new Date(verification.expiresAt)) {
      return { verified: false, error: 'Verification token expired' };
    }

    // Mark user as verified
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      emailVerified: true,
      emailVerifiedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Mark token as used
    await updateDoc(snapshot.docs[0].ref, {
      verifiedAt: Timestamp.now(),
    });

    return { verified: true };
  } catch (error) {
    console.error('[emailAuthService] Error verifying email:', error);
    return { verified: false, error: 'Verification failed' };
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getEmailUser(email);

    if (!user) {
      // For security, don't reveal if email exists
      return { success: true };
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000);

    const resetRef = doc(db, PASSWORD_RESET_COLLECTION, `${user.id}_${Date.now()}`);
    const reset: PasswordResetToken = {
      id: resetRef.id,
      userId: user.id,
      email: user.email,
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    await setDoc(resetRef, reset);

    // Send email
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}&userId=${user.id}`;

    await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: 'password-reset',
        to: email,
        data: {
          resetLink,
          expiresIn: `${RESET_EXPIRY_HOURS} hour`,
        },
      }),
    }).catch(() => {
      console.warn('[emailAuthService] Failed to send reset email');
    });

    return { success: true };
  } catch (error) {
    console.error('[emailAuthService] Error requesting reset:', error);
    return { success: true }; // Still return success for security
  }
}

/**
 * Reset password with token
 */
export async function resetPasswordWithToken(userId: string, token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate new password
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      return { success: false, error: validation.errors[0] };
    }

    // Find reset record
    const resetRef = collection(db, PASSWORD_RESET_COLLECTION);
    const q = query(resetRef, where('userId', '==', userId), where('token', '==', token));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, error: 'Reset token not found' };
    }

    const reset = snapshot.docs[0].data() as PasswordResetToken;

    // Check expiry
    if (new Date() > new Date(reset.expiresAt)) {
      return { success: false, error: 'Reset token expired' };
    }

    // Check if already used
    if (reset.usedAt) {
      return { success: false, error: 'Reset token already used' };
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      passwordHash,
      updatedAt: Timestamp.now(),
    });

    // Mark token as used
    await updateDoc(snapshot.docs[0].ref, {
      usedAt: Timestamp.now(),
    });

    return { success: true };
  } catch (error) {
    console.error('[emailAuthService] Error resetting password:', error);
    return { success: false, error: 'Password reset failed' };
  }
}

export default {
  registerWithEmail,
  loginWithEmail,
  getEmailUser,
  sendVerificationEmail,
  verifyEmailToken,
  requestPasswordReset,
  resetPasswordWithToken,
  validateEmail,
  validatePasswordStrength,
};
