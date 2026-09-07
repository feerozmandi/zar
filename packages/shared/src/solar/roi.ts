/**
 * برآورد مالی نیروگاه خورشیدی — جریان نقدی، NPV/IRR/LCOE، بازگشت سرمایه و تحلیل حساسیت.
 *
 * این ماژول جایگزینِ نسخه‌ی ساده‌ی فاز قبل است اما **سازگاریِ عقب‌رو** را حفظ
 * می‌کند: `calculateSolarRoi` همان امضا را دارد و فیلدهای قدیمیِ خروجی پابرجایند.
 *
 * قراردادهای مالی:
 *  - همه‌ی مبالغ به **تومانِ جاریِ سال صفر** هستند مگر این‌که با نرخِ رشد (escalation)
 *    برای سال‌های بعد تعدیل شوند.
 *  - `discountRate` نرخ تنزیلِ اسمی است (در اقتصادِ تورمیِ ایران معمولاً ۲۰٪ تا ۳۰٪؛
 *    پیش‌فرض ۲۳٪ بر مبنای میانگینِ بازدهِ فرصت).
 *  - مالیات و استهلاک در این نسخه لحاظ نشده و در توضیحِ مفروضات اعلام می‌شود.
 */

/** ضریبِ انتشارِ شبکه برق (kg CO₂ به ازای هر kWh) — قابلِ تنظیم از تنظیمات سایت */
export const GRID_EMISSION_FACTOR = 0.466;

export interface SolarAssessmentInput {
  /** ظرفیت پیشنهادی (kWp) */
  capacityKwp: number;
  /** تابش روزانه‌ی معادل (peak sun hours) — از جدول اقلیمی منطقه */
  peakSunHours: number;
  /** بازده کلی سیستم (PR) */
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
  /** @deprecated در نسخه‌ی جدید `irr` نرخ بازدهِ داخلیِ واقعی است */
  irrLowerBound: number;
  lifetimeGenerationKwh: number;
  co2AvoidedTons: number;
  // ── افزوده‌شده در ماژول امکان‌سنجی حرفه‌ای ──
  irr: number | null;
  mirr: number | null;
  lcoeTomanPerKwh: number;
  discountedPaybackYears: number | null;
  yearly: CashflowYear[];
  assumptions: string[];
}

const DEFAULTS = {
  performanceRatio: 0.78,
  degradationPerYear: 0.006,
  availability: 0.97,
  selfConsumptionShare: 0.4,
  years: 20,
  discountRate: 0.23,
  financeRate: 0.24,
  reinvestRate: 0.18,
} as const;

export function estimateGeneration(input: SolarAssessmentInput): number {
  const pr = input.performanceRatio ?? DEFAULTS.performanceRatio;
  const availability = input.availability ?? DEFAULTS.availability;
  return input.capacityKwp * input.peakSunHours * 365 * pr * availability;
}

// ───────────────────────── ابزارهای مالی ─────────────────────────

/** ارزش فعلیِ خالص برای جریان نقدی (اندیس ۰ = سال صفر) */
export function npv(rate: number, cashflows: readonly number[]): number {
  return cashflows.reduce((sum, flow, index) => sum + flow / (1 + rate) ** index, 0);
}

/**
 * نرخ بازدهِ داخلی با جست‌وجوی دودویی. اگر جریان نقدی تغییرِ علامت نداشته باشد
 * (مثلاً پروژه‌ای که همیشه منفی است) مقدار `null` برمی‌گردد.
 */
export function irr(cashflows: readonly number[], low = -0.9, high = 3): number | null {
  const f = (rate: number) => npv(rate, cashflows);
  const fLow = f(low);
  const fHigh = f(high);
  if (fLow * fHigh > 0) return null;

  let lower = low;
  let upper = high;
  for (let i = 0; i < 200; i += 1) {
    const middle = (lower + upper) / 2;
    const value = f(middle);
    if (Math.abs(value) < 1e-7) return Math.round(middle * 10_000) / 10_000;
    if (f(lower) * value < 0) upper = middle;
    else lower = middle;
  }
  return Math.round(((lower + upper) / 2) * 10_000) / 10_000;
}

/** نرخ بازدهِ اصلاح‌شده (MIRR) — فرضِ بازسرمایه‌گذاری با نرخِ reinvest و تأمین مالی با financeRate */
export function mirr(
  cashflows: readonly number[],
  financeRate = DEFAULTS.financeRate,
  reinvestRate = DEFAULTS.reinvestRate,
): number | null {
  const negatives = cashflows.map((flow) => (flow < 0 ? flow : 0));
  const positives = cashflows.map((flow) => (flow > 0 ? flow : 0));
  const presentValueOfCosts = -npv(financeRate, negatives);
  const futureValueOfBenefits = positives.reduce(
    (sum, flow, index) => sum + flow * (1 + reinvestRate) ** (cashflows.length - 1 - index),
    0,
  );
  if (presentValueOfCosts <= 0 || futureValueOfBenefits <= 0) return null;
  const years = cashflows.length - 1;
  if (years <= 0) return null;
  return Math.round(((futureValueOfBenefits / presentValueOfCosts) ** (1 / years) - 1) * 10_000) / 10_000;
}

/** دوره‌ی بازگشتِ تنزیل‌شده (سال) — با درون‌یابیِ خطی داخل سالِ عبور */
export function discountedPaybackYears(cashflows: readonly number[], rate: number): number | null {
  let cumulative = 0;
  for (let year = 0; year < cashflows.length; year += 1) {
    const discounted = (cashflows[year] ?? 0) / (1 + rate) ** year;
    const previous = cumulative;
    cumulative += discounted;
    if (previous < 0 && cumulative >= 0) {
      const fraction = discounted === 0 ? 0 : -previous / discounted;
      return Math.round((year - 1 + fraction) * 10) / 10;
    }
  }
  return null;
}

/** هزینه‌ی ترازشده‌ی انرژی (تومان به ازای هر کیلووات‌ساعت) */
export function lcoeTomanPerKwh(options: {
  capexToman: number;
  annualOpexToman: number;
  replacementCostsToman?: ReadonlyArray<{ year: number; costToman: number }>;
  annualProductionKwh: readonly number[];
  discountRate: number;
  opexEscalation?: number;
}): number {
  const { capexToman, annualOpexToman, discountRate } = options;
  const escalation = options.opexEscalation ?? 0;
  let costPresent = capexToman;
  let energyPresent = 0;

  options.annualProductionKwh.forEach((production, index) => {
    const year = index + 1;
    const discount = (1 + discountRate) ** year;
    costPresent += (annualOpexToman * (1 + escalation) ** (year - 1)) / discount;
    costPresent +=
      (options.replacementCostsToman ?? [])
        .filter((item) => item.year === year)
        .reduce((sum, item) => sum + item.costToman, 0) / discount;
    energyPresent += production / discount;
  });

  return energyPresent > 0 ? Math.round(costPresent / energyPresent) : 0;
}

// ───────────────────────── جریان نقدی ─────────────────────────

export interface CashflowYear {
  year: number;
  productionKwh: number;
  selfConsumedKwh: number;
  exportedKwh: number;
  energySavingToman: number;
  exportRevenueToman: number;
  opexToman: number;
  replacementToman: number;
  debtServiceToman: number;
  /** خالصِ جریان نقدی (درآمد − هزینه − قسط) */
  netCashflowToman: number;
  cumulativeToman: number;
  discountedToman: number;
  cumulativeDiscountedToman: number;
}

export interface CashflowInput {
  /** تولید سال اول (kWh) */
  firstYearProductionKwh: number;
  /** افت سالانه‌ی تولید */
  degradationPerYear?: number;
  capexToman: number;
  /** هزینه‌ی بهره‌برداری و بیمه‌ی سال اول (تومان) */
  annualOpexToman: number;
  /** نرخ رشدِ هزینه‌ی بهره‌برداری */
  opexEscalation?: number;
  /** تعویض اینورتر */
  inverterReplacement?: { year: number; costToman: number } | null;
  /** سهمِ خودمصرفی از تولید (در نبودِ تفکیکِ ماهانه) */
  selfConsumptionShare?: number;
  /** نرخِ جایگزینیِ مصرف (تومان/kWh) */
  offsetPriceTomanPerKwh: number;
  /** نرخِ فروشِ مازاد (تومان/kWh) */
  exportPriceTomanPerKwh: number;
  /** نرخ رشدِ تعرفه‌ی برق */
  tariffEscalation?: number;
  /** نرخ رشدِ نرخِ فروش */
  exportPriceEscalation?: number;
  years?: number;
  discountRate?: number;
  /** ارزشِ اسقاطی در پایانِ دوره (کسر از سرمایه) */
  residualValueFactor?: number;
}

export interface CashflowResult {
  years: CashflowYear[];
  capexToman: number;
  npvToman: number;
  irr: number | null;
  mirr: number | null;
  simplePaybackYears: number | null;
  discountedPaybackYears: number | null;
  lcoeTomanPerKwh: number;
  totalRevenueToman: number;
  totalOpexToman: number;
  lifetimeGenerationKwh: number;
  co2AvoidedTons: number;
}

export function buildCashflow(input: CashflowInput): CashflowResult {
  const years = input.years ?? DEFAULTS.years;
  const discount = input.discountRate ?? DEFAULTS.discountRate;
  const degradation = input.degradationPerYear ?? DEFAULTS.degradationPerYear;
  const selfShare = input.selfConsumptionShare ?? DEFAULTS.selfConsumptionShare;
  const tariffEscalation = input.tariffEscalation ?? 0.18;
  const exportEscalation = input.exportPriceEscalation ?? 0.12;
  const opexEscalation = input.opexEscalation ?? 0.18;
  const residualFactor = input.residualValueFactor ?? 0.1;

  const rows: CashflowYear[] = [];
  const flows: number[] = [-input.capexToman];
  const productions: number[] = [];

  let cumulative = -input.capexToman;
  let cumulativeDiscounted = -input.capexToman;
  let totalRevenue = 0;
  let totalOpex = 0;
  let lifetime = 0;
  let simplePayback: number | null = null;

  for (let year = 1; year <= years; year += 1) {
    const production = input.firstYearProductionKwh * (1 - degradation) ** (year - 1);
    const selfConsumed = production * selfShare;
    const exported = production - selfConsumed;

    const energySaving = selfConsumed * input.offsetPriceTomanPerKwh * (1 + tariffEscalation) ** (year - 1);
    const exportRevenue = exported * input.exportPriceTomanPerKwh * (1 + exportEscalation) ** (year - 1);
    const opex = input.annualOpexToman * (1 + opexEscalation) ** (year - 1);
    const replacement =
      input.inverterReplacement && input.inverterReplacement.year === year
        ? input.inverterReplacement.costToman
        : 0;
    const residual = year === years ? input.capexToman * residualFactor : 0;

    const net = energySaving + exportRevenue - opex - replacement + residual;
    const discounted = net / (1 + discount) ** year;

    const previousCumulative = cumulative;
    cumulative += net;
    cumulativeDiscounted += discounted;
    if (simplePayback === null && previousCumulative < 0 && cumulative >= 0) {
      simplePayback = Math.round((year - 1 + (net === 0 ? 0 : -previousCumulative / net)) * 10) / 10;
    }

    rows.push({
      year,
      productionKwh: Math.round(production),
      selfConsumedKwh: Math.round(selfConsumed),
      exportedKwh: Math.round(exported),
      energySavingToman: Math.round(energySaving),
      exportRevenueToman: Math.round(exportRevenue),
      opexToman: Math.round(opex),
      replacementToman: replacement,
      debtServiceToman: 0,
      netCashflowToman: Math.round(net),
      cumulativeToman: Math.round(cumulative),
      discountedToman: Math.round(discounted),
      cumulativeDiscountedToman: Math.round(cumulativeDiscounted),
    });

    flows.push(net);
    productions.push(production);
    totalRevenue += energySaving + exportRevenue;
    totalOpex += opex + replacement;
    lifetime += production;
  }

  // اگر تا پایانِ دوره بازنگشت، دوره‌ی بازگشتِ ساده از تقسیمِ سرمایه بر خالصِ سال اول
  // به‌دست می‌آید (ممکن است از افقِ تحلیل بلندتر باشد) — رفتارِ نسخه‌ی قبل حفظ می‌شود.
  const firstYearNet = rows[0]?.netCashflowToman ?? 0;
  const fallbackPayback =
    simplePayback === null && firstYearNet > 0
      ? Math.round((input.capexToman / firstYearNet) * 10) / 10
      : simplePayback;

  return {
    years: rows,
    capexToman: input.capexToman,
    npvToman: Math.round(npv(discount, flows)),
    irr: irr(flows),
    mirr: mirr(flows),
    simplePaybackYears: fallbackPayback,
    discountedPaybackYears: discountedPaybackYears(flows, discount),
    lcoeTomanPerKwh: lcoeTomanPerKwh({
      capexToman: input.capexToman,
      annualOpexToman: input.annualOpexToman,
      replacementCostsToman: input.inverterReplacement
        ? [{ year: input.inverterReplacement.year, costToman: input.inverterReplacement.costToman }]
        : [],
      annualProductionKwh: productions,
      discountRate: discount,
      opexEscalation,
    }),
    totalRevenueToman: Math.round(totalRevenue),
    totalOpexToman: Math.round(totalOpex),
    lifetimeGenerationKwh: Math.round(lifetime),
    co2AvoidedTons: Math.round(((lifetime * GRID_EMISSION_FACTOR) / 1000) * 10) / 10,
  };
}

// ───────────────────────── تحلیل حساسیت ─────────────────────────

export interface SensitivityAxis {
  label: string;
  /** دامنه‌ی تغییر نسبت به مبنا (مثلاً [-0.2, 0, 0.2]) */
  deltas: number[];
  /** اعمالِ تغییر روی ورودی */
  apply: (input: CashflowInput, delta: number) => CashflowInput;
}

export interface SensitivityResult {
  axes: Array<{ label: string; deltas: number[]; npvToman: number[]; paybackYears: Array<number | null> }>;
  /** جدولِ دوبعدیِ NPV برای محورهای اصلی (سرمایه × تابش) */
  grid: {
    capexDeltas: number[];
    productionDeltas: number[];
    values: number[][];
  };
}

const DEFAULT_DELTAS = [-0.2, -0.1, 0, 0.1, 0.2];

export const DEFAULT_SENSITIVITY_AXES: SensitivityAxis[] = [
  {
    label: "هزینه‌ی احداث",
    deltas: DEFAULT_DELTAS,
    apply: (input, delta) => ({ ...input, capexToman: input.capexToman * (1 + delta) }),
  },
  {
    label: "تابش سالانه",
    deltas: DEFAULT_DELTAS,
    apply: (input, delta) => ({ ...input, firstYearProductionKwh: input.firstYearProductionKwh * (1 + delta) }),
  },
  {
    label: "تعرفه/نرخ فروش",
    deltas: DEFAULT_DELTAS,
    apply: (input, delta) => ({
      ...input,
      offsetPriceTomanPerKwh: input.offsetPriceTomanPerKwh * (1 + delta),
      exportPriceTomanPerKwh: input.exportPriceTomanPerKwh * (1 + delta),
    }),
  },
  {
    label: "نرخ تنزیل",
    deltas: [-0.3, -0.15, 0, 0.15, 0.3],
    apply: (input, delta) => ({ ...input, discountRate: (input.discountRate ?? DEFAULTS.discountRate) * (1 + delta) }),
  },
  {
    label: "هزینه‌ی بهره‌برداری",
    deltas: DEFAULT_DELTAS,
    apply: (input, delta) => ({ ...input, annualOpexToman: input.annualOpexToman * (1 + delta) }),
  },
];

export function sensitivityAnalysis(
  input: CashflowInput,
  axes: SensitivityAxis[] = DEFAULT_SENSITIVITY_AXES,
): SensitivityResult {
  const axisResults = axes.map((axis) => ({
    label: axis.label,
    deltas: axis.deltas,
    npvToman: axis.deltas.map((delta) => buildCashflow(axis.apply(input, delta)).npvToman),
    paybackYears: axis.deltas.map((delta) => buildCashflow(axis.apply(input, delta)).simplePaybackYears),
  }));

  const capexDeltas = [-0.2, -0.1, 0, 0.1, 0.2];
  const productionDeltas = [-0.15, -0.075, 0, 0.075, 0.15];
  const values = capexDeltas.map((capexDelta) =>
    productionDeltas.map((productionDelta) =>
      buildCashflow({
        ...input,
        capexToman: input.capexToman * (1 + capexDelta),
        firstYearProductionKwh: input.firstYearProductionKwh * (1 + productionDelta),
      }).npvToman,
    ),
  );

  return { axes: axisResults, grid: { capexDeltas, productionDeltas, values } };
}

// ───────────────────────── تابعِ سازگار با نسخه‌ی قبل ─────────────────────────

/**
 * محاسبه‌ی سریعِ مالی با ورودیِ ساده (بدون تفکیکِ ماهانه).
 * همچنان برای «ماشین‌حسابِ عمومی» و آزمون‌های رگرسیون استفاده می‌شود.
 */
export function calculateSolarRoi(input: SolarRoiInput): SolarRoiResult {
  const pr = input.performanceRatio ?? DEFAULTS.performanceRatio;
  const degradation = input.degradationPerYear ?? DEFAULTS.degradationPerYear;
  const selfShare = input.selfConsumptionShare ?? DEFAULTS.selfConsumptionShare;
  const years = input.years ?? DEFAULTS.years;
  const discount = input.discountRate ?? DEFAULTS.discountRate;

  const firstYear = estimateGeneration({ ...input, performanceRatio: pr });
  const blendedTariff = input.feedInTariff * (1 - selfShare) + input.offsetTariff * selfShare;
  const capex = input.capexPerKwp * input.capacityKwp;

  const cashflow = buildCashflow({
    firstYearProductionKwh: firstYear,
    degradationPerYear: degradation,
    capexToman: capex,
    annualOpexToman: input.annualOpex,
    selfConsumptionShare: selfShare,
    offsetPriceTomanPerKwh: input.offsetTariff,
    exportPriceTomanPerKwh: input.feedInTariff,
    tariffEscalation: 0,
    exportPriceEscalation: 0,
    opexEscalation: 0,
    years,
    discountRate: discount,
    inverterReplacement: null,
    residualValueFactor: 0,
  });

  const annualRevenue = firstYear * blendedTariff;
  const annualNet = annualRevenue - input.annualOpex;

  return {
    annualGenerationKwh: Math.round(firstYear),
    capex: Math.round(capex),
    annualRevenue: Math.round(annualRevenue),
    annualNet: Math.round(annualNet),
    simplePaybackYears: cashflow.simplePaybackYears ?? Number.POSITIVE_INFINITY,
    npv: cashflow.npvToman,
    irrLowerBound: cashflow.irr ?? discount,
    lifetimeGenerationKwh: cashflow.lifetimeGenerationKwh,
    co2AvoidedTons: cashflow.co2AvoidedTons,
    irr: cashflow.irr,
    mirr: cashflow.mirr,
    lcoeTomanPerKwh: cashflow.lcoeTomanPerKwh,
    discountedPaybackYears: cashflow.discountedPaybackYears,
    yearly: cashflow.years,
    assumptions: [
      `ضریب عملکرد ${pr} و افت سالانه ${(degradation * 100).toFixed(1)}٪`,
      `نرخ تنزیل ${(discount * 100).toFixed(0)}٪ و دوره‌ی تحلیل ${years} سال`,
      `سهم خودمصرفی ${(selfShare * 100).toFixed(0)}٪`,
      "تورمِ تعرفه و هزینه‌ی بهره‌برداری در این محاسبه‌ی سریع صفر فرض شده است",
    ],
  };
}

export function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
