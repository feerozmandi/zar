/**
 * برآورد فنی-مالی نیروگاه خورشیدی پشت‌بامی.
 * اعداد پیش‌فرض «نمونه‌ی بومی‌سازی‌شده» هستند و در فاز ۳ از جدول نرخ‌های
 * دیتابیس (TariffRate) خوانده می‌شوند تا نیازی به تغییر کد نباشد.
 */

export interface SolarAssessmentInput {
  /** ظرفیت پیشنهادی (kWp) */
  capacityKwp: number;
  /** تابش روزانه‌ی معادل (peak sun hours) — از جدول اقلیمی منطقه */
  peakSunHours: number;
  /** بازده کلی سیستم (افت اینورتر، دما، غبار و …) */
  performanceRatio?: number;
  /** ضریب کاهش سالانه‌ی تولید */
  degradationPerYear?: number;
  /** درصد اشتغال مورد انتظار شبکه */
  availability?: number;
}

export interface SolarRoiInput extends SolarAssessmentInput {
  /** هزینه‌ی احداث به ازای هر kWp (تومان) */
  capexPerKwp: number;
  /** نرخ خرید تضمینی (تومان/kWh) — ماده ۱۲ */
  feedInTariff: number;
  /** نرخ جایگزینی مصرف (تومان/kWh) — ماده ۱۶ / بورس سبز */
  offsetTariff: number;
  /** نسبت انرژی مصرفی که در محل مصرف جایگزین می‌شود */
  selfConsumptionShare?: number;
  /** هزینه‌های بهره‌برداری سالانه (تومان) */
  annualOpex: number;
  /** دوره‌ی تحلیل (سال) */
  years?: number;
  /** نرخ تنزیل */
  discountRate?: number;
}

export interface SolarRoiResult {
  annualGenerationKwh: number;
  capex: number;
  annualRevenue: number;
  annualNet: number;
  simplePaybackYears: number;
  npv: number;
  irrLowerBound: number;
  lifetimeGenerationKwh: number;
  co2AvoidedTons: number;
}

const DEFAULTS = {
  performanceRatio: 0.78,
  degradationPerYear: 0.006,
  availability: 0.97,
  selfConsumptionShare: 0.4,
  years: 20,
  discountRate: 0.23,
  /** ضریب انتشار کربن شبکه (kg CO2/kWh) */
  gridEmissionFactor: 0.466,
} as const;

export function estimateGeneration(input: SolarAssessmentInput): number {
  const pr = input.performanceRatio ?? DEFAULTS.performanceRatio;
  const availability = input.availability ?? DEFAULTS.availability;
  return input.capacityKwp * input.peakSunHours * 365 * pr * availability;
}

export function calculateSolarRoi(input: SolarRoiInput): SolarRoiResult {
  const pr = input.performanceRatio ?? DEFAULTS.performanceRatio;
  const degradation = input.degradationPerYear ?? DEFAULTS.degradationPerYear;
  const selfShare = input.selfConsumptionShare ?? DEFAULTS.selfConsumptionShare;
  const years = input.years ?? DEFAULTS.years;
  const discount = input.discountRate ?? DEFAULTS.discountRate;

  const firstYear = estimateGeneration({ ...input, performanceRatio: pr });
  const blendedTariff = input.feedInTariff * (1 - selfShare) + input.offsetTariff * selfShare;
  const capex = input.capacityKwp * input.capexPerKwp;

  let npv = -capex;
  let lifetimeGenerationKwh = 0;
  const annualRevenue = firstYear * blendedTariff;

  for (let year = 1; year <= years; year += 1) {
    const generation = firstYear * (1 - degradation) ** (year - 1);
    lifetimeGenerationKwh += generation;
    const net = generation * blendedTariff - input.annualOpex;
    npv += net / (1 + discount) ** year;
  }

  const annualNet = annualRevenue - input.annualOpex;
  return {
    annualGenerationKwh: Math.round(firstYear),
    capex: Math.round(capex),
    annualRevenue: Math.round(annualRevenue),
    annualNet: Math.round(annualNet),
    simplePaybackYears: annualNet > 0 ? round(capex / annualNet, 1) : Number.POSITIVE_INFINITY,
    npv: Math.round(npv),
    irrLowerBound: discount,
    lifetimeGenerationKwh: Math.round(lifetimeGenerationKwh),
    co2AvoidedTons: round((lifetimeGenerationKwh * DEFAULTS.gridEmissionFactor) / 1000, 1),
  };
}

function round(v: number, d: number): number {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}
