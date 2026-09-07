/**
 * شبیه‌ساز تولید انرژی — از تابشِ سطحِ شیب‌دار تا کیلووات‌ساعتِ تحویلی به کنتور.
 *
 * گام‌های مدل:
 *  ۱. انتقال تابش افقی به سطح شیب‌دار (HDKR) برای هر ماه.
 *  ۲. ساختِ پروفایلِ ساعتیِ «روز نماینده» با مقیاس‌کردنِ آسمانِ صاف روی مقدار ماهانه.
 *  ۳. افتِ توانِ دمایی در هر گام، محدودیتِ توانِ اینورتر (قیچی‌شدن / Clipping) و
 *     منحنیِ بازده اینورتر.
 *  ۴. اِعمالِ تلفاتِ ثابت (غبار، ناهم‌خوانی، کابل‌کشی، در دسترس‌بودن) و کاهشِ سایه.
 *  ۵. تطبیقِ تولید با پروفایلِ بار برای تفکیکِ «خودمصرفی / صادرات / خرید از شبکه».
 */

import {
  clearSkyGhiInstant,
  cosineIncidenceAngle,
  cosineZenith,
  MONTH_DAYS,
  representativeDayOfYear,
  solarDeclinationDeg,
  transpositionFactorHdkr,
} from "./sun.js";
import { cellTemperatureC, type InverterSpec, type LossItem, type PvModule } from "./system.js";
import type { SolarResource } from "./climate.js";

/** تابشِ روزانه‌ی ماهانه روی سطح شیب‌دار (kWh/m²·day) */
export function monthlyPoa(
  resource: SolarResource,
  latDeg: number,
  tiltDeg: number,
  surfaceAzimuthDeg: number,
  albedo = 0.2,
): number[] {
  return resource.monthlyGhiKwhM2Day.map((ghi, index) => {
    const factor = transpositionFactorHdkr({
      latDeg,
      tiltDeg,
      surfaceAzimuthDeg,
      dayOfYear: representativeDayOfYear(index),
      albedo,
    });
    return Math.round(ghi * factor * 100) / 100;
  });
}

/**
 * بازده اینورتر به‌عنوان تابعی از بار — جدولِ مصنوعیِ هم‌راستا با منحنی‌های متداول
 * سازندگان (افتِ شدید در بارهای زیر ۱۰٪). مقادیر نسبت به بازده‌ی بیشینه است.
 */
const EFFICIENCY_CURVE: ReadonlyArray<[load: number, relative: number]> = [
  [0.02, 0.86],
  [0.05, 0.93],
  [0.1, 0.958],
  [0.2, 0.978],
  [0.3, 0.988],
  [0.5, 0.997],
  [1, 1],
];

export function inverterEfficiency(loadFraction: number, inverter: InverterSpec): number {
  if (loadFraction <= 0.01) return 0;
  const load = Math.min(1, Math.max(0.01, loadFraction));
  for (let i = 1; i < EFFICIENCY_CURVE.length; i += 1) {
    const previous = EFFICIENCY_CURVE[i - 1]!;
    const current = EFFICIENCY_CURVE[i]!;
    if (load <= current[0]) {
      const span = current[0] - previous[0];
      const ratio = span === 0 ? 1 : (load - previous[0]) / span;
      return inverter.peakEfficiency * (previous[1] + (current[1] - previous[1]) * ratio);
    }
  }
  return inverter.peakEfficiency;
}

export interface ProductionInput {
  latDeg: number;
  tiltDeg: number;
  surfaceAzimuthDeg: number;
  /** تابش ماهانه روی صفحه (kWh/m²·day) */
  monthlyPoaKwhM2Day: readonly number[];
  /** دمای ماهانه (°C) */
  monthlyTempC: readonly number[];
  /** ظرفیت DC نصبی (kWp) */
  capacityKwp: number;
  /** توان نامی AC اینورترها (kW) */
  acKw: number;
  module: PvModule;
  inverter: InverterSpec;
  /** تلفات ثابت (غبار، ناهم‌خوانی، کابل، در دسترس‌بودن …) */
  staticLosses: readonly LossItem[];
  /** کاهشِ سایه‌ی ماهانه (۰ = کاملاً سایه) */
  monthlyAccess?: readonly number[];
  albedo?: number;
}

export interface ProductionResult {
  /** انرژی تحویلیِ ماهانه (kWh AC) */
  monthlyAcKwh: number[];
  /** تولید سالانه‌ی سال اول (kWh AC) */
  annualAcKwh: number;
  /** راندمانِ ویژه (kWh به ازای هر kWp در سال) */
  specificYieldKwhPerKwp: number;
  /** ضریب ظرفیت (۰ تا ۱) */
  capacityFactor: number;
  /** تلفاتِ قیچی‌شدن (کسر از انرژی) */
  clippingLoss: number;
  monthlyClippingLoss: number[];
  /** میانگین دمای سلولِ ماهانه (°C) */
  monthlyCellTempC: number[];
  /** ضریب عملکرد ماهانه (AC / تابشِ ورودی) */
  monthlyPerformanceRatio: number[];
  /** پروفایلِ ساعتیِ نرمال‌شده‌ی هر ماه (جمع = ۱) — برای انطباق با بار */
  monthlyHourlyShape: number[][];
}

/** پروفایلِ ساعتیِ تابشِ آسمانِ صاف روی صفحه (W/m²) برای روز نماینده‌ی ماه */
function clearSkyPoaShape(input: ProductionInput, monthIndex: number): number[] {
  const { latDeg, tiltDeg, surfaceAzimuthDeg } = input;
  const dayOfYear = representativeDayOfYear(monthIndex);
  const declination = solarDeclinationDeg(dayOfYear);
  const step = 0.5;
  const series: number[] = [];
  for (let hour = 0; hour < 24; hour += step) {
    const solarHour = hour + step / 2;
    const hourAngle = 15 * (solarHour - 12);
    const cosZ = cosineZenith(latDeg, declination, hourAngle);
    const cosTheta = cosineIncidenceAngle(latDeg, tiltDeg, surfaceAzimuthDeg, declination, hourAngle);
    series.push(cosZ > 0.001 ? clearSkyGhiInstant(zenithFromCos(cosZ), dayOfYear) * (cosTheta / cosZ) : 0);
  }
  return series;
}

function zenithFromCos(cosZ: number): number {
  return (Math.acos(Math.min(1, Math.max(-1, cosZ))) * 180) / Math.PI;
}

export function simulateProduction(input: ProductionInput): ProductionResult {
  const staticFactor = input.staticLosses.reduce((factor, item) => factor * (1 - item.lossFraction), 1);
  const access = (index: number) => input.monthlyAccess?.[index] ?? 1;

  const monthlyAcKwh: number[] = [];
  const monthlyClippingLoss: number[] = [];
  const monthlyCellTempC: number[] = [];
  const monthlyPerformanceRatio: number[] = [];
  const monthlyHourlyShape: number[][] = [];

  let annualAc = 0;
  let annualUnclipped = 0;

  for (let month = 0; month < 12; month += 1) {
    const days = MONTH_DAYS[month] ?? 30;
    const ambient = input.monthlyTempC[month] ?? 20;
    const targetDaily = input.monthlyPoaKwhM2Day[month] ?? 0;
    const step = 0.5;

    const shape = clearSkyPoaShape(input, month);
    const shapeDailyKwh = shape.reduce((sum, value) => sum + value * step, 0) / 1000;
    const scale = shapeDailyKwh > 0 ? targetDaily / shapeDailyKwh : 0;

    let acDaily = 0;
    let unclippedDaily = 0;
    let tempWeighted = 0;
    let energyWeighted = 0;
    const hourly: number[] = Array.from({ length: 24 }, () => 0);

    shape.forEach((value, index) => {
      const poa = value * scale; // W/m²
      if (poa <= 0) return;
      const cellTemp = cellTemperatureC(poa, ambient, input.module.noctC);
      const thermal = Math.max(0, 1 - input.module.tempCoeffPmax * (cellTemp - 25));
      const dcKw = input.capacityKwp * (poa / 1000) * thermal;

      const load = input.acKw > 0 ? dcKw / input.acKw : 0;
      const efficiency = inverterEfficiency(Math.min(1, load), input.inverter);
      const acKw = Math.min(dcKw, input.acKw) * efficiency;
      const unclippedKw = dcKw * efficiency;

      acDaily += acKw * step;
      unclippedDaily += unclippedKw * step;
      tempWeighted += cellTemp * poa;
      energyWeighted += poa;

      const hourIndex = Math.min(23, Math.floor(index * step));
      hourly[hourIndex] = (hourly[hourIndex] ?? 0) + acKw * step / days;
    });

    const monthlyEnergy = acDaily * days * staticFactor * access(month);
    const poaMonthlyKwh = targetDaily * days;
    monthlyAcKwh.push(Math.round(monthlyEnergy));
    monthlyClippingLoss.push(
      Math.round((unclippedDaily > 0 ? Math.max(0, 1 - acDaily / unclippedDaily) : 0) * 1000) / 1000,
    );
    monthlyCellTempC.push(Math.round((energyWeighted > 0 ? tempWeighted / energyWeighted : ambient) * 10) / 10);
    monthlyPerformanceRatio.push(
      poaMonthlyKwh > 0 && input.capacityKwp > 0
        ? Math.round((monthlyEnergy / (poaMonthlyKwh * input.capacityKwp)) * 1000) / 1000
        : 0,
    );
    const hourlyTotal = hourly.reduce((sum, value) => sum + value, 0);
    monthlyHourlyShape.push(
      hourlyTotal > 0 ? hourly.map((value) => value / hourlyTotal) : hourly.map(() => 1 / 24),
    );

    annualAc += monthlyEnergy;
    annualUnclipped += unclippedDaily * days * staticFactor * access(month);
  }

  const annualAcKwh = Math.round(annualAc);
  const capacityKwp = Math.max(0.001, input.capacityKwp);

  return {
    monthlyAcKwh,
    annualAcKwh,
    specificYieldKwhPerKwp: Math.round(annualAcKwh / capacityKwp),
    capacityFactor: Math.round((annualAcKwh / (capacityKwp * 8760)) * 1000) / 1000,
    clippingLoss: annualUnclipped > 0 ? Math.round((1 - annualAc / annualUnclipped) * 1000) / 1000 : 0,
    monthlyClippingLoss,
    monthlyCellTempC,
    monthlyPerformanceRatio,
    monthlyHourlyShape,
  };
}

// ───────────────────────── انطباق بار و تولید ─────────────────────────

export type LoadProfileKind = "residential" | "commercial" | "industrial" | "agricultural";

/** پروفایل‌های نوعیِ بار (۲۴ ساعت) برای بازار ایران — مقادیر خام */
const RAW_LOAD_PROFILES: Record<LoadProfileKind, readonly number[]> = {
  residential: [
    0.022, 0.02, 0.019, 0.018, 0.019, 0.024, 0.032, 0.04, 0.043, 0.042, 0.041, 0.042,
    0.044, 0.043, 0.042, 0.044, 0.05, 0.058, 0.068, 0.072, 0.066, 0.055, 0.042, 0.03,
  ],
  commercial: [
    0.018, 0.016, 0.015, 0.015, 0.016, 0.02, 0.032, 0.05, 0.066, 0.072, 0.074, 0.075,
    0.07, 0.072, 0.074, 0.073, 0.07, 0.065, 0.055, 0.045, 0.035, 0.028, 0.022, 0.019,
  ],
  industrial: [
    0.035, 0.034, 0.034, 0.034, 0.035, 0.037, 0.042, 0.048, 0.05, 0.05, 0.05, 0.05,
    0.049, 0.05, 0.05, 0.049, 0.048, 0.045, 0.042, 0.04, 0.039, 0.038, 0.037, 0.036,
  ],
  agricultural: [
    0.015, 0.014, 0.014, 0.014, 0.016, 0.03, 0.052, 0.068, 0.075, 0.078, 0.079, 0.08,
    0.078, 0.072, 0.062, 0.055, 0.05, 0.045, 0.035, 0.028, 0.022, 0.019, 0.017, 0.015,
  ],
};

/** نرمال‌سازی تا مجموعِ پروفایل دقیقاً ۱ شود */
function normalizeProfile(values: readonly number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  return total > 0 ? values.map((value) => value / total) : values.map(() => 1 / 24);
}

/** پروفایل‌های بارِ نرمال‌شده (جمع = ۱) — مبنای تطبیقِ ساعتی با تولید */
export const LOAD_PROFILES: Record<LoadProfileKind, readonly number[]> = {
  residential: normalizeProfile(RAW_LOAD_PROFILES.residential),
  commercial: normalizeProfile(RAW_LOAD_PROFILES.commercial),
  industrial: normalizeProfile(RAW_LOAD_PROFILES.industrial),
  agricultural: normalizeProfile(RAW_LOAD_PROFILES.agricultural),
};

export interface SelfConsumptionInput {
  /** مصرف ماهانه (kWh) */
  monthlyLoadKwh: readonly number[];
  /** تولید ماهانه (kWh) */
  monthlyProductionKwh: readonly number[];
  profile: LoadProfileKind;
  /** پروفایلِ ساعتیِ تولیدِ هر ماه (جمع = ۱) — خروجیِ simulateProduction */
  productionShapes?: readonly number[][];
}

export interface SelfConsumptionMonth {
  month: number;
  loadKwh: number;
  productionKwh: number;
  selfConsumedKwh: number;
  exportedKwh: number;
  gridImportKwh: number;
}

export interface SelfConsumptionResult {
  monthly: SelfConsumptionMonth[];
  annualLoadKwh: number;
  annualProductionKwh: number;
  annualSelfConsumedKwh: number;
  annualExportedKwh: number;
  annualGridImportKwh: number;
  /** نسبتِ تولید که در محل مصرف شده (۰ تا ۱) */
  selfConsumptionRate: number;
  /** نسبتِ مصرف که از خورشید تأمین شده (۰ تا ۱) */
  selfSufficiencyRate: number;
  note: string;
}

/**
 * تفکیکِ ماهانه‌ی انرژی با تطبیقِ ساعتیِ بار و تولید.
 *
 * فرضِ ساده‌کننده: انرژی درون یک ماه قابل جابه‌جایی نیست (باتری نداریم) اما در
 * یک «روز نماینده» تطابقِ ساعتی دقیق است؛ بنابراین عددها برای ماه‌های با
 * تولیدِ خیلی بیشتر از مصرف، کمی خوش‌بینانه‌اند. در نسخه‌ی حرفه‌ای باید با
 * پروفایلِ واقعیِ ۸۷۶۰ ساعته جایگزین شود.
 */
export function selfConsumptionSplit(input: SelfConsumptionInput): SelfConsumptionResult {
  const loadShape = LOAD_PROFILES[input.profile];
  const monthly: SelfConsumptionMonth[] = [];
  let loadTotal = 0;
  let productionTotal = 0;
  let selfTotal = 0;
  let exportTotal = 0;
  let importTotal = 0;

  for (let month = 0; month < 12; month += 1) {
    const loadKwh = Math.max(0, input.monthlyLoadKwh[month] ?? 0);
    const productionKwh = Math.max(0, input.monthlyProductionKwh[month] ?? 0);
    const productionShape = input.productionShapes?.[month] ?? Array.from({ length: 24 }, () => 1 / 24);

    let self = 0;
    for (let hour = 0; hour < 24; hour += 1) {
      const loadHour = loadKwh * (loadShape[hour] ?? 0);
      const productionHour = productionKwh * (productionShape[hour] ?? 0);
      self += Math.min(loadHour, productionHour);
    }

    monthly.push({
      month,
      loadKwh: Math.round(loadKwh),
      productionKwh: Math.round(productionKwh),
      selfConsumedKwh: Math.round(self),
      exportedKwh: Math.round(productionKwh - self),
      gridImportKwh: Math.round(loadKwh - self),
    });

    loadTotal += loadKwh;
    productionTotal += productionKwh;
    selfTotal += self;
    exportTotal += productionKwh - self;
    importTotal += loadKwh - self;
  }

  return {
    monthly,
    annualLoadKwh: Math.round(loadTotal),
    annualProductionKwh: Math.round(productionTotal),
    annualSelfConsumedKwh: Math.round(selfTotal),
    annualExportedKwh: Math.round(Math.max(0, exportTotal)),
    annualGridImportKwh: Math.round(Math.max(0, importTotal)),
    selfConsumptionRate: productionTotal > 0 ? Math.round((selfTotal / productionTotal) * 1000) / 1000 : 0,
    selfSufficiencyRate: loadTotal > 0 ? Math.round((selfTotal / loadTotal) * 1000) / 1000 : 0,
    note: "تطبیقِ ساعتی روی روز نماینده‌ی هر ماه (بدون ذخیره‌ساز).",
  };
}
