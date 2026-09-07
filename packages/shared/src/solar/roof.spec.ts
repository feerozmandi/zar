import { describe, expect, it } from "vitest";
import {
  capacityFromRoofArea,
  distanceToPolygonEdge,
  layoutArray,
  pointInPolygon,
  polygonArea,
  polygonCentroid,
  type RoofPlaneInput,
} from "./roof.js";
import { findModule } from "./system.js";
import { resourceForProvince } from "./climate.js";

const MODULE = findModule("mono-perc-550");
const TEHRAN = resourceForProvince("tehran");

function rectangle(width: number, height: number, tilt = 30): RoofPlaneInput {
  return {
    id: "test",
    tiltDeg: tilt,
    azimuthDeg: 180,
    polygon: [
      [-width / 2, -height / 2],
      [width / 2, -height / 2],
      [width / 2, height / 2],
      [-width / 2, height / 2],
    ],
    setbackM: 0.5,
  };
}

describe("هندسه‌ی چندضلعی", () => {
  it("مساحت مربع و مثلث درست است", () => {
    expect(polygonArea(rectangle(10, 10).polygon)).toBeCloseTo(100, 6);
    expect(
      polygonArea([
        [0, 0],
        [4, 0],
        [0, 3],
      ]),
    ).toBeCloseTo(6, 6);
  });

  it("مرکز ثقل مستطیل در میانه است", () => {
    const [cx, cy] = polygonCentroid(rectangle(10, 20).polygon);
    expect(cx).toBeCloseTo(0, 6);
    expect(cy).toBeCloseTo(0, 6);
  });

  it("آزمون داخل/خارجِ چندضلعی", () => {
    const polygon = rectangle(10, 10).polygon;
    expect(pointInPolygon([0, 0], polygon)).toBe(true);
    expect(pointInPolygon([20, 0], polygon)).toBe(false);
  });

  it("فاصله تا مرز برای نقطه‌ی مرکزیِ مستطیل برابر نصفِ ضلعِ کوچک‌تر است", () => {
    expect(distanceToPolygonEdge([0, 0], rectangle(10, 20).polygon)).toBeCloseTo(5, 6);
  });
});

describe("چیدمان آرایه", () => {
  it("روی سقف ۲۰×۱۲ متر چند ردیف پنل می‌چیند", () => {
    const layout = layoutArray(rectangle(20, 12), MODULE, { latDeg: 35.7, resource: TEHRAN });
    expect(layout.panelCount).toBeGreaterThan(10);
    expect(layout.rowCount).toBeGreaterThan(1);
    expect(layout.capacityKwp).toBeCloseTo((layout.panelCount * MODULE.wattPmp) / 1000, 1);
    expect(layout.usableAreaM2).toBeLessThan(240);
    expect(layout.gcr).toBeGreaterThan(0);
    expect(layout.gcr).toBeLessThan(0.8);
  });

  it("همه‌ی پنل‌ها داخل مرز سقف و رعایتِ حریم هستند", () => {
    const plane = rectangle(20, 12);
    const layout = layoutArray(plane, MODULE, { latDeg: 35.7, resource: TEHRAN });
    for (const panel of layout.panels) {
      expect(pointInPolygon([panel.x, panel.y], plane.polygon)).toBe(true);
      expect(distanceToPolygonEdge([panel.x, panel.y], plane.polygon)).toBeGreaterThanOrEqual(0.5);
    }
  });

  it("مانعِ بزرگ تعداد پنل‌ها را کم می‌کند", () => {
    const clean = layoutArray(rectangle(20, 12), MODULE, { latDeg: 35.7, resource: TEHRAN });
    const blocked = layoutArray(
      { ...rectangle(20, 12), obstacles: [{ x: 0, y: 0, widthM: 8, depthM: 6, heightM: 4 }] },
      MODULE,
      { latDeg: 35.7, resource: TEHRAN },
    );
    expect(blocked.panelCount).toBeLessThan(clean.panelCount);
  });

  it("مانعِ بلند دسترسی خورشیدیِ میانگین را کاهش می‌دهد", () => {
    const clean = layoutArray(rectangle(20, 12), MODULE, { latDeg: 35.7, resource: TEHRAN });
    const shaded = layoutArray(
      {
        ...rectangle(20, 12),
        obstacles: [{ x: 0, y: -3, widthM: 24, depthM: 1, heightM: 14 }],
      },
      MODULE,
      { latDeg: 35.7, resource: TEHRAN },
    );
    expect(shaded.weightedSolarAccess).toBeLessThan(clean.weightedSolarAccess);
  });

  it("سقف خیلی کوچک هیچ پنلی نمی‌گیرد و پیام می‌دهد", () => {
    const layout = layoutArray(rectangle(1, 1), MODULE, { latDeg: 35.7, resource: TEHRAN });
    expect(layout.panelCount).toBe(0);
    expect(layout.notes.length).toBeGreaterThan(0);
  });

  it("محدودیتِ بیشینه‌ی تعداد پنل اعمال می‌شود", () => {
    const layout = layoutArray(rectangle(20, 12), MODULE, {
      latDeg: 35.7,
      resource: TEHRAN,
      maxPanels: 4,
    });
    expect(layout.panelCount).toBe(4);
  });

  it("هر پنل دسترسی خورشیدی و پروفایل ماهانه دارد", () => {
    const layout = layoutArray(rectangle(20, 12), MODULE, { latDeg: 35.7, resource: TEHRAN });
    for (const panel of layout.panels) {
      expect(panel.solarAccess).toBeGreaterThan(0);
      expect(panel.solarAccess).toBeLessThanOrEqual(1);
      expect(panel.monthlyAccess).toHaveLength(12);
      expect(panel.kwp).toBeCloseTo(0.55, 2);
    }
  });

  it("برآورد سریعِ ظرفیت از مساحت با ضریب سایه کم می‌شود", () => {
    expect(capacityFromRoofArea(650, 0)).toBeCloseTo(100, 0);
    expect(capacityFromRoofArea(650, 0.5)).toBeCloseTo(50, 0);
    // پیش‌فرض ۸٪ سایه برای مسیرِ سریع
    expect(capacityFromRoofArea(650)).toBeCloseTo(capacityFromRoofArea(650, 0.08), 1);
  });
});
