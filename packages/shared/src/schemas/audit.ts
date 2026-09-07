import { z } from "zod";

export const billUploadSchema = z.object({
  /** شماره‌ی اشتراک برق (۱۰ رقم) */
  subscriptionId: z
    .string()
    .regex(/^\d{6,12}$/)
    .optional(),
  /** دوره‌ی صدور قبض به قالب jy/mm/dd */
  issueDate: z.string().optional(),
  fileName: z.string().min(1),
  mimeType: z.enum(["application/pdf", "image/png", "image/jpeg", "image/webp"]),
  sizeBytes: z.number().int().positive(),
});

export const billMetricsSchema = z.object({
  energyKwh: z.number().min(0),
  peakKwh: z.number().min(0).default(0),
  offPeakKwh: z.number().min(0).default(0),
  partialPeakKwh: z.number().min(0).default(0),
  demandKw: z.number().min(0).default(0),
  contractedCapacityKw: z.number().min(0).default(0),
  powerFactor: z.number().min(0).max(1).default(0.9),
  reactiveKvarh: z.number().min(0).default(0),
  tariffType: z
    .enum(["industrial", "commercial", "agricultural", "residential", "governmental"])
    .default("industrial"),
});

export const auditAnalyzeSchema = z.object({
  billId: z.string().min(1),
  /** درخواست تحلیل تکمیلی با هوش مصنوعی */
  withAi: z.boolean().default(true),
  model: z.string().optional(),
});

export type BillUploadInput = z.infer<typeof billUploadSchema>;
export type BillMetrics = z.infer<typeof billMetricsSchema>;
