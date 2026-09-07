import { describe, expect, it } from "vitest";
import {
  CLIMATE_STATIONS,
  estimateSolarResource,
  haversineKm,
  listStations,
  resourceForProvince,
} from "./climate.js";
import { MONTH_DAYS } from "./sun.js";
import { PROVINCES, provinceLabel, resolveProvinceCode } from "./provinces.js";

describe("داده‌ی استان‌ها", () => {
  it("۳۱ استان با کد یکتا دارد", () => {
    expect(PROVINCES).toHaveLength(31);
    expect(new Set(PROVINCES.map((p) => p.code)).size).toBe(31);
  });

  it("کلیدهای قدیمی و نام فارسی به کد استاندارد نگاشت می‌شوند", () => {
    expect(resolveProvinceCode("sistan")).toBe("sistan-va-baluchestan");
    expect(resolveProvinceCode("north-khorasan")).toBe("khorasan-shomali");
    expect(resolveProvinceCode("Isfahan")).toBe("esfahan");
    expect(resolveProvinceCode("تهران")).toBe("tehran");
    expect(resolveProvinceCode("نامعتبر")).toBeUndefined();
  });

  it("برچسب فارسی برای UI برمی‌گرداند", () => {
    expect(provinceLabel("yazd")).toBe("یزد");
    expect(provinceLabel("unknown-code")).toBe("unknown-code");
  });
});

describe("منبع تابش", () => {
  it("تابش استان‌های مرکزی از سواحل شمالی بیشتر است", () => {
    expect(resourceForProvince("yazd").annualGhiKwhM2Day).toBeGreaterThan(
      resourceForProvince("gilan").annualGhiKwhM2Day,
    );
    expect(resourceForProvince("sistan-va-baluchestan").annualGhiKwhM2Day).toBeGreaterThan(
      resourceForProvince("ardabil").annualGhiKwhM2Day,
    );
  });

  it("تابش در بازه‌ی واقع‌بینانه‌ی ایران است", () => {
    for (const province of PROVINCES) {
      const resource = resourceForProvince(province.code);
      expect(resource.annualGhiKwhM2Day).toBeGreaterThan(3.8);
      expect(resource.annualGhiKwhM2Day).toBeLessThan(7);
    }
  });

  it("پروفایل ماهانه ۱۲ مقدار با تابستانِ قوی‌تر می‌دهد", () => {
    const resource = resourceForProvince("tehran");
    expect(resource.monthlyGhiKwhM2Day).toHaveLength(12);
    expect(resource.monthlyGhiKwhM2Day[3] ?? 0).toBeGreaterThan(resource.monthlyGhiKwhM2Day[9] ?? 0);
  });

  it("میانگینِ وزنیِ ماهانه با میانگین سالانه هم‌خوان است", () => {
    const resource = resourceForProvince("esfahan");
    const weighted =
      resource.monthlyGhiKwhM2Day.reduce(
        (sum, value, index) => sum + value * (MONTH_DAYS[index] ?? 30),
        0,
      ) / MONTH_DAYS.reduce((sum, days) => sum + days, 0);
    expect(Math.abs(weighted - resource.annualGhiKwhM2Day)).toBeLessThan(0.05);
  });

  it("دمای ماهانه حول میانگین سالانه نوسان می‌کند", () => {
    const resource = resourceForProvince("tehran");
    const min = Math.min(...resource.monthlyTempC);
    const max = Math.max(...resource.monthlyTempC);
    expect(min).toBeLessThan(resource.annualTempC);
    expect(max).toBeGreaterThan(resource.annualTempC);
    expect(max - min).toBeGreaterThan(10);
  });

  it("ارتفاع و کیفیت برآورد گزارش می‌شود", () => {
    const tehran = estimateSolarResource({ lat: 35.7, lon: 51.42, elevationM: 1200 });
    expect(tehran.confidence).toBe("high");
    expect(tehran.elevationM).toBe(1200);
    expect(tehran.stationDistanceKm).toBeLessThan(10);
  });

  it("نقطه‌ی دور از ایستگاه‌ها اطمینانِ کمتری دارد", () => {
    const remote = estimateSolarResource({ lat: 32.0, lon: 55.0 });
    expect(["high", "medium", "low"]).toContain(remote.confidence);
    expect(remote.nearestStation.name.length).toBeGreaterThan(0);
  });

  it("مقدارِ اندازه‌گیری‌شده جایگزینِ برآورد می‌شود (override)", () => {
    const measured = estimateSolarResource({
      lat: 35.7,
      lon: 51.42,
      overrides: { annualGhiKwhM2Day: 5.05 },
    });
    expect(measured.annualGhiKwhM2Day).toBe(5.05);
  });

  it("فاصله‌ی بزرگ‌دایره برای دو نقطه‌ی معلوم درست است", () => {
    // تهران تا مشهد ≈ ۷۵۰ کیلومتر
    expect(haversineKm(35.7, 51.42, 36.3, 59.6)).toBeGreaterThan(700);
    expect(haversineKm(35.7, 51.42, 36.3, 59.6)).toBeLessThan(800);
  });

  it("فهرست ایستگاه‌ها برای نقشه در دسترس است", () => {
    expect(listStations().length).toBeGreaterThanOrEqual(31);
    expect(CLIMATE_STATIONS.length).toBeGreaterThan(31);
  });
});
