/** بانک خازنی و اصلاح ضریب قدرت — مطابق نشریه ۱۱۰ و ضوابط توانیر */

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
  /** تخمین کاهش جریمه‌ی راکتیو به ازای ماه (به واحد محاسباتی؛ نرخ تعرفه از تنظیمات سرور) */
  reactivePenaltyAvoidedKvarh: number;
}

const TAN = (cosPhi: number) => Math.sqrt(Math.max(1e-6, 1 - cosPhi * cosPhi)) / cosPhi;

export function sizeCapacitorBank(input: CapacitorBankInput): CapacitorBankResult {
  const target = Math.min(Math.max(input.cosPhiTarget, 0.9), 0.99);
  const before = Math.min(Math.max(input.cosPhiBefore, 0.4), target - 1e-6);
  const requiredKvar = input.activePowerKw * (TAN(before) - TAN(target));

  const steps = (input.stepSizes ?? [6, 12, 16, 20, 25, 30, 40, 50]).sort((a, b) => b - a);
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
    reactivePenaltyAvoidedKvarh: round(Math.max(0, input.activePowerKw * (TAN(before) - TAN(0.95))) * 720, 0),
  };
}

function round(v: number, d: number): number {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}
