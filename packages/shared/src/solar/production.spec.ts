import { describe, expect, it } from "vitest";
import {
  LOAD_PROFILES,
  monthlyFromAnnual,
  monthlyPoa,
  selfConsumptionSplit,
  simulateProduction,
} from "./production.js";
import { findModule, INVERTER_CATALOG, designSystem } from "./system.js";
import { resourceForProvince } from "./climate.js";

const MODULE = findModule("mono-perc-550");
const INVERTER = INVERTER_CATALOG[1]!;
const TEHRAN = resourceForProvince("tehran");
const POA = monthlyPoa(TEHRAN, 35.7, 30, 180);

function baseInput(overrides: Partial<Parameters<typeof simulateProduction>[0]> = {}) {
  const design = designSystem({
    latDeg: 35.7,
    module: MODULE,
    inverter: INVERTER,
    inverterCount: 2,
    panelCount: 40,
    weightedSolarAccess: 0.97,
    monthlyPoaKwhM2Day: POA,
    monthlyTempC: TEHRAN.monthlyTempC,
  });
  return {
    latDeg: 35.7,
    tiltDeg: 30,
    surfaceAzimuthDeg: 180,
    monthlyPoaKwhM2Day: POA,
    monthlyTempC: TEHRAN.monthlyTempC,
    capacityKwp: 22,
    acKw: 20,
    module: MODULE,
    inverter: INVERTER,
    staticLosses: design.losses.filter((loss) => !["temperature", "shadingDerating"].includes(loss.key)),
    ...overrides,
  };
}

describe("تابش روی صفحه", () => {
  it("سطح ۳۰ درجه رو به جنوب در سال از افق بیشتر می‌گیرد", () => {
    const annualGhi = TEHRAN.monthlyGhiKwhM2Day.reduce((sum, value) => sum + value, 0);
    const annualPoa = POA.reduce((sum, value) => sum + value, 0);
    expect(annualPoa).toBeGreaterThan(annualGhi);
  });

  it("سطح رو به شمال از جنوب کمتر می‌گیرد", () => {
    const north = monthlyPoa(TEHRAN, 35.7, 30, 0).reduce((sum, value) => sum + value, 0);
    const south = POA.reduce((sum, value) => sum + value, 0);
    expect(north).toBeLessThan(south);
  });
});

describe("شبیه‌ساز تولید", () => {
  const result = simulateProduction(baseInput());

  it("تولید ماهانه ۱۲ مقدار با تابستانِ قوی‌تر است", () => {
    expect(result.monthlyAcKwh).toHaveLength(12);
    expect(result.monthlyAcKwh[3] ?? 0).toBeGreaterThan(result.monthlyAcKwh[9] ?? 0);
  });

  it("راندمان ویژه در بازه‌ی مورد انتظارِ ایران است", () => {
    expect(result.specificYieldKwhPerKwp).toBeGreaterThan(1_200);
    expect(result.specificYieldKwhPerKwp).toBeLessThan(2_300);
  });

  it("ضریب ظرفیت بین ۱۰ تا ۳۰ درصد است", () => {
    expect(result.capacityFactor).toBeGreaterThan(0.1);
    expect(result.capacityFactor).toBeLessThan(0.3);
  });

  it("تولید با ظرفیت بیشتر افزایش می‌یابد", () => {
    const bigger = simulateProduction(baseInput({ capacityKwp: 44, acKw: 40 }));
    expect(bigger.annualAcKwh).toBeGreaterThan(result.annualAcKwh * 1.8);
  });

  it("قیچی‌شدنِ اینورتر در نسبت DC/AC بالا افزایش می‌یابد", () => {
    const tight = simulateProduction(baseInput({ acKw: 40 }));
    const clipped = simulateProduction(baseInput({ acKw: 15 }));
    expect(clipped.clippingLoss).toBeGreaterThan(tight.clippingLoss);
    expect(clipped.annualAcKwh).toBeLessThan(tight.annualAcKwh + 1);
  });

  it("ضریب عملکرد ماهانه بین صفر و یک است", () => {
    for (const pr of result.monthlyPerformanceRatio) {
      expect(pr).toBeGreaterThan(0);
      expect(pr).toBeLessThan(1);
    }
  });

  it("پروفایل ساعتی نرمال است", () => {
    expect(result.monthlyHourlyShape).toHaveLength(12);
    for (const shape of result.monthlyHourlyShape) {
      expect(shape).toHaveLength(24);
      expect(shape.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 3);
      // شب‌ها تولید نداریم
      expect(shape[2] ?? 0).toBeLessThan(0.01);
    }
  });
});

describe("انطباق بار و تولید", () => {
  const production = simulateProduction(baseInput());
  const monthlyLoad = new Array(12).fill(12_000);

  it("خودمصرفی از تولید و مصرف بیشتر نیست", () => {
    const balance = selfConsumptionSplit({
      monthlyLoadKwh: monthlyLoad,
      monthlyProductionKwh: production.monthlyAcKwh,
      profile: "industrial",
      productionShapes: production.monthlyHourlyShape,
    });
    balance.monthly.forEach((month) => {
      expect(month.selfConsumedKwh).toBeLessThanOrEqual(Math.min(month.loadKwh, month.productionKwh) + 1);
      expect(month.exportedKwh).toBeGreaterThanOrEqual(-1);
      expect(month.gridImportKwh).toBeGreaterThanOrEqual(-1);
    });
  });

  it("پروفایل صنعتی (بارِ روزانه) خودمصرفیِ بیشتری از خانگی دارد", () => {
    // بارِ ماهانه در مقیاسِ تولید انتخاب می‌شود تا تفاوتِ پروفایل‌ها دیده شود
    const comparableLoad = new Array(12).fill(2_000);
    const industrial = selfConsumptionSplit({
      monthlyLoadKwh: comparableLoad,
      monthlyProductionKwh: production.monthlyAcKwh,
      profile: "industrial",
      productionShapes: production.monthlyHourlyShape,
    });
    const residential = selfConsumptionSplit({
      monthlyLoadKwh: comparableLoad,
      monthlyProductionKwh: production.monthlyAcKwh,
      profile: "residential",
      productionShapes: production.monthlyHourlyShape,
    });
    expect(residential.selfConsumptionRate).toBeLessThan(1);
    expect(industrial.selfConsumptionRate).toBeGreaterThan(residential.selfConsumptionRate);
  });

  it("با مصرفِ بسیار کم، بیشترِ تولید صادر می‌شود", () => {
    const balance = selfConsumptionSplit({
      monthlyLoadKwh: new Array(12).fill(50),
      monthlyProductionKwh: production.monthlyAcKwh,
      profile: "industrial",
      productionShapes: production.monthlyHourlyShape,
    });
    expect(balance.selfConsumptionRate).toBeLessThan(0.2);
    expect(balance.annualExportedKwh).toBeGreaterThan(production.annualAcKwh * 0.7);
  });

  it("با مصرفِ بسیار زیاد کلِ تولید در محل مصرف می‌شود", () => {
    const balance = selfConsumptionSplit({
      monthlyLoadKwh: new Array(12).fill(500_000),
      monthlyProductionKwh: production.monthlyAcKwh,
      profile: "industrial",
      productionShapes: production.monthlyHourlyShape,
    });
    expect(balance.selfConsumptionRate).toBeGreaterThan(0.9);
  });

  it("پروفایل‌های بار ۲۴ مقدارِ نرمال‌شده دارند", () => {
    for (const profile of Object.values(LOAD_PROFILES)) {
      expect(profile).toHaveLength(24);
      expect(profile.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 2);
    }
  });
});

describe("تبدیل مصرف سالانه به ماهانه", () => {
  it("مجموعِ ۱۲ ماه برابرِ مصرف سالانه است", () => {
    for (const profile of ["residential", "commercial", "industrial", "agricultural"] as const) {
      const monthly = monthlyFromAnnual(120_000, profile);
      expect(monthly).toHaveLength(12);
      expect(monthly.reduce((sum, value) => sum + value, 0)).toBeCloseTo(120_000, 6);
    }
  });

  it("صنعتی یکنواخت و خانگی تابستان‌پیک است", () => {
    const industrial = monthlyFromAnnual(120_000, "industrial");
    const residential = monthlyFromAnnual(120_000, "residential");
    expect(Math.max(...industrial) - Math.min(...industrial)).toBeLessThan(1);
    // تیر (اندیس ۳) از دی (اندیس ۹) پرمصرف‌تر است
    expect(residential[3] ?? 0).toBeGreaterThan(residential[9] ?? 0);
  });
});
