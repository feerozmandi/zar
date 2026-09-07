/**
 * تحلیل سایه (Shade Analysis) — هسته‌ی شبیه‌سازِ «Project Sunroof».
 *
 * ایده: هر نقطه از سقف یک «افق محلی» (Horizon Profile) دارد که در ۳۶ بازه‌ی سمت،
 * بیشترین زاویه‌ی ارتفاعِ موانع را نگه می‌دارد. سپس مسیر خورشید در روزهای نماینده‌ی
 * هر ماه روی این افق پیمایش می‌شود و سهمِ تابشِ دریافتیِ نقطه به تابشِ بدون سایه
 * (Solar Access) به‌دست می‌آید — همان عددی که Sunroof برای هر پنل رنگ می‌کند.
 *
 * سهم تابش پراکنده با «ضریب دید آسمان» (Sky View Factor) و سهم تابش بازتابی با
 * ضریب دید زمین کاهش می‌یابد؛ بنابراین مانع بلندِ دور افتِ کمتری از مانع نزدیک دارد.
 */

import {
  clearSkyGhiInstant,
  cosineZenith,
  diffuseFraction,
  extraterrestrialNormalIrradiance,
  hourAngleDeg,
  MONTH_DAYS,
  representativeDayOfYear,
  solarDeclinationDeg,
  sunPosition,
  zenithDeg,
} from "./sun.js";

/** مانعِ جعبه‌ای روی/پیرامون صفحه (دستگاه مختصات صفحه بر حسب متر) */
export interface ObstacleBox {
  /** مختصاتِ مرکز مانع در صفحه */
  x: number;
  y: number;
  /** پهنا در راستای x (متر) */
  widthM: number;
  /** عمق در راستای y (متر) */
  depthM: number;
  /** ارتفاع مانع از سطح صفحه (متر) */
  heightM: number;
  label?: string;
}

export const HORIZON_BINS = 36;

/** نماینده‌ی افق: بیشینه‌ی زاویه‌ی ارتفاع مانع در هر بازه‌ی ۱۰ درجه از سمت (۰ = شمال) */
export type HorizonProfile = number[];

function normalizeAzimuth(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** فاصله‌ی نقطه تا مستطیل (صفر اگر داخل باشد) */
function distanceToBox(pointX: number, pointY: number, box: ObstacleBox): number {
  const dx = Math.max(Math.abs(pointX - box.x) - box.widthM / 2, 0);
  const dy = Math.max(Math.abs(pointY - box.y) - box.depthM / 2, 0);
  return Math.hypot(dx, dy);
}

/**
 * ساخت افق محلی برای یک نقطه از سقف.
 * هر مانع به‌صورت یک بازه‌ی زاویه‌ای (سمت) با ارتفاع ثابت روی افق می‌نشیند.
 */
export function buildHorizon(
  focus: { x: number; y: number },
  obstacles: readonly ObstacleBox[],
): HorizonProfile {
  const horizon = new Array<number>(HORIZON_BINS).fill(0);

  for (const box of obstacles) {
    const distance = distanceToBox(focus.x, focus.y, box);
    if (distance < 0.05) continue;
    if (box.heightM <= 0) continue;

    // گوشه‌های مستطیل نسبت به نقطه‌ی کانونی (سمتِ هر گوشه)
    const corners: Array<[number, number]> = [
      [box.x - box.widthM / 2 - focus.x, box.y - box.depthM / 2 - focus.y],
      [box.x + box.widthM / 2 - focus.x, box.y - box.depthM / 2 - focus.y],
      [box.x + box.widthM / 2 - focus.x, box.y + box.depthM / 2 - focus.y],
      [box.x - box.widthM / 2 - focus.x, box.y + box.depthM / 2 - focus.y],
    ];
    const bearings = corners.map(([dx, dy]) => normalizeAzimuth((Math.atan2(dx, dy) * 180) / Math.PI));
    const minBearing = Math.min(...bearings);
    const maxBearing = Math.max(...bearings);
    const wraps = maxBearing - minBearing > 180;

    const elevationDeg = (Math.atan2(box.heightM, Math.max(distance, 0.1)) * 180) / Math.PI;

    for (let bin = 0; bin < HORIZON_BINS; bin += 1) {
      const binCenter = (bin + 0.5) * (360 / HORIZON_BINS);
      const inSpan = wraps
        ? normalizeAzimuth(binCenter) >= minBearing || normalizeAzimuth(binCenter) <= maxBearing
        : binCenter >= minBearing && binCenter <= maxBearing;
      if (inSpan) horizon[bin] = Math.max(horizon[bin] ?? 0, elevationDeg);
    }
  }

  return horizon;
}

/** ادغام چند افق (مثلاً موانع سقف + موانع دوردستِ محوطه) */
export function mergeHorizons(...profiles: HorizonProfile[]): HorizonProfile {
  const merged = new Array<number>(HORIZON_BINS).fill(0);
  for (const profile of profiles) {
    for (let bin = 0; bin < HORIZON_BINS; bin += 1) {
      merged[bin] = Math.max(merged[bin] ?? 0, profile[bin] ?? 0);
    }
  }
  return merged;
}

/**
 * ضریب دید آسمان (SVF): کسرِ نیم‌کره‌ی آسمان که از نقطه دیده می‌شود.
 * با انتگرال‌گیریِ cos² روی ارتفاعِ افق در هر بازه محاسبه می‌شود.
 */
export function skyViewFactor(horizon: HorizonProfile): number {
  let sum = 0;
  for (let bin = 0; bin < HORIZON_BINS; bin += 1) {
    const elevation = ((horizon[bin] ?? 0) * Math.PI) / 180;
    sum += Math.cos(elevation) ** 2;
  }
  return sum / HORIZON_BINS;
}

export interface SolarAccessInput {
  latDeg: number;
  /** تابش روزانه‌ی ماهانه روی افق (kWh/m²·day) — برای وزن‌دهی ماه‌ها */
  monthlyGhiKwhM2Day: readonly number[];
  /** افق محلی (اگر نباشد، بدون سایه فرض می‌شود) */
  horizon?: HorizonProfile;
  tiltDeg?: number;
  surfaceAzimuthDeg?: number;
  albedo?: number;
}

export interface SolarAccessResult {
  /** کسر تابش دریافتیِ هر ماه نسبت به حالت بدون سایه */
  monthly: number[];
  /** دسترسی خورشیدیِ سالانه (۰ تا ۱) — عددی که Sunroof نمایش می‌دهد */
  annual: number;
  /** ضریب دید آسمان */
  skyViewFactor: number;
}

/**
 * محاسبه‌ی دسترسی خورشیدی با پیمایش زمانیِ ۳۰ دقیقه‌ای روی روز نماینده‌ی هر ماه.
 *
 * وزن‌دهی با تابش آسمانِ صاف انجام می‌شود، نه تابش واقعیِ ماه؛ چون نسبتِ
 * «دریافتی/بدون‌سایه» برای یک هندسه ثابت، به مقدار مطلق تابش وابسته نیست.
 */
export function solarAccess(input: SolarAccessInput): SolarAccessResult {
  const { latDeg, monthlyGhiKwhM2Day, horizon } = input;
  const tilt = input.tiltDeg ?? 0;
  const albedo = input.albedo ?? 0.2;

  const svf = horizon ? skyViewFactor(horizon) : 1;
  const diffuseShape = (1 + Math.cos((tilt * Math.PI) / 180)) / 2;
  const reflectedShape = (1 - Math.cos((tilt * Math.PI) / 180)) / 2;

  const monthly: number[] = [];
  let weightedAccess = 0;
  let weightTotal = 0;

  for (let month = 0; month < 12; month += 1) {
    const dayOfYear = representativeDayOfYear(month);
    const decl = solarDeclinationDeg(dayOfYear);
    let received = 0;
    let unshaded = 0;

    for (let hour = 0; hour < 24; hour += 0.5) {
      const sunHour = hour + 0.25;
      const cosZ = cosineZenith(latDeg, decl, hourAngleDeg(sunHour));
      if (cosZ <= 0.001) continue;
      const zenith = zenithDeg(latDeg, decl, hourAngleDeg(sunHour));
      const ghi = clearSkyGhiInstant(zenith, dayOfYear);
      if (ghi <= 0) continue;

      const extraterrestrial = extraterrestrialNormalIrradiance(dayOfYear) * cosZ;
      const clearness = extraterrestrial > 0 ? ghi / extraterrestrial : 0;
      const diffuseShare = diffuseFraction(clearness);
      const beam = ghi * (1 - diffuseShare);
      const diffuse = ghi * diffuseShare;

      // تابش مستقیم: اگر خورشید زیر افقِ محلی باشد حذف می‌شود
      const { altitudeDeg, azimuthDeg } = sunPosition(latDeg, dayOfYear, sunHour);
      let beamVisible = 1;
      if (horizon) {
        const bin = Math.floor(normalizeAzimuth(azimuthDeg) / (360 / HORIZON_BINS)) % HORIZON_BINS;
        beamVisible = altitudeDeg > (horizon[bin] ?? 0) ? 1 : 0;
      }

      const potential = beam + diffuse * diffuseShape + ghi * albedo * reflectedShape;
      const actual = beam * beamVisible + diffuse * diffuseShape * svf + ghi * albedo * reflectedShape * svf;

      received += actual;
      unshaded += potential;
    }

    const access = unshaded > 0 ? Math.min(1, Math.max(0, received / unshaded)) : 1;
    monthly.push(Math.round(access * 1000) / 1000);

    const monthWeight = (monthlyGhiKwhM2Day[month] ?? 1) * (MONTH_DAYS[month] ?? 30);
    weightedAccess += access * monthWeight;
    weightTotal += monthWeight;
  }

  return {
    monthly,
    annual: weightTotal > 0 ? Math.round((weightedAccess / weightTotal) * 1000) / 1000 : 1,
    skyViewFactor: Math.round(svf * 1000) / 1000,
  };
}

/**
 * ردیف‌بندی پنل‌ها: فاصله‌ی لازم بین دو ردیف تا در ساعت‌های تعیین‌کننده
 * (ظهرِ انقلاب زمستانی) روی ردیفِ عقبی سایه نیفتد.
 */
export function minimumRowPitchM(options: {
  /** طول ماژول در راستای شیب (متر) */
  moduleLengthM: number;
  tiltDeg: number;
  latDeg: number;
}): number {
  const { moduleLengthM, tiltDeg, latDeg } = options;
  const decl = -23.45; // انقلاب زمستانی
  const noonAltitude = 90 - zenithDeg(latDeg, decl, 0);
  // ارتفاع خورشید در ساعت ۹ صبحِ انقلاب زمستانی (مبنای متداولِ طراحی ردیف)
  const morning = sunPosition(latDeg, 355, 9);
  const designAltitude = Math.max(8, Math.min(noonAltitude, morning.altitudeDeg));
  const shadowLength =
    (moduleLengthM * Math.sin((tiltDeg * Math.PI) / 180)) / Math.tan((designAltitude * Math.PI) / 180);
  return moduleLengthM * Math.cos((tiltDeg * Math.PI) / 180) + shadowLength;
}

/**
 * ارتفاعِ مؤثرِ مانع برای ردیفِ جلویی (سایه‌ی ردیف روی ردیف عقب).
 * فقط زمانی صدا زده می‌شود که دست‌کم دو ردیف چیده شده باشد.
 */
export function interRowObstacle(options: {
  /** فاصله‌ی بین مراکز ردیف‌ها (متر) */
  pitchM: number;
  moduleLengthM: number;
  tiltDeg: number;
}): ObstacleBox {
  const height = options.moduleLengthM * Math.sin((options.tiltDeg * Math.PI) / 180);
  return {
    x: 0,
    y: -options.pitchM, // ردیف جلو در راستای منفیِ محور y فرض می‌شود
    widthM: 200, // دیواری سراسری در عرض سقف
    depthM: 0.05,
    heightM: height,
    label: "ردیف جلویی",
  };
}
