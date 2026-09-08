/**
 * انتخاب کلید قدرت/اتوماتیک (بریکر) بر پایه‌ی ولتاژ سیستم، جریان بار و سطح اتصال کوتاه.
 * • فشار ضعیف (تا ۱۰۰۰ ولت)  → IEC 60947-2 (Icu/Ics) و آیین‌نامه‌ی داخلی.
 * • ولتاژ متوسط و بالا    → IEC 62271-1/-100 (قدرت قطع نامی) + ضوابط توانیر.
 * برای شبکه‌های ۲۰ کیلوولت ایران، کلیدهای پست معمولاً قدرت قطع ۲۵/۳۱٫۵ کیلوآمپر دارند.
 */

import { refs, LV_BREAKER_ICU_KA, MV_BREAKER_RATINGS_KA, type StandardNote } from "./standards.js";
import { clamp, round } from "./_common.js";

export interface SwitchgearInput {
  voltageLevel: "lv" | "mv" | "hv";
  /** ولتاژ نامی سیستم (kV) */
  nominalVoltageKv: number;
  /** جریان بار نامی مداری که باید قطع شود (A) */
  loadCurrentA: number;
  /** جریان اتصال کوتاه متقارن نقطه (kA) که کلید باید قطع کند */
  faultLevelKA: number;
}

/** سری جریان نامی استاندارد بدنه‌ی کلیدها (A) — IEC 60947 / 62271 */
export const BREAKER_RATED_CURRENT_A = [
  63, 100, 160, 250, 400, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000,
];

export interface SwitchgearResult {
  /** جریان نامی کلید انتخابی (A) */
  ratedCurrentA: number;
  /** قدرت قطع نامی کلید (kA) */
  breakingCapacityKA: number;
  requiredRatedCurrentA: number;
  requiredBreakingKA: number;
  withinCapacity: boolean;
  /** حاشیه‌ی انتخاب روی جریان (مثلاً ۱.۲۵ برابر جریان بار متعارف) */
  currentMargin: number;
  /** رنج‌های استاندارد مربوط به این سطح */
  availableRatedCurrentA: number[];
  standards: StandardNote[];
}

export function selectSwitchgear(input: SwitchgearInput): SwitchgearResult {
  // حاشیه‌ی متعارف ۱.۲۵ روی جریان بار (پوشش خطا/هارمونیک و ...)
  const currentMargin = 1.25;
  const requiredRated = input.loadCurrentA * currentMargin;
  const ratedCurrentA =
    BREAKER_RATED_CURRENT_A.find((v) => v >= requiredRated) ??
    BREAKER_RATED_CURRENT_A[BREAKER_RATED_CURRENT_A.length - 1]!;

  const fault = clamp(input.faultLevelKA, 0.001, 1000);
  const capacitySeries = input.voltageLevel === "lv" ? LV_BREAKER_ICU_KA : MV_BREAKER_RATINGS_KA;
  const breaking = capacitySeries.find((v) => v >= fault) ?? capacitySeries[capacitySeries.length - 1]!;

  return {
    ratedCurrentA,
    breakingCapacityKA: breaking,
    requiredRatedCurrentA: round(requiredRated, 1),
    requiredBreakingKA: round(fault, 2),
    withinCapacity: breaking >= fault,
    currentMargin,
    availableRatedCurrentA: BREAKER_RATED_CURRENT_A,
    standards: refs(
      input.voltageLevel === "lv"
        ? ["IEC60947", "IEC60364_4_41", "TAVANIR_NET"]
        : ["IEC62271", "IEC60909", "TAVANIR_NET"],
    ),
  };
}
