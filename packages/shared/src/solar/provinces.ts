/**
 * استان‌های ایران — تک‌منبع حقیقتِ نام/کد/موقعیت در کل پلتفرم.
 *
 * - `code` همان کلید canonical است که در API، پایگاه‌داده و نقشه استفاده می‌شود.
 * - `aliases` برای سازگاری با کلیدهای قدیمی (مثل `sistan` یا `north-khorasan`) است و
 *   توسط `resolveProvinceCode` پذیرفته می‌شود.
 * - `peakSunHours` میانگین سالانه‌ی «ساعت آفتابی معادل» (kWh/m²/day روی سطح افقی) برای
 *   مرکز استان است؛ برآورد بر پایه‌ی اطلس تابش ایران و Global Solar Atlas است و
 *   **باید** با داده‌ی اندازه‌گیری‌شده (جدول `ClimateStation`) جایگزین شود —
 *   منطق محاسبات هیچ‌گاه این اعداد را hard-code نمی‌کند، بلکه از `climate.ts` می‌خواند.
 */

export interface ProvinceMeta {
  /** کلید canonical (لاتین) */
  code: string;
  /** نام فارسی استان */
  nameFa: string;
  /** نام لاتین مرسوم */
  nameEn: string;
  /** مرکز استان */
  capitalFa: string;
  /** عرض جغرافیایی مرکز استان (درجه) */
  lat: number;
  /** طول جغرافیایی مرکز استان (درجه) */
  lon: number;
  /** ارتفاع از سطح دریا (متر) */
  elevationM: number;
  /** میانگین سالانه‌ی دمای هوا (°C) */
  annualTempC: number;
  /** تابش سالانه‌ی معادل (kWh/m²·day روی سطح افقی) */
  peakSunHours: number;
  /** کلیدهای قدیمی/جایگزین که باید به این استان نگاشت شوند */
  aliases?: readonly string[];
}

export const PROVINCES = [
  {
    code: "tehran",
    nameFa: "تهران",
    nameEn: "Tehran",
    capitalFa: "تهران",
    lat: 35.7,
    lon: 51.42,
    elevationM: 1200,
    annualTempC: 17.2,
    peakSunHours: 5.2,
    aliases: ["تهران"],
  },
  {
    code: "alborz",
    nameFa: "البرز",
    nameEn: "Alborz",
    capitalFa: "کرج",
    lat: 35.84,
    lon: 50.94,
    elevationM: 1312,
    annualTempC: 16.1,
    peakSunHours: 5.1,
  },
  {
    code: "esfahan",
    nameFa: "اصفهان",
    nameEn: "Esfahan",
    capitalFa: "اصفهان",
    lat: 32.65,
    lon: 51.67,
    elevationM: 1570,
    annualTempC: 16.6,
    peakSunHours: 5.7,
    aliases: ["isfahan"],
  },
  {
    code: "fars",
    nameFa: "فارس",
    nameEn: "Fars",
    capitalFa: "شیراز",
    lat: 29.61,
    lon: 52.53,
    elevationM: 1486,
    annualTempC: 18.0,
    peakSunHours: 5.9,
  },
  {
    code: "kerman",
    nameFa: "کرمان",
    nameEn: "Kerman",
    capitalFa: "کرمان",
    lat: 30.28,
    lon: 57.08,
    elevationM: 1755,
    annualTempC: 16.0,
    peakSunHours: 6.0,
  },
  {
    code: "khorasan-razavi",
    nameFa: "خراسان رضوی",
    nameEn: "Razavi Khorasan",
    capitalFa: "مشهد",
    lat: 36.3,
    lon: 59.6,
    elevationM: 985,
    annualTempC: 14.8,
    peakSunHours: 5.4,
  },
  {
    code: "khorasan-shomali",
    nameFa: "خراسان شمالی",
    nameEn: "North Khorasan",
    capitalFa: "بجنورد",
    lat: 37.47,
    lon: 57.33,
    elevationM: 1070,
    annualTempC: 13.6,
    peakSunHours: 5.2,
    aliases: ["north-khorasan"],
  },
  {
    code: "khorasan-jonubi",
    nameFa: "خراسان جنوبی",
    nameEn: "South Khorasan",
    capitalFa: "بیرجند",
    lat: 32.87,
    lon: 59.22,
    elevationM: 1491,
    annualTempC: 16.2,
    peakSunHours: 6.1,
    aliases: ["south-khorasan"],
  },
  {
    code: "khuzestan",
    nameFa: "خوزستان",
    nameEn: "Khuzestan",
    capitalFa: "اهواز",
    lat: 31.32,
    lon: 48.67,
    elevationM: 18,
    annualTempC: 26.2,
    peakSunHours: 5.7,
  },
  {
    code: "sistan-va-baluchestan",
    nameFa: "سیستان و بلوچستان",
    nameEn: "Sistan and Baluchestan",
    capitalFa: "زاهدان",
    lat: 29.5,
    lon: 60.86,
    elevationM: 1370,
    annualTempC: 19.0,
    peakSunHours: 6.3,
    aliases: ["sistan", "sistan-baluchestan"],
  },
  {
    code: "hormozgan",
    nameFa: "هرمزگان",
    nameEn: "Hormozgan",
    capitalFa: "بندرعباس",
    lat: 27.18,
    lon: 56.28,
    elevationM: 10,
    annualTempC: 27.0,
    peakSunHours: 5.9,
  },
  {
    code: "bushehr",
    nameFa: "بوشهر",
    nameEn: "Bushehr",
    capitalFa: "بوشهر",
    lat: 28.92,
    lon: 50.84,
    elevationM: 8,
    annualTempC: 25.1,
    peakSunHours: 5.7,
  },
  {
    code: "yazd",
    nameFa: "یزد",
    nameEn: "Yazd",
    capitalFa: "یزد",
    lat: 31.9,
    lon: 54.37,
    elevationM: 1230,
    annualTempC: 19.2,
    peakSunHours: 6.1,
  },
  {
    code: "semnan",
    nameFa: "سمنان",
    nameEn: "Semnan",
    capitalFa: "سمنان",
    lat: 35.57,
    lon: 53.39,
    elevationM: 1130,
    annualTempC: 18.0,
    peakSunHours: 5.6,
  },
  {
    code: "qom",
    nameFa: "قم",
    nameEn: "Qom",
    capitalFa: "قم",
    lat: 34.64,
    lon: 50.88,
    elevationM: 930,
    annualTempC: 18.4,
    peakSunHours: 5.8,
  },
  {
    code: "markazi",
    nameFa: "مرکزی",
    nameEn: "Markazi",
    capitalFa: "اراک",
    lat: 34.09,
    lon: 49.69,
    elevationM: 1708,
    annualTempC: 14.2,
    peakSunHours: 5.5,
  },
  {
    code: "qazvin",
    nameFa: "قزوین",
    nameEn: "Qazvin",
    capitalFa: "قزوین",
    lat: 36.27,
    lon: 50.0,
    elevationM: 1297,
    annualTempC: 14.3,
    peakSunHours: 5.2,
  },
  {
    code: "zanjan",
    nameFa: "زنجان",
    nameEn: "Zanjan",
    capitalFa: "زنجان",
    lat: 36.68,
    lon: 48.49,
    elevationM: 1663,
    annualTempC: 11.8,
    peakSunHours: 5.1,
  },
  {
    code: "hamadan",
    nameFa: "همدان",
    nameEn: "Hamadan",
    capitalFa: "همدان",
    lat: 34.8,
    lon: 48.52,
    elevationM: 1850,
    annualTempC: 11.9,
    peakSunHours: 5.2,
  },
  {
    code: "kordestan",
    nameFa: "کردستان",
    nameEn: "Kordestan",
    capitalFa: "سنندج",
    lat: 35.31,
    lon: 46.99,
    elevationM: 1450,
    annualTempC: 13.8,
    peakSunHours: 5.1,
  },
  {
    code: "kermanshah",
    nameFa: "کرمانشاه",
    nameEn: "Kermanshah",
    capitalFa: "کرمانشاه",
    lat: 34.31,
    lon: 47.07,
    elevationM: 1351,
    annualTempC: 15.0,
    peakSunHours: 5.2,
  },
  {
    code: "ilam",
    nameFa: "ایلام",
    nameEn: "Ilam",
    capitalFa: "ایلام",
    lat: 33.64,
    lon: 46.42,
    elevationM: 1427,
    annualTempC: 17.4,
    peakSunHours: 5.3,
  },
  {
    code: "lorestan",
    nameFa: "لرستان",
    nameEn: "Lorestan",
    capitalFa: "خرم‌آباد",
    lat: 33.49,
    lon: 48.36,
    elevationM: 1147,
    annualTempC: 17.1,
    peakSunHours: 5.3,
  },
  {
    code: "chaharmahal-va-bakhtiari",
    nameFa: "چهارمحال و بختیاری",
    nameEn: "Chahar Mahall and Bakhtiari",
    capitalFa: "شهرکرد",
    lat: 32.33,
    lon: 50.86,
    elevationM: 2050,
    annualTempC: 12.0,
    peakSunHours: 5.6,
    aliases: ["chaharmahal"],
  },
  {
    code: "kohgiluyeh-va-boyerahmad",
    nameFa: "کهگیلویه و بویراحمد",
    nameEn: "Kohgiluyeh and Boyer Ahmad",
    capitalFa: "یاسوج",
    lat: 30.67,
    lon: 51.59,
    elevationM: 1870,
    annualTempC: 15.2,
    peakSunHours: 5.5,
    aliases: ["kohgiluyeh", "buinahr"],
  },
  {
    code: "gilan",
    nameFa: "گیلان",
    nameEn: "Gilan",
    capitalFa: "رشت",
    lat: 37.28,
    lon: 49.58,
    elevationM: -7,
    annualTempC: 16.3,
    peakSunHours: 4.4,
  },
  {
    code: "mazandaran",
    nameFa: "مازندران",
    nameEn: "Mazandaran",
    capitalFa: "ساری",
    lat: 36.56,
    lon: 53.06,
    elevationM: 5,
    annualTempC: 17.0,
    peakSunHours: 4.5,
  },
  {
    code: "golestan",
    nameFa: "گلستان",
    nameEn: "Golestan",
    capitalFa: "گرگان",
    lat: 36.84,
    lon: 54.44,
    elevationM: 50,
    annualTempC: 17.8,
    peakSunHours: 4.6,
  },
  {
    code: "ardabil",
    nameFa: "اردبیل",
    nameEn: "Ardebil",
    capitalFa: "اردبیل",
    lat: 38.25,
    lon: 48.29,
    elevationM: 1351,
    annualTempC: 9.6,
    peakSunHours: 4.8,
  },
  {
    code: "azarbayjan-sharqi",
    nameFa: "آذربایجان شرقی",
    nameEn: "East Azarbaijan",
    capitalFa: "تبریز",
    lat: 38.08,
    lon: 46.29,
    elevationM: 1361,
    annualTempC: 12.8,
    peakSunHours: 5.0,
  },
  {
    code: "azarbayjan-gharbi",
    nameFa: "آذربایجان غربی",
    nameEn: "West Azarbaijan",
    capitalFa: "ارومیه",
    lat: 37.55,
    lon: 45.07,
    elevationM: 1332,
    annualTempC: 13.0,
    peakSunHours: 5.0,
  },
] as const satisfies readonly ProvinceMeta[];

export type ProvinceCode = (typeof PROVINCES)[number]["code"];

/** فهرست کدهای معتبر — منبع enum در اسکیمای zod و معتبرسازی سمت سرور */
export const PROVINCE_CODES = PROVINCES.map((p) => p.code) as unknown as [ProvinceCode, ...ProvinceCode[]];

/** نگاشتِ کلیدهای قدیمی و نام‌های فارسی به کد canonical */
const ALIAS_INDEX: ReadonlyMap<string, ProvinceCode> = new Map(
  PROVINCES.flatMap((province) => {
    // `aliases` فقط برای برخی استان‌ها تعریف شده؛ با نگاهِ ایمن خوانده می‌شود
    const aliases = (province as { aliases?: readonly string[] }).aliases ?? [];
    const entries: Array<[string, ProvinceCode]> = [
      [province.code, province.code],
      [province.nameEn.toLowerCase(), province.code],
      [province.nameFa, province.code],
    ];
    for (const alias of aliases) entries.push([alias, province.code]);
    return entries;
  }),
);

export function provinceMeta(code: string): ProvinceMeta | undefined {
  return PROVINCES.find((province) => province.code === code);
}

/** تبدیل هر ورودی (کد، نام فارسی، نام لاتین یا alias) به کد canonical */
export function resolveProvinceCode(input: string): ProvinceCode | undefined {
  const key = input.trim().toLowerCase();
  return ALIAS_INDEX.get(key) ?? ALIAS_INDEX.get(key.replace(/[\s_]+/gu, "-"));
}

/** برچسب فارسیِ نمایشی برای یک کد (خروجی ایمن برای UI) */
export function provinceLabel(code: string): string {
  return provinceMeta(code)?.nameFa ?? code;
}
