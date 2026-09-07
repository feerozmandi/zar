/**
 * انتخاب ترانسفورماتور توزیع — مطابق IEC 60076 و سطوح ولتاژ شبکه‌ی ایران (۲۰/۰٫۴ کیلوولت).
 * ظرفیت بار (kVA) با ضریب بارگیری متعارف ۸۰٪ به سری ظرفیت‌های استاندارد گرد می‌شود و
 * جریان‌های نامی و تخمین جریان اتصال کوتاه در سمت‌ها برای انتخاب تجهیز حفاظتی داده می‌شود.
 */

import { refs, TRANSFORMER_KVA_SERIES, type StandardNote } from "./standards.js";
import { clamp, round } from "./_common.js";

export interface TransformerInput {
  /** دیماند هم‌زمان بار (kVA یا kW· با ضریب قدرت به kVA تبدیل می‌شود) */
  demandKva: number;
  /** ضریب قدرت برای تبدیل kW به kVA اگر بار به‌صورت kW داده شده باشد (پیش‌فرض ۱) */
  powerFactor?: number;
  /** ولتاژ سمت اولیه (kV) — پیش‌فرض 20 */
  primaryKv?: number;
  /** ولتاژ سمت ثانویه (kV) — پیش‌فرض 0.4 */
  secondaryKv?: number;
  /** حداکثر بارگیری پیوستهٔ متعارف (پیش‌فرض ۰.۸۰ = ۸۰٪) */
  loadingFactor?: number;
}

export interface TransformerResult {
  /** ظرفیت موردنیاز پیش از گردکردن (kVA) */
  requiredKva: number;
  /** ظرفیت نامی انتخابی از سری استاندارد (kVA) */
  selectedKva: number;
  /** بارگیری واقعی ترانسفورماتور انتخابی (٪) */
  actualLoading: number;
  /** جریان نامی سمت اولیه (A) */
  primaryCurrentA: number;
  /** جریان نامی سمت ثانویه (A) */
  secondaryCurrentA: number;
  /** ولتاژ امپدانس اتصال کوتاه Uk٪ برآوردی (IEC 60076) */
  impedancePercent: number;
  /** برآورد جریان اتصال کوتاه سمت ثانویه (kA) — مبنای قدرت قطع */
  secondaryFaultKA: number;
  /** سری ظرفیت‌های استاندارد (kVA) */
  availableSizesKva: number[];
  standards: StandardNote[];
}

/** Uk٪ برآوردی ترانسفورماتور توزیع ۲۰/۰٫۴ kV بر پایه‌ی ظرفیت (سری متعارف IEC 60076) */
function typicalImpedancePercent(kva: number): number {
  if (kva <= 315) return 4;
  if (kva <= 1250) return 5;
  return 6;
}

export function sizeTransformer(input: TransformerInput): TransformerResult {
  const demandKva =
    input.powerFactor && input.powerFactor < 1
      ? input.demandKva / clamp(input.powerFactor, 0.3, 1)
      : input.demandKva;
  const loading = clamp(input.loadingFactor ?? 0.8, 0.4, 0.95);
  const primaryKv = input.primaryKv ?? 20;
  const secondaryKv = input.secondaryKv ?? 0.4;

  const requiredKva = demandKva / loading;
  const selected =
    TRANSFORMER_KVA_SERIES.find((v) => v >= requiredKva) ??
    TRANSFORMER_KVA_SERIES[TRANSFORMER_KVA_SERIES.length - 1]!;

  const primaryCurrentA = selected / (Math.sqrt(3) * primaryKv);
  const secondaryCurrentA = selected / (Math.sqrt(3) * secondaryKv);
  const ukPercent = typicalImpedancePercent(selected);
  // Isc ≈ I_n / (Uk%/100)  — جریان اتصال کوتاه سمت ثانویه (با چشم‌پوشی از امپدانس شبکه)
  const secondaryFaultKA = secondaryCurrentA / (ukPercent / 100) / 1000;

  return {
    requiredKva: round(requiredKva, 1),
    selectedKva: selected,
    actualLoading: round((demandKva / selected) * 100, 1),
    primaryCurrentA: round(primaryCurrentA, 1),
    secondaryCurrentA: round(secondaryCurrentA, 1),
    impedancePercent: ukPercent,
    secondaryFaultKA: round(secondaryFaultKA, 2),
    availableSizesKva: TRANSFORMER_KVA_SERIES,
    standards: refs(["IEC60076", "IEC60038", "TAVANIR_NET", "PUB110"]),
  };
}
