/** ثابیت‌های سراسری پلتفرم — مطابق نوت ۳ (ساختار API و نقش‌ها) */

export const API_PREFIX = "/api/v1" as const;

/** نقش‌های دسترسی (RBAC) — با enum در Prisma یک‌سان است */
export const ROLES = {
  user: "USER",
  proEngineer: "PRO_ENGINEER",
  epcPartner: "EPC_PARTNER",
  superAdmin: "SUPER_ADMIN",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

/** صف‌های BullMQ — هر پردازش سنگین باید از صف عبور کند */
export const QUEUES = {
  billOcr: "bill.ocr",
  billAnalyze: "bill.analyze",
  solarAssess: "solar.assess",
  pdfExport: "pdf.export",
  wikiIndex: "wiki.index",
  aiRequest: "ai.request",
} as const;
export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

/** سطح دسترسی به درگاه هوش مصنوعی (نوت ۳: System Level و Pro BYOK) */
export const AI_TIERS = { system: "SYSTEM", byok: "BYOK" } as const;
export type AiTier = (typeof AI_TIERS)[keyof typeof AI_TIERS];

/** مدل‌های پایه‌ای که دروازه‌ی چندمدلی در فاز اول پشتیبانی می‌کند */
export const DEFAULT_AI_MODELS = ["gpt-4o", "claude-3-5-sonnet", "llama-3.3-70b"] as const;
export type DefaultAiModel = (typeof DEFAULT_AI_MODELS)[number];

/** ماژول‌های دارای کیف‌پول مستقل */
export const BILLABLE_MODULES = ["audit", "solar", "engineering", "wiki", "ai"] as const;
export type BillableModule = (typeof BILLABLE_MODULES)[number];

/** سقف حجم آپلود قبض (مگابایت) */
export const MAX_UPLOAD_MB = 10;
