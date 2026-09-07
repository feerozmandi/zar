/**
 * قراردادهای ورودیِ ماژول امکان‌سنجی خورشیدی.
 *
 * این اسکیماها تنها مرزِ اعتبارسنجی بین کاربر و موتور محاسباتی هستند؛
 * خودِ فرمول‌ها در `src/solar/*` زندگی می‌کنند تا وب و API یک منطق داشته باشند.
 *
 * نکته‌ی تقویمی: تمام آرایه‌های ماهانه با ماه‌های **شمسی** و از فروردین شروع می‌شوند.
 */
import { z } from "zod";
import { PROVINCE_CODES, resolveProvinceCode } from "../solar/provinces.js";

export const provinceCodes = [
  "tehran",
  "alborz",
  "isfahan",
  "yazd",
  "kerman",
  "khuzestan",
  "khorasan-razavi",
  "azarbayjan-sharqi",
  "azarbayjan-gharbi",
  "fars",
  "kermanshah",
  "gilan",
  "mazarandaran",
  "qom",
  "qazvin",
  "zanjan",
  "ardabil",
  "kordestan",
  "hamadan",
  "lorestan",
  "kohgiluyeh",
  "buinahr",
  "chaharmahal",
  "south-khorasan",
  "north-khorasan",
  "sistan",
  "khorasan-jonubi",
  "hormozgan",
  "bushehr",
  "ilam",
  "semnan",
] as const;

export const solarAssessSchema = z.object({
  province: z.enum(provinceCodes),
  lat: z.number().min(20).max(45).optional(),
  lon: z.number().min(40).max(70).optional(),
  roofAreaM2: z.number().positive().max(2_000_000),
  roofTiltDeg: z.number().min(0).max(60).default(30),
  azimuthDeg: z.number().min(0).max(360).default(180),
  shadingFactor: z.number().min(0).max(1).default(0.08),
  monthlyConsumptionKwh: z.number().min(0).optional(),
  currentMonthlyBillToman: z.number().min(0).optional(),
});

export const solarRoiSchema = z.object({
  capacityKwp: z.number().positive(),
  peakSunHours: z.number().positive().max(10),
  capexPerKwp: z.number().positive(),
  feedInTariff: z.number().nonnegative(),
  offsetTariff: z.number().nonnegative(),
  selfConsumptionShare: z.number().min(0).max(1).default(0.4),
  annualOpex: z.number().nonnegative().default(0),
  years: z.number().int().min(1).max(30).default(20),
  discountRate: z.number().min(0).max(1).default(0.23),
});

export const epcRequestSchema = z.object({
  assessmentId: z.string().min(1),
  contactName: z.string().min(3),
  contactPhone: z.string().regex(/^0\d{9,11}$/),
  notes: z.string().max(2000).optional(),
  preferredSchedule: z.enum(["asap", "quarter", "half-year"]).default("quarter"),
});

export type SolarAssessInput = z.infer<typeof solarAssessSchema>;
export type SolarRoiInputDto = z.infer<typeof solarRoiSchema>;
export type EpcRequestInput = z.infer<typeof epcRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════
//  امکان‌سنجی دقیق (نسل ۲)
// ═══════════════════════════════════════════════════════════════════════════

/** کد یا نام استان را می‌پذیرد و به کدِ استاندارد تبدیل می‌کند */
export const provinceSchema = z.preprocess(
  (value) => (typeof value === "string" ? (resolveProvinceCode(value) ?? value) : value),
  z.enum(PROVINCE_CODES),
);

export const tariffKindSchema = z.enum([
  "residential",
  "commercial",
  "industrial",
  "agricultural",
  "governmental",
]);

export const loadProfileKindSchema = z.enum(["residential", "commercial", "industrial", "agricultural"]);

/** شناسه‌ی سناریوهای نظارتی (ماده ۱۶ خودتأمین، ماده ۱۲ خرید تضمینی، بورس سبز) */
export const policyScenarioIdSchema = z.enum([
  "self-supply",
  "guaranteed-purchase",
  "green-exchange",
  "hybrid",
]);

/** آرایه‌ی دقیقاً ۱۲ عضویِ ماهانه (از فروردین) */
export const monthlyArraySchema = z
  .array(z.number().min(0).max(100_000_000))
  .length(12, "آرایه باید دقیقاً ۱۲ ماه (فروردین تا اسفند) داشته باشد");

export const point2Schema = z.tuple([z.number(), z.number()]);

export const obstacleSchema = z.object({
  x: z.number(),
  y: z.number(),
  widthM: z.number().positive().max(500),
  depthM: z.number().positive().max(500),
  heightM: z.number().min(0).max(500),
  label: z.string().max(120).optional(),
});

export const roofPlaneSchema = z.object({
  id: z.string().max(64).optional(),
  polygon: z.array(point2Schema).min(3).max(64),
  tiltDeg: z.number().min(0).max(60),
  azimuthDeg: z.number().min(0).max(360),
  obstacles: z.array(obstacleSchema).max(64).optional(),
  surroundings: z.array(obstacleSchema).max(64).optional(),
  setbackM: z.number().min(0).max(10).optional(),
  obstacleClearanceM: z.number().min(0).max(10).optional(),
});

export const solarFeasibilitySchema = z.object({
  site: z.object({
    name: z.string().max(160).optional(),
    province: provinceSchema,
    lat: z.number().min(15).max(45).optional(),
    lon: z.number().min(40).max(70).optional(),
    elevationM: z.number().min(-500).max(6_000).optional(),
    address: z.string().max(400).optional(),
  }),
  roof: z.object({
    areaM2: z.number().positive().max(2_000_000).optional(),
    planes: z.array(roofPlaneSchema).min(1).max(64).optional(),
    tiltDeg: z.number().min(0).max(60).optional(),
    azimuthDeg: z.number().min(0).max(360).optional(),
    setbackM: z.number().min(0).max(10).optional(),
    shadingFactor: z.number().min(0).max(1).optional(),
  }),
  consumption: z.object({
    monthlyKwh: monthlyArraySchema,
    tariffKind: tariffKindSchema,
    monthlyPeakDemandKw: monthlyArraySchema.optional(),
    profile: loadProfileKindSchema.optional(),
  }),
  design: z
    .object({
      moduleModel: z.string().max(80).optional(),
      orientation: z.enum(["portrait", "landscape"]).optional(),
      targetDcAcRatio: z.number().min(0.8).max(1.6).optional(),
      maxCapacityKwp: z.number().positive().max(20_000).optional(),
      phases: z.union([z.literal(1), z.literal(3)]).optional(),
    })
    .optional(),
  cost: z
    .object({
      capexPerKwpToman: z.number().min(1_000_000).max(200_000_000).optional(),
      annualOpexToman: z.number().min(0).max(100_000_000_000).optional(),
      inverterReplacementYear: z.number().int().min(1).max(30).optional(),
    })
    .optional(),
  financials: z
    .object({
      discountRate: z.number().min(0).max(1).optional(),
      years: z.number().int().min(1).max(40).optional(),
      tariffEscalation: z.number().min(0).max(1).optional(),
      exportPriceEscalation: z.number().min(0).max(1).optional(),
      opexEscalation: z.number().min(0).max(1).optional(),
    })
    .optional(),
  scenarios: z.array(policyScenarioIdSchema).min(1).max(4).optional(),
  resourceOverrides: z.object({ annualGhiKwhM2Day: z.number().min(0.5).max(9) }).optional(),
});

export type SolarFeasibilityInputDto = z.infer<typeof solarFeasibilitySchema>;

/** پیش‌نمایش چیدمان روی یک صفحه‌ی سقف (بدون محاسبه‌ی مالی) */
export const solarDesignSchema = z.object({
  province: provinceSchema,
  lat: z.number().min(15).max(45).optional(),
  lon: z.number().min(40).max(70).optional(),
  plane: roofPlaneSchema,
  moduleModel: z.string().max(80).optional(),
  orientation: z.enum(["portrait", "landscape"]).optional(),
  maxPanels: z.number().int().min(1).max(20_000).optional(),
});

export type SolarDesignInputDto = z.infer<typeof solarDesignSchema>;

/** مقایسه‌ی پیشنهادهای پیمانکاران (مناقصه معکوس — مدل EnergySage) */
export const epcBidSchema = z.object({
  id: z.string().max(64).optional(),
  partnerName: z.string().min(2).max(160),
  totalPriceToman: z.number().positive().max(1_000_000_000_000),
  capacityKwp: z.number().positive().max(20_000),
  moduleBrand: z.string().max(80).optional(),
  moduleTier: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  inverterBrand: z.string().max(80).optional(),
  productWarrantyYears: z.number().int().min(0).max(40).optional(),
  performanceWarrantyPercent: z.number().min(50).max(100).optional(),
  rating: z.number().min(0).max(5).optional(),
  leadTimeDays: z.number().int().min(1).max(720).optional(),
  oAndMYears: z.number().int().min(0).max(30).optional(),
  notes: z.string().max(2_000).optional(),
});

export const epcBidCompareSchema = z.object({
  bids: z.array(epcBidSchema).min(1).max(50),
  weights: z
    .object({
      price: z.number().min(0).max(1),
      equipment: z.number().min(0).max(1),
      warranty: z.number().min(0).max(1),
      rating: z.number().min(0).max(1),
      schedule: z.number().min(0).max(1),
    })
    .partial()
    .optional(),
});

export type EpcBidInputDto = z.infer<typeof epcBidSchema>;
export type EpcBidCompareInputDto = z.infer<typeof epcBidCompareSchema>;

/** پرس‌وجوی منبع تابش (برای نمایشِ نقشه و پیش‌نمایشِ سریع) */
export const solarResourceQuerySchema = z.object({
  province: provinceSchema.optional(),
  lat: z.number().min(15).max(45).optional(),
  lon: z.number().min(40).max(70).optional(),
  elevationM: z.number().min(-500).max(6_000).optional(),
  albedo: z.number().min(0).max(1).optional(),
});

export type SolarResourceQueryDto = z.infer<typeof solarResourceQuerySchema>;

/** نسخه‌ی query-string (مقادیر رشته‌ای) برای مسیرهای GET */
export const solarResourceQueryParamsSchema = z.object({
  province: z.string().max(80).optional(),
  lat: z.coerce.number().min(15).max(45).optional(),
  lon: z.coerce.number().min(40).max(70).optional(),
  elevationM: z.coerce.number().min(-500).max(6_000).optional(),
});

export type SolarResourceQueryParamsDto = z.infer<typeof solarResourceQueryParamsSchema>;
