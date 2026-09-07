import { describe, expect, it } from "vitest";
import {
  clearSkyDailyGhiKwh,
  cosineZenith,
  dayLengthHours,
  diffuseFraction,
  extraterrestrialDailyHorizontalKwh,
  hourAngleDeg,
  optimalTiltDeg,
  solarDeclinationDeg,
  sunPosition,
  transpositionFactorHdkr,
  zenithDeg,
} from "./sun.js";

describe("هندسه خورشید", () => {
  it("میل خورشید در اعتدالین نزدیک صفر و در انقلاب‌ها ۲۳٫۴۴ درجه است", () => {
    expect(Math.abs(solarDeclinationDeg(80))).toBeLessThan(1.5); // حوالی ۲۱ مارس
    expect(solarDeclinationDeg(172)).toBeCloseTo(23.44, 0.2); // حوالی ۲۱ ژوئن
    expect(solarDeclinationDeg(355)).toBeCloseTo(-23.44, 0.2); // حوالی ۲۱ دسامبر
  });

  it("ماه‌های متقارنِ شمسی حولِ اعتدالین میلِ یکسان دارند", () => {
    // فروردین (۵ فروردین ≈ ۲۵ مارس) در برابر مهر (۱۶ مهر ≈ ۸ اکتبر)
    expect(Math.abs(solarDeclinationDeg(95))).toBeCloseTo(Math.abs(solarDeclinationDeg(281)), 0.3);
  });

  it("طول روز در اعتدالین حدود ۱۲ ساعت است", () => {
    expect(dayLengthHours(35.7, 80)).toBeCloseTo(12, 0);
    expect(dayLengthHours(35.7, 172)).toBeGreaterThan(14);
    expect(dayLengthHours(35.7, 355)).toBeLessThan(10);
  });

  it("ارتفاع خورشید در ظهرِ اعتدال برابر ۹۰ منهای عرض جغرافیایی است", () => {
    const { altitudeDeg } = sunPosition(35.7, 80, 12);
    expect(altitudeDeg).toBeCloseTo(90 - 35.7, 0);
  });

  it("کسرینوس زنیت در شب منفی نیست و در ظهرِ تابستان بیشینه است", () => {
    expect(cosineZenith(35.7, 0, hourAngleDeg(2))).toBe(0);
    const noonSummer = cosineZenith(35.7, 23.45, 0);
    const noonWinter = cosineZenith(35.7, -23.45, 0);
    expect(noonSummer).toBeGreaterThan(noonWinter);
  });

  it("تابش روزانه‌ی آسمان صاف در تابستان بیشتر از زمستان است", () => {
    expect(clearSkyDailyGhiKwh(35.7, 172)).toBeGreaterThan(clearSkyDailyGhiKwh(35.7, 355) * 1.5);
  });

  it("تابش فرازمینیِ روزانه در تابستان از زمستان بیشتر است", () => {
    expect(extraterrestrialDailyHorizontalKwh(35.7, 172)).toBeGreaterThan(
      extraterrestrialDailyHorizontalKwh(35.7, 355),
    );
  });

  it("کسری از تابش پراکنده با افزایش شاخص صافی کم می‌شود", () => {
    expect(diffuseFraction(0.2)).toBeGreaterThan(diffuseFraction(0.7));
    expect(diffuseFraction(0.7)).toBeGreaterThan(0);
  });

  it("زاویه‌ی زنیت در ظهر برابر عرض جغرافیایی منهای میل است", () => {
    expect(zenithDeg(35.7, 0, 0)).toBeCloseTo(35.7, 0);
  });
});

describe("انتقال تابش به سطح شیب‌دار", () => {
  it("سطح رو به جنوب در زمستان تابش بیشتری از افق می‌گیرد", () => {
    const winter = transpositionFactorHdkr({
      latDeg: 35.7,
      tiltDeg: 30,
      surfaceAzimuthDeg: 180,
      dayOfYear: 355,
    });
    expect(winter).toBeGreaterThan(1.2);
  });

  it("سطح رو به جنوب از سطح رو به شمال بهتر است", () => {
    const south = transpositionFactorHdkr({
      latDeg: 35.7,
      tiltDeg: 30,
      surfaceAzimuthDeg: 180,
      dayOfYear: 80,
    });
    const north = transpositionFactorHdkr({
      latDeg: 35.7,
      tiltDeg: 30,
      surfaceAzimuthDeg: 0,
      dayOfYear: 80,
    });
    expect(south).toBeGreaterThan(north);
  });

  it("سطح افقی ضریب انتقالِ حدود یک دارد", () => {
    const flat = transpositionFactorHdkr({
      latDeg: 35.7,
      tiltDeg: 0,
      surfaceAzimuthDeg: 180,
      dayOfYear: 172,
    });
    expect(flat).toBeCloseTo(1, 1);
  });

  it("شیب بهینه برای عرض‌های میانی ایران بین ۲۵ و ۳۲ درجه است", () => {
    expect(optimalTiltDeg(35.7)).toBeGreaterThanOrEqual(25);
    expect(optimalTiltDeg(35.7)).toBeLessThanOrEqual(32);
    expect(optimalTiltDeg(29)).toBeLessThan(optimalTiltDeg(38));
  });
});
