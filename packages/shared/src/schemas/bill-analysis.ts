import { z } from "zod";

/**
 * قالب خروجی استخراج متن از PDF قبض.
 * قرارداد سطح بالا بین لایه‌ی PDF ingestion و موتور تحلیل.
 */
export const billTextExtractSchema = z.object({
  /** متن خام استخراج‌شده (همه صفحات با \\n جدا شده) */
  text: z.string(),
  /** تعداد صفحات PDF */
  pageCount: z.number().int().min(1),
  /** یادداشت کوتاه (برای دیباگ) اگر استخراج با هشدار مواجه شد */
  warning: z.string().optional(),
});

export type BillTextExtract = z.infer<typeof billTextExtractSchema>;

/**
 * ورودی آپلود قبض از سمت کلاینت.
 * فایل به‌صورت base64 درخواست می‌شود تا در OpenAPI قابل رسم باشد و
 * در لایه‌ی سرویس به Buffer برگردانده می‌شود.
 */
export const billIngestSchema = z.object({
  userId: z.string().uuid(),
  /** بایت‌های فایل قبض به‌صورت base64 */
  fileBase64: z
    .string()
    .min(1, "فایل باید ارائه شود")
    .startsWith("data:", "پیشوند data URI انتظار می‌رسد (data:application/pdf;base64,...)"),
  /** نام فایل اصلی (برای ذخیره‌ی متادیتا) */
  fileName: z.string().min(1).max(255),
  /** شناسه‌ی subscription اگر درخواست مربوط به مشترک خاص باشد */
  subscriptionId: z.string().uuid().optional(),
  /** ایمیل برای تایید در صورت نیاز به AI review */
  contactEmail: z.string().email().optional(),
});

export type BillIngestInput = z.infer<typeof billIngestSchema>;

/** به‌چیدن data URI به Buffer */
export const BASE64_DATA_URI_RE = /^data:([^;,]*)(?:;[a-zA-Z]+([^,]*))?(?:;(base64))?,/;

/**
 * خروجی تشخیص‌ داده‌شده در قبض (خط‌بِخط + جدول).
 */
export const billLineItemSchema = z.object({
  /** توصیف سطری (Farsi/English) */
  description: z.string(),
  /** واحد اندازه (kWh, kW, ریال, تومان, NER, ...) */
  unit: z.string(),
  /** مقدار عددی Parsed (digits latin) */
  value: z.number(),
  /** مبلغ به تومان (عدد) اگر قابل استخراج باشد */
  amountToman: z.number().optional(),
  /** شماره سطر/صفحه‌ی منشأ */
  sourceLine: z.number().optional(),
  /** میزان اطمینان استخراج */
  confidence: z.number().min(0).max(1).optional(),
});

export type BillLineItem = z.infer<typeof billLineItemSchema>;

/** خروجی تحلیل سطح ۱ (قوانین داخلی) — قبل از ارسال به AI. */
export const billAnalysisResultSchema = z.object({
  /** جمع مبلغ‌ها به تومان (بر اساس آیتم‌های استخراج‌شده) */
  totalAmountToman: z.number(),
  /** مبلغ شامل VAT (برای تشخیص تفاوت با ۱۰%) */
  vatIncludedAmount: z.number().optional(),
  /** درصد VAT تخمین‌زده‌شده */
  estimatedVatPercent: z.number().min(0).max(100).optional(),
  /** آیتم‌های استخراج‌شده (فقط اگر معتبر باشند) */
  lineItems: z.array(billLineItemSchema),
  /** پرچم: آیا حاشیه‌ی هوش مصنوعی برای بررسی نیازمند است */
  needsAiReview: z.boolean(),
  /** دلیل در صورت نیاز به AI (به فارسی) */
  aiReviewReason: z.string().optional(),
  /** یافته‌های داخلی (قوانین داخلی) */
  internalFindings: z.array(
    z.object({
      code: z.string(),
      severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
      titleFa: z.string(),
      descriptionFa: z.string(),
      sourceLine: z.number().optional(),
    }),
  ),
});

export type BillAnalysisResult = z.infer<typeof billAnalysisResultSchema>;

/** کدهای پیش‌فرض یافته‌های داخلی. */
export const BILL_FINDING_CODES = {
  VAT_10_PERCENT_MISMATCH: "VAT_10_PERCENT_MISMATCH",
  AMOUNT_NOT_TERMINAL_HAFEZ: "AMOUNT_NOT_TERMINAL_HAFEZ",
  DEMAND_PENALTY_PRESENT: "DEMAND_PENALTY_PRESENT",
  REACTIVE_PENALTY_PRESENT: "REACTIVE_PENALTY_PRESENT",
  SUSPICIOUS_TOTAL_MATH: "SUSPICIOUS_TOTAL_MATH",
  NO_LINE_ITEMS_FOUND: "NO_LINE_ITEMS_FOUND",
  LOW_OCR_CONFIDENCE: "LOW_OCR_CONFIDENCE",
  AI_REVIEW_REQUESTED: "AI_REVIEW_REQUESTED",
} as const;

export type BillFindingCode = keyof typeof BILL_FINDING_CODES;
