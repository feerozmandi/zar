/**
 * هندسه و تابش خورشید — پایه‌ی فیزیکی ماژول امکان‌سنجی.
 *
 * مراجع فرمول‌ها:
 *  - Duffie & Beckman, «Solar Engineering of Thermal Processes» (زاویه‌ی تابش، Rb، HDKR)
 *  - Erbs et al. (1982): تفکیک تابش پراکنده از شاخص صافی آسمان (kt)
 *  - Kasten & Young (1989): جرم هوا
 *  - ASHRAE: ضریب زاویه‌ی تابش (IAM)
 *
 * قراردادها:
 *  - زوایا به **درجه** هستند مگر این‌که نام متغیر `Rad` داشته باشد.
 *  - سمت‌الرأسِ سطح: ۱۸۰ = جنوب، ۲۷۰ = غرب، ۹۰ = شرق، ۰ = شمال (قرارداد pvlib/NREL).
 *  - زمان خورشیدی است (ساعت ۱۲ = ظهر خورشیدی)؛ اختلاف با زمان رسمی در
 *    `equationOfTimeMinutes` و تصحیح طول جغرافیایی لحاظ نشده چون محاسبه‌ها روی
 *    «روز نماینده‌ی ماه» انجام می‌شود و خطای آن ناچیز است.
 */

const DEG = Math.PI / 180;

export function degToRad(deg: number): number {
  return deg * DEG;
}

export function radToDeg(rad: number): number {
  return rad / DEG;
}

/**
 * روز نماینده‌ی هر **ماه شمسی** (وسط ماه، از فروردین).
 * مبنای محاسبات ماهانه در کل ماژول تقویمِ شمسی است: اندیس ۰ = فروردین.
 */
export const MONTH_REPRESENTATIVE_DOY = [95, 126, 157, 188, 219, 250, 281, 311, 341, 5, 35, 65] as const;

/** تعداد روز هر ماه شمسی (۶ ماه نخست ۳۱ روز، سپس ۳۰ روز و اسفند ۲۹٫۵) */
export const MONTH_DAYS = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29.5] as const;

export function representativeDayOfYear(monthIndex: number): number {
  const index = ((Math.round(monthIndex) % 12) + 12) % 12;
  return MONTH_REPRESENTATIVE_DOY[index] ?? 15;
}

/**
 * زاویه‌ی میل خورشید به درجه — سری فوریه‌ی Spencer (1971)، دقت ≈ ±۰٫۰۰۰۶ rad.
 *
 * چرا Cooper (۲۳٫۴۵·sin) کافی نیست: آن رابطه فقط یک سینوسِ ساده بر حسبِ روزِ سال
 * است و بنابراین نسبت به **انقلاب تابستانی** متقارن است؛ در حالی که طولِ فصل‌ها
 * نامساوی است (زمین در دی‌ماه در حضیض است). نتیجه‌ی عملی: در تقویم شمسی،
 * «فروردین» و «مهر» که حولِ اعتدالین متقارن‌اند، با Cooper حدود ۱٫۳ درجه اختلافِ
 * میل پیدا می‌کنند و پروفایلِ ماهانه کج می‌شود. Spencer این خطا را حذف می‌کند.
 */
export function solarDeclinationDeg(dayOfYear: number): number {
  const gamma = (2 * Math.PI * (dayOfYear - 1)) / 365;
  const declinationRad =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  return radToDeg(declinationRad);
}

/** معادله‌ی زمان (دقیقه) — رابطه‌ی Spencer */
export function equationOfTimeMinutes(dayOfYear: number): number {
  const b = degToRad((360 * (dayOfYear - 81)) / 364);
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

/** زاویه‌ی ساعتیِ طلوع/غروب (درجه؛ مقدار مثبت) — صفر در شب‌های قطبی */
export function sunriseHourAngleDeg(latDeg: number, declDeg: number): number {
  const ratio = -Math.tan(degToRad(latDeg)) * Math.tan(degToRad(declDeg));
  if (ratio <= -1) return 180; // شب قطبی نیست: خورشید تمام روز بالای افق
  if (ratio >= 1) return 0; // شب قطبی
  return radToDeg(Math.acos(ratio));
}

/** طول روز (ساعت) */
export function dayLengthHours(latDeg: number, dayOfYear: number): number {
  return (2 * sunriseHourAngleDeg(latDeg, solarDeclinationDeg(dayOfYear))) / 15;
}

/** زاویه‌ی ساعتی بر حسب ساعت خورشیدی (ظهر = ۰ و بعدازظهر مثبت است) */
export function hourAngleDeg(solarHour: number): number {
  return 15 * (solarHour - 12);
}

/** کسینوس زاویه‌ی زنیت برای یک لحظه از روز */
export function cosineZenith(latDeg: number, declDeg: number, hourAngle: number): number {
  const lat = degToRad(latDeg);
  const decl = degToRad(declDeg);
  const h = degToRad(hourAngle);
  return Math.max(0, Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(h));
}

export function zenithDeg(latDeg: number, declDeg: number, hourAngle: number): number {
  return radToDeg(Math.acos(Math.min(1, Math.max(-1, cosineZenith(latDeg, declDeg, hourAngle)))));
}

/**
 * کسینوس زاویه‌ی تابش روی سطح شیب‌دار.
 *
 * معادلِ رابطه‌ی Duffie & Beckman 1.6.2 که در آن سمت‌الرأس از **جنوب** اندازه
 * گرفته می‌شود؛ اینجا با جایگذاریِ γ←γ−۱۸۰ به قراردادِ پروژه (۱۸۰ = جنوب)
 * تبدیل شده است. همان نتیجه با ضربِ داخلیِ بردارِ خورشید در بردارِ نرمالِ سطح
 * به‌دست می‌آید: `cos(alt)·sinβ·cos(az−γ) + sin(alt)·cosβ`.
 *
 * @param tiltDeg زاویه‌ی شیب سطح از افق (۰ = افقی)
 * @param surfaceAzimuthDeg سمت‌الرأس سطح (۱۸۰ = جنوب)
 */
export function cosineIncidenceAngle(
  latDeg: number,
  tiltDeg: number,
  surfaceAzimuthDeg: number,
  declDeg: number,
  hourAngle: number,
): number {
  const lat = degToRad(latDeg);
  const beta = degToRad(tiltDeg);
  const gamma = degToRad(surfaceAzimuthDeg);
  const decl = degToRad(declDeg);
  const h = degToRad(hourAngle);

  return Math.max(
    0,
    Math.sin(decl) * Math.sin(lat) * Math.cos(beta) +
      Math.sin(decl) * Math.cos(lat) * Math.sin(beta) * Math.cos(gamma) +
      Math.cos(decl) * Math.cos(lat) * Math.cos(beta) * Math.cos(h) -
      Math.cos(decl) * Math.sin(lat) * Math.sin(beta) * Math.cos(gamma) * Math.cos(h) -
      Math.cos(decl) * Math.sin(beta) * Math.sin(gamma) * Math.sin(h),
  );
}

/** جرم هوا (Kasten & Young 1989) — ∞ زیر افق */
export function airMass(zenith: number): number {
  if (zenith >= 90) return Number.POSITIVE_INFINITY;
  return 1 / (Math.cos(degToRad(zenith)) + 0.50572 * (96.07995 - zenith) ** -1.6364);
}

const SOLAR_CONSTANT = 1361; // W/m² — مقدار پذیرفته‌شده‌ی امروزی

/** تابش فرازمینی روی سطح عمود بر پرتو (W/m²) */
export function extraterrestrialNormalIrradiance(dayOfYear: number): number {
  return SOLAR_CONSTANT * (1 + 0.033 * Math.cos(degToRad((360 * dayOfYear) / 365)));
}

/** تابش فرازمینیِ روزانه روی سطح افقی (kWh/m²·day) */
export function extraterrestrialDailyHorizontalKwh(latDeg: number, dayOfYear: number): number {
  const decl = degToRad(solarDeclinationDeg(dayOfYear));
  const lat = degToRad(latDeg);
  const sunset = degToRad(sunriseHourAngleDeg(latDeg, solarDeclinationDeg(dayOfYear)));
  const value =
    (24 / Math.PI) *
    extraterrestrialNormalIrradiance(dayOfYear) *
    (Math.cos(lat) * Math.cos(decl) * Math.sin(sunset) + sunset * Math.sin(lat) * Math.sin(decl));
  return Math.max(0, value) / 1000;
}

/** تابش کلِ آسمانِ صاف روی سطح افقی در یک لحظه (W/m²) — مدل Meinel */
export function clearSkyGhiInstant(zenith: number, dayOfYear: number): number {
  if (zenith >= 90) return 0;
  const am = airMass(zenith);
  if (!Number.isFinite(am)) return 0;
  return Math.max(
    0,
    extraterrestrialNormalIrradiance(dayOfYear) * 0.7 ** (am ** 0.678) * Math.cos(degToRad(zenith)),
  );
}

/** تابش روزانه‌ی آسمانِ صاف روی سطح افقی (kWh/m²·day) با انتگرال‌گیری ۱۰ دقیقه‌ای */
export function clearSkyDailyGhiKwh(latDeg: number, dayOfYear: number): number {
  const stepHours = 1 / 6;
  const decl = solarDeclinationDeg(dayOfYear);
  let sum = 0;
  for (let hour = 0; hour < 24; hour += stepHours) {
    const zenith = zenithDeg(latDeg, decl, hourAngleDeg(hour + stepHours / 2));
    sum += clearSkyGhiInstant(zenith, dayOfYear) * stepHours;
  }
  return sum / 1000;
}

/** کسر تابش پراکنده از شاخص صافی آسمان (Erbs et al. 1982) */
export function diffuseFraction(clearnessIndex: number): number {
  const kt = Math.min(1.1, Math.max(0, clearnessIndex));
  if (kt <= 0.22) return 1 - 0.09 * kt;
  if (kt <= 0.8) return 0.9511 - 0.1604 * kt + 4.388 * kt ** 2 - 16.638 * kt ** 3 + 12.336 * kt ** 4;
  return 0.165;
}

/**
 * ضریب انتقال تابش از سطح افقی به سطح شیب‌دار — مدل HDKR
 * (Hay–Davies–Klucher–Reindl) با آلبیدوی قابل تنظیم.
 *
 * @returns نسبتِ POA/GHI برای روز نماینده‌ی ماه (بدون بُعد؛ می‌تواند > ۱ باشد)
 */
export function transpositionFactorHdkr(options: {
  latDeg: number;
  tiltDeg: number;
  surfaceAzimuthDeg: number;
  dayOfYear: number;
  albedo?: number;
}): number {
  const { latDeg, tiltDeg, surfaceAzimuthDeg, dayOfYear } = options;
  const albedo = options.albedo ?? 0.2;
  const decl = solarDeclinationDeg(dayOfYear);
  const stepHours = 0.5;
  const beta = degToRad(tiltDeg);

  let poaSum = 0;
  let ghiSum = 0;

  for (let hour = 0; hour < 24; hour += stepHours) {
    const hourAngle = hourAngleDeg(hour + stepHours / 2);
    const cosZ = cosineZenith(latDeg, decl, hourAngle);
    if (cosZ <= 0.001) continue;
    const zenith = radToDeg(Math.acos(cosZ));
    const ghi = clearSkyGhiInstant(zenith, dayOfYear);
    if (ghi <= 0) continue;

    const extraterrestrialHorizontal = extraterrestrialNormalIrradiance(dayOfYear) * cosZ;
    const kt = extraterrestrialHorizontal > 0 ? ghi / extraterrestrialHorizontal : 0;
    const diffuseShare = diffuseFraction(kt);
    const diffuse = ghi * diffuseShare;
    const beam = ghi - diffuse;

    const cosTheta = cosineIncidenceAngle(latDeg, tiltDeg, surfaceAzimuthDeg, decl, hourAngle);
    const rb = cosTheta / cosZ;
    const anisotropyIndex = extraterrestrialHorizontal > 0 ? beam / extraterrestrialHorizontal : 0;
    const modulating = Math.sqrt(Math.max(0, beam / ghi));
    const klucher = 1 + modulating * Math.sin(beta / 2) ** 3;

    poaSum +=
      (beam + diffuse * anisotropyIndex) * rb +
      diffuse * (1 - anisotropyIndex) * ((1 + Math.cos(beta)) / 2) * klucher +
      ghi * albedo * ((1 - Math.cos(beta)) / 2);
    ghiSum += ghi;
  }

  if (ghiSum <= 0) return 1;
  // نسبتِ انرژیِ پتانسیل شیب‌دار به افقی؛ سپس روی تابش واقعیِ ماه اعمال می‌شود
  return poaSum / ghiSum;
}

/** ضریب زاویه‌ی تابش (IAM) — مدل ASHRAE برای پوشش شیشه‌ای پنل */
export function incidenceAngleModifier(incidenceDeg: number, b0 = 0.05): number {
  if (incidenceDeg >= 90) return 0;
  return Math.max(0, 1 - b0 * (1 / Math.cos(degToRad(incidenceDeg)) - 1));
}

/** موقعیت خورشید (ارتفاع و سمت از شمال، در جهت عقربه‌های ساعت) */
export function sunPosition(
  latDeg: number,
  dayOfYear: number,
  solarHour: number,
): { altitudeDeg: number; azimuthDeg: number } {
  const decl = degToRad(solarDeclinationDeg(dayOfYear));
  const lat = degToRad(latDeg);
  const h = degToRad(hourAngleDeg(solarHour));

  const sinAlt = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(h);
  const altitude = radToDeg(Math.asin(Math.min(1, Math.max(-1, sinAlt))));

  const cosAz =
    (Math.sin(decl) - Math.sin(lat) * sinAlt) /
    (Math.cos(lat) * Math.cos(Math.asin(Math.min(1, Math.max(-1, sinAlt)))));
  let azimuth = radToDeg(Math.acos(Math.min(1, Math.max(-1, cosAz))));
  if (solarHour > 12) azimuth = 360 - azimuth;
  return { altitudeDeg: altitude, azimuthDeg: azimuth };
}

/**
 * شیب بهینه‌ی سالانه برای یک عرض جغرافیایی — تقریبِ متداول صنعت
 * (برای نصب‌های پشت‌بامی در ایران ≈ عرض جغرافیایی منهای ۵ درجه)
 */
export function optimalTiltDeg(latDeg: number): number {
  return Math.round(Math.max(0, latDeg * 0.87 - 3));
}

/** افت توانِ نسبیِ ناشی از انحراف از جهت‌گیری/شیب بهینه (برای پیام‌های راهنما) */
export function orientationPenalty(tiltDeg: number, azimuthDeg: number, latDeg: number): number {
  const optimal = optimalTiltDeg(latDeg);
  const azimuthFromSouth = Math.abs(((azimuthDeg - 180 + 540) % 360) - 180);
  const tiltGap = Math.abs(tiltDeg - optimal);
  // انحرافِ شیب تا ۱۵ درجه ≈ ۱٫۵٪ افت به ازای هر ۵ درجه؛ انحرافِ سمت تا ۴۵ درجه ≈ ۳٪
  return Math.min(0.25, (tiltGap / 5) * 0.015 + (Math.min(azimuthFromSouth, 90) / 45) * 0.03);
}
