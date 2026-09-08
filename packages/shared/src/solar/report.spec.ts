import { describe, expect, it } from "vitest";
import { buildFeasibilityReport, SOLAR_ENGINE_VERSION, type FeasibilityInput } from "./report.js";
import { POLICY_SCENARIOS } from "./tariff.js";

const INDUSTRIAL_PLANT: FeasibilityInput = {
  site: { name: "کارخانه نمونه", province: "tehran", lat: 35.7, lon: 51.42 },
  roof: { areaM2: 500 },
  consumption: {
    monthlyKwh: Array.from({ length: 12 }, () => 20_000),
    tariffKind: "industrial",
    monthlyPeakDemandKw: Array.from({ length: 12 }, () => 80),
  },
};

const HOME: FeasibilityInput = {
  site: { province: "esfahan" },
  roof: { areaM2: 60 },
  consumption: { monthlyKwh: Array.from({ length: 12 }, () => 600), tariffKind: "residential" },
};

describe("گزارش امکان‌سنجی — کارخانه صنعتی", () => {
  const report = buildFeasibilityReport(INDUSTRIAL_PLANT);

  it("ساختارِ کامل با نسخه‌ی موتور و مفروضات دارد", () => {
    expect(report.meta.engineVersion).toBe(SOLAR_ENGINE_VERSION);
    expect(report.meta.assumptions.length).toBeGreaterThan(3);
    expect(report.meta.generatedAtIso).toContain("T");
  });

  it("سایت، منبع تابش و سقف را گزارش می‌کند", () => {
    expect(report.site.provinceCode).toBe("tehran");
    expect(report.site.provinceLabel).toBe("تهران");
    expect(report.resource.annualGhiKwhM2Day).toBeGreaterThan(4.5);
    expect(report.roof.totalAreaM2).toBeCloseTo(500, 0);
    expect(report.roof.usableAreaM2).toBeGreaterThan(0);
    expect(report.roof.planes.length).toBeGreaterThan(0);
  });

  it("ظرفیت نصبی و تجهیزات انتخاب می‌شوند", () => {
    expect(report.design.capacityKwp).toBeGreaterThan(10);
    expect(report.design.capacityKwp).toBeLessThan(200);
    expect(report.design.acKw).toBeGreaterThan(0);
    expect(report.design.system.dcAcRatio).toBeGreaterThan(0.9);
    expect(report.design.system.dcAcRatio).toBeLessThan(1.45);
    expect(report.design.system.performanceRatio).toBeGreaterThan(0.7);
    expect(report.design.system.performanceRatio).toBeLessThan(0.9);
    expect(report.design.system.stringConfig.unusedModules).toBe(0);
  });

  it("تولید سالانه در بازه‌ی واقع‌بینانه است", () => {
    expect(report.production.annualAcKwh).toBeGreaterThan(20_000);
    expect(report.production.specificYieldKwhPerKwp).toBeGreaterThan(1_300);
    expect(report.production.specificYieldKwhPerKwp).toBeLessThan(2_100);
    expect(report.production.monthlyAcKwh).toHaveLength(12);
    // بهار/تابستان پُرتولیدتر از آذر و دی
    expect(report.production.monthlyAcKwh[1] ?? 0).toBeGreaterThan(report.production.monthlyAcKwh[8] ?? 0);
  });

  it("تراز انرژی بین تولید و مصرف محاسبه می‌شود", () => {
    expect(report.energyBalance.monthly).toHaveLength(12);
    expect(report.energyBalance.selfConsumptionRate).toBeGreaterThan(0);
    expect(report.energyBalance.selfConsumptionRate).toBeLessThanOrEqual(1);
    expect(report.energyBalance.selfSufficiencyRate).toBeGreaterThan(0);
  });

  it("قبضِ بعد از احداث از قبضِ فعلی کمتر است", () => {
    expect(report.bills.postSolarAnnualToman).toBeLessThan(report.bills.baselineAnnualToman);
    expect(report.bills.annualSavingToman).toBeGreaterThan(0);
    expect(report.bills.baselineMonthly).toHaveLength(12);
  });

  it("هزینه‌ی احداث متناسب با مقیاس است", () => {
    expect(report.cost.capexTotalToman).toBeGreaterThan(0);
    expect(report.cost.capexPerKwpToman).toBeGreaterThan(10_000_000);
    expect(report.cost.breakdown.reduce((sum, item) => sum + item.share, 0)).toBeCloseTo(1, 2);
    expect(report.cost.annualOpexToman).toBeGreaterThan(0);
  });

  it("چهار سناریوی نظارتی با هم مقایسه می‌شوند", () => {
    expect(report.scenarios).toHaveLength(POLICY_SCENARIOS.length);
    for (const scenario of report.scenarios) {
      expect(scenario.scenario.legalReference.length).toBeGreaterThan(5);
      expect(scenario.cashflow.years.length).toBe(20);
      expect(scenario.cashflow.lifetimeGenerationKwh).toBeGreaterThan(0);
    }
  });

  it("سناریوی پیشنهادی بیشترین NPV را دارد و دلیل آن توضیح داده شده است", () => {
    const best = report.scenarios.reduce((a, b) => (b.npvToman > a.npvToman ? b : a));
    expect(report.recommendedScenarioId).toBe(best.scenario.id);
    expect(report.recommendedReason.length).toBeGreaterThan(20);
  });

  it("دست‌کم یک سناریو در دوره‌ی معقول بازگشت دارد", () => {
    const feasible = report.scenarios.filter(
      (scenario) => scenario.paybackYears !== null && scenario.paybackYears < 12,
    );
    expect(feasible.length).toBeGreaterThan(0);
  });

  it("تحلیل حساسیت و اثرات زیست‌محیطی تولید می‌شود", () => {
    expect(report.sensitivity.axes.length).toBeGreaterThan(3);
    expect(report.environment.co2AvoidedTonsLifetime).toBeGreaterThan(0);
    expect(report.environment.co2AvoidedTonsPerYear).toBeGreaterThan(0);
    expect(report.environment.treesPlantedEquivalent).toBeGreaterThan(0);
  });

  it("خروجی پایدار است (اجرای دوم همان اعداد را می‌دهد)", () => {
    const second = buildFeasibilityReport(INDUSTRIAL_PLANT);
    expect(second.production.annualAcKwh).toBe(report.production.annualAcKwh);
    expect(second.design.capacityKwp).toBe(report.design.capacityKwp);
    expect(second.cost.capexTotalToman).toBe(report.cost.capexTotalToman);
  });
});

describe("گزارش امکان‌سنجی — حالت‌های مختلف", () => {
  it("برای اشتراک خانگی کوچک هم گزارش می‌سازد", () => {
    const report = buildFeasibilityReport(HOME);
    expect(report.design.capacityKwp).toBeGreaterThan(0);
    expect(report.design.capacityKwp).toBeLessThan(15);
    expect(report.bills.tariffKind).toBe("residential");
    expect(report.design.system.stringConfig.modulesPerString).toBeGreaterThan(0);
  });

  it("استانِ پُرتابش تولیدِ بیشتری از استانِ کم‌تابش دارد", () => {
    const sunny = buildFeasibilityReport({
      ...INDUSTRIAL_PLANT,
      site: { province: "yazd" },
    });
    const cloudy = buildFeasibilityReport({
      ...INDUSTRIAL_PLANT,
      site: { province: "gilan" },
    });
    expect(sunny.production.specificYieldKwhPerKwp).toBeGreaterThan(cloudy.production.specificYieldKwhPerKwp);
  });

  it("سقفِ ترسیم‌شده با موانع استفاده می‌شود و سایه لحاظ می‌گردد", () => {
    const drawn = buildFeasibilityReport({
      ...INDUSTRIAL_PLANT,
      roof: {
        planes: [
          {
            id: "سقف اصلی",
            tiltDeg: 25,
            azimuthDeg: 190,
            polygon: [
              [0, 0],
              [25, 0],
              [25, 18],
              [0, 18],
            ],
            obstacles: [
              { x: 12, y: 9, widthM: 6, depthM: 5, heightM: 5 },
              { x: 0, y: -6, widthM: 40, depthM: 2, heightM: 16 },
            ],
          },
        ],
      },
    });
    expect(drawn.roof.mode).toBe("drawn");
    expect(drawn.design.capacityKwp).toBeGreaterThan(0);
    expect(drawn.roof.planes[0]?.solarAccess ?? 1).toBeLessThan(1);
    expect(drawn.risks.length).toBeGreaterThanOrEqual(0);
  });

  it("سقفِ خیلی کوچک خطای راهنما می‌دهد", () => {
    expect(() =>
      buildFeasibilityReport({
        ...INDUSTRIAL_PLANT,
        roof: { areaM2: 2 },
      }),
    ).toThrow();
  });

  it("محدودیتِ ظرفیت اعمال می‌شود", () => {
    const limited = buildFeasibilityReport({
      ...INDUSTRIAL_PLANT,
      design: { maxCapacityKwp: 10 },
    });
    expect(limited.design.capacityKwp).toBeLessThanOrEqual(11);
  });

  it("سناریوی درخواستیِ کاربر فیلتر می‌شود", () => {
    const single = buildFeasibilityReport({
      ...INDUSTRIAL_PLANT,
      scenarios: ["self-supply"],
    });
    expect(single.scenarios).toHaveLength(1);
    expect(single.recommendedScenarioId).toBe("self-supply");
  });

  it("هزینه‌ی سفارشیِ کاربر مبنای محاسبه قرار می‌گیرد", () => {
    const cheap = buildFeasibilityReport({
      ...INDUSTRIAL_PLANT,
      cost: { capexPerKwpToman: 15_000_000 },
    });
    expect(cheap.cost.capexPerKwpToman).toBe(15_000_000);
    const recommended = cheap.scenarios.find((s) => s.scenario.id === cheap.recommendedScenarioId);
    expect(recommended?.paybackYears ?? 99).toBeLessThan(5);
  });
});
