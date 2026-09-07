import { z } from "zod";

const booleanish = z
  .union([z.boolean(), z.string()])
  .transform((v) => (typeof v === "boolean" ? v : ["1", "true", "yes", "on"].includes(v.toLowerCase())));

const common = {
  NODE_ENV: z.enum(["development", "test", "production", "staging"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
};

export const databaseEnvSchema = z.object({
  ...common,
  DATABASE_URL: z.string().min(1, "DATABASE_URL الزامی است (postgresql://…)"),
});

export const apiEnvSchema = z.object({
  ...common,
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  API_GLOBAL_PREFIX: z.string().default("/api"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET باید حداقل ۳۲ نویسه باشد"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, "ENCRYPTION_KEY باید ۶۴ کاراکتر هگز (۳۲ بایت) برای AES-256-GCM باشد"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  BULLMQ_CONCURRENCY: z.coerce.number().int().min(1).max(64).default(4),
  OCR_SERVICE_URL: z.string().url().default("http://localhost:8000"),
  GITHUB_MODELS_BASE_URL: z.string().url().default("https://models.inference.ai.azure.com"),
  GITHUB_MODELS_TOKEN: z.string().optional(),
  UPLOAD_MAX_MB: z.coerce.number().int().min(1).max(100).default(10),
  UPLOAD_DIR: z.string().default("var/uploads"),
  TRUST_PROXY: booleanish.default(true),
  SWAGGER_ENABLED: booleanish.default(true),
});

export const webEnvSchema = z.object({
  ...common,
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  API_INTERNAL_URL: z.string().url().default("http://localhost:4000/api/v1"),
  NEXT_PUBLIC_API_URL: z.string().default("/api/proxy"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
});

export const ocrEnvSchema = z.object({
  ...common,
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8000),
  OCR_LANGUAGES: z.string().default("fas+eng"),
  OCR_TESSERACT_DATA_PATH: z.string().default("/usr/share/tessdata"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
export type OcrEnv = z.infer<typeof ocrEnvSchema>;

/** خطای خوانا برای متغیرهای محیطی گم‌شده */
export function formatEnvError(error: z.ZodError): string {
  return error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
}
