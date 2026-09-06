/**
 * محاسبه‌ی افت ولتاژ مطابق IEC 60364-5-52 و نشریه ۱۱۰ سازمان برنامه و بودجه.
 * واحد‌ها: ولت (V)، آمپر (A)، متر (m)، میلی‌متر مربع (mm²)، کیلووات (kW)، کیلووار (kVAr)
 */

export type SystemKind = "single" | "three";

export interface VoltageDropInput {
  system: SystemKind;
  /** ولتاژ نامی بین‌فاز (V) — نمونه: 230 تک‌فاز، 400 سه‌فاز */
  voltage: number;
  /** جریان مدار (A) */
  current: number;
  /** طول مسیر (m) */
  length: number;
  /** رسانایی ویژه‌ی هادی (m/Ω·mm²) — مس ۵۶، آلومینیوم ۳۴.۵ */
  conductivity?: number;
  /** راکتانس خط (Ω/km) — پیش‌فرض کابل‌های مسلح ۰.۰۸ */
  reactancePerKm?: number;
  /** کسینوس فی بار */
  powerFactor?: number;
}

export interface VoltageDropResult {
  resistanceOhm: number;
  reactanceOhm: number;
  dropVolt: number;
  dropPercent: number;
  /** آستانه‌ی مجاز نشریه ۱۱۰ برای مدارهای تغذیه‌ای روشنایی/معمولی */
  limitPercent: number;
  withinLimit: boolean;
}

export const CONDUCTIVITY = { copper: 56, aluminium: 34.5 } as const;
export const VD_LIMIT_PERCENT = { lighting: 3, general: 4 } as const;

export function calculateVoltageDrop(input: VoltageDropInput): VoltageDropResult {
  const k = input.system === "three" ? Math.sqrt(3) : 2;
  const sigma = input.conductivity ?? CONDUCTIVITY.copper;
  const x0 = input.reactancePerKm ?? 0.08;
  const cosPhi = clamp(input.powerFactor ?? 0.85, 0.1, 1);
  const sinPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi));

  const resistance = (k * input.length) / (sigma * 1); // Ω برای مسیر رفت و برگشت (هر mm²)
  const reactance = (k * x0 * input.length) / 1000;

  // ΔV = I · (R·cosφ + X·sinφ) — محاسبه برای مقطع ۱mm²؛ مقطع نهایی در sizeCable انتخاب می‌شود
  const dropPerMm2 = input.current * (resistance * cosPhi + reactance * sinPhi);
  return {
    resistanceOhm: round(resistance, 5),
    reactanceOhm: round(reactance, 5),
    dropVolt: round(dropPerMm2, 2),
    dropPercent: round((dropPerMm2 / input.voltage) * 100, 2),
    limitPercent: VD_LIMIT_PERCENT.general,
    withinLimit: (dropPerMm2 / input.voltage) * 100 <= VD_LIMIT_PERCENT.general,
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
function round(v: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}
