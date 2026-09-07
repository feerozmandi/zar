/**
 * محاسبه‌ی مقاومت الکترود زمین (ارتینگ) — مبنای مبحث ۱۳، نشریه‌ی ۱۱۰،
 * IEEE Std 80 (پست‌ها) و IEC 62305 (صاعقه).
 *
 * مقاومت یک میله‌ی (راد) قائم:
 *   R = (ρ / (2π·L)) · [ ln(8·L/d) − 1 ]
 * که ρ مقاومت ویژه‌ی خاک (Ω·m)، L طول میله (m) و d قطر (m) است.
 * برای چند میله‌ی موازیِ هم‌فاصله از ضریب کاهش (efficiency) استفاده می‌شود.
 */

import { refs, SOIL_RESISTIVITY, type StandardNote } from "./standards.js";
import { round, clamp } from "./_common.js";

/** ضریب کاهش مقاومت R_N/R_1 برای N میله به‌فاصله‌ی ~۲ طول میله (جدول متعارف) */
const PARALLEL_FACTOR: Record<number, number> = {
  1: 1,
  2: 0.58,
  3: 0.42,
  4: 0.33,
  6: 0.23,
  8: 0.18,
  10: 0.15,
};

export interface EarthingInput {
  /** مقاومت ویژه‌ی خاک (Ω·m) یا شناسه‌ی نوع خاک */
  soil: { rhoOhmM?: number; soilId?: string };
  /** طول میله‌ی قائم (m) — پیش‌فرض ۲.۵ */
  rodLengthM?: number;
  /** قطر میله (m) — پیش‌فرض ۰.۰۱۶ (۱۶mm) */
  rodDiameterM?: number;
  /** تعداد میله‌های موازی */
  rodCount?: number;
  /** مقاومت هدف (Ω) — پیش‌فرض ۱۰ */
  targetOhm?: number;
}

export interface EarthingResult {
  rhoOhmM: number;
  soilLabelFa: string | null;
  singleRodOhm: number;
  totalOhm: number;
  rodCount: number;
  targetOhm: number;
  withinTarget: boolean;
  /** توصیه‌ی کاهش مقاومت اگر از هدف بالاتر رفت */
  adviceFa: string | null;
  /** پیوست استانداردها — انتهای محاسبه */
  standards: StandardNote[];
}

export function earthElectrodeResistance(input: EarthingInput): EarthingResult {
  const soilRow = SOIL_RESISTIVITY.find((s) => s.soilId === input.soil.soilId) ?? null;
  const rho = input.soil.rhoOhmM ?? soilRow?.rhoOhmM ?? 100;
  const L = input.rodLengthM ?? 2.5;
  const d = Math.max(input.rodDiameterM ?? 0.016, 0.001);
  const n = clamp(Math.round(input.rodCount ?? 1), 1, 24);
  const target = input.targetOhm ?? 10;

  const singleOhm = (rho / (2 * Math.PI * L)) * (Math.log((8 * L) / d) - 1);
  const factor = PARALLEL_FACTOR[Math.min(n, 10)] ?? 0.15;
  const totalOhm = singleOhm * factor;

  const withinTarget = totalOhm <= target;
  const advice = withinTarget
    ? null
    : "مقاومت زمین از هدف فراتر است: تعداد میله را افزایش دهید، از میله‌های بلندتر/پهن‌تر استفاده کنید، یا با نمک/زغال محیط الکترود را بهبود داده و مقاومت را با میگر اندازه بگیرید.";

  return {
    rhoOhmM: rho,
    soilLabelFa: soilRow?.labelFa ?? null,
    singleRodOhm: round(singleOhm, 2),
    totalOhm: round(totalOhm, 2),
    rodCount: n,
    targetOhm: target,
    withinTarget,
    adviceFa: advice,
    standards: refs(["M13", "IEEE80", "IEC62305", "PUB110"]),
  };
}
