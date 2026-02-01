/**
 * Two-Factor Authentication (2FA) Service
 * Implements TOTP-based 2FA using Firebase and authenticator apps
 */

// @ts-ignore
import otplib from 'otplib';
const { authenticator } = otplib;
import QRCode from 'qrcode';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { log2FAChange } from './security-logging';

// Configure TOTP
authenticator.options = {
    window: 1, // Allow 1 step before/after for time drift
    step: 30, // 30 second validity
};

export interface TwoFactorAuth {
    enabled: boolean;
    secret?: string;
    backupCodes?: string[];
    verifiedAt?: Date;
}

/**
 * Generate a new 2FA secret for a user
 */
export async function generate2FASecret(
    userId: string,
    userEmail: string,
    appName: string = 'SearnAI'
): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    try {
        // Generate secret
        const secret = authenticator.generateSecret();

        // Generate OTP auth URL for QR code
        const otpauthUrl = authenticator.keyuri(userEmail, appName, secret);

        // Generate QR code
        const qrCode = await QRCode.toDataURL(otpauthUrl);

        // Generate backup codes
        const backupCodes = generateBackupCodes(8);

        // Store in Firestore (temporarily, until verified)
        await setDoc(
            doc(db, 'users', userId, 'private', '2fa'),
            {
                secret,
                backupCodes,
                enabled: false,
                pending: true,
                createdAt: new Date(),
            },
            { merge: true }
        );

        return { secret, qrCode, backupCodes };
    } catch (error) {
        console.error('Failed to generate 2FA secret:', error);
        throw new Error('Failed to generate 2FA secret');
    }
}

/**
 * Verify 2FA token and enable 2FA
 */
export async function verify2FAToken(
    userId: string,
    token: string
): Promise<{ valid: boolean; error?: string }> {
    try {
        // Get user's 2FA secret
        const twoFADoc = await getDoc(doc(db, 'users', userId, 'private', '2fa'));

        if (!twoFADoc.exists()) {
            return { valid: false, error: '2FA not set up' };
        }

        const twoFAData = twoFADoc.data();
        const { secret, backupCodes } = twoFAData;

        // Verify TOTP token
        const isValid = authenticator.verify({ token, secret });

        // Or check backup codes
        const isBackupCode = backupCodes?.includes(token);

        if (!isValid && !isBackupCode) {
            return { valid: false, error: 'Invalid code' };
        }

        // If using backup code, remove it
        if (isBackupCode) {
            const newBackupCodes = backupCodes.filter((code: string) => code !== token);
            await updateDoc(doc(db, 'users', userId, 'private', '2fa'), {
                backupCodes: newBackupCodes,
            });
        }

        return { valid: true };
    } catch (error) {
        console.error('Failed to verify 2FA token:', error);
        return { valid: false, error: 'Verification failed' };
    }
}

/**
 * Enable 2FA for a user (after verification)
 */
export async function enable2FA(userId: string, token: string): Promise<boolean> {
    try {
        // Verify token first
        const verification = await verify2FAToken(userId, token);

        if (!verification.valid) {
            return false;
        }

        // Enable 2FA
        await updateDoc(doc(db, 'users', userId, 'private', '2fa'), {
            enabled: true,
            pending: false,
            verifiedAt: new Date(),
        });

        // Log the change
        await log2FAChange(userId, true);

        return true;
    } catch (error) {
        console.error('Failed to enable 2FA:', error);
        return false;
    }
}

/**
 * Disable 2FA for a user
 */
export async function disable2FA(userId: string, password: string): Promise<boolean> {
    try {
        // TODO: Verify password before disabling
        // This is a security measure to prevent unauthorized 2FA disable

        // Disable 2FA
        await updateDoc(doc(db, 'users', userId, 'private', '2fa'), {
            enabled: false,
            secret: null,
            backupCodes: [],
        });

        // Log the change
        await log2FAChange(userId, false);

        return true;
    } catch (error) {
        console.error('Failed to disable 2FA:', error);
        return false;
    }
}

/**
 * Check if user has 2FA enabled
 */
export async function is2FAEnabled(userId: string): Promise<boolean> {
    try {
        const twoFADoc = await getDoc(doc(db, 'users', userId, 'private', '2fa'));

        if (!twoFADoc.exists()) {
            return false;
        }

        return twoFADoc.data()?.enabled === true;
    } catch (error) {
        console.error('Failed to check 2FA status:', error);
        return false;
    }
}

/**
 * Generate backup codes
 */
function generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
        // Generate 8-digit code
        const code = Math.floor(10000000 + Math.random() * 90000000).toString();
        codes.push(code);
    }

    return codes;
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
        const backupCodes = generateBackupCodes(8);

        await updateDoc(doc(db, 'users', userId, 'private', '2fa'), {
            backupCodes,
        });

        return backupCodes;
    } catch (error) {
        console.error('Failed to regenerate backup codes:', error);
        throw new Error('Failed to regenerate backup codes');
    }
}

/**
 * Get remaining backup codes count
 */
export async function getBackupCodesCount(userId: string): Promise<number> {
    try {
        const twoFADoc = await getDoc(doc(db, 'users', userId, 'private', '2fa'));

        if (!twoFADoc.exists()) {
            return 0;
        }

        const backupCodes = twoFADoc.data()?.backupCodes || [];
        return backupCodes.length;
    } catch (error) {
        console.error('Failed to get backup codes count:', error);
        return 0;
    }
}
