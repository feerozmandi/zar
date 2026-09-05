import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { apiEnvSchema, formatEnvError, type ApiEnv } from "@xennic/shared";

const TEST_DEFAULTS: Partial<NodeJS.ProcessEnv> = {
  JWT_SECRET: "0000000000000000000000000000000000000000000000000000000000000000",
  ENCRYPTION_KEY: "0000000000000000000000000000000000000000000000000000000000000000",
};

/**
 * تنها نقطه‌ی خواندن متغیرهای محیطی در بک‌اند.
 * اعتبارسنجی با همان zod که در apps/web و @xennic/shared استفاده می‌شود انجام می‌گیرد
 * تا اسکیمای محیطی در سه بخش تکرار نشود (رجوع: نوت ۳ §۲).
 */
@Injectable()
export class AppConfigService {
  private readonly env: ApiEnv;

  public constructor(private readonly config: ConfigService) {
    const merged = { ...(this.config.get<Record<string, string | undefined>>("env") ?? process.env) };
    // در تست، فقط مقادیر «نبود» کامل می‌شوند تا اعتبارسنجی واقعی (مثل کوتاهی JWT_SECRET) حفظ شود
    if (merged["NODE_ENV"] === "test") {
      for (const [key, value] of Object.entries(TEST_DEFAULTS)) {
        if (!merged[key]) merged[key] = value;
      }
    }

    const parsed = apiEnvSchema.safeParse(merged);
    if (!parsed.success) {
      throw new Error(`پیکربندی apps/api نامعتبر است:\n${formatEnvError(parsed.error)}`);
    }
    this.env = parsed.data;
  }

  public get nodeEnv(): ApiEnv["NODE_ENV"] {
    return this.env.NODE_ENV;
  }
  public get isProd(): boolean {
    return this.env.NODE_ENV === "production";
  }
  public get port(): number {
    return this.env.PORT;
  }
  public get host(): string {
    return this.env.HOST;
  }
  public get globalPrefix(): string {
    return this.env.API_GLOBAL_PREFIX;
  }
  public get corsOrigins(): string[] {
    return this.env.CORS_ORIGINS.split(",").map((origin) => origin.trim());
  }
  public get jwtSecret(): string {
    return this.env.JWT_SECRET;
  }
  public get jwtAccessTtl(): string {
    return this.env.JWT_ACCESS_TTL;
  }
  public get jwtRefreshTtl(): string {
    return this.env.JWT_REFRESH_TTL;
  }
  public get encryptionKey(): string {
    return this.env.ENCRYPTION_KEY;
  }
  public get redisUrl(): string {
    return this.env.REDIS_URL;
  }
  public get queueConcurrency(): number {
    return this.env.BULLMQ_CONCURRENCY;
  }
  public get ocrServiceUrl(): string {
    return this.env.OCR_SERVICE_URL;
  }
  public get githubModels(): { baseUrl: string; token?: string } {
    return { baseUrl: this.env.GITHUB_MODELS_BASE_URL, token: this.env.GITHUB_MODELS_TOKEN };
  }
  public get uploadMaxBytes(): number {
    return this.env.UPLOAD_MAX_MB * 1024 * 1024;
  }
  public get uploadDir(): string {
    return this.env.UPLOAD_DIR;
  }
  public get swaggerEnabled(): boolean {
    return this.env.SWAGGER_ENABLED && !this.isProd;
  }
  public get redisConnection(): { url: string } {
    return { url: this.env.REDIS_URL };
  }
}
