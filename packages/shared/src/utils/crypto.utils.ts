import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts sensitive text (e.g. OpenAI/Anthropic BYOK API keys) using AES-256-GCM
 */
export function encryptAES256GCM(
  plainText: string,
  keyHex: string
): { encrypted: string; iv: string; tag: string } {
  const key = Buffer.from(keyHex.padStart(64, '0').slice(0, 64), 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

/**
 * Decrypts encrypted text using AES-256-GCM
 */
export function decryptAES256GCM(
  encryptedHex: string,
  ivHex: string,
  tagHex: string,
  keyHex: string
): string {
  const key = Buffer.from(keyHex.padStart(64, '0').slice(0, 64), 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
