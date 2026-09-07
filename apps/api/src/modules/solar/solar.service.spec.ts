import { describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import type { PrismaService } from "../../infra/prisma/prisma.service.js";
import { SolarService } from "./solar.service.js";

interface CreatedRecords {
  sites: Array<Record<string, unknown>>;
  assessments: Array<Record<string, unknown>>;
  roi: Array<Record<string, unknown>>;
  epcRequests: Array<Record<string, unknown>>;
}

function makePrisma(overrides: { knownAssessmentId?: string } = {}) {
  const created: CreatedRecords = { sites: [], assessments: [], roi: [], epcRequests: [] };
  const knownId = overrides.knownAssessmentId ?? "assessment-1";

  return {
    created,
    client: {
      solarSite: {
        create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
          created.sites.push(data);
          return { id: "site-1" };
        }),
        findMany: vi.fn(() => [
          {
            id: "site-1",
            name: "کارخانه",
            province: "tehran",
            roofAreaM2: 500,
            createdAt: new Date("2026-01-01"),
            assessments: [
              { id: knownId, capacityKwp: 29.7, annualGenerationKwh: 49_000, status: "SUCCEEDED" },
            ],
          },
        ]),
      },
      solarAssessment: {
        create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
          created.assessments.push(data);
          return { id: "assessment-1" };
        }),
        findFirst: vi.fn(({ where }: { where: { id: string } }) => {
          if (where.id !== knownId) return null;
          return {
            id: knownId,
            capacityKwp: 29.7,
            annualGenerationKwh: 49_000,
            inputs: { consumption: { monthlyKwh: new Array(12).fill(20_000) } },
            site: { province: "tehran" },
          };
        }),
      },
      solarRoiResult: {
        create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
          created.roi.push(data);
          return { id: "roi-1" };
        }),
      },
      epcRequest: {
        create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
          created.epcRequests.push(data);
          return { id: "epc-1", status: "NEW", preferredSchedule: "quarter", createdAt: new Date() };
        }),
      },
    },
  };
}

function makeService(overrides?: { knownAssessmentId?: string }) {
  const prisma = makePrisma(overrides);
  const solar = new SolarService(prisma as unknown as PrismaService);
  return { solar, prisma };
}

const FEASIBILITY_INPUT = {
  site: { name: "کارخانه نمونه", province: "tehran" },
  roof: { areaM2: 500 },
  consumption: {
    monthlyKwh: new Array(12).fill(20_000),
    tariffKind: "industrial" as const,
    monthlyPeakDemandKw: new Array(12).fill(80),
  },
};

describe("SolarService — امکان‌سنجی", () => {
  it("گزارش کامل می‌سازد و در پایگاه‌داده می‌نویسد", async () => {
    const { solar, prisma } = makeService();
    const result = await solar.feasibility("user-1", FEASIBILITY_INPUT);

    expect(result.engineVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(result.assessmentId).toBe("assessment-1");
    expect(result.report.design.capacityKwp).toBeGreaterThan(10);
    expect(result.report.production.annualAcKwh).toBeGreaterThan(20_000);

    // سایت
    const site = prisma.created.sites[0];
    expect(site?.province).toBe("tehran");
    expect(site?.roofAreaM2).toBeCloseTo(500, 0);

    // ارزیابی: خروجیِ کاملِ گزارش در ستون outputs ذخیره می‌شود
    const assessment = prisma.created.assessments[0];
    expect(assessment?.siteId).toBe("site-1");
    expect(assessment?.engineVersion).toBe(result.engineVersion);
    expect(assessment?.capacityKwp).toBeCloseTo(result.report.design.capacityKwp, 5);
    expect(assessment?.annualGenerationKwh).toBeCloseTo(result.report.production.annualAcKwh, 0);
    const outputs = assessment?.outputs as { scenarios: unknown[]; recommendedScenarioId: string };
    expect(outputs.scenarios.length).toBeGreaterThan(1);
    expect(outputs.recommendedScenarioId).toBeTruthy();

    // سناریوی پیشنهادی در جدول ROI هم ثبت می‌شود
    expect(prisma.created.roi).toHaveLength(1);
    const roi = prisma.created.roi[0];
    expect(roi?.assessmentId).toBe("assessment-1");
    expect(roi?.capex).toBeGreaterThan(0);
  });

  it("مسیر قدیمیِ assess همان خروجیِ قبلی را به‌علاوه‌ی سناریو برمی‌گرداند", async () => {
    const { solar } = makeService();
    const result = await solar.assess("user-1", {
      province: "tehran",
      roofAreaM2: 500,
      roofTiltDeg: 30,
      azimuthDeg: 180,
      shadingFactor: 0.08,
      monthlyConsumptionKwh: 20_000,
      currentMonthlyBillToman: 30_000_000,
    });

    expect(result.capacityKwp).toBeGreaterThan(10);
    expect(result.annualGenerationKwh).toBeGreaterThan(20_000);
    expect(result.peakSunHours).toBeGreaterThan(4);
    expect(result.performanceRatio).toBeGreaterThan(0.7);
    expect(result.recommendedScenarioId).toBeTruthy();
    expect(result.annualSavingToman).toBeGreaterThan(0);
  });

  it("گزارش ذخیره‌شده را بازمی‌خوانَد و برای شناسه‌ی نامعتبر خطا می‌دهد", async () => {
    const { solar } = makeService();
    const found = await solar.assessment("user-1", "assessment-1");
    expect(found.id).toBe("assessment-1");
    await expect(solar.assessment("user-1", "نامعلوم")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("منبع تابش را بر اساس استان برمی‌گرداند", () => {
    const { solar } = makeService();
    const tehran = solar.resource({ province: "tehran" });
    const yazd = solar.resource({ province: "yazd" });
    expect(yazd.annualGhiKwhM2Day).toBeGreaterThan(tehran.annualGhiKwhM2Day);
    expect(tehran.monthlyGhiKwhM2Day).toHaveLength(12);
  });

  it("چیدمانِ آرایه را برای طراح سقف محاسبه می‌کند", () => {
    const { solar } = makeService();
    const result = solar.design({
      province: "tehran",
      plane: {
        id: "p1",
        tiltDeg: 25,
        azimuthDeg: 190,
        polygon: [
          [0, 0],
          [25, 0],
          [25, 18],
          [0, 18],
        ],
      },
    });
    expect(result.planeAreaM2).toBeCloseTo(450, 0);
    expect(result.layout.panelCount).toBeGreaterThan(20);
    expect(result.layout.capacityKwp).toBeGreaterThan(8);
    expect(result.layout.weightedSolarAccess).toBeGreaterThan(0.8);
  });
});

describe("SolarService — مارکت‌پلیس EPC", () => {
  it("درخواست را با خلاصه‌ی ناشناس ثبت می‌کند", async () => {
    const { solar, prisma } = makeService();
    const result = await solar.createEpcRequest("user-1", {
      assessmentId: "assessment-1",
      contactName: "علی رضایی",
      contactPhone: "09121234567",
      preferredSchedule: "quarter",
    });

    expect(result.id).toBe("epc-1");
    // شماره تماس نباید در خلاصه‌ی ارسالی به پیمانکاران دیده شود
    expect(result.lead.contactMasked.phone).not.toContain("09121234567");
    expect(result.lead.contactMasked.phone).toContain("•");
    expect(result.lead.capacityKwp).toBeCloseTo(29.7, 5);
    expect(result.lead.annualConsumptionKwh).toBeCloseTo(240_000, 0);
    expect(prisma.created.epcRequests[0]?.status).toBe("NEW");
  });

  it("برای ارزیابیِ نامعتبر خطای ۴۰۴ می‌دهد", async () => {
    const { solar } = makeService();
    await expect(
      solar.createEpcRequest("user-1", {
        assessmentId: "نامعلوم",
        contactName: "علی رضایی",
        contactPhone: "09121234567",
        preferredSchedule: "quarter",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("پیشنهادها را امتیازدهی می‌کند و ارزان‌ترین را لزوماً برنده نمی‌داند", () => {
    const { solar } = makeService();
    const ranked = solar.compareBids([
      {
        partnerName: "ارزان‌سازه",
        totalPriceToman: 800_000_000,
        capacityKwp: 30,
        moduleTier: 3,
        productWarrantyYears: 5,
        rating: 2.5,
        leadTimeDays: 120,
      },
      {
        partnerName: "سازه پاک",
        totalPriceToman: 950_000_000,
        capacityKwp: 30,
        moduleTier: 1,
        productWarrantyYears: 12,
        performanceWarrantyPercent: 87,
        rating: 4.6,
        leadTimeDays: 45,
      },
    ]);

    expect(ranked).toHaveLength(2);
    expect(ranked[0]?.rank).toBe(1);
    expect(ranked.find((bid) => bid.isBestValue)?.partnerName).toBe("سازه پاک");
    const cheapest = ranked.find((bid) => bid.partnerName === "ارزان‌سازه");
    const best = ranked.find((bid) => bid.partnerName === "سازه پاک");
    expect(best?.scores.total ?? 0).toBeGreaterThan(cheapest?.scores.total ?? 0);
  });

  it("تاریخچه‌ی سایت‌های کاربر را برمی‌گرداند", async () => {
    const { solar } = makeService();
    const sites = await solar.sites("user-1");
    expect(sites).toHaveLength(1);
    expect(sites[0]?.assessments).toHaveLength(1);
  });
});
