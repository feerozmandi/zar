/**
 * مدل هزینه‌ی احداث و بهره‌برداری (CAPEX / OPEX) — بازار ایران، سال ۱۴۰۴.
 *
 * ⚠️ این اعداد «نقطه‌ی شروعِ قابل ویرایش» هستند نه قیمتِ قطعی:
 *   - مبنا: بازه‌های متداولِ احداث نیروگاه خورشیدیِ پشت‌بامی و زمینی در ایران
 *     (تومان به ازای هر کیلوواتِ نصبی، شامل تجهیزات، نصب و راه‌اندازی).
 *   - در production از جدول `SolarCostBenchmark` پایگاه‌داده خوانده می‌شوند تا با
 *     نوسانِ ارز و قیمت تجهیزات هماهنگ بمانند (همان سیاستِ `TariffRate`).
 *   - خروجیِ این ماژول در هر گزارش همراه با فهرستِ مفروضات برمی‌گردد تا کاربر
 *     بداند چه عددی مبنای محاسبه بوده است.
 */

import type { PvModule } from "./system.js";

export interface CapexBand {
  /** حد پایینِ ظرفیت (kWp) */
  minKwp: number;
  /** حد بالا (null = بدون سقف) */
  maxKwp: number | null;
  /** هزینه‌ی کلید‌در‌دست به ازای هر kWp (تومان) */
  capexPerKwpToman: number;
  /** توضیح بازه */
  note: string;
}

export const CAPEX_BANDS: readonly CapexBand[] = [
  {
    minKwp: 0,
    maxKwp: 10,
    capexPerKwpToman: 34_000_000,
    note: "خانگی و بسیار کوچک — صرفه‌جوییِ مقیاس ندارد",
  },
  { minKwp: 10, maxKwp: 50, capexPerKwpToman: 29_000_000, note: "تجاری کوچک" },
  { minKwp: 50, maxKwp: 200, capexPerKwpToman: 26_000_000, note: "تجاری و صنعتی متوسط" },
  { minKwp: 200, maxKwp: 500, capexPerKwpToman: 23_000_000, note: "صنعتی بزرگ" },
  { minKwp: 500, maxKwp: 1_000, capexPerKwpToman: 20_500_000, note: "نیروگاهِ مقیاسِ متوسط" },
  { minKwp: 1_000, maxKwp: null, capexPerKwpToman: 18_000_000, note: "مقیاسِ بزرگ (مزارع خورشیدی)" },
];

/** سهم هر بخش از سرمایه‌گذاری (جمع = ۱) */
export const CAPEX_BREAKDOWN: ReadonlyArray<{ key: string; label: string; share: number }> = [
  { key: "modules", label: "پنل خورشیدی", share: 0.44 },
  { key: "inverter", label: "اینورتر و تابلوها", share: 0.12 },
  { key: "structure", label: "سازه و نصب مکانیکی", share: 0.11 },
  { key: "dc", label: "کابل و حفاظت DC", share: 0.07 },
  { key: "ac", label: "تابلو AC و ترانس", share: 0.05 },
  { key: "installation", label: "اجرا و نصب", share: 0.09 },
  { key: "engineering", label: "مهندسی، نقشه و مجوز", share: 0.05 },
  { key: "grid", label: "اتصال به شبکه و کنتور", share: 0.04 },
  { key: "contingency", label: "پیش‌بینی‌نشده", share: 0.03 },
];

/** ضریبِ اصلاحِ فناوری نسبت به مبنای (mono-PERC) */
const TECHNOLOGY_FACTOR: Record<PvModule["technology"], number> = {
  "mono-perc": 1,
  topcon: 1.07,
  hjt: 1.16,
  poly: 0.86,
};

export interface CostInput {
  /** ظرفیت نصبی (kWp) */
  capacityKwp: number;
  module?: PvModule;
  /** قیمتِ سفارشی به ازای هر kWp (تومان) — اولویت دارد */
  capexPerKwpToman?: number;
  /** هزینه‌ی بهره‌برداری سالانه (تومان) — اولویت دارد */
  annualOpexToman?: number;
  /** سال تعویض اینورتر (پیش‌فرض ۱۱) */
  inverterReplacementYear?: number;
}

export interface CostEstimate {
  capexTotalToman: number;
  capexPerKwpToman: number;
  breakdown: Array<{ key: string; label: string; amountToman: number; share: number }>;
  annualOpexToman: number;
  /** هزینه‌ی بهره‌برداری به ازای هر kWp در سال (تومان) */
  opexPerKwpToman: number;
  insuranceToman: number;
  inverterReplacementYear: number;
  inverterReplacementCostToman: number;
  /** مفروضاتی که در گزارش باید اعلام شوند */
  assumptions: string[];
}

const OPEX_SHARE_OF_CAPEX = 0.012; // ۱٫۲٪ در سال
const OPEX_MIN_PER_KWP = 90_000; // تومان در سال
const INSURANCE_SHARE = 0.0025; // ۰٫۲۵٪ سرمایه در سال
const INVERTER_REPLACEMENT_SHARE = 0.1; // ۱۰٪ سرمایه در سال یازدهم

export function capexBandFor(capacityKwp: number): CapexBand {
  const band = CAPEX_BANDS.find(
    (b) => capacityKwp >= b.minKwp && (b.maxKwp === null || capacityKwp < b.maxKwp),
  );
  return band ?? CAPEX_BANDS[CAPEX_BANDS.length - 1]!;
}

export function estimateCost(input: CostInput): CostEstimate {
  const capacity = Math.max(0.1, input.capacityKwp);
  const band = capexBandFor(capacity);
  const technologyFactor = input.module ? TECHNOLOGY_FACTOR[input.module.technology] : 1;
  const capexPerKwp = input.capexPerKwpToman ?? Math.round(band.capexPerKwpToman * technologyFactor);
  const capexTotal = Math.round(capacity * capexPerKwp);

  const breakdown = CAPEX_BREAKDOWN.map((item) => ({
    key: item.key,
    label: item.label,
    share: item.share,
    amountToman: Math.round(capexTotal * item.share),
  }));

  const opexPerKwp = Math.max(OPEX_MIN_PER_KWP, Math.round(capexPerKwp * OPEX_SHARE_OF_CAPEX));
  const annualOpex = input.annualOpexToman ?? Math.round(opexPerKwp * capacity);
  const insurance = Math.round(capexTotal * INSURANCE_SHARE);
  const replacementYear = input.inverterReplacementYear ?? 11;

  const assumptions = [
    `هزینه‌ی احداث ${Math.round(capexPerKwp).toLocaleString("fa-IR")} تومان به ازای هر کیلووات (بازه‌ی «${band.note}»)`,
    input.module
      ? `ضریب فناوری ${input.module.technology}: ${technologyFactor.toFixed(2)}×`
      : "فناوری: مبنای mono-PERC",
    `هزینه‌ی بهره‌برداری ${opexPerKwp.toLocaleString("fa-IR")} تومان/kWp در سال (نظافت، پایش، تعمیرات)`,
    `بیمه ${(INSURANCE_SHARE * 100).toFixed(2)}٪ سرمایه در سال`,
    `تعویض اینورتر در سال ${replacementYear} معادل ${Math.round(INVERTER_REPLACEMENT_SHARE * 100)}٪ سرمایه`,
  ];

  return {
    capexTotalToman: capexTotal,
    capexPerKwpToman: Math.round(capexPerKwp),
    breakdown,
    annualOpexToman: annualOpex,
    opexPerKwpToman: opexPerKwp,
    insuranceToman: insurance,
    inverterReplacementYear: replacementYear,
    inverterReplacementCostToman: Math.round(capexTotal * INVERTER_REPLACEMENT_SHARE),
    assumptions,
  };
}
