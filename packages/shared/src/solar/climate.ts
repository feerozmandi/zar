/**
 * منبع تابش خورشیدی ایران (اقلیم) — جایگزین جدول ساده‌ی استان‌ها در فاز قبل.
 *
 * ⚠️ سیاست داده: اعداد این فایل **برآوردِ مهندسی** از میانگین‌های سالانه‌ی اطلس تابش
 * ایران و Global Solar Atlas هستند و برای «نمونه‌ی اولیه» کافی‌اند، اما نباید مبنای
 * قرارداد قرار گیرند. در production جدول `ClimateStation` پایگاه‌داده مقدار واقعی را
 * تأمین می‌کند و `estimateSolarResource` آن را (از طریق `overrides`) بدون تغییر کد
 * جایگزین می‌کند — همان الگوی `TariffRate` در ماژول ممیزی.
 */

import {
  clearSkyDailyGhiKwh,
  MONTH_DAYS,
  representativeDayOfYear,
} from "./sun.js";
import { PROVINCES } from "./provinces.js";

export interface ClimateStation {
  /** نام فارسی ایستگاه/شهر */
  name: string;
  lat: number;
  lon: number;
  /** ارتفاع از سطح دریا (متر) */
  elevationM: number;
  /** میانگین سالانه‌ی دمای هوا (°C) */
  annualTempC: number;
  /** میانگین سالانه‌ی تابش روی سطح افقی (kWh/m²·day) */
  annualGhiKwhM2Day: number;
}

/** استان‌های ساحلی — دامنه‌ی دماییِ سالانه‌ی کمتر (تعدیل دریایی) */
const COASTAL = new Set(["gilan", "mazandaran", "golestan", "hormozgan", "bushehr", "khuzestan"]);

/** ایستگاه‌های پایه: مراکز استان‌ها */
const PROVINCE_STATIONS: readonly ClimateStation[] = PROVINCES.map((p) => ({
  name: p.capitalFa,
  lat: p.lat,
  lon: p.lon,
  elevationM: p.elevationM,
  annualTempC: p.annualTempC,
  annualGhiKwhM2Day: p.peakSunHours,
}));

/** ایستگاه‌های تکمیلی (شهرهای شاخصِ تابشی) برای بهبود درون‌یابی */
const EXTRA_STATIONS: readonly ClimateStation[] = [
  { name: "آبادان", lat: 30.34, lon: 48.3, elevationM: 3, annualTempC: 26.5, annualGhiKwhM2Day: 5.7 },
  { name: "کاشان", lat: 33.98, lon: 51.44, elevationM: 945, annualTempC: 19.4, annualGhiKwhM2Day: 5.8 },
  { name: "سیرجان", lat: 29.45, lon: 55.68, elevationM: 1730, annualTempC: 16.2, annualGhiKwhM2Day: 6.1 },
  { name: "زابل", lat: 31.03, lon: 61.5, elevationM: 483, annualTempC: 22.3, annualGhiKwhM2Day: 6.3 },
  { name: "ایرانشهر", lat: 27.2, lon: 60.68, elevationM: 591, annualTempC: 26.1, annualGhiKwhM2Day: 6.2 },
  { name: "جاسک", lat: 25.64, lon: 57.77, elevationM: 5, annualTempC: 27.4, annualGhiKwhM2Day: 5.9 },
  { name: "بندرلنگه", lat: 26.56, lon: 54.88, elevationM: 10, annualTempC: 27.2, annualGhiKwhM2Day: 5.9 },
  { name: "جیرفت", lat: 28.67, lon: 57.74, elevationM: 720, annualTempC: 23.8, annualGhiKwhM2Day: 6.0 },
  { name: "سبزوار", lat: 36.21, lon: 57.68, elevationM: 977, annualTempC: 17.0, annualGhiKwhM2Day: 5.5 },
  { name: "گناباد", lat: 34.35, lon: 58.7, elevationM: 1070, annualTempC: 17.3, annualGhiKwhM2Day: 5.7 },
  { name: "شاهرود", lat: 36.42, lon: 54.98, elevationM: 1345, annualTempC: 15.2, annualGhiKwhM2Day: 5.5 },
  { name: "کیش", lat: 26.53, lon: 53.98, elevationM: 5, annualTempC: 27.3, annualGhiKwhM2Day: 5.9 },
  { name: "خوی", lat: 38.55, lon: 44.95, elevationM: 1148, annualTempC: 12.4, annualGhiKwhM2Day: 5.0 },
  { name: "مهاباد", lat: 36.77, lon: 45.72, elevationM: 1324, annualTempC: 13.1, annualGhiKwhM2Day: 5.0 },
  { name: "مراغه", lat: 37.39, lon: 46.24, elevationM: 1477, annualTempC: 13.0, annualGhiKwhM2Day: 5.1 },
  { name: "دهلران", lat: 32.69, lon: 47.27, elevationM: 187, annualTempC: 24.4, annualGhiKwhM2Day: 5.6 },
  { name: "فسا", lat: 28.94, lon: 53.65, elevationM: 1350, annualTempC: 19.1, annualGhiKwhM2Day: 5.9 },
  { name: "بهبهان", lat: 30.6, lon: 50.24, elevationM: 320, annualTempC: 25.2, annualGhiKwhM2Day: 5.8 },
  { name: "گنبدکاووس", lat: 37.25, lon: 55.17, elevationM: 60, annualTempC: 18.1, annualGhiKwhM2Day: 4.7 },
  { name: "رامسر", lat: 36.9, lon: 50.65, elevationM: -20, annualTempC: 16.2, annualGhiKwhM2Day: 4.3 },
];

export const CLIMATE_STATIONS: readonly ClimateStation[] = [...PROVINCE_STATIONS, ...EXTRA_STATIONS];

/** فاصله‌ی بزرگ‌دایره (کیلومتر) */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export interface SolarResource {
  /** میانگین سالانه‌ی تابش روی سطح افقی (kWh/m²·day = ساعت آفتابی معادل) */
  annualGhiKwhM2Day: number;
  /** تابش روزانه‌ی هر ماه (kWh/m²·day) — ۱۲ مقدار، شروع از فروردین */
  monthlyGhiKwhM2Day: number[];
  /** انرژی تابشی هر ماه (kWh/m²·ماه) */
  monthlyIrradiationKwhM2: number[];
  /** میانگین دمای ماهانه (°C) */
  monthlyTempC: number[];
  /** میانگین دمای سالانه (°C) */
  annualTempC: number;
  /** ارتفاع برآوردیِ سایت (متر) */
  elevationM: number;
  /** ایستگاه مرجع و فاصله تا سایت */
  nearestStation: ClimateStation;
  stationDistanceKm: number;
  /** کیفیت برآورد بر اساس فاصله از ایستگاه */
  confidence: "high" | "medium" | "low";
}

export interface ResourceQuery {
  lat: number;
  lon: number;
  /** ارتفاع سایت (متر) — اگر معلوم نباشد از ایستگاه‌ها درون‌یابی می‌شود */
  elevationM?: number;
  /** مقادیر واقعی اندازه‌گیری‌شده (از پایگاه‌داده) که جایگزین برآورد می‌شوند */
  overrides?: Partial<Pick<ClimateStation, "annualGhiKwhM2Day" | "annualTempC" | "elevationM">>;
}

const EARTH_RADIUS_KM = 6371;

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return haversineKm(lat1, lon1, lat2, lon2);
}

/**
 * درون‌یابی وزن‌دارِ معکوسِ فاصله (IDW) روی نزدیک‌ترین ایستگاه‌ها.
 * چهار ایستگاهِ نزدیک با توان ۲ — پایدارتر از نزدیک‌ترین همسایه در مرز استان‌ها.
 */
function interpolateStations(lat: number, lon: number, nearest = 4) {
  const ranked = CLIMATE_STATIONS.map((station) => ({
    station,
    distance: distanceKm(lat, lon, station.lat, station.lon),
  }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, nearest);

  const head = ranked[0];
  if (!head) throw new Error("هیچ ایستگاه اقلیمی تعریف نشده است");

  if (head.distance < 1) {
    return { station: head.station, distance: head.distance, ghi: head.station.annualGhiKwhM2Day, temp: head.station.annualTempC, elevation: head.station.elevationM };
  }

  let weightSum = 0;
  let ghi = 0;
  let temp = 0;
  let elevation = 0;
  for (const entry of ranked) {
    const weight = 1 / Math.max(entry.distance, 0.5) ** 2;
    weightSum += weight;
    ghi += entry.station.annualGhiKwhM2Day * weight;
    temp += entry.station.annualTempC * weight;
    elevation += entry.station.elevationM * weight;
  }
  return {
    station: head.station,
    distance: head.distance,
    ghi: ghi / weightSum,
    temp: temp / weightSum,
    elevation: elevation / weightSum,
  };
}

/**
 * تصحیح ارتفاع: تابش با ارتفاع زیاد می‌شود (هوای رقیق‌تر و ابرناکیِ کمتر).
 * تقریبِ متداول: حدود ۵٪ به ازای هر ۱۰۰۰ متر نسبت به ایستگاه مرجع.
 */
function elevationFactor(siteElevationM: number, stationElevationM: number): number {
  const delta = (siteElevationM - stationElevationM) / 1000;
  return Math.min(1.15, Math.max(0.85, 1 + 0.05 * delta));
}

/**
 * توزیع ماهانه: سهم هر ماه از مدل آسمانِ صافِ همان عرض جغرافیایی گرفته می‌شود و
 * سپس روی میانگین سالانه مقیاس می‌خورد — نتیجه خودکار با عرض جغرافیایی سازگار است
 * (تابستان سهم بیشتر، زمستان کمتر).
 */
function distributeMonthly(annualGhi: number, lat: number): number[] {
  const clearSky = Array.from({ length: 12 }, (_, index) =>
    clearSkyDailyGhiKwh(lat, representativeDayOfYear(index)),
  );
  const weighted = clearSky.reduce((sum, value, index) => sum + value * (MONTH_DAYS[index] ?? 30), 0);
  const meanClearSky = weighted / MONTH_DAYS.reduce((sum, days) => sum + days, 0);
  if (meanClearSky <= 0) return new Array(12).fill(annualGhi) as number[];
  return clearSky.map((value) => (value / meanClearSky) * annualGhi);
}

/**
 * دمای ماهانه: مدل سینوسی با دامنه‌ی وابسته به «قاره‌ای بودن» اقلیم.
 * گرم‌ترین ماه تیر (شماره ۷) و سردترین دی (شماره ۱) است.
 */
function monthlyTemperatures(annualTempC: number, coastal: boolean): number[] {
  const amplitude = coastal ? 9.5 : 13.5;
  return Array.from({ length: 12 }, (_, index) => {
    const monthNumber = index + 3; // فروردین ≈ آوریل (شماره ۴ میلادی)
    return annualTempC + amplitude * Math.cos((2 * Math.PI * (monthNumber - 7)) / 12);
  });
}

/** برآورد کامل منبع خورشیدی برای یک نقطه (یا استان) */
export function estimateSolarResource(query: ResourceQuery): SolarResource {
  const base = interpolateStations(query.lat, query.lon);
  const elevationM = query.overrides?.elevationM ?? query.elevationM ?? base.elevation;
  const stationDistanceKm = Math.round(base.distance * 10) / 10;

  const annualGhiOverride = query.overrides?.annualGhiKwhM2Day;
  const annualGhi =
    annualGhiOverride !== undefined
      ? annualGhiOverride
      : Math.round(base.ghi * elevationFactor(elevationM, base.elevation) * 100) / 100;

  const annualTempC = query.overrides?.annualTempC ?? Math.round(base.temp * 10) / 10;
  const monthlyGhi = distributeMonthly(annualGhi, query.lat).map((v) => Math.round(v * 100) / 100);
  const monthlyIrradiation = monthlyGhi.map((value, index) =>
    Math.round(value * (MONTH_DAYS[index] ?? 30) * 10) / 10,
  );

  const coastalStation = COASTAL.has(
    PROVINCES.find((p) => p.capitalFa === base.station.name)?.code ?? "",
  );

  return {
    annualGhiKwhM2Day: Math.round(annualGhi * 100) / 100,
    monthlyGhiKwhM2Day: monthlyGhi,
    monthlyIrradiationKwhM2: monthlyIrradiation,
    monthlyTempC: monthlyTemperatures(annualTempC, coastalStation).map((v) => Math.round(v * 10) / 10),
    annualTempC,
    elevationM: Math.round(elevationM),
    nearestStation: base.station,
    stationDistanceKm,
    confidence: stationDistanceKm <= 40 ? "high" : stationDistanceKm <= 120 ? "medium" : "low",
  };
}

/** برآورد منبع برای مرکز یک استان (وقتی مختصات دقیق در دسترس نیست) */
export function resourceForProvince(code: string): SolarResource {
  const province = PROVINCES.find((p) => p.code === code) ?? PROVINCES[0];
  if (!province) throw new Error("هیچ استانی تعریف نشده است");
  return estimateSolarResource({ lat: province.lat, lon: province.lon, elevationM: province.elevationM });
}

/** فهرست ایستگاه‌ها برای لایه‌ی نقشه (نمایش مرجع داده) */
export function listStations(): ClimateStation[] {
  return CLIMATE_STATIONS.map((station) => ({ ...station }));
}

/** بزرگ‌ترین فاصله‌ی مجاز تا ایستگاه برای اطمینان (km) — برای هشدار در UI */
export const MAX_RELIABLE_STATION_DISTANCE_KM = 150;

/** شعاع زمین (km) — فقط برای مستندسازیِ محاسبات فاصله در خروجی‌ها */
export const EARTH_RADIUS = EARTH_RADIUS_KM;
