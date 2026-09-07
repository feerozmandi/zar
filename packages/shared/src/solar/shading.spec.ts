import { describe, expect, it } from "vitest";
import {
  buildHorizon,
  interRowObstacle,
  mergeHorizons,
  minimumRowPitchM,
  skyViewFactor,
  solarAccess,
  type ObstacleBox,
} from "./shading.js";
import { resourceForProvince } from "./climate.js";

const TEHRAN = resourceForProvince("tehran");

describe("افق محلی", () => {
  it("بدون مانع افق صفر و ضریب دید آسمان یک است", () => {
    const horizon = buildHorizon({ x: 0, y: 0 }, []);
    expect(horizon.every((value) => value === 0)).toBe(true);
    expect(skyViewFactor(horizon)).toBeCloseTo(1, 5);
  });

  it("مانعِ نزدیک زاویه‌ی بزرگ‌تری از همان مانع در فاصله‌ی دور می‌سازد", () => {
    const near = buildHorizon({ x: 0, y: 0 }, [{ x: 0, y: -3, widthM: 4, depthM: 1, heightM: 6 }]);
    const far = buildHorizon({ x: 0, y: 0 }, [{ x: 0, y: -30, widthM: 4, depthM: 1, heightM: 6 }]);
    expect(Math.max(...near)).toBeGreaterThan(Math.max(...far));
  });

  it("ادغامِ افق‌ها بیشینه را نگه می‌دارد", () => {
    const a = buildHorizon({ x: 0, y: 0 }, [{ x: 0, y: -3, widthM: 4, depthM: 1, heightM: 6 }]);
    const b = buildHorizon({ x: 0, y: 0 }, [{ x: 0, y: 3, widthM: 4, depthM: 1, heightM: 2 }]);
    const merged = mergeHorizons(a, b);
    expect(merged).toHaveLength(a.length);
    merged.forEach((value, index) => {
      expect(value).toBeCloseTo(Math.max(a[index] ?? 0, b[index] ?? 0), 6);
    });
  });

  it("مانعِ بلند ضریب دید آسمان را کم می‌کند", () => {
    const horizon = buildHorizon({ x: 0, y: 0 }, [
      { x: 0, y: -2, widthM: 20, depthM: 2, heightM: 8 },
      { x: 0, y: 2, widthM: 20, depthM: 2, heightM: 8 },
    ]);
    expect(skyViewFactor(horizon)).toBeLessThan(0.85);
  });
});

describe("دسترسی خورشیدی", () => {
  it("بدون مانع دسترسی کامل است", () => {
    const access = solarAccess({ latDeg: 35.7, monthlyGhiKwhM2Day: TEHRAN.monthlyGhiKwhM2Day });
    expect(access.annual).toBe(1);
    expect(access.monthly).toHaveLength(12);
    expect(access.skyViewFactor).toBe(1);
  });

  it("دیوار بلندِ جنوبی دسترسی را کاهش می‌دهد", () => {
    const wall = buildHorizon({ x: 0, y: 0 }, [{ x: 0, y: -4, widthM: 40, depthM: 1, heightM: 12 }]);
    const access = solarAccess({
      latDeg: 35.7,
      monthlyGhiKwhM2Day: TEHRAN.monthlyGhiKwhM2Day,
      horizon: wall,
      tiltDeg: 30,
      surfaceAzimuthDeg: 180,
    });
    expect(access.annual).toBeLessThan(0.95);
    expect(access.annual).toBeGreaterThan(0);
  });

  it("هرچه مانع دورتر باشد دسترسی بیشتر است", () => {
    const near = solarAccess({
      latDeg: 35.7,
      monthlyGhiKwhM2Day: TEHRAN.monthlyGhiKwhM2Day,
      horizon: buildHorizon({ x: 0, y: 0 }, [{ x: 0, y: -3, widthM: 40, depthM: 1, heightM: 10 }]),
    });
    const far = solarAccess({
      latDeg: 35.7,
      monthlyGhiKwhM2Day: TEHRAN.monthlyGhiKwhM2Day,
      horizon: buildHorizon({ x: 0, y: 0 }, [{ x: 0, y: -25, widthM: 40, depthM: 1, heightM: 10 }]),
    });
    expect(far.annual).toBeGreaterThan(near.annual);
  });

  it("دسترسی ماهانه بین صفر و یک است", () => {
    const access = solarAccess({
      latDeg: 35.7,
      monthlyGhiKwhM2Day: TEHRAN.monthlyGhiKwhM2Day,
      horizon: buildHorizon({ x: 0, y: 0 }, [{ x: 0, y: -5, widthM: 30, depthM: 1, heightM: 9 }]),
    });
    for (const value of access.monthly) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});

describe("فاصله‌گذاری ردیف‌ها", () => {
  it("گامِ ردیف با افزایش شیب و عرض جغرافیایی بیشتر می‌شود", () => {
    const flat = minimumRowPitchM({ moduleLengthM: 2.3, tiltDeg: 10, latDeg: 35.7 });
    const steep = minimumRowPitchM({ moduleLengthM: 2.3, tiltDeg: 35, latDeg: 35.7 });
    const north = minimumRowPitchM({ moduleLengthM: 2.3, tiltDeg: 30, latDeg: 38.5 });
    const south = minimumRowPitchM({ moduleLengthM: 2.3, tiltDeg: 30, latDeg: 27.2 });
    expect(steep).toBeGreaterThan(flat);
    expect(north).toBeGreaterThan(south);
  });

  it("مانعِ ردیفِ جلو ارتفاعی متناسب با شیب دارد", () => {
    const obstacle: ObstacleBox = interRowObstacle({ pitchM: 5, moduleLengthM: 2.3, tiltDeg: 30 });
    expect(obstacle.heightM).toBeCloseTo(2.3 * Math.sin((30 * Math.PI) / 180), 3);
    expect(obstacle.y).toBe(-5);
  });
});
