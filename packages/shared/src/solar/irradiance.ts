/**
 * تابش روزانه‌ی معادل (Peak Sun Hours) بر اساس داده‌ی اقلیمی ایستگاه‌های هواشناسی.
 * اعداد میانگین سالانه‌ی «نقشه‌ی پتانسیل خورشیدی ایران» هستند و در فاز ۳ از جدول
 * دیتابیس (TariffRate مشابه) قابل به‌روزرسانی‌اند — کد نباید amount را hard-code کند.
 */
export const PROVINCE_PEAK_SUN_HOURS: Record<string, number> = {
  tehran: 5.4,
  alborz: 5.3,
  isfahan: 5.9,
  yazd: 6.2,
  kerman: 6.0,
  khuzestan: 5.8,
  "khorasan-razavi": 5.5,
  "azarbayjan-sharqi": 4.9,
  "azarbayjan-gharbi": 5.0,
  fars: 5.7,
  kermanshah: 5.1,
  gilan: 4.3,
  mazarandaran: 4.4,
  qom: 5.9,
  qazvin: 5.2,
  zanjan: 5.0,
  ardabil: 4.8,
  kordestan: 4.9,
  hamadan: 5.0,
  lorestan: 5.2,
  kohgiluyeh: 5.4,
  buinahr: 4.7,
  chaharmahal: 5.2,
  "south-khorasan": 6.1,
  "north-khorasan": 5.2,
  sistan: 6.4,
  "khorasan-jonubi": 6.0,
  hormozgan: 5.9,
  bushehr: 5.6,
  ilam: 5.2,
  semnan: 5.9,
};

/** سطح لازم برای هر کیلووات نصبی (متر مربع) — پنل‌های ۵۵۰ واتی موجود در بازار */
export const AREA_PER_KWP_M2 = 6.5;

export function peakSunHoursFor(province: string): number {
  return PROVINCE_PEAK_SUN_HOURS[province] ?? 5.2;
}

export function capacityFromRoof(roofAreaM2: number, shadingFactor = 0.08): number {
  const usable = roofAreaM2 * (1 - Math.min(Math.max(shadingFactor, 0), 0.9));
  return Math.round((usable / AREA_PER_KWP_M2) * 10) / 10;
}
