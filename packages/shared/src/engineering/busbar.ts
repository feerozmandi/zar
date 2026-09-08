/**
 * سایزینگ شینه‌ی (باس‌بار) مسی/آلومینیومی تابلوی توزیع بر پایه‌ی جریان بار و
 * تراکم جریان مجاز متعارف در هوا. جدول دقیق نهایی باید از کاتالوگ سازنده و آزمون‌های
 * IEC 61439 (تابلوهای فشار ضعیف) / IEC 62271-200 (تابلوهای فشار متوسط) برداشته شود.
 *
 * روش: مساحت مقطع لازم A = I / J که J تراکم جریان مجاز متعارف (A/mm²) است؛ سپس نزدیک‌ترین
 * سطح مقطع استاندارد شینه انتخاب و بر پایه‌ی آن ابعاد بارگذارده می‌شود.
 */

import { refs, type StandardNote } from "./standards.js";
import { round } from "./_common.js";

export interface BusbarInput {
  /** جریان بار نامی شینه (A) */
  currentA: number;
  /** جنس شینه */
  material?: "copper" | "aluminium";
  /** درجه‌ی حرارت محیط (پیش‌فرض ۴۰ درجه) */
  ambientTempC?: number;
}

/** ابعاد استاندارد شینه (mm × mm) و سطح مقطع آن‌ها */
export const STANDARD_BUSBAR_MM2 = [120, 160, 200, 300, 400, 500, 600, 800, 1000] as const;

export interface BusbarResult {
  /** سطح مقطع لازم (mm²) */
  requiredCrossSectionMm2: number;
  /** سطح مقطع استاندارد انتخابی (mm²) */
  selectedCrossSectionMm2: number;
  /** تراکم جریان مجاز به‌کاررفته (A/mm²) */
  currentDensity: number;
  /** ظرفیت جریان شینه‌ی انتخابی (A) */
  selectedRatingA: number;
  /** کافی بودن ظرفیت */
  sufficient: boolean;
  /** کاندیداهای استاندارد (mm²) با ظرفیت تقریبی */
  candidates: Array<{ crossSectionMm2: number; ratingA: number; feasible: boolean }>;
  standards: StandardNote[];
}

export function sizeBusbar(input: BusbarInput): BusbarResult {
  const material = input.material ?? "copper";
  const baseDensity = material === "copper" ? 1.8 : 1.2; // A/mm² در هوای آزاد
  const tempCorr = Math.max(0.8, 1 - Math.max(0, (input.ambientTempC ?? 40) - 40) * 0.005);
  const currentDensity = baseDensity * tempCorr;

  const requiredMm2 = input.currentA / currentDensity;
  const selected =
    STANDARD_BUSBAR_MM2.find((v) => v >= requiredMm2) ?? STANDARD_BUSBAR_MM2[STANDARD_BUSBAR_MM2.length - 1]!;

  const candidates = STANDARD_BUSBAR_MM2.map((mm2) => {
    const ratingA = mm2 * currentDensity;
    return {
      crossSectionMm2: mm2,
      ratingA: Math.round(ratingA),
      feasible: ratingA >= input.currentA,
    };
  });

  return {
    requiredCrossSectionMm2: round(requiredMm2, 1),
    selectedCrossSectionMm2: selected,
    currentDensity: round(currentDensity, 3),
    selectedRatingA: Math.round(selected * currentDensity),
    sufficient: selected * currentDensity >= input.currentA,
    candidates,
    standards: refs(material === "copper" ? ["PUB110", "TAVANIR_NET"] : ["IEC62271", "PUB110"]),
  };
}
