import { z } from "zod";

/** مقادیر دقیقاً با enum دیتابیس (AiProvider) یکی هستند تا نگاشت دستی لازم نشود */
export const aiProviderValues = ["GITHUB_MODELS", "OPENAI", "ANTHROPIC", "GEMINI"] as const;

/** سطر فهرست مدل‌ها — GET /ai/models */
export const aiModelRowSchema = z.object({
  slug: z.string().min(1),
  displayName: z.string().min(1),
  provider: z.enum(aiProviderValues),
  supportsVision: z.boolean().default(false),
  freeTierOnly: z.boolean().default(true),
  maxTokens: z.number().int().positive().optional(),
});

export const aiModelListSchema = z.array(aiModelRowSchema);

/** POST /ai/generate — بدنه‌ی درخواست تحلیل */
export const aiGenerateSchema = z.object({
  prompt: z.string().min(4).max(20_000),
  model: z.string().min(1).optional(),
  system: z.string().max(4000).optional(),
  maxTokens: z.number().int().min(64).max(32_000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  /** استفاده از کلید اختصاصی کاربر (BYOK) به‌جای لایه‌ی سیستم */
  useOwnKey: z.boolean().default(false),
  /** پردازش ناهم‌زمان برای اسناد حجیم */
  async: z.boolean().default(false),
});

/** PUT /user/ai-settings — تنظیمات پیش‌فرض کلید کاربر (بدون تعویض خودِ کلید) */
export const aiSettingsSchema = z.object({
  provider: z.enum(aiProviderValues).optional(),
  label: z.string().min(2).max(60).optional(),
  defaultModel: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type AiModelRow = z.infer<typeof aiModelRowSchema>;
export type AiGenerateBody = z.infer<typeof aiGenerateSchema>;
/** آنچه سرویس مصرف می‌کند: گزینه‌ی «async» فقط مسیر صف را انتخاب می‌کند و به سرویس نمی‌رسد */
export type AiGenerateInput = Omit<AiGenerateBody, "async">;
export type AiSettingsInput = z.infer<typeof aiSettingsSchema>;
