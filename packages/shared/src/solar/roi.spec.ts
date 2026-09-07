import { describe, expect, it } from "vitest";
import {
  buildCashflow,
  calculateSolarRoi,
  discountedPaybackYears,
  estimateGeneration,
  irr,
  lcoeTomanPerKwh,
  mirr,
  npv,
  sensitivityAnalysis,
  type CashflowInput,
} from "./roi.js";

const CASHFLOW: CashflowInput = {
  firstYearProductionKwh: 160_000,
  degradationPerYear: 0.005,
  capexToman: 3_000_000_000,
  annualOpexToman: 30_000_000,
  opexEscalation: 0.18,
  inverterReplacement: { year: 11, costToman: 300_000_000 },
  selfConsumptionShare: 0.7,
  offsetPriceTomanPerKwh: 3_600,
  exportPriceTomanPerKwh: 7_500,
  tariffEscalation: 0.18,
  exportPriceEscalation: 0.12,
  years: 20,
  discountRate: 0.23,
};

describe("ابزارهای مالی", () => {
  it("NPV با نرخِ صفر برابرِ مجموعِ جریان نقدی است", () => {
    expect(npv(0, [-100, 60, 60])).toBeCloseTo(20, 6);
  });

  it("IRR برای یک جریانِ ساده درست محاسبه می‌شود", () => {
    // سرمایه ۱۰۰، سپس ۶۰ در دو سال → IRR ≈ ۱۳٪
    const rate = irr([-100, 60, 60]);
    expect(rate).not.toBeNull();
    expect(rate ?? 0).toBeGreaterThan(0.12);
    expect(rate ?? 0).toBeLessThan(0.14);
  });

  it("IRR برای پروژه‌ی همواره منفی تعریف ندارد", () => {
    expect(irr([-100, -10, -20])).toBeNull();
  });

  it("MIRR بین صفر و IRRِ خوش‌بینانه است", () => {
    const result = mirr([-100, 60, 60]);
    expect(result).not.toBeNull();
    expect(result ?? 0).toBeGreaterThan(0);
    expect(result ?? 0).toBeLessThan(0.2);
  });

  it("دوره‌ی بازگشتِ تنزیل‌شده از دوره‌ی ساده بزرگ‌تر است", () => {
    const flows = [-100, 50, 50, 50];
    expect(discountedPaybackYears(flows, 0.2)).toBeGreaterThan(2);
  });

  it("LCOE با هزینه‌ی بیشتر افزایش و با تولیدِ بیشتر کاهش می‌یابد", () => {
    const base = lcoeTomanPerKwh({
      capexToman: 1_000_000_000,
      annualOpexToman: 10_000_000,
      annualProductionKwh: new Array(20).fill(100_000),
      discountRate: 0.2,
    });
    const pricier = lcoeTomanPerKwh({
      capexToman: 1_500_000_000,
      annualOpexToman: 10_000_000,
      annualProductionKwh: new Array(20).fill(100_000),
      discountRate: 0.2,
    });
    const productive = lcoeTomanPerKwh({
      capexToman: 1_000_000_000,
      annualOpexToman: 10_000_000,
      annualProductionKwh: new Array(20).fill(150_000),
      discountRate: 0.2,
    });
    expect(pricier).toBeGreaterThan(base);
    expect(productive).toBeLessThan(base);
  });
});

describe("جریان نقدی", () => {
  const result = buildCashflow(CASHFLOW);

  it("به تعدادِ سال‌های تحلیل ردیف دارد", () => {
    expect(result.years).toHaveLength(20);
    expect(result.years[0]?.year).toBe(1);
    expect(result.years[19]?.year).toBe(20);
  });

  it("تولید با نرخ افت سالانه کم می‌شود", () => {
    const first = result.years[0]?.productionKwh ?? 0;
    const last = result.years[19]?.productionKwh ?? 0;
    expect(last).toBeLessThan(first);
    expect(last).toBeCloseTo(first * 0.995 ** 19, -2);
  });

  it("سالِ یازدهم هزینه‌ی تعویض اینورتر دارد", () => {
    expect(result.years[10]?.replacementToman).toBe(300_000_000);
    expect(result.years[9]?.replacementToman).toBe(0);
  });

  it("تجمعیِ پایانِ دوره با NPV هم‌راستا است", () => {
    const last = result.years[19]?.cumulativeToman ?? 0;
    expect(last).toBeGreaterThan(0);
    expect(result.npvToman).toBeLessThan(last);
  });

  it("پروژه‌ی اقتصادی NPV مثبت و IRR بالاتر از نرخ تنزیل دارد", () => {
    expect(result.npvToman).toBeGreaterThan(0);
    expect(result.irr ?? 0).toBeGreaterThan(0.23);
  });

  it("LCOE در بازه‌ی معقول است و با نرخ تنزیل بالا می‌رود", () => {
    expect(result.lcoeTomanPerKwh).toBeGreaterThan(1_000);
    expect(result.lcoeTomanPerKwh).toBeLessThan(10_000);
    const cheap = lcoeTomanPerKwh({
      capexToman: CASHFLOW.capexToman,
      annualOpexToman: CASHFLOW.annualOpexToman,
      replacementCostsToman: CASHFLOW.inverterReplacement ? [CASHFLOW.inverterReplacement] : [],
      annualProductionKwh: Array.from({ length: 20 }, (_, index) => 160_000 * 0.995 ** index),
      discountRate: 0.05,
    });
    expect(cheap).toBeLessThan(result.lcoeTomanPerKwh);
  });

  it("با سرمایه‌ی بیشتر، بازگشت سرمایه طولانی‌تر می‌شود", () => {
    const expensive = buildCashflow({ ...CASHFLOW, capexToman: 6_000_000_000 });
    expect(expensive.simplePaybackYears ?? 99).toBeGreaterThan(result.simplePaybackYears ?? 0);
    expect(expensive.npvToman).toBeLessThan(result.npvToman);
  });

  it("پروژه‌ی بدون درآمد بازگشت ندارد", () => {
    const noRevenue = buildCashflow({
      ...CASHFLOW,
      offsetPriceTomanPerKwh: 0,
      exportPriceTomanPerKwh: 0,
    });
    expect(noRevenue.npvToman).toBeLessThan(0);
    expect(noRevenue.irr).toBeNull();
  });
});

describe("تحلیل حساسیت", () => {
  const sensitivity = sensitivityAnalysis(CASHFLOW);

  it("برای هر محور مقدار دارد", () => {
    expect(sensitivity.axes.length).toBeGreaterThan(3);
    for (const axis of sensitivity.axes) {
      expect(axis.npvToman).toHaveLength(axis.deltas.length);
    }
  });

  it("افزایشِ سرمایه NPV را کم و کاهشِ آن NPV را زیاد می‌کند", () => {
    const capex = sensitivity.axes.find((axis) => axis.label === "هزینه‌ی احداث");
    const values = capex?.npvToman ?? [];
    expect(values[0] ?? 0).toBeGreaterThan(values[values.length - 1] ?? 0);
  });

  it("تابشِ بیشتر NPV را افزایش می‌دهد", () => {
    const irradiation = sensitivity.axes.find((axis) => axis.label === "تابش سالانه");
    const values = irradiation?.npvToman ?? [];
    expect(values[values.length - 1] ?? 0).toBeGreaterThan(values[0] ?? 0);
  });

  it("جدولِ دوبعدیِ NPV تولید می‌شود", () => {
    expect(sensitivity.grid.values).toHaveLength(sensitivity.grid.capexDeltas.length);
    for (const row of sensitivity.grid.values) {
      expect(row).toHaveLength(sensitivity.grid.productionDeltas.length);
    }
  });
});

describe("سازگاری با ماشین‌حسابِ قدیمی", () => {
  const roi = calculateSolarRoi({
    capacityKwp: 10,
    peakSunHours: 5.6,
    capexPerKwp: 550_000_000,
    feedInTariff: 12_000,
    offsetTariff: 8_000,
    annualOpex: 15_000_000,
  });

  it("فیلدهای قدیمیِ خروجی حفظ شده‌اند", () => {
    expect(roi.annualGenerationKwh).toBeGreaterThan(10_000);
    expect(Number.isFinite(roi.simplePaybackYears)).toBe(true);
    expect(roi.capex).toBe(5_500_000_000);
    expect(roi.lifetimeGenerationKwh).toBeGreaterThan(roi.annualGenerationKwh);
    expect(roi.co2AvoidedTons).toBeGreaterThan(0);
  });

  it("فیلدهای جدید هم پر شده‌اند", () => {
    expect(roi.yearly.length).toBe(20);
    expect(roi.lcoeTomanPerKwh).toBeGreaterThan(0);
    expect(roi.assumptions.length).toBeGreaterThan(0);
  });

  it("تولید با ظرفیت و تابش رابطه‌ی خطی دارد", () => {
    const small = estimateGeneration({ capacityKwp: 5, peakSunHours: 5.6 });
    const big = estimateGeneration({ capacityKwp: 10, peakSunHours: 5.6 });
    expect(big).toBeCloseTo(small * 2, 3);
  });
});
