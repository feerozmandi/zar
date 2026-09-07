import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import {
  calculateSolarRoi,
  capacityFromRoof,
  estimateGeneration,
  peakSunHoursFor,
  type EpcRequestInput,
  type SolarAssessInput,
  type SolarRoiInputDto,
} from "@xennic/shared";
import { PrismaService } from "../../infra/prisma/prisma.service.js";

/**
 * ماژول امکان‌سنجی نیروگاه خورشیدی — نوت ۳ §۴ (solar/*).
 * تمام فرمول‌ها در @xennic/shared زندگی می‌کنند تا وب و API یک منطق داشته باشند.
 */
@Injectable()
export class SolarService {
  private readonly logger = new Logger(SolarService.name);

  public constructor(private readonly prisma: PrismaService) {}

  /** POST /solar/assess */
  public async assess(userId: string, input: SolarAssessInput) {
    // اگر مختصات جغرافیایی داده شود، در فاز ۳ از سرویس تابشخوانی آنلاین خوانده می‌شود
    const peakSunHours =
      input.lat !== undefined && input.lon !== undefined ? 5.4 : peakSunHoursFor(input.province);
    const capacityKwp = capacityFromRoof(input.roofAreaM2, input.shadingFactor);
    const annualGenerationKwh = Math.round(estimateGeneration({ capacityKwp, peakSunHours }));

    const site = await this.prisma.client.solarSite.create({
      data: {
        userId,
        name: `بررسی ${input.province}`,
        province: input.province,
        lat: input.lat,
        lon: input.lon,
        roofAreaM2: input.roofAreaM2,
        roofTiltDeg: input.roofTiltDeg,
        azimuthDeg: input.azimuthDeg,
        shadingFactor: input.shadingFactor,
        monthlyConsumptionKwh: input.monthlyConsumptionKwh,
        currentMonthlyBillToman: input.currentMonthlyBillToman,
      },
    });

    const assessment = await this.prisma.client.solarAssessment.create({
      data: {
        siteId: site.id,
        status: "SUCCEEDED",
        inputs: { ...input },
        peakSunHours,
        capacityKwp,
        annualGenerationKwh,
        performanceRatio: 0.78,
        outputs: { annualGenerationKwh, capacityKwp, peakSunHours },
      },
      select: { id: true, capacityKwp: true, annualGenerationKwh: true, peakSunHours: true },
    });

    this.logger.log(`ارزیابی سولار ${assessment.id} برای کاربر ${userId} ثبت شد`);
    return {
      siteId: site.id,
      assessmentId: assessment.id,
      capacityKwp,
      annualGenerationKwh,
      peakSunHours,
    };
  }

  /** POST /solar/roi-calculator — محاسبه‌ی خالص، بدون نیاز به دیتابیس */
  public roi(input: SolarRoiInputDto) {
    return calculateSolarRoi(input);
  }

  /** POST /solar/epc-request — ارجاع پروژه به مجریان EPC */
  public async createEpcRequest(userId: string, input: EpcRequestInput) {
    const assessment = await this.prisma.client.solarAssessment.findFirst({
      where: { id: input.assessmentId },
    });
    if (!assessment) throw new NotFoundException("ارزیابی موردنظر یافت نشد");

    return this.prisma.client.epcRequest.create({
      data: {
        assessmentId: input.assessmentId,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        notes: input.notes,
        preferredSchedule: input.preferredSchedule,
        status: "NEW",
      },
      select: { id: true, status: true, preferredSchedule: true },
    });
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
          select: { id: true, capacityKwp: true, annualGenerationKwh: true, status: true },
        },
      },
    });
  }
}
