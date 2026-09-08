/**
 * توابع خالص AES-256-GCM — بدون وابستگی به NestJS.
 * هم CryptoService (لایه‌ی تزریق‌پذیر API) و هم worker مستقل صف از همین
 * توابع استفاده می‌کنند تا الگوریتم رمزنگاری BYOK فقط یک‌جا تعریف شود (نوت ۳ §۵-۱).
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const IV_BYTES = 12;
const TAG_BYTES = 16;
const ALGORITHM = "aes-256-gcm";

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

/** تبدیل ENCRYPTION_KEY (۶۴ نویسه‌ی هگز) به Buffer با اعتبارسنجی طول */
export function keyFromHex(hex: string): Buffer {
  const key = Buffer.from(hex, "hex");
  if (key.byteLength !== 32) {
    throw new Error("ENCRYPTION_KEY باید دقیقاً ۳۲ بایت (۶۴ کاراکتر هگز) باشد");
  }
  return key;
}

export function aesGcmEncrypt(key: Buffer, plaintext: string): EncryptedPayload {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES });
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

export function aesGcmDecrypt(key: Buffer, payload: EncryptedPayload): string {
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(payload.iv, "base64"), {
    authTagLength: TAG_BYTES,
  });
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
