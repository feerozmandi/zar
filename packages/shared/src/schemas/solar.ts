import { z } from "zod";

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
