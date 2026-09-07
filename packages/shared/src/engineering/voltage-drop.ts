/**
 * محاسبه‌ی افت ولتاژ مطابق IEC 60364-5-52 و نشریه‌ی ۱۱۰ سازمان برنامه و بودجه.
 * واحدها: ولت (V)، آمپر (A)، متر (m)، میلی‌متر مربع (mm²).
 *
 * فرمول (برای مدار رفت‌وبرگشت):
 *   تک‌فاز/دوخطی : ΔV = 2 · I · L · (R·cosφ + X·sinφ)
 *   سه‌فاز       : ΔV = √3 · I · L · (R·cosφ + X·sinφ)
 * با R = L/(σ·A) و X = x₀·L/1000 (راکتانس بر حسب Ω/km).
 */

import { refs, type StandardNote } from "./standards.js";
import { clamp, round } from "./_common.js";

export type SystemKind = "single" | "three";

export interface VoltageDropInput {
  system: SystemKind;
  /** ولتاژ نامی بین‌فاز (V) — نمونه: 230 تک‌فاز، 400 سه‌فاز */
  voltage: number;
  /** جریان مدار (A) */
  current: number;
  /** طول مسیر (m) */
  length: number;
  /** مقطع هادی (mm²). اگر داده نشود، خروجی به‌ازای مقطع ۱mm² داده می‌شود */
  crossSectionMm2?: number;
  /** رسانایی ویژه‌ی هادی (m/Ω·mm²) — مس ۵۶، آلومینیوم ۳۴.۵ */
  conductivity?: number;
  /** راکتانس خط (Ω/km) — پیش‌فرض کابل‌های مسلح ۰.۰۸ */
  reactancePerKm?: number;
  /** کسینوس فی بار */
  powerFactor?: number;
  /** اگر true باشد آستانه‌ی روشنایی (۳٪)؛ وگرنه آستانه‌ی عمومی (۴٪) اعمال می‌شود */
  lightingCircuit?: boolean;
}

export interface VoltageDropResult {
  resistanceOhm: number;
  reactanceOhm: number;
  /** افت ولتاژ به‌ازای مقطع انتخابی (V) */
  dropVolt: number;
  dropPercent: number;
  /** آستانه‌ی مجاز (٪) */
  limitPercent: number;
  withinLimit: boolean;
  /** هادی انتخابی (خروجی برای یکپارچگی با سایزینگ کابل) */
  usedConductivity: number;
  /** پیوست استانداردهای معتبر (ایرانی و بین‌المللی) — انتهای محاسبه */
  standards: StandardNote[];
}

export const CONDUCTIVITY = { copper: 56, aluminium: 34.5 } as const;
export const VD_LIMIT_PERCENT = { lighting: 3, general: 4 } as const;

export function calculateVoltageDrop(input: VoltageDropInput): VoltageDropResult {
  const k = input.system === "three" ? Math.sqrt(3) : 2;
  const sigma = input.conductivity ?? CONDUCTIVITY.copper;
  const x0 = input.reactancePerKm ?? 0.08;
  const cosPhi = clamp(input.powerFactor ?? 0.85, 0.1, 1);
  const sinPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi));
  const limit = input.lightingCircuit ? VD_LIMIT_PERCENT.lighting : VD_LIMIT_PERCENT.general;
  const section = input.crossSectionMm2 ?? 1;

  const resistance = (k * input.length) / (sigma * section); // Ω کل مسیر رفت‌وبرگشت
  const reactance = (k * x0 * input.length) / 1000; // Ω

  const dropVolt = input.current * (resistance * cosPhi + reactance * sinPhi);
  const dropPercent = (dropVolt / input.voltage) * 100;

  return {
    resistanceOhm: round(resistance, 5),
    reactanceOhm: round(reactance, 5),
    dropVolt: round(dropVolt, 2),
    dropPercent: round(dropPercent, 2),
    limitPercent: limit,
    withinLimit: dropPercent <= limit,
    usedConductivity: sigma,
    standards: refs(["IEC60364", "IEC60364_4_41", "PUB110", ...(input.lightingCircuit ? ["M13"] : [])]),
  };
}
