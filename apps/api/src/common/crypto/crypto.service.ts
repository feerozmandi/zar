import { Injectable } from "@nestjs/common";
import { AppConfigService } from "../../config/app-config.service.js";
import { aesGcmDecrypt, aesGcmEncrypt, keyFromHex, type EncryptedPayload } from "./aes-gcm.js";

export type { EncryptedPayload } from "./aes-gcm.js";

/**
 * رمزنگاری AES-256-GCM برای کلیدهای اختصاصی کاربران (BYOK) — نوت ۳ §۵-۱.
 * مقدار رمزنگاری‌شده هرگز لاگ یا بازنگشت نمی‌شود.
 * پیاده‌سازی الگوریتم در aes-gcm.ts است تا worker مستقل صف نیز از همان استفاده کند.
 */
@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  public constructor(private readonly config: AppConfigService) {
    this.key = keyFromHex(this.config.encryptionKey);
  }

  public encrypt(plaintext: string): EncryptedPayload {
    return aesGcmEncrypt(this.key, plaintext);
  }

  public decrypt(payload: EncryptedPayload): string {
    return aesGcmDecrypt(this.key, payload);
  }

  /** نمایش تنها ۴ نویسه‌ی آخر — برای پاسخ‌های API و لاگ */
  public static redact(apiKey: string): string {
    return `••••${apiKey.slice(-4)}`;
  }
}
