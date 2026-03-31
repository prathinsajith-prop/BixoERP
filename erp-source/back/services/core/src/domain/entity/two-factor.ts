import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

export interface TwoFactorData {
  encryptedSecret: string;
  recoveryCodes: string[];  // hashed
  enabled: boolean;
}

/**
 * Encrypts a TOTP secret using AES-256-GCM with a derived key.
 * Format: base64(salt + iv + tag + ciphertext)
 */
export function encryptSecret(plaintext: string, passphrase: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const key = scryptSync(passphrase, salt, KEY_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

export function decryptSecret(encoded: string, passphrase: string): string {
  const buf = Buffer.from(encoded, 'base64');
  const salt = buf.subarray(0, SALT_LENGTH);
  const iv = buf.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buf.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const ciphertext = buf.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const key = scryptSync(passphrase, salt, KEY_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}

export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = randomBytes(5).toString('hex'); // 10 hex chars
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return codes;
}
