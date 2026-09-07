/** انتخاب ژنراتور/دیزل‌ژنراتور اضطراری — برآورد اولیه مطابق IEC 60034-1 */

import { refs, GENERATOR_KVA_SERIES, type StandardNote } from "./standards.js";
import { clamp, round } from "./_common.js";

export interface GeneratorInput {
  /** مجموع توان نامی بارها (kW) */
  connectedLoadKw: number;
  /** ضریب هم‌زمانی بارها (۰.۶ تا ۱) */
  diversityFactor?: number;
  /** بازده (۰.۹ تا ۰.۹۵) */
  efficiency?: number;
  /** حاشیه‌ی ایمنی برای بارهای راه‌اندازی سنگین */
  startingMargin?: number;
  powerFactor?: number;
}

export interface GeneratorResult {
  demandKw: number;
  apparentKva: number;
  /** ظرفیت پیشنهادی با احتساب حاشیه (kVA) */
  recommendedKva: number;
  recommendedSizeLabel: string;
  /** درصد بارگیری ژنراتور منتخب نسبت به ظرفیت نامی */
  loadFactor: number;
  fuelEstimateLPerHour: number;
  /** سری ظرفیت‌های استاندارد موجود (kVA) */
  availableSizesKva: number[];
  /** پیوست استانداردهای معتبر — انتهای محاسبه */
  standards: StandardNote[];
}

export function sizeGenerator(input: GeneratorInput): GeneratorResult {
  const diversity = clamp(input.diversityFactor ?? 0.8, 0.4, 1);
  const efficiency = clamp(input.efficiency ?? 0.9, 0.7, 1);
  const margin = clamp(input.startingMargin ?? 1.2, 1, 2);
  const cosPhi = clamp(input.powerFactor ?? 0.8, 0.5, 1);

  const demandKw = input.connectedLoadKw * diversity;
  const apparentKva = demandKw / (cosPhi * efficiency);
  const recommendedKva = apparentKva * margin;
  const chosen =
    GENERATOR_KVA_SERIES.find((size) => size >= recommendedKva) ??
    GENERATOR_KVA_SERIES[GENERATOR_KVA_SERIES.length - 1]!;

  return {
    demandKw: round(demandKw, 2),
    apparentKva: round(apparentKva, 2),
    recommendedKva: round(recommendedKva, 2),
    recommendedSizeLabel: `${chosen} kVA`,
    loadFactor: round(apparentKva / chosen, 3),
    // مصرف ویژه‌ی تقریبی گازوئیل ۰.۲۷ لیتر بر kWh
    fuelEstimateLPerHour: round(chosen * cosPhi * 0.27, 1),
    availableSizesKva: GENERATOR_KVA_SERIES,
    standards: refs(["IEC60034", "M13", "PUB110"]),
  };
}
