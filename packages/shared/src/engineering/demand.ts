/**
 * محاسبه‌ی بار و دیماند (برآورد حداکثر تقاضای هم‌زمان) — مبنای انتخاب
 * ترانسفورماتور، ژنراتور و انشعاب. مطابق جدول ضرایب تقاضای مبحث ۱۳ و IEEE Std 141.
 */

import { refs, type StandardNote } from "./standards.js";
import { round, clamp, sum } from "./_common.js";

/** دسته‌بندی بار و ضریب تقاضای متعارف آن (نسبت به بار هم‌بند) */
export const DEMAND_FACTOR_BY_CATEGORY: Record<string, { labelFa: string; typicalDf: number }> = {
  lighting: { labelFa: "روشنایی", typicalDf: 1 },
  socket: { labelFa: "پریز و مصارف پراکنده", typicalDf: 0.4 },
  motor: { labelFa: "موتور و بار موتوری", typicalDf: 0.75 },
  hvac: { labelFa: "سرمایش/گرمایش", typicalDf: 0.9 },
  elevator: { labelFa: "آسانسور", typicalDf: 0.5 },
  computer: { labelFa: "IT و سرور", typicalDf: 0.9 },
  equipment: { labelFa: "تجهیزات صنعتی", typicalDf: 0.7 },
};

export type DemandCategory = keyof typeof DEMAND_FACTOR_BY_CATEGORY;

export interface DemandLoadItem {
  label: string;
  /** توان نامی متصل (kW) */
  kw: number;
  category?: DemandCategory;
  /** ضریب تقاضای اختصاصی (در صورت عدم ارائه، از دسته‌بندی استفاده می‌شود) */
  demandFactor?: number;
}

export interface DemandInput {
  loads: DemandLoadItem[];
  /** ضریب هم‌زمانی بین گروه‌ها (۰.۶ تا ۱) — پیش‌فرض ۰.۸ */
  diversityFactor?: number;
  /** ولتاژ نامی انشعاب برای برآورد جریان (V) — پیش‌فرض 400 */
  voltage?: number;
}

export interface DemandResult {
  totalConnectedKw: number;
  /** مجموع دیماند هر بار (بدون اعمال هم‌زمانی بین‌گروهی) */
  sumDemandKw: number;
  /** دیماند هم‌زمان نهایی (kW) */
  coincidentDemandKw: number;
  /** ضریب تقاضای کلی (نسبت دیماند هم‌زمان به بار متصل) */
  demandFactor: number;
  /** جریان معادل سه‌فاز دیماند در ولتاژ داده‌شده (A) */
  demandCurrentA: number;
  /** جزئیات هر بار */
  items: Array<{ label: string; kw: number; demandFactor: number; demandKw: number }>;
  /** پیوست استانداردها — انتهای محاسبه */
  standards: StandardNote[];
}

export function calculateDemand(input: DemandInput): DemandResult {
  const diversity = clamp(input.diversityFactor ?? 0.8, 0.6, 1);
  const voltage = input.voltage ?? 400;

  const items = input.loads.map((load) => {
    const df = load.demandFactor ?? DEMAND_FACTOR_BY_CATEGORY[load.category ?? "equipment"]?.typicalDf ?? 0.7;
    const demandKw = load.kw * df;
    return {
      label: load.label,
      kw: load.kw,
      demandFactor: round(df, 3),
      demandKw: round(demandKw, 2),
    };
  });

  const totalConnectedKw = sum(items.map((i) => i.kw));
  const sumDemandKw = sum(items.map((i) => i.demandKw));
  const coincidentDemandKw = sumDemandKw * diversity;
  const demandFactor = totalConnectedKw > 0 ? coincidentDemandKw / totalConnectedKw : 0;
  const demandCurrentA = (coincidentDemandKw * 1000) / (Math.sqrt(3) * voltage);

  return {
    totalConnectedKw: round(totalConnectedKw, 2),
    sumDemandKw: round(sumDemandKw, 2),
    coincidentDemandKw: round(coincidentDemandKw, 2),
    demandFactor: round(demandFactor, 3),
    demandCurrentA: round(demandCurrentA, 1),
    items,
    standards: refs(["M13", "IEEE141", "PUB110"]),
  };
}
