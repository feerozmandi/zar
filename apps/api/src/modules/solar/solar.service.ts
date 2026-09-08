import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@xennic/database";
import {
  MODULE_CATALOG,
  SOLAR_ENGINE_VERSION,
  buildFeasibilityReport,
  calculateSolarRoi,
  estimateSolarResource,
  evaluateBids,
  findModule,
  layoutArray,
  polygonArea,
  provinceMeta,
  resolveProvinceCode,
  summarizeLead,
  type EpcBidInput,
  type FeasibilityInput,
  type FeasibilityReport,
  type RoofPlaneInput,
  type SolarAssessInput,
  type SolarRoiInputDto,
  type EpcRequestInput,
} from "@xennic/shared";
import { PrismaService } from "../../infra/prisma/prisma.service.js";

/** نگه‌داریِ امنِ مقادیر JSON (حذفِ undefined و توابع) */
function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

/** استخراجِ مصرف سالانه از ورودیِ ذخیره‌شده‌ی ارزیابی (برای خلاصه‌ی ناشناسِ EPC) */
function annualConsumptionFromInputs(inputs: unknown): number {
  if (typeof inputs !== "object" || inputs === null) return 0;
  const consumption = (inputs as { consumption?: { monthlyKwh?: unknown } }).consumption;
  if (!Array.isArray(consumption?.monthlyKwh)) return 0;
  return consumption.monthlyKwh.reduce<number>(
    (sum, value) => sum + (typeof value === "number" ? value : 0),
    0,
  );
}

export interface FeasibilityResponse {
  siteId: string;
  assessmentId: string;
  engineVersion: string;
  report: FeasibilityReport;
}

/**
 * ماژول امکان‌سنجی نیروگاه خورشیدی — نوت ۳ §۴ (solar/*).
 *
 * تمام فرمول‌ها در `@xennic/shared` زندگی می‌کنند تا وب و API یک منطق داشته باشند؛
 * این سرویس فقط سه کار می‌کند: اعتبارسنجیِ ورودی، صدا زدنِ موتور، و ماندگاریِ گزارش.
 */
@Injectable()
export class SolarService {
  private readonly logger = new Logger(SolarService.name);

  public constructor(private readonly prisma: PrismaService) {}

  /**
   * POST /solar/feasibility — گزارش کاملِ امکان‌سنجی + ذخیره در تاریخچه.
   * خروجیِ موتور دقیقاً همان چیزی است که UI نشان می‌دهد (یک منبع حقیقت).
   */
  public async feasibility(userId: string, input: FeasibilityInput): Promise<FeasibilityResponse> {
    const report = buildFeasibilityReport(input);
    const recommended =
      report.scenarios.find((scenario) => scenario.scenario.id === report.recommendedScenarioId) ??
      report.scenarios[0];

    const site = await this.prisma.client.solarSite.create({
      data: {
        userId,
        name: input.site.name?.trim() || `سایت ${report.site.provinceLabel}`,
        province: report.site.provinceCode,
        city: null,
        lat: report.site.lat,
        lon: report.site.lon,
        address: input.site.address ?? null,
        roofAreaM2: report.roof.totalAreaM2,
        roofTiltDeg: report.roof.planes[0]?.tiltDeg ?? 30,
        azimuthDeg: report.roof.planes[0]?.azimuthDeg ?? 180,
        shadingFactor: 1 - (report.roof.planes[0]?.solarAccess ?? 1),
        monthlyConsumptionKwh: input.consumption.monthlyKwh.reduce((sum, value) => sum + value, 0) / 12,
        currentMonthlyBillToman: report.bills.baselineAnnualToman / 12,
      },
      select: { id: true },
    });

    const assessment = await this.prisma.client.solarAssessment.create({
      data: {
        siteId: site.id,
        status: "SUCCEEDED",
        engineVersion: SOLAR_ENGINE_VERSION,
        inputs: toJson(input),
        peakSunHours: report.resource.annualGhiKwhM2Day,
        capacityKwp: report.design.capacityKwp,
        annualGenerationKwh: report.production.annualAcKwh,
        performanceRatio: report.design.system.performanceRatio,
        outputs: toJson(report),
      },
      select: { id: true },
    });

    if (recommended) {
      await this.prisma.client.solarRoiResult.create({
        data: {
          assessmentId: assessment.id,
          capex: report.cost.capexTotalToman,
          annualRevenue: recommended.annualSavingToman + recommended.annualExportRevenueToman,
          annualNet:
            recommended.annualSavingToman +
            recommended.annualExportRevenueToman -
            report.cost.annualOpexToman,
          paybackYears: recommended.paybackYears ?? 99,
          npv: recommended.npvToman,
          discountRate: input.financials?.discountRate ?? 0.23,
          lifetimeGenerationKwh: recommended.cashflow.lifetimeGenerationKwh,
          co2AvoidedTons: report.environment.co2AvoidedTonsLifetime,
        },
      });
    }

    this.logger.log(
      `گزارش امکان‌سنجی ${assessment.id} ثبت شد (${report.design.capacityKwp.toFixed(1)} kWp، ` +
        `${Math.round(report.production.annualAcKwh).toLocaleString("fa-IR")} kWh/سال)`,
    );

    return {
      siteId: site.id,
      assessmentId: assessment.id,
      engineVersion: SOLAR_ENGINE_VERSION,
      report,
    };
  }

  /**
   * POST /solar/assess — مسیرِ سازگار با نسل قبل.
   * ورودیِ قدیمی (مساحت/استان/مصرف) را به مدلِ دقیق تبدیل می‌کند تا کاربرانِ فعلی
   * بدون تغییر، گزارشِ کامل‌تری بگیرند.
   */
  public async assess(userId: string, input: SolarAssessInput) {
    const provinceCode = resolveProvinceCode(input.province) ?? "tehran";
    const meta = provinceMeta(provinceCode);
    const monthlyKwh = new Array<number>(12).fill(input.monthlyConsumptionKwh ?? 0);
    // اگر کاربر قبض ماهانه داده ولی مصرف نه، مصرف را از روی قبض برآورد می‌کنیم
    if (!input.monthlyConsumptionKwh && input.currentMonthlyBillToman) {
      monthlyKwh.fill(Math.round(input.currentMonthlyBillToman / 1_500));
    }

    const feasibility: FeasibilityInput = {
      site: {
        province: provinceCode,
        lat: input.lat ?? meta?.lat,
        lon: input.lon ?? meta?.lon,
        elevationM: meta?.elevationM,
      },
      roof: {
        areaM2: input.roofAreaM2,
        tiltDeg: input.roofTiltDeg,
        azimuthDeg: input.azimuthDeg,
        shadingFactor: input.shadingFactor,
      },
      consumption: {
        monthlyKwh,
        tariffKind: "industrial",
        profile: "industrial",
      },
    };

    const { report, assessmentId, siteId } = await this.feasibility(userId, feasibility);
    return {
      siteId,
      assessmentId,
      capacityKwp: report.design.capacityKwp,
      annualGenerationKwh: report.production.annualAcKwh,
      peakSunHours: report.resource.annualGhiKwhM2Day,
      performanceRatio: report.design.system.performanceRatio,
      recommendedScenarioId: report.recommendedScenarioId,
      annualSavingToman: report.bills.annualSavingToman,
      paybackYears:
        report.scenarios.find((scenario) => scenario.scenario.id === report.recommendedScenarioId)
          ?.paybackYears ?? null,
    };
  }

  /** GET /solar/assessments/:id — بازخوانیِ گزارشِ ذخیره‌شده */
  public async assessment(userId: string, assessmentId: string) {
    const assessment = await this.prisma.client.solarAssessment.findFirst({
      where: { id: assessmentId, site: { userId } },
      select: {
        id: true,
        engineVersion: true,
        capacityKwp: true,
        annualGenerationKwh: true,
        performanceRatio: true,
        peakSunHours: true,
        status: true,
        createdAt: true,
        inputs: true,
        outputs: true,
        site: { select: { id: true, name: true, province: true } },
        roi: true,
      },
    });
    if (!assessment) throw new NotFoundException("گزارش امکان‌سنجی یافت نشد");
    return assessment;
  }

  /** GET /solar/resource — برآوردِ منبع تابش برای یک نقطه (بدون نیاز به دیتابیس) */
  public resource(query: { province?: string; lat?: number; lon?: number; elevationM?: number }) {
    if (query.lat !== undefined && query.lon !== undefined) {
      return estimateSolarResource({ lat: query.lat, lon: query.lon, elevationM: query.elevationM });
    }
    if (query.province !== undefined) {
      const meta = provinceMeta(resolveProvinceCode(query.province) ?? "tehran");
      if (meta) {
        return estimateSolarResource({ lat: meta.lat, lon: meta.lon, elevationM: meta.elevationM });
      }
    }
    return estimateSolarResource({ lat: 35.7, lon: 51.42, elevationM: 1_200 });
  }

  /**
   * POST /solar/design — پیش‌نمایشِ چیدمانِ آرایه روی سقف (طراحِ سقف).
   * محاسبه‌ی خالص است و چیزی در پایگاه‌داده نمی‌نویسد؛ UI برای بازخوردِ لحظه‌ای استفاده می‌کند.
   */
  public design(input: {
    province: string;
    lat?: number;
    lon?: number;
    plane: RoofPlaneInput;
    moduleModel?: string;
    orientation?: "portrait" | "landscape";
    maxPanels?: number;
  }) {
    const provinceCode = resolveProvinceCode(input.province) ?? "tehran";
    const meta = provinceMeta(provinceCode);
    const lat = input.lat ?? meta?.lat ?? 35.7;
    const lon = input.lon ?? meta?.lon ?? 51.42;
    const resource = estimateSolarResource({ lat, lon, elevationM: meta?.elevationM });
    const module = findModule(input.moduleModel ?? MODULE_CATALOG[0]?.model ?? "");
    const layout = layoutArray(input.plane, module, {
      latDeg: lat,
      resource,
      orientation: input.orientation,
      maxPanels: input.maxPanels,
    });
    return {
      module: { model: module.model, wattPmp: module.wattPmp },
      planeAreaM2: polygonArea(input.plane.polygon),
      layout,
    };
  }

  /** POST /solar/roi-calculator — ماشین‌حسابِ مالیِ ساده (سازگار با نسل قبل) */
  public roi(input: SolarRoiInputDto) {
    return calculateSolarRoi(input);
  }

  /** POST /solar/epc-request — ارجاع پروژه به مجریان EPC */
  public async createEpcRequest(userId: string, input: EpcRequestInput) {
    const assessment = await this.prisma.client.solarAssessment.findFirst({
      where: { id: input.assessmentId },
      select: {
        id: true,
        capacityKwp: true,
        annualGenerationKwh: true,
        inputs: true,
        site: { select: { province: true } },
      },
    });
    if (!assessment) throw new NotFoundException("ارزیابی موردنظر یافت نشد");

    const request = await this.prisma.client.epcRequest.create({
      data: {
        assessmentId: input.assessmentId,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        notes: input.notes,
        preferredSchedule: input.preferredSchedule,
        status: "NEW",
      },
      select: { id: true, status: true, preferredSchedule: true, createdAt: true },
    });

    const lead = summarizeLead({
      requestId: request.id,
      province: assessment.site.province,
      capacityKwp: assessment.capacityKwp,
      annualConsumptionKwh: annualConsumptionFromInputs(assessment.inputs),
      annualProductionKwh: assessment.annualGenerationKwh ?? 0,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      preferredSchedule: input.preferredSchedule,
      createdAt: request.createdAt,
    });

    this.logger.log(`درخواست EPC ${request.id} توسط کاربر ${userId} ثبت شد`);
    return { ...request, lead };
  }

  /**
   * POST /solar/epc-bids/compare — مقایسه‌ی پیشنهادهای پیمانکاران (مناقصه معکوس).
   * ارزان‌ترین پیشنهاد لزوماً برنده نیست؛ وزنِ تجهیزات، گارانتی، رتبه و زمان‌بندی هم اثر دارد.
   */
  public compareBids(bids: EpcBidInput[], weights?: Partial<Record<string, number>>) {
    const evaluation = evaluateBids(
      bids,
      weights
        ? {
            price: weights.price ?? 0.4,
            equipment: weights.equipment ?? 0.2,
            warranty: weights.warranty ?? 0.15,
            rating: weights.rating ?? 0.15,
            schedule: weights.schedule ?? 0.1,
          }
        : undefined,
    );
    return evaluation;
  }

  /** GET /solar/history — تاریخچه‌ی سایت‌های یک کاربر */
  public async sites(userId: string) {
    return this.prisma.client.solarSite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        province: true,
        roofAreaM2: true,
        createdAt: true,
        assessments: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            capacityKwp: true,
            annualGenerationKwh: true,
            status: true,
            engineVersion: true,
            createdAt: true,
          },
        },
      },
    });
  }
}
