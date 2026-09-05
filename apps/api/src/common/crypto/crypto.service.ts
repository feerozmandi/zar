import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { AppConfigService } from "../../config/app-config.service.js";

const IV_BYTES = 12;
const TAG_BYTES = 16;
const ALGORITHM = "aes-256-gcm";

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

/**
 * رمزنگاری AES-256-GCM برای کلیدهای اختصاصی کاربران (BYOK) — نوت ۳ §۵-۱.
 * مقدار رمزنگاری‌شده هرگز لاگ یا بازنگشت نمی‌شود.
 */
@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  public constructor(private readonly config: AppConfigService) {
    this.key = Buffer.from(this.config.encryptionKey, "hex");
    if (this.key.byteLength !== 32) {
      throw new Error("ENCRYPTION_KEY باید دقیقاً ۳۲ بایت (۶۴ کاراکتر هگز) باشد");
    }
  }

  public encrypt(plaintext: string): EncryptedPayload {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv, { authTagLength: TAG_BYTES });
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    return {
      ciphertext: ciphertext.toString("base64"),
      iv: iv.toString("base64"),
      authTag: cipher.getAuthTag().toString("base64"),
    };
  }

  public decrypt(payload: EncryptedPayload): string {
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(payload.iv, "base64"), {
      authTagLength: TAG_BYTES,
    });
    decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8");
  }

  /** نمایش تنها ۴ نویسه‌ی آخر — برای پاسخ‌های API و لاگ */
  public static redact(apiKey: string): string {
    return `••••${apiKey.slice(-4)}`;
  }
}
