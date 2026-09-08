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

/** POST /ai/compare — مقایسه‌ی یک پرامپت روی چند مدل (AI Arena — نوت ۵ گام چهارم) */
export const aiCompareSchema = z.object({
  prompt: z.string().min(4).max(20_000),
  /** حداکثر ۳ مدل هم‌زمان تا فشار روی دروازه کنترل شود */
  models: z.array(z.string().min(1)).min(1).max(3),
  system: z.string().max(4000).optional(),
  maxTokens: z.number().int().min(64).max(32_000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  useOwnKey: z.boolean().default(false),
});

/** نتیجه‌ی هم‌زمان POST /ai/generate */
export const aiGenerateResultSchema = z.object({
  model: z.string(),
  tier: z.enum(["SYSTEM", "BYOK"]),
  content: z.string(),
  usage: z.object({ promptTokens: z.number(), completionTokens: z.number() }),
});

/** نتیجه‌ی یک مدل در مقایسه‌ی AI Arena */
export const aiCompareEntrySchema = z.object({
  model: z.string(),
  ok: z.boolean(),
  content: z.string().optional(),
  errorMessage: z.string().optional(),
  latencyMs: z.number().int().nonnegative(),
  usage: z.object({ promptTokens: z.number(), completionTokens: z.number() }).optional(),
});

export const aiCompareResultSchema = z.object({
  tier: z.enum(["SYSTEM", "BYOK"]),
  results: z.array(aiCompareEntrySchema),
});

/** وضعیت کارهای صفی — با enum JobStatus دیتابیس یکی است */
export const aiJobStatusValues = ["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "CANCELLED"] as const;

/** GET /ai/jobs/:id — وضعیت و نتیجه‌ی یک کار ناهم‌زمان */
export const aiJobSchema = z.object({
  id: z.string(),
  purpose: z.string(),
  status: z.enum(aiJobStatusValues),
  tier: z.enum(["SYSTEM", "BYOK"]),
  provider: z.enum(aiProviderValues).nullable().optional(),
  model: z.string().nullable().optional(),
  resultText: z.string().nullable().optional(),
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  latencyMs: z.number().int().nonnegative(),
  errorMessage: z.string().nullable().optional(),
  createdAt: z.string(),
  finishedAt: z.string().nullable().optional(),
});

export const aiJobListSchema = z.object({
  items: z.array(aiJobSchema),
  meta: z.object({ page: z.number(), pageSize: z.number(), total: z.number() }),
});

/** پاسخ ثبت کار در صف */
export const aiJobEnqueuedSchema = z.object({
  jobId: z.string(),
  status: z.literal("QUEUED"),
});

/** GET /ai/usage — مصرف روزانه‌ی لایه‌ی SYSTEM کاربر (سهمیه‌بندی نوت ۵ §۱) */
export const aiUsageSchema = z.object({
  tier: z.literal("SYSTEM"),
  /** تعداد فراخوان‌های امروز (به وقت UTC) */
  used: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  remaining: z.number().int().nonnegative(),
  /** پایان پنجره‌ی روزانه — شروع روز بعد UTC */
  resetAt: z.string(),
});

/** POST /admin/ai-models — ایجاد/ویرایش مدل کاتالوگ توسط ادمین */
export const aiModelUpsertSchema = z.object({
  slug: z.string().regex(/^[a-z0-9.-]{2,80}$/u, "اسلاگ فقط حروف کوچک، عدد، نقطه و خط تیره"),
  provider: z.enum(aiProviderValues),
  displayName: z.string().min(2).max(120),
  supportsVision: z.boolean().default(false),
  inputPrice: z.number().min(0).default(0),
  outputPrice: z.number().min(0).default(0),
  maxTokens: z.number().int().min(256).max(2_000_000).default(8192),
  freeTierOnly: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

/** PATCH /admin/ai-models/:slug — تغییر جزئی (مثلاً فعال/غیرفعال) */
export const aiModelPatchSchema = aiModelUpsertSchema.partial().omit({ slug: true });

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
export type AiCompareInput = z.infer<typeof aiCompareSchema>;
export type AiGenerateResult = z.infer<typeof aiGenerateResultSchema>;
export type AiCompareEntry = z.infer<typeof aiCompareEntrySchema>;
export type AiCompareResult = z.infer<typeof aiCompareResultSchema>;
export type AiJobStatus = (typeof aiJobStatusValues)[number];
export type AiJobRow = z.infer<typeof aiJobSchema>;
export type AiJobEnqueued = z.infer<typeof aiJobEnqueuedSchema>;
export type AiUsage = z.infer<typeof aiUsageSchema>;
export type AiModelUpsertInput = z.infer<typeof aiModelUpsertSchema>;
export type AiModelPatchInput = z.infer<typeof aiModelPatchSchema>;

/** بارِ داده‌ی کار wiki.ask که در صف AI پردازش می‌شود (نوت ۳ §۴ — ask-ai) */
export interface WikiAskJobPayload {
  question: string;
  articleIds: string[];
  model?: string;
  temperature?: number;
}
