/**
 * طراحی سیستم فتوولتائیک — انتخاب تجهیزات، آرایش رشته‌ها و تراز تلفات (Loss Balance).
 *
 * خروجی این ماژول «ضریب عملکرد» (Performance Ratio) است که در کنار تابشِ سطحِ
 * شیب‌دار (POA) تولید واقعی را می‌دهد. هر تلفات به‌صورت یک قلمِ نام‌گذاری‌شده
 * برمی‌گردد تا در گزارش امکان‌سنجی به‌صورت نمودار آبشاری نمایش داده شود.
 */

export interface PvModule {
  /** مدل/کلید */
  model: string;
  technology: "mono-perc" | "topcon" | "hjt" | "poly";
  /** توان نامی STC (W) */
  wattPmp: number;
  /** طول در راستای شیب در حالت عمودی (متر) */
  lengthM: number;
  /** عرض (متر) */
  widthM: number;
  /** بازده ماژول (۰ تا ۱) */
  efficiency: number;
  /** ضریب دمایی توان (%/°C به‌صورت عدد مثبت) */
  tempCoeffPmax: number;
  /** ضریب دمایی ولتاژ مدار باز (%/°C به‌صورت عدد مثبت) */
  tempCoeffVoc: number;
  /** دمای عملیاتیِ اسمی سلول (°C) */
  noctC: number;
  vocV: number;
  vmpV: number;
  iscA: number;
  impA: number;
  /** بیشینه‌ی ولتاژ سیستم (V) */
  maxSystemVoltageV: number;
  /** افت سال اول (LID) */
  firstYearDegradation: number;
  /** افت سالانه‌ی بعدی */
  annualDegradation: number;
  /** تضمین عملکرد محصول (سال) */
  performanceWarrantyYears: number;
  /** رده‌ی تولیدکننده (Tier-1 … Tier-3) */
  tier: 1 | 2 | 3;
}

import { dayLengthHours, representativeDayOfYear } from "./sun.js";

export const MODULE_CATALOG: readonly PvModule[] = [
  {
    model: "mono-perc-550",
    technology: "mono-perc",
    wattPmp: 550,
    lengthM: 2.279,
    widthM: 1.134,
    efficiency: 0.213,
    tempCoeffPmax: 0.0035,
    tempCoeffVoc: 0.0027,
    noctC: 45,
    vocV: 49.9,
    vmpV: 42.0,
    iscA: 14.0,
    impA: 13.1,
    maxSystemVoltageV: 1500,
    firstYearDegradation: 0.02,
    annualDegradation: 0.0055,
    performanceWarrantyYears: 25,
    tier: 1,
  },
  {
    model: "topcon-600",
    technology: "topcon",
    wattPmp: 600,
    lengthM: 2.382,
    widthM: 1.134,
    efficiency: 0.222,
    tempCoeffPmax: 0.003,
    tempCoeffVoc: 0.0025,
    noctC: 43,
    vocV: 52.6,
    vmpV: 44.2,
    iscA: 14.5,
    impA: 13.6,
    maxSystemVoltageV: 1500,
    firstYearDegradation: 0.01,
    annualDegradation: 0.004,
    performanceWarrantyYears: 30,
    tier: 1,
  },
  {
    model: "hjt-480",
    technology: "hjt",
    wattPmp: 480,
    lengthM: 1.9,
    widthM: 1.05,
    efficiency: 0.24,
    tempCoeffPmax: 0.0024,
    tempCoeffVoc: 0.0022,
    noctC: 42,
    vocV: 45.4,
    vmpV: 38.1,
    iscA: 13.4,
    impA: 12.6,
    maxSystemVoltageV: 1500,
    firstYearDegradation: 0.01,
    annualDegradation: 0.003,
    performanceWarrantyYears: 30,
    tier: 1,
  },
  {
    model: "poly-450",
    technology: "poly",
    wattPmp: 450,
    lengthM: 2.094,
    widthM: 1.038,
    efficiency: 0.207,
    tempCoeffPmax: 0.0041,
    tempCoeffVoc: 0.0032,
    noctC: 46,
    vocV: 49.2,
    vmpV: 40.6,
    iscA: 11.7,
    impA: 11.1,
    maxSystemVoltageV: 1000,
    firstYearDegradation: 0.025,
    annualDegradation: 0.007,
    performanceWarrantyYears: 20,
    tier: 2,
  },
];

export interface InverterSpec {
  model: string;
  /** توان خروجی نامی AC (kW) */
  acPowerKw: number;
  /** بیشینه‌ی ولتاژ ورودی DC (V) */
  maxDcVoltageV: number;
  /** بازه‌ی MPPT (V) */
  mpptMinV: number;
  mpptMaxV: number;
  /** بیشینه‌ی توان DC مجاز (kW) */
  maxDcKw: number;
  mpptCount: number;
  /** بازده بیشینه (۰ تا ۱) */
  peakEfficiency: number;
  /** بازده وزنی (Euro) (۰ تا ۱) */
  euroEfficiency: number;
  phases: 1 | 3;
  warrantyYears: number;
  tier: 1 | 2 | 3;
}

export const INVERTER_CATALOG: readonly InverterSpec[] = [
  {
    model: "string-10kw-3ph",
    acPowerKw: 10,
    maxDcVoltageV: 1100,
    mpptMinV: 200,
    mpptMaxV: 1000,
    maxDcKw: 15,
    mpptCount: 2,
    peakEfficiency: 0.984,
    euroEfficiency: 0.976,
    phases: 3,
    warrantyYears: 10,
    tier: 1,
  },
  {
    model: "string-20kw-3ph",
    acPowerKw: 20,
    maxDcVoltageV: 1100,
    mpptMinV: 200,
    mpptMaxV: 1000,
    maxDcKw: 30,
    mpptCount: 2,
    peakEfficiency: 0.986,
    euroEfficiency: 0.98,
    phases: 3,
    warrantyYears: 10,
    tier: 1,
  },
  {
    model: "string-25kw-3ph",
    acPowerKw: 25,
    maxDcVoltageV: 1100,
    mpptMinV: 200,
    mpptMaxV: 1000,
    maxDcKw: 37,
    mpptCount: 3,
    peakEfficiency: 0.986,
    euroEfficiency: 0.98,
    phases: 3,
    warrantyYears: 10,
    tier: 1,
  },
  {
    model: "string-33kw-3ph",
    acPowerKw: 33,
    maxDcVoltageV: 1100,
    mpptMinV: 250,
    mpptMaxV: 1000,
    maxDcKw: 49,
    mpptCount: 3,
    peakEfficiency: 0.987,
    euroEfficiency: 0.981,
    phases: 3,
    warrantyYears: 10,
    tier: 1,
  },
  {
    model: "string-40kw-3ph",
    acPowerKw: 40,
    maxDcVoltageV: 1100,
    mpptMinV: 250,
    mpptMaxV: 1000,
    maxDcKw: 60,
    mpptCount: 4,
    peakEfficiency: 0.987,
    euroEfficiency: 0.981,
    phases: 3,
    warrantyYears: 10,
    tier: 1,
  },
  {
    model: "string-50kw-3ph",
    acPowerKw: 50,
    maxDcVoltageV: 1100,
    mpptMinV: 250,
    mpptMaxV: 1000,
    maxDcKw: 75,
    mpptCount: 4,
    peakEfficiency: 0.988,
    euroEfficiency: 0.982,
    phases: 3,
    warrantyYears: 10,
    tier: 1,
  },
  {
    model: "string-100kw-3ph",
    acPowerKw: 100,
    maxDcVoltageV: 1100,
    mpptMinV: 250,
    mpptMaxV: 1000,
    maxDcKw: 150,
    mpptCount: 6,
    peakEfficiency: 0.99,
    euroEfficiency: 0.984,
    phases: 3,
    warrantyYears: 10,
    tier: 1,
  },
  {
    model: "string-125kw-3ph",
    acPowerKw: 125,
    maxDcVoltageV: 1100,
    mpptMinV: 280,
    mpptMaxV: 1000,
    maxDcKw: 187,
    mpptCount: 8,
    peakEfficiency: 0.99,
    euroEfficiency: 0.985,
    phases: 3,
    warrantyYears: 10,
    tier: 1,
  },
  {
    model: "central-500kw-3ph",
    acPowerKw: 500,
    maxDcVoltageV: 1500,
    mpptMinV: 600,
    mpptMaxV: 1500,
    maxDcKw: 750,
    mpptCount: 1,
    peakEfficiency: 0.991,
    euroEfficiency: 0.985,
    phases: 3,
    warrantyYears: 5,
    tier: 1,
  },
  {
    model: "central-1000kw-3ph",
    acPowerKw: 1000,
    maxDcVoltageV: 1500,
    mpptMinV: 600,
    mpptMaxV: 1500,
    maxDcKw: 1500,
    mpptCount: 1,
    peakEfficiency: 0.99,
    euroEfficiency: 0.984,
    phases: 3,
    warrantyYears: 5,
    tier: 1,
  },
  {
    model: "hybrid-5kw-1ph",
    acPowerKw: 5,
    maxDcVoltageV: 600,
    mpptMinV: 120,
    mpptMaxV: 550,
    maxDcKw: 7.5,
    mpptCount: 2,
    peakEfficiency: 0.978,
    euroEfficiency: 0.968,
    phases: 1,
    warrantyYears: 5,
    tier: 2,
  },
];

export function findModule(model: string): PvModule {
  return MODULE_CATALOG.find((m) => m.model === model) ?? MODULE_CATALOG[0]!;
}

/** انتخاب اینورتر: تعدادِ کمینه از بزرگ‌ترین مدل مناسب با نسبت DC/AC هدف */
export function selectInverter(
  dcKwp: number,
  options: { targetDcAcRatio?: number; phases?: 1 | 3 } = {},
): { spec: InverterSpec; count: number; dcAcRatio: number; acKw: number } {
  const target = options.targetDcAcRatio ?? 1.2;
  const phases = options.phases ?? (dcKwp <= 6 ? 1 : 3);
  const candidates = INVERTER_CATALOG.filter((inv) => inv.phases === phases);
  const pool = candidates.length > 0 ? candidates : INVERTER_CATALOG;

  let best = pool[0]!;
  let bestCount = 1;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const spec of pool) {
    const ideal = dcKwp / (spec.acPowerKw * target);
    // هر دو تعدادِ گرد‌شده به بالا و پایین بررسی می‌شود: فقط گرد‌کردنِ ساده ممکن است
    // نسبتِ DC/AC را از بازه‌ی بهینه خارج کند (مثلاً ۳۰ کیلووات روی یک اینورتر ۲۰ کیلوواتی).
    for (const count of new Set([Math.max(1, Math.floor(ideal)), Math.max(1, Math.ceil(ideal))])) {
      const ratio = dcKwp / (spec.acPowerKw * count);
      // جریمه: انحراف از نسبت هدف، عبور از توان مجاز DC، و تعداد زیادِ دستگاه
      const score = Math.abs(ratio - target) + (ratio > spec.maxDcKw / spec.acPowerKw ? 5 : 0) + count * 0.01;
      if (score < bestScore) {
        bestScore = score;
        best = spec;
        bestCount = count;
      }
    }
  }

  const acKw = best.acPowerKw * bestCount;
  return {
    spec: best,
    count: bestCount,
    acKw,
    dcAcRatio: Math.round((dcKwp / acKw) * 100) / 100,
  };
}

export interface StringConfig {
  modulesPerString: number;
  stringCount: number;
  unusedModules: number;
  /** ولتاژ مدارِ باز در سردترین حالت (V) */
  vocMinTempV: number;
  /** ولتاژ نقطه‌ی توان بیشینه در گرم‌ترین حالت (V) */
  vmpMaxTempV: number;
  /** آیا رشته در بازه‌ی MPPT می‌ماند؟ */
  withinMppt: boolean;
  warnings: string[];
}

/**
 * آرایش رشته‌ها با قیدِ ولتاژ: در سردترین روز نباید از ولتاژ مجاز بگذرد و
 * در گرم‌ترین روز باید بالای آستانه‌ی MPPT بماند (IEC 62548 / IEC 62109).
 */
export function configureStrings(options: {
  module: PvModule;
  inverter: InverterSpec;
  panelCount: number;
  /** کمینه‌ی دمای محیط (°C) */
  minAmbientC: number;
  /** بیشینه‌ی دمای سلول (°C) */
  maxCellC: number;
}): StringConfig {
  const { module, inverter, panelCount } = options;
  const warnings: string[] = [];

  // ولتاژِ مدارِ باز در سرمای شدید **بالا** می‌رود؛ ضریب دمایی منفی است و اینجا
  // با قدرِ مطلقِ آن کار می‌کنیم: Voc(T) = Voc_stc · (۱ + |β| · (۲۵ − T))
  const vocPerModule = module.vocV * (1 + module.tempCoeffVoc * (25 - options.minAmbientC));
  const vmpPerModule = module.vmpV * (1 - module.tempCoeffPmax * (options.maxCellC - 25));

  const maxByVoltage = Math.floor(Math.min(inverter.maxDcVoltageV, module.maxSystemVoltageV) / vocPerModule);
  const minByMppt = Math.ceil(inverter.mpptMinV / Math.max(vmpPerModule, 1));

  let modulesPerString = maxByVoltage;
  if (modulesPerString < minByMppt) {
    // ولتاژ آسمانِ سرد خیلی بالاست یا MPPT خیلی باریک: با کمترین طولِ ممکن ادامه می‌دهیم
    modulesPerString = Math.max(1, maxByVoltage);
    warnings.push(
      `با این ماژول و اینورتر، رشته نمی‌تواند هم‌زمان ولتاژ مجاز و بازه‌ی MPPT را برآورده کند (حداکثر ${maxByVoltage}، حداقل ${minByMppt} ماژول).`,
    );
  } else {
    // در بازه‌ی مجاز، طولی انتخاب می‌شود که بیشترین تعداد ماژول را به کار بگیرد
    // (کمترین باقیمانده) — در صورت تساوی، رشته‌ی بلندتر (کابل و تلفات کمتر).
    let bestLength = modulesPerString;
    let bestUnused = Number.POSITIVE_INFINITY;
    for (let length = minByMppt; length <= maxByVoltage; length += 1) {
      const unused = panelCount % length;
      if (unused < bestUnused || (unused === bestUnused && length > bestLength)) {
        bestUnused = unused;
        bestLength = length;
      }
    }
    modulesPerString = bestLength;
  }
  modulesPerString = Math.max(1, modulesPerString);

  const stringCount = Math.floor(panelCount / modulesPerString);
  const unusedModules = panelCount - stringCount * modulesPerString;
  if (unusedModules > 0 && panelCount > 0) {
    warnings.push(
      `${unusedModules} ماژول در هیچ رشته‌ای جای نگرفت (باقیمانده‌ی تقسیم بر ${modulesPerString}). در طراحی نهایی با رشته‌بندی ترکیبی حل می‌شود.`,
    );
  }

  const vocMinTempV = Math.round(modulesPerString * vocPerModule);
  const vmpMaxTempV = Math.round(stringCount > 0 ? modulesPerString * vmpPerModule : 0);

  return {
    modulesPerString,
    stringCount,
    unusedModules,
    vocMinTempV,
    vmpMaxTempV,
    withinMppt: vmpMaxTempV >= inverter.mpptMinV && vocMinTempV <= inverter.maxDcVoltageV,
    warnings,
  };
}

/** دمای سلول با مدل NOCT (نصبِ پشت‌بامیِ کم‌تهویه ضریب ۱٫۱ دارد) */
export function cellTemperatureC(
  poaWm2: number,
  ambientC: number,
  noctC: number,
  mountingFactor = 1.1,
): number {
  return ambientC + ((noctC - 20) / 800) * poaWm2 * mountingFactor;
}

export interface LossItem {
  key: string;
  label: string;
  /** کسر تلفات (۰٫۰۳ = ۳٪) */
  lossFraction: number;
  /** توضیح کوتاه برای گزارش */
  note?: string;
}

export interface SystemDesignInput {
  /** عرض جغرافیایی سایت — برای تبدیلِ تابشِ روزانه به تابشِ نماینده */
  latDeg: number;
  module: PvModule;
  inverter: InverterSpec;
  inverterCount: number;
  panelCount: number;
  /** میانگینِ وزنیِ دسترسی خورشیدی (۰ تا ۱) */
  weightedSolarAccess: number;
  /** انحراف معیارِ دسترسیِ پنل‌ها (برای تلفات ناهم‌خوانی) */
  accessStdDev?: number;
  /** تابش ماهانه روی صفحه (kWh/m²·day) */
  monthlyPoaKwhM2Day: readonly number[];
  /** دمای ماهانه (°C) */
  monthlyTempC: readonly number[];
  /** تلفات غبار (سهم سالانه) */
  soilingLoss?: number;
  /** تلفات در دسترس‌بودن شبکه/تعمیرات */
  availabilityLoss?: number;
}

export interface SystemDesign {
  capacityKwp: number;
  acKw: number;
  dcAcRatio: number;
  stringConfig: StringConfig;
  losses: LossItem[];
  performanceRatio: number;
  /** دمای سلولِ ماهانه (°C) — برای نمایش در گزارش */
  monthlyCellTempC: number[];
}

/** وزن‌دهیِ ماهانه بر اساس تابش (برای میانگین‌گیری از تلفاتِ وابسته به دما) */
function irradianceWeights(monthly: readonly number[]): number[] {
  const total = monthly.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return monthly.map(() => 1 / 12);
  return monthly.map((value) => value / total);
}

/**
 * تراز تلفاتِ سیستم (از پنل تا کنتور). مقادیر پیش‌فرض برای اقلیمِ خشک و
 * غبارآلودِ فلات ایران انتخاب شده‌اند و از طریق ورودی قابل تغییرند.
 */
export function designSystem(input: SystemDesignInput): SystemDesign {
  const { module, monthlyPoaKwhM2Day, monthlyTempC, weightedSolarAccess } = input;
  const weights = irradianceWeights(monthlyPoaKwhM2Day);

  // ── تلفات دمایی (وزنی بر اساس تابش ماهانه) ──
  // تابشِ روزانه (kWh/m²·day) ابتدا به «میانگینِ وزن‌دارِ تابشِ روز» تبدیل می‌شود:
  // میانگین روی ساعاتِ آفتابی × ۱٫۳۵ (چون سهمِ ساعاتِ پُزتابش در گرم‌شدن بیشتر است).
  let temperatureLoss = 0;
  const monthlyCellTempC: number[] = [];
  monthlyPoaKwhM2Day.forEach((dailyKwh, index) => {
    const ambient = monthlyTempC[index] ?? 25;
    const daylight = Math.max(6, dayLengthHours(input.latDeg, representativeDayOfYear(index)));
    const representativeIrradiance = ((dailyKwh * 1000) / daylight) * 1.35;
    const cellTemp = cellTemperatureC(representativeIrradiance, ambient, module.noctC);
    monthlyCellTempC.push(Math.round(cellTemp * 10) / 10);
    temperatureLoss += (weights[index] ?? 0) * Math.max(0, module.tempCoeffPmax * (cellTemp - 25));
  });

  // ── ناهم‌خوانی (Mismatch): تابعی از پراکندگیِ سایه روی پنل‌ها ──
  const spread = input.accessStdDev ?? 0;
  const mismatchLoss = 0.01 + Math.min(0.05, spread * 4);

  const losses: LossItem[] = [
    {
      key: "temperature",
      label: "تلفات دمایی سلول",
      lossFraction: Math.round(temperatureLoss * 10000) / 10000,
      note: `دمای سلول تا ${Math.round(Math.max(...monthlyCellTempC, 25))}°C`,
    },
    { key: "soiling", label: "غبار و آلودگی سطح", lossFraction: input.soilingLoss ?? 0.03 },
    {
      key: "mismatch",
      label: "ناهم‌خوانی و سایه‌اندازیِ جزیی",
      lossFraction: Math.round(mismatchLoss * 10000) / 10000,
    },
    { key: "iam", label: "ضریب زاویه‌ی تابش و بازتاب", lossFraction: 0.015 },
    { key: "lid", label: "افت نوریِ سال اول (LID)", lossFraction: module.firstYearDegradation },
    { key: "dcWiring", label: "تلفات کابل‌کشی DC", lossFraction: 0.015 },
    {
      key: "inverter",
      label: "بازده اینورتر",
      lossFraction: Math.round((1 - input.inverter.euroEfficiency) * 10000) / 10000,
      note: `بازده وزنی ${Math.round(input.inverter.euroEfficiency * 1000) / 10}٪`,
    },
    { key: "acWiring", label: "تلفات AC و ترانس", lossFraction: 0.01 },
    { key: "availability", label: "خاموشی و تعمیرات", lossFraction: input.availabilityLoss ?? 0.015 },
    {
      key: "shadingDerating",
      label: "کاهشِ سایه (دسترسی خورشیدی)",
      lossFraction: Math.round(Math.max(0, 1 - weightedSolarAccess) * 10000) / 10000,
    },
  ];

  const performanceRatio = losses.reduce((pr, item) => pr * (1 - item.lossFraction), 1);

  const capacityKwp = input.panelCount * (module.wattPmp / 1000);
  const acKw = input.inverter.acPowerKw * input.inverterCount;

  return {
    capacityKwp: Math.round(capacityKwp * 100) / 100,
    acKw: Math.round(acKw * 100) / 100,
    dcAcRatio: acKw > 0 ? Math.round((capacityKwp / acKw) * 100) / 100 : 0,
    stringConfig: configureStrings({
      module,
      inverter: input.inverter,
      panelCount: input.panelCount,
      minAmbientC: Math.min(...(monthlyTempC.length > 0 ? [...monthlyTempC] : [0])) - 5,
      maxCellC: Math.max(...monthlyCellTempC, 60),
    }),
    losses,
    performanceRatio: Math.round(performanceRatio * 1000) / 1000,
    monthlyCellTempC,
  };
}
