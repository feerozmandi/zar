/**
 * تابش روزانه‌ی معادل (Peak Sun Hours) — لایه‌ی سازگار با نسخه‌ی قبل.
 *
 * ⚠️ این فایل فقط برای **سازگاریِ عقب‌رو** نگه داشته شده است: جدول زیر اکنون از
 * `provinces.ts` (تک‌منبع حقیقتِ استان‌ها) ساخته می‌شود. برای محاسباتِ جدید از
 * `estimateSolarResource` در `climate.ts` استفاده کنید که درون‌یابیِ مکانی،
 * پروفایل ماهانه و دما را هم می‌دهد.
 */

import { PROVINCES } from "./provinces.js";

/** @deprecated از `PROVINCES` استفاده کنید */
export const PROVINCE_PEAK_SUN_HOURS: Record<string, number> = Object.fromEntries(
  PROVINCES.map((province) => [province.code, province.peakSunHours]),
);

/** سطح لازم برای هر کیلووات نصبی (متر مربع) — پنل‌های ۵۵۰ واتی موجود در بازار */
export const AREA_PER_KWP_M2 = 6.5;

/** @deprecated از `estimateSolarResource` استفاده کنید */
export function peakSunHoursFor(province: string): number {
  return PROVINCE_PEAK_SUN_HOURS[province] ?? 5.2;
}

/** @deprecated از `layoutArray` در `roof.ts` استفاده کنید */
export function capacityFromRoof(roofAreaM2: number, shadingFactor = 0.08): number {
  const usable = roofAreaM2 * (1 - Math.min(Math.max(shadingFactor, 0), 0.9));
  return Math.round((usable / AREA_PER_KWP_M2) * 10) / 10;
}
