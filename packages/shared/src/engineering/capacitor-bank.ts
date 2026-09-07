/** بانک خازنی و اصلاح ضریب قدرت — مطابق نشریه ۱۱۰ و ضوابط توانیر */

import { refs, CAPACITOR_STEP_KVAR, type StandardNote } from "./standards.js";
import { round } from "./_common.js";

export interface CapacitorBankInput {
  /** توان اکتیو میان‌باری (kW) */
  activePowerKw: number;
  /** ضریب قدرت فعلی */
  cosPhiBefore: number;
  /** ضریب قدرت هدف (معمولاً ۰.۹۵ تا ۰.۹۸) */
  cosPhiTarget: number;
  /** پله‌های استاندارد خازن (kVAr) */
  stepSizes?: number[];
}

export interface CapacitorBankResult {
  requiredKvar: number;
  selectedSteps: number[];
  selectedKvar: number;
  cosPhiAfter: number;
  /** ضریب قدرت نهایی نسبت به آستانه‌ی جریمه‌ی توانیر (۰٫۹) */
  abovePenaltyThreshold: boolean;
  /** تخمین کاهش جریمه‌ی راکتیو به ازای ماه (به واحد محاسباتی؛ نرخ تعرفه از تنظیمات سرور) */
  reactivePenaltyAvoidedKvarh: number;
  /** مرحله‌های استاندارد موجود (kVAr) — سری مرجع */
  availableStepSizes: number[];
  /** پیوست استانداردهای معتبر — انتهای محاسبه */
  standards: StandardNote[];
}

const TAN = (cosPhi: number) => Math.sqrt(Math.max(1e-6, 1 - cosPhi * cosPhi)) / cosPhi;

export function sizeCapacitorBank(input: CapacitorBankInput): CapacitorBankResult {
  const target = Math.min(Math.max(input.cosPhiTarget, 0.9), 0.99);
  const before = Math.min(Math.max(input.cosPhiBefore, 0.4), target - 1e-6);
  const requiredKvar = input.activePowerKw * (TAN(before) - TAN(target));

  const defaultSteps = input.stepSizes ?? CAPACITOR_STEP_KVAR;
  const steps = [...defaultSteps].sort((a, b) => b - a);
  const selectedSteps: number[] = [];
  let remaining = requiredKvar;
  for (const step of steps) {
    while (remaining >= step - 1e-9 && selectedSteps.length < 12) {
      selectedSteps.push(step);
      remaining -= step;
    }
  }
  const selectedKvar = selectedSteps.reduce((sum, s) => sum + s, 0);
  const newTan = TAN(before) - selectedKvar / Math.max(input.activePowerKw, 1e-6);
  const cosPhiAfter = 1 / Math.sqrt(1 + Math.max(newTan, 0) ** 2);

  return {
    requiredKvar: round(requiredKvar, 2),
    selectedSteps,
    selectedKvar: round(selectedKvar, 2),
    cosPhiAfter: round(cosPhiAfter, 3),
    abovePenaltyThreshold: cosPhiAfter >= 0.9,
    reactivePenaltyAvoidedKvarh: round(Math.max(0, input.activePowerKw * (TAN(before) - TAN(0.95))) * 720, 0),
    availableStepSizes: CAPACITOR_STEP_KVAR,
    standards: refs(["TAVANIR_REACTIVE", "TAVANIR_TARIFF", "IEC60831", "PUB110"]),
  };
}
