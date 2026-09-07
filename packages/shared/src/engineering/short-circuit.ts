/**
 * محاسبه‌ی جریان اتصال کوتاه سه‌فاز متقارن مطابق IEC 60909.
 *
 * روش: سطح اتصال کوتاه اولیه در نقطه‌ی خطا از جریان اتصال کوتاه تحویلی از بالادست
 * (تأمین‌کننده/شبکه) محاسبه شده و سپس جریان‌های مشخصه (I″k، پیک ip و ...) و حداقل
 * قدرت قطع استاندارد کلیدِ لازم برای نقطه‌ی موردنظر برحسب سطح ولتاژ تعیین می‌شود.
 * این خروجی مبنای انتخاب تجهیزات حفاظتی (کلید قدرت/بریکر) شبکه است.
 */

import { refs, LV_BREAKER_ICU_KA, MV_BREAKER_RATINGS_KA, type StandardNote } from "./standards.js";
import { round } from "./_common.js";

export interface ShortCircuitInput {
  /** سطح ولتاژ: فشار ضعیف / متوسط / قوی */
  voltageLevel: "lv" | "mv" | "hv";
  /** ولتاژ نامی سیستم (kV) — نمونه 0.4 ، 20 ، 63 */
  nominalVoltageKv: number;
  /** جریان اتصال کوتاه متقارن اولیه در نقطه‌ی خطا (kA، rms) */
  iKKA: number;
  /** نسبت R/X در نقطه‌ی خطا (برای ضریب پیک κ). اگر داده نشود مقدار متعارف هر سطح به‌کار می‌رود */
  rxRatio?: number;
}

export interface ShortCircuitResult {
  /** سطح اتصال کوتاه سه‌فاز (MVA) */
  faultMva: number;
  /** جریان متقارن اولیه I″k (kA) */
  iKKA: number;
  /** جریان پیک ip = κ·√2·I″k (kA) — مبنای تنش مکانیکی/حرارتی */
  peakKA: number;
  /** ضریب پیک κ به‌کاررفته */
  kappa: number;
  /** ولتاژ متوسط اصلاحی c·Un (IEC 60909: c≈1.05 شبکه‌ی انتقال / 1.10 LV) */
  voltageFactorC: number;
  /** حداقل جریان نامی قطع استاندارد موردنیاز (kA) */
  requiredBreakingKA: number;
  /** آیا قدرت قطع استاندارد کافی انتخاب می‌شود؟ */
  withinBreakingCapacity: boolean;
  /** سری رنج‌های استاندارد قدرت قطع برای این سطح (kA) */
  availableBreakingKA: number[];
  /** پیوست استانداردها — انتهای محاسبه */
  standards: StandardNote[];
}

export function calculateShortCircuit(input: ShortCircuitInput): ShortCircuitResult {
  const un = Math.max(input.nominalVoltageKv, 0.05);
  // ضریب ولتاژ c (بیشینه) مطابق جدول ۱ IEC 60909 — مقدار متعارف طراحی
  const voltageFactorC = un <= 1 ? 1.05 : 1.1;
  const ik = Math.max(input.iKKA, 0.0001);

  const faultMva = Math.sqrt(3) * un * ik;

  // ضریب پیک κ مطابق IEC 60909: κ = 1.02 + 0.98·exp(−3·R/X)
  const rx = input.rxRatio ?? (input.voltageLevel === "lv" ? 0.25 : input.voltageLevel === "mv" ? 0.1 : 0.05);
  const kappa = 1.02 + 0.98 * Math.exp(-3 * rx);
  const peakKA = kappa * Math.SQRT2 * ik;

  const requiredBreakingKA = input.voltageLevel === "lv" ? ik : ik;
  const available = input.voltageLevel === "lv" ? LV_BREAKER_ICU_KA : MV_BREAKER_RATINGS_KA;
  const chosen = available.find((v) => v >= requiredBreakingKA);
  const within = Boolean(chosen);
  const requiredMin = chosen ?? available[available.length - 1]!;

  return {
    faultMva: round(faultMva, 2),
    iKKA: round(ik, 2),
    peakKA: round(peakKA, 2),
    kappa: round(kappa, 3),
    voltageFactorC,
    requiredBreakingKA: requiredMin,
    withinBreakingCapacity: within,
    availableBreakingKA: available,
    standards: refs(["IEC60909", "IEC62271", "IEC60947", "TAVANIR_NET"]),
  };
}
