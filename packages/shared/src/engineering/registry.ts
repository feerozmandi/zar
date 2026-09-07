/**
 * فهرست (رجیستری) ابزارهای جعبه‌ابزار مهندسی برق.
 * هر ابزار دارای یک slug یکتا، دسته، عنوان فارسی، توضیح و کدهای استاندارد مرجع است.
 * این فهرست «تک‌منبع» برای فرانت‌اند (نمایش ابزارها)، API (validation) و مستندات است.
 */

import type { StandardNote } from "./standards.js";

export type EngineeringCategory =
  | "feeder" // مدار، تغذیه و کابل
  | "network" // شبکه و تجهیزات فشار متوسط/قوی
  | "protection" // حفاظت و اتصال کوتاه
  | "powerQuality" // کیفیت توان و اصلاح ضریب قدرت
  | "generation" // تولید و منابع پشتیبان
  | "earthing" // ارت و صاعقه
  | "lighting" // روشنایی و تأسیسات
  | "reference"; // ابزارهای مرجع

export interface EngineeringToolMeta {
  slug: string;
  category: EngineeringCategory;
  titleFa: string;
  titleEn: string;
  /** توضیح کوتاه برای نمایش */
  summaryFa: string;
  /** کدهای استاندارد مرجع (پیوست) */
  standards: StandardNote[];
  /** وضعیت پیاده‌سازی کامل */
  ready: boolean;
}

export const ENGINEERING_TOOLS: EngineeringToolMeta[] = [
  {
    slug: "voltage-drop",
    category: "feeder",
    titleFa: "افت ولتاژ",
    titleEn: "Voltage Drop",
    summaryFa: "محاسبه‌ی افت ولتاژ مدار تک‌فاز/سه‌فاز بر پایه‌ی طول، جریان و مقطع.",
    standards: [],
    ready: true,
  },
  {
    slug: "cable-sizing",
    category: "feeder",
    titleFa: "سایزینگ کابل",
    titleEn: "Cable Sizing",
    summaryFa: "انتخاب مقطع استاندارد با رعایت حد جریان و حد افت ولتاژ.",
    standards: [],
    ready: true,
  },
  {
    slug: "capacitor-bank",
    category: "powerQuality",
    titleFa: "بانک خازنی / اصلاح ضریب قدرت",
    titleEn: "Capacitor Bank",
    summaryFa: "محاسبه‌ی ظرفیت خازن و پله‌بندی برای رسیدن به ضریب قدرت هدف.",
    standards: [],
    ready: true,
  },
  {
    slug: "generator-size",
    category: "generation",
    titleFa: "انتخاب دیزل‌ژنراتور",
    titleEn: "Generator Sizing",
    summaryFa: "برآورد ظرفیت دیزل‌ژنراتور اضطراری با ضریب هم‌زمانی و حاشیه‌ی راه‌اندازی.",
    standards: [],
    ready: true,
  },
  {
    slug: "demand",
    category: "feeder",
    titleFa: "محاسبه‌ی بار و دیماند",
    titleEn: "Demand & Load Calculation",
    summaryFa: "برآورد حداکثر تقاضای هم‌زمان از بارهای متصل با ضرایب تقاضا.",
    standards: [],
    ready: true,
  },
  {
    slug: "short-circuit",
    category: "protection",
    titleFa: "جریان اتصال کوتاه",
    titleEn: "Short-Circuit Current",
    summaryFa: "محاسبه‌ی I″k و پیک و تعیین قدرت قطع لازم (IEC 60909).",
    standards: [],
    ready: true,
  },
  {
    slug: "transformer",
    category: "network",
    titleFa: "انتخاب ترانسفورماتور",
    titleEn: "Transformer Sizing",
    summaryFa: "انتخاب ظرفیت ترانسفورماتور توزیع از سری استاندارد و برآورد جریان/اتصال کوتاه.",
    standards: [],
    ready: true,
  },
  {
    slug: "switchgear",
    category: "network",
    titleFa: "انتخاب کلید (بریکر)",
    titleEn: "Switchgear / Breaker",
    summaryFa: "انتخاب جریان نامی و قدرت قطع کلید بر پایه‌ی ولتاژ، بار و سطح اتصال کوتاه.",
    standards: [],
    ready: true,
  },
  {
    slug: "busbar",
    category: "network",
    titleFa: "سایزینگ شینه (باس‌بار)",
    titleEn: "Busbar Sizing",
    summaryFa: "تعیین سطح مقطع شینه‌ی مسی/آلومینیومی بر پایه‌ی جریان بار.",
    standards: [],
    ready: true,
  },
  {
    slug: "voltage-class",
    category: "reference",
    titleFa: "طبقه‌بندی ولتاژ و رنج تجهیز",
    titleEn: "Voltage Class & Equipment Ratings",
    summaryFa: "رنج نامی تجهیز (Um و BIL) برای سطوح ولتاژ سیستم (IEC 60038).",
    standards: [],
    ready: true,
  },
  {
    slug: "earthing",
    category: "earthing",
    titleFa: "مقاومت الکترود زمین",
    titleEn: "Earth Electrode Resistance",
    summaryFa: "محاسبه‌ی مقاومت میله‌ی ارت با توجه به نوع خاک (IEEE 80 / مبحث ۱۳).",
    standards: [],
    ready: true,
  },
  {
    slug: "lighting",
    category: "lighting",
    titleFa: "روشنایی داخلی",
    titleEn: "Interior Lighting",
    summaryFa: "محاسبه‌ی تعداد چراغ با روش لومن (مبحث ۱۳ / CIE).",
    standards: [],
    ready: true,
  },
];

export const ENGINEERING_CATEGORY_LABEL: Record<EngineeringCategory, string> = {
  feeder: "مدار، تغذیه و کابل",
  network: "شبکه و تجهیزات",
  protection: "حفاظت و اتصال کوتاه",
  powerQuality: "کیفیت توان",
  generation: "تولید و منابع پشتیبان",
  earthing: "ارت و صاعقه",
  lighting: "روشنایی و تأسیسات",
  reference: "ابزارهای مرجع",
};
