/**
 * ابزارهای ریاضی پایه برای ماژول‌های جعبه‌ابزار مهندسی برق.
 * همه‌ی محاسبات عددی با همین توابع گرد/گیره می‌شوند تا خروجی یکدست بماند.
 */

/** گردکردن به تعداد رقم اعشار مشخص */
export function round(value: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/** محدودسازی عدد در بازه‌ی [min, max] */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** مجموع آرایه */
export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

/** میانگین آرایه */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}

/**
 * تانژانت معکوسِ cos(φ) با جلوگیری از تقسیم بر صفر:
 *   tan φ = √(1 − cos²φ) / cos φ
 */
export function tanOfCosPhi(cosPhi: number): number {
  const c = clamp(cosPhi, 0.05, 1);
  return Math.sqrt(Math.max(0, 1 - c * c)) / c;
}
