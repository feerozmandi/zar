/**
 * گردآورنده‌ی «گزارش امکان‌سنجی نیروگاه خورشیدی».
 *
 * این فایل نقطه‌ی تک‌ورودِ ماژول است: از مختصات/سقف/مصرف تا خروجیِ کاملِ فنی-مالی.
 * تمام محاسباتِ سنگین در ماژول‌های هم‌رده (`climate`، `sun`، `shading`، `roof`،
 * `system`، `production`، `tariff`، `cost`، `roi`) انجام می‌شود و اینجا فقط
 * «زنجیره‌سازی + یکپارچه‌سازی + تولیدِ هشدارها» است — تا هم وب و هم API دقیقاً
 * یک عدد را گزارش کنند (نوت ۳ §۴).
 */

import { estimateSolarResource, type SolarResource } from "./climate.js";
import { optimalTiltDeg, orientationPenalty } from "./sun.js";
import { layoutArray, polygonArea, type ArrayLayout, type RoofPlaneInput } from "./roof.js";
import { designSystem, findModule, selectInverter, type PvModule, type SystemDesign } from "./system.js";
import { monthlyPoa, selfConsumptionSplit, simulateProduction, type LoadProfileKind, type ProductionResult, type SelfConsumptionResult } from "./production.js";
import {
  annualBill,
  guaranteedPurchasePrice,
  policyScenario,
  POLICY_SCENARIOS,
  TARIFF_1404,
  type BillBreakdown,
  type PolicyScenario,
  type PolicyScenarioId,
  type TariffKind,
} from "./tariff.js";
import { estimateCost, type CostEstimate } from "./cost.js";
import { buildCashflow, sensitivityAnalysis, GRID_EMISSION_FACTOR, type CashflowInput, type CashflowResult, type SensitivityResult } from "./roi.js";
import { PROVINCES, provinceMeta, resolveProvinceCode } from "./provinces.js";

export const SOLAR_ENGINE_VERSION = "2.0.0";

// ───────────────────────── ورودی ─────────────────────────

export interface FeasibilitySiteInput {
  /** نام دلخواه سایت */
  name?: string;
  /** کد یا نام استان (با aliasها سازگار است) */
  province: string;
  lat?: number;
  lon?: number;
  elevationM?: number;
  address?: string;
}

export interface FeasibilityRoofInput {
  /** مساحت کل در حالتِ سریع (وقتی صفحه ترسیم نشده) */
  areaM2?: number;
  /** صفحات ترسیم‌شده روی نقشه‌ی سقف (حالتِ حرفه‌ای) */
  planes?: RoofPlaneInput[];
  tiltDeg?: number;
  azimuthDeg?: number;
  /** حریم از لبه (متر) */
  setbackM?: number;
  /** ضریب سایه در حالتِ سریع (۰ تا ۱) */
  shadingFactor?: number;
}

export interface FeasibilityConsumptionInput {
  /** مصرف ماهانه (kWh) از فروردین */
  monthlyKwh: number[];
  tariffKind: TariffKind;
  /** دیماندِ ماهانه (کیلووات) — برای اشتراک‌های قدرت‌دار */
  monthlyPeakDemandKw?: number[];
  /** پروفایلِ نوعیِ بار */
  profile?: LoadProfileKind;
}

export interface FeasibilityDesignInput {
  moduleModel?: string;
  orientation?: "portrait" | "landscape";
  targetDcAcRatio?: number;
  /** سقفِ ظرفیت (مثلاً محدودیتِ شبکه یا بودجه) */
  maxCapacityKwp?: number;
  phases?: 1 | 3;
}

export interface FeasibilityCostInput {
  capexPerKwpToman?: number;
  annualOpexToman?: number;
  inverterReplacementYear?: number;
}

export interface FeasibilityFinancialsInput {
  discountRate?: number;
  years?: number;
  tariffEscalation?: number;
  exportPriceEscalation?: number;
  opexEscalation?: number;
}

export interface FeasibilityInput {
  site: FeasibilitySiteInput;
  roof: FeasibilityRoofInput;
  consumption: FeasibilityConsumptionInput;
  design?: FeasibilityDesignInput;
  cost?: FeasibilityCostInput;
  financials?: FeasibilityFinancialsInput;
  scenarios?: PolicyScenarioId[];
  /** مقادیر اندازه‌گیری‌شده برای جایگزینیِ برآوردِ اقلیمی */
  resourceOverrides?: Partial<Pick<SolarResource, "annualGhiKwhM2Day">>;
}

// ───────────────────────── خروجی ─────────────────────────

export interface RiskFlag {
  level: "info" | "warning" | "critical";
  code: string;
  message: string;
}

export interface ScenarioResult {
  scenario: PolicyScenario;
  /** نرخ مؤثرِ جایگزینیِ هر کیلووات‌ساعتِ خودمصرفی (تومان) */
  offsetPriceTomanPerKwh: number;
  exportPriceTomanPerKwh: number;
  selfConsumptionShare: number;
  annualSavingToman: number;
  annualExportRevenueToman: number;
  monthlySavingToman: number[];
  cashflow: CashflowResult;
  paybackYears: number | null;
  npvToman: number;
  irr: number | null;
  lcoeTomanPerKwh: number;
}

export interface EnvironmentImpact {
  co2AvoidedTonsLifetime: number;
  co2AvoidedTonsPerYear: number;
  treesPlantedEquivalent: number;
  carKmAvoided: number;
  barrelsOfOilAvoided: number;
  homesPoweredPerYear: number;
}

export interface PlaneSummary {
  id: string;
  areaM2: number;
  tiltDeg: number;
  azimuthDeg: number;
  panels: number;
  capacityKwp: number;
  solarAccess: number;
  layout: ArrayLayout;
}

export interface FeasibilityReport {
  meta: {
    engineVersion: string;
    generatedAtIso: string;
    assumptions: string[];
    warnings: string[];
  };
  site: {
    name: string;
    provinceCode: string;
    provinceLabel: string;
    lat: number;
    lon: number;
    elevationM: number;
  };
  resource: SolarResource;
  roof: {
    mode: "drawn" | "estimated";
    totalAreaM2: number;
    usableAreaM2: number;
    planes: PlaneSummary[];
  };
  design: {
    module: PvModule;
    inverterModel: string;
    inverterCount: number;
    capacityKwp: number;
    acKw: number;
    system: SystemDesign;
  };
  production: ProductionResult;
  energyBalance: SelfConsumptionResult;
  bills: {
    tariffKind: TariffKind;
    baselineMonthly: BillBreakdown[];
    baselineAnnualToman: number;
    postSolarMonthly: BillBreakdown[];
    postSolarAnnualToman: number;
    annualSavingToman: number;
  };
  cost: CostEstimate;
  scenarios: ScenarioResult[];
  recommendedScenarioId: PolicyScenarioId;
  recommendedReason: string;
  sensitivity: SensitivityResult;
  environment: EnvironmentImpact;
  risks: RiskFlag[];
}

// ───────────────────────── توابع کمکی ─────────────────────────

/** ساختِ یک صفحه‌ی مستطیلیِ معادل از روی مساحت (حالتِ «فقط مساحت») */
function rectanglePlane(areaM2: number, tiltDeg: number, azimuthDeg: number): RoofPlaneInput {
  const width = Math.sqrt(Math.max(1, areaM2) * 1.6);
  const height = Math.max(1, areaM2) / width;
  return {
    id: "main",
    tiltDeg,
    azimuthDeg,
    polygon: [
      [-width / 2, -height / 2],
      [width / 2, -height / 2],
      [width / 2, height / 2],
      [-width / 2, height / 2],
    ],
    setbackM: 0.5,
  };
}

function weightMonthly(values: readonly number[], weight: number, target: number[], total: number): void {
  for (let month = 0; month < 12; month += 1) {
    target[month] = (target[month] ?? 0) + (values[month] ?? 0) * (total > 0 ? weight / total : 0);
  }
}

// ───────────────────────── گردآوریِ گزارش ─────────────────────────

export function buildFeasibilityReport(input: FeasibilityInput): FeasibilityReport {
  const warnings: string[] = [];
  const assumptions: string[] = [];

  const provinceCode = resolveProvinceCode(input.site.province) ?? "tehran";
  if (provinceCode !== input.site.province) {
    assumptions.push(`استان «${input.site.province}» به کدِ استاندارد «${provinceCode}» نگاشت شد.`);
  }
  const meta = provinceMeta(provinceCode) ?? PROVINCES[0];
  const lat = input.site.lat ?? meta.lat;
  const lon = input.site.lon ?? meta.lon;
  const elevationM = input.site.elevationM ?? meta.elevationM;

  // ── ۱. منبع خورشیدی ──
  const resource = estimateSolarResource({
    lat,
    lon,
    elevationM,
    overrides: input.resourceOverrides
      ? { annualGhiKwhM2Day: input.resourceOverrides.annualGhiKwhM2Day }
      : undefined,
  });
  if (resource.confidence === "low") {
    warnings.push(
      `فاصله تا نزدیک‌ترین ایستگاه اقلیمی ${resource.stationDistanceKm} کیلومتر است؛ برای تصمیم‌گیری از داده‌ی اندازه‌گیری‌شده استفاده کنید.`,
    );
  }
  assumptions.push(
    `تابش سالانه ${resource.annualGhiKwhM2Day} kWh/m²·day بر پایه ایستگاه ${resource.nearestStation.name}`,
  );

  // ── ۲. سقف و چیدمان ──
  const module = findModule(input.design?.moduleModel ?? "mono-perc-550");
  const defaultTilt = input.roof.tiltDeg ?? optimalTiltDeg(lat);
  const defaultAzimuth = input.roof.azimuthDeg ?? 180;

  const planes: RoofPlaneInput[] =
    input.roof.planes && input.roof.planes.length > 0
      ? input.roof.planes
      : [rectanglePlane(input.roof.areaM2 ?? 200, defaultTilt, defaultAzimuth)];

  const layouts = planes.map((plane) =>
    layoutArray(
      { ...plane, setbackM: plane.setbackM ?? input.roof.setbackM ?? 0.5 },
      module,
      {
        latDeg: lat,
        resource,
        orientation: input.design?.orientation ?? "portrait",
        maxPanels: input.design?.maxCapacityKwp
          ? Math.floor((input.design.maxCapacityKwp * 1000) / module.wattPmp)
          : undefined,
      },
    ),
  );

  const planeSummaries: PlaneSummary[] = planes.map((plane, index) => {
    const layout = layouts[index] ?? {
      panelCount: 0,
      capacityKwp: 0,
      usableAreaM2: 0,
      weightedSolarAccess: 0,
      panelAreaM2: 0,
      gcr: 0,
      rowPitchM: 0,
      rowCount: 0,
      panels: [],
      notes: [],
    };
    return {
      id: plane.id ?? `plane-${index + 1}`,
      areaM2: Math.round(polygonArea(plane.polygon) * 100) / 100,
      tiltDeg: plane.tiltDeg,
      azimuthDeg: plane.azimuthDeg,
      panels: layout.panelCount,
      capacityKwp: layout.capacityKwp,
      solarAccess: layout.weightedSolarAccess,
      layout,
    };
  });

  for (const summary of planeSummaries) {
    for (const note of summary.layout.notes) warnings.push(`${summary.id}: ${note}`);
  }

  const totalPanels = planeSummaries.reduce((sum, plane) => sum + plane.panels, 0);
  const capacityKwp = Math.round((totalPanels * module.wattPmp) / 1000 * 100) / 100;
  const totalAreaM2 = Math.round(planeSummaries.reduce((sum, plane) => sum + plane.areaM2, 0) * 100) / 100;
  const usableAreaM2 = Math.round(
    layouts.reduce((sum, layout) => sum + layout.usableAreaM2, 0) * 100,
  ) / 100;

  if (capacityKwp <= 0) {
    throw new Error("با این مشخصاتِ سقف هیچ پنلی جای نمی‌گیرد؛ مساحت، حریم یا موانع را بازنگری کنید.");
  }

  // میانگینِ وزنیِ دسترسی خورشیدی و انحرافِ معیارِ آن (برای تلفات ناهم‌خوانی)
  const accessValues = layouts.flatMap((layout) => layout.panels.map((panel) => panel.solarAccess));
  const weightedSolarAccess =
    accessValues.length > 0
      ? Math.round((accessValues.reduce((sum, value) => sum + value, 0) / accessValues.length) * 1000) / 1000
      : 1;
  const accessMean = weightedSolarAccess;
  const accessStdDev =
    accessValues.length > 1
      ? Math.sqrt(
          accessValues.reduce((sum, value) => sum + (value - accessMean) ** 2, 0) / accessValues.length,
        )
      : 0;

  // ── ۳. تولید ──
  const poaPerPlane = planes.map((plane) => monthlyPoa(resource, lat, plane.tiltDeg, plane.azimuthDeg));
  const accessPerPlane = layouts.map((layout) => {
    const monthly = new Array<number>(12).fill(0);
    for (const panel of layout.panels) {
      for (let month = 0; month < 12; month += 1) {
        monthly[month] = (monthly[month] ?? 0) + (panel.monthlyAccess[month] ?? 1);
      }
    }
    return monthly.map((value) => (layout.panelCount > 0 ? value / layout.panelCount : 1));
  });

  const inverterChoice = selectInverter(capacityKwp, {
    targetDcAcRatio: input.design?.targetDcAcRatio ?? 1.2,
    phases: input.design?.phases ?? (capacityKwp <= 6 ? 1 : 3),
  });

  const monthlyPoaWeighted = new Array<number>(12).fill(0);
  const monthlyAccessWeighted = new Array<number>(12).fill(0);
  planeSummaries.forEach((plane, index) => {
    const weight = plane.capacityKwp;
    weightMonthly(poaPerPlane[index] ?? [], weight, monthlyPoaWeighted, capacityKwp);
    weightMonthly(accessPerPlane[index] ?? [], weight, monthlyAccessWeighted, capacityKwp);
  });

  const system = designSystem({
    latDeg: lat,
    module,
    inverter: inverterChoice.spec,
    inverterCount: inverterChoice.count,
    panelCount: totalPanels,
    weightedSolarAccess,
    accessStdDev,
    monthlyPoaKwhM2Day: monthlyPoaWeighted,
    monthlyTempC: resource.monthlyTempC,
  });

  const staticLosses = system.losses.filter(
    (loss) => !["temperature", "shadingDerating"].includes(loss.key),
  );

  const productionPerPlane = planes.map((plane, index) =>
    simulateProduction({
      latDeg: lat,
      tiltDeg: plane.tiltDeg,
      surfaceAzimuthDeg: plane.azimuthDeg,
      monthlyPoaKwhM2Day: poaPerPlane[index] ?? [],
      monthlyTempC: resource.monthlyTempC,
      capacityKwp: planeSummaries[index]?.capacityKwp ?? 0,
      acKw: Math.max(0.1, inverterChoice.acKw * ((planeSummaries[index]?.capacityKwp ?? 0) / capacityKwp)),
      module,
      inverter: inverterChoice.spec,
      staticLosses,
      monthlyAccess: accessPerPlane[index] ?? [],
    }),
  );

  const production: ProductionResult = aggregateProduction(productionPerPlane);

  // پیکِ تولید ماهانه (برای کاهشِ بهای قدرت)
  const monthlyPeakProductionKw = production.monthlyAcKwh.map((energy, month) => {
    const days = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month] ?? 30;
    const shape = production.monthlyHourlyShape[month] ?? [];
    const peakShare = Math.max(...shape, 0);
    return Math.round(((energy * peakShare) / days) * 100) / 100;
  });

  // ── ۴. مصرف و تطبیق ──
  const profile = TARIFF_1404[input.consumption.tariffKind];
  const monthlyLoad = input.consumption.monthlyKwh;
  const loadProfileKind: LoadProfileKind =
    input.consumption.profile ??
    (input.consumption.tariffKind === "residential"
      ? "residential"
      : input.consumption.tariffKind === "agricultural"
        ? "agricultural"
        : input.consumption.tariffKind === "commercial" || input.consumption.tariffKind === "governmental"
          ? "commercial"
          : "industrial");

  const energyBalance = selfConsumptionSplit({
    monthlyLoadKwh: monthlyLoad,
    monthlyProductionKwh: production.monthlyAcKwh,
    profile: loadProfileKind,
    productionShapes: production.monthlyHourlyShape,
  });

  // ── ۵. قبضِ قبل و بعد ──
  const baseline = annualBill(profile, monthlyLoad, input.consumption.monthlyPeakDemandKw ?? []);
  const postSolar = annualBill(
    profile,
    energyBalance.monthly.map((month) => month.gridImportKwh),
    (input.consumption.monthlyPeakDemandKw ?? []).map((demand, month) =>
      Math.max(0, demand - (monthlyPeakProductionKw[month] ?? 0)),
    ),
  );

  const monthlySavingToman = baseline.monthly.map(
    (bill, index) => bill.totalToman - (postSolar.monthly[index]?.totalToman ?? 0),
  );
  const annualSavingToman = baseline.totalToman - postSolar.totalToman;

  // ── ۶. هزینه‌ها ──
  const cost = estimateCost({
    capacityKwp,
    module,
    capexPerKwpToman: input.cost?.capexPerKwpToman,
    annualOpexToman: input.cost?.annualOpexToman,
    inverterReplacementYear: input.cost?.inverterReplacementYear,
  });
  for (const assumption of cost.assumptions) assumptions.push(assumption);

  // ── ۷. سناریوهای مالی ──
  const financials = input.financials ?? {};
  const years = financials.years ?? 20;
  const discountRate = financials.discountRate ?? 0.23;
  const tariffEscalation = financials.tariffEscalation ?? 0.18;
  const exportPriceEscalation = financials.exportPriceEscalation ?? 0.12;
  const opexEscalation = financials.opexEscalation ?? 0.18;

  const scenarioIds = input.scenarios ?? POLICY_SCENARIOS.map((scenario) => scenario.id);
  const annualSelfConsumed = energyBalance.annualSelfConsumedKwh;
  const effectiveOffsetPrice =
    annualSelfConsumed > 0 ? annualSavingToman / annualSelfConsumed : profile.blocks[0]?.priceTomanPerKwh ?? 3_000;

  const scenarioResults: ScenarioResult[] = scenarioIds.map((id) => {
    const scenario = policyScenario(id);
    const exportPrice =
      id === "guaranteed-purchase"
        ? guaranteedPurchasePrice(capacityKwp)
        : scenario.defaultExportPriceTomanPerKwh ?? 0;

    // در سناریوهای صادرات‌محور، کلِ تولید فروخته می‌شود (خودمصرفی صفر)
    const selfShare =
      id === "guaranteed-purchase" || id === "green-exchange" ? 0 : energyBalance.selfConsumptionRate;

    const cashflowInput: CashflowInput = {
      firstYearProductionKwh: production.annualAcKwh,
      degradationPerYear: module.annualDegradation,
      capexToman: cost.capexTotalToman,
      annualOpexToman: cost.annualOpexToman + cost.insuranceToman,
      opexEscalation,
      inverterReplacement: {
        year: cost.inverterReplacementYear,
        costToman: cost.inverterReplacementCostToman,
      },
      selfConsumptionShare: selfShare,
      offsetPriceTomanPerKwh: selfShare > 0 ? effectiveOffsetPrice : 0,
      exportPriceTomanPerKwh: exportPrice,
      tariffEscalation,
      exportPriceEscalation,
      years,
      discountRate,
      residualValueFactor: 0.1,
    };

    const cashflow = buildCashflow(cashflowInput);
    const annualExportRevenue = Math.round(
      (production.annualAcKwh - (selfShare > 0 ? annualSelfConsumed : 0)) * exportPrice,
    );

    return {
      scenario,
      offsetPriceTomanPerKwh: Math.round(selfShare > 0 ? effectiveOffsetPrice : 0),
      exportPriceTomanPerKwh: exportPrice,
      selfConsumptionShare: Math.round(selfShare * 1000) / 1000,
      annualSavingToman: Math.round(selfShare > 0 ? annualSavingToman : 0),
      annualExportRevenueToman: annualExportRevenue,
      monthlySavingToman: monthlySavingToman.map((value) => (selfShare > 0 ? Math.round(value) : 0)),
      cashflow,
      paybackYears: cashflow.simplePaybackYears,
      npvToman: cashflow.npvToman,
      irr: cashflow.irr,
      lcoeTomanPerKwh: cashflow.lcoeTomanPerKwh,
    };
  });

  const recommended = scenarioResults.reduce((best, current) =>
    current.npvToman > best.npvToman ? current : best,
  scenarioResults[0]!);
  const recommendedReason = buildRecommendationReason(recommended, scenarioResults);

  // ── ۸. حساسیت روی سناریوی پیشنهادی ──
  const sensitivity = sensitivityAnalysis({
    firstYearProductionKwh: production.annualAcKwh,
    degradationPerYear: module.annualDegradation,
    capexToman: cost.capexTotalToman,
    annualOpexToman: cost.annualOpexToman + cost.insuranceToman,
    opexEscalation,
    inverterReplacement: {
      year: cost.inverterReplacementYear,
      costToman: cost.inverterReplacementCostToman,
    },
    selfConsumptionShare: recommended.selfConsumptionShare,
    offsetPriceTomanPerKwh: recommended.offsetPriceTomanPerKwh,
    exportPriceTomanPerKwh: recommended.exportPriceTomanPerKwh,
    tariffEscalation,
    exportPriceEscalation,
    years,
    discountRate,
    residualValueFactor: 0.1,
  });

  // ── ۹. اثرات زیست‌محیطی ──
  const lifetimeTons = recommended.cashflow.co2AvoidedTons;
  const environment: EnvironmentImpact = {
    co2AvoidedTonsLifetime: lifetimeTons,
    co2AvoidedTonsPerYear: Math.round(((production.annualAcKwh * GRID_EMISSION_FACTOR) / 1000) * 10) / 10,
    treesPlantedEquivalent: Math.round(lifetimeTons * 1000 / (21 * years)),
    carKmAvoided: Math.round((lifetimeTons * 1000) / 0.2),
    barrelsOfOilAvoided: Math.round(lifetimeTons / 0.43),
    homesPoweredPerYear: Math.round(production.annualAcKwh / 3_000),
  };

  // ── ۱۰. ریسک‌ها ──
  const risks: RiskFlag[] = [];
  const tilt = planes[0]?.tiltDeg ?? defaultTilt;
  const azimuth = planes[0]?.azimuthDeg ?? defaultAzimuth;
  const penalty = orientationPenalty(tilt, azimuth, lat);

  if (weightedSolarAccess < 0.8) {
    risks.push({
      level: weightedSolarAccess < 0.65 ? "critical" : "warning",
      code: "shading",
      message: `دسترسی خورشیدی ${Math.round(weightedSolarAccess * 100)}٪ است؛ سایه‌اندازی موانع یا ردیف‌ها تولید را کاهش می‌دهد.`,
    });
  }
  if (penalty > 0.06) {
    risks.push({
      level: "warning",
      code: "orientation",
      message: `شیب ${tilt}° و سمت ${azimuth}° نسبت به حالت بهینه حدود ${Math.round(penalty * 100)}٪ افت دارد.`,
    });
  }
  if (system.dcAcRatio > 1.45 || system.dcAcRatio < 0.9) {
    risks.push({
      level: "warning",
      code: "dc-ac-ratio",
      message: `نسبت DC/AC برابر ${system.dcAcRatio} است؛ بازه‌ی بهینه ۱٫۰ تا ۱٫۳۵ است.`,
    });
  }
  if (!system.stringConfig.withinMppt) {
    risks.push({
      level: "warning",
      code: "string-voltage",
      message: "رشته‌بندی با بازه‌ی MPPT اینورتر سازگار نیست؛ طولِ رشته بازنگری شود.",
    });
  }
  for (const warning of system.stringConfig.warnings) {
    risks.push({ level: "info", code: "string-design", message: warning });
  }
  if (recommended.paybackYears && recommended.paybackYears > 8) {
    risks.push({
      level: "warning",
      code: "long-payback",
      message: `دوره‌ی بازگشت ${recommended.paybackYears} سال است؛ برای تأمین مالی باید بررسیِ دقیق‌تری انجام شود.`,
    });
  }
  if (capacityKwp > 1_000) {
    risks.push({
      level: "info",
      code: "grid-study",
      message: "برای ظرفیت بالای یک مگاوات، مطالعاتِ اتصال به شبکه و پست الزامی است.",
    });
  }
  if (resource.confidence !== "high") {
    risks.push({
      level: "info",
      code: "resource-confidence",
      message: `برآورد تابش بر پایه ایستگاه ${resource.nearestStation.name} در فاصله ${resource.stationDistanceKm} کیلومتری است.`,
    });
  }
  if (energyBalance.selfConsumptionRate < 0.35 && recommended.selfConsumptionShare > 0) {
    risks.push({
      level: "info",
      code: "low-self-consumption",
      message:
        "تنها بخشی از تولید هم‌زمان با مصرف است؛ افزودنِ ذخیره‌ساز یا تغییرِ شیفتِ کاری، خودمصرفی را بالا می‌برد.",
    });
  }

  assumptions.push(
    `ضریب عملکرد (PR) برآوردی ${system.performanceRatio}`,
    `پروفایل بار ${loadProfileKind} و تعرفه‌ی ${profile.label}`,
    "مالیات، استهلاک و مشوق‌های مالیاتی در این نسخه لحاظ نشده است",
  );

  return {
    meta: {
      engineVersion: SOLAR_ENGINE_VERSION,
      generatedAtIso: new Date().toISOString(),
      assumptions,
      warnings: [...warnings, ...risks.filter((risk) => risk.level !== "info").map((risk) => risk.message)],
    },
    site: {
      name: input.site.name ?? `سایت ${meta.nameFa}`,
      provinceCode,
      provinceLabel: meta.nameFa,
      lat,
      lon,
      elevationM,
    },
    resource,
    roof: {
      mode: input.roof.planes && input.roof.planes.length > 0 ? "drawn" : "estimated",
      totalAreaM2,
      usableAreaM2,
      planes: planeSummaries,
    },
    design: {
      module,
      inverterModel: inverterChoice.spec.model,
      inverterCount: inverterChoice.count,
      capacityKwp,
      acKw: inverterChoice.acKw,
      system,
    },
    production,
    energyBalance,
    bills: {
      tariffKind: input.consumption.tariffKind,
      baselineMonthly: baseline.monthly,
      baselineAnnualToman: baseline.totalToman,
      postSolarMonthly: postSolar.monthly,
      postSolarAnnualToman: postSolar.totalToman,
      annualSavingToman: Math.round(annualSavingToman),
    },
    cost,
    scenarios: scenarioResults,
    recommendedScenarioId: recommended.scenario.id,
    recommendedReason,
    sensitivity,
    environment,
    risks,
  };
}

/** ادغامِ خروجیِ شبیه‌ساز برای چند صفحه (جمعِ انرژی و میانگینِ وزنیِ شاخص‌ها) */
function aggregateProduction(results: readonly ProductionResult[]): ProductionResult {
  if (results.length === 1) return results[0]!;
  const monthlyAcKwh = new Array<number>(12).fill(0);
  const monthlyCellTempC = new Array<number>(12).fill(0);
  const monthlyHourlyShape = Array.from({ length: 12 }, () => new Array<number>(24).fill(0));
  let annualUnclipped = 0;
  let annualClipped = 0;

  for (const result of results) {
    result.monthlyAcKwh.forEach((energy, month) => {
      monthlyAcKwh[month] = (monthlyAcKwh[month] ?? 0) + energy;
    });
    result.monthlyCellTempC.forEach((temp, month) => {
      monthlyCellTempC[month] = Math.max(monthlyCellTempC[month] ?? 0, temp);
    });
    annualUnclipped += result.annualAcKwh / Math.max(0.001, 1 - result.clippingLoss);
    annualClipped += result.annualAcKwh;
    result.monthlyHourlyShape.forEach((shape, month) => {
      shape.forEach((value, hour) => {
        const target = monthlyHourlyShape[month];
        if (target) target[hour] = (target[hour] ?? 0) + value * result.annualAcKwh;
      });
    });
  }

  const annualAcKwh = Math.round(annualClipped);
  const shapes = monthlyHourlyShape.map((shape) => {
    const total = shape.reduce((sum, value) => sum + value, 0);
    return total > 0 ? shape.map((value) => value / total) : shape.map(() => 1 / 24);
  });

  const capacityKwpTotal = results.reduce(
    (sum, result) => sum + (result.specificYieldKwhPerKwp > 0 ? result.annualAcKwh / result.specificYieldKwhPerKwp : 0),
    0,
  );

  return {
    monthlyAcKwh: monthlyAcKwh.map((value) => Math.round(value)),
    annualAcKwh,
    specificYieldKwhPerKwp: capacityKwpTotal > 0 ? Math.round(annualAcKwh / capacityKwpTotal) : 0,
    capacityFactor:
      capacityKwpTotal > 0 ? Math.round((annualAcKwh / (capacityKwpTotal * 8760)) * 1000) / 1000 : 0,
    clippingLoss: annualUnclipped > 0 ? Math.round((1 - annualClipped / annualUnclipped) * 1000) / 1000 : 0,
    monthlyClippingLoss: results[0]?.monthlyClippingLoss ?? [],
    monthlyCellTempC,
    monthlyPerformanceRatio: results[0]?.monthlyPerformanceRatio ?? [],
    monthlyHourlyShape: shapes,
  };
}

function buildRecommendationReason(recommended: ScenarioResult, all: ScenarioResult[]): string {
  const parts = [
    `سناریوی «${recommended.scenario.label}» با NPV حدود ${Math.round(recommended.npvToman / 1_000_000_000)} میلیارد تومان`,
  ];
  if (recommended.paybackYears) parts.push(`بازگشت سرمایه ${recommended.paybackYears} ساله`);
  if (recommended.irr !== null) parts.push(`IRR حدود ${Math.round(recommended.irr * 100)}٪`);
  const runnerUp = all
    .filter((item) => item.scenario.id !== recommended.scenario.id)
    .sort((a, b) => b.npvToman - a.npvToman)[0];
  if (runnerUp) {
    parts.push(
      `و برتریِ ${Math.round((recommended.npvToman - runnerUp.npvToman) / 1_000_000_000)} میلیارد تومانی نسبت به «${runnerUp.scenario.label}»`,
    );
  }
  return `${parts.join("، ")} بهترین گزینه است.`;
}
