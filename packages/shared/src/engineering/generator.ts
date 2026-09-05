/** انتخاب ژنراتور/دیزل‌ژنراتور اضطراری — برآورد اولیه مطابق IEC 60034-1 */

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
  fuelEstimateLPerHour: number;
}

const STANDARD_SIZES_KVA = [
  20, 30, 40, 50, 62.5, 80, 100, 125, 150, 180, 200, 250, 300, 400, 500, 625, 800, 1000,
];

export function sizeGenerator(input: GeneratorInput): GeneratorResult {
  const diversity = clamp(input.diversityFactor ?? 0.8, 0.4, 1);
  const efficiency = clamp(input.efficiency ?? 0.9, 0.7, 1);
  const margin = clamp(input.startingMargin ?? 1.2, 1, 2);
  const cosPhi = clamp(input.powerFactor ?? 0.8, 0.5, 1);

  const demandKw = input.connectedLoadKw * diversity;
  const apparentKva = demandKw / (cosPhi * efficiency);
  const recommendedKva = apparentKva * margin;
  const chosen =
    STANDARD_SIZES_KVA.find((size) => size >= recommendedKva) ??
    STANDARD_SIZES_KVA[STANDARD_SIZES_KVA.length - 1]!;

  return {
    demandKw: round(demandKw, 2),
    apparentKva: round(apparentKva, 2),
    recommendedKva: round(recommendedKva, 2),
    recommendedSizeLabel: `${chosen} kVA`,
    // مصرف ویژه‌ی تقریبی گازوئیل ۰.۲۷ لیتر بر kWh
    fuelEstimateLPerHour: round(chosen * cosPhi * 0.27, 1),
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
function round(v: number, d: number): number {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}
